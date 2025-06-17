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
      .map(element => {
        const [apiKey, , commonName, , organization, , location, aktive = "ACTIVE"] = element.split(/[=,]/);
        return {
          apiKey: apiKey,
          commonName: commonName,
          organization: organization,
          location: location,
          aktive: aktive
        };
      });
}

async function fetchAndFormatApiKeyList() {
  let apiKeyList = await broker.getApiKeys()

  if (apiKeyList.status !== 200) {
    //TODO status will be either 200 or 500
    //console.log error
    //throw toast with http code 500 and message
    throw Error(`Error: ${apiKeyList.status}`);
  }

  return formatApiKeyList(apiKeyList.data);
}

onMounted(async () => {
  apiKeyList.value = await fetchAndFormatApiKeyList();
});

watch(selectedRow, (newVal) => {
  selectedApiKey.value = newVal?.apiKey || "";
  selectedApiKey.value +=";"+ newVal?.aktive || "";
  emit("update:selectedApiKey", selectedApiKey.value);
});
</script>

<template>
  <DataTable v-model:selection="selectedRow" :value="apiKeyList" selectionMode="single" :meta-key-selection="false" scrollable style="max-height:55rem"  scroll-height="flex">
    <template #empty>No Api Keys found</template>
    <Column field="apiKey" header="ApiKey" style="width: 10%"></Column>
    <Column field="commonName" header="Common name" sortable style="width: 35%"></Column>
    <Column field="organization" header="Organization" sortable style="width: 35%"></Column>
    <Column field="location" header="Location" sortable style="width: 10%"></Column>
    <Column field="aktive" header="Status" sortable style="width: 10%"></Column>
  </DataTable>
</template>
