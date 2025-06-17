import {createApp} from "vue"
import App from "./App.vue"

// PrimeVue imports
import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";

// Styles imports
import "primevue/resources/themes/lara-light-green/theme.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";

const app = createApp(App)
    .use(PrimeVue)
    .use(ToastService)
    .mount("#app");
