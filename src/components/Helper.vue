<script setup>
import BrokerConnection from "./BrokerConnection.js";
const broker = new BrokerConnection();

async function getlist()
{
  apiKeyList.value = await broker.getApiKeys()
}

</script>

<template>
  
</template>

<style scoped>

</style>