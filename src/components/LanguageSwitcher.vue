<script setup lang="ts">
import {ref, watchEffect} from "vue";
import {useI18n} from "vue-i18n";
import Button from "primevue/button";
import Menu from "primevue/menu";
import {useToast} from "primevue/usetoast";
import {createInfoToast} from "../services/ToastWrapper";

const toast = useToast();
const {t, locale} = useI18n();
const languageMenu = ref();

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

function setLanguage(lang: string): void {
  locale.value = lang;
  localStorage.setItem("lang", lang);
  createInfoToast(toast, t("common.info"), t("language.switched"));
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
    <!-- Language switch button with tooltip -->
    <Button icon="pi pi-language" @click="languageMenu?.toggle($event)" v-tooltip.bottom="t('language.changeLang')"/>

    <!-- Dropdown menu for language selection -->
    <Menu ref="languageMenu" :model="languages" :popup="true"/>
  </div>
</template>
