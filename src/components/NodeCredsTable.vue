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
 */
import {onMounted, ref, watch} from "vue";
import BrokerConnection from "../services/BrokerConnection";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Checkbox from "primevue/checkbox";
import InputText from "primevue/inputtext";
import {FilterMatchMode} from "primevue/api";
import {useToast} from "primevue/usetoast";
import {useI18n} from "vue-i18n";
import {createErrorToast} from "../utils/ToastWrapper";

const toast = useToast();
const {t} = useI18n();

const apiKeyList = ref<Record<string, any>[]>([]);
const selectedRow = ref<Record<string, any> | null>(null);
const selectedApiKey = ref<string>("");
const showInactiveKeys = ref(false);

const emit = defineEmits<{ (e: "update:selectedApiKey", value: string): void }>();

/**
 * Global search filter for the DataTable.
 */
const filters = ref({
  global: {value: null, matchMode: FilterMatchMode.CONTAINS},
});

/**
 * Parses an XML broker node list into a Map of clientDN → nodeId.
 *
 * @param xmlString - Raw XML string from broker
 * @returns A mapping of DN strings to node IDs
 */
function parseNodeIdMap(xmlString: string): Map<string, string> {
  const namespace = "http://aktin.org/ns/exchange";
  const map = new Map<string, string>();
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlString, "application/xml");
  const nodes = xml.getElementsByTagNameNS(namespace, "node");
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const id = node.getElementsByTagNameNS(namespace, "id")[0]?.textContent?.trim();
    const dn = node.getElementsByTagNameNS(namespace, "clientDN")[0]?.textContent?.trim();
    if (id && dn) {
      map.set(dn, id);
    }
  }
  return map;
}

/**
 * Merges broker API key entries with node IDs and formats them for table display.
 *
 * @param keyResult - Plaintext key list from the broker
 * @param nodeMap - Mapping of DNs to node IDs
 * @returns A normalized list of API key objects with metadata
 */
function mergeAndFormatLists(keyResult: { status: number; data: string }, nodeMap: Map<string, string>): Record<string, any>[] {
  return keyResult.data
  .trim()
  .split("\n")
  .filter(line => line.includes("="))
  .filter(line => !line.includes("OU"))
  .map(line => {
    const idx = line.indexOf("=");
    const apiKey = line.slice(0, idx);
    const dn = line.slice(idx + 1);
    const nodeId = nodeMap.get(dn) ?? null;
    const row: Record<string, any> = {
      raw: line,
      apiKey,
      dn,
      nodeId,
      isActive: true
    };
    const parts = dn.split(",");
    for (const part of parts) {
      if (part.includes("=")) {
        const [key, value] = part.split("=");
        row[key] = value;
      } else if (part === "INACTIVE") {
        row.isActive = false;
      }
    }
    return row;
  });
}

/**
 * Fetches API keys and broker node metadata, then formats them for display.
 *
 * @returns A list of formatted API key entries
 */
async function fetchAndFormatApiKeyList(): Promise<Record<string, any>[]> {
  const keyResult = await BrokerConnection.getApiKeys();
  const nodeResult = await BrokerConnection.getBrokerNodeList();
  switch (keyResult.status) {
    case 200: {
      const nodeMap = nodeResult.status === 200 ? parseNodeIdMap(nodeResult.data) : new Map<string, string>();
      return mergeAndFormatLists(keyResult, nodeMap);
    }
    case 401:
      createErrorToast(toast, t("accessDenied"), t("unauthorizedToViewKeys"));
      break;
    case 500:
      createErrorToast(toast, t("serverError"), t("serverErrorOccurred"));
      break;
    default:
      createErrorToast(toast, t("unexpectedError"), t("unexpectedErrorOccurred", {code: keyResult.status}));
      break;
  }
  return [];
}

/**
 * Updates the table content by filtering active/inactive keys.
 */
async function updateApiKeyList() {
  const fullList = await fetchAndFormatApiKeyList();
  apiKeyList.value = showInactiveKeys.value ? fullList : fullList.filter(entry => entry.isActive);
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
  <DataTable v-model:selection="selectedRow"
             v-model:filters="filters"
             :value="apiKeyList"
             selectionMode="single"
             :metaKeySelection="false"
             scrollable
             style="max-height: 55rem"
             scroll-height="flex"
             :globalFilterFields="['CN', 'O', 'L', 'nodeId']"
             filterDisplay="row">
    <template #empty>
      {{ t("emptyKeyList") }}
    </template>

    <template #header>
      <div class="flex justify-content-between flex-wrap">
        <div>
          <InputText v-model="filters['global'].value"
                     :placeholder="t('keywordSearch')"
                     class="text-base text-color surface-overlay p-2 input_Field"/>
          <i v-tooltip="t('keywordSearchInfo')" class="pi pi-info-circle p-2"/>
        </div>
        <div class="flex align-items-center mr-2">
          <Checkbox v-model="showInactiveKeys" :binary="true" inputId="showInactive"/>
          <label for="showInactive" class="ml-1">{{ t("showInactiveKeys") }}</label>
        </div>
      </div>
    </template>

    <!-- Node ID column with fallback icon if not linked -->
    <Column field="nodeId" :header="t('nodeId')" :sortable="true" style="width: 4%">
      <template #body="{ data }">
        <div class="flex justify-content-center">
          <span v-if="data.nodeId">{{ data.nodeId }}</span>
          <i v-else
             class="pi pi-question text-gray-300"
             v-tooltip.left="t('nodeHasNoId')"/>
        </div>
      </template>
    </Column>

    <!-- Raw API key -->
    <Column field="apiKey" :header="t('key')" style="width: 10%"/>

    <!-- DN components -->
    <Column field="CN" :header="t('cn')" :sortable="true" style="width: 35%"/>
    <Column field="O" :header="t('o')" :sortable="true" style="width: 35%"/>
    <Column field="L" :header="t('l')" :sortable="true" style="width: 10%"/>

    <!-- Status column with icons for active/inactive/unknown -->
    <Column field="isActive" :header="t('status')" :sortable="true" style="width: 6%">
      <template #body="{ data }">
        <div class="flex justify-content-center">
          <i v-if="data.isActive === true"
             v-tooltip="t('keyIsActive')"
             class="pi pi-check-circle text-green-500"/>
          <i v-else-if="data.isActive === false"
             v-tooltip="t('keyIsInactive')"
             class="pi pi-times-circle text-red-500"/>
          <i v-else
             v-tooltip="t('keyStatusUnknown')"
             class="pi pi-question-circle text-gray-400"/>
        </div>
      </template>
    </Column>
  </DataTable>
</template>
