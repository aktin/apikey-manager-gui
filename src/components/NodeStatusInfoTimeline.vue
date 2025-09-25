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

const mostActualState = computed<string | null>(() => {
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
  return latestKey ? (t(`${latestKey}`) as string) : null;
});

const statusArray = computed<{ status: string; date: string }[]>(() =>
    orderedStates
    .filter((k) => props.nodeStatusInfo[k])
    .map((k) => {
      const d = props.nodeStatusInfo[k]!;
      return {
        status: t(`${k}`) as string,
        date: formatDateToLocale(d),
      };
    })
);

function togglePanel(event: Event) {
  timelinePanel.value?.toggle(event);
}
</script>

<template>
  <Button
      @click="togglePanel"
      plain
      text
      v-tooltip.bottom="t('openStatusTimeline')"
  >
    {{ mostActualState }}
  </Button>

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