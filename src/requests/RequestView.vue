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
import BrokerRequestList from "./BrokerRequestList.vue";
import BrokerRequestViewer from "./BrokerRequestViewer.vue";

const selectedRequestId = ref<number | null>(null);
const requestList = ref<InstanceType<typeof BrokerRequestList> | null>(null);

/** Clears the selection and reloads the list after a request was deleted. */
async function onRequestDeleted() {
  selectedRequestId.value = null;
  await requestList.value?.reload();
}
</script>

<template>
  <Splitter
    state-key="request-splitter"
    state-storage="local"
    style="height: calc(100vh - 7rem)"
  >
    <SplitterPanel :size="25" :min-size="15" class="overflow-hidden">
      <BrokerRequestList
        ref="requestList"
        :selected-id="selectedRequestId"
        @select="selectedRequestId = $event"
      />
    </SplitterPanel>
    <SplitterPanel :size="75" :min-size="25" class="overflow-y-auto px-3">
      <BrokerRequestViewer
        :request-id="selectedRequestId"
        @deleted="onRequestDeleted"
      />
    </SplitterPanel>
  </Splitter>
</template>
