<script setup lang="ts">
/**
 * LanguageSwitcher.vue
 *
 * A compact UI component that lets the user switch application language at runtime.
 *
 * Features:
 * - Displays a button with a dropdown menu for language selection
 * - Persists the selected language in `localStorage`
 * - Uses vue-i18n's Composition API (`locale.value`)
 * - Shows a confirmation toast when the language is changed
 */
import {ref, watchEffect} from "vue";
import {useI18n} from "vue-i18n";
import Button from "primevue/button";
import Menu from "primevue/menu";
import {useToast} from "primevue/usetoast";
import {createInfoToast} from "../services/ToastWrapper";

const toast = useToast();
const {t, locale} = useI18n();
const languageMenu = ref();

/**
 * Language options displayed in the menu.
 */
const languages = ref([
  {
    label: t("language.changeLang"),
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
 * Changes the app language and persists the selection.
 *
 * @param lang - Language code ("en" or "de")
 */
function setLanguage(lang: string): void {
  locale.value = lang;
  localStorage.setItem("lang", lang);
  createInfoToast(toast, t("common.info"), t("language.switched", {lang}));
}

watchEffect(() => {
  const storedLang = localStorage.getItem("lang");
  if (storedLang) {
    locale.value = storedLang;
  }
});
</script>

<template>
  <div>
    <!--
      Button for opening the language switcher menu.
      Displays a tooltip and uses a PrimeIcons globe icon.
    -->
    <Button icon="pi pi-language"
            @click="languageMenu?.toggle($event)"
            v-tooltip.bottom="t('language.changeLang')"/>
    <!--
      Dropdown menu with language options (English, Deutsch).
      Triggered by the language button.
    -->
    <Menu ref="languageMenu" :model="languages" :popup="true"/>
  </div>
</template>
