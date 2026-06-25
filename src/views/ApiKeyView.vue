<script setup lang="ts">
/**
 * ApiKeyView.vue
 *
 * Route view for API-key management; hosts the API-key table, which carries its
 * own add/toggle controls in the header.
 */
import NodeCredsTable from "../components/NodeCredsTable.vue";
</script>

<template>
  <div class="surface-200 border-round-md">
    <NodeCredsTable />
  </div>
</template>
