import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) return { el: to.hash };
    return { top: 0 };
  },
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../pages/LoginPage.vue'),
      meta: { guest: true },
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../pages/DashboardPage.vue'),
      meta: { auth: true },
    },
    {
      path: '/measurement/new',
      name: 'measurement-new',
      component: () => import('../pages/MeasurementPage.vue'),
      meta: { auth: true },
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('../pages/HistoryPage.vue'),
      meta: { auth: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../pages/SettingsPage.vue'),
      meta: { auth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: 'dashboard' },
    },
  ],
});

router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore();

  if (auth.status === 'idle') {
    await auth.checkSession();
  }

  if (to.meta.auth && auth.status !== 'authenticated') {
    next({ name: 'login' });
  } else if (to.meta.guest && auth.status === 'authenticated') {
    next({ name: 'dashboard' });
  } else {
    next();
  }
});

export default router;
