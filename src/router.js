import { createRouter, createWebHistory } from "vue-router"
import home from "./components/home.vue"
import login from "./components/login.vue"
import {sharedPassword} from "./components/passwordChanger.js"
import BrokerConnection from "./components/BrokerConnection.js";

const routes = [
    { path: '/app', component: home },
    { path: '/', component: login }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export let password = "";
export function updateLoginValues(newPassword,newURL) {

    password = newPassword;

    BrokerConnection.setBrokerUrl(newURL)
    BrokerConnection.setAdminApiKey(newPassword)

    sharedPassword.value = password;
}

export default router