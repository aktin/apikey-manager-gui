<script setup lang="ts">
import {ref, watchEffect} from "vue";
import {useI18n} from "vue-i18n";
import Button from "primevue/button";
import Menu from "primevue/menu";

const {t, locale} = useI18n();

const languageMenu = ref();
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

function setLanguage(lang: string) {
  locale.value = lang;
  localStorage.setItem("lang", lang);
}

watchEffect(() => {
  const storedLang = localStorage.getItem("lang");
  if (storedLang) locale.value = storedLang;
});
</script>

<template>
  <div>
    <Button icon="pi pi-language" @click="languageMenu?.toggle($event)" v-tooltip.bottom="t('language.changeLocal')"/>
    <Menu ref="languageMenu" :model="languages" :popup="true"/>
  </div>
</template>
