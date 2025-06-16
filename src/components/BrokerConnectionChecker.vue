<script setup>
import BrokerConnection from "./BrokerConnection.js";
import 'primeicons/primeicons.css'

const broker = new BrokerConnection();
const init = () => {checkConnection()}

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

  <div class="flex align-items-center justify-content-center border">
    <i id="connection_status_light" class="pi pi-circle-fill" style="color:gray"></i>
    <p id="connection_status_text">loading page</p>
  </div>

</template>