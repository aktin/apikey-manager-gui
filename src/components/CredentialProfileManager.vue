<script setup lang="ts">
import {defineEmits, defineProps, onMounted, ref} from "vue";
import BrokerConnection from "../services/BrokerConnection";
import {useToast} from "primevue/usetoast";
import {useConfirm} from "primevue/useconfirm";
import {useI18n} from "vue-i18n";

import Dialog from "primevue/dialog";
import FloatLabel from "primevue/floatlabel";
import Password from "primevue/password";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import ConfirmPopup from "primevue/confirmpopup";
import ProgressSpinner from "primevue/progressspinner";
import Menu from "primevue/menu";
import LanguageSwitcher from "./LanguageSwitcher.vue";

const {t} = useI18n();
const toast = useToast();
const confirm = useConfirm();
const emit = defineEmits(["update:isConnected", "update:url"]);

const props = defineProps<{ authorizationState: boolean }>();

const toastLife = 5000;

// UI State
const visible = ref(false);
const logInBlocked = ref(false);
const deleteDisabled = ref(true);
const saveDisabled = ref(true);

// Form inputs
const profile = ref("");
const key = ref("");
const url = ref("");

// Saved (for change detection)
const savedProfile = ref("");
const savedKey = ref("");
const savedUrl = ref("");

// Validation
const profileNotChanged = ref(true);
const keyNotChanged = ref(true);
const urlNotChanged = ref(true);

// Credentials & menu state
const selectedCredentials = ref();
const savedCredentials = ref([]);
const credentialMenu = ref();
const credentials = ref([{label: "", items: []}]);

function createErrorToast(title: string, detail: string) {
  toast.add({severity: "error", summary: title, detail, life: toastLife});
}

function createSuccessToast(detail: string) {
  toast.add({severity: "success", summary: t("success"), detail, life: toastLife});
}

async function checkConnection() {
  const status = await BrokerConnection.getBrokerStatus();
  const isConnected = url.value !== "" && status === 200;
  emit("update:isConnected", isConnected);
}

function changeSavedCreds() {
  savedProfile.value = profile.value;
  savedKey.value = key.value;
  savedUrl.value = url.value;
}

function allInputChanged() {
  profileChanged();
  keyChanged();
  urlChanged();
}

function profileChanged() {
  if (profile.value === "") {
    createErrorToast(t("inputError"), t("profile.profileEmpty"));
    profileNotChanged.value = true;
  } else {
    profileNotChanged.value = savedProfile.value === profile.value;
  }
  updateSaveButton();
}

function keyChanged() {
  if (key.value === "") {
    createErrorToast(t("inputError"), t("profile.apiKeyEmpty"));
    keyNotChanged.value = true;
  } else {
    keyNotChanged.value = savedKey.value === key.value;
  }
  updateSaveButton();
}

function urlChanged() {
  if (url.value === "") {
    createErrorToast(t("inputError"), t("profile.urlEmpty"));
    urlNotChanged.value = true;
  } else {
    urlNotChanged.value = savedUrl.value === url.value;
  }
  updateSaveButton();
}

//activates save button only if input is different from selected credentials
function updateSaveButton() {
  saveDisabled.value = profileNotChanged.value && urlNotChanged.value && keyNotChanged.value;
}

//opens menu for credential selection
function changeCredentials(event: Event) {
  credentialMenu.value?.toggle(event);
}

//formats credential string into uniform dictionary
function parseCredentialString(entry: string) {
  const [name, key, url] = entry.split(";");
  return {name, key, url};
}

//gets saved credentials from storage and formats them into a list of dictionaries
async function fetchFormattedCredentials() {
  const rawData = await window.storeAPI.get();
  return Object.entries(rawData)
  .filter(([k]) => k !== "LastSelected")
  .map(([, val]) => parseCredentialString(val as string));
}

//creates list of selectable credentials
function updateCredentialsList(creds: { name: string }[]) {
  const items = creds.map(cred => ({
    label: cred.name,
    command: () => handleCredentialSelectionChange(cred)
  }));
  const label = items.length > 0 ? t("profile.selectOption") : t("profile.noSavedCredentials");
  credentials.value = [{label, items}];
}

//creates list from saved credentials
async function loadCredentialList() {
  const formatted = await fetchFormattedCredentials();
  savedCredentials.value = formatted.map(({name}) => ({name}));
  updateCredentialsList(savedCredentials.value);
}

//inserts data from selected credentials into input fields and BrokerConnection.js and updates table
async function insertCredentials(creds: string) {
  const raw = await window.storeAPI.get(creds);
  const isValid = !!raw;
  const [profileName, adminKey, brokerUrl] = isValid ? (raw as string).split(";") : ["", "", ""];

  profile.value = profileName;
  key.value = adminKey;
  url.value = brokerUrl;

  selectedCredentials.value = isValid ? {name: profileName} : "";

  deleteDisabled.value = !isValid;
  changeSavedCreds();
  allInputChanged();
  BrokerConnection.setCredentials(url.value, key.value);
  emit("update:url", url.value);

  window.storeAPI.set("LastSelected", profile);
  await window.callVueFunction?.();
}

