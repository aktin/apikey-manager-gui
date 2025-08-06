<script setup lang="ts">
import {ref} from "vue";
import NodeCredentialsForm from "./components/NodeCredentialsForm.vue";
import NodeCredentialsTable from "./components/NodeCredentialsTable.vue";
import BrokerProfileManager from "./components/BrokerProfileManager.vue";
import BrokerStatusIndicator from "./components/BrokerStatusIndicator.vue";
import Toast from "primevue/toast";

const selectedApiKey = ref("");
</script>

<template>
  <Toast/>
  <div class="m-3">
    <div class="grid">
      <NodeCredentialsTable @update:selectedApiKey="selectedApiKey = $event" class="col-10 surface-200 border-round-md"/>
      <div class="col-2">
        <BrokerStatusIndicator/>
        <BrokerProfileManager/>
        <NodeCredentialsForm :selectedKey="selectedApiKey" class="surface-200 border-round-md"/>
      </div>
    </div>
  </div>
</template>
