<script setup>
import {computed, ref} from 'vue'
import BrokerConnection from "./BrokerConnection.js";
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import {useToast} from "primevue/usetoast";
import App from "../App.vue";
import { createApp } from 'vue';
import 'primeicons/primeicons.css'

const broker = new BrokerConnection();

const init = () => { checkConnection()}

const toast = useToast();
const showToast = () => {
  toast.add({severity: 'info', summary: 'Info', detail: 'Message Content', life: 3000});
};

const count = ref(0)
const clickBtnLabel = computed(() =>
    count.value === 1 ? '1 Click' : `${count.value} Clicks`
)

setInterval(checkConnection,5000)

async function checkConnection()
{
  var status = await broker.getBrokerStatus()

  if(status == 200) {
    document.getElementById("connection_status_light").style.color = "#00DD00";
    document.getElementById("connection_status_text").innerHTML = "connected";
  }
  else{
    document.getElementById("connection_status_light").style.color = "red";
    document.getElementById("connection_status_text").innerHTML = "no connection";
  }
}
init();
</script>

<template>
  <Toast/>

  <div class="flex align-items-center justify-content-center border">
    <i id="connection_status_light" class="pi pi-circle-fill" style="color:gray"></i>
    <p id="connection_status_text">loading page</p>
  </div>

</template>