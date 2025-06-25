<script setup lang="ts">
import {useRouter} from 'vue-router'
import InputText from "primevue/inputtext";
import FloatLabel from "primevue/floatlabel";
import {onMounted, ref} from "vue";
import {updateLoginValues} from '../router.js';
import Password from 'primevue/password';
import BrokerConnection from "./BrokerConnection.js";
import Button from "primevue/button";

const router = useRouter();

const password = ref("");
const url = ref("");

const goToPage = () => {
  router.push('/app')
}

function logIn() {
  BrokerConnection.setCredentials(url.value, password.value)
  validateInput()
}

function validateInput() {
  if (BrokerConnection.getCredentials().key === "xxxAdmin1234") {
    updateLoginValues(BrokerConnection.getCredentials().key)
    goToPage();
  }
}

onMounted(() => {
  validateInput()
});
</script>

<template>

  <div class="field grid flex justify-content-center flex-wrap">
    <div class="p-3 mt-3">
      <FloatLabel>
        <Password id="passwordInput" v-model="password" size="small" toggleMask :feedback="false"/>
        <label for="passwordInput" class="col-fixed">Password</label>
      </FloatLabel>
    </div>
  </div>

  <div class="field grid mt-4 p-3 flex justify-content-center flex-wrap">
    <FloatLabel>
      <InputText id="urlInput" type="text" class="text-base text-color surface-overlay p-2 input_Field" v-model="url"/>
      <label for="urlInput" class="col-fixed">URL</label>
    </FloatLabel>
  </div>

  <div class="field grid p-3 flex justify-content-center flex-wrap">
    <Button @click="logIn">log in</Button>
  </div>

</template>