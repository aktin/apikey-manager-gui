<script setup lang="ts">
import {ref} from "vue";
import NodeCredsTable from "../components/NodeCredsTable.vue";
import NodeCredsForm from "../components/NodeCredsForm.vue";

const selectedApiKey = ref("");
</script>

<template>
  <div class="grid">
    <div class="col-10 surface-200 border-round-md">
      <NodeCredsTable @update:selectedApiKey="selectedApiKey = $event"/>
    </div>
    <div class="col-2">
      <NodeCredsForm :selectedKey="selectedApiKey"/>
    </div>
  </div>
</template>
