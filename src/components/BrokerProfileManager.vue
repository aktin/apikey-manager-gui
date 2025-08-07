<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {useToast} from "primevue/usetoast";
import {useConfirm} from "primevue/useconfirm";
import {useI18n} from "vue-i18n";
import BrokerConnection from "../services/BrokerConnection";
import {createErrorToast, createInfoToast, createSuccessToast} from "../services/ToastWrapper";

import Dialog from "primevue/dialog";
import FloatLabel from "primevue/floatlabel";
import Password from "primevue/password";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import ConfirmPopup from "primevue/confirmpopup";
import ProgressSpinner from "primevue/progressspinner";
import Menu from "primevue/menu";
import LanguageSwitcher from "./LanguageSwitcher.vue";
import ProfileStorage, {type CredentialProfile} from "../services/ProfileStorage";

const toast = useToast();
const confirm = useConfirm();
const {t} = useI18n();

const visible = ref<boolean>(false);
const logInBlocked = ref<boolean>(false);

const deleteBtnDisabled = ref<boolean>(true);

const name = ref<string>("");
const key = ref<string>("");
const url = ref<string>("");

const savedName = ref<string>("");
const savedKey = ref<string>("");
const savedUrl = ref<string>("");

const selectedCredentials = ref<{ name: string } | null>(null);
const savedCredentials = ref<{ name: string }[]>([]);
const credentials = ref<{ label: string; items: { label: string; command: () => void }[] }[]>([]);

const credentialsMenu = ref();
const suppressInputValidation = ref(false);

const saveBtnDisabled = computed(() =>
    (nameNotChanged.value && keyNotChanged.value && urlNotChanged.value) ||
    !name.value || !key.value || !url.value
);

const nameNotChanged = computed(() =>
    savedName.value === name.value || name.value === ""
);
const keyNotChanged = computed(() =>
    savedKey.value === key.value || key.value === ""
);
const urlNotChanged = computed(() =>
    savedUrl.value === url.value || url.value === ""
);

function openCredentialsMenu(event: Event): void {
  credentialsMenu.value?.toggle(event);
}

async function fetchCredentials(): Promise<CredentialProfile[]> {
  return await ProfileStorage.getAllProfiles();
}

function updateCredentialsList(creds: { name: string }[]): void {
  const items = creds.map(cred => ({
    label: cred.name,
    command: () => handleCredentialSelectionChange(cred)
  }));
  const label = creds.length > 0 ? t("profile.selectProfile") : t("profile.noSavedProfiles");
  credentials.value = [{label, items}];
}

async function loadCredentialList(): Promise<void> {
  const formatted = await fetchCredentials();
  savedCredentials.value = formatted.map(({name}) => ({name}));
  updateCredentialsList(savedCredentials.value);
}

function changeSavedCreds(): void {
  savedName.value = name.value;
  savedKey.value = key.value;
  savedUrl.value = url.value;
}

async function insertCredentials(profileName: string): Promise<void> {
  const profileData = await ProfileStorage.getProfile(profileName);
  const isValid = !!profileData;
  name.value = profileData?.name ?? "";
  key.value = profileData?.key ?? "";
  url.value = profileData?.url ?? "";

  selectedCredentials.value = isValid ? {name: name.value} : null;
  deleteBtnDisabled.value = !isValid;

  changeSavedCreds();
  BrokerConnection.setCredentials(url.value, key.value);
  await ProfileStorage.setLastSelected(name.value);
}

async function handleCredentialSelectionChange(cred: { name: string }): Promise<void> {
  logInBlocked.value = true;
  await insertCredentials(cred.name);
  logInBlocked.value = false;
  createInfoToast(toast, t("common.info"), t("profile.switched", {profile: cred.name}));
}

async function loadLastSaved(): Promise<void> {
  const last = await ProfileStorage.getLastSelected();
  if (typeof last === "string") {
    selectedCredentials.value = {name: last};
    await insertCredentials(last);
  }
}

