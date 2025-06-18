<script setup>
import { ref } from 'vue';
import BrokerConnectionChecker from './components/BrokerConnectionChecker.vue'
import ClinicCredentialsForm from "./components/ClinicCredentialsForm.vue";
import ClinicCredentialsTable from "./components/ClinicCredentialsTable.vue";
import Toast from "primevue/toast";

const table = ref(null)

const selectedApiKey = ref("");
const handleApiKeyUpdate = (newApiKey) => {
  selectedApiKey.value = newApiKey;
};

const isConnected = ref(true);
const handleConnectionUpdate = (newConnectionStatus) => {
  isConnected.value = newConnectionStatus;
};

</script>

<template>
  <Toast/>
  <div class="m-3">
    <div class="grid">
     <ClinicCredentialsTable ref="table" @update:selectedApiKey="handleApiKeyUpdate" class="col-9 border-1"/>
      <div class="col-3">
        <BrokerConnectionChecker @update:isConnected="handleConnectionUpdate" class="border-1"/>
        <ClinicCredentialsForm :selectedKey="selectedApiKey" :connectionStatus="isConnected" />
      </div>
    </div>
  </div>
</template>