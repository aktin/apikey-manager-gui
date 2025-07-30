/**
 * Renderer entry point for the Electron + Vue 3 application.
 *
 * Mounts the SPA to the DOM and registers global plugins like:
 * - PrimeVue UI framework
 * - Vue-i18n for internationalization
 *
 * Referenced by index.html via <script type="module">.
 */
import {createApp} from "vue";
import App from "./App.vue";

import i18n from "./i18n";

// PrimeVue imports
import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";
import Tooltip from "primevue/tooltip";
import ConfirmationService from "primevue/confirmationservice";

// Styles imports
import "primevue/resources/themes/lara-light-green/theme.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";

const app = createApp(App)
.use(PrimeVue)
.use(ToastService)
.use(ConfirmationService)
.use(i18n)
.directive("tooltip", Tooltip)
.mount("#app");
