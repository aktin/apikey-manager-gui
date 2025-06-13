<script setup>
import {ref} from 'vue'
import BrokerConnection from "./BrokerConnection.js";
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const broker = new BrokerConnection();
const bruh = ref("");

async function showlist()
{
  bruh.value = await broker.getApiKeys()
}


const products = ref([
  { ApiKey: 'xxxAPIKEY111', CommonName: 'Clinic A', Organization: 'ORG B', Location: "place D" },
  { ApiKey: 'xxxAPIKEY222', CommonName: 'Clinic B', Organization: 'ORG C', Location: "place A" },
  { ApiKey: 'xxxAPIKEY333', CommonName: 'Clinic C', Organization: 'ORG D', Location: "place B" },
  { ApiKey: 'xxxAPIKEY444', CommonName: 'Clinic D', Organization: 'ORG A', Location: "place C" },
]);

</script>

<template>

  <Button label="get api list" @click="showlist()"/>

  <div class="card border-1">
    <DataTable :value="products" tableStyle="width: 50%">
      <Column field="ApiKey" header="ApiKey" style="width: 25px"></Column>
      <Column field="CommonName" header="Common name" sortable style="width: 25px"></Column>
      <Column field="Organization" header="Organization" sortable style="width: 25px"></Column>
      <Column field="Location" header="Location" sortable style="width: 25px"></Column>
    </DataTable>
  </div>

</template>

<style scoped>

</style>