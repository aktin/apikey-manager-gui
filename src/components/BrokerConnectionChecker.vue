<script setup>
import BrokerConnection from './BrokerConnection';
import 'primeicons/primeicons.css';
import {onMounted, ref} from 'vue';
import Dialog from 'primevue/dialog';
import FloatLabel from "primevue/floatlabel";
import Password from "primevue/password";
import InputText from "primevue/inputtext";
import Button from "primevue/button";

const visible = ref(false);

const status = ref(null);

const emit = defineEmits(["update:isConnected"]);

const password = ref("");
const url = ref("");

function sendConnectionStatus(statusCode) {
  let isConnected = statusCode === 200;
  emit("update:isConnected", isConnected);
}

async function checkConnection() {
  status.value = await BrokerConnection.getBrokerStatus();
  sendConnectionStatus(status.value);
}

function logIn() {
  BrokerConnection.setCredentials(url.value, password.value)
  window.callVueFunction()
  visible.value = false
}

onMounted(() => {
  checkConnection();
  visible.value = true;
  setInterval(checkConnection, 1000 * 60);
});

</script>

<template>
  <div class="flex align-items-baseline justify-content-between">

    <div v-if="status === 200" class="flex align-items-center text-green-600 text-xl" v-tooltip.left="BrokerConnection.getCredentials().url">
      <i class="pi pi-circle-fill mx-2"/>
      <p class="font-bold">Connected</p>
    </div>

    <div v-else class="flex align-items-center text-red-600 text-xl" v-tooltip.left="BrokerConnection.getCredentials().url">
      <i class="pi pi-circle-fill mx-2"/>
      <p class="font-bold">No Connection</p>
    </div>

    <span class="pi pi-cog p-3 text-2xl" @click="visible = true" v-tooltip.left="'Set Credentials'"/>
  </div>

  <Dialog v-model:visible="visible" modal header="Edit Credentials" :style="{ width: '25rem' }">
    <div class="field grid flex justify-content-center flex-wrap">
      <div class="p-3 mt-3">
        <FloatLabel>
          <Password id="passwordInput" v-model="password" size="small" toggleMask :feedback="false"/>
          <label for="passwordInput" class="col-fixed">Admin API Key</label>
        </FloatLabel>
      </div>
    </div>

    <div class="field grid mt-4 p-3 flex justify-content-center flex-wrap">
      <FloatLabel>
        <InputText id="urlInput" type="text" class="text-base text-color surface-overlay p-2 input_Field" v-model="url"/>
        <label for="urlInput" class="col-fixed">URL</label>
      </FloatLabel>
    </div>

    <div class="field grid p-3 flex justify-content-center flex-wrap">
      <Button @click="logIn">Set</Button>
    </div>
  </Dialog>
</template>