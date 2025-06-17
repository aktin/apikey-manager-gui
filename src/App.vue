<script setup>
import { ref } from 'vue';
import BrokerConnectionChecker from './components/BrokerConnectionChecker.vue'
import ClinicCredentialsInput from "./components/ClinicCredentialsInput.vue";
import ClinicCredentialsTable from "./components/ClinicCredentialsTable.vue";

const selectedApiKey = ref("");

const handleApiKeyUpdate = (newApiKey) => {
  selectedApiKey.value = newApiKey;
};
</script>

<template>
  <div class="m-3">
    <div class="grid">
     <ClinicCredentialsTable @update:selectedApiKey="handleApiKeyUpdate" class="col-9 border-1"/>
      <div class="col-3">
        <BrokerConnectionChecker class="border-1"/>
        <ClinicCredentialsInput :selectedKey="selectedApiKey"/>
      </div>
    </div>
  </div>
</template>