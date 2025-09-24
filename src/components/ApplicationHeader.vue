```vue
<template>
  <div class="flex flex-wrap justify-content-between border-solid border-200 py-1">
    <div class="flex align-items-center mx-2 gap-1" style="user-select: none">
      <h2 class="text-700">Broker Manager</h2>
    </div>

    <div class="flex align-items-center mx-2 gap-1">
      <div v-if="true" class="flex">
        <TabMenu :model="routing">
          <template #item="{ item, props }">
            <router-link v-slot="{ navigate }" :to="item.route">
              <a v-bind="props.action" @click="navigate">{{ item.label }}</a>
            </router-link>
          </template>
        </TabMenu>
        <Divider layout="vertical" />
      </div>

      <BrokerStatusIndicator/>
      <BrokerProfileManager/>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import TabMenu from 'primevue/tabmenu'
import Divider from 'primevue/divider'
import BrokerStatusIndicator from "./BrokerStatusIndicator.vue";
import BrokerProfileManager from "./BrokerProfileManager.vue";

interface RouteConfig {
  label: string
  route: string
}

const { t } = useI18n()

const routing = computed<RouteConfig[]>(() => [
  { label: t('header.apiKeys'), route: '/api-keys' },
  { label: t('header.request'), route: '/request' },
])
</script>

<!--
<div class="flex flex-wrap align-items-center justify-content-end gap-3 mr-3">
<BrokerStatusIndicator/>
<BrokerProfileManager/>
</div>
--->