<script setup>
import {ref} from 'vue'
import BrokerConnection from "./BrokerConnection.js";
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const broker = new BrokerConnection();
const selectedApiKey = ref("");

const init = () => { showlist()}

async function showlist()
{
  products.value = await broker.getApiKeys()
}


const products = ref([]);
init();
</script>

<template>

  <Button label="get api list" @click="showlist()"/>

  <div class="card border-1">
    <DataTable v-model:selection="selectedApiKey" :value="products" selectionMode="single" :meta-key-selection="false" tableStyle="width: 100%" scrollable scrollHeight="450px">
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