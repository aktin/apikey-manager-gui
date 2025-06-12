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
const value = ref(null);

const broker = new BrokerConnection();
</script>

<template>
  <div  class="BG">
    <Button label="Block" @click="blocked = !blocked"></Button>

    <BlockUI :blocked="blocked">
      <p>AAA</p>
    </BlockUI>
    <div>
      <FloatLabel>
        <InputText id="apikey_input" v-model="value" />
        <label for="apikey_input">ApiKey</label>
      </FloatLabel>
      <FloatLabel>
        <InputText id="commonName_input" v-model="value" />
        <label for="commonName_input">Common Name</label>
      </FloatLabel>
      <FloatLabel>
        <InputText id="organization_input" v-model="value" />
        <label for="organization_input">Organization</label>
      </FloatLabel>
      <FloatLabel>
        <InputText id="location_input" v-model="value" />
        <label for="location_input">Location</label>
      </FloatLabel>
    </div>
  </div>
</template>

<style scoped>
.BG
{
  background-color: lightblue;
}
</style>