<script setup lang="ts">
/**
 * BrokerNodeList.vue
 *
 * Lists all broker nodes (id + CN), by id ascending, with an id/name filter.
 * Emits the id of the node the user selects.
 */
import { computed, onMounted, ref } from "vue";
import InputText from "primevue/inputtext";
import { useToast } from "primevue/usetoast";
import { useI18n } from "vue-i18n";
import BrokerConnection from "../services/BrokerConnection";
import { parseXmlBrokerNodeList } from "../utils/Parser";
import { NodeListEntry } from "../types/BrokerNode";
import { notifyStatusError } from "../utils/StatusToast";
import { formatDateToLocale } from "../utils/MomentWrapper";

const { t } = useI18n();
const toast = useToast();

defineProps<{ selectedId: number | null }>();
const emit = defineEmits<{ (e: "select", id: number): void }>();

const nodes = ref<NodeListEntry[]>([]);
const filter = ref("");

// Nodes whose id or CN contains the filter, by id ascending.
const filteredNodes = computed(() => {
  const q = filter.value.trim().toLowerCase();
  const list = q
    ? nodes.value.filter((n) =>
        `${n.id} ${n.cn ?? ""}`.toLowerCase().includes(q)
      )
    : nodes.value;
  return [...list].sort((a, b) => a.id - b.id);
});

async function loadNodes() {
  const resp = await BrokerConnection.getBrokerNodeList();
  if (resp.status === 200) {
    nodes.value = parseXmlBrokerNodeList(resp.data);
    return;
  }
  notifyStatusError(toast, t, resp.status, {});
}

onMounted(async () => {
  await BrokerConnection.waitForBrokerCredentials();
  await loadNodes();
});
</script>

<template>
  <div class="flex flex-column gap-2">
    <InputText
      v-model="filter"
      :placeholder="t('keywordSearch')"
      class="w-full"
    />
    <div
      class="flex justify-content-between px-2 pb-1 border-bottom-1 surface-border text-xs font-bold text-color-secondary"
    >
      <span>{{ t("nodes") }}</span>
      <span>{{ t("lastContact") }}</span>
    </div>
    <div class="overflow-y-auto" style="max-height: calc(100vh - 10rem)">
      <div
        v-for="node in filteredNodes"
        :key="node.id"
        class="flex justify-content-between align-items-center px-2 py-2 border-bottom-1 surface-border border-round cursor-pointer"
        :class="{ selected: node.id === selectedId }"
        @click="emit('select', node.id)"
      >
        <span class="font-bold">[{{ node.id }}] {{ node.cn ?? "—" }}</span>
        <span class="text-color-secondary text-sm">
          {{ formatDateToLocale(node.lastContact) }}
        </span>
      </div>
      <div
        v-if="!filteredNodes.length"
        class="text-color-secondary text-center p-3"
      >
        {{ t("emptyNodeList") }}
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Colored highlight for the node whose detail is shown (PrimeVue's selection tint). */
.selected {
  background: var(--p-highlight-background);
  color: var(--p-highlight-color);
}
</style>
