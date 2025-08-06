<script setup lang="ts">
import {computed, defineProps, ref, watch} from "vue";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import FloatLabel from "primevue/floatlabel";
import BrokerConnection from "./BrokerConnection";
import {useToast} from "primevue/usetoast";
import {createErrorToast, createSuccessToast} from "@/utils/toast";
import {useI18n} from "vue-i18n";

const {t} = useI18n();
const toast = useToast();

const apiKeyInput = ref("");
const commonNameInput = ref("");
const organizationInput = ref("");
const locationInput = ref("");

const isApiKeyInvalid = ref(false);
const isCommonNameInvalid = ref(false);
const isOrganizationInvalid = ref(false);
const isLocationInvalid = ref(false);

const apiKeyValidPattern = /[^a-zA-Z0-9 -]/;
const dnInvalidPattern = /[!@#§`´°~$%^*,?"{}|<>=\[\]\\€&]/;

const props = defineProps<{ selectedKey: string }>();

const localSelectedKey = ref(props.selectedKey);
watch(() => props.selectedKey, (newVal) => {
  localSelectedKey.value = newVal;
});

const isChangeStateButtonActive = computed(() => localSelectedKey.value !== "" && isConnected.value);
const isAddButtonActive = computed(() => isConnected.value && isAuthorized.value);

function validateInput({value, invalidFlag, labelKey, pattern}: { value: string; invalidFlag: Ref<boolean>; labelKey: string; pattern: RegExp; }): void {
  if (!value) {
    createErrorToast(toast, t("inputError"), `${t(labelKey)} ${t("form.lengthError")}`);
    invalidFlag.value = true;
    return;
  }
  if (pattern.test(value)) {
    createErrorToast(toast, t("inputError"), `${t(labelKey)} ${t("form.symbolError")}`);
    invalidFlag.value = true;
  }
}

function validate(): void {
  isApiKeyInvalid.value = false;
  isCommonNameInvalid.value = false;
  isOrganizationInvalid.value = false;
  isLocationInvalid.value = false;
  if (apiKeyInput.value.length !== 12) {
    createErrorToast(toast, t("inputError"), t("form.apiLengthError"));
    isApiKeyInvalid.value = true;
  } else {
    validateInput({
      value: apiKeyInput.value,
      invalidFlag: isApiKeyInvalid,
      labelKey: "API Key",
      pattern: apiKeyValidPattern
    });
  }
  validateInput({
    value: organizationInput.value,
    invalidFlag: isOrganizationInvalid,
    labelKey: "organization",
    pattern: apiKeyValidPattern
  });
  validateInput({
    value: commonNameInput.value,
    invalidFlag: isCommonNameInvalid,
    labelKey: "commonName",
    pattern: dnInvalidPattern
  });
  validateInput({
    value: locationInput.value,
    invalidFlag: isLocationInvalid,
    labelKey: "location",
    pattern: dnInvalidPattern
  });
}

async function addApikey(): Promise<void> {
  validate();
  if (!isApiKeyInvalid.value && !isCommonNameInvalid.value && !isOrganizationInvalid.value && !isLocationInvalid.value) {
    const payload = `CN=${commonNameInput.value},O=${organizationInput.value},L=${locationInput.value}`;
    const xml = `<ApiKeyCred><apiKey>${apiKeyInput.value}</apiKey><clientDn>${payload}</clientDn></ApiKeyCred>`;
    const status = await BrokerConnection.addApiKey(xml);
    switch (status) {
      case 201:
        createSuccessToast(toast, t("form.apiKeyAdded"));
        break;
      case 404:
        createErrorToast(toast, t("form.error"), t("form.noList"));
        break;
      case 401:
        createErrorToast(toast, t("accessDenied"), t("form.noAuthorization"));
        break;
      case 409:
        createErrorToast(toast, t("form.conflict"), t("form.apiKeyAlreadyExists"));
        break;
      case 500:
        createErrorToast(toast, t("connectionError"), t("noConnection"));
        break;
      default:
        createErrorToast(toast, t("form.unexpectedError"), `${t("form.unexpectedErrorText")} ${status}`);
    }
  }
}

async function changeState(): Promise<void> {
  const [apiKey, isActive] = localSelectedKey.value.split(";");
  localSelectedKey.value = "";
  let result = 0;
  if (isActive === "false") {
    result = await BrokerConnection.activateApiKey(apiKey);
  } else if (isActive === "true") {
    result = await BrokerConnection.deactivateApiKey(apiKey);
  }
  switch (result) {
    case 200:
      createSuccessToast(toast, isActive === "false" ? t("form.apiKeyActivated") : t("form.apiKeyDeactivated"));
      break;
    case 404:
      createErrorToast(toast, t("form.error"), t("form.noApiKey"));
      break;
    case 401:
      createErrorToast(toast, t("accessDenied"), t("form.noAuthorization"));
      break;
    case 500:
      createErrorToast(toast, t("connectionError"), t("noConnection"));
      break;
    default:
      createErrorToast(toast, t("form.unexpectedError"), `${t("form.unexpectedErrorText")} ${result}`);
  }
}

function generateApiKey(): void {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  apiKeyInput.value = Array.from({length: 12}, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
}

onMounted(async () => {
  isAuthorized.value = await BrokerConnection.isAuthorized();
  BrokerConnection.onCredentialsChange(async () => {
    isAuthorized.value = await BrokerConnection.isAuthorized();
  });
});
</script>

<template>
  <div>
    <div class="field grid p-2 ml-2">
      <div class="flex align-items-center justify-content-start mt-3">
        <FloatLabel>
          <InputText
              id="apiInput"
              type="text"
              class="text-base text-color surface-overlay p-2 input_Field"
              v-model="apiKeyInput"
              :invalid="isApiKeyInvalid"
          />
          <label for="apiInput" class="col-fixed">API Key</label>
        </FloatLabel>
        <span class="ml-2">
          <Button v-tooltip="t('form.generate')" icon="pi pi-sync" @click="generateApiKey"/>
        </span>
      </div>
    </div>
    <div class="field grid p-2 ml-2">
      <FloatLabel>
        <InputText
            id="nameInput"
            type="text"
            class="text-base text-color surface-overlay p-2 input_Field"
            v-model="commonNameInput"
            :invalid="isCommonNameInvalid"
        />
        <label for="nameInput" class="col-fixed">{{ t("commonName") }}</label>
      </FloatLabel>
    </div>
    <div class="field grid p-2 ml-2">
      <FloatLabel>
        <InputText
            id="orgInput"
            type="text"
            class="text-base text-color surface-overlay p-2 input_Field"
            v-model="organizationInput"
            :invalid="isOrganizationInvalid"
        />
        <label for="orgInput" class="col-fixed">{{ t("organization") }}</label>
      </FloatLabel>
    </div>
    <div class="field grid p-2 ml-2">
      <FloatLabel>
        <InputText
            id="locInput"
            type="text"
            class="text-base text-color surface-overlay p-2 input_Field"
            v-model="locationInput"
            :invalid="isLocationInvalid"
        />
        <label for="locInput" class="col-fixed">{{ t("location") }}</label>
      </FloatLabel>
    </div>
    <div class="flex gap-3 p-3">
      <Button :label="t('form.addAPIKey')" @click="addApikey" :disabled="!isAddButtonActive"/>
      <div v-if="selectedKey.split(';')[1] === 'true'" class="flex align-items-center text-green-600 text-xl">
        <Button :label="t('form.deactivate')" @click="changeState" :disabled="!isChangeStateButtonActive"/>
      </div>
      <div v-else class="flex align-items-center text-red-600 text-xl">
        <Button :label="t('form.activate')" @click="changeState" :disabled="!isChangeStateButtonActive"/>
      </div>
    </div>
  </div>
</template>
