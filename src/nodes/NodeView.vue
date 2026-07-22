<script setup lang="ts">
/**
 * NodeView.vue
 *
 * Master-detail view of broker nodes: a browsable node list on the left, the
 * selected node's metadata, import statistics, and resource properties on the right.
 */
import { ref } from "vue";
import Splitter from "primevue/splitter";
import SplitterPanel from "primevue/splitterpanel";
import BrokerNodeList from "./BrokerNodeList.vue";
import BrokerNodeViewer from "./BrokerNodeViewer.vue";

const selectedNodeId = ref<number | null>(null);
</script>

<template>
  <Splitter
    state-key="node-splitter"
    state-storage="local"
    style="height: calc(100vh - 7rem)"
  >
    <SplitterPanel :size="25" :min-size="15" class="overflow-hidden">
      <BrokerNodeList
        :selected-id="selectedNodeId"
        @select="selectedNodeId = $event"
      />
    </SplitterPanel>
    <SplitterPanel :size="75" :min-size="25" class="overflow-y-auto px-3">
      <BrokerNodeViewer :node-id="selectedNodeId" />
    </SplitterPanel>
  </Splitter>
</template>
