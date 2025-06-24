import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import login from './components/login.vue'

const routes = [
    { path: '/', component: App },
    { path: '/login', component: login }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router