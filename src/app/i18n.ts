/**
 * Vue I18n configuration for multilingual support.
 *
 * Enables English and German translations using static JSON files.
 * Uses Composition API mode (`legacy: false`) for Vue 3.
 * Detects the preferred language from `localStorage`, falling back to English,
 * and persists every locale change back to it.
 *
 * @see https://vue-i18n.intlify.dev/ — Vue I18n documentation
 */
import { watch } from "vue";
import { createI18n } from "vue-i18n";

import en from "../shared/locales/en.json";
import de from "../shared/locales/de.json";

type MessageSchema = typeof en;

const i18n = createI18n<[MessageSchema], "en" | "de">({
  legacy: false,
  locale: (localStorage.getItem("lang") as "en" | "de") || "en",
  fallbackLocale: "en",
  messages: {
    en,
    de
  }
});

watch(i18n.global.locale, (lang) => localStorage.setItem("lang", lang));

export default i18n;
