
/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import { createRouter, createWebHistory } from 'vue-router/auto';
//import { routes } from 'vue-router/auto-routes';
import Login from '../components/Principal/Login.vue';
import Register from '../components/Principal/Register.vue';
import Listas from '../components/Lista/Listas.vue';
const routes = [
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/listas', component: Listas },
  { path: '/', redirect: '/login' }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
