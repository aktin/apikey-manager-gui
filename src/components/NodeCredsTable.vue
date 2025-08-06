<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import BrokerConnection from "../services/BrokerConnection";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
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

const emit = defineEmits<{ (e: "update:selectedApiKey", value: string): void }>();

const filters = ref({
  global: {value: null, matchMode: FilterMatchMode.CONTAINS}
});

function parseNodeIdMap(xmlString: string): Map<string, string> {
  const namespace = "http://aktin.org/ns/exchange"
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
    const row: Record<string, any> = {raw: line, apiKey, dn, nodeId, isActive: true};
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

async function fetchAndFormatApiKeyList(): Promise<Record<string, any>[]> {
  const keyResult = await BrokerConnection.getApiKeys();
  const nodeResult = await BrokerConnection.getBrokerNodeList();
  switch (keyResult.status) {
    case 200: {
      const nodeMap = nodeResult.status === 200 ? parseNodeIdMap(nodeResult.data) : new Map<string, string>();
      return mergeAndFormatLists(keyResult, nodeMap);
    }
    case 401:
      createErrorToast(toast, t("common.accessDenied"), t("table.unauthorized"));
      break;
    case 500:
      createErrorToast(toast, t("common.serverError"), t("common.serverErrorText"));
      break;
    default:
      createErrorToast(toast, t("common.unexpectedError"), `${t("common.unexpectedErrorText")} ${keyResult.status}`);
      break;
  }
  return [];
}

async function updateApiKeyList() {
  apiKeyList.value = await fetchAndFormatApiKeyList();
}

onMounted(async () => {
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

</script>

<template>
  <DataTable
      v-model:selection="selectedRow"
      v-model:filters="filters"
      :value="apiKeyList"
      selectionMode="single"
      :metaKeySelection="false"
      scrollable
      style="max-height: 55rem"
      scroll-height="flex"
      :globalFilterFields="['CN', 'O', 'L', 'nodeId']"
      filterDisplay="row"
  >
    <template #empty>{{ t("table.emptyList") }}</template>
    <template #header>
      <InputText v-model="filters['global'].value" :placeholder="t('table.keywordSearchPlaceholder')" class="text-base text-color surface-overlay p-2 input_Field"/>
      <i v-tooltip="t('table.keywordSearchInfo')" class="pi pi-info-circle p-2"/>
    </template>

    <Column field="nodeId" header="#" :sortable="true" style="width: 4%">
      <template #body="{ data }">
        <div class="flex justify-content-center">
          <span v-if="data.nodeId">{{ data.nodeId }}</span>
          <i v-else class="pi pi-question text-gray-300" v-tooltip.left="t('table.nodeNotConnected')"/>
        </div>
      </template>
    </Column>

    <Column field="apiKey" :header="t('table.apikey')" style="width: 10%"/>
    <Column field="CN" :header="t('table.cn')" :sortable="true" style="width: 35%"/>
    <Column field="O" :header="t('table.o')" :sortable="true" style="width: 35%"/>
    <Column field="L" :header="t('table.l')" :sortable="true" style="width: 10%"/>

    <Column field="isActive" :header="t('table.status')" :sortable="true" style="width: 6%">
      <template #body="{ data }">
        <div class="flex justify-content-center">
          <i v-if="data.isActive === true" v-tooltip="t('table.apiKeyActive')" class="pi pi-check-circle text-green-500"/>
          <i v-else-if="data.isActive === false" v-tooltip="t('table.apiKeyInactive')" class="pi pi-times-circle text-red-500"/>
          <i v-else v-tooltip="t('table.apiKeyStatusUnknown')" class="pi pi-question-circle text-gray-400"/>
        </div>
      </template>
    </Column>
  </DataTable>
</template>
