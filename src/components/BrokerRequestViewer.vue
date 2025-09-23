<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import BrokerConnection from "../services/BrokerConnection";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Checkbox from "primevue/checkbox";
import InputText from "primevue/inputtext";
import {FilterMatchMode} from "primevue/api";
import {useToast} from "primevue/usetoast";
import {useI18n} from "vue-i18n";
import {createErrorToast} from "../services/ToastWrapper";
import BrokerRequestViewer from "./BrokerRequestViewer.vue";
import Button from 'primevue/button'

const id = ref<string>('')
const loading = ref(false)
const error = ref<string | null>(null)
const request = ref<{ status: number; data: string } | null>(null)

async function submit() {
  error.value = null
  const n = Number(id.value.trim())
  if (!Number.isInteger(n) || n <= 0) {
    error.value = 'Enter a positive integer.'
    request.value = null
    return
  }
  loading.value = true
  try {
    request.value = await BrokerConnection.getBrokerRequest(String(n))
  } catch {
    error.value = 'Request failed.'
    request.value = null
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await BrokerConnection.waitForBrokerCredentials();
  request.value = await BrokerConnection.getBrokerRequest("1")
  BrokerConnection.onCredentialsChange(async () => {
    //await TODO
  });
});
</script>


<template>
  <form class="flex align-items-center gap-2" @submit.prevent="submit">
    <InputText v-model="id" placeholder="Request ID" @keydown.enter.prevent="submit" />
    <Button label="Search" :disabled="loading || !/^[1-9]\d*$/.test(id)" @click="submit" />
  </form>

  <div v-if="error" class="mt-2 p-error">{{ error }}</div>

  <div v-if="request" class="mt-3">
    <div>Status: {{ request.status }}</div>
    <pre class="surface-100 p-2 border-round" style="white-space: pre-wrap">{{ request.data }}</pre>
  </div>
</template>
