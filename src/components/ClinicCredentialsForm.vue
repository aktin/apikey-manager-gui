<script setup lang="ts">
import {defineProps, ref} from "vue";
import Button from "primevue/button";
import BlockUI from "primevue/blockui";
import InputText from "primevue/inputtext";
import FloatLabel from "primevue/floatlabel";
import BrokerConnection from "./BrokerConnection.js";

import {useToast} from "primevue/usetoast";

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

const apiKeyPattern = /[!@#$%^&*(),.?":{}|;<>_-]/;
const dnPattern = /[!@#$%^&*(),?"{}|<>]/;

const props = defineProps({
  selectedKey: String, connectionStatus: Boolean
});

async function addApikey() {
  validate();
  if (!isApiKeyInvalid.value && !isCommonNameInvalid.value && !isOrganizationInvalid.value && !isLocationInvalid.value) {
    const payload = "CN=" + commonNameInput.value + ",O=" + organizationInput.value + ",L=" + locationInput.value;
    const xml_data = "<ApiKeyCred><apiKey>" + apiKeyInput.value + "</apiKey><clientDn>" + payload + "</clientDn></ApiKeyCred>";
    const statusCode = await BrokerConnection.addApiKeys(xml_data)

    switch (statusCode) {
      case 201:
        createSuccessToast("API Key has been added")
        break;
      case 404:
        createErrorToast("Error", "could not find list to add API Key in.");
        break;
      case 401:
        createErrorToast("Access Denied", "You are not authorized to perform this action.");
        break;
      case 409:
        createErrorToast("Conflict", "API Key already exists");
        break;
      case 500:
        createErrorToast("Connection Error", "Could not reach Server.");
        break;
      default:
        createErrorToast("Unexpected Error", "An unexpected error occurred. Code:" + statusCode);
    }
  }
}

function validateField(value, label, pattern) {
  if (value.trim() === "") {
    createErrorToast("Input Error", `${label} cannot be empty`);
    return true;
  }
  if (pattern.test(value)) {
    createErrorToast("Input Error", `${label} cannot contain special characters`);
    return true;
  }
  return false;
}

function validate() {
  isApiKeyInvalid.value = false;
  if (apiKeyInput.value.length !== 12) {
    createErrorToast("Input Error", "API Key must be 12 characters");
    isApiKeyInvalid.value = true;
  } else if (apiKeyPattern.test(apiKeyInput.value)) {
    createErrorToast("Input Error", "API Key cannot contain special characters");
    isApiKeyInvalid.value = true;
  }

  isOrganizationInvalid.value = validateField(
      organizationInput.value,
      "Organization",
      apiKeyPattern
  );

  isCommonNameInvalid.value = validateField(
      commonNameInput.value,
      "Common name",
      dnPattern
  );

  isLocationInvalid.value = validateField(
      locationInput.value,
      "Location",
      dnPattern
  );
}

function createErrorToast(title, detail) {
  toast.add({severity: "error", summary: title, detail, life: toastLife})
}

function createSuccessToast(detail) {
  toast.add({severity: "success", summary: "Success", detail, life: toastLife})
}

async function changeState() {
  const statusOfSelectedApiKey = props.selectedKey.split(";")[1]

  const selectedApiKey = props.selectedKey.split(";")[0]

  let val = 0;

  if (statusOfSelectedApiKey === "false") {
    val = await BrokerConnection.activateApiKey(selectedApiKey)
  } else if (statusOfSelectedApiKey === "true") {
    val = await BrokerConnection.deactivateApiKey(selectedApiKey)
  }

  switch (val) {
    case 200:
      if (statusOfSelectedApiKey === "false") {
        createSuccessToast("API Key has been activated")
      } else {
        createSuccessToast("API Key has been deactivated")
      }
      break;
    case 404:
      createErrorToast("Error", "could not find API Key.");
      break;
    case 401:
      createErrorToast("Access Denied", "You are not authorized to perform this action.");
      break;
    case 500:
      createErrorToast("Connection Error", "Could not reach Server.");
      break;
    default:
      createErrorToast("Unexpected Error", "An unexpected error occurred. Code:" + val);
  }
}

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
      <BlockUI class="flex align-items-center justify-content-start" :blocked=!props.connectionStatus>
        <FloatLabel>
          <InputText id="apiInput" type="text" class="text-base text-color surface-overlay p-2 input_Field"
                     v-model="apiKeyInput" :invalid="isApiKeyInvalid"/>
          <label for="apiInput" class="col-fixed">API Key</label>
        </FloatLabel>
        <span class="ml-2">
          <Button v-tooltip="'Generate API Key'" icon="pi pi-sync" @click="generateApiKey()"/>
        </span>
      </BlockUI>
    </div>

    <div class="field grid p-2 ml-2">
      <BlockUI :blocked=!props.connectionStatus>
        <FloatLabel>
          <InputText id="nameInput" type="text" class="text-base text-color surface-overlay p-2 input_Field"
                     v-model="commonNameInput"
                     :invalid="isCommonNameInvalid"/>
          <label for="nameInput" class="col-fixed">Common Name</label>
        </FloatLabel>
      </BlockUI>
    </div>

    <div class="field grid p-2 ml-2">
      <BlockUI :blocked=!props.connectionStatus>
        <FloatLabel>
          <InputText id="orgInput" type="text" class="text-base text-color surface-overlay p-2 input_Field"
                     v-model="organizationInput"
                     :invalid="isOrganizationInvalid"/>
          <label for="orgInput" class="col-fixed">Organization</label>
        </FloatLabel>
      </BlockUI>
    </div>

    <div class="field grid p-2 ml-2">
      <BlockUI :blocked=!props.connectionStatus>
        <FloatLabel>
          <InputText id="locInput" type="text" class="text-base text-color surface-overlay p-2 input_Field"
                     v-model="locationInput"
                     :invalid="isLocationInvalid"/>
          <label for="locInput" class="col-fixed">Location</label>
        </FloatLabel>
      </BlockUI>
    </div>

    <div class="flex">
      <BlockUI :blocked=!props.connectionStatus class="flex gap-3 p-3">
        <Button label="Add" @click="addApikey()"></Button>
        <div v-if=" props.selectedKey.split(';')[1]  ==='true' "
             class=" flex align-items-center text-green-600 text-xl">
          <Button label="Deactivate" @click="changeState()"/>
        </div>
        <div v-else class="flex align-items-center text-red-600 text-xl">
          <Button label="Activate" @click="changeState()" :disabled="!(props.selectedKey.split(';')[0])"/>
        </div>
      </BlockUI>
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