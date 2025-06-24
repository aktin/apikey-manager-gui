<script setup>
import {ref} from 'vue';
import { useRouter } from 'vue-router'
import BrokerConnectionChecker from './components/BrokerConnectionChecker.vue'
import ClinicCredentialsForm from "./components/ClinicCredentialsForm.vue";
import ClinicCredentialsTable from "./components/ClinicCredentialsTable.vue";
import Toast from "primevue/toast";

const router = useRouter();

const selectedApiKey = ref("");
const isConnected = ref(true);

const handleApiKeyUpdate = (newApiKey) => {
  selectedApiKey.value = newApiKey;
};

const handleConnectionUpdate = (newConnectionStatus) => {
  isConnected.value = newConnectionStatus;
};

const goToPage = () => {
  router.push('/login')
}
</script>
<template>
  <Toast/>
  <router-view/>
  <div class="m-3">
    <div class="grid">
      <ClinicCredentialsTable @update:selectedApiKey="handleApiKeyUpdate" class="col-9 border-1"/>
      <div class="col-3">
        <BrokerConnectionChecker @update:isConnected="handleConnectionUpdate" class="border-1"/>
        <ClinicCredentialsForm :selectedKey="selectedApiKey" :connectionStatus="isConnected"/>
      </div>
    </div>
  </div>
  <Button @click="goToPage">go to login</Button>
</template>