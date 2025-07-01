<script setup lang="ts">
import {ref} from 'vue';
import BrokerConnectionChecker from './components/BrokerConnectionChecker.vue'
import ClinicCredentialsForm from "./components/ClinicCredentialsForm.vue";
import ClinicCredentialsTable from "./components/ClinicCredentialsTable.vue";

import Toast from "primevue/toast";


const selectedApiKey = ref("");
const isConnected = ref(true);
const isAuthorized = ref(false);

const handleApiKeyUpdate = (newApiKey) => {
  selectedApiKey.value = newApiKey;
};

const handleConnectionUpdate = (newConnectionStatus) => {
  isConnected.value = newConnectionStatus;
};

const handleAuthorizationUpdate = (newAuthorizationStatus) => {
  isAuthorized.value = newAuthorizationStatus;
}

</script>

<template>
  <Toast/>
  <div class="m-3">
    <div class="grid">
      <ClinicCredentialsTable @update:selectedApiKey="handleApiKeyUpdate" @update:isAuthorized="handleAuthorizationUpdate" class="col-10 surface-200 border-round-md"/>
      <div class="col-2">
        <BrokerConnectionChecker @update:isConnected="handleConnectionUpdate" :authorizationState="isAuthorized"/>
        <ClinicCredentialsForm :selectedKey="selectedApiKey" :connectionStatus="isConnected" :authorizationState="isAuthorized" class="surface-200 border-round-md"/>
      </div>
    </div>
  </div>
</template>