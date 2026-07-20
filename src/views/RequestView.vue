<script setup lang="ts">
/**
 * RequestView.vue
 *
 * Master-detail view of broker requests: a browsable request list on the left,
 * the selected request's detail and per-node status on the right.
 */
import { ref } from "vue";
import Splitter from "primevue/splitter";
import SplitterPanel from "primevue/splitterpanel";
import BrokerRequestList from "../components/BrokerRequestList.vue";
import BrokerRequestViewer from "../components/BrokerRequestViewer.vue";

const selectedRequestId = ref<number | null>(null);
</script>

<template>
  <Splitter
    state-key="request-splitter"
    state-storage="local"
    style="height: calc(100vh - 7rem)"
  >
    <SplitterPanel :size="25" :min-size="15" class="overflow-hidden">
      <BrokerRequestList
        :selected-id="selectedRequestId"
        @select="selectedRequestId = $event"
      />
    </SplitterPanel>
    <SplitterPanel :size="75" :min-size="25" class="overflow-y-auto px-3">
      <BrokerRequestViewer :request-id="selectedRequestId" />
    </SplitterPanel>
  </Splitter>
</template>
