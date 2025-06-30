<script setup>
import BrokerConnection from './BrokerConnection';
import 'primeicons/primeicons.css';
import {computed, onMounted, ref, watch} from 'vue';
import Dialog from 'primevue/dialog';
import FloatLabel from "primevue/floatlabel";
import Password from "primevue/password";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Dropdown from 'primevue/dropdown';

const visible = ref(false);

const selectedCredentials = ref();
const savedCredentials = ref([]);

const status = ref(null);

const emit = defineEmits(["update:isConnected"]);

const userName = ref("");
const password = ref("");
const url = ref("");

function sendConnectionStatus(statusCode) {
  let isConnected = statusCode === 200;
  emit("update:isConnected", isConnected);
}

async function checkConnection() {
  status.value = await BrokerConnection.getBrokerStatus();
  sendConnectionStatus(status.value);
}

onMounted(() => {
  checkConnection();
  visible.value = true;
  setInterval(checkConnection, 1000 * 60);
});

function saveCredentials() {
  const combined = userName.value + ";" + password.value + ";" + url.value;
  window.storeAPI.set(userName.value, combined);
  savedCredentials.value.push({name: userName.value, adminApiKey: password.value, url: url.value})
}

async function loadCredentials() {
  savedCredentials.value = [];
  (await formatCredentials()).forEach((credential) => {
    savedCredentials.value.push({name: credential.name})
  })
}

async function deleteCredentials() {
  await window.storeAPI.delete(selectedCredentials.value.name);
  selectedCredentials.value = ""
  await loadCredentials()
}

async function formatCredentials() {
  const rawData = await window.storeAPI.get()
  const formattedList = computed(() =>
      Object.values(rawData).map(entry => {
        const [name, key, url] = entry.split(';')
        return {name, key, url}
      })
  )
  return formattedList.value
}

watch(selectedCredentials, async (newVal) => {
  const credentialsRaw = await window.storeAPI.get(newVal.name)
  if (newVal.name) {
    const credentialsList = credentialsRaw.split(';');
    userName.value = credentialsList[0];
    password.value = credentialsList[1];
    url.value = credentialsList[2];
  } else {
    userName.value = "";
    password.value = "";
    url.value = "";
  }
  BrokerConnection.setCredentials(url.value, password.value)
  await window.callVueFunction();
})

</script>

<template>
  <div class="flex align-items-center">

    <div v-if="status === 200" class="flex align-items-center text-green-600 text-xl"
         v-tooltip.left="BrokerConnection.getCredentials().url">
      <i class="pi pi-circle-fill mx-2"/>
      <p class="font-bold">Connected</p>
    </div>

    <div v-else class="flex align-items-center text-red-600 text-xl"
         v-tooltip.left="BrokerConnection.getCredentials().url">
      <i class="pi pi-circle-fill mx-2"/>
      <p class="font-bold">No Connection</p>
    </div>

    <div class="ml-auto p-1">
      <span v-if="url === ''|| password === '' " class="pi pi-exclamation-triangle text-3xl text-yellow-500 mr-2"
            v-tooltip.left="'Missing Credentials'"></span>
      <Button v-tooltip.left="'Config'" icon="pi pi-cog" @click="visible = true"/>
    </div>

  </div>

  <Dialog v-model:visible="visible" modal header="Edit Credentials" :style="{ width: '25rem' }">
    <div class="field grid mt-4 p-3 flex justify-content-center flex-wrap">
      <FloatLabel>
        <InputText id="urlInput" type="text" class="text-base text-color surface-overlay p-2 input_Field"
                   v-model="userName"/>
        <label for="urlInput" class="col-fixed">Name</label>
      </FloatLabel>
    </div>

    <div class="field grid flex justify-content-center flex-wrap">
      <div class="p-3 mt-3">
        <FloatLabel>
          <Password id="passwordInput" v-model="password" size="small" toggleMask :feedback="false"/>
          <label for="passwordInput" class="col-fixed">Admin API Key</label>
        </FloatLabel>
      </div>
    </div>

    <div class="field grid mt-4 p-3 flex justify-content-center flex-wrap">
      <FloatLabel>
        <InputText id="urlInput" type="text" class="text-base text-color surface-overlay p-2 input_Field"
                   v-model="url"/>
        <label for="urlInput" class="col-fixed">URL</label>
      </FloatLabel>
    </div>

    <div class="field grid p-3 flex justify-content-center flex-wrap">
      <div class="card flex justify-content-center">
        <Dropdown v-model="selectedCredentials" editable :options="savedCredentials" optionLabel="name"
                  placeholder="Select Option"
                  class="w-full md:w-14rem"/>
      </div>
      <Button icon="pi pi-save" class="ml-auto" @click="saveCredentials" v-tooltip.bottom="'Save Credentials'"/>
      <Button icon="pi pi-trash" class="ml-auto" @click="deleteCredentials" v-tooltip.bottom="'Delete Credentials'"/>
    </div>
  </Dialog>

</template>

<style scoped>
/deep/ .p-button-icon {
  font-size: 1.25rem;
}
</style>