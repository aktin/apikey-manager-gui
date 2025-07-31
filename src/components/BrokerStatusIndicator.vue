<script setup lang="ts">
import {defineProps, onMounted, ref, watch} from "vue";
import BrokerConnection from "../services/BrokerConnection";
import {useI18n} from "vue-i18n";

const {t} = useI18n();

const props = defineProps<{ trigger: number; }>();

const connected = ref<boolean>(false);
const authorized = ref<boolean>(true);

async function checkConnection(): Promise<void> {
  connected.value = await BrokerConnection.isConnected();
  authorized.value = await BrokerConnection.isAuthorized();
}

onMounted(() => {
  checkConnection();
  BrokerConnection.onUpdate(async () => {
    await checkConnection();
  });
});

watch(() => props.trigger, () => {
  checkConnection();
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

    <!-- Warnings for missing credentials or auth -->
    <div class="ml-auto p-1">
      <span v-if="BrokerConnection.getCredentials().url === '' || BrokerConnection.getCredentials().adminApiKey === ''"
            class="pi pi-exclamation-triangle text-3xl text-yellow-500 ml-2 mb-2"
            v-tooltip.left="t('indicator.missingCredentials')"/>
      <span v-if="!authorized"
            class="pi pi-exclamation-triangle text-3xl text-yellow-500 ml-2 mb-2"
            v-tooltip.left="t('indicator.unauthorized')"/>
    </div>
  </div>
</template>
