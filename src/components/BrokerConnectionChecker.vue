<script setup>
import BrokerConnection from './BrokerConnection';
import 'primeicons/primeicons.css';
import {computed, defineProps, onMounted, ref, watch} from 'vue';
import Dialog from 'primevue/dialog';
import FloatLabel from "primevue/floatlabel";
import Password from "primevue/password";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Dropdown from 'primevue/dropdown';
import {useToast} from "primevue/usetoast";
import ConfirmPopup from 'primevue/confirmpopup';
import {useConfirm} from "primevue/useconfirm";
import ProgressSpinner from 'primevue/progressspinner';

const logInBlocked = ref(false);

const visible = ref(false);
const deleteDisabled = ref(true);
const saveDisabled = ref(true);

const selectedCredentials = ref();
const savedCredentials = ref([]);

const status = ref(null);

const emit = defineEmits(["update:isConnected"]);

const userName = ref("");
const password = ref("");
const url = ref("");

const savedName = ref("");
const savedPassword = ref("");
const savedUrl = ref("");

const nameNotChanged = ref(true);
const passwordNotChanged = ref(true);
const urlNotChanged = ref(true);

const connected = ref(false);

const confirm = useConfirm();
const toast = useToast();
const toastLife = 1000 * 5;

function createErrorToast(title, detail) {
  toast.add({severity: "error", summary: title, detail, life: toastLife})
}

const props = defineProps({
  authorizationState: Boolean,
});

function sendConnectionStatus(statusCode) {
  if (url.value === "") {
    emit("update:isConnected", false);
  } else {
    connected.value = statusCode === 200;
    emit("update:isConnected", connected.value);
  }
}

async function checkConnection() {
  status.value = await BrokerConnection.getBrokerStatus();
  sendConnectionStatus(status.value);
}

function changeSavedCreds() {
  savedName.value = userName.value;
  savedPassword.value = password.value;
  savedUrl.value = url.value;
}

async function insertCredentials(nameValue) {
  const credentialsRaw = await window.storeAPI.get(nameValue)
  if (credentialsRaw) {
    const credentialsList = credentialsRaw.split(';');
    userName.value = credentialsList[0];
    password.value = credentialsList[1];
    url.value = credentialsList[2];
    deleteDisabled.value = false
  } else {
    selectedCredentials.value = "";
    userName.value = "";
    password.value = "";
    url.value = "";
    deleteDisabled.value = true
  }
  changeSavedCreds()
  allInputChanged()
  BrokerConnection.setCredentials(url.value, password.value)
  window.storeAPI.set("LastSelected", nameValue);
  await window.callVueFunction();
}

async function formatCredentials() {
  const rawData = await window.storeAPI.get()
  const data = Object.fromEntries(
      Object.entries(rawData).filter(([key]) => key !== 'LastSelected')
  );
  const formattedList = computed(() =>
      Object.values(data).map(entry => {
        const [name, key, url] = entry.split(';')
        return {name, key, url}
      })
  )
  return formattedList.value
}

async function loadLastSaved() {
  const lastSelected = await window.storeAPI.get("LastSelected")
  selectedCredentials.value = {name: lastSelected}
}

async function loadCredentialList() {
  savedCredentials.value = [];
  (await formatCredentials()).forEach((credential) => {
    savedCredentials.value.push({name: credential.name})
  })
}

async function saveCredentials() {
  if (!url.value.startsWith('http://')) {
    url.value = "http://" + url.value
  }
  if (userName.value === "" || password.value === "" || url.value === "") {
    createErrorToast("Input Error", "All Fields must be filled")
  } else {
    const combined = userName.value + ";" + password.value + ";" + url.value;
    window.storeAPI.set(userName.value, combined);

    await loadCredentialList().then(() => {
      selectedCredentials.value = {name: userName.value};
    });

    changeSavedCreds();
    allInputChanged()
  }
}

async function deleteCredentials() {

  saveDisabled.value = true;

  const toDelete = selectedCredentials.value.name
  await window.storeAPI.delete(toDelete);
  toast.add({severity: 'success', summary: 'Confirmed', detail: toDelete + ' deleted', life: toastLife});
  await loadCredentialList()

  if (savedCredentials.value[0]) {
    selectedCredentials.value = savedCredentials.value[0]
    await insertCredentials(selectedCredentials.value.name)
  } else {
    await insertCredentials("")
  }
  changeSaveButton();
  allInputChanged()
}

