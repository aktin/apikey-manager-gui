/**
 * Vue I18n configuration for multilingual support (en, de).
 *
 * Loads static JSON files as translation sources.
 * Uses Composition API mode (legacy: false) for Vue 3.
 *
 * The user's preferred language is read from localStorage.
 *
 * @see https://vue-i18n.intlify.dev/
 */
import {createI18n} from "vue-i18n";

import en from "./locals/en.json";
import de from "./locals/de.json";

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

export default i18n;
