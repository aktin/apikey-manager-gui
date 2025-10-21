<script setup lang="ts">
/**
 * NodeCredsForm.vue
 *
 * Form component to add new API keys or activate/deactivate existing ones.
 *
 * Features:
 * - Validates API key and DN components (CN, O, L) on input
 * - Generates a secure random API key
 * - Submits a formatted XML payload to the broker
 * - Enables status toggle of the selected key
 * - Displays toast messages on success/error
 *
 * Props:
 * - `selectedKey`: A semicolon-delimited string of the form "apiKey;isActive"
 *   used to identify and toggle the state of an existing key
 */
import {computed, defineProps, Ref, ref, watch} from "vue";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import FloatLabel from "primevue/floatlabel";
import BrokerConnection from "../services/BrokerConnection";
import {useToast} from "primevue/usetoast";
import {createErrorToast, createSuccessToast} from "../utils/ToastWrapper";
import {useI18n} from "vue-i18n";

const {t} = useI18n();
const toast = useToast();

// Form inputs
const apiKey = ref("");
const cn = ref("");
const org = ref("");
const loc = ref("");

// Input validation flags
const invalidApiKey = ref(false);
const invalidCN = ref(false);
const invalidOrg = ref(false);
const invalidLoc = ref(false);

// Validation rules
const apiKeyLength = 16;
const apiKeyPattern = /[^a-zA-Z0-9]/;
const dnPattern = /[^a-zA-Z0-9 -]/;

// Prop from parent: selected key to toggle state
const props = defineProps<{ selectedKey: string }>();
const selectedKey = ref(props.selectedKey);

// Form button states
const isAddButtonActive = computed(() =>
    apiKey.value.trim() !== "" &&
    cn.value.trim() !== "" &&
    org.value.trim() !== "" &&
    loc.value.trim() !== "");
const isChangeStateButtonActive = computed(() =>
    selectedKey.value !== "");


function validateField(value: string, flag: Ref<boolean>, localeKey: string, pattern: RegExp) {
  if (pattern.test(value)) {
    createErrorToast(toast, t("inputError"), t("fieldCharacterError", {fieldName: t(localeKey)}));
    flag.value = true;
  }
}

function validate() {
  invalidApiKey.value = false;
  invalidCN.value = false;
  invalidOrg.value = false;
  invalidLoc.value = false;

  if (apiKey.value.length !== apiKeyLength) {
    createErrorToast(toast, t("inputError"), t("keyLengthError", {length: apiKeyLength}));
    invalidApiKey.value = true;
  } else {
    validateField(apiKey.value, invalidApiKey, "key", apiKeyPattern);
  }
  validateField(cn.value, invalidCN, "cn", dnPattern);
  validateField(org.value, invalidOrg, "o", dnPattern);
  validateField(loc.value, invalidLoc, "l", dnPattern);
}

async function addNewKey() {
  validate();
  if (invalidApiKey.value || invalidCN.value || invalidOrg.value || invalidLoc.value) return;
  const payload = `CN=${cn.value},O=${org.value},L=${loc.value}`;
  const xml = `<ApiKeyCred><apiKey>${apiKey.value}</apiKey><clientDn>${payload}</clientDn></ApiKeyCred>`;
  const status = await BrokerConnection.addApiKey(xml);
  switch (status) {
    case 201:
      createSuccessToast(toast, t("success"), t("keyAdded"));
      break;
    case 404:
      createErrorToast(toast, t("notFound"), t("noKeyListFound"));
      break;
    case 401:
      createErrorToast(toast, t("accessDenied"), t("noAuthorization"));
      break;
    case 409:
      createErrorToast(toast, t("conflict"), t("keyAlreadyExists"));
      break;
    case 500:
      createErrorToast(toast, t("serverError"), t("serverErrorOccurred"));
      break;
    default:
      createErrorToast(toast, t("unexpectedError"), t("unexpectedErrorOccurred", {code: status}));
  }
}

async function changeKeyState() {
  const [key, isActive] = selectedKey.value.split(";");
  selectedKey.value = "";
  const status = isActive === "false" ? await BrokerConnection.activateApiKey(key) : await BrokerConnection.deactivateApiKey(key);
  switch (status) {
    case 200:
      createSuccessToast(toast, t("success"), isActive === "false" ? t("keyActivated") : t("keyDeactivated"));
      break;
    case 404:
      createErrorToast(toast, t("notFound"), t("keyNotFound"));
      break;
    case 401:
      createErrorToast(toast, t("accessDenied"), t("noAuthorization"));
      break;
    case 500:
      createErrorToast(toast, t("serverError"), t("serverErrorOccurred"));
      break;
    default:
      createErrorToast(toast, t("unexpectedError"), t("unexpectedErrorOccurred", {code: status}));
  }
}

function generateApiKey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  apiKey.value = Array.from({length: apiKeyLength}, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
}

watch(() => props.selectedKey, (val) => {
  selectedKey.value = val;
});
</script>

<template>
  <div class="p-3 w-full">
    <!-- API key input with generate button -->
    <div class="flex align-items-center gap-2 mt-3">
      <FloatLabel class="w-full">
        <InputText id="apiInput"
                   v-model="apiKey"
                   :invalid="invalidApiKey"
                   class="w-full"/>
        <label for="apiInput">{{ t("key") }}</label>
      </FloatLabel>
      <Button icon="pi pi-sync"
              v-tooltip="t('generateKey')"
              @click="generateApiKey"
              class="flex-shrink-0"/>
    </div>

    <!-- DN Fields -->
    <FloatLabel class="mt-5 w-full">
      <InputText id="nameInput" v-model="cn" :invalid="invalidCN" class="w-full"/>
      <label for="nameInput">{{ t("cn") }}</label>
    </FloatLabel>

    <FloatLabel class="mt-5 w-full">
      <InputText id="orgInput" v-model="org" :invalid="invalidOrg" class="w-full"/>
      <label for="orgInput">{{ t("o") }}</label>
    </FloatLabel>

    <FloatLabel class="mt-5 w-full">
      <InputText id="locInput" v-model="loc" :invalid="invalidLoc" class="w-full"/>
      <label for="locInput">{{ t("l") }}</label>
    </FloatLabel>

    <!-- Action buttons -->
    <div class="flex flex-wrap justify-content-between mt-4 gap-2">
      <Button :label="t('addKey')"
              @click="addNewKey"
              :disabled="!isAddButtonActive"
              class="text-sm"/>
      <Button :label="selectedKey.split(';')[1] === 'true' ? t('deactivate') : t('activate')"
              @click="changeKeyState"
              :disabled="!isChangeStateButtonActive"
              :severity="selectedKey.split(';')[1] === 'true' ? 'danger' : 'success'"
              class="text-sm"/>
    </div>
  </div>
</template>
