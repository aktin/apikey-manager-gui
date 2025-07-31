<script setup lang="ts">
import {onMounted, ref} from "vue";
import {useToast} from "primevue/usetoast";
import {useConfirm} from "primevue/useconfirm";
import {useI18n} from "vue-i18n";
import BrokerConnection from "../services/BrokerConnection";

import Dialog from "primevue/dialog";
import FloatLabel from "primevue/floatlabel";
import Password from "primevue/password";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import ConfirmPopup from "primevue/confirmpopup";
import ProgressSpinner from "primevue/progressspinner";
import Menu from "primevue/menu";
import LanguageSwitcher from "./LanguageSwitcher.vue";

const toast = useToast();
const confirm = useConfirm();
const {t} = useI18n();

/** Controls visibility of the configuration dialog */
const visible = ref<boolean>(false);

/** Indicates whether broker check is running */
const logInBlocked = ref<boolean>(false);

/** Controls save/delete button states */
const deleteDisabled = ref<boolean>(true);
const saveDisabled = ref<boolean>(true);

/** Field inputs */
const profile = ref<string>("");
const key = ref<string>("");
const url = ref<string>("");

/** Snapshots before changes */
const savedProfile = ref<string>("");
const savedKey = ref<string>("");
const savedUrl = ref<string>("");

/** Flags to detect if fields have changed */
const profileNotChanged = ref<boolean>(true);
const keyNotChanged = ref<boolean>(true);
const urlNotChanged = ref<boolean>(true);

/** Currently selected credential */
const selectedCredentials = ref<{ name: string } | null>(null);

/** All saved credential names */
const savedCredentials = ref<{ name: string }[]>([]);

/** Menu model for credential dropdown */
const credentials = ref<{ label: string; items: { label: string; command: () => void }[] }[]>([]);

/** Ref to PrimeVue menu */
const credentialMenu = ref();

function createErrorToast(title: string, detail: string): void {
  toast.add({severity: "error", summary: title, detail, life: 5000});
}

function createSuccessToast(detail: string): void {
  toast.add({severity: "success", summary: t("success"), detail, life: 5000});
}

function changeSavedCreds(): void {
  savedProfile.value = profile.value;
  savedKey.value = key.value;
  savedUrl.value = url.value;
}

function allInputChanged(): void {
  profileChanged();
  keyChanged();
  urlChanged();
}

function profileChanged(): void {
  profileNotChanged.value = savedProfile.value === profile.value || profile.value === "";
  if (profile.value === "") {
    createErrorToast(t("inputError"), t("profile.profileEmpty"));
  }
  updateSaveButton();
}

function keyChanged(): void {
  keyNotChanged.value = savedKey.value === key.value || key.value === "";
  if (key.value === "") {
    createErrorToast(t("inputError"), t("profile.apiKeyEmpty"));
  }
  updateSaveButton();
}

function urlChanged(): void {
  urlNotChanged.value = savedUrl.value === url.value || url.value === "";
  if (url.value === "") {
    createErrorToast(t("inputError"), t("profile.urlEmpty"));
  }
  updateSaveButton();
}

function updateSaveButton(): void {
  saveDisabled.value = profileNotChanged.value && keyNotChanged.value && urlNotChanged.value;
}

async function addProfileKey(profileName: string): Promise<void> {
  const keys = (await window.storeAPI.get("savedProfiles")) as string[] || [];
  if (!keys.includes(profileName)) {
    keys.push(profileName);
    await window.storeAPI.set("savedProfiles", keys);
  }
}

async function removeProfileKey(profileName: string): Promise<void> {
  const keys = (await window.storeAPI.get("savedProfiles")) as string[] || [];
  const updated = keys.filter(k => k !== profileName);
  await window.storeAPI.set("savedProfiles", updated);
}

function parseCredentialString(entry: string): { name: string; key: string; url: string } {
  const [name, key, url] = entry.split(";");
  return {name, key, url};
}

async function fetchFormattedCredentials(): Promise<{ name: string; key: string; url: string }[]> {
  const keys = (await window.storeAPI.get("savedProfiles")) as string[] || [];
  const results = await Promise.all(
      keys.map(async (name) => {
        const val = await window.storeAPI.get(name);
        return val ? parseCredentialString(val as string) : null;
      })
  );
  return results.filter(Boolean) as { name: string; key: string; url: string }[];
}

function updateCredentialsList(creds: { name: string }[]): void {
  const items = creds.map(cred => ({
    label: cred.name,
    command: () => handleCredentialSelectionChange(cred)
  }));
  const label = creds.length > 0 ? t("profile.selectOption") : t("profile.noSavedCredentials");
  credentials.value = [{label, items}];
}

async function loadCredentialList(): Promise<void> {
  const formatted = await fetchFormattedCredentials();
  savedCredentials.value = formatted.map(({name}) => ({name}));
  updateCredentialsList(savedCredentials.value);
}

async function insertCredentials(profileName: string): Promise<void> {
  const raw = await window.storeAPI.get(profileName);
  const isValid = !!raw;
  const [p, k, u] = isValid ? (raw as string).split(";") : ["", "", ""];

  profile.value = p;
  key.value = k;
  url.value = u;

  selectedCredentials.value = isValid ? {name: p} : null;
  deleteDisabled.value = !isValid;

  changeSavedCreds();
  allInputChanged();

  BrokerConnection.setCredentials(url.value, key.value);
  await window.storeAPI.set("LastSelected", profile.value);
}

async function handleCredentialSelectionChange(cred: { name: string }): Promise<void> {
  logInBlocked.value = true;
  saveDisabled.value = true;
  await insertCredentials(cred.name);
  logInBlocked.value = false;
}

async function loadLastSaved(): Promise<void> {
  const last = await window.storeAPI.get("LastSelected");
  if (typeof last === "string") {
    selectedCredentials.value = {name: last};
    await insertCredentials(last);
  }
}

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

function changeCredentials(event: Event): void {
  credentialMenu.value?.toggle(event);
}

async function saveCredentials(): Promise<void> {
  if (checkCredentials()) {
    const combined = `${profile.value};${key.value};${url.value}`;
    await window.storeAPI.set(profile.value, combined);
    await addProfileKey(profile.value);
    await handleCredentialSelectionChange({name: profile.value});
    await loadCredentialList();
  }
}

async function deleteCredentials(): Promise<void> {
  saveDisabled.value = true;
  const toDelete = selectedCredentials.value?.name;
  if (!toDelete) return;

  await window.storeAPI.delete(toDelete);
  await removeProfileKey(toDelete);
  createSuccessToast(toDelete + " " + t("profile.deleted"));

  await loadCredentialList();

  if (savedCredentials.value[0]) {
    await handleCredentialSelectionChange(savedCredentials.value[0]);
  } else {
    await insertCredentials("");
  }
}

function confirmDelete(event: Event): void {
  const target = event.currentTarget as HTMLElement | null;
  if (!target) return;

  confirm.require({
    target,
    message: t("profile.deleteConfirm"),
    icon: "pi pi-info-circle",
    rejectClass: "p-button-secondary p-button-outlined p-button-sm",
    acceptClass: "p-button-danger p-button-sm",
    rejectLabel: t("profile.cancel"),
    acceptLabel: t("profile.delete"),
    accept: deleteCredentials
  });
}

onMounted(async () => {
  const keys = await window.storeAPI.get("savedProfiles");
  if (!Array.isArray(keys)) {
    await window.storeAPI.set("savedProfiles", []);
  }
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
