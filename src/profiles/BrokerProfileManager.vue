<script setup lang="ts">
/**
 * BrokerProfileManager.vue
 *
 * Manages encrypted broker credential profiles.
 *
 * Features:
 * - Loads, saves, deletes, and switches between credential profiles
 * - Validates input before saving (API key, profile name, and URL)
 * - Integrates with AES-encrypted profile storage (via ProfileStorage)
 * - Updates BrokerConnection credentials on profile switch
 * - Displays localized toast messages and confirmation prompts
 * - Persists last selected profile for reuse on startup
 * - Stores the optional test database (connection and placeholder dates for
 *   the query builder) as part of the profile
 * - Stores UI language and display time zone with the profile; both take
 *   effect immediately when changed and are re-applied on profile switch
 *
 * UI:
 * - Floating dialog with the profile name on top
 * - Collapsible sections: broker (key, URL), test database, miscellaneous
 *   (language, time zone)
 * - Save/Delete/Select buttons and embedded language switcher
 */
import { computed, onMounted, ref } from "vue";
import moment from "moment";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { useI18n } from "vue-i18n";
import BrokerConnection from "../broker/BrokerConnection";
import {
  createErrorToast,
  createInfoToast,
  createSuccessToast
} from "../shared/ToastWrapper";

import Dialog from "primevue/dialog";
import FloatLabel from "primevue/floatlabel";
import Password from "primevue/password";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import DatePicker from "primevue/datepicker";
import Panel from "primevue/panel";
import Button from "primevue/button";
import ConfirmPopup from "primevue/confirmpopup";
import ProgressSpinner from "primevue/progressspinner";
import Menu from "primevue/menu";
import LanguageSwitcher from "./LanguageSwitcher.vue";
import Select from "primevue/select";
import SelectButton from "primevue/selectbutton";
import ProfileStorage from "./ProfileStorage";
import { CredentialProfile, TestDatabaseConfig } from "./CredentialProfile";
import { LOCAL_TIME_ZONE, UTC_TIME_ZONE, timeZone } from "../shared/TimeZone";

const toast = useToast();
const confirm = useConfirm();
const { t, locale } = useI18n();

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
const profilesList = ref<
  { label: string; items: { label: string; command: () => void }[] }[]
>([]);

const profilesMenu = ref();
const suppressInputValidation = ref(false);

// Test database: form fields, dates as picked (stored as ISO date strings)
const dbHost = ref("");
const dbPort = ref<number | null>(5432);
const dbName = ref("");
const dbUser = ref("");
const dbPassword = ref("");
const dbStart = ref<Date | null>(null);
const dbEnd = ref<Date | null>(null);
// The saved profile's test database as JSON, the baseline for change detection.
const savedTestDb = ref("null");

// Language and time zone are bound to the global settings, so they apply
// immediately; the saved values are the baseline for change detection.
const savedLanguage = ref("");
const savedTimeZone = ref("");

const languageOptions = [
  { label: "English", value: "en" },
  { label: "Deutsch", value: "de" }
];
const timeZoneOptions = computed(() => [
  { label: "UTC", value: UTC_TIME_ZONE },
  { label: t("timeZoneLocal"), value: LOCAL_TIME_ZONE }
]);

const DATE_FORMAT = "YYYY-MM-DD";

// The test database is optional: it counts only once every field is filled.
// The password may be empty for trust-authenticated local databases.
const testDbInput = computed<TestDatabaseConfig | null>(() =>
  dbHost.value.trim() &&
  dbPort.value != null &&
  dbName.value.trim() &&
  dbUser.value.trim() &&
  dbStart.value &&
  dbEnd.value
    ? {
        host: dbHost.value.trim(),
        port: dbPort.value,
        database: dbName.value.trim(),
        user: dbUser.value.trim(),
        password: dbPassword.value,
        start: moment(dbStart.value).format(DATE_FORMAT),
        end: moment(dbEnd.value).format(DATE_FORMAT)
      }
    : null
);

// Save button is enabled only if something changed and inputs are valid
const saveBtnDisabled = computed(
  () =>
    (nameNotChanged.value &&
      keyNotChanged.value &&
      urlNotChanged.value &&
      testDbNotChanged.value &&
      settingsNotChanged.value) ||
    !name.value ||
    !key.value ||
    !url.value
);

const nameNotChanged = computed(
  () => savedName.value === name.value || name.value === ""
);
const keyNotChanged = computed(
  () => savedKey.value === key.value || key.value === ""
);
const urlNotChanged = computed(
  () => savedUrl.value === url.value || url.value === ""
);
const testDbNotChanged = computed(
  () => JSON.stringify(testDbInput.value) === savedTestDb.value
);
const settingsNotChanged = computed(
  () =>
    savedLanguage.value === locale.value &&
    savedTimeZone.value === timeZone.value
);

function openProfileSelectionMenu(event: Event): void {
  profilesMenu.value?.toggle(event);
}

async function fetchProfiles(): Promise<CredentialProfile[]> {
  return await ProfileStorage.getAllProfiles();
}

