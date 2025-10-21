<script setup lang="ts">
import {computed, Ref, ref} from "vue";
import BrokerConnection from "../services/BrokerConnection";
import InputText from "primevue/inputtext";
import {useToast} from "primevue/usetoast";
import {useI18n} from "vue-i18n";
import Button from "primevue/button"
import {parseXmlBrokerRequest, parseXmlBrokerRequestInfo, parseXmlBrokerRequestStatus} from "../utils/Parser";
import BrokerRequest, {NodeStatusInfo, RequestInfo} from "../types/BrokerRequest";
import {createErrorToast, createSuccessToast} from "../utils/ToastWrapper";
import {formatDateToLocale, formatDurationToHumanReadable} from "../utils/MomentWrapper";
import FloatLabel from "primevue/floatlabel";
import SimpleChipList from "./SimpleChipList.vue";
import NodeStatusInfoTimeline from "./NodeStatusInfoTimeline.vue";
import Dialog from "primevue/dialog";
import ProgressSpinner from "primevue/progressspinner";

const {t} = useI18n()
const toast = useToast()

const id = ref("")
const invalidId = ref(false);
const request: Ref<BrokerRequest | null> = ref(null);
const requestInfo: Ref<RequestInfo | null> = ref(null);
const requestStatus: Ref<NodeStatusInfo[] | null> = ref(null);

const statusDialogVisible = ref(false);
const statusDialogTitle = ref("");
const statusDialogText = ref("");
const statusLoading = ref(false);

const idPattern = /^[1-9]\d*$/;

async function fetchAllRequestData() {
  invalidId.value = false
  if (!idPattern.test(id.value)) {
    createErrorToast(toast, t("inputError"), t("invalidRequestIdError"));
    invalidId.value = true;
    return
  }
  await fetchRequest();
  await fetchRequestInfo();
  await fetchRequestStatus();
}

async function fetchRequest() {
  const resp = await BrokerConnection.getBrokerRequest(id.value)
  switch (resp.status) {
    case 200:
      createSuccessToast(toast, t("success"), t("requestFound"));
      request.value = parseXmlBrokerRequest(resp.data);
      return;
    case 404:
      createErrorToast(toast, t("notFound"), t("requestNotFound"));
      break;
    case 401:
      createErrorToast(toast, t("accessDenied"), t("noAuthorization"));
      break;
    case 500:
      createErrorToast(toast, t("serverError"), t("serverErrorOccurred"));
      break;
    default:
      createErrorToast(toast, t("unexpectedError"), t("unexpectedErrorOccurred", {code: resp.status}));
  }
}

async function fetchRequestInfo() {
  const resp = await BrokerConnection.getBrokerRequestInfo(id.value)
  switch (resp.status) {
    case 200:
      createSuccessToast(toast, t("success"), t("TODO"));
      requestInfo.value = parseXmlBrokerRequestInfo(resp.data);
      return;
    case 404:
      createErrorToast(toast, t("notFound"), t("TODO"));
      break;
    case 401:
      createErrorToast(toast, t("accessDenied"), t("noAuthorization"));
      break;
    case 500:
      createErrorToast(toast, t("serverError"), t("serverErrorOccurred"));
      break;
    default:
      createErrorToast(toast, t("unexpectedError"), t("unexpectedErrorOccurred", {code: resp.status}));
  }
}

async function fetchRequestStatus() {
  const resp = await BrokerConnection.getBrokerRequestStatus(id.value)
  switch (resp.status) {
    case 200:
      createSuccessToast(toast, t("success"), t("TODO"));
      requestStatus.value = parseXmlBrokerRequestStatus(resp.data);
      return;
    case 404:
      createErrorToast(toast, t("notFound"), t("TODO"));
      break;
    case 401:
      createErrorToast(toast, t("accessDenied"), t("noAuthorization"));
      break;
    case 500:
      createErrorToast(toast, t("serverError"), t("serverErrorOccurred"));
      break;
    default:
      createErrorToast(toast, t("unexpectedError"), t("unexpectedErrorOccurred", {code: resp.status}));
  }
}

type execView =
    | { kind: "single"; label: string; duration: string }
    | { kind: "repeated"; label: string; id: number; duration: string; interval: string; intervalHours: number | null };

const exec = computed<execView | null>(() => {
  const q = request.value?.query;
  if (!q) return null;
  if (q.singleExecution) {
    return {
      kind: "single",
      label: t("singleRequest"),
      duration: formatDurationToHumanReadable(q.singleExecution.duration),
    };
  }
  if (q.repeatedExecution) {
    return {
      kind: "repeated",
      label: t("seriesRequest"),
      id: q.repeatedExecution.id,
      duration: formatDurationToHumanReadable(q.repeatedExecution.duration),
      interval: formatDurationToHumanReadable(q.repeatedExecution.interval),
      intervalHours: q.repeatedExecution.intervalHours ?? 0,
    };
  }
  return null;
});

const columns = computed(() => {
  const all = requestStatus.value ?? [];
  const half = Math.ceil(all.length / 2);
  return {left: all.slice(0, half), right: all.slice(half)};
});

function hasAnyTimestamp(node: NodeStatusInfo): boolean {
  return Object.entries(node)
  .filter(([k]) => k !== "nodeId")
  .some(([, v]) => v != null);
}

