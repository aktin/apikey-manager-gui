<script setup>
import BrokerConnection from './BrokerConnection.js';
import 'primeicons/primeicons.css';
import {computed, defineProps, onMounted, ref} from 'vue';
import Dialog from 'primevue/dialog';
import FloatLabel from "primevue/floatlabel";
import Password from "primevue/password";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import {useToast} from "primevue/usetoast";
import ConfirmPopup from 'primevue/confirmpopup';
import {useConfirm} from "primevue/useconfirm";
import ProgressSpinner from 'primevue/progressspinner';
import Menu from 'primevue/menu';
import {watchEffect} from 'vue';
import {useI18n} from 'vue-i18n';

const {locale} = useI18n();
const setLanguage = (newLang) => {
  locale.value = newLang;
  localStorage.setItem('lang', newLang);
};
watchEffect(() => {
  const storedLang = localStorage.getItem('lang');
  if (storedLang) {
    locale.value = storedLang;
  }
});
const {t} = useI18n();

const props = defineProps({
  authorizationState: Boolean,
});

const logInBlocked = ref(false);
const visible = ref(false);
const deleteDisabled = ref(true);
const saveDisabled = ref(true);

const selectedCredentials = ref();
const savedCredentials = ref([]);

const status = ref(null);
const connected = ref(false);

const userName = ref("");
const password = ref("");
const url = ref("");

const savedName = ref("");
const savedPassword = ref("");
const savedUrl = ref("");

const nameNotChanged = ref(true);
const passwordNotChanged = ref(true);
const urlNotChanged = ref(true);

const emit = defineEmits(["update:isConnected"]);
const confirm = useConfirm();
const toast = useToast();
const toastLife = 1000 * 5;

function createErrorToast(title, detail) {
  toast.add({severity: "error", summary: title, detail, life: toastLife})
}

const changeLocalsLabel = computed(() => t('checker.changeLocal'))
const languageMenu = ref();
//creates list of selectable languages
const languages = ref([
  {
    label: changeLocalsLabel,
    items: [
      {
        label: 'English',
        command: () => setLanguage('en')
      },
      {
        label: 'Deutsch',
        command: () => setLanguage('de')
      }
    ]
  }
]);

//opens menu for language selection
const toggleLanguage = (event) => {
  languageMenu.value.toggle(event);
};

const changeCredsLabel = computed(() => t('checker.selectOption'))
const changeNoCredsLabel = computed(() => t("checker.noSavedCredentials"))
const credentialMenu = ref();
const credentials = ref([
  {
    label: changeCredsLabel,
    items: []
  }
]);
//opens menu for credential selection
const changeCredentials = (event) => {
  credentialMenu.value.toggle(event);
};

//tells other classes if a connection is established if a url is entered
function sendConnectionStatus(statusCode) {
  if (url.value === "") {
    emit("update:isConnected", false);
  } else {
    connected.value = statusCode === 200;
    emit("update:isConnected", connected.value);
  }
}

//checks if connection to broker is established
async function checkConnection() {
  status.value = await BrokerConnection.getBrokerStatus();
  sendConnectionStatus(status.value);
}

//caches inputted credentials
function changeSavedCreds() {
  savedName.value = userName.value;
  savedPassword.value = password.value;
  savedUrl.value = url.value;
}

//inserts data from selected credentials into input fields and BrokerConnection.js and updates table
async function insertCredentials(nameValue) {
  const credentialsRaw = await window.storeAPI.get(nameValue)
  const isCredentialsValid = !!credentialsRaw;
  const [profile, adminKey, address] = isCredentialsValid ? credentialsRaw.split(';') : ["", "", ""];
  userName.value = profile;
  password.value = adminKey;
  url.value = address;
  if (!isCredentialsValid) {
    selectedCredentials.value = "";
  }
  deleteDisabled.value = !isCredentialsValid;
  changeSavedCreds()
  allInputChanged()
  BrokerConnection.setCredentials(url.value, password.value)
  window.storeAPI.set("LastSelected", nameValue);
  await window.callVueFunction();
}

//loads last selected credentials into input fields
async function loadLastSaved() {
  const lastSelected = await window.storeAPI.get("LastSelected")
  selectedCredentials.value = {name: lastSelected}
  await insertCredentials(lastSelected).then(() => {
    checkConnection();
  });
}