function updateProfileMenuItems(profiles: { name: string }[]): void {
  const items = profiles.map((profile) => ({
    label: profile.name,
    command: () => handleProfileChange(profile)
  }));
  const label = profiles.length > 0 ? t("selectProfile") : t("noSavedProfiles");
  profilesList.value = [{ label, items }];
}

async function loadProfilesList(): Promise<void> {
  const formatted = await fetchProfiles();
  savedProfiles.value = formatted.map(({ name }) => ({ name }));
  updateProfileMenuItems(savedProfiles.value);
}

function changeSavedProfile(): void {
  savedName.value = name.value;
  savedKey.value = key.value;
  savedUrl.value = url.value;
  savedTestDb.value = JSON.stringify(testDbInput.value);
  savedLanguage.value = locale.value;
  savedTimeZone.value = timeZone.value;
}

function fillTestDbForm(config?: TestDatabaseConfig): void {
  dbHost.value = config?.host ?? "";
  dbPort.value = config?.port ?? 5432;
  dbName.value = config?.database ?? "";
  dbUser.value = config?.user ?? "";
  dbPassword.value = config?.password ?? "";
  dbStart.value = config ? moment(config.start, DATE_FORMAT).toDate() : null;
  dbEnd.value = config ? moment(config.end, DATE_FORMAT).toDate() : null;
}

async function insertProfile(profileName: string): Promise<void> {
  const profileData = await ProfileStorage.getProfile(profileName);
  const isValid = !!profileData;
  name.value = profileData?.name ?? "";
  key.value = profileData?.key ?? "";
  url.value = profileData?.url ?? "";
  fillTestDbForm(profileData?.testDatabase);
  if (profileData?.language) locale.value = profileData.language;
  if (profileData?.timeZone) timeZone.value = profileData.timeZone;

  selectedProfile.value = isValid ? { name: name.value } : null;
  deleteBtnDisabled.value = !isValid;

  changeSavedProfile();
  BrokerConnection.setCredentials(url.value, key.value);
  ProfileStorage.testDatabase.value = profileData?.testDatabase ?? null;
  await ProfileStorage.setLastSelected(name.value);
}

async function handleProfileChange(profile: { name: string }): Promise<void> {
  logInBlocked.value = true;
  await insertProfile(profile.name);
  logInBlocked.value = false;
  createInfoToast(
    toast,
    t("info"),
    t("profileSwitchedTo", { profile: profile.name })
  );
}

async function loadLastSavedProfile(): Promise<void> {
  const last = await ProfileStorage.getLastSelected();
  if (typeof last === "string") {
    selectedProfile.value = { name: last };
    await insertProfile(last);
  }
}

function validateInputs(): boolean {
  const alphaNumericPattern = /^[a-zA-Z0-9]+$/;
  const urlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
  let isValid = true;
  if (!url.value.startsWith("http://") && !url.value.startsWith("https://")) {
    url.value = "https://" + url.value;
  }
  if (!alphaNumericPattern.test(name.value)) {
    createErrorToast(
      toast,
      t("inputError"),
      t("fieldCharacterError", { fieldName: t("profileName") })
    );
    isValid = false;
  }
  if (!alphaNumericPattern.test(key.value)) {
    createErrorToast(
      toast,
      t("inputError"),
      t("fieldCharacterError", { fieldName: t("profileKey") })
    );
    isValid = false;
  }
  if (!urlPattern.test(url.value)) {
    createErrorToast(
      toast,
      t("inputError"),
      t("fieldCharacterError", { fieldName: t("profileUrl") })
    );
    isValid = false;
  }
  if (name.value === "LastSelected") {
    createErrorToast(toast, t("inputError"), t("invalidProfileNameError"));
    return false;
  }
  return isValid;
}

async function saveOrUpdateProfile(): Promise<void> {
  if (!validateInputs()) return;
  const profileData: CredentialProfile = {
    name: name.value,
    key: key.value,
    url: url.value,
    testDatabase: testDbInput.value ?? undefined,
    language: locale.value,
    timeZone: timeZone.value
  };
  await ProfileStorage.saveProfile(profileData);
  createSuccessToast(
    toast,
    t("success"),
    t("createdProfile", { profile: name.value })
  );
  await handleProfileChange({ name: name.value });
  await loadProfilesList();
}

/**
 * Deletes the currently selected profile and loads the fallback.
 */
async function deleteProfile(): Promise<void> {
  const toDelete = selectedProfile.value?.name;
  if (!toDelete) return;
  await ProfileStorage.deleteProfile(toDelete);
  createSuccessToast(
    toast,
    t("success"),
    t("deletedProfile", { profile: toDelete })
  );
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
    message: t("confirmProfileDelete"),
    icon: "pi pi-info-circle",
    rejectClass: "p-button-secondary p-button-outlined p-button-sm",
    acceptClass: "p-button-danger p-button-sm",
    rejectLabel: t("cancel"),
    acceptLabel: t("delete"),
    accept: deleteProfile
  });
}

onMounted(async () => {
  await loadLastSavedProfile();
  await loadProfilesList();
});
</script>

