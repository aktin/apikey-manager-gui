<script setup lang="ts">
/**
 * BrokerRequestList.vue
 *
 * Lists all broker requests (id, series id, tags, publish date), newest first,
 * with a text filter over id, series id, and tags. Each row is a
 * RequestQuerySummary: series id and tags come from the request's cached query
 * definition, since the list endpoint returns only id and publish date. Emits
 * the id of the request the user selects.
 */
import { computed, onMounted, ref } from "vue";
import InputText from "primevue/inputtext";
import { useToast } from "primevue/usetoast";
import { useI18n } from "vue-i18n";
import BrokerConnection from "../services/BrokerConnection";
import { parseXmlBrokerRequestList } from "../utils/Parser";
import { RequestQuerySummary } from "../types/BrokerRequest";
import { notifyStatusError } from "../utils/StatusToast";
import { formatDateToLocale } from "../utils/MomentWrapper";
import SimpleChipList from "./SimpleChipList.vue";
import Tag from "primevue/tag";

const { t } = useI18n();
const toast = useToast();

defineProps<{ selectedId: number | null }>();
const emit = defineEmits<{ (e: "select", id: number): void }>();

const requests = ref<RequestQuerySummary[]>([]);
const filter = ref("");

// Requests whose id, series id, or tags contain the filter, newest first.
const filteredRequests = computed(() => {
  const q = filter.value.trim().toLowerCase();
  const list = q
    ? requests.value.filter((r) => searchText(r).includes(q))
    : requests.value;
  return [...list].sort(
    (a, b) => b.publishDate.getTime() - a.publishDate.getTime()
  );
});

// Text the filter matches against: request id, series id, and tags.
function searchText(row: RequestQuerySummary): string {
  return `${row.id} ${row.seriesId ?? ""} ${row.tags.join(" ")}`.toLowerCase();
}

// Bumped on every load so a superseded load's late results are discarded.
let loadGeneration = 0;

async function loadRequests() {
  const generation = ++loadGeneration;
  const resp = await BrokerConnection.getAllBrokerRequests();
  if (resp.status === 200) {
    const entries = parseXmlBrokerRequestList(resp.data);
    if (generation !== loadGeneration) return;
    // Placeholder rows render immediately; series id and tags fill in once
    // every request's query summary has resolved.
    requests.value = entries.map((e) => ({ ...e, seriesId: null, tags: [] }));
    const rows = await Promise.all(
      entries.map((e) => BrokerConnection.getRequestQuerySummary(e))
    );
    if (generation !== loadGeneration) return;
    requests.value = rows;
    return;
  }
  notifyStatusError(toast, t, resp.status, {});
}

onMounted(async () => {
  await BrokerConnection.waitForBrokerCredentials();
  await loadRequests();
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
      class="flex align-items-center gap-2 px-2 pb-1 border-bottom-1 surface-border text-xs font-bold text-color-secondary"
    >
      <span class="id-column">{{ t("requestId") }}</span>
      <span class="id-column">{{ t("seriesId") }}</span>
      <span class="flex-1">{{ t("tags") }}</span>
      <span>{{ t("publishDate") }}</span>
    </div>
    <div class="overflow-y-auto" style="max-height: calc(100vh - 10rem)">
      <div
        v-for="req in filteredRequests"
        :key="req.id"
        class="flex align-items-center gap-2 px-2 py-2 border-bottom-1 surface-border border-round cursor-pointer"
        :class="{ selected: req.id === selectedId }"
        @click="emit('select', req.id)"
      >
        <span class="font-bold id-column">#{{ req.id }}</span>
        <span class="id-column">
          <Tag
            v-if="req.seriesId != null"
            :value="req.seriesId"
            severity="warn"
          />
          <template v-else>—</template>
        </span>
        <div class="flex-1 flex flex-wrap">
          <SimpleChipList :chips="req.tags" />
        </div>
        <span class="text-color-secondary text-sm">
          {{ formatDateToLocale(req.publishDate) }}
        </span>
      </div>
      <div
        v-if="!filteredRequests.length"
        class="text-color-secondary text-center p-3"
      >
        {{ t("emptyRequestList") }}
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Colored highlight for the request whose detail is shown (PrimeVue's selection tint). */
.selected {
  background: var(--p-highlight-background);
  color: var(--p-highlight-color);
}

/* Fixed width for the id columns so header and rows stay aligned. */
.id-column {
  width: 4.5rem;
  flex-shrink: 0;
}
</style>
