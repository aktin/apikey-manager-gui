<script setup lang="ts">
import {onMounted, ref} from "vue";
import BrokerConnection from "../services/BrokerConnection";
import {useI18n} from "vue-i18n";

const {t} = useI18n();
const connected = ref<boolean>(false);

async function checkConnection(): Promise<void> {
  connected.value = await BrokerConnection.isConnected();
}

onMounted(() => {
  checkConnection();
  BrokerConnection.onCredentialsChange(async () => {
    await checkConnection();
  });
});
</script>

<template>
  <div class="flex align-items-center">
    <!-- Green or red indicator based on connection -->
    <div v-if="connected" class="flex align-items-center text-green-600 text-xl" v-tooltip.left="BrokerConnection.getCredentials().url">
      <i class="pi pi-circle-fill mx-2"/>
      <p class="font-bold">{{ t("indicator.connected") }}</p>
    </div>

    <div v-else class="flex align-items-center text-red-600 text-xl" v-tooltip.left="BrokerConnection.getCredentials().url">
      <i class="pi pi-circle-fill mx-2"/>
      <p class="font-bold">{{ t("indicator.noConnection") }}</p>
    </div>

    <!-- Warnings for missing credentials -->
    <div class="ml-auto p-1">
    <span v-if="BrokerConnection.areCredentialsInitialized() && (BrokerConnection.getCredentials().url === '' || BrokerConnection.getCredentials().adminApiKey === '')"
          class="pi pi-exclamation-triangle text-3xl text-yellow-500 ml-2 mb-2"
          v-tooltip.left="t('indicator.missingCredentials')"/>
    </div>
  </div>
</template>
