<script setup lang="ts">
/**
 * BrokerNodeList.vue
 *
 * Table of all broker nodes (id, common name, last contact), by id ascending,
 * with an id/name filter. Emits the id of the node the user selects.
 */
import { computed, onMounted, ref } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
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

const props = defineProps<{ selectedId: number | null }>();
const emit = defineEmits<{ (e: "select", id: number): void }>();

const nodes = ref<NodeListEntry[]>([]);
const filter = ref("");

const selectedRow = computed(
  () => nodes.value.find((n) => n.id === props.selectedId) ?? null
);

// Nodes whose id or CN contains the filter.
const filteredNodes = computed(() => {
  const q = filter.value.trim().toLowerCase();
  if (!q) return nodes.value;
  return nodes.value.filter((n) =>
    `${n.id} ${n.cn ?? ""}`.toLowerCase().includes(q)
  );
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
    <DataTable
      :value="filteredNodes"
      :selection="selectedRow"
      selectionMode="single"
      :metaKeySelection="false"
      dataKey="id"
      sortField="id"
      :sortOrder="1"
      scrollable
      scroll-height="calc(100vh - 12rem)"
      @row-select="emit('select', $event.data.id)"
    >
      <template #empty>
        {{ t("emptyNodeList") }}
      </template>

      <Column field="id" :header="t('nodeId')" :sortable="true">
        <template #body="{ data }">
          <span class="font-bold">#{{ data.id }}</span>
        </template>
      </Column>

      <Column field="cn" :header="t('cn')" :sortable="true">
        <template #body="{ data }">
          <span>{{ data.cn ?? "—" }}</span>
        </template>
      </Column>

      <Column field="lastContact" :header="t('lastContact')" :sortable="true">
        <template #body="{ data }">
          <span class="text-color-secondary text-sm">
            {{ formatDateToLocale(data.lastContact) }}
          </span>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
