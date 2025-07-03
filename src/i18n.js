import { createI18n } from 'vue-i18n';
import en from './locals/en.json';
import de from './locals/de.json';

const i18n = createI18n({
    legacy: false,
    locale: localStorage.getItem('lang') || 'en',
    fallbackLocale: 'en',
    messages: {
        en,
        de,
    },
});

export default i18n;