<script setup lang="ts">
import {computed, ref} from 'vue'
import BrokerConnection from "./BrokerConnection.js";
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import {useToast} from "primevue/usetoast";
import BlockUI from 'primevue/blockui';
import InputText from 'primevue/inputtext';
import FloatLabel from "primevue/floatlabel";

const blocked = ref(false);
const apikeyinput = ref("");
const commonName = ref(null);
const organization = ref(null);
const location = ref(null);
const api_input_valid = ref(false)
const is_api_valid = ref(false)

const broker = new BrokerConnection();

function makeInvalid() {
  if(apikeyinput.value.length > 12) {
    is_api_valid.value = false;
  }
  else
  {is_api_valid.value = true;}

}

</script>

<template>
  <div  class="bg-blue-200">
    <Button label="Block" @click="blocked = !blocked"></Button>
    <div>

    <BlockUI :blocked="blocked">

      <FloatLabel class="FloatLabel">
        <InputText id="apikey_input"  v-model="apikeyinput" :invalid = "is_api_valid" @update:modelValue="makeInvalid"/>
        <label for="apikey_input">ApiKey</label>
      </FloatLabel>

      <FloatLabel class="FloatLabel">
        <InputText id="commonName_input" v-model="commonName" />
        <label for="commonName_input">Common Name</label>
      </FloatLabel>

      <FloatLabel class="FloatLabel">
        <InputText id="organization_input" v-model="organization" />
        <label for="organization_input">Organization</label>
      </FloatLabel>

      <FloatLabel class="FloatLabel mb-1 mb-5">
        <InputText id="location_input" v-model="location" @update:modelValue="console.log(location)" />
        <label for="location_input">Location</label>
      </FloatLabel>
    </BlockUI>

    </div>
  </div>
</template>

<style scoped>
.BG
{
  background-color: lightblue;
}
.FloatLabel
{
  margin-bottom: 30px;
}
</style>