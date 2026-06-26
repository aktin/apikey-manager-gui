<script setup lang="ts">
/**
 * NodeView.vue
 *
 * Master-detail view of broker nodes: a browsable node list on the left, the
 * selected node's metadata, import statistics, and resource properties on the right.
 */
import { ref } from "vue";
import BrokerNodeList from "../components/BrokerNodeList.vue";
import BrokerNodeViewer from "../components/BrokerNodeViewer.vue";

const selectedNodeId = ref<number | null>(null);
</script>

<template>
  <div class="grid">
    <div class="col-12 md:col-4 lg:col-3">
      <BrokerNodeList
        :selected-id="selectedNodeId"
        @select="selectedNodeId = $event"
      />
    </div>
    <div class="col-12 md:col-8 lg:col-9">
      <BrokerNodeViewer :node-id="selectedNodeId" />
    </div>
  </div>
</template>
