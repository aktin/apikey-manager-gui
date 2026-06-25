<script setup lang="ts">
/**
 * BrokerRequestViewer.vue
 *
 * Looks up a broker request by ID and shows its query metadata, execution
 * schedule, and per-node status, with an on-demand node status-message dialog.
 */
import { computed, onMounted, Ref, ref } from "vue";
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
import FloatLabel from "primevue/floatlabel";
import SimpleChipList from "./SimpleChipList.vue";
import NodeStatusInfoTimeline from "./NodeStatusInfoTimeline.vue";
import Dialog from "primevue/dialog";
import ProgressSpinner from "primevue/progressspinner";

const { t } = useI18n();
const toast = useToast();

const id = ref("");
const invalidId = ref(false);

const request: Ref<BrokerRequest | null> = ref(null);
const requestInfo: Ref<RequestInfo | null> = ref(null);
const requestStatus: Ref<NodeStatusInfo[] | null> = ref(null);

const statusDialogVisible = ref(false);
const statusDialogTitle = ref("");
const statusDialogText = ref("");
const statusLoading = ref(false);

const idPattern = /^[1-9]\d*$/;

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
      intervalHours: q.repeatedExecution.intervalHours ?? 0
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

function hasAnyTimestamp(node: NodeStatusInfo): boolean {
  return Object.entries(node)
    .filter(([k]) => k !== "nodeId")
    .some(([, v]) => v != null);
}

function nodeLabel(idNum: number): string {
  return BrokerConnection.getCachedNodeCN(idNum) ?? `#${idNum}`;
}

async function fetchAllRequestData() {
  invalidId.value = false;
  if (!idPattern.test(id.value)) {
    createErrorToast(toast, t("inputError"), t("invalidRequestIdError"));
    invalidId.value = true;
    return;
  }
  // Run in parallel. Each sub-fetch handles its own error toasts.
  const [okReq, okInfo, okStatus] = await Promise.all([
    fetchRequest(),
    fetchRequestInfo(),
    fetchRequestStatus()
  ]);
  if (okReq && okInfo && okStatus) {
    createSuccessToast(toast, t("success"), t("requestFound"));
  }
}

/**
 * Fetches a request resource by the current ID, parses a 200 response into
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

const fetchRequest = () =>
  fetchAndParse(
    () => BrokerConnection.getBrokerRequest(id.value),
    parseXmlBrokerRequest,
    request,
    "requestNotFound"
  );

const fetchRequestInfo = () =>
  fetchAndParse(
    () => BrokerConnection.getBrokerRequestInfo(id.value),
    parseXmlBrokerRequestInfo,
    requestInfo,
    "requestInfoNotFound"
  );

const fetchRequestStatus = () =>
  fetchAndParse(
    () => BrokerConnection.getBrokerRequestStatus(id.value),
    parseXmlBrokerRequestStatus,
    requestStatus,
    "requestStatusNotFound"
  );

async function openNodeStatus(nodeIdNum: number) {
  const reqId = id.value.trim();
  if (!reqId) return;
  statusDialogVisible.value = true;
  statusDialogTitle.value = nodeLabel(nodeIdNum);
  statusDialogText.value = "";
  statusLoading.value = true;
  try {
    const resp = await BrokerConnection.getBrokerRequestNodeStatus(
      reqId,
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
});
</script>

<template>
  <div
    class="flex flex-column align-items-center justify-content-center gap-3 p-3"
  >
    <div class="flex gap-2">
      <FloatLabel class="w-full">
        <InputText
          id="requestIdInput"
          v-model="id"
          :invalid="invalidId"
          @keydown.enter.prevent="fetchAllRequestData"
        />
        <label for="requestIdInput">{{ t("requestId") }}</label>
      </FloatLabel>
      <Button
        icon="pi pi-search"
        @click="fetchAllRequestData"
        v-tooltip.right="t('fetchRequest')"
      />
    </div>
  </div>

  <div
    v-if="request && exec && requestInfo"
    class="surface-100 p-3 border-round"
  >
    <h2 class="m-0 flex align-items-center gap-3 flex-wrap">
      <span class="flex-1 min-w-0 text-2xl font-bold line-height-2">
        {{ request.query.title }}
      </span>
      <span class="text-lg text-color-secondary">
        ({{ exec.label
        }}<template v-if="exec.kind === 'repeated'"
          >&nbsp;{{ exec.id }}</template
        >)
      </span>
    </h2>
    <SimpleChipList
      class="align-item-center"
      :chips="request.query.principal.tags"
    />
    <div class="flex flex-wrap gap-4">
      <div class="flex-1 min-w-0">
        <p>
          <b>{{ t("publishDate") }}:</b>
          {{ formatDateToLocale(requestInfo.publishDate) }}
        </p>
        <p>
          <b>{{ t("scheduledDate") }}:</b>
          {{ formatDateToLocale(request.scheduledDate) }}
        </p>
        <p>
          <b>{{ t("referenceDate") }}:</b>
          {{ formatDateToLocale(request.referenceDate) }}
        </p>
      </div>
      <div class="flex-1 min-w-0">
        <p>
          <b>{{ t("duration") }}:</b> {{ exec.duration }}
        </p>
        <p v-if="exec.kind === 'repeated'">
          <b>{{ t("interval") }}:</b> {{ exec.interval }}
        </p>
        <p v-if="exec.kind === 'repeated'">
          <b>{{ t("intervalHours") }}:</b> {{ exec.intervalHours }}
        </p>
        <p>
          <b>{{ t("targetedRequest") }}:</b>
          {{ requestInfo.targeted ? t("yes") : t("no") }}
        </p>
      </div>
    </div>
  </div>

  <div
    v-if="requestStatus && requestStatus.length"
    class="flex justify-content-center mt-3"
  >
    <InputText
      v-model="nodeSearch"
      :placeholder="t('keywordSearch')"
      class="w-20rem"
    />
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
