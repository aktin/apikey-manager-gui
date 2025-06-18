<script setup>
import {onMounted, ref, watch} from 'vue'
import BrokerConnection from "./BrokerConnection.js";
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

import { useToast } from "primevue/usetoast";
const toast = useToast();

const loadErrorToast = () => {
  toast.add({ severity: 'error', summary: 'Error', detail: 'Could not retrieve ApiKeys. Code:500'});
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
    //TODO status will be either 200 or 500

    loadErrorToast()
    console.log("Error while trying to get ApiKeys, code: "+apiKeyList.status)

    throw Error(`Error: ${apiKeyList.status}`);
  }

  return formatApiKeyList(apiKeyList.data);
}

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

watch(selectedRow, (newVal) => {
  selectedApiKey.value = newVal?.apiKey || "";
  selectedApiKey.value +=";"+ newVal?.aktive || "";
  emit("update:selectedApiKey", selectedApiKey.value);
});

defineExpose({ updateApiKeyList })

</script>
<template>
  <DataTable v-model:selection="selectedRow" :value="apiKeyList" selectionMode="single" :meta-key-selection="false" scrollable style="max-height:55rem"  scroll-height="flex">
    <template #empty>No Api Keys found</template>
    <Column field="apiKey" header="ApiKey" style="width: 10%"/>
    <Column field="commonName" header="Common name" sortable style="width: 35%"/>
    <Column field="organization" header="Organization" sortable style="width: 35%"/>
    <Column field="location" header="Location" sortable style="width: 10%"/>
    <Column field="aktive" header="Status" sortable style="width: 10%">
      <template #body="{ data }">
        <div>
          <i v-if="data.aktive === 'ACTIVE'" v-tooltip="'active'" class="pi pi-check-circle text-green-500"/>
          <i v-else-if="data.aktive === 'INACTIVE'" v-tooltip="'inactive'" class="pi pi-times-circle text-red-500"/>
          <i v-else v-tooltip="'status unknown'" class="pi pi-question-circle text-gray-400"/>
        </div>
      </template>
    </Column>
  </DataTable>
</template>