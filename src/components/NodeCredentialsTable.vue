<script setup lang="ts">
import {onMounted, ref, watch} from 'vue';
import BrokerConnection from './BrokerConnection';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import {FilterMatchMode} from 'primevue/api';
import {useToast} from 'primevue/usetoast';
import {useI18n} from 'vue-i18n';

const toast = useToast();
const {t} = useI18n();

const apiKeyList = ref<Record<string, any>[]>([]);
const selectedRow = ref<Record<string, any> | null>(null);
const selectedApiKey = ref<string>("");

const emit = defineEmits<{ (e: 'update:selectedApiKey', value: string): void }>();

const filters = ref({
  global: {value: null, matchMode: FilterMatchMode.CONTAINS}
});

const toastLife = 5000;

function createErrorToast(title, detail) {
  toast.add({severity: "error", summary: title, detail, life: toastLife})
}

function formatApiKeyList(textBlock: string): Record<string, any>[] {
  if (!textBlock) return [];
  return textBlock
  .trim()
  .split("\n")
  .filter(line => !line.includes("OU"))
  .map(line => {
    const idx = line.indexOf("=");
    const apiKey = line.slice(0, idx);
    const dn = line.slice(idx + 1);
    const parts = dn.split(",");
    const row: Record<string, any> = {apiKey, isActive: true};
    for (const part of parts) {
      if (part.includes("=")) {
        const [key, value] = part.split("=");
        row[key] = value;
      } else if (part === "INACTIVE") {
        row.isActive = false;
      }
    }
    return row;
  });
}

async function fetchAndFormatApiKeyList(): Promise<Record<string, any>[]> {
  const result = await BrokerConnection.getApiKeys();
  switch (result.status) {
    case 200:
      return formatApiKeyList(result.data);
    default:
      createErrorToast(t("connectionError"), t("noConnection"));
      return [];
  }
}

async function updateApiKeyList() {
  apiKeyList.value = await fetchAndFormatApiKeyList();
}

onMounted(async () => {
  await updateApiKeyList();
  BrokerConnection.onApiKeysChange(async () => {
    await updateApiKeyList();
  });
});


//checks which API Key has been selected and tells other classes
watch(selectedRow, (newVal) => {
  selectedApiKey.value = newVal ? `${newVal.apiKey};${newVal.isActive}` : "";
  emit("update:selectedApiKey", selectedApiKey.value);
});

</script>

<template>
  <DataTable
      v-model:selection="selectedRow"
      v-model:filters="filters"
      :value="apiKeyList"
      selectionMode="single"
      :metaKeySelection="false"
      scrollable
      style="max-height: 55rem"
      scroll-height="flex"
      :globalFilterFields="['CN', 'O', 'L']"
      filterDisplay="row"
  >
    <template #empty>{{ t("table.emptyList") }}</template>
    <template #header>
      <InputText v-model="filters['global'].value" :placeholder="t('table.keywordSearch')" class="text-base text-color surface-overlay p-2 input_Field"/>
      <i v-tooltip="t('table.keywordSearchInfo')" class="pi pi-info-circle p-2"/>
    </template>

    <Column field="apiKey" header="API Key" style="width: 10%"/>
    <Column field="CN" :header="t('commonName')" sortable="True" style="width: 35%"/>
    <Column field="O" :header="t('organization')" sortable="True" style="width: 35%"/>
    <Column field="L" :header="t('location')" sortable="True" style="width: 10%"/>

    <Column field="isActive" :header="t('table.status')" style="width: 10%">
      <template #body="{ data }">
        <div class="flex justify-content-center">
          <i v-if="data.isActive === true" v-tooltip="t('table.apiKeyActive')" class="pi pi-check-circle text-green-500"/>
          <i v-else-if="data.isActive === false" v-tooltip="t('table.apiKeyInactive')" class="pi pi-times-circle text-red-500"/>
          <i v-else v-tooltip="t('table.statusUnknown')" class="pi pi-question-circle text-gray-400"/>
        </div>
      </template>
    </Column>
  </DataTable>
</template>