<template>
  <!-- Global confirm dialog used for deletion -->
  <ConfirmPopup />

  <!-- Settings button to open dialog -->
  <Button
    icon="pi pi-cog"
    @click="visible = true"
    v-tooltip.left="t('openConfig')"
  />

  <!-- Profile manager dialog -->
  <Dialog v-model:visible="visible" modal :header="t('config')" class="w-30rem">
    <!-- Show loading spinner during async profile switch -->
    <div
      v-if="logInBlocked"
      class="flex align-items-center justify-content-center"
      style="min-height: 14rem"
    >
      <ProgressSpinner />
    </div>

    <!-- Profile name on top, then one collapsible section per concern -->
    <div v-else class="flex flex-column gap-5">
      <FloatLabel class="w-full mt-4">
        <InputText v-model="name" class="w-full" />
        <label>{{ t("profileName") }}</label>
      </FloatLabel>

      <Panel :header="t('brokerConfig')" toggleable>
        <div class="flex flex-column gap-5 pt-2">
          <FloatLabel class="w-full">
            <Password
              v-model="key"
              toggleMask
              :feedback="false"
              class="w-full"
              input-class="w-full"
            />
            <label>{{ t("profileKey") }}</label>
          </FloatLabel>

          <FloatLabel class="w-full">
            <InputText v-model="url" class="w-full" />
            <label>{{ t("profileUrl") }}</label>
          </FloatLabel>
        </div>
      </Panel>

      <!-- Optional test database for the query builder, part of the profile -->
      <Panel :header="t('testDatabase')" toggleable collapsed>
        <div class="flex flex-column gap-5 pt-2">
          <div class="flex gap-3">
            <FloatLabel class="flex-1">
              <InputText v-model="dbHost" class="w-full" />
              <label>{{ t("testDbHost") }}</label>
            </FloatLabel>
            <FloatLabel class="w-7rem">
              <InputNumber
                v-model="dbPort"
                :useGrouping="false"
                :min="1"
                :max="65535"
                class="w-full"
                input-class="w-full"
              />
              <label>{{ t("testDbPort") }}</label>
            </FloatLabel>
          </div>
          <FloatLabel class="w-full">
            <InputText v-model="dbName" class="w-full" />
            <label>{{ t("testDbName") }}</label>
          </FloatLabel>
          <div class="flex gap-3">
            <FloatLabel class="flex-1">
              <InputText v-model="dbUser" class="w-full" />
              <label>{{ t("testDbUser") }}</label>
            </FloatLabel>
            <FloatLabel class="flex-1">
              <Password
                v-model="dbPassword"
                toggleMask
                :feedback="false"
                class="w-full"
                input-class="w-full"
              />
              <label>{{ t("testDbPassword") }}</label>
            </FloatLabel>
          </div>
          <div class="flex gap-3">
            <FloatLabel class="flex-1">
              <DatePicker
                v-model="dbStart"
                dateFormat="yy-mm-dd"
                class="w-full"
              />
              <label>{{ t("testDbStart") }}</label>
            </FloatLabel>
            <FloatLabel class="flex-1">
              <DatePicker
                v-model="dbEnd"
                dateFormat="yy-mm-dd"
                class="w-full"
              />
              <label>{{ t("testDbEnd") }}</label>
            </FloatLabel>
          </div>
          <small class="text-color-secondary">
            {{ t("testDatabaseHint") }}
          </small>
        </div>
      </Panel>

      <!-- Language and display time zone, applied immediately -->
      <Panel :header="t('misc')" toggleable collapsed>
        <div class="flex flex-column gap-5 pt-2">
          <FloatLabel class="w-full">
            <Select
              v-model="locale"
              :options="languageOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
            <label>{{ t("language") }}</label>
          </FloatLabel>
          <div>
            <label class="block mb-1 text-sm text-color-secondary">
              {{ t("timeZone") }}
            </label>
            <SelectButton
              v-model="timeZone"
              :options="timeZoneOptions"
              optionLabel="label"
              optionValue="value"
              :allowEmpty="false"
            />
          </div>
        </div>
      </Panel>
    </div>

    <!-- Footer: language switch (left) + grouped profile actions (right) -->
    <template #footer>
      <div class="flex align-items-center w-full">
        <LanguageSwitcher />
        <div class="flex gap-2 ml-auto">
          <Button
            icon="pi pi-arrow-right-arrow-left"
            severity="secondary"
            @click="openProfileSelectionMenu"
            v-tooltip.bottom="t('selectProfile')"
          />
          <Button
            icon="pi pi-save"
            @click="saveOrUpdateProfile"
            :disabled="saveBtnDisabled"
            v-tooltip.bottom="t('saveProfile')"
          />
          <Button
            icon="pi pi-trash"
            severity="danger"
            @click="confirmDelete"
            :disabled="deleteBtnDisabled"
            v-tooltip.bottom="t('deleteProfile')"
          />
        </div>
        <Menu ref="profilesMenu" :model="profilesList" :popup="true" />
      </div>
    </template>
  </Dialog>
</template>
