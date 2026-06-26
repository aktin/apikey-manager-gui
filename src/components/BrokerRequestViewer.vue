<script setup lang="ts">
/**
 * BrokerRequestViewer.vue
 *
 * Shows a selected broker request's query metadata, execution schedule, and
 * per-node status, with an on-demand node status-message dialog. The request is
 * chosen by the `requestId` prop; nothing is fetched while it is null.
 */
import { computed, onMounted, Ref, ref, watch } from "vue";
import BrokerConnection from "../services/BrokerConnection";
import InputText from "primevue/inputtext";
import { useToast } from "primevue/usetoast";
import { useI18n } from "vue-i18n";
import Button from "primevue/button";
import {
  parseXmlBrokerRequest,
  parseXmlBrokerRequestInfo,
  parseXmlBrokerRequestStatus
} from "../utils/Parser";
import {
  BrokerRequest,
  NodeStatusInfo,
  RequestInfo
} from "../types/BrokerRequest";
import { createErrorToast, createSuccessToast } from "../utils/ToastWrapper";
import { notifyStatusError, resolveStatusError } from "../utils/StatusToast";
import {
  formatDateToLocale,
  formatDurationToHumanReadable
} from "../utils/MomentWrapper";
import {
  NODE_STATE_ORDER,
  NodeState,
  getMostActualState,
  nodeStateColorClass
} from "../utils/NodeStatus";
import SimpleChipList from "./SimpleChipList.vue";
import NodeStatusInfoTimeline from "./NodeStatusInfoTimeline.vue";
import Dialog from "primevue/dialog";
import ProgressSpinner from "primevue/progressspinner";
import Tag from "primevue/tag";
import Badge from "primevue/badge";
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";

const { t } = useI18n();
const toast = useToast();

const props = defineProps<{ requestId: number | null }>();

const request: Ref<BrokerRequest | null> = ref(null);
const requestInfo: Ref<RequestInfo | null> = ref(null);
const requestStatus: Ref<NodeStatusInfo[] | null> = ref(null);

const statusDialogVisible = ref(false);
const statusDialogTitle = ref("");
const statusDialogText = ref("");
const statusLoading = ref(false);

type execView =
  | { kind: "single"; label: string; duration: string }
  | {
      kind: "repeated";
      label: string;
      id: number;
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

// Filters nodes by the displayed label (#id + CN), case-insensitive.
const filteredStatus = computed(() => {
  const all = requestStatus.value ?? [];
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
      <h2 class="m-0 text-2xl font-bold line-height-2">
        {{ request.query.title }}
      </h2>
      <div class="flex align-items-center flex-wrap gap-2 my-3">
        <Tag
          :value="
            exec.kind === 'repeated' ? `${exec.label} ${exec.id}` : exec.label
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
      <div class="flex flex-column md:flex-row gap-3">
        <div class="p-3 flex-1 metadata-panel">
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
        <div class="p-3 flex-1 metadata-panel">
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
      </div>
    </div>

    <div
      v-if="requestStatus && requestStatus.length"
      class="flex align-items-center justify-content-between flex-wrap gap-2 mt-4 mb-2 px-2"
    >
      <div class="flex align-items-center flex-wrap gap-3">
        <span class="text-lg font-bold">{{ t("nodeStatus") }}</span>
        <Badge :value="requestStatus.length" severity="secondary" />
        <span
          v-for="item in stateSummary"
          :key="item.state"
          class="flex align-items-center gap-1"
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
  background: var(--p-surface-100);
  border-radius: var(--p-content-border-radius);
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}
</style>
