<script setup lang="ts">
/**
 * LanguageSwitcher.vue
 *
 * A self-contained component that allows users to switch the UI language between English and German.
 *
 * Features:
 * - Displays a button with a language icon
 * - Opens a PrimeVue popup menu to select "English" or "Deutsch"
 * - Persists selected language in localStorage
 * - Automatically loads stored language on mount
 */

import {ref, watchEffect} from "vue";
import {useI18n} from "vue-i18n";
import Button from "primevue/button";
import Menu from "primevue/menu";

const {t, locale} = useI18n();

/**
 * Reference to the language menu instance for programmatic control.
 */
const languageMenu = ref();

/**
 * Menu model for language selection (English, Deutsch).
 * The menu label is localized.
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
 * Sets the application language and persists it in localStorage.
 * @param lang ISO language code (e.g., "en", "de")
 */
function setLanguage(lang: string) {
  locale.value = lang;
  localStorage.setItem("lang", lang);
}

/**
 * Load previously stored language from localStorage and apply it.
 */
watchEffect(() => {
  const storedLang = localStorage.getItem("lang");
  if (storedLang) locale.value = storedLang;
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
