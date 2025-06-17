import {createApp} from "vue"
import App from "./App.vue"

// PrimeVue imports
import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";
import Tooltip from "primevue/tooltip";

// Styles imports
import "primevue/resources/themes/lara-light-green/theme.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";

const app = createApp(App)
    .use(PrimeVue)
    .use(ToastService)
    .directive("tooltip", Tooltip)
    .mount("#app");
