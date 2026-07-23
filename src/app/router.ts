/**
 * Vue Router setup for the renderer SPA. Uses hash history (required for
 * Electron's file:// loading), redirects "/" to the API-keys view, and falls
 * back to a catch-all 404 alongside a manual /500 route.
 */
import { createRouter, createWebHashHistory } from "vue-router";
import Error404 from "../shared/errors/Error404.vue";
import Error500 from "../shared/errors/Error500.vue";
import ApiKeyView from "../apikeys/ApiKeyView.vue";
import RequestView from "../requests/RequestView.vue";
import NodeView from "../nodes/NodeView.vue";
import QueryBuilderView from "../querybuilder/QueryBuilderView.vue";

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
  {
    path: "/nodes",
    component: NodeView
  },
  {
    path: "/builder",
    component: QueryBuilderView
  },
  { path: "/500", component: Error500 },
  { path: "/:catchAll(.*)", component: Error404 }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
