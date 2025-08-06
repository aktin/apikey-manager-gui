<script setup lang="ts">
import {ref} from "vue";
import NodeCredsForm from "./components/NodeCredsForm.vue";
import NodeCredsTable from "./components/NodeCredsTable.vue";
import BrokerProfileManager from "./components/BrokerProfileManager.vue";
import BrokerStatusIndicator from "./components/BrokerStatusIndicator.vue";
import Toast from "primevue/toast";

const selectedApiKey = ref("");
</script>

<template>
  <Toast/>
  <div class="m-3">
    <div class="grid">
      <NodeCredsTable @update:selectedApiKey="selectedApiKey = $event" class="col-10 surface-200 border-round-md"/>
      <div class="col-2 flex flex-column gap-2">
        <div class="flex align-items-center justify-content-between">
          <BrokerStatusIndicator/>
          <BrokerProfileManager/>
        </div>
        <NodeCredsForm :selectedKey="selectedApiKey" class="surface-200 border-round-md"/>
      </div>
    </div>
  </div>
</template>
