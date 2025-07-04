<script setup lang="ts">
import {computed, defineProps, ref, watch} from "vue";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import FloatLabel from "primevue/floatlabel";
import BrokerConnection from "./BrokerConnection.js";
import {useToast} from "primevue/usetoast";

import {useI18n} from 'vue-i18n';
const {t} = useI18n();

const toast = useToast();
const toastLife = 1000 * 5;

const commonNameInput = ref("");
const apiKeyInput = ref("");
const organizationInput = ref("");
const locationInput = ref("");

const isApiKeyInvalid = ref(false);
const isCommonNameInvalid = ref(false);
const isOrganizationInvalid = ref(false);
const isLocationInvalid = ref(false);

const apiKeyValidPattern = /[^a-zA-Z0-9]/
const dnInvalidPattern = /[!@#§`´°~$%^*,?"{}|<>=\[\]\\€&]/;

const props = defineProps({
  selectedKey: String, connectionStatus: Boolean, authorizationState: Boolean,
});
const localSelectedKey = ref(props.selectedKey);

watch(() => props.selectedKey, (newVal) => {
  localSelectedKey.value = newVal;
});

const isChangeStateButtonActive = computed(() =>
    localSelectedKey.value !== '' && props.connectionStatus
);

const isAddButtonActive = computed(() =>
    props.authorizationState && props.connectionStatus
);

function createErrorToast(title, detail) {
  toast.add({severity: "error", summary: title, detail, life: toastLife})
}

function createSuccessToast(detail) {
  toast.add({severity: "success", summary: t("success"), detail, life: toastLife})
}
//checks given API Key input for specific length and characters and gives feedback in ui
function validateInput({
                         value,
                         invalidFlag,
                         labelKey,
                         pattern,
                       }) {
  if (!value) {
    createErrorToast(t("inputError"), `${t(labelKey)} ${t("form.lengthError")}`);
    invalidFlag.value = true;
    return;
  }

  if (pattern?.test(value)) {
    createErrorToast(t("inputError"), `${t(labelKey)} ${t("form.symbolError")}`);
    invalidFlag.value = true;
  }
}
//formats and hands over every API Key input individually to validateInput()
function validate() {
  isApiKeyInvalid.value = false;
  isOrganizationInvalid.value = false;
  isCommonNameInvalid.value = false;
  isLocationInvalid.value = false;

  if (apiKeyInput.value.length !== 12) {
    createErrorToast(t("inputError"), t("form.apiLengthError"));
    isApiKeyInvalid.value = true;
  } else {
    validateInput({
      value: apiKeyInput.value,
      invalidFlag: isApiKeyInvalid,
      labelKey: "API Key",
      pattern: apiKeyValidPattern,
    });
  }

  validateInput({
    value: organizationInput.value,
    invalidFlag: isOrganizationInvalid,
    labelKey: "organization",
    pattern: apiKeyValidPattern,
  });

  validateInput({
    value: commonNameInput.value,
    invalidFlag: isCommonNameInvalid,
    labelKey: "commonName",
    pattern: dnInvalidPattern,
  });

  validateInput({
    value: locationInput.value,
    invalidFlag: isLocationInvalid,
    labelKey: "location",
    pattern: dnInvalidPattern,
  });
}
//formats input into broker standard and tells BrokerConnection.js to send it to broker and gives feedback in ui
async function addApikey() {
  validate();
  if (!isApiKeyInvalid.value && !isCommonNameInvalid.value && !isOrganizationInvalid.value && !isLocationInvalid.value) {
    const payload = "CN=" + commonNameInput.value + ",O=" + organizationInput.value + ",L=" + locationInput.value;
    const xml_data = "<ApiKeyCred><apiKey>" + apiKeyInput.value + "</apiKey><clientDn>" + payload + "</clientDn></ApiKeyCred>";
    const statusCode = await BrokerConnection.addApiKeys(xml_data)

    switch (statusCode) {
      case 201:
        createSuccessToast(t("form.apiKeyAdded"))
        break;
      case 404:
        createErrorToast(t("form.error"), t("form.noList"));
        break;
      case 401:
        createErrorToast(t("form.accessDenied"), t("form.noAuthorization"));
        break;
      case 409:
        createErrorToast(t("form.conflict"), t("form.apiKeyAlreadyExists"));
        break;
      case 500:
        createErrorToast(t("connectionError"), t("noConnection"));
        break;
      default:
        createErrorToast(t("form.unexpectedError"), t("form.unexpectedErrorText") + statusCode);
    }
  }
}
//tells BrokerConnection.js to change activation state of API Key selected in table and gives feedback in ui
async function changeState() {
  const statusOfSelectedApiKey = localSelectedKey.value.split(";")[1]
  const selectedApiKey = localSelectedKey.value.split(";")[0]
  localSelectedKey.value = ""
  let val = 0;

  if (statusOfSelectedApiKey === "false") {
    val = await BrokerConnection.activateApiKey(selectedApiKey)
  } else if (statusOfSelectedApiKey === "true") {
    val = await BrokerConnection.deactivateApiKey(selectedApiKey)
  }

  switch (val) {
    case 200:
      if (statusOfSelectedApiKey === "false") {
        createSuccessToast(t("form.apiKeyActivated"))
      } else {
        createSuccessToast(t("form.apiKeyDeactivated"))
      }
      break;
    case 404:
      createErrorToast(t("form.error"), t("form.noApiKey"));
      break;
    case 401:
      createErrorToast(t("form.accessDenied"), t("form.noAuthorization"));
      break;
    case 500:
      createErrorToast(t("connectionError"), t("noConnection"));
      break;
    default:
      createErrorToast(t("form.unexpectedError"), t("form.unexpectedErrorText") + val);
  }
}
//generates API Key in broker standard
function generateApiKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < 12; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  apiKeyInput.value = key;
}
</script>

