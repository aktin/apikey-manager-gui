<script setup lang="ts">
/**
 * NodeCredsForm.vue
 *
 * Self-contained "add API key" feature: an icon button that opens a modal
 * dialog holding the key-creation form.
 *
 * Features:
 * - Validates API key and DN components (CN, O, L) on input
 * - Generates a secure random API key
 * - Submits a formatted XML payload to the broker
 * - Clears the form and closes the dialog on success
 * - Displays toast messages on success/error
 */
import { computed, Ref, ref } from "vue";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import FloatLabel from "primevue/floatlabel";
import Dialog from "primevue/dialog";
import BrokerConnection from "../services/BrokerConnection";
import { useToast } from "primevue/usetoast";
import { createErrorToast, createSuccessToast } from "../utils/ToastWrapper";
import { notifyStatusError } from "../utils/StatusToast";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const toast = useToast();

const visible = ref(false);

// Form inputs
const apiKey = ref("");
const cn = ref("");
const org = ref("");
const loc = ref("");

// Input validation flags
const invalidApiKey = ref(false);
const invalidCN = ref(false);
const invalidOrg = ref(false);
const invalidLoc = ref(false);

// Validation rules
const apiKeyLength = 16;
const apiKeyPattern = /[^a-zA-Z0-9]/;
// Allow letters, digits, spaces, German umlauts/ß and common org punctuation;
// block DN-structural characters ("," and "=") and anything else.
const dnPattern = /[^a-zA-Z0-9 äöüÄÖÜß&.()\/+-]/;

// Add button is enabled only when all fields are filled
const isAddButtonActive = computed(
  () =>
    apiKey.value.trim() !== "" &&
    cn.value.trim() !== "" &&
    org.value.trim() !== "" &&
    loc.value.trim() !== ""
);

function validateField(
  value: string,
  flag: Ref<boolean>,
  localeKey: string,
  pattern: RegExp
) {
  if (pattern.test(value)) {
    createErrorToast(
      toast,
      t("inputError"),
      t("fieldCharacterError", { fieldName: t(localeKey) })
    );
    flag.value = true;
  }
}

function validate() {
  invalidApiKey.value = false;
  invalidCN.value = false;
  invalidOrg.value = false;
  invalidLoc.value = false;

  if (apiKey.value.length !== apiKeyLength) {
    createErrorToast(
      toast,
      t("inputError"),
      t("keyLengthError", { length: apiKeyLength })
    );
    invalidApiKey.value = true;
  } else {
    validateField(apiKey.value, invalidApiKey, "key", apiKeyPattern);
  }
  validateField(cn.value, invalidCN, "cn", dnPattern);
  validateField(org.value, invalidOrg, "o", dnPattern);
  validateField(loc.value, invalidLoc, "l", dnPattern);
}

/** Escapes XML-special characters so DN values are safe in the clientDn payload. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function resetForm() {
  apiKey.value = "";
  cn.value = "";
  org.value = "";
  loc.value = "";
}

async function addNewKey() {
  validate();
  if (
    invalidApiKey.value ||
    invalidCN.value ||
    invalidOrg.value ||
    invalidLoc.value
  )
    return;
  const payload = `CN=${escapeXml(cn.value)},O=${escapeXml(org.value)},L=${escapeXml(loc.value)}`;
  const xml = `<ApiKeyCred><apiKey>${apiKey.value}</apiKey><clientDn>${payload}</clientDn></ApiKeyCred>`;
  const status = await BrokerConnection.addApiKey(xml);
  if (status === 201) {
    createSuccessToast(toast, t("success"), t("keyAdded"));
    resetForm();
    visible.value = false;
    return;
  }
  notifyStatusError(toast, t, status, {
    404: { title: "notFound", message: "noKeyListFound" },
    409: { title: "conflict", message: "keyAlreadyExists" }
  });
}

/**
 * Generates a cryptographically secure API key, using rejection sampling to
 * keep the character distribution unbiased.
 */
function generateApiKey() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const maxUnbiased = Math.floor(256 / chars.length) * chars.length;
  const result: string[] = [];
  const byte = new Uint8Array(1);
  while (result.length < apiKeyLength) {
    crypto.getRandomValues(byte);
    if (byte[0] < maxUnbiased) {
      result.push(chars[byte[0] % chars.length]);
    }
  }
  apiKey.value = result.join("");
}
</script>

<template>
  <Button
    icon="pi pi-plus"
    size="small"
    @click="visible = true"
    v-tooltip.bottom="t('addKey')"
  />

  <Dialog v-model:visible="visible" modal :header="t('addKey')" class="w-30rem">
    <div class="flex flex-column gap-4 pt-4">
      <!-- API key input with generate button -->
      <div class="flex align-items-center gap-2">
        <FloatLabel class="w-full">
          <InputText
            id="apiInput"
            v-model="apiKey"
            :invalid="invalidApiKey"
            class="w-full"
          />
          <label for="apiInput">{{ t("key") }}</label>
        </FloatLabel>
        <Button
          icon="pi pi-sync"
          v-tooltip.bottom="t('generateKey')"
          @click="generateApiKey"
          class="flex-shrink-0"
        />
      </div>

      <!-- DN fields -->
      <FloatLabel class="w-full">
        <InputText
          id="nameInput"
          v-model="cn"
          :invalid="invalidCN"
          class="w-full"
        />
        <label for="nameInput">{{ t("cn") }}</label>
      </FloatLabel>

      <FloatLabel class="w-full">
        <InputText
          id="orgInput"
          v-model="org"
          :invalid="invalidOrg"
          class="w-full"
        />
        <label for="orgInput">{{ t("o") }}</label>
      </FloatLabel>

      <FloatLabel class="w-full">
        <InputText
          id="locInput"
          v-model="loc"
          :invalid="invalidLoc"
          class="w-full"
        />
        <label for="locInput">{{ t("l") }}</label>
      </FloatLabel>
    </div>

    <template #footer>
      <Button
        :label="t('addKey')"
        @click="addNewKey"
        :disabled="!isAddButtonActive"
      />
    </template>
  </Dialog>
</template>
