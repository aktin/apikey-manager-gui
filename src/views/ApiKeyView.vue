<script setup lang="ts">
/**
 * ApiKeyView.vue
 *
 * Route view for API-key management; pairs the key table with the add/toggle
 * form and shares the selected key between them.
 */
import { ref } from "vue";
import NodeCredsTable from "../components/NodeCredsTable.vue";
import NodeCredsForm from "../components/NodeCredsForm.vue";

const selectedApiKey = ref("");
</script>

<template>
  <div class="grid">
    <div class="col-10 surface-200 border-round-md">
      <NodeCredsTable @update:selectedApiKey="selectedApiKey = $event" />
    </div>
    <div class="col-2">
      <NodeCredsForm :selectedKey="selectedApiKey" />
    </div>
  </div>
</template>
