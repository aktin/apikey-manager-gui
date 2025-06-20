<script setup>
import {onMounted, ref, watch} from 'vue'
import BrokerConnection from "./BrokerConnection.js";
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

import {useToast} from "primevue/usetoast";
const toast = useToast();

const loadErrorToast = () => {
  toast.add({ severity: 'error', summary: 'Connection Error', detail: 'Could not retrieve Api Keys. Code:500'});
};

const broker = new BrokerConnection();
const apiKeyList = ref([]);
const selectedRow = ref(null);
const selectedApiKey = ref("");
const emit = defineEmits(["update:selectedApiKey"]);

onMounted(async () => {
  await updateApiKeyList();
  window.callVueFunction = updateApiKeyList;
});

async function updateApiKeyList() {
  apiKeyList.value = await fetchAndFormatApiKeyList();
}

async function fetchAndFormatApiKeyList() {
  let apiKeyList = await broker.getApiKeys()

  if (apiKeyList.status !== 200)
  {
    loadErrorToast()
    console.log("Error while trying to get ApiKeys, code: "+apiKeyList.status)

    throw Error(`Error: ${apiKeyList.status}`);
  }
  return formatApiKeyList(apiKeyList.data);
}
function formatApiKeyList(textBlock) {

  const apiList = textBlock.trim().split("\n").filter(item => !item.includes("OU"));

  return apiList.map(entry => {
    const idx = entry.indexOf('=');
    const apikey = entry.slice(0, idx);
    const rest = entry.slice(idx + 1);

    const obj = {apikey};
    const parts = rest.split(',');

    parts.forEach(part => {
      if (part.includes('=')) {
        const [key, value] = part.split('=');
        obj[key] = value;
      } else {
        obj.aktive = part === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
      }
    });

    if (!obj.aktive) obj.aktive = 'ACTIVE';

    return obj;
  });
}

watch(selectedRow, (newVal) => {
  selectedApiKey.value = newVal?.apikey || "";
  selectedApiKey.value +=";"+ newVal?.aktive || "";
  emit("update:selectedApiKey", selectedApiKey.value);
});

defineExpose({ updateApiKeyList })

</script>
<template>
  <DataTable v-model:selection="selectedRow" :value="apiKeyList" selectionMode="single" :meta-key-selection="false" scrollable style="max-height:55rem"  scroll-height="flex">
    <template #empty>No Api Keys found</template>
    <Column field="apikey" header="ApiKey" style="width: 10%"/>
    <Column field="CN" header="Common name" sortable style="width: 35%"/>
    <Column field="O" header="Organization" sortable style="width: 35%"/>
    <Column field="L" header="Location" sortable style="width: 10%"/>
    <Column field="aktive" header="Status" sortable style="width: 10%">
      <template #body="{ data }">
        <div class="flex justify-content-center">
          <i v-if="data.aktive === 'ACTIVE'" v-tooltip="'Api Key is active'" class="pi pi-check-circle text-green-500"/>
          <i v-else-if="data.aktive === 'INACTIVE'" v-tooltip="'Api Key is inactive'" class="pi pi-times-circle text-red-500"/>
          <i v-else v-tooltip="'status unknown'" class="pi pi-question-circle text-gray-400"/>
        </div>
      </template>
    </Column>
  </DataTable>
</template>