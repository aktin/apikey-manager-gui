import {createApp} from "vue"
import App from "./App.vue"
import router from "./router"

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
    .use(router)
    .directive("tooltip", Tooltip)
    .mount("#app");

//TODO (Optional) Add locale for 'de' and 'en'
