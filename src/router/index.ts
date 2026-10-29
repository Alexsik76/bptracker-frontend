import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

import LoginView from '../views/LoginView.vue';
import AccessDeniedView from '../views/AccessDeniedView.vue';
import AdminLayout from '../components/layout/AdminLayout.vue';
import PlaceholderView from '../views/PlaceholderView.vue';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { public: true },
  },
  {
    path: '/forbidden',
    name: 'forbidden',
    component: AccessDeniedView,
  },
  {
    path: '/',
    component: AdminLayout,
    children: [
      {
        path: '',
        redirect: '/tables',
      },
      {
        path: 'tables',
        name: 'tables',
        component: PlaceholderView,
        props: { title: 'Таблиці' },
      },
      {
        path: 'stats',
        name: 'stats',
        component: PlaceholderView,
        props: { title: 'Статистика' },
      },
      {
        path: 'logs',
        name: 'logs',
        component: PlaceholderView,
        props: { title: 'Журнали' },
      },
      {
        path: 'settings',
        name: 'settings',
        component: PlaceholderView,
        props: { title: 'Налаштування' },
      },
      {
        path: 'ocr',
        name: 'ocr',
        component: PlaceholderView,
        props: { title: 'Розпізнавання' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/tables',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();

  if (authStore.status === 'idle') {
    await authStore.initAuth();
  }

  const isAuth = authStore.isAuthenticated;
  const isAdmin = authStore.isAdmin;

  if (to.path === '/login') {
    if (to.query.token) {
      return next();
    }
    if (isAuth) {
      return next(isAdmin ? '/tables' : '/forbidden');
    }
    return next();
  }

  if (!isAuth) {
    return next({
      path: '/login',
      query: to.fullPath !== '/' && to.fullPath !== '/tables' ? { redirect: to.fullPath } : undefined,
    });
  }

  if (!isAdmin) {
    if (to.path !== '/forbidden') {
      return next('/forbidden');
    }
    return next();
  }

  if (to.path === '/forbidden') {
    return next('/tables');
  }

  next();
});

export default router;
