<script setup lang="ts">
/**
 * NodeCredsTable.vue
 *
 * Displays a table of all stored API keys, their status, and associated broker nodes.
 *
 * Features:
 * - Fetches API key list and broker node metadata from the AKTIN Broker
 * - Automatically updates on credential or key list changes
 * - Shows the connected-node count and toggles the selected key's state
 * - Supports search, filtering, and toggling inactive keys
 * - Displays API keys in a masked preview format in the table
 */
import { computed, onMounted, ref, watch } from "vue";
import BrokerConnection from "../services/BrokerConnection";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Checkbox from "primevue/checkbox";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Divider from "primevue/divider";
import NodeCredsForm from "./NodeCredsForm.vue";
import { FilterMatchMode } from "@primevue/core/api";
import { useToast } from "primevue/usetoast";
import { useI18n } from "vue-i18n";
import { createErrorToast, createSuccessToast } from "../utils/ToastWrapper";
import { notifyStatusError } from "../utils/StatusToast";
import { mergeApiKeysWithNodes, parseNodeIdMap } from "../utils/Parser";

const toast = useToast();
const { t } = useI18n();

const apiKeyList = ref<Record<string, any>[]>([]);
const selectedRow = ref<Record<string, any> | null>(null);
const showInactiveKeys = ref(false);
const nodeCount = ref(0);

// Whether the selected key is active; drives the toggle button label/severity
const isSelectedActive = computed(() => selectedRow.value?.isActive === true);

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
    nodeCount.value = nodeMap.size;
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

/** Activates or deactivates the selected key, then clears the selection. */
async function toggleSelectedKey() {
  const row = selectedRow.value;
  if (!row) return;
  const wasActive = isSelectedActive.value;
  const status = wasActive
    ? await BrokerConnection.deactivateApiKey(row.apiKey)
    : await BrokerConnection.activateApiKey(row.apiKey);
  if (status === 200) {
    createSuccessToast(
      toast,
      t("success"),
      wasActive ? t("keyDeactivated") : t("keyActivated")
    );
    selectedRow.value = null;
    return;
  }
  notifyStatusError(toast, t, status, {
    404: { title: "notFound", message: "keyNotFound" }
  });
}

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
      <div
        class="flex justify-content-between flex-wrap align-items-center gap-2"
      >
        <!-- Status + filters -->
        <div class="flex align-items-center gap-2">
          <span class="text-color-secondary white-space-nowrap">
            {{ t("connectedNodes") }}: {{ nodeCount }}
          </span>
          <Divider layout="vertical" />
          <InputText
            v-model="filters['global'].value"
            :placeholder="t('keywordSearch')"
            class="text-base text-color surface-overlay p-2 input_Field"
          />
          <i v-tooltip="t('keywordSearchInfo')" class="pi pi-info-circle p-2" />
          <div class="flex align-items-center">
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

        <!-- Actions -->
        <div class="flex align-items-center gap-2 mr-2">
          <NodeCredsForm />
          <Button
            :label="isSelectedActive ? t('deactivate') : t('activate')"
            :severity="isSelectedActive ? 'danger' : 'success'"
            :disabled="!selectedRow"
            size="small"
            @click="toggleSelectedKey"
          />
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
