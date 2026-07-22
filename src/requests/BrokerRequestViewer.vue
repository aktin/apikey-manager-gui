<script setup lang="ts">
/**
 * BrokerRequestViewer.vue
 *
 * Shows a selected broker request's query metadata (title, description, query),
 * execution schedule, and per-node status, with an on-demand node
 * status-message dialog. The request is chosen by the `requestId` prop;
 * nothing is fetched while it is null.
 */
import { computed, onMounted, Ref, ref, watch } from "vue";
import BrokerConnection from "../broker/BrokerConnection";
import InputText from "primevue/inputtext";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { useI18n } from "vue-i18n";
import Button from "primevue/button";
import {
  parseXmlBrokerRequest,
  parseXmlBrokerRequestInfo,
  parseXmlBrokerRequestStatus
} from "../broker/Parser";
import { BrokerRequest, NodeStatusInfo, RequestInfo } from "./BrokerRequest";
import { createErrorToast, createSuccessToast } from "../shared/ToastWrapper";
import { notifyStatusError, resolveStatusError } from "../shared/StatusToast";
import {
  formatDateToLocale,
  formatDurationToHumanReadable
} from "../shared/MomentWrapper";
import {
  NODE_STATE_ORDER,
  NodeState,
  getMostActualState,
  nodeStateColorClass
} from "./NodeStatus";
import SimpleChipList from "../shared/SimpleChipList.vue";
import NodeStatusInfoTimeline from "./NodeStatusInfoTimeline.vue";
import ConfirmPopup from "primevue/confirmpopup";
import Dialog from "primevue/dialog";
import Panel from "primevue/panel";
import ProgressSpinner from "primevue/progressspinner";
import Tag from "primevue/tag";
import Badge from "primevue/badge";
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";

const { t } = useI18n();
const toast = useToast();
const confirm = useConfirm();

const props = defineProps<{ requestId: number | null }>();
const emit = defineEmits<{ (e: "deleted", id: number): void }>();

const request: Ref<BrokerRequest | null> = ref(null);
const requestInfo: Ref<RequestInfo | null> = ref(null);
const requestStatus: Ref<NodeStatusInfo[] | null> = ref(null);

const statusDialogVisible = ref(false);
const statusDialogTitle = ref("");
const statusDialogText = ref("");
const statusLoading = ref(false);

const descriptionCollapsed = ref(true);
const queryCollapsed = ref(true);

type execView =
  | { kind: "single"; label: string; duration: string }
  | {
      kind: "repeated";
      label: string;
      id: number | null;
      duration: string;
      interval: string;
      intervalHours: number | null;
    };

const exec = computed<execView | null>(() => {
  const q = request.value?.query;
  if (!q) return null;
  if (q.singleExecution) {
    return {
      kind: "single",
      label: t("singleRequest"),
      duration: formatDurationToHumanReadable(q.singleExecution.duration)
    };
  }
  if (q.repeatedExecution) {
    return {
      kind: "repeated",
      label: t("seriesRequest"),
      id: q.repeatedExecution.id,
      duration: formatDurationToHumanReadable(q.repeatedExecution.duration),
      interval: formatDurationToHumanReadable(q.repeatedExecution.interval),
      intervalHours: q.repeatedExecution.intervalHours
    };
  }
  return null;
});

const nodeSearch = ref("");

const stateFilter: Ref<NodeState | null> = ref(null);

/** Toggles showing only nodes whose most-actual state matches `state`. */
function toggleStateFilter(state: NodeState): void {
  stateFilter.value = stateFilter.value === state ? null : state;
}

// Filters nodes by the active summary-state chip and by the displayed
// label (#id + CN), case-insensitive.
const filteredStatus = computed(() => {
  let all = requestStatus.value ?? [];
  if (stateFilter.value) {
    all = all.filter((n) => getMostActualState(n) === stateFilter.value);
  }
  const q = nodeSearch.value.trim().toLowerCase();
  if (!q) return all;
  return all.filter((n) =>
    `${n.nodeId} ${nodeLabel(n.nodeId)}`.toLowerCase().includes(q)
  );
});

const columns = computed(() => {
  const all = filteredStatus.value;
  const half = Math.ceil(all.length / 2);
  return { left: all.slice(0, half), right: all.slice(half) };
});

type StateCount = { state: NodeState; label: string; count: number };

// Node counts per most-actual state, terminal states first, only states present.
const stateSummary = computed<StateCount[]>(() => {
  const counts = new Map<NodeState, number>();
  for (const node of requestStatus.value ?? []) {
    const state = getMostActualState(node);
    if (state) counts.set(state, (counts.get(state) ?? 0) + 1);
  }
  return [...NODE_STATE_ORDER]
    .reverse()
    .filter((state) => counts.has(state))
    .map((state) => ({ state, label: t(state), count: counts.get(state)! }));
});