//checks which credentials are selected and loads them
async function handleCredentialSelectionChange(cred: { name: string }) {
  selectedCredentials.value = cred;
  logInBlocked.value = true;
  saveDisabled.value = true;
  await insertCredentials(cred.name);
  await checkConnection();
  logInBlocked.value = false;
}

//loads last selected credentials into input fields
async function loadLastSaved() {
  const last = await window.storeAPI.get("LastSelected");
  selectedCredentials.value = {name: last};
  await insertCredentials(last as string);
  await checkConnection();
}

//checks inputted credentials for formatting and specific characters and gives feedback in ui
function checkCredentials(): boolean {
  const pattern = /[@#§`´°~$%^*"{}|;<>[\]]/;
  let isValid = true;
  if (!url.value.startsWith("http://") && !url.value.startsWith("https://")) {
    url.value = "http://" + url.value;
  }
  if (pattern.test(profile.value)) {
    createErrorToast(t("inputError"), `${t("profile.profile")} ${t("form.symbolError")}`);
    isValid = false;
  }
  if (pattern.test(key.value)) {
    createErrorToast(t("inputError"), `Admin API Key ${t("form.symbolError")}`);
    isValid = false;
  }
  if (pattern.test(url.value)) {
    createErrorToast(t("inputError"), `URL ${t("form.symbolError")}`);
    isValid = false;
  }
  if (!profile.value || !key.value || !url.value) {
    createErrorToast(t("inputError"), t("profile.fieldsMustBeFilled"));
    return false;
  }
  if (profile.value === "LastSelected") {
    createErrorToast(t("inputError"), t("profile.invalidName"));
    return false;
  }
  return isValid;
}

//saves inputted credentials in storage and loads their data
async function saveCredentials() {
  if (checkCredentials()) {
    const combined = `${profile.value};${key.value};${url.value}`;
    window.storeAPI.set(profile.value, combined);
    await handleCredentialSelectionChange({name: profile.value});
    await loadCredentialList();
  }
}

//deletes selected credentials from storage and loads first credentials in storage and gives feedback in ui
async function deleteCredentials() {
  saveDisabled.value = true;
  const toDelete = selectedCredentials.value.name;
  await window.storeAPI.delete(toDelete);
  createSuccessToast(toDelete + " " + t("profile.deleted"));
  await loadCredentialList();
  if (savedCredentials.value[0]) {
    await handleCredentialSelectionChange(savedCredentials.value[0]);
  } else {
    await insertCredentials("");
  }
}

//creates popup for deleting selected saved credentials
function confirmDelete(event: Event) {
  confirm.require({
    target: event.currentTarget,
    message: t("profile.deleteConfirm"),
    icon: "pi pi-info-circle",
    rejectClass: "p-button-secondary p-button-outlined p-button-sm",
    acceptClass: "p-button-danger p-button-sm",
    rejectLabel: t("profile.cancel"),
    acceptLabel: t("profile.delete"),
    accept: deleteCredentials
  });
}

onMounted(() => {
  loadLastSaved();
  loadCredentialList();
  setInterval(checkConnection, 1000 * 30);
});
</script>

<template>
  <ConfirmPopup/>
  <Button icon="pi pi-cog" @click="visible = true" v-tooltip.left="t('profile.configuration')"/>

  <Dialog v-model:visible="visible" modal :header="t('profile.editCredentials')" class="w-30rem h-25rem">
    <div v-if="logInBlocked" class="h-18rem flex align-items-center">
      <ProgressSpinner class="justify-content-center"/>
    </div>

    <div v-else class="flex flex-row flex-wrap h-18rem">
      <!-- Inputs -->
      <div class="flex flex-column justify-content-between">
        <div class="field grid mt-3 p-2 flex flex-wrap align-items-center">
          <FloatLabel>
            <InputText v-model="profile" @input="profileChanged" class="w-20rem"/>
            <label>{{ t("profile.profile") }}</label>
          </FloatLabel>
        </div>

        <div class="field grid p-2 flex flex-wrap align-items-center">
          <FloatLabel>
            <Password v-model="key" toggleMask :feedback="false" @input="keyChanged"/>
            <label>{{ t("profile.key") }}</label>
          </FloatLabel>
        </div>

        <div class="field grid p-2 flex flex-wrap align-items-center">
          <FloatLabel>
            <InputText v-model="url" @input="urlChanged" class="w-20rem"/>
            <label>{{ t("profile.url") }}</label>
          </FloatLabel>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-column justify-content-between ml-auto">
        <LanguageSwitcher/>

        <Button icon="pi pi-save" @click="saveCredentials" :disabled="saveDisabled" v-tooltip.bottom="t('profile.saveCredentials')"/>
        <Button icon="pi pi-trash" @click="confirmDelete" :disabled="deleteDisabled" v-tooltip.bottom="t('profile.deleteCredentials')"/>

        <Button icon="pi pi-arrow-right-arrow-left" @click="changeCredentials" v-tooltip.bottom="t('profile.selectOption')"/>
        <Menu ref="credentialMenu" :model="credentials" :popup="true"/>
      </div>
    </div>
  </Dialog>
</template>
