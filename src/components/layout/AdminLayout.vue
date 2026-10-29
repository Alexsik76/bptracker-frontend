<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const accountMenuOpen = ref(false);
const accountMenuRef = ref<HTMLElement | null>(null);

const registerLoading = ref(false);
const toastMessage = ref<string | null>(null);
const toastType = ref<'success' | 'error'>('success');
let toastTimer: number | null = null;

function showToast(message: string, type: 'success' | 'error' = 'success') {
  toastMessage.value = message;
  toastType.value = type;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toastMessage.value = null;
  }, 4000);
}

function toggleAccountMenu() {
  accountMenuOpen.value = !accountMenuOpen.value;
}

function closeAccountMenu() {
  accountMenuOpen.value = false;
}

function handleClickOutside(event: MouseEvent) {
  if (accountMenuRef.value && !accountMenuRef.value.contains(event.target as Node)) {
    closeAccountMenu();
  }
}

async function handleAddPasskey() {
  closeAccountMenu();
  registerLoading.value = true;
  try {
    await authStore.registerPasskey();
    showToast('Ключ доступу успішно додано!', 'success');
  } catch (err: unknown) {
    console.error('Passkey registration error:', err);
    const msg = err instanceof Error ? err.message : 'Не вдалося додати ключ доступу';
    showToast(msg, 'error');
  } finally {
    registerLoading.value = false;
  }
}

async function handleLogout() {
  closeAccountMenu();
  await authStore.logout();
  router.replace('/login');
}

const navItems = [
  {
    name: 'Таблиці',
    path: '/tables',
    icon: 'table',
  },
  {
    name: 'Статистика',
    path: '/stats',
    icon: 'chart',
  },
  {
    name: 'Журнали',
    path: '/logs',
    icon: 'file-text',
  },
  {
    name: 'Налаштування',
    path: '/settings',
    icon: 'settings',
  },
  {
    name: 'Розпізнавання',
    path: '/ocr',
    icon: 'camera',
  },
];

const breadcrumb = computed(() => {
  if (route.path.startsWith('/tables')) {
    const tableName = route.params.name as string | undefined;
    return {
      section: 'Таблиці',
      sectionPath: '/tables',
      sub: tableName || null,
    };
  }
  const current = navItems.find((item) => route.path.startsWith(item.path));
  return {
    section: current ? current.name : '',
    sectionPath: current ? current.path : '',
    sub: null,
  };
});

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  if (toastTimer) clearTimeout(toastTimer);
});
</script>

