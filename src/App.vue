<script setup>
import HelloWorld from './components/HelloWorld.vue'
import ClinicCredentialsInput from "./components/ClinicCredentialsInput.vue";
import BrokerConnection from "./components/BrokerConnection.js";
import ClinicCredentialsTable from "./components/ClinicCredentialsTable.vue";
import InputText from "primevue/inputtext";
import FloatLabel from "primevue/floatlabel";

const broker = new BrokerConnection();

</script>

<template>

  <div class="field grid border-3 border-blue-500">
    <div class="border-3 border-red-600" style="width:57%">
      <ClinicCredentialsTable/>
    </div>
    <div style="width:43%">
    <ClinicCredentialsInput/>
    </div>
  </div>

</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
