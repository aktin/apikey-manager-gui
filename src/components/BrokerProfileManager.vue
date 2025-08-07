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

const selectedProfile = ref<{ name: string } | null>(null);
const savedProfiles = ref<{ name: string }[]>([]);
const profilesList = ref<{ label: string; items: { label: string; command: () => void }[] }[]>([]);

const profilesMenu = ref();
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

function openProfilesMenu(event: Event): void {
  profilesMenu.value?.toggle(event);
}

async function fetchProfiles(): Promise<CredentialProfile[]> {
  return await ProfileStorage.getAllProfiles();
}

function updateProfilesList(profiles: { name: string }[]): void {
  const items = profiles.map(profile => ({
    label: profile.name,
    command: () => handleProfileChange(profile)
  }));
  const label = profiles.length > 0 ? t("profile.selectProfile") : t("profile.noSavedProfiles");
  profilesList.value = [{label, items}];
}

async function loadProfilesList(): Promise<void> {
  const formatted = await fetchProfiles();
  savedProfiles.value = formatted.map(({name}) => ({name}));
  updateProfilesList(savedProfiles.value);
}

function changeSavedProfile(): void {
  savedName.value = name.value;
  savedKey.value = key.value;
  savedUrl.value = url.value;
}

async function insertProfile(profileName: string): Promise<void> {
  const profileData = await ProfileStorage.getProfile(profileName);
  const isValid = !!profileData;
  name.value = profileData?.name ?? "";
  key.value = profileData?.key ?? "";
  url.value = profileData?.url ?? "";

  selectedProfile.value = isValid ? {name: name.value} : null;
  deleteBtnDisabled.value = !isValid;

  changeSavedProfile();
  BrokerConnection.setCredentials(url.value, key.value);
  await ProfileStorage.setLastSelected(name.value);
}

async function handleProfileChange(profile: { name: string }): Promise<void> {
  logInBlocked.value = true;
  await insertProfile(profile.name);
  logInBlocked.value = false;
  createInfoToast(toast, t("common.info"), t("profile.switched", {profile: profile.name}));
}

async function loadLastSavedProfile(): Promise<void> {
  const last = await ProfileStorage.getLastSelected();
  if (typeof last === "string") {
    selectedProfile.value = {name: last};
    await insertProfile(last);
  }
}

function checkInputs(): boolean {
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

async function saveProfile(): Promise<void> {
  if (!checkInputs()) return;
  const profileData: CredentialProfile = {name: name.value, key: key.value, url: url.value};
  await ProfileStorage.saveProfile(profileData);
  createSuccessToast(toast, t("common.success"), t("profile.createdNewProfile", {profile: name.value}));
  await handleProfileChange({name: name.value});
  await loadProfilesList();
}

async function deleteProfile(): Promise<void> {
  const toDelete = selectedProfile.value?.name;
  if (!toDelete) return;
  await ProfileStorage.deleteProfile(toDelete);
  createSuccessToast(toast, t("common.success"), t("profile.deletedProfile", {profile: toDelete}));
  await loadProfilesList();
  suppressInputValidation.value = true;
  if (savedProfiles.value[0]) {
    await handleProfileChange(savedProfiles.value[0]);
  } else {
    await insertProfile("");
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
    accept: deleteProfile
  });
}

onMounted(async () => {
  await loadLastSavedProfile();
  await loadProfilesList();
});
</script>

<template>
  <ConfirmPopup/>
  <Button icon="pi pi-cog" @click="visible = true" v-tooltip.left="t('profile.openConfiguration')"/>

  <Dialog v-model:visible="visible" modal :header="t('profile.configuration')" class="w-30rem h-25rem">
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
        <Button icon="pi pi-save" @click="saveProfile" :disabled="saveBtnDisabled" v-tooltip.bottom="t('profile.saveProfile')"/>
        <Button icon="pi pi-trash" @click="confirmDelete" :disabled="deleteBtnDisabled" v-tooltip.bottom="t('profile.deleteProfile')"/>
        <Button icon="pi pi-arrow-right-arrow-left" @click="openProfilesMenu" v-tooltip.bottom="t('profile.selectProfile')"/>
        <Menu ref="profilesMenu" :model="profilesList" :popup="true"/>
      </div>
    </div>
  </Dialog>
</template>
