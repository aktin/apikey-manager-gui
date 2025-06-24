<script setup>
import {onMounted, ref, watch} from 'vue'
import BrokerConnection from "./BrokerConnection.js";
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import {FilterMatchMode} from "primevue/api";
import InputText from "primevue/inputtext";

const apiKeyList = ref([]);
const selectedRow = ref(null);
const selectedApiKey = ref("");
const emit = defineEmits(["update:selectedApiKey"]);

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});

function formatApiKeyList(textBlock) {
  return textBlock
      .trim()
      .split("\n")
      .filter(line => !line.includes("OU"))
      .map(line => {
        const idx = line.indexOf("=");
        const apiKey = line.slice(0, idx);
        const dn = line.slice(idx + 1);
        const parts = dn.split(",");
        const row = {apiKey, isActive: true};
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

async function fetchAndFormatApiKeyList() {
  let apiKeyList = await BrokerConnection.getApiKeys()
  return formatApiKeyList(apiKeyList.data);
}

async function updateApiKeyList() {
  apiKeyList.value = await fetchAndFormatApiKeyList();
}

onMounted(async () => {
  await updateApiKeyList();
  window.callVueFunction = updateApiKeyList;
});

watch(selectedRow, (newVal) => {
  if (newVal) {
    selectedApiKey.value = `${newVal.apiKey};${newVal.isActive}`;
  } else {
    selectedApiKey.value = "";
  }
  emit("update:selectedApiKey", selectedApiKey.value);
});

</script>

<template>
  <DataTable v-model:selection="selectedRow"
             v-model:filters="filters"
             :value="apiKeyList"
             selectionMode="single" :metaKeySelection="false"
             scrollable
             style="max-height:55rem"
             scroll-height="flex"
             :globalFilterFields="['CN','O','L']"
             filterDisplay="row">
    <template #empty>No API Keys found</template>
    <template #header>
          <InputText v-model="filters['global'].value" placeholder="Keyword Search" class="text-base text-color surface-overlay p-2 input_Field"/>
    </template>
    <Column field="apiKey" header="API Key" style="width: 10%"/>
    <Column field="CN" header="Common Name" sortable style="width: 35%"/>
    <Column field="O" header="Organization" sortable style="width: 35%"/>
    <Column field="L" header="Location" sortable style="width: 10%"/>
    <Column field="aktive" header="Status" sortable style="width: 10%">
      <template #body="{ data }">
        <div class="flex justify-content-center">
          <i v-if="data.isActive === true" v-tooltip="'API Key is active'" class="pi pi-check-circle text-green-500"/>
          <i v-else-if="data.isActive === false" v-tooltip="'API Key is inactive'" class="pi pi-times-circle text-red-500"/>
          <i v-else v-tooltip="'Status unknown'" class="pi pi-question-circle text-gray-400"/>
        </div>
      </template>
    </Column>
  </DataTable>
</template>