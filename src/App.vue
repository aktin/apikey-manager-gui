<script setup lang="ts">
/**
 * Root component of the Electron + Vue 3 application.
 *
 * Renders the full UI layout, including:
 * - Credential table (NodeCredsTable)
 * - Status indicator (BrokerStatusIndicator)
 * - Credential form (NodeCredsForm)
 * - Profile manager dialog (BrokerProfileManager)
 * - Global toast notifications (PrimeVue)
 *
 * Manages the currently selected API key as shared state between components.
 */
import {ref} from "vue";
import NodeCredsForm from "./components/NodeCredsForm.vue";
import NodeCredsTable from "./components/NodeCredsTable.vue";
import BrokerProfileManager from "./components/BrokerProfileManager.vue";
import BrokerStatusIndicator from "./components/BrokerStatusIndicator.vue";
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Toast from "primevue/toast";

const selectedApiKey = ref("");
</script>

<template>
  <Toast/>
  <header class="surface-100 border-round-md">
    <div class="flex flex-wrap align-items-center justify-content-end gap-3 mr-3">
      <BrokerStatusIndicator/>
      <BrokerProfileManager/>
    </div>
  </header>
  <div class="m-3">
    <TabView class="border-solid">
      <TabPanel header="API Keys">
        <div class="grid">
          <NodeCredsTable
              @update:selectedApiKey="selectedApiKey = $event"
              class="col-10 surface-200 border-round-md"
          />
          <div class="col-2">
            <NodeCredsForm :selectedKey="selectedApiKey" class="surface-200 border-round-md"/>
          </div>
        </div>
      </TabPanel>
    </TabView>
  </div>
</template>
