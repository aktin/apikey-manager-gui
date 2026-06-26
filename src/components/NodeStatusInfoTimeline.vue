<script setup lang="ts">
/**
 * NodeStatusInfoTimeline.vue
 *
 * Shows a node's most recent processing state as a button that opens a
 * chronological timeline of its status timestamps.
 */
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { NodeStatusInfo } from "../types/BrokerRequest";
import { formatDateToLocale } from "../utils/MomentWrapper";
import {
  NODE_STATE_ORDER,
  getMostActualState,
  nodeStateColorClass,
  nodeStateIcon
} from "../utils/NodeStatus";
import Button from "primevue/button";
import OverlayPanel from "primevue/overlaypanel";
import Timeline from "primevue/timeline";

const { t } = useI18n();
const props = defineProps<{ nodeStatusInfo: NodeStatusInfo }>();
const timelinePanel = ref<InstanceType<typeof OverlayPanel> | null>(null);

const mostActualState = computed(() =>
  getMostActualState(props.nodeStatusInfo)
);
const stateIcon = computed(() => nodeStateIcon(mostActualState.value));
const stateColorClass = computed(() =>
  nodeStateColorClass(mostActualState.value)
);

const statusArray = computed<{ status: string; date: string }[]>(() =>
  NODE_STATE_ORDER.filter((k) => props.nodeStatusInfo[k]).map((k) => ({
    status: t(k) as string,
    date: formatDateToLocale(props.nodeStatusInfo[k]!)
  }))
);

function togglePanel(event: Event) {
  timelinePanel.value?.toggle(event);
}
</script>

<template>
  <Button
    :label="t(`${mostActualState}`)"
    :icon="stateIcon"
    :class="stateColorClass"
    @click="togglePanel"
    text
    v-tooltip.bottom="t('openStatusTimeline')"
  />
  <OverlayPanel ref="timelinePanel" showCloseIcon>
    <Timeline :value="statusArray">
      <template #opposite="{ item }">
        <small>{{ item.date }}</small>
      </template>
      <template #content="{ item }">
        <small>{{ item.status }}</small>
      </template>
    </Timeline>
  </OverlayPanel>
</template>
