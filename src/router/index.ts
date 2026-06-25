/**
 * Vue Router setup for the renderer SPA. Uses hash history (required for
 * Electron's file:// loading), redirects "/" to the API-keys view, and falls
 * back to a catch-all 404 alongside a manual /500 route.
 */
import { createRouter, createWebHashHistory } from "vue-router";
import Error404 from "../views/Error404.vue";
import Error500 from "../views/Error500.vue";
import ApiKeyView from "../views/ApiKeyView.vue";
import RequestView from "../views/RequestView.vue";

const routes = [
  {
    path: "/",
    redirect: "/api-keys"
  },
  {
    path: "/api-keys",
    component: ApiKeyView
  },
  {
    path: "/request",
    component: RequestView
  },
  { path: "/500", component: Error500 },
  { path: "/:catchAll(.*)", component: Error404 }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
