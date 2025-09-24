<script setup lang="ts">
import {computed} from "vue"
import {useI18n} from "vue-i18n"
import TabMenu from "primevue/tabmenu"
import BrokerStatusIndicator from "./BrokerStatusIndicator.vue";
import BrokerProfileManager from "./BrokerProfileManager.vue";

interface RouteConfig {
  label: string
  route: string
}

const {t} = useI18n()

const routing = computed<RouteConfig[]>(() => [
  {label: t("header.apiKeys"), route: "/api-keys"},
  {label: t("header.request"), route: "/request"},
])
</script>

<template>
  <div class="flex flex-wrap justify-content-between">
    <div class="flex align-items-center ml-3">
      <TabMenu :model="routing">
        <template #item="{ item, props }">
          <router-link v-slot="{ navigate }" :to="item.route">
            <a v-bind="props.action" @click="navigate">{{ item.label }}</a>
          </router-link>
        </template>
      </TabMenu>
    </div>

    <div class="flex align-items-center gap-2 mr-3">
      <BrokerStatusIndicator/>
      <BrokerProfileManager/>
    </div>
  </div>
</template>
