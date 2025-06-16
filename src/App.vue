<script setup>
import BrokerConnectionChecker from './components/BrokerConnectionChecker.vue'
import ClinicCredentialsInput from "./components/ClinicCredentialsInput.vue";
import BrokerConnection from "./components/BrokerConnection.js";
import ClinicCredentialsTable from "./components/ClinicCredentialsTable.vue";
import InputText from "primevue/inputtext";
import FloatLabel from "primevue/floatlabel";

const broker = new BrokerConnection();

</script>

<template>

  <div style="width:90vw; height:90vh" class="border-3 border-orange-300">
    <div  style="display:flex ; flex-direction:row" class="border-3 border-blue-500">
      <div  style="flex-grow: 1" class="border-3 border-red-500">
        <ClinicCredentialsTable/>
      </div>
      <div style="width:500px ; height:100%">
      <ClinicCredentialsInput/>
      </div>
    </div>
    <div>
      <BrokerConnectionChecker/>
    </div>
  </div>

</template>

<style scoped>

</style>
