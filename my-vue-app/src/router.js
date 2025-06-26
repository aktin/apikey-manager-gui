import {createRouter, createWebHistory} from "vue-router"
import home from "./components/home.vue"
import login from "./components/login.vue"

const routes = [
    {path: '/app', component: home},
    {path: '/', component: login}
]

const router = createRouter({
    history: createWebHistory(),
    routes
})
export default router