const confirmDelete = (event) => {
  confirm.require({
    target: event.currentTarget,
    message: 'Do you want to delete these Credentials?',
    icon: 'pi pi-info-circle',
    rejectClass: 'p-button-secondary p-button-outlined p-button-sm',
    acceptClass: 'p-button-danger p-button-sm',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    accept: () => {
      deleteCredentials();
    },
    reject: () => {
    }
  });
};

function allInputChanged() {
  nameChanged();
  keyChanged();
  urlChanged()
}

function nameChanged() {
  if (userName.value === "") {
    createErrorToast("Input Error", "Name cannot be empty")
    nameNotChanged.value = true
  } else {
    nameNotChanged.value = savedName.value === userName.value;
  }
  changeSaveButton()
}

function keyChanged() {
  if (password.value === "") {
    createErrorToast("Input Error", "Admin Api Key cannot be empty")
    passwordNotChanged.value = true
  } else {
    passwordNotChanged.value = savedPassword.value === password.value;
  }
  changeSaveButton()
}

function urlChanged() {
  if (url.value === "") {
    createErrorToast("Input Error", "Url cannot be empty")
    urlNotChanged.value = true
  } else {
    urlNotChanged.value = savedUrl.value === url.value;
  }
  changeSaveButton()
}

watch(selectedCredentials, async (newVal) => {
  logInBlocked.value = true
  saveDisabled.value = true;
  if (newVal) {
    await insertCredentials(newVal.name).then(() => {
      checkConnection();
      logInBlocked.value = false
    });
  }
})

function changeSaveButton() {
  saveDisabled.value = nameNotChanged.value === true && urlNotChanged.value === true && passwordNotChanged.value === true;
}

onMounted(() => {
  loadLastSaved();
  loadCredentialList();
  checkConnection();
  setInterval(checkConnection, 1000 * 30);
});

</script>

<template>
  <ConfirmPopup></ConfirmPopup>
  <div class="flex align-items-center">

    <div v-if="connected" class="flex align-items-center text-green-600 text-xl"
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
      <Button v-tooltip.left="'Configuration'" icon="pi pi-cog" @click="visible = true"/>
      <span v-if="url === ''|| password === '' " class="pi pi-exclamation-triangle text-3xl text-yellow-500 ml-2 mb-2"
            v-tooltip.left="'Missing Credentials'"></span>
      <span v-if="!props.authorizationState" class="pi pi-exclamation-triangle text-3xl text-yellow-500 ml-2 mb-2"
            v-tooltip.left="'Unauthorized'"></span>
    </div>

  </div>

  <Dialog v-model:visible="visible" modal header="Edit Credentials" class="w-25rem h-27rem">

    <div v-if="logInBlocked" class="h-20rem flex align-items-center">
      <ProgressSpinner class="justify-content-center"/>
    </div>

    <div v-else class="h-19rem">
      <div class="field grid mt-3 p-2 flex flex-wrap">
        <FloatLabel>
          <InputText id="urlInput" type="text" class="text-base text-color surface-overlay p-2 input_Field w-20rem"
                     v-model="userName" @input="nameChanged"/>
          <label for="urlInput" class="col-fixed">Profile</label>
        </FloatLabel>
      </div>

      <div class="field grid flex flex-wrap">
        <div class="p-2">
          <FloatLabel>
            <Password id="passwordInput" v-model="password" toggleMask :feedback="false"
                      @input="keyChanged"/>
            <label for="passwordInput" class="col-fixed">Admin API Key</label>
          </FloatLabel>
        </div>
      </div>

      <div class="field grid p-2 flex flex-wrap">
        <FloatLabel>
          <InputText id="urlInput" type="text" class="text-base text-color surface-overlay p-2 input_Field w-20rem"
                     v-model="url" @input="urlChanged"/>
          <label for="urlInput" class="col-fixed">URL</label>
        </FloatLabel>
      </div>

      <div class="field grid p-2 flex justify-content-center flex-wrap">
        <div class="card flex justify-content-center">
          <Dropdown v-model="selectedCredentials" editable :options="savedCredentials" optionLabel="name"
                    placeholder="Select Option"
                    class="w-full md:w-14rem"/>
        </div>
        <Button icon="pi pi-save" class="ml-auto" @click="saveCredentials" v-tooltip.bottom="'Save Credentials'"
                :disabled="saveDisabled"/>
        <Button icon="pi pi-trash" class="ml-auto" @click="confirmDelete($event)"
                v-tooltip.bottom="'Delete Credentials'"
                :disabled="deleteDisabled"/>
      </div>
    </div>
  </Dialog>

</template>

<style scoped>
/deep/ .p-button-icon {
  font-size: 1.25rem;
}

/deep/ .p-password-input {
  width: 20rem
}
</style>