<script setup>
import BrokerConnection from './BrokerConnection';
import 'primeicons/primeicons.css';
import {onMounted, ref} from 'vue';

const status = ref(null);

const emit = defineEmits(["update:isConnected"]);

function sendConnectionStatus(statusCode) {
  let isConnected = statusCode === 200;
  emit("update:isConnected", isConnected);
}

async function checkConnection() {
  status.value = await BrokerConnection.getBrokerStatus();
  sendConnectionStatus(status.value);
}

onMounted(() => {
  checkConnection();
  setInterval(checkConnection, 1000 * 60);
});

</script>

<template>
  <div class="flex" v-tooltip.left="BrokerConnection.getCredentials().url">
    <div v-if="status === 200" class="flex align-items-center text-green-600 text-xl">
      <i class="pi pi-circle-fill mx-2"/>
      <p class="font-bold">Connected</p>
    </div>

    <div v-else class="flex align-items-center text-red-600 text-xl">
      <i class="pi pi-circle-fill mx-2"/>
      <p class="font-bold">No Connection</p>
    </div>
  </div>
</template>
