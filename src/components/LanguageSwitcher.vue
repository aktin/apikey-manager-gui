<script setup lang="ts">
/**
 * LanguageSwitcher.vue
 *
 * A self-contained UI component that allows users to change the application's language.
 *
 * Features:
 * - Displays a dropdown menu with selectable language options.
 * - Persists the selected language in `localStorage` across sessions.
 * - Applies the selected locale at runtime using `vue-i18n`.
 */

import {ref, watchEffect} from "vue";
import {useI18n} from "vue-i18n";
import Button from "primevue/button";
import Menu from "primevue/menu";

const {t, locale} = useI18n();

/**
 * Reference to the PrimeVue `Menu` component instance for toggling the language dropdown.
 *
 * @type {import('vue').Ref<InstanceType<typeof Menu> | undefined>}
 */
const languageMenu = ref();

/**
 * List of available languages for selection, with localized menu label.
 * Each language entry executes a `setLanguage()` command when selected.
 *
 * @type {import('vue').Ref<Array<{ label: string; items: Array<{ label: string; command: () => void }> }>>}
 */
const languages = ref([
  {
    label: t("language.changeLocal"),
    items: [
      {
        label: "English",
        command: () => setLanguage("en")
      },
      {
        label: "Deutsch",
        command: () => setLanguage("de")
      }
    ]
  }
]);

/**
 * Sets the current application language and saves the selection to `localStorage`.
 *
 * @param {string} lang - ISO 639-1 language code (e.g., `"en"`, `"de"`).
 */
function setLanguage(lang: string): void {
  locale.value = lang;
  localStorage.setItem("lang", lang);
}

/**
 * Watches for a stored language setting in `localStorage` and applies it on load.
 * This effect runs once on mount and again whenever `localStorage.lang` changes.
 */
watchEffect(() => {
  const storedLang = localStorage.getItem("lang");
  if (storedLang) {
    locale.value = storedLang;
  }
});
</script>

<template>
  <div>
    <!-- Language switch button with tooltip -->
    <Button icon="pi pi-language" @click="languageMenu?.toggle($event)" v-tooltip.bottom="t('language.changeLocal')"/>

    <!-- Dropdown menu for language selection -->
    <Menu ref="languageMenu" :model="languages" :popup="true"/>
  </div>
</template>
