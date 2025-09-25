<script setup lang="ts">
import {onMounted, Ref, ref} from "vue";
import BrokerConnection from "../services/BrokerConnection";
import InputText from "primevue/inputtext";
import {useToast} from "primevue/usetoast";
import {useI18n} from "vue-i18n";
import Button from "primevue/button"
import {parseXmlBrokerRequest} from "../utils/Parser";
import BrokerRequest from "../types/BrokerRequest";
import {createErrorToast, createSuccessToast} from "../utils/ToastWrapper";
import {formatDateToLocale, formatDurationToHumanReadable} from "../utils/MomentWrapper";
import FloatLabel from "primevue/floatlabel";

const {t} = useI18n()
const toast = useToast()

const id = ref("")
const invalidId = ref(false);
const requestData: Ref<BrokerRequest | null> = ref(null);

const idPattern = /^[1-9]\d*$/;

async function fetchRequest() {
  invalidId.value = false
  if (!idPattern.test(id.value)) {
    createErrorToast(toast, t("inputError"), t("invalidRequestIdError"));
    invalidId.value = true;
    return
  }
  const resp = await BrokerConnection.getBrokerRequest(id.value)
  switch (resp.status) {
    case 200:
      createSuccessToast(toast, t("success"), t("requestFound"));
      requestData.value = parseXmlBrokerRequest(resp.data);
      return;
    case 404:
      createErrorToast(toast, t("notFound"), t("requestNotFound"));
      break;
    case 401:
      createErrorToast(toast, t("accessDenied"), t("noAuthorization"));
      break;
    case 500:
      createErrorToast(toast, t("serverError"), t("serverErrorOccurred"));
      break;
    default:
      createErrorToast(toast, t("unexpectedError"), t("unexpectedErrorOccurred", {code: resp.status}));
  }
}

onMounted(async () => {
  await BrokerConnection.waitForBrokerCredentials();
});
</script>

<template>
  <div class="flex flex-column align-items-center justify-content-center gap-3 p-3">
    <div class="flex gap-2">
      <FloatLabel class="w-full">
        <InputText id="requestIdInput"
                   v-model="id"
                   :invalid="invalidId"
                   @keydown.enter.prevent="fetchRequest"/>
        <label for="requestIdInput">{{ t("requestId") }}</label>
      </FloatLabel>
      <Button icon="pi pi-search"
              @click="fetchRequest"
              v-tooltip.right="t('fetchRequest')"/>
    </div>
  </div>

  <div v-if="requestData" class="surface-100 p-3 border-round col-8">
    <h3>{{ requestData.query.title }}</h3>
    <p><b>{{ t("referenceDate") }}:</b> {{ formatDateToLocale(requestData.referenceDate) }}</p>
    <p><b>{{ t("scheduledDate") }}:</b> {{ formatDateToLocale(requestData.scheduledDate) }}</p>
    <p><b>{{ t("principal") }}:</b>
      {{ requestData.query.principal.name }} – {{ requestData.query.principal.organization }} - ({{ requestData.query.principal.email }})
    </p>
    <p><b>{{ t("tags") }}:</b> {{ requestData.query.principal.tags.join(", ") }}</p>
    <p><b>{{ t("scheduleType") }}:</b> {{ formatDurationToHumanReadable(requestData.query.singleExecution?.duration) }}</p>
  </div>

  <pre> {{ requestData }} </pre>
</template>

<!--

OPTIONS {{broker-url}}/broker/request/1

<request xmlns="http://aktin.org/ns/exchange" id="1">
    <published>2025-09-23T14:31:49.976670Z</published>
    <targeted>true</targeted>
    <type>application/vnd.aktin.query.request+xml</type>
</request>


GET {{broker-url}}/broker/request/1/status

<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<request-status-list xmlns="http://aktin.org/ns/exchange">
    <request-status-info>
        <node>1</node>
        <deleted>2025-09-07T22:15:09.134904Z</deleted>
        <retrieved>2025-09-07T22:14:19.611Z</retrieved>
        <queued>2025-09-07T22:14:19.574Z</queued>
        <processing>2025-09-07T22:14:19.662Z</processing>
        <completed>2025-09-07T22:15:09.077Z</completed>
        <type>text/plain</type>
    </request-status-info>
    <request-status-info>
        <node>2</node>
    </request-status-info>

GET {{broker-url}}/broker/request/1/status/1

TEXT

-->