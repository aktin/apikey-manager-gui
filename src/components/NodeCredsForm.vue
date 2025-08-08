<script setup lang="ts">
import {computed, defineProps, Ref, ref, watch} from "vue";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import FloatLabel from "primevue/floatlabel";
import BrokerConnection from "../services/BrokerConnection";
import {useToast} from "primevue/usetoast";
import {createErrorToast, createSuccessToast} from "../services/ToastWrapper";
import {useI18n} from "vue-i18n";

const {t} = useI18n();
const toast = useToast();

const apiKey = ref("");
const cn = ref("");
const org = ref("");
const loc = ref("");

const invalidApiKey = ref(false);
const invalidCN = ref(false);
const invalidOrg = ref(false);
const invalidLoc = ref(false);

const apiKeyLength = 16;
const apiKeyPattern = /[^a-zA-Z0-9]/;
const dnPattern = /[^a-zA-Z0-9 -]/;

const props = defineProps<{ selectedKey: string }>();
const selectedKey = ref(props.selectedKey);

const isAddButtonActive = computed(() => apiKey.value.trim() !== "" && cn.value.trim() !== "" && org.value.trim() !== "" && loc.value.trim() !== "");
const isChangeStateButtonActive = computed(() => selectedKey.value !== "");

function validateField(value: string, flag: Ref<boolean>, localeKey: string, pattern: RegExp) {
  if (pattern.test(value)) {
    createErrorToast(toast, t("common.inputError"), t("common.symbolError", {fieldName: t(localeKey)}));
    flag.value = true;
  }
}

function validate() {
  invalidApiKey.value = false;
  invalidCN.value = false;
  invalidOrg.value = false;
  invalidLoc.value = false;

  if (apiKey.value.length !== apiKeyLength) {
    createErrorToast(toast, t("common.inputError"), t("form.keyLengthError", {length: apiKeyLength}));
    invalidApiKey.value = true;
  } else {
    validateField(apiKey.value, invalidApiKey, "common.key", apiKeyPattern);
  }
  validateField(cn.value, invalidCN, "common.cn", dnPattern);
  validateField(org.value, invalidOrg, "common.o", dnPattern);
  validateField(loc.value, invalidLoc, "common.l", dnPattern);
}

async function addNewKey() {
  validate();
  if (invalidApiKey.value || invalidCN.value || invalidOrg.value || invalidLoc.value) return;
  const payload = `CN=${cn.value},O=${org.value},L=${loc.value}`;
  const xml = `<ApiKeyCred><apiKey>${apiKey.value}</apiKey><clientDn>${payload}</clientDn></ApiKeyCred>`;
  const status = await BrokerConnection.addApiKey(xml);
  switch (status) {
    case 201:
      createSuccessToast(toast, t("common.success"), t("form.apiKeyAdded"));
      break;
    case 404:
      createErrorToast(toast, t("form.notFound"), t("form.noList"));
      break;
    case 401:
      createErrorToast(toast, t("common.accessDenied"), t("form.noAuthorization"));
      break;
    case 409:
      createErrorToast(toast, t("form.conflict"), t("form.apiKeyAlreadyExists"));
      break;
    case 500:
      createErrorToast(toast, t("common.serverError"), t("common.serverErrorText"));
      break;
    default:
      createErrorToast(toast, t("common.unexpectedError"), t("common.unexpectedErrorText", {code: status}));
  }
}

async function changeKeyState() {
  const [key, isActive] = selectedKey.value.split(";");
  selectedKey.value = "";
  const status = isActive === "false" ? await BrokerConnection.activateApiKey(key) : await BrokerConnection.deactivateApiKey(key);
  switch (status) {
    case 200:
      createSuccessToast(toast, t("common.success"), isActive === "false" ? t("form.apiKeyActivated") : t("form.apiKeyDeactivated"));
      break;
    case 404:
      createErrorToast(toast, t("form.notFound"), t("form.noApiKey"));
      break;
    case 401:
      createErrorToast(toast, t("common.accessDenied"), t("form.noAuthorization"));
      break;
    case 500:
      createErrorToast(toast, t("common.serverError"), t("common.serverErrorText"));
      break;
    default:
      createErrorToast(toast, t("common.unexpectedError"), t("common.unexpectedErrorText", {code: status}));
  }
}

function generateApiKey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  apiKey.value = Array.from({length: apiKeyLength}, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
}

watch(() => props.selectedKey, (val) => {
  selectedKey.value = val;
});
</script>

<template>
  <div class="p-3 surface-200 border-round-md w-full">
    <div class="flex align-items-center gap-2 mt-3">
      <FloatLabel class="w-full">
        <InputText id="apiInput" v-model="apiKey" :invalid="invalidApiKey" class="w-full"/>
        <label for="apiInput">{{ t("common.key") }}</label>
      </FloatLabel>
      <Button icon="pi pi-sync" v-tooltip="t('form.generateKey')" @click="generateApiKey" class="flex-shrink-0"/>
    </div>

    <FloatLabel class="mt-5 w-full">
      <InputText id="nameInput" v-model="cn" :invalid="invalidCN" class="w-full"/>
      <label for="nameInput">{{ t("common.cn") }}</label>
    </FloatLabel>

    <FloatLabel class="mt-5 w-full">
      <InputText id="orgInput" v-model="org" :invalid="invalidOrg" class="w-full"/>
      <label for="orgInput">{{ t("common.o") }}</label>
    </FloatLabel>

    <FloatLabel class="mt-5 w-full">
      <InputText id="locInput" v-model="loc" :invalid="invalidLoc" class="w-full"/>
      <label for="locInput">{{ t("common.l") }}</label>
    </FloatLabel>

    <div class="flex flex-wrap justify-content-between mt-4 gap-2">
      <Button
          :label="t('form.addAPIKey')"
          @click="addNewKey"
          :disabled="!isAddButtonActive"
          class="text-sm"/>
      <Button
          :label="selectedKey.split(';')[1] === 'true' ? t('form.deactivateKey') : t('form.activateKey')"
          @click="changeKeyState"
          :disabled="!isChangeStateButtonActive"
          :severity="selectedKey.split(';')[1] === 'true' ? 'danger' : 'success'"
          class="text-sm"/>
    </div>
  </div>
</template>
