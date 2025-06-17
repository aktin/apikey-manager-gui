<script setup>
import BrokerConnectionChecker from './components/BrokerConnectionChecker.vue'
import ClinicCredentialsInput from "./components/ClinicCredentialsInput.vue";
import ClinicCredentialsTable from "./components/ClinicCredentialsTable.vue";
</script>

<template>
  <div class="m-3">
    <div class="grid">
     <ClinicCredentialsTable @update:selectedApiKey="console.log($event)" class="col-9 border-1"/>
      <div class="col-3">
        <BrokerConnectionChecker class="border-1"/>
        <!-- <ClinicCredentialsInput/> -->
      </div>
    </div>
  </div>
</template>
