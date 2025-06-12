import {createApp} from 'vue'
import './style.css'
import App from './App.vue'

// PrimeVue imports
import PrimeVue from "primevue/config";

// Styles imports
import 'primevue/resources/themes/lara-light-green/theme.css'
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";

const app = createApp(App)
    .use(PrimeVue)
    .mount("#app");
