<script setup lang="ts">
/**
 * BrokerNodeViewer.vue
 *
 * Shows a selected broker node's metadata, import statistics, and properties
 * resources (versions, import-scripts). The node is chosen by the `nodeId` prop;
 * nothing is fetched while it is null. Resource paths are fixed in the UI, while
 * the fetching service is generic.
 */
import { onMounted, Ref, ref, watch } from "vue";
import BrokerConnection from "../services/BrokerConnection";
import { useToast } from "primevue/usetoast";
import { useI18n } from "vue-i18n";
import {
  parseXmlBrokerNode,
  parseXmlNodeStats,
  parseXmlProperties
} from "../utils/Parser";
import { BrokerNode, NodeStats, PropertyEntry } from "../types/BrokerNode";
import { notifyStatusError } from "../utils/StatusToast";
import { formatDateToLocale } from "../utils/MomentWrapper";
import SimpleChipList from "./SimpleChipList.vue";
import Panel from "primevue/panel";

const { t } = useI18n();
const toast = useToast();

const props = defineProps<{ nodeId: number | null }>();

/** Resource paths shown in the UI; the fetching service stays generic. */
const RESOURCE_PATHS = ["versions", "import-scripts"];

const node: Ref<BrokerNode | null> = ref(null);
const stats: Ref<NodeStats | null> = ref(null);
const resources = ref<{ path: string; entries: PropertyEntry[] | null }[]>([]);
const errorsCollapsed = ref(true);

/** Loads metadata, stats, and resource properties for the current node id. */
async function loadNode() {
  node.value = null;
  stats.value = null;
  resources.value = [];
  if (props.nodeId == null) return;
  const id = String(props.nodeId);
  await Promise.all([fetchNode(id), fetchStats(id), fetchResources(id)]);
}

async function fetchNode(id: string) {
  const resp = await BrokerConnection.getBrokerNode(id);
  if (resp.status === 200) {
    node.value = parseXmlBrokerNode(resp.data);
    return;
  }
  notifyStatusError(toast, t, resp.status, {
    404: { title: "notFound", message: "nodeNotFound" }
  });
}

// Stats may be absent for a node; leave null so the card reads "not available".
async function fetchStats(id: string) {
  const resp = await BrokerConnection.getBrokerNodeStats(id);
  if (resp.status === 200) stats.value = parseXmlNodeStats(resp.data);
}

async function fetchResources(id: string) {
  resources.value = await Promise.all(
    RESOURCE_PATHS.map(async (path) => {
      const resp = await BrokerConnection.getBrokerNodeResource(id, path);
      return {
        path,
        entries:
          resp.status === 200 && resp.data
            ? parseXmlProperties(resp.data)
            : null
      };
    })
  );
}

onMounted(async () => {
  await BrokerConnection.waitForBrokerCredentials();
  await loadNode();
});

watch(() => props.nodeId, loadNode);
</script>

