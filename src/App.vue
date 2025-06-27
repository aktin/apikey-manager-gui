<script setup lang="ts">
import {ref} from 'vue';
import BrokerConnectionChecker from './components/BrokerConnectionChecker.vue'
import ClinicCredentialsForm from "./components/ClinicCredentialsForm.vue";
import ClinicCredentialsTable from "./components/ClinicCredentialsTable.vue";

import Toast from "primevue/toast";


const selectedApiKey = ref("");
const isConnected = ref(true);

const handleApiKeyUpdate = (newApiKey) => {
  selectedApiKey.value = newApiKey;
};

const handleConnectionUpdate = (newConnectionStatus) => {
  isConnected.value = newConnectionStatus;
};

</script>

<template>
  <Toast/>
  <div class="m-3">
    <div class="grid">
      <ClinicCredentialsTable @update:selectedApiKey="handleApiKeyUpdate" class="col-10 surface-200 border-round-md"/>
      <div class="col-2">
        <BrokerConnectionChecker @update:isConnected="handleConnectionUpdate"/>
        <ClinicCredentialsForm :selectedKey="selectedApiKey" :connectionStatus="isConnected" class="surface-200 border-round-md"/>
      </div>
    </div>
  </div>
</template>