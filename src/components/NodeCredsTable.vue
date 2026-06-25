<script setup lang="ts">
/**
 * NodeCredsTable.vue
 *
 * Displays a table of all stored API keys, their status, and associated broker nodes.
 *
 * Features:
 * - Fetches API key list and broker node metadata from the AKTIN Broker
 * - Automatically updates on credential or key list changes
 * - Emits `update:selectedApiKey` when a row is selected
 * - Supports search, filtering, and toggling inactive keys
 * - Displays API keys in a masked preview format in the table
 */
import { onMounted, ref, watch } from "vue";
import BrokerConnection from "../services/BrokerConnection";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Checkbox from "primevue/checkbox";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import { FilterMatchMode } from "primevue/api";
import { useToast } from "primevue/usetoast";
import { useI18n } from "vue-i18n";
import { createErrorToast, createSuccessToast } from "../utils/ToastWrapper";
import { notifyStatusError } from "../utils/StatusToast";
import { mergeApiKeysWithNodes, parseNodeIdMap } from "../utils/Parser";

const toast = useToast();
const { t } = useI18n();

const apiKeyList = ref<Record<string, any>[]>([]);
const selectedRow = ref<Record<string, any> | null>(null);
const selectedApiKey = ref<string>("");
const showInactiveKeys = ref(false);

const emit = defineEmits<{
  (e: "update:selectedApiKey", value: string): void;
}>();

/**
 * Global search filter for the DataTable.
 */
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

/**
 * Formats an API key as a short masked preview for table display.
 */
function formatApiKeyPreview(apiKey: string): string {
  if (!apiKey) {
    return "";
  }
  if (apiKey.length <= 8) {
    return "••••••••";
  }
  return `${apiKey.slice(0, 4)}••••••••${apiKey.slice(-4)}`;
}

async function copyApiKeyToClipboard(text: string) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    createSuccessToast(toast, t("success"), t("keyCopied"));
  } catch (err) {
    createErrorToast(toast, t("error"), t("failedToCopy"));
  }
}

/**
 * Fetches API keys and broker node metadata, then formats them for display.
 */
async function fetchAndFormatApiKeyList(): Promise<Record<string, any>[]> {
  const keyResult = await BrokerConnection.getApiKeys();
  const nodeResult = await BrokerConnection.getBrokerNodeList();
  if (keyResult.status === 200) {
    BrokerConnection.updateNodeCacheFromXml(nodeResult.data);
    const nodeMap =
      nodeResult.status === 200
        ? parseNodeIdMap(nodeResult.data)
        : new Map<string, string>();
    return mergeApiKeysWithNodes(keyResult.data, nodeMap);
  }
  notifyStatusError(toast, t, keyResult.status, {
    401: { title: "accessDenied", message: "unauthorizedToViewKeys" }
  });
  return [];
}

/**
 * Updates the table content by filtering active/inactive keys.
 */
async function updateApiKeyList() {
  const fullList = await fetchAndFormatApiKeyList();
  apiKeyList.value = showInactiveKeys.value
    ? fullList
    : fullList.filter((entry) => entry.isActive);
}

onMounted(async () => {
  await BrokerConnection.waitForBrokerCredentials();
  await updateApiKeyList();
  BrokerConnection.onApiKeysChange(async () => {
    await updateApiKeyList();
  });
  BrokerConnection.onCredentialsChange(async () => {
    await updateApiKeyList();
  });
});

watch(selectedRow, (newVal) => {
  selectedApiKey.value = newVal ? `${newVal.apiKey};${newVal.isActive}` : "";
  emit("update:selectedApiKey", selectedApiKey.value);
});

watch(showInactiveKeys, async () => {
  await updateApiKeyList();
});
</script>

<template>
  <DataTable
    v-model:selection="selectedRow"
    v-model:filters="filters"
    :value="apiKeyList"
    selectionMode="single"
    :metaKeySelection="false"
    scrollable
    scroll-height="flex"
    :globalFilterFields="['CN', 'O', 'L', 'nodeId']"
    filterDisplay="row"
    sortField="nodeId"
    :sortOrder="1"
  >
    <template #empty>
      {{ t("emptyKeyList") }}
    </template>

    <template #header>
      <div class="flex justify-content-between flex-wrap">
        <div>
          <InputText
            v-model="filters['global'].value"
            :placeholder="t('keywordSearch')"
            class="text-base text-color surface-overlay p-2 input_Field"
          />
          <i v-tooltip="t('keywordSearchInfo')" class="pi pi-info-circle p-2" />
        </div>
        <div class="flex align-items-center mr-2">
          <Checkbox
            v-model="showInactiveKeys"
            :binary="true"
            inputId="showInactive"
          />
          <label for="showInactive" class="ml-1">{{
            t("showInactiveKeys")
          }}</label>
        </div>
      </div>
    </template>

    <!-- Node ID column with fallback icon if not linked -->
    <Column
      field="nodeId"
      :header="t('nodeId')"
      :sortable="true"
      style="width: 4%"
    >
      <template #body="{ data }">
        <div class="flex justify-content-center">
          <span v-if="data.nodeId">{{ data.nodeId }}</span>
          <i
            v-else
            class="pi pi-question text-gray-300"
            v-tooltip.left="t('nodeHasNoId')"
          />
        </div>
      </template>
    </Column>

    <Column :header="t('key')" style="width: 14%">
      <template #body="{ data }">
        <div class="flex align-items-center gap-2">
          <span style="font-family: monospace">
            {{
              selectedRow?.apiKey === data.apiKey
                ? data.apiKey
                : formatApiKeyPreview(data.apiKey)
            }}
          </span>
          <Button
            v-if="selectedRow?.apiKey === data.apiKey"
            icon="pi pi-copy"
            text
            rounded
            size="small"
            v-tooltip.bottom="t('copyFullKey')"
            @click.stop="copyApiKeyToClipboard(data.apiKey)"
          />
        </div>
      </template>
    </Column>

    <Column field="CN" :header="t('cn')" :sortable="true" style="width: 32%" />
    <Column field="O" :header="t('o')" :sortable="true" style="width: 32%" />
    <Column field="L" :header="t('l')" :sortable="true" style="width: 12%" />

    <!-- Status column with icons for active/inactive/unknown -->
    <Column
      field="isActive"
      :header="t('status')"
      :sortable="true"
      style="width: 6%"
    >
      <template #body="{ data }">
        <div class="flex justify-content-center">
          <i
            v-if="data.isActive === true"
            v-tooltip="t('keyIsActive')"
            class="pi pi-check-circle text-green-500"
          />
          <i
            v-else-if="data.isActive === false"
            v-tooltip="t('keyIsInactive')"
            class="pi pi-times-circle text-red-500"
          />
          <i
            v-else
            v-tooltip="t('keyStatusUnknown')"
            class="pi pi-question-circle text-gray-400"
          />
        </div>
      </template>
    </Column>
  </DataTable>
</template>