<template>
  <div v-if="props.nodeId == null" class="text-color-secondary text-center p-5">
    {{ t("selectNodeHint") }}
  </div>

  <template v-else-if="node">
    <div class="surface-0 p-3 border-round">
      <h2 class="m-0 text-2xl font-bold line-height-2">
        [{{ node.id }}] {{ node.cn ?? "—" }}
      </h2>
      <SimpleChipList v-if="node.modules.length" :chips="node.modules" />
    </div>

    <div class="flex flex-wrap gap-3 mt-3">
      <div class="p-3 metadata-panel">
        <div class="text-xs uppercase font-bold text-color-secondary mb-2">
          {{ t("nodeSection") }}
        </div>
        <div v-if="node.o" class="flex justify-content-between gap-3 py-1">
          <span class="text-color-secondary">{{ t("o") }}</span>
          <span class="text-right">{{ node.o }}</span>
        </div>
        <div v-if="node.l" class="flex justify-content-between gap-3 py-1">
          <span class="text-color-secondary">{{ t("l") }}</span>
          <span>{{ node.l }}</span>
        </div>
        <div class="flex justify-content-between gap-3 py-1">
          <span class="text-color-secondary">WebSocket</span>
          <span>{{ node.websocket ? t("yes") : t("no") }}</span>
        </div>
      </div>

      <div class="p-3 metadata-panel">
        <div class="text-xs uppercase font-bold text-color-secondary mb-2">
          {{ t("activitySection") }}
        </div>
        <div class="flex justify-content-between gap-3 py-1">
          <span class="text-color-secondary">{{ t("lastContact") }}</span>
          <span>{{ formatDateToLocale(node.lastContact) }}</span>
        </div>
        <div
          v-if="stats?.start"
          class="flex justify-content-between gap-3 py-1"
        >
          <span class="text-color-secondary">{{ t("lastStart") }}</span>
          <span>{{ formatDateToLocale(stats.start) }}</span>
        </div>
        <div
          v-if="stats?.lastWrite"
          class="flex justify-content-between gap-3 py-1"
        >
          <span class="text-color-secondary">{{ t("lastImport") }}</span>
          <span>{{ formatDateToLocale(stats.lastWrite) }}</span>
        </div>
        <div
          v-if="stats?.lastReject"
          class="flex justify-content-between gap-3 py-1"
        >
          <span class="text-color-secondary">{{ t("lastError") }}</span>
          <span>{{ formatDateToLocale(stats.lastReject) }}</span>
        </div>
      </div>

      <div class="p-3 metadata-panel">
        <div class="text-xs uppercase font-bold text-color-secondary mb-2">
          {{ t("importStatistics") }}
        </div>
        <template v-if="stats">
          <div class="flex justify-content-between gap-3 py-1">
            <span class="text-color-secondary">{{ t("imported") }}</span>
            <span>{{ stats.imported }}</span>
          </div>
          <div class="flex justify-content-between gap-3 py-1">
            <span class="text-color-secondary">{{ t("updated") }}</span>
            <span>{{ stats.updated }}</span>
          </div>
          <div class="flex justify-content-between gap-3 py-1">
            <span class="text-color-secondary">{{ t("invalid") }}</span>
            <span>{{ stats.invalid }}</span>
          </div>
          <div class="flex justify-content-between gap-3 py-1">
            <span class="text-color-secondary">{{ t("failed") }}</span>
            <span>{{ stats.failed }}</span>
          </div>
        </template>
        <div v-else class="text-color-secondary text-sm">
          {{ t("notAvailable") }}
        </div>
      </div>
    </div>

    <Panel
      v-if="stats && stats.lastErrors.length"
      v-model:collapsed="errorsCollapsed"
      toggleable
      class="mt-3"
    >
      <template #header>
        <span
          class="flex-1 cursor-pointer font-bold"
          @click="errorsCollapsed = !errorsCollapsed"
        >
          {{ t("errorDetails") }} ({{ stats.lastErrors.length }})
        </span>
      </template>
      <div v-for="(err, index) in stats.lastErrors" :key="index" class="py-1">
        <div>{{ err.message }}</div>
        <div class="text-color-secondary text-sm">
          <span v-if="err.repeats != null">{{ err.repeats }}×</span>
          <span v-if="err.timestamp" class="ml-2">
            {{ formatDateToLocale(err.timestamp) }}
          </span>
        </div>
      </div>
    </Panel>

    <div
      v-for="res in resources"
      :key="res.path"
      class="p-3 border-round mt-3 panel"
    >
      <div class="text-xs uppercase font-bold text-color-secondary mb-2">
        {{ res.path }}
      </div>
      <div v-if="res.entries && res.entries.length" class="flex flex-column">
        <div
          v-for="entry in res.entries"
          :key="entry.key"
          class="flex justify-content-between py-1"
        >
          <span class="text-color-secondary">{{ entry.key }}</span>
          <span>{{ entry.value }}</span>
        </div>
      </div>
      <div v-else class="text-color-secondary text-sm">
        {{ t("notAvailable") }}
      </div>
    </div>
  </template>
</template>

<style scoped>
/*
 * Elevated surface for the stat and resource cards (PrimeVue's Card pattern):
 * a grey fill plus a soft shadow, no border (a border + border-radius renders
 * "dog-ear" corner artifacts in Chromium). The shadow keeps the cards legible
 * regardless of the page background.
 */
.panel {
  background: var(--p-surface-100);
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

/*
 * Metadata panels wrap by container width (flex-basis + flex-wrap) instead of
 * a viewport breakpoint, so they restructure correctly when the splitter
 * shrinks the detail panel while the window stays wide.
 */
.metadata-panel {
  flex: 1 1 16rem;
  min-width: 0;
  background: var(--p-surface-100);
  border-radius: var(--p-content-border-radius);
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}
</style>
