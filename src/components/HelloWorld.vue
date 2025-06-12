<script setup>
import {computed, ref} from 'vue'
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import {useToast} from "primevue/usetoast";


defineProps({
  msg: String,
})

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

  <div class="flex flex-column ">
    <div class="flex align-items-center justify-content-center">
      <p>Demo PrimeVue Buttons</p>
    </div>
    <Button :label="clickBtnLabel" @click="count++" class="mb-2"/>
    <Button label="I am a Toast" @click="showToast()"/>
  </div>

  <div class="flex flex-column">
    <div class="flex align-items-center justify-content-center">
      <p>Demo PrimeIcons</p>
    </div>
    <div class="flex align-items-center justify-content-center">
      <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
    </div>
  </div>

  <div class="flex flex-column">
    <div class="flex align-items-center justify-content-center">
      <p>Demo PrimeFlex Layout</p>
    </div>
    <div class="flex align-items-center justify-content-center">
      <div class="grid nested-grid">
        <div class="col-8">
          <div class="grid">
            <div class="col-6">
              <div class="text-center p-3 border-round-sm bg-primary font-bold">6</div>
            </div>
            <div class="col-6">
              <div class="text-center p-3 border-round-sm bg-primary font-bold">6</div>
            </div>
            <div class="col-12">
              <div class="text-center p-3 border-round-sm bg-primary font-bold">12</div>
            </div>
          </div>
        </div>
        <div class="col-4">
          <div class="text-center p-3 border-round-sm h-full bg-primary font-bold">4</div>
        </div>
      </div>
    </div>
  </div>
</template>
