<script setup lang="ts">
import {computed, ref} from 'vue'
import BrokerConnection from "./BrokerConnection.js";
import Textarea from 'primevue/textarea';
const value = ref("");
</script>

<template>
  <Textarea v-model="value" rows="5" cols="30" />
</template>

<style scoped>

</style>