function checkCredentials(): boolean {
  const alphaNumericPattern = /^[a-zA-Z0-9]+$/;
  const urlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
  let isValid = true;
  if (!url.value.startsWith("http://") && !url.value.startsWith("https://")) {
    url.value = "https://" + url.value;
  }
  if (!alphaNumericPattern.test(name.value)) {
    createErrorToast(toast, t("common.inputError"), t("common.symbolError", {fieldName: t("profile.name")}));
    isValid = false;
  }
  if (!alphaNumericPattern.test(key.value)) {
    createErrorToast(toast, t("common.inputError"), t("common.symbolError", {fieldName: t("profile.key")}));
    isValid = false;
  }
  if (!urlPattern.test(url.value)) {
    createErrorToast(toast, t("common.inputError"), t("common.symbolError", {fieldName: t("profile.url")}));
    isValid = false;
  }
  if (name.value === "LastSelected") {
    createErrorToast(toast, t("common.inputError"), t("profile.invalidName"));
    return false;
  }
  return isValid;
}

async function saveCredentials(): Promise<void> {
  if (!checkCredentials()) return;
  const profileData: CredentialProfile = {name: name.value, key: key.value, url: url.value};
  await ProfileStorage.saveProfile(profileData);
  createSuccessToast(toast, t("common.success"), t("profile.createdNewProfile", {profile: name.value}));
  await handleCredentialSelectionChange({name: name.value});
  await loadCredentialList();
}

async function deleteCredentials(): Promise<void> {
  const toDelete = selectedCredentials.value?.name;
  if (!toDelete) return;
  await ProfileStorage.deleteProfile(toDelete);
  createSuccessToast(toast, t("common.success"), t("profile.deletedProfile", {profile: toDelete}));
  await loadCredentialList();
  suppressInputValidation.value = true;
  if (savedCredentials.value[0]) {
    await handleCredentialSelectionChange(savedCredentials.value[0]);
  } else {
    await insertCredentials("");
  }
  suppressInputValidation.value = false;
}

function confirmDelete(event: Event): void {
  const target = event.currentTarget as HTMLElement | null;
  if (!target) return;
  confirm.require({
    target,
    message: t("profile.confirmDelete"),
    icon: "pi pi-info-circle",
    rejectClass: "p-button-secondary p-button-outlined p-button-sm",
    acceptClass: "p-button-danger p-button-sm",
    rejectLabel: t("profile.cancel"),
    acceptLabel: t("profile.delete"),
    accept: deleteCredentials
  });
}

onMounted(async () => {
  await loadLastSaved();
  await loadCredentialList();
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
      <div class="flex flex-column justify-content-between">
        <div class="field grid mt-3 p-2 flex flex-wrap align-items-center">
          <FloatLabel>
            <InputText v-model="name" class="w-20rem"/>
            <label>{{ t("profile.name") }}</label>
          </FloatLabel>
        </div>

        <div class="field grid p-2 flex flex-wrap align-items-center">
          <FloatLabel>
            <Password v-model="key" toggleMask :feedback="false"/>
            <label>{{ t("profile.key") }}</label>
          </FloatLabel>
        </div>

        <div class="field grid p-2 flex flex-wrap align-items-center">
          <FloatLabel>
            <InputText v-model="url" class="w-20rem"/>
            <label>{{ t("profile.url") }}</label>
          </FloatLabel>
        </div>
      </div>

      <div class="flex flex-column justify-content-between ml-auto">
        <LanguageSwitcher/>
        <Button icon="pi pi-save" @click="saveCredentials" :disabled="saveBtnDisabled" v-tooltip.bottom="t('profile.saveProfile')"/>
        <Button icon="pi pi-trash" @click="confirmDelete" :disabled="deleteBtnDisabled" v-tooltip.bottom="t('profile.deleteProfile')"/>
        <Button icon="pi pi-arrow-right-arrow-left" @click="openCredentialsMenu" v-tooltip.bottom="t('profile.selectProfile')"/>
        <Menu ref="credentialsMenu" :model="credentials" :popup="true"/>
      </div>
    </div>
  </Dialog>
</template>
