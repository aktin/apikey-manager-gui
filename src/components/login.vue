<script setup lang="ts">
import { useRouter } from 'vue-router'
import InputText from "primevue/inputtext";
import FloatLabel from "primevue/floatlabel";
import {ref} from "vue";
import { updateValue } from '../router.js';

const router = useRouter();

const password = ref("");

const goToPage = () => {
  router.push('/app')
}

function validateInput(){
  if (password.value === "xxxAdmin1234") {
    updateValue(password.value)
    goToPage();
  }
}
</script>

<template>
  <FloatLabel>
    <InputText id="passwordInput" type="text" class="text-base text-color surface-overlay p-2 input_Field" v-model="password"/>
    <label for="passwordInput" class="col-fixed">Password</label>
  </FloatLabel>
  <Button @click="validateInput">log in</Button>
</template>