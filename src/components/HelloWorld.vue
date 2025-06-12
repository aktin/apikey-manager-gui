<script setup>
import {computed, ref} from 'vue'
import BrokerConnection from "./BrokerConnection.js";
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import {useToast} from "primevue/usetoast";


defineProps({
  msg: String,
})

const broker = new BrokerConnection();

const toast = useToast();
const showToast = () => {
  toast.add({severity: 'info', summary: 'Info', detail: 'Message Content', life: 3000});
};

const count = ref(0)
const clickBtnLabel = computed(() =>
    count.value === 1 ? '1 Click' : `${count.value} Clicks`
)
</script>

<template>
  <Toast/>

  <div class="flex align-items-center justify-content-center">
    <h1>{{ msg }}</h1>
  </div>

  <Button label="click here" @click="broker.create()"/>
  <p id="bruh">test</p>
</template>