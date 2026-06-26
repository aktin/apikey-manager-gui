<script setup lang="ts">
/**
 * RequestView.vue
 *
 * Master-detail view of broker requests: a browsable request list on the left,
 * the selected request's detail and per-node status on the right.
 */
import { ref } from "vue";
import BrokerRequestList from "../components/BrokerRequestList.vue";
import BrokerRequestViewer from "../components/BrokerRequestViewer.vue";

const selectedRequestId = ref<number | null>(null);
</script>

<template>
  <div class="grid">
    <div class="col-12 md:col-4 lg:col-3">
      <BrokerRequestList
        :selected-id="selectedRequestId"
        @select="selectedRequestId = $event"
      />
    </div>
    <div class="col-12 md:col-8 lg:col-9">
      <BrokerRequestViewer :request-id="selectedRequestId" />
    </div>
  </div>
</template>
