<script setup>
import {ref, toRaw, watch} from 'vue'
import BrokerConnection from "./BrokerConnection.js";
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const broker = new BrokerConnection();
const selectedApiKey = ref("");
const apiKeyList = ref();

const selectedRow = ref(null);

const init = () => { showlist()}

async function showlist()
{
  apiKeyList.value = await broker.getApiKeys()
}

watch(selectedApiKey, (newVal) => {
  if(newVal) {
    console.log(toRaw(newVal).ApiKey);
  }
});

init();
</script>

<template>

  <div class="card border-1">
    <DataTable v-model:selection="selectedApiKey" :value="apiKeyList" selectionMode="single" :meta-key-selection="false" tableStyle="width: 100%" scrollable scrollHeight="450px">
      <Column field="ApiKey" header="ApiKey" style="width: 20%"></Column>
      <Column field="CommonName" header="Common name" sortable style="width: 20%"></Column>
      <Column field="Organization" header="Organization" sortable style="width: 20%"></Column>
      <Column field="Location" header="Location" sortable style="width: 20%"></Column>
      <Column field="Status" header="Status" sortable style="width: 20%"></Column>
    </DataTable>
  </div>

</template>

<style scoped>

</style>