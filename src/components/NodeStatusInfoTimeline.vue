<script setup lang="ts">
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import {NodeStatusInfo} from "../types/BrokerRequest";
import {formatDateToLocale} from "../utils/MomentWrapper";
import Button from "primevue/button";
import OverlayPanel from "primevue/overlaypanel";
import Timeline from "primevue/timeline";

const {t} = useI18n();
const props = defineProps<{ nodeStatusInfo: NodeStatusInfo }>();
const timelinePanel = ref<InstanceType<typeof OverlayPanel> | null>(null);

const orderedStates = ["retrieved", "queued", "processing", "rejected", "completed", "failed", "expired"] as const;
type StateKey = typeof orderedStates[number];

const mostActualState = computed<StateKey | null>(() => {
  const nsi = props.nodeStatusInfo;
  let latestKey: StateKey | null = null;
  let latestDate: Date | null = null;
  for (const key of orderedStates) {
    const ts = nsi[key];
    if (ts && (!latestDate || ts > latestDate)) {
      latestDate = ts;
      latestKey = key;
    }
  }
  return latestKey;
});

const stateIcon = computed(() => {
  switch (mostActualState.value) {
    case "retrieved":
      return "pi pi-cloud-download";
    case "queued":
      return "pi pi-clock";
    case "processing":
      return "pi pi-spin pi-cog";
    case "rejected":
      return "pi pi-times-circle";
    case "completed":
      return "pi pi-check-circle";
    case "failed":
      return "pi pi-exclamation-triangle";
    case "expired":
      return "pi pi-hourglass";
    default:
      return "pi pi-question-circle";
  }
});

const stateColorClass = computed(() => {
  switch (mostActualState.value) {
    case "rejected":
      return "text-blue-500";
    case "completed":
      return "text-green-500";
    case "failed":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
});

const statusArray = computed<{ status: string; date: string }[]>(() =>
    orderedStates
    .filter(k => props.nodeStatusInfo[k])
    .map(k => ({
      status: t(k) as string,
      date: formatDateToLocale(props.nodeStatusInfo[k]!)
    }))
);

function togglePanel(event: Event) {
  timelinePanel.value?.toggle(event);
}
</script>

<template>
  <Button :label="t(`${mostActualState}`)"
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
