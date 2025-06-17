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

  <div class="layout">

    <div class="span1">
      <ClinicCredentialsTable/>
    </div>

    <div class="span2">
    <ClinicCredentialsInput/>
    </div>

    <div class="span3">
      <BrokerConnectionChecker/>
    </div>

  </div>

</template>

<style scoped>

.layout {
  display: grid;
  grid:
    "span1 span1 span1 span1 span1 span1 span1 span2 span2 span2" 1fr
    "span1 span1 span1 span1 span1 span1 span1 span2 span2 span2" 1fr
    "span1 span1 span1 span1 span1 span1 span1 span2 span2 span2" 1fr
    "span1 span1 span1 span1 span1 span1 span1 span2 span2 span2" 1fr
    "span1 span1 span1 span1 span1 span1 span1 span2 span2 span2" 1fr
    "span3 span3 span3 span3 span3 span3 span3 span3 span3 span3" 1fr
    / 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
  gap: 2px;
}

.span1 { grid-area: span1; }
.span2 { grid-area: span2; }
.span3 { grid-area: span3; }

</style>