function hasAnyTimestamp(node: NodeStatusInfo): boolean {
  return Object.entries(node)
    .filter(([k]) => k !== "nodeId")
    .some(([, v]) => v != null);
}

function nodeLabel(idNum: number): string {
  return BrokerConnection.getCachedNodeCN(idNum) ?? `#${idNum}`;
}

/** Loads detail, info, and status for the current request id (in parallel). */
async function loadRequest() {
  request.value = null;
  requestInfo.value = null;
  requestStatus.value = null;
  nodeSearch.value = "";
  stateFilter.value = null;
  descriptionCollapsed.value = true;
  queryCollapsed.value = true;
  if (props.requestId == null) return;
  await Promise.all([fetchRequest(), fetchRequestInfo(), fetchRequestStatus()]);
}

/**
 * Fetches a request resource for the selected id, parses a 200 response into
 * `target`, and shows a status error toast otherwise.
 *
 * @param notFoundKey - i18n message key for the resource-specific 404 case
 * @returns whether the resource was fetched and parsed successfully
 */
async function fetchAndParse<T>(
  fetcher: () => Promise<{ status: number; data: string }>,
  parser: (data: string) => T,
  target: Ref<T | null>,
  notFoundKey: string
): Promise<boolean> {
  const resp = await fetcher();
  if (resp.status === 200) {
    target.value = parser(resp.data);
    return true;
  }
  notifyStatusError(toast, t, resp.status, {
    404: { title: "notFound", message: notFoundKey }
  });
  return false;
}

const requestIdStr = () => String(props.requestId);

const fetchRequest = () =>
  fetchAndParse(
    () => BrokerConnection.getBrokerRequest(requestIdStr()),
    parseXmlBrokerRequest,
    request,
    "requestNotFound"
  );

const fetchRequestInfo = () =>
  fetchAndParse(
    () => BrokerConnection.getBrokerRequestInfo(requestIdStr()),
    parseXmlBrokerRequestInfo,
    requestInfo,
    "requestInfoNotFound"
  );

const fetchRequestStatus = () =>
  fetchAndParse(
    () => BrokerConnection.getBrokerRequestStatus(requestIdStr()),
    parseXmlBrokerRequestStatus,
    requestStatus,
    "requestStatusNotFound"
  );

async function openNodeStatus(nodeIdNum: number) {
  if (props.requestId == null) return;
  statusDialogVisible.value = true;
  statusDialogTitle.value = nodeLabel(nodeIdNum);
  statusDialogText.value = "";
  statusLoading.value = true;
  try {
    const resp = await BrokerConnection.getBrokerRequestNodeStatus(
      requestIdStr(),
      String(nodeIdNum)
    );
    statusDialogText.value =
      resp.status === 200
        ? String(resp.data)
        : resolveStatusError(t, resp.status, {
            404: { title: "notFound", message: "nodeStatusNotFound" }
          }).detail;
  } catch {
    statusDialogText.value = t("serverErrorOccurred");
  } finally {
    statusLoading.value = false;
  }
}

/** Copies the open node status message to the clipboard. */
async function copyStatusToClipboard(): Promise<void> {
  if (!statusDialogText.value) return;
  try {
    await navigator.clipboard.writeText(statusDialogText.value);
    createSuccessToast(toast, t("success"), t("statusCopied"));
  } catch {
    createErrorToast(toast, t("error"), t("failedToCopy"));
  }
}

const deleting = ref(false);

/** Anchors the delete confirmation popup to the clicked delete button. */
function confirmDelete(event: Event): void {
  const target = event.currentTarget as HTMLElement | null;
  if (!target) return;
  confirm.require({
    group: "requestDelete",
    target,
    message: t("confirmRequestDelete"),
    icon: "pi pi-exclamation-triangle",
    rejectClass: "p-button-secondary p-button-outlined p-button-sm",
    acceptClass: "p-button-danger p-button-sm",
    rejectLabel: t("cancel"),
    acceptLabel: t("delete"),
    accept: deleteRequest
  });
}

/** Deletes the shown request and notifies the parent on success. */
async function deleteRequest(): Promise<void> {
  const id = props.requestId;
  if (id == null) return;
  deleting.value = true;
  const status = await BrokerConnection.deleteBrokerRequest(String(id));
  deleting.value = false;
  if (status >= 200 && status < 300) {
    createSuccessToast(toast, t("success"), t("requestDeleted", { id }));
    emit("deleted", id);
    return;
  }
  notifyStatusError(toast, t, status, {
    404: { title: "notFound", message: "requestNotFound" }
  });
}