//formats credential string into uniform dictionary
function parseCredentialString(entry) {
  const [name, key, url] = entry.split(';')
  return {name, key, url}
}

//gets saved credentials from storage and formats them into a list of dictionaries
async function fetchFormattedCredentials() {
  const rawData = await window.storeAPI.get()
  return Object.entries(rawData)
      .filter(([key]) => key !== 'LastSelected')
      .map(([, value]) => parseCredentialString(value))
}

//checks which credentials are selected and loads them
async function handleCredentialSelectionChange(cred) {
  selectedCredentials.value = cred
  logInBlocked.value = true
  saveDisabled.value = true
  await insertCredentials(cred.name)
  await checkConnection()
  logInBlocked.value = false
}

//creates list of selectable credentials
function updateCredentialsList(credsList) {
  const items = credsList.map((cred) => ({
    label: cred.name,
    command: async () => handleCredentialSelectionChange(cred)
  }))
  const label = items.length > 0 ? changeCredsLabel : changeNoCredsLabel
  credentials.value = [{label, items}]
}

//creates list from saved credentials
async function loadCredentialList() {
  const formatted = await fetchFormattedCredentials()
  savedCredentials.value = formatted.map(({name}) => ({name}))
  updateCredentialsList(savedCredentials.value)
}

//checks inputted credentials for formatting and specific characters and gives feedback in ui
function checkCredentials() {
  const pattern = /[@#§`´°~$%^*"{}|;<>[\]]/
  let isValid = true
  if (!url.value.startsWith('http://') && !url.value.startsWith('https://')) {
    url.value = "http://" + url.value
  }
  if (pattern.test(userName.value)) {
    createErrorToast(t("inputError"), t("checker.profile") + " " + t("form.symbolError"))
    isValid = false
  }
  if (pattern.test(password.value)) {
    createErrorToast(t("inputError"), "Admin API Key " + t("form.symbolError"))
    isValid = false
  }
  if (pattern.test(url.value)) {
    createErrorToast(t("inputError"), "URL " + t("form.symbolError"))
    isValid = false
  }
  if (userName.value === "" || password.value === "" || url.value === "") {
    createErrorToast(t("inputError"), t("checker.fieldsMustBeFilled"))
    return false
  } else if (userName.value === "LastSelected") {
    createErrorToast(t("inputError"), t("checker.invalidName"))
    return false
  }
  return isValid
}

//saves inputted credentials in storage and loads their data
async function saveCredentials() {
  if (checkCredentials()) {
    const combined = userName.value + ";" + password.value + ";" + url.value;
    window.storeAPI.set(userName.value, combined);
    await handleCredentialSelectionChange({name: userName.value});
    await loadCredentialList()
  }
}

//deletes selected credentials from storage and loads first credentials in storage and gives feedback in ui
async function deleteCredentials() {
  saveDisabled.value = true;
  const toDelete = selectedCredentials.value.name
  await window.storeAPI.delete(toDelete);
  toast.add({
    severity: "success",
    summary: t("checker.confirmed"),
    detail: toDelete + t("checker.deleted"),
    life: toastLife
  });
  await loadCredentialList()

  if (savedCredentials.value[0]) {
    await handleCredentialSelectionChange(savedCredentials.value[0])
  } else {
    await insertCredentials("")
  }
}

//creates popup for deleting selected saved credentials
const confirmDelete = (event) => {
  confirm.require({
    target: event.currentTarget,
    message: t("checker.deleteConfirm"),
    icon: 'pi pi-info-circle',
    rejectClass: 'p-button-secondary p-button-outlined p-button-sm',
    acceptClass: 'p-button-danger p-button-sm',
    rejectLabel: t("checker.cancel"),
    acceptLabel: t("checker.delete"),
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

//checks if inputted Profile Name is different from selected
function nameChanged() {
  if (userName.value === "") {
    createErrorToast(t("inputError"), t("checker.profileEmpty"))
    nameNotChanged.value = true
  } else {
    nameNotChanged.value = savedName.value === userName.value;
  }
  changeSaveButton()
}

//checks if inputted Admin API Key is different from selected
function keyChanged() {
  if (password.value === "") {
    createErrorToast(t("inputError"), t("checker.apiKeyEmpty"))
    passwordNotChanged.value = true
  } else {
    passwordNotChanged.value = savedPassword.value === password.value;
  }
  changeSaveButton()
}

//checks if inputted url is different from selected
function urlChanged() {
  if (url.value === "") {
    createErrorToast(t("inputError"), t("checker.urlEmpty"))
    urlNotChanged.value = true
  } else {
    urlNotChanged.value = savedUrl.value === url.value;
  }
  changeSaveButton()
}

//activates save button only if input is different from selected credentials
function changeSaveButton() {
  saveDisabled.value = nameNotChanged.value === true && urlNotChanged.value === true && passwordNotChanged.value === true;
}

//loads last selected credentials into input fields upon start
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
      <p class="font-bold">{{ t("checker.connected") }}</p>
    </div>

    <div v-else class="flex align-items-center text-red-600 text-xl"
         v-tooltip.left="BrokerConnection.getCredentials().url">
      <i class="pi pi-circle-fill mx-2"/>
      <p class="font-bold">{{ t("checker.noConnection") }}</p>
    </div>

    <div class="ml-auto p-1">
      <Button v-tooltip.left="t('checker.configuration')" icon="pi pi-cog" @click="visible = true"/>
      <span v-if="url === ''|| password === '' " class="pi pi-exclamation-triangle text-3xl text-yellow-500 ml-2 mb-2"
            v-tooltip.left="t('checker.missingCredentials')"></span>
      <span v-if="!props.authorizationState" class="pi pi-exclamation-triangle text-3xl text-yellow-500 ml-2 mb-2"
            v-tooltip.left="t('checker.unauthorized')"></span>
    </div>
  </div>

  <Dialog v-model:visible="visible" modal :header="t('checker.editCredentials')" class="w-30rem h-25rem">

    <div v-if="logInBlocked" class="h-18rem flex align-items-center">
      <ProgressSpinner class="justify-content-center"/>
    </div>

    <div v-else class="flex flex-row flex-wrap h-18rem">
      <div class="flex flex-column justify-content-between">
        <div class="field grid mt-3 p-2 flex flex-wrap align-items-center ">
          <FloatLabel>
            <InputText id="urlInput" type="text" class="text-base text-color surface-overlay p-2 input_Field w-20rem"
                       v-model="userName" @input="nameChanged"/>
            <label for="urlInput" class="col-fixed">{{ t("checker.profile") }}</label>
          </FloatLabel>
        </div>

        <div class="field grid p-2 flex flex-wrap align-items-center">
          <FloatLabel>
            <Password id="passwordInput" v-model="password" toggleMask :feedback="false"
                      @input="keyChanged"/>
            <label for="passwordInput" class="col-fixed">Admin API Key</label>
          </FloatLabel>
        </div>

        <div class="field grid p-2 flex flex-wrap align-items-center">
          <FloatLabel>
            <InputText id="urlInput" type="text" class="text-base text-color surface-overlay p-2 input_Field w-20rem"
                       v-model="url" @input="urlChanged"/>
            <label for="urlInput" class="col-fixed">URL</label>
          </FloatLabel>
        </div>

      </div>
      <div class="flex flex-column justify-content-between ml-auto">
        <Button type="button" icon="pi pi-language" @click="toggleLanguage" aria-haspopup="true"
                aria-controls="locals_menu" class="" v-tooltip.bottom="t('checker.changeLocal')"/>
        <Menu ref="languageMenu" id="locals_menu" :model="languages" :popup="true"/>

        <Button icon="pi pi-save" class="" @click="saveCredentials"
                v-tooltip.bottom="t('checker.saveCredentials')"
                :disabled="saveDisabled"/>

        <Button icon="pi pi-trash" class="" @click="confirmDelete($event)"
                v-tooltip.bottom="t('checker.deleteCredentials')"
                :disabled="deleteDisabled"/>

        <Button type="button" icon="pi pi-arrow-right-arrow-left" @click="changeCredentials" aria-haspopup="true"
                aria-controls="creds_menu" class="" v-tooltip.bottom="t('checker.selectOption')"/>
        <Menu ref="credentialMenu" id="creds_menu" :model="credentials" :popup="true"/>
      </div>
    </div>
  </Dialog>
</template>
<style scoped>
:deep() .p-button-icon {
  font-size: 1.25rem;
}

:deep() .p-password-input {
  width: 20rem
}
</style>