function nodeLabel(id: number): string {
  return BrokerConnection.getCachedNodeCN(id) ?? `#${id}`;
}

async function openNodeStatus(nodeIdNum: number) {
  const reqId = id.value.trim();
  if (!reqId) return;

  statusDialogVisible.value = true;
  statusDialogTitle.value = `${nodeLabel(nodeIdNum)}`;
  statusDialogText.value = "";
  statusLoading.value = true;

  try {
    const resp = await BrokerConnection.getBrokerRequestNodeStatus(reqId, String(nodeIdNum));
    switch (resp.status) {
      case 200:
        statusDialogText.value = typeof resp.data === "string" ? resp.data : String(resp.data);
        break;
      case 404:
        statusDialogText.value = t("notFound");
        break;
      case 401:
        statusDialogText.value = t("noAuthorization");
        break;
      default:
        statusDialogText.value = t("unexpectedErrorOccurred", {code: resp.status});
    }
  } catch (e) {
    statusDialogText.value = t("serverErrorOccurred");
  } finally {
    statusLoading.value = false;
  }
}
</script>

<template>
  <div class="flex flex-column align-items-center justify-content-center gap-3 p-3">
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
      <Button icon="pi pi-search" @click="fetchAllRequestData" v-tooltip.right="t('fetchRequest')"/>
    </div>
  </div>

  <div v-if="request && exec && requestInfo" class="surface-100 p-3 border-round">
    <h2 class="m-0 flex align-items-center gap-3 flex-wrap">
        <span class="flex-1 min-w-0 text-2xl font-bold line-height-2">
          {{ request.query.title }}
        </span>
      <span class="text-lg text-color-secondary">
          ({{ exec.label }}<template v-if="exec.kind === 'repeated'">&nbsp;{{ exec.id }}</template>)
        </span>
    </h2>
    <SimpleChipList class="align-item-center" :chips="request.query.principal.tags"/>
    <div class="flex flex-wrap gap-4">
      <div class="flex-1 min-w-0">
        <p><b>{{ t("publishDate") }}:</b> {{ formatDateToLocale(requestInfo.publishDate) }}</p>
        <p><b>{{ t("scheduledDate") }}:</b> {{ formatDateToLocale(request.scheduledDate) }}</p>
        <p><b>{{ t("referenceDate") }}:</b> {{ formatDateToLocale(request.referenceDate) }}</p>
      </div>
      <div class="flex-1 min-w-0">
        <p><b>{{ t("duration") }}:</b> {{ exec.duration }}</p>
        <p v-if="exec.kind === 'repeated'"><b>{{ t("interval") }}:</b> {{ exec.interval }}</p>
        <p v-if="exec.kind === 'repeated'"><b>{{ t("intervalHours") }}:</b> {{ exec.intervalHours }}</p>
        <p><b>{{ t("targetedRequest") }}:</b> {{ requestInfo.targeted ? t("yes") : t("no") }}</p>
      </div>
    </div>
  </div>

  <div v-if="columns.left.length || columns.right.length" class="grid mt-2 mx-6">
    <!-- left column -->
    <div class="col-12 md:col-6">
      <div v-for="node in columns.left"
           :key="node.nodeId"
           class="flex justify-content-between border-bottom-1 surface-border py-2"
      >
                <span class="font-bold flex align-items-center gap-2">
  <Button
      severity="secondary"
      icon="pi pi-file"
      text
      v-tooltip.bottom="t('openStatusTimeline')"
      @click="openNodeStatus(node.nodeId)"
  />
        <span class="font-bold">{{ [node.nodeId] }} {{ nodeLabel(node.nodeId) }}</span>
</span>
        <template v-if="hasAnyTimestamp(node)">
          <NodeStatusInfoTimeline :node-status-info="node"/>
        </template>
        <span v-else class="text-color-secondary text-sm">{{ t("notRetrievedyet") }}</span>
      </div>
    </div>

    <!-- right column -->
    <div class="col-12 md:col-6">
      <div v-for="node in columns.right"
           :key="node.nodeId"
           class="flex justify-content-between border-bottom-1 surface-border py-2"
      >
        <span class="font-bold flex align-items-center gap-2">
        <Button
            severity="secondary"
            icon="pi pi-file"
            text
            v-tooltip.bottom="t('openNodeLog')"
            @click="openNodeStatus(node.nodeId)"
        />
        <span class="font-bold">{{ [node.nodeId] }} {{ nodeLabel(node.nodeId) }}</span>
      </span>
        <template v-if="hasAnyTimestamp(node)">
          <NodeStatusInfoTimeline :node-status-info="node"/>
        </template>
        <span v-else class="text-color-secondary text-sm">{{ t("notRetrievedyet") }}</span>
      </div>
    </div>
  </div>
  <Dialog
      v-model:visible="statusDialogVisible"
      :header="statusDialogTitle"
      modal
      style="width: 60vw; max-width: 900px"
  >
    <div v-if="statusLoading" class="flex justify-content-center p-4">
      <ProgressSpinner/>
    </div>
    <pre v-else class="m-0" style="white-space: pre-wrap">{{ statusDialogText }}</pre>
  </Dialog>
</template>
