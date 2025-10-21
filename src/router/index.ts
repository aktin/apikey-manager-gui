import {createRouter, createWebHistory} from 'vue-router'
import Error404 from "../views/Error404.vue";
import Error500 from "../views/Error500.vue";
import ApiKeyView from "../views/ApiKeyView.vue";
import RequestView from "../views/RequestView.vue";

const routes = [
  {
    path: "/",
    redirect: "/api-keys",
  },
  {
    path: "/api-keys",
    component: ApiKeyView,
  },
  {
    path: "/request",
    component: RequestView,
  },
  {path: "/500", component: Error500},
  {path: "/:catchAll(.*)", component: Error404},
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
