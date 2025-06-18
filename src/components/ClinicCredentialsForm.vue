<script setup lang="ts">
import {ref} from "vue";
import Button from "primevue/button";
import BlockUI from "primevue/blockui";
import InputText from "primevue/inputtext";
import FloatLabel from "primevue/floatlabel";
import BrokerConnection from "./BrokerConnection.js";
import { defineProps } from 'vue';

import { useToast } from "primevue/usetoast";
const toast = useToast();

const broker = new BrokerConnection();

const commonNameInput = ref("");
const apiKeyInput = ref("");
const organizationInput = ref("");
const locationInput = ref("");


const isApiKeyInvalid = ref(false);
const isCommonNameInvalid = ref(false);
const isOrganizationInvalid = ref(false);
const isLocationInvalid = ref(false);

const props = defineProps({
  selectedKey: String, connectionStatus: Boolean
});

async function addApikey(){
  validate();
  if(!isApiKeyInvalid.value && !isCommonNameInvalid.value && !isOrganizationInvalid.value && !isLocationInvalid.value)
  {
    const payload = "CN=" + commonNameInput.value + ",O=" + organizationInput.value + ",L=" + locationInput.value;
    const xml_data = "<ApiKeyCred><apiKey>" + apiKeyInput.value + "</apiKey><clientDn>" + payload + "</clientDn></ApiKeyCred>";
    if(await broker.addApiKeys(xml_data) === 409) {
      createErrorToast("Api Key already exists");
    }
  }
}

function validateField(value, inputField) {
  const pattern = /[!@#$%^&*(),.?":{}|<>_-]/;
  if (value === '') {
    createErrorToast(inputField+" cannot be empty");
    return true;
  } else if (pattern.test(value)) {
    createErrorToast(inputField+" cannot contain special symbols");
    return true;
  }
  return false;
}

function validate(){

  if (apiKeyInput.value.length !== 12) {
    createErrorToast("Api Key must be 12 characters");
    isApiKeyInvalid.value = true;

  } else if (/[!@#$%^&*(),.?":{}|<>_-]/.test(apiKeyInput.value)) {
    createErrorToast("Api Key cannot contain special symbols");
    isApiKeyInvalid.value = true;

  } else {
    isApiKeyInvalid.value = false;
  }

  isCommonNameInvalid.value = validateField(
      commonNameInput.value,
      "Common name",
  );

  isOrganizationInvalid.value = validateField(
      organizationInput.value,
      "Organization"
  );

  isLocationInvalid.value = validateField(
      locationInput.value,
      "Location"
  );
}

function createErrorToast(detail){
  toast.add({severity:"error",summary:"Input Error", detail , life:5000})
}

async function changeState()
{
  const statusOfSelectedApiKey = props.selectedKey.split(";")[1]

  const selectedApiKey = props.selectedKey.split(";")[0]

  if(statusOfSelectedApiKey === "INACTIVE"){
    await broker.activateApiKey(selectedApiKey)
  }
  else if(statusOfSelectedApiKey === "ACTIVE"){
    await broker.deactivateApiKey(selectedApiKey)
  }
}

function generateApiKey()
{
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < 12; i++)
  {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  apiKeyInput.value = key;
}

</script>

<template>
  <div class="bg-gray-300">

    <BlockUI :blocked=!props.connectionStatus>

      <div class="field grid">
        <div class="p-3 mt-3">
          <FloatLabel>
            <InputText id="apiInput" type="text" class="text-base text-color surface-overlay p-2 input_Field" v-model="apiKeyInput" :invalid="isApiKeyInvalid"/>
            <label for="apiInput" class="col-fixed">api key</label>
          </FloatLabel>
        </div>
      </div>
      <div class="input_Div">
        <Button @click="generateApiKey()">generate ApiKey</Button>
      </div>
      <div class="field grid mt-4 p-3">
          <FloatLabel>
            <InputText id="nameInput" type="text" class="text-base text-color surface-overlay p-2 input_Field" v-model="commonNameInput" :invalid="isCommonNameInvalid"/>
            <label for="nameInput" class="col-fixed">common name</label>
          </FloatLabel>
      </div>

      <div class="field grid p-3">
          <FloatLabel>
            <InputText id="orgInput" type="text" class="text-base text-color surface-overlay p-2 input_Field" v-model="organizationInput" :invalid="isOrganizationInvalid"/>
            <label for="orgInput" class="col-fixed">organization</label>
          </FloatLabel>
      </div>

      <div class="field grid p-3">
          <FloatLabel>
            <InputText id="locInput" type="text" class="text-base text-color surface-overlay p-2 input_Field" v-model="locationInput" :invalid="isLocationInvalid"/>
            <label for="locInput">location</label>
          </FloatLabel>
      </div>

      <div class="flex gap-3 p-3">
         <Button label="add" @click="addApikey()"></Button>
        <div v-if=" props.selectedKey.split(';')[1]  ==='ACTIVE' " class=" flex align-items-center text-green-600 text-xl">
          <Button label="deactivate" @click="changeState()"></Button>
        </div>
        <div v-else class="flex align-items-center text-red-600 text-xl">
          <Button label="activate" @click="changeState()"></Button>
        </div>
      </div>
    </BlockUI>
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

.input_Field{
  width:100%;
}
</style>