<script setup>
import {onMounted, ref, watch} from 'vue'
import BrokerConnection from "./BrokerConnection.js";
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const broker = new BrokerConnection();
const apiKeyList = ref([]);
const selectedRow = ref(null);
const selectedApiKey = ref("");
const emit = defineEmits(["update:selectedApiKey"]);

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
  let apiKeyList = await broker.getApiKeys()
  return formatApiKeyList(apiKeyList.data);
}

async function updateApiKeyList() {
  apiKeyList.value = await fetchAndFormatApiKeyList();
}

onMounted(async () => {
  await updateApiKeyList();
  window.callVueFunction = updateApiKeyList; // TODO What is this doing?
});

watch(selectedRow, (newVal) => {
  selectedApiKey.value = newVal?.apiKey || "";
  selectedApiKey.value += ";" + newVal.isActive;
  emit("update:selectedApiKey", selectedApiKey.value);
});

// defineExpose({updateApiKeyList}) TODO Test if necessary
</script>

<template>
  <!-- TODO add filter for api keys -->
  <DataTable v-model:selection="selectedRow"
             :value="apiKeyList"
             selectionMode="single"
             :meta-key-selection="false"
             scrollable
             style="max-height:55rem"
             scroll-height="flex">
    <template #empty>No API Keys found</template>
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