<template>
  <div class="admin-app">
    <!-- Left Navigation Sidebar -->
    <aside class="sidebar" aria-label="Розділи">
      <div class="brand">
        <span class="mark">
          <svg class="i i-s" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 12h4l2-5 4 10 2-5h6" />
          </svg>
        </span>
        BP Tracker
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ 'nav-item-active': route.path.startsWith(item.path) }"
          :aria-current="route.path.startsWith(item.path) ? 'page' : undefined"
        >
          <!-- Table icon -->
          <svg v-if="item.icon === 'table'" class="i" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M3 10h18M9 10v10" />
          </svg>

          <!-- Stats / Chart icon -->
          <svg v-else-if="item.icon === 'chart'" class="i" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 20V4M4 20h16" />
            <path d="M8 16l4-5 3 3 5-7" />
          </svg>

          <!-- Logs / File icon -->
          <svg v-else-if="item.icon === 'file-text'" class="i" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
          </svg>

          <!-- Settings icon -->
          <svg v-else-if="item.icon === 'settings'" class="i" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
            <circle cx="16" cy="7" r="2" />
            <circle cx="10" cy="17" r="2" />
          </svg>

          <!-- OCR / Camera icon -->
          <svg v-else-if="item.icon === 'camera'" class="i" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 8V6a2 2 0 012-2h2M16 4h2a2 2 0 012 2v2M20 16v2a2 2 0 01-2 2h-2M8 20H6a2 2 0 01-2-2v-2" />
            <rect x="8" y="8" width="8" height="8" rx="1" />
          </svg>

          <span>{{ item.name }}</span>
        </router-link>
      </nav>
    </aside>

    <!-- Main View Column -->
    <div class="main-column">
      <!-- Top Header Bar -->
      <header class="topbar">
        <nav aria-label="Шлях" class="breadcrumbs">
          <router-link :to="breadcrumb.sectionPath" class="breadcrumb-link">
            {{ breadcrumb.section }}
          </router-link>
          <template v-if="breadcrumb.sub">
            <span class="breadcrumb-sep">/</span>
            <span class="breadcrumb-current mono">{{ breadcrumb.sub }}</span>
          </template>
        </nav>

        <span class="topbar-spacer"></span>

        <!-- Account button and dropdown -->
        <div ref="accountMenuRef" class="account-container">
          <button
            type="button"
            class="btn account-btn"
            aria-haspopup="menu"
            :aria-expanded="accountMenuOpen"
            @click="toggleAccountMenu"
          >
            <span class="user-avatar">
              {{ (authStore.user?.email || 'A').charAt(0).toUpperCase() }}
            </span>
            <span class="user-email mono">{{ authStore.user?.email }}</span>
            <svg class="i i-s chevron-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          <!-- Dropdown Menu -->
          <div v-if="accountMenuOpen" class="dropdown-menu" role="menu">
            <div class="dropdown-header">
              <div class="dropdown-label">Вхід виконано як</div>
              <div class="dropdown-email mono">{{ authStore.user?.email }}</div>
            </div>
            <div class="dropdown-divider"></div>

            <button
              type="button"
              class="dropdown-item"
              role="menuitem"
              :disabled="registerLoading"
              @click="handleAddPasskey"
            >
              <svg class="i i-s" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 2l-2 2m-1-1l-3 3m1 1l-2 2m-2-2l-1 1m-1-1l-2 2M3 21l3-3m0 0a5.5 5.5 0 1 0-7.78-7.78 5.5 5.5 0 0 0 7.78 7.78z" />
              </svg>
              <span>{{ registerLoading ? 'Створення...' : 'Додати ключ доступу' }}</span>
            </button>

            <div class="dropdown-divider"></div>

            <button
              type="button"
              class="dropdown-item dropdown-item-danger"
              role="menuitem"
              @click="handleLogout"
            >
              <svg class="i i-s" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Вийти</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Toast Notification -->
      <div v-if="toastMessage" :class="['toast-notification', `toast-${toastType}`]" role="status">
        <svg v-if="toastType === 'success'" class="i" viewBox="0 0 24 24" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <svg v-else class="i" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{{ toastMessage }}</span>
      </div>

      <!-- Main Content Outlet -->
      <main class="content-viewport">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-app {
  display: flex;
  min-height: 100vh;
  width: 100%;
  max-width: 100vw;
  background-color: var(--md-sys-color-surface);
  overflow-x: hidden;
}

/* Sidebar */
.sidebar {
  width: var(--bpt-w-sidebar);
  max-width: var(--bpt-w-sidebar);
  background: var(--md-sys-color-surface-container-low);
  padding: var(--bpt-sp-3);
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 56px;
  padding: 0 var(--bpt-sp-3);
  font-weight: 600;
  font-size: var(--bpt-fs-topbar);
  color: var(--md-sys-color-on-surface);
}

.mark {
  width: 28px;
  height: 28px;
  border-radius: var(--bpt-radius-chip);
  background: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
  display: grid;
  place-items: center;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--bpt-sp-3);
  height: var(--bpt-h-nav-item);
  padding: 0 var(--bpt-sp-4);
  border-radius: var(--bpt-radius-full);
  color: var(--md-sys-color-on-surface-variant);
  text-decoration: none;
  font-weight: 500;
  font-size: var(--bpt-fs-body);
  transition: background-color var(--bpt-dur-short) var(--bpt-ease-standard),
              color var(--bpt-dur-short) var(--bpt-ease-standard);
}

.nav-item:hover {
  background: var(--bpt-state-hover);
  color: var(--md-sys-color-on-surface);
}

.nav-item-active,
.nav-item[aria-current='page'] {
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}

