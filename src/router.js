import { createRouter, createWebHistory } from 'vue-router'
import home from './components/home.vue'
import login from './components/login.vue'
import {sharedPassword} from './components/passwordChanger.js'

const routes = [
    { path: '/app', component: home },
    { path: '/', component: login }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export let password = "";
export function updateValue(newPassword) {
    password = newPassword;
    console.log("new Password : ",password);
    sharedPassword.value = password;
}

export default router