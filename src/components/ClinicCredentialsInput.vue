<script setup lang="ts">
import {ref, watch} from "vue";
import Button from "primevue/button";
import BlockUI from "primevue/blockui";
import InputText from "primevue/inputtext";
import FloatLabel from "primevue/floatlabel";
import BrokerConnection from "./BrokerConnection.js";
import { defineProps } from 'vue';

const broker = new BrokerConnection();
const selectedStatus = ref("");

const commonNameInput = ref("");
const blocked = ref(false);
const apiKeyInput = ref("");
const organizationInput = ref("");
const locationInput = ref("");


let apiKeyErrorText = ref("");
const commonNameErrorText = ref("");
const organizationErrorText = ref("");
const locationErrorText = ref("");

const isApiKeyInvalid = ref(false);
const isCommonNameInvalid = ref(false);
const isOrganizationInvalid = ref(false);
const isLocationInvalid = ref(false);

const props = defineProps({
  selectedKey: String
});

watch(() => props.selectedKey, (newValue) => {
  selectedStatus.value = `${newValue}`.split(";")[1]
});

function validate() {
  const pattern = /[!@#$%^&*(),.?":{}|<>_-]/;

  function checkInput(input, invalid, errorText, lengthCheck = false)
  {
    if (lengthCheck && input.value.length !== 12) {
      invalid.value = true;
      errorText.value = "must be 12 characters";
    } else if (pattern.test(input.value)) {
      invalid.value = true;
      errorText.value = "cannot contain special symbols";
    } else if (!input.value) {
      invalid.value = true;
      errorText.value = "cannot be empty";
    } else {
      invalid.value = false;
      errorText.value = "";
    }
  }

  checkInput(apiKeyInput, isApiKeyInvalid, apiKeyErrorText, true);
  checkInput(commonNameInput, isCommonNameInvalid, commonNameErrorText);
  checkInput(organizationInput, isOrganizationInvalid, organizationErrorText);
  checkInput(locationInput, isLocationInvalid, locationErrorText);
}

async function changeState()
{
  const selectedApiKey = props.selectedKey.split(";")[0]

  if(selectedStatus.value === "INACTIVE"){
    await broker.activateApiKey(selectedApiKey)
  }
  else if(selectedStatus.value === "ACTIVE"){
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

    <BlockUI :blocked="blocked">

      <div class="field grid">
        <div class="input_Div mt-3">
          <FloatLabel>
            <InputText id="apiInput" type="text" class="text-base text-color surface-overlay p-2 input_Field" v-model="apiKeyInput" :invalid="isApiKeyInvalid"/>
            <label for="apiInput" class="col-fixed">api key</label>
          </FloatLabel>
        </div>
        <label id="apiKeyErrorText" for="apiInput" class="errorLabel" >{{ apiKeyErrorText }}</label>
      </div>
      <div class="input_Div">
        <Button @click="generateApiKey()">generate ApiKey</Button>
      </div>
      <div class="field grid mt-4">
        <div class="input_Div">
          <FloatLabel>
            <InputText id="nameInput" type="text" class="text-base text-color surface-overlay p-2 input_Field" v-model="commonNameInput" :invalid="isCommonNameInvalid"/>
            <label for="nameInput" class="col-fixed">common name</label>
          </FloatLabel>
        </div>
        <label id="commonNameErrorText" for="nameInput" class="errorLabel" >{{commonNameErrorText }}</label>
      </div>

      <div class="field grid ">
        <div class="input_Div">
          <FloatLabel>
            <InputText id="orgInput" type="text" class="text-base text-color surface-overlay p-2 input_Field" v-model="organizationInput" :invalid="isOrganizationInvalid"/>
            <label for="orgInput" class="col-fixed">organization</label>
          </FloatLabel>
        </div>
        <label id="organizationErrorText" for="orgInput" class="errorLabel" >{{organizationErrorText }}</label>
      </div>

      <div class="field grid ">
        <div class="input_Div">
          <FloatLabel>
            <InputText id="locInput" type="text" class="text-base text-color surface-overlay p-2 input_Field" v-model="locationInput" :invalid="isLocationInvalid"/>
            <label for="locInput">location</label>
          </FloatLabel>
        </div>
        <label id="locationErrorText" for="locInput" class="errorLabel" >{{locationErrorText }}</label>
      </div>

      <div class="flex gap-3">
         <Button label="add" @click="validate()"></Button>
        <div v-if="selectedStatus ==='ACTIVE' " class=" flex align-items-center text-green-600 text-xl">
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

.errorLabel {
  width:50%;
  margin-left:auto;
}
.input_Div{
  width:50%;
  flex-grow:1;
  padding: 15px
}
.input_Field{
  width:100%;
}
</style>