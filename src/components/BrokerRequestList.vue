<script setup lang="ts">
/**
 * BrokerRequestList.vue
 *
 * Lists all broker requests (id + publish date), newest first, with an id
 * filter. Emits the id of the request the user selects.
 */
import { computed, onMounted, ref } from "vue";
import InputText from "primevue/inputtext";
import { useToast } from "primevue/usetoast";
import { useI18n } from "vue-i18n";
import BrokerConnection from "../services/BrokerConnection";
import { parseXmlBrokerRequestList } from "../utils/Parser";
import { RequestListEntry } from "../types/BrokerRequest";
import { notifyStatusError } from "../utils/StatusToast";
import { formatDateToLocale } from "../utils/MomentWrapper";

const { t } = useI18n();
const toast = useToast();

defineProps<{ selectedId: number | null }>();
const emit = defineEmits<{ (e: "select", id: number): void }>();

const requests = ref<RequestListEntry[]>([]);
const filter = ref("");

// Requests whose id contains the filter, newest first.
const filteredRequests = computed(() => {
  const q = filter.value.trim();
  const list = q
    ? requests.value.filter((r) => String(r.id).includes(q))
    : requests.value;
  return [...list].sort(
    (a, b) => b.publishDate.getTime() - a.publishDate.getTime()
  );
});

async function loadRequests() {
  const resp = await BrokerConnection.getAllBrokerRequests();
  if (resp.status === 200) {
    requests.value = parseXmlBrokerRequestList(resp.data);
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
    <InputText v-model="filter" :placeholder="t('requestId')" class="w-full" />
    <div class="overflow-y-auto" style="max-height: calc(100vh - 10rem)">
      <div
        v-for="req in filteredRequests"
        :key="req.id"
        class="flex justify-content-between align-items-center px-2 py-2 border-bottom-1 surface-border border-round cursor-pointer"
        :class="{ selected: req.id === selectedId }"
        @click="emit('select', req.id)"
      >
        <span class="font-bold">#{{ req.id }}</span>
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
</style>
