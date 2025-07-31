<script setup lang="ts">
import {defineProps} from "vue";
import {useI18n} from "vue-i18n";

const {t} = useI18n();

const props = defineProps<{
  connected: boolean;
  authorizationState: boolean;
  url: string;
}>();
</script>

<template>
  <div class="flex align-items-center">
    <div v-if="connected" class="flex align-items-center text-green-600 text-xl" v-tooltip.left="url">
      <i class="pi pi-circle-fill mx-2"/>
      <p class="font-bold">{{ t("indicator.connected") }}</p>
    </div>

    <div v-else class="flex align-items-center text-red-600 text-xl" v-tooltip.left="url">
      <i class="pi pi-circle-fill mx-2"/>
      <p class="font-bold">{{ t("indicator.noConnection") }}</p>
    </div>

    <div class="ml-auto p-1">
      <span v-if="url === ''" class="pi pi-exclamation-triangle text-3xl text-yellow-500 ml-2 mb-2" v-tooltip.left="t('indicator.missingCredentials')"/>
      <span v-if="!authorizationState" class="pi pi-exclamation-triangle text-3xl text-yellow-500 ml-2 mb-2" v-tooltip.left="t('indicator.unauthorized')"/>
    </div>
  </div>
</template>