/* Main Column */
.main-column {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

/* Topbar */
.topbar {
  height: var(--bpt-h-topbar);
  background: var(--md-sys-color-surface);
  display: flex;
  align-items: center;
  gap: var(--bpt-sp-3);
  padding: 0 var(--bpt-sp-6);
  flex-shrink: 0;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: var(--bpt-sp-2);
  color: var(--md-sys-color-on-surface-variant);
  font-size: var(--bpt-fs-topbar);
  font-weight: 600;
}

.breadcrumb-link {
  color: var(--md-sys-color-on-surface-variant);
  text-decoration: none;
}

.breadcrumb-link:hover {
  color: var(--md-sys-color-on-surface);
}

.breadcrumb-sep {
  color: var(--md-sys-color-outline);
}

.breadcrumb-current {
  color: var(--md-sys-color-on-surface);
}

.topbar-spacer {
  flex: 1;
}

/* Account button */
.account-container {
  position: relative;
}

.account-btn {
  color: var(--md-sys-color-on-surface);
  padding: 0 var(--bpt-sp-3) 0 6px;
  height: 40px;
  border-radius: var(--bpt-radius-full);
  display: inline-flex;
  align-items: center;
  gap: var(--bpt-sp-2);
}

.account-btn:hover {
  background: var(--bpt-state-hover);
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
  display: grid;
  place-items: center;
  font-size: var(--bpt-fs-label);
  font-weight: 600;
}

.user-email {
  font-size: var(--bpt-fs-cell);
}

.chevron-icon {
  color: var(--md-sys-color-on-surface-variant);
}

/* Dropdown Menu */
.dropdown-menu {
  position: absolute;
  top: calc(100% + var(--bpt-sp-2));
  right: 0;
  width: 260px;
  background-color: var(--md-sys-color-surface-container-high);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--bpt-radius-card);
  box-shadow: var(--bpt-shadow-overlay);
  padding: var(--bpt-sp-2);
  z-index: var(--bpt-z-dropdown);
  display: flex;
  flex-direction: column;
}

.dropdown-header {
  padding: var(--bpt-sp-2) var(--bpt-sp-3);
}

.dropdown-label {
  font-size: var(--bpt-fs-label);
  line-height: var(--bpt-lh-label);
  color: var(--md-sys-color-on-surface-variant);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
}

.dropdown-email {
  font-size: var(--bpt-fs-cell);
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
  word-break: break-all;
}

.dropdown-divider {
  height: 1px;
  background-color: var(--md-sys-color-outline-variant);
  margin: var(--bpt-sp-1) 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--bpt-sp-3);
  width: 100%;
  padding: var(--bpt-sp-2) var(--bpt-sp-3);
  background: none;
  border: none;
  border-radius: var(--bpt-radius-control);
  color: var(--md-sys-color-on-surface);
  font-size: var(--bpt-fs-cell);
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: background-color var(--bpt-dur-short) var(--bpt-ease-standard);
}

.dropdown-item:hover:not(:disabled) {
  background-color: var(--bpt-state-hover);
}

.dropdown-item:disabled {
  opacity: var(--md-sys-state-disabled-content-opacity);
  cursor: not-allowed;
}

.dropdown-item-danger {
  color: var(--md-sys-color-error);
}

.dropdown-item-danger:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--md-sys-color-error) calc(var(--md-sys-state-hover-opacity) * 100%), transparent);
}

/* Toast */
.toast-notification {
  position: fixed;
  top: calc(var(--bpt-h-topbar) + var(--bpt-sp-4));
  right: var(--bpt-sp-6);
  padding: var(--bpt-sp-3) var(--bpt-sp-4);
  border-radius: var(--bpt-radius-control);
  display: flex;
  align-items: center;
  gap: var(--bpt-sp-2);
  font-size: var(--bpt-fs-cell);
  font-weight: 500;
  box-shadow: var(--bpt-shadow-overlay);
  z-index: var(--bpt-z-snackbar);
  animation: slideIn var(--bpt-dur-short) ease-out;
}

.toast-success {
  background-color: var(--md-extended-color-success-color-container);
  border: 1px solid var(--md-extended-color-success-color);
  color: var(--md-extended-color-success-on-color-container);
}

.toast-error {
  background-color: var(--md-sys-color-error-container);
  border: 1px solid var(--md-sys-color-error);
  color: var(--md-sys-color-on-error-container);
}

@keyframes slideIn {
  from {
    transform: translateY(-8px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Content Viewport */
.content-viewport {
  flex: 1;
  min-width: 0;
  padding: 0 var(--bpt-sp-4) var(--bpt-sp-4) 0;
  display: flex;
  flex-direction: column;
}
</style>