async function copyQueryToClipboard(): Promise<void> {
  const xml = request.value?.query.queryXml;
  if (!xml) return;
  try {
    await navigator.clipboard.writeText(xml);
    createSuccessToast(toast, t("success"), t("queryCopied"));
  } catch {
    createErrorToast(toast, t("error"), t("failedToCopy"));
  }
}

onMounted(async () => {
  await BrokerConnection.waitForBrokerCredentials();
  await BrokerConnection.refreshNodeCache();
  await loadRequest();
});

watch(() => props.requestId, loadRequest);
</script>

<template>
  <div
    v-if="props.requestId == null"
    class="text-color-secondary text-center p-5"
  >
    {{ t("selectRequestHint") }}
  </div>

  <template v-else>
    <div
      v-if="request && exec && requestInfo"
      class="surface-0 p-3 border-round"
    >
      <div class="flex align-items-start justify-content-between gap-2">
        <h2 class="m-0 text-2xl font-bold line-height-2">
          {{ request.query.title }}
        </h2>
        <Button
          icon="pi pi-trash"
          severity="danger"
          outlined
          :loading="deleting"
          v-tooltip.bottom="t('deleteRequest')"
          @click="confirmDelete"
          class="pr-3 pl-3"
        />
      </div>
      <div class="flex align-items-center flex-wrap gap-2 my-3">
        <Tag
          :value="
            exec.kind === 'repeated' && exec.id != null
              ? `${exec.label} ${exec.id}`
              : exec.label
          "
          :severity="exec.kind === 'repeated' ? 'warn' : 'info'"
        />
        <div
          v-if="request.query.principal.tags.length"
          class="border-left-1 surface-border"
          style="height: 1.5rem"
        />
        <SimpleChipList :chips="request.query.principal.tags" />
      </div>
      <div class="flex flex-wrap gap-3">
        <div class="p-3 metadata-panel">
          <div class="text-xs uppercase font-bold text-color-secondary mb-2">
            {{ t("scheduleSection") }}
          </div>
          <div class="flex justify-content-between py-1">
            <span class="text-color-secondary">{{ t("publishDate") }}</span>
            <span>{{ formatDateToLocale(requestInfo.publishDate) }}</span>
          </div>
          <div class="flex justify-content-between py-1">
            <span class="text-color-secondary">{{ t("scheduledDate") }}</span>
            <span>{{ formatDateToLocale(request.scheduledDate) }}</span>
          </div>
          <div class="flex justify-content-between py-1">
            <span class="text-color-secondary">{{ t("referenceDate") }}</span>
            <span>{{ formatDateToLocale(request.referenceDate) }}</span>
          </div>
        </div>
        <div class="p-3 metadata-panel">
          <div class="text-xs uppercase font-bold text-color-secondary mb-2">
            {{ t("requestSection") }}
          </div>
          <div class="flex justify-content-between py-1">
            <span class="text-color-secondary">{{ t("duration") }}</span>
            <span>{{ exec.duration }}</span>
          </div>
          <div
            v-if="exec.kind === 'repeated'"
            class="flex justify-content-between py-1"
          >
            <span class="text-color-secondary">{{ t("interval") }}</span>
            <span>{{ exec.interval }}</span>
          </div>
          <div
            v-if="exec.kind === 'repeated' && exec.intervalHours != null"
            class="flex justify-content-between py-1"
          >
            <span class="text-color-secondary">{{ t("intervalHours") }}</span>
            <span>{{ exec.intervalHours }}</span>
          </div>
          <div class="flex justify-content-between py-1">
            <span class="text-color-secondary">{{ t("targetedRequest") }}</span>
            <span>{{ requestInfo.targeted ? t("yes") : t("no") }}</span>
          </div>
        </div>
        <div class="p-3 metadata-panel">
          <div class="text-xs uppercase font-bold text-color-secondary mb-2">
            {{ t("principal") }}
          </div>
          <div class="flex justify-content-between py-1">
            <span class="text-color-secondary">{{ t("name") }}</span>
            <span>{{ request.query.principal.name ?? "—" }}</span>
          </div>
          <div class="flex justify-content-between py-1">
            <span class="text-color-secondary">{{ t("o") }}</span>
            <span>{{ request.query.principal.organisation ?? "—" }}</span>
          </div>
          <div class="flex justify-content-between py-1">
            <span class="text-color-secondary">{{ t("email") }}</span>
            <span>{{ request.query.principal.email ?? "—" }}</span>
          </div>
          <div class="flex justify-content-between py-1">
            <span class="text-color-secondary">{{ t("phone") }}</span>
            <span>{{ request.query.principal.phone ?? "—" }}</span>
          </div>
        </div>
      </div>
      <Panel
        v-if="request.query.description"
        v-model:collapsed="descriptionCollapsed"
        toggleable
        class="mt-3"
      >
        <template #header>
          <span
            class="flex-1 cursor-pointer font-bold"
            @click="descriptionCollapsed = !descriptionCollapsed"
          >
            {{ t("descriptionSection") }}
          </span>
        </template>
        <p class="m-0 line-height-3" style="white-space: pre-wrap">
          {{ request.query.description }}
        </p>
      </Panel>
      <Panel
        v-if="request.query.queryXml"
        v-model:collapsed="queryCollapsed"
        toggleable
        class="mt-3"
      >
        <template #header>
          <span
            class="flex-1 cursor-pointer font-bold"
            @click="queryCollapsed = !queryCollapsed"
          >
            {{ t("querySection") }}
          </span>
        </template>
        <template #icons>
          <Button
            icon="pi pi-copy"
            text
            rounded
            size="small"
            v-tooltip.bottom="t('copyQuery')"
            @click="copyQueryToClipboard"
          />
        </template>
        <pre class="m-0 text-sm overflow-x-auto">{{
          request.query.queryXml
        }}</pre>
      </Panel>
    </div>

    <div
      v-if="requestStatus && requestStatus.length"
      class="flex align-items-center justify-content-between flex-wrap gap-2 mt-4 mb-2 px-2"
    >
      <div class="flex align-items-center flex-wrap gap-3">
        <span
          class="flex align-items-center gap-2 cursor-pointer"
          @click="stateFilter = null"
        >
          <span class="text-lg font-bold">{{ t("nodeStatus") }}</span>
          <Badge :value="requestStatus.length" severity="secondary" />
        </span>
        <span
          v-for="item in stateSummary"
          :key="item.state"
          class="state-chip flex align-items-center gap-1 cursor-pointer border-round px-2 py-1"
          :class="{ 'state-chip-active': stateFilter === item.state }"
          @click="toggleStateFilter(item.state)"
        >
          <span :class="nodeStateColorClass(item.state)">{{ item.label }}</span>
          <Badge :value="item.count" severity="secondary" />
        </span>
      </div>
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText
          v-model="nodeSearch"
          :placeholder="t('keywordSearch')"
          class="w-20rem"
        />
      </IconField>
    </div>

    <div
      v-if="columns.left.length || columns.right.length"
      class="grid mt-2 mx-6"
    >
      <div
        v-for="(column, colIndex) in [columns.left, columns.right]"
        :key="colIndex"
        class="col-12 md:col-6"
      >
        <div
          v-for="node in column"
          :key="node.nodeId"
          class="flex justify-content-between border-bottom-1 surface-border py-2"
        >
          <span class="font-bold flex align-items-center gap-2">
            <Button
              severity="secondary"
              icon="pi pi-file"
              size="small"
              text
              v-tooltip.bottom="t('openNodeStatusMessage')"
              @click="openNodeStatus(node.nodeId)"
            />
            <span>{{ [node.nodeId] }} {{ nodeLabel(node.nodeId) }}</span>
          </span>
          <template v-if="hasAnyTimestamp(node)">
            <NodeStatusInfoTimeline :node-status-info="node" />
          </template>
          <span v-else class="text-color-secondary text-sm">{{
            t("notRetrievedYet")
          }}</span>
        </div>
      </div>
    </div>
  </template>

  <!-- Grouped so it does not duplicate the ungrouped profile-delete popup -->
  <ConfirmPopup group="requestDelete" />

  <Dialog
    v-model:visible="statusDialogVisible"
    modal
    style="width: 60vw; max-width: 900px"
  >
    <template #header>
      <span class="flex align-items-center gap-2">
        <span class="font-bold">{{ statusDialogTitle }}</span>
        <Button
          v-if="statusDialogText"
          icon="pi pi-copy"
          text
          rounded
          size="small"
          v-tooltip.bottom="t('copyStatusMessage')"
          @click="copyStatusToClipboard"
        />
      </span>
    </template>

    <div v-if="statusLoading" class="flex justify-content-center p-4">
      <ProgressSpinner />
    </div>
    <pre v-else class="m-0" style="white-space: pre-wrap">{{
      statusDialogText
    }}</pre>
  </Dialog>
</template>

<style scoped>
/*
 * Render the metadata panels as elevated surfaces (PrimeVue's Card pattern):
 * a grey fill plus a soft shadow instead of a 1px border. A border combined
 * with border-radius renders "dog-ear" corner artifacts in Chromium (Electron);
 * a box-shadow follows the rounded corners cleanly, and the grey fill reads
 * clearly against the white (surface-0) container.
 */
.metadata-panel {
  flex: 1 1 16rem;
  min-width: 0;
  background: var(--p-surface-100);
  border-radius: var(--p-content-border-radius);
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

/* Summary chips double as node-list filters; highlight the active one. */
.state-chip:hover {
  background: var(--p-surface-100);
}
.state-chip-active {
  background: var(--p-surface-200);
}
</style>
