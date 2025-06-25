<script setup lang="ts">
import { useRouter } from 'vue-router'
import InputText from "primevue/inputtext";
import FloatLabel from "primevue/floatlabel";
import {onMounted, ref} from "vue";
import { updateLoginValues } from '../router.js';

import Button from "primevue/button";

const router = useRouter();

const password = ref("");
const url = ref("");

const goToPage = () => {
  router.push('/app')
}

function validateInput(){
  if (password.value === "xxxAdmin1234" && url.value!="") {
    updateLoginValues(password.value , url.value)
    setCookie("password",password.value)
    setCookie("url",url.value)
    goToPage();
  }
}

function setCookie(key: string, value: string) {
  document.cookie = key + "=" + value
}

function getCookie(key) {
  let name = key + "=";
  let cookieList = document.cookie.split(';');
  for(let i = 0; i < cookieList.length; i++) {
    let eachCookie = cookieList[i];
    while (eachCookie.charAt(0) == ' ') {
      eachCookie = eachCookie.substring(1);
    }
    if (eachCookie.indexOf(name) == 0) {
      return eachCookie.substring(name.length, eachCookie.length);
    }
  }
  return "";
}

function checkCookie() {
  let enteredPassword =  getCookie("password");
  let enteredUrl =  getCookie("url");
  if (enteredUrl!="" && enteredPassword!="") {
    password.value = enteredPassword;
    url.value = enteredUrl;
  }
}

onMounted(() => {
  checkCookie();
  if(password.value && url.value) {
    validateInput()
  }
});
</script>

<template>

    <div class="field grid flex justify-content-center flex-wrap">
      <div class="p-3 mt-3">
        <FloatLabel>
          <InputText id="passwordInput" type="text" class="text-base text-color surface-overlay p-2 input_Field" v-model="password"/>
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
      <Button @click="validateInput">log in</Button>
    </div>

</template>