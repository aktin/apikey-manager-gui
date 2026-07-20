<script setup lang="ts">
/**
 * BrokerRequestList.vue
 *
 * Table of all broker requests (id, series id, tags, publish date), newest
 * first, with a text filter over id, series id, and tags. Each row is a
 * RequestQuerySummary: series id and tags come from the request's cached query
 * definition, since the list endpoint returns only id and publish date. Emits
 * the id of the request the user selects.
 */
import { computed, onMounted, ref } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import InputText from "primevue/inputtext";
import { useToast } from "primevue/usetoast";
import { useI18n } from "vue-i18n";
import BrokerConnection from "../services/BrokerConnection";
import { parseXmlBrokerRequestList } from "../utils/Parser";
import { RequestQuerySummary } from "../types/BrokerRequest";
import { notifyStatusError } from "../utils/StatusToast";
import { formatDateToLocale } from "../utils/MomentWrapper";
import SimpleChipList from "./SimpleChipList.vue";
import CreateQueryForm from "./CreateQueryForm.vue";
import Tag from "primevue/tag";

const { t } = useI18n();
const toast = useToast();

const props = defineProps<{ selectedId: number | null }>();
const emit = defineEmits<{ (e: "select", id: number): void }>();

const requests = ref<RequestQuerySummary[]>([]);
const filter = ref("");

const selectedRow = computed(
  () => requests.value.find((r) => r.id === props.selectedId) ?? null
);

// Requests whose id, series id, or tags contain the filter.
const filteredRequests = computed(() => {
  const q = filter.value.trim().toLowerCase();
  if (!q) return requests.value;
  return requests.value.filter((r) => searchText(r).includes(q));
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
    requests.value = entries.map((e) => ({
      ...e,
      seriesId: null,
      tags: []
    }));
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
  <div class="flex flex-column">
    <div class="flex align-items-center m-2">
      <InputText
        v-model="filter"
        :placeholder="t('keywordSearch')"
        class="w-full"
      />
      <div class="flex align-items-center m-2">
        <CreateQueryForm :requests="requests" @created="loadRequests" />
      </div>
    </div>
    <DataTable
      :value="filteredRequests"
      :selection="selectedRow"
      selectionMode="single"
      :metaKeySelection="false"
      dataKey="id"
      sortField="publishDate"
      :sortOrder="-1"
      scrollable
      scroll-height="calc(100vh - 12rem)"
      @row-select="emit('select', $event.data.id)"
    >
      <template #empty>
        {{ t("emptyRequestList") }}
      </template>

      <Column field="id" :header="t('requestId')" :sortable="true">
        <template #body="{ data }">
          <span class="font-bold">#{{ data.id }}</span>
        </template>
      </Column>

      <Column field="seriesId" :header="t('seriesId')" :sortable="true">
        <template #body="{ data }">
          <div class="flex justify-content-center">
            <Tag
              v-if="data.seriesId != null"
              :value="data.seriesId"
              severity="warn"
            />
            <span v-else>—</span>
          </div>
        </template>
      </Column>

      <Column :header="t('tags')">
        <template #body="{ data }">
          <SimpleChipList :chips="data.tags" />
        </template>
      </Column>

      <Column field="publishDate" :header="t('publishDate')" :sortable="true">
        <template #body="{ data }">
          <span class="text-color-secondary text-sm">
            {{ formatDateToLocale(data.publishDate) }}
          </span>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