<template>
  <div>

    <div class="field grid p-2 ml-2">
      <div class="flex align-items-center justify-content-start mt-3">
        <FloatLabel>
          <InputText id="apiInput" type="text" class="text-base text-color surface-overlay p-2 input_Field"
                     v-model="apiKeyInput" :invalid="isApiKeyInvalid"/>
          <label for="apiInput" class="col-fixed">API Key</label>
        </FloatLabel>
        <span class="ml-2">
          <Button v-tooltip="t('form.generate')" icon="pi pi-sync" @click="generateApiKey()"/>
        </span>
      </div>
    </div>

    <div class="field grid p-2 ml-2">
      <FloatLabel>
        <InputText id="nameInput" type="text" class="text-base text-color surface-overlay p-2 input_Field"
                   v-model="commonNameInput"
                   :invalid="isCommonNameInvalid"/>
        <label for="nameInput" class="col-fixed">{{ t("commonName") }}</label>
      </FloatLabel>
    </div>

    <div class="field grid p-2 ml-2">
      <FloatLabel>
        <InputText id="orgInput" type="text" class="text-base text-color surface-overlay p-2 input_Field"
                   v-model="organizationInput"
                   :invalid="isOrganizationInvalid"/>
        <label for="orgInput" class="col-fixed">{{ t("organization") }}</label>
      </FloatLabel>
    </div>

    <div class="field grid p-2 ml-2">
      <FloatLabel>
        <InputText id="locInput" type="text" class="text-base text-color surface-overlay p-2 input_Field"
                   v-model="locationInput"
                   :invalid="isLocationInvalid"/>
        <label for="locInput" class="col-fixed">{{ t("location") }}</label>
      </FloatLabel>
    </div>

    <div class="flex gap-3 p-3">
      <Button :label="t('form.addAPIKey')" @click="addApikey()" :disabled="!isAddButtonActive"></Button>
      <div v-if=" props.selectedKey.split(';')[1]  ==='true' "
           class=" flex align-items-center text-green-600 text-xl">
        <Button :label="t('form.deactivate')" @click="changeState()" :disabled="!isChangeStateButtonActive"/>
      </div>
      <div v-else class="flex align-items-center text-red-600 text-xl">
        <Button :label="t('form.activate')" @click="changeState()" :disabled="!isChangeStateButtonActive"/>
      </div>
    </div>

  </div>
</template>

<style scoped>

.p-inputtext:focus {
  box-shadow: none !important;
  border-color: initial !important;
}

.p-inputtext:hover {
  border-color: initial !important;
}

button:focus {
  box-shadow: none !important;
}

.input_Field {
  width: 100%;
}
</style>