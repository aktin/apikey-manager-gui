<script setup lang="ts">
/**
 * BrokerStatusIndicator.vue
 *
 * A purely presentational component that displays:
 * - Broker connection status (green/red icon)
 * - Broker URL as tooltip
 * - Warning icons for missing credentials or unauthorized access
 *
 * Props:
 * - connected: whether a successful broker connection was detected
 * - authorizationState: whether current credentials have access
 * - url: the broker endpoint to show in tooltip
 */

import {defineProps} from "vue";
import {useI18n} from "vue-i18n";

const {t} = useI18n();

/**
 * Component props
 */
const props = defineProps<{
  /**
   * Whether the application is connected to the broker (status 200)
   */
  connected: boolean;

  /**
   * Whether the broker responded with authorized API access
   */
  authorizationState: boolean;

  /**
   * The broker endpoint used for connection (shown in tooltip)
   */
  url: string;
}>();
</script>

<template>
  <div class="flex align-items-center">
    <!-- Green or red indicator based on connection -->
    <div v-if="connected" class="flex align-items-center text-green-600 text-xl" v-tooltip.left="url">
      <i class="pi pi-circle-fill mx-2"/>
      <p class="font-bold">{{ t("indicator.connected") }}</p>
    </div>

    <div v-else class="flex align-items-center text-red-600 text-xl" v-tooltip.left="url">
      <i class="pi pi-circle-fill mx-2"/>
      <p class="font-bold">{{ t("indicator.noConnection") }}</p>
    </div>

    <!-- Warnings for missing credentials or auth -->
    <div class="ml-auto p-1">
      <span v-if="url === ''" class="pi pi-exclamation-triangle text-3xl text-yellow-500 ml-2 mb-2" v-tooltip.left="t('indicator.missingCredentials')"/>
      <span v-if="!authorizationState" class="pi pi-exclamation-triangle text-3xl text-yellow-500 ml-2 mb-2" v-tooltip.left="t('indicator.unauthorized')"/>
    </div>
  </div>
</template>
