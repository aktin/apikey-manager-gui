<script setup lang="ts">
import {onMounted, ref} from 'vue';
import { useRouter } from 'vue-router'
import BrokerConnectionChecker from './BrokerConnectionChecker.vue'
import ClinicCredentialsForm from "./ClinicCredentialsForm.vue";
import ClinicCredentialsTable from "./ClinicCredentialsTable.vue";
import {sharedPassword} from './passwordChanger.js'

const router = useRouter();

const password =ref("")

const selectedApiKey = ref("");
const isConnected = ref(true);

const handleApiKeyUpdate = (newApiKey) => {
  selectedApiKey.value = newApiKey;
};

const handleConnectionUpdate = (newConnectionStatus) => {
  isConnected.value = newConnectionStatus;
};

const goToPage = () => {
  router.push('/')
}

onMounted(() => {
  if(sharedPassword.value==="") {
    goToPage();
  }else{
  }
});

</script>

<template>
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