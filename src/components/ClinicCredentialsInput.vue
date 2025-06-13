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
const apiKeyInput = ref("");
const commonNameInput = ref(null);
const organizationInput = ref(null);
const locationInput = ref(null);
const api_input_valid = ref(false)
const is_api_valid = ref(false)

const broker = new BrokerConnection();

function makeInvalid() {
  is_api_valid.value = apiKeyInput.value.length != 12;

}

</script>

<template>
  <div  class="bg-blue-200">
    <Button label="Block" @click="blocked = !blocked"></Button>

    <BlockUI :blocked="blocked">

      <div class="field grid mt-5">
        <div class="col">
          <FloatLabel>
            <InputText id="firstname3" type="text" class="text-base text-color surface-overlay p-2 " v-model="apiKeyInput"/>
            <label for="firstname3" class="col-fixed">api key</label>
          </FloatLabel>
        </div>
        <label for="firstname3" class="col-fixed" style="width:100px">Firstname</label>
      </div>

      <div class="field grid mt-5">
        <div class="col">
          <FloatLabel>
            <InputText id="firstname2" type="text" class="text-base text-color surface-overlay p-2 " v-model="commonNameInput"/>
            <label for="firstname2" class="col-fixed">common name</label>
          </FloatLabel>
        </div>
        <label for="firstname2" class="col-fixed" style="width:100px">Firstname</label>
      </div>

      <div class="field grid mt-5">
        <div class="col">
          <FloatLabel>
            <InputText id="firstname1" type="text" class="text-base text-color surface-overlay p-2 " v-model="organizationInput"/>
            <label for="firstname1" class="col-fixed">organization</label>
          </FloatLabel>
        </div>
        <label for="firstname1" class="col-fixed" style="width:100px">Firstname</label>
      </div>

      <div class="field grid mt-5">
        <div class="col">
          <FloatLabel>
            <InputText id="firstname0" type="text" class="text-base text-color surface-overlay p-2 " v-model="locationInput"/>
            <label for="firstname0" class="col-fixed">location</label>
          </FloatLabel>
        </div>
        <label for="firstname0" class="col-fixed" style="width:100px">Firstname</label>
      </div>


    </BlockUI>
  </div>




</template>

<style scoped>

</style>