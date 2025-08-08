<script setup lang="ts">
/**
 * BrokerStatusIndicator.vue
 *
 * Displays the current connection status to the AKTIN Broker.
 *
 * Features:
 * - Shows a green or red status indicator based on connectivity
 * - Reacts to credential changes via `BrokerConnection.onCredentialsChange()`
 * - Displays a warning icon if credentials are incomplete or missing
 *
 * This is a passive display component. It does not emit events.
 */
import {onMounted, ref} from "vue";
import BrokerConnection from "../services/BrokerConnection";
import {useI18n} from "vue-i18n";

const {t} = useI18n();
const connected = ref(false);
const creds = ref(BrokerConnection.getCredentials());

async function checkConnection(): Promise<void> {
  creds.value = BrokerConnection.getCredentials();
  if (!creds.value.url || !creds.value.adminApiKey) {
    connected.value = false;
    return;
  }
  connected.value = await BrokerConnection.isConnected();
}

onMounted(async () => {
  await BrokerConnection.waitForBrokerCredentials();
  await checkConnection();
  BrokerConnection.onCredentialsChange(async () => {
    await checkConnection();
  });
});
</script>

<template>
  <div class="flex align-items-center">
    <!-- Connected: green icon and label -->
    <div v-if="connected"
         class="flex align-items-center text-green-600 text-xl"
         v-tooltip.left="creds.url">
      <i class="pi pi-circle-fill mx-2"/>
      <p class="font-bold">{{ t("indicator.connected") }}</p>
    </div>

    <!-- Disconnected: red icon and label -->
    <div v-else
         class="flex align-items-center text-red-600 text-xl"
         v-tooltip.left="creds.url">
      <i class="pi pi-circle-fill mx-2"/>
      <p class="font-bold">{{ t("indicator.noConnection") }}</p>
    </div>

    <!-- Missing credentials: yellow warning icon -->
    <div class="ml-auto p-1">
      <span v-if="!creds.url || !creds.adminApiKey"
            class="pi pi-exclamation-triangle text-3xl text-yellow-500 ml-2 mb-2"
            v-tooltip.left="t('indicator.missingCredentials')"/>
    </div>
  </div>
</template>
