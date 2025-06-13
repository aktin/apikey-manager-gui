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
  { ApiKey: 'xxxAPIKEY001', CommonName: 'Clinic A', Organization: 'ORG Q', Location: "place P", Status: "active" },
  { ApiKey: 'xxxAPIKEY002', CommonName: 'Clinic B', Organization: 'ORG W', Location: "place O", Status: "active" },
  { ApiKey: 'xxxAPIKEY003', CommonName: 'Clinic C', Organization: 'ORG E', Location: "place I", Status: "active" },
  { ApiKey: 'xxxAPIKEY004', CommonName: 'Clinic D', Organization: 'ORG R', Location: "place U", Status: "inactive" },
  { ApiKey: 'xxxAPIKEY005', CommonName: 'Clinic E', Organization: 'ORG T', Location: "place Z", Status: "active" },
  { ApiKey: 'xxxAPIKEY006', CommonName: 'Clinic F', Organization: 'ORG A', Location: "place T", Status: "active" },
  { ApiKey: 'xxxAPIKEY007', CommonName: 'Clinic G', Organization: 'ORG S', Location: "place R", Status: "active" },
  { ApiKey: 'xxxAPIKEY008', CommonName: 'Clinic H', Organization: 'ORG D', Location: "place E", Status: "active" },
  { ApiKey: 'xxxAPIKEY009', CommonName: 'Clinic I', Organization: 'ORG F', Location: "place W", Status: "active" },
  { ApiKey: 'xxxAPIKEY010', CommonName: 'Clinic J', Organization: 'ORG Y', Location: "place Q", Status: "inactive" },
  { ApiKey: 'xxxAPIKEY011', CommonName: 'Clinic K', Organization: 'ORG X', Location: "place A", Status: "active" },
  { ApiKey: 'xxxAPIKEY012', CommonName: 'Clinic L', Organization: 'ORG C', Location: "place S", Status: "active" },
  { ApiKey: 'xxxAPIKEY013', CommonName: 'Clinic M', Organization: 'ORG V', Location: "place D", Status: "active" },
  { ApiKey: 'xxxAPIKEY014', CommonName: 'Clinic N', Organization: 'ORG t', Location: "place F", Status: "inactive" },
  { ApiKey: 'xxxAPIKEY015', CommonName: 'Clinic O', Organization: 'ORG G', Location: "place G", Status: "active" },
  { ApiKey: 'xxxAPIKEY016', CommonName: 'Clinic P', Organization: 'ORG B', Location: "place H", Status: "inactive" },
  { ApiKey: 'xxxAPIKEY017', CommonName: 'YYYYYYYYYYYYYYYYYYYYYYYYY', Organization: 'AAAAAAAAAAAAAAAAAAAA', Location: "AAAAAAAAAAAAAAAAAAA", Status: "inactive" },



]);

</script>

<template>

  <Button label="get api list" @click="showlist()"/>

  <div class="card border-1">
    <DataTable :value="products" tableStyle="width: 100%" scrollable scrollHeight="450px">
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