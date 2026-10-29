<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const sidebarOpen = ref(false);
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

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

function closeSidebar() {
  sidebarOpen.value = false;
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

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  if (toastTimer) clearTimeout(toastTimer);
});
</script>

<template>
  <div class="admin-layout">
    <!-- Mobile backdrop overlay -->
    <div
      v-if="sidebarOpen"
      class="sidebar-backdrop"
      @click="closeSidebar"
    ></div>

    <!-- Left Navigation Sidebar -->
    <aside :class="['sidebar', { 'sidebar-open': sidebarOpen }]">
      <div class="sidebar-header">
        <div class="logo-mark">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
          </svg>
        </div>
        <div class="logo-text">
          <span class="logo-title">BP Tracker</span>
          <span class="logo-badge">Admin</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-link"
          :class="{ 'nav-link-active': route.path === item.path }"
          @click="closeSidebar"
        >
          <!-- Table icon -->
          <svg v-if="item.icon === 'table'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="3" y1="15" x2="21" y2="15"></line>
            <line x1="12" y1="3" x2="12" y2="21"></line>
          </svg>

          <!-- Stats / Chart icon -->
          <svg v-else-if="item.icon === 'chart'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>

          <!-- Logs / File icon -->
          <svg v-else-if="item.icon === 'file-text'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>

          <!-- Settings icon -->
          <svg v-else-if="item.icon === 'settings'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>

          <!-- OCR / Camera icon -->
          <svg v-else-if="item.icon === 'camera'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>

          <span class="nav-text">{{ item.name }}</span>
        </router-link>
      </nav>
    </aside>

    <!-- Main Content Container -->
    <div class="layout-body">
      <!-- Top Header -->
      <header class="header">
        <div class="header-left">
          <button
            type="button"
            class="sidebar-toggle btn-icon"
            aria-label="Перемкнути навігацію"
            @click="toggleSidebar"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="header-right">
          <!-- Account Menu -->
          <div ref="accountMenuRef" class="account-menu-container">
            <button
              type="button"
              class="account-btn"
              :aria-expanded="accountMenuOpen"
              @click="toggleAccountMenu"
            >
              <div class="user-avatar">
                {{ (authStore.user?.email || 'A').charAt(0).toUpperCase() }}
              </div>
              <span class="user-email mono">{{ authStore.user?.email }}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chevron-icon">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            <!-- Dropdown Menu -->
            <div v-if="accountMenuOpen" class="dropdown-menu">
              <div class="dropdown-header">
                <div class="dropdown-user-label">Вхід виконано як</div>
                <div class="dropdown-user-email mono">{{ authStore.user?.email }}</div>
              </div>
              <div class="dropdown-divider"></div>

              <button
                type="button"
                class="dropdown-item"
                :disabled="registerLoading"
                @click="handleAddPasskey"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 2l-2 2m-1-1l-3 3m1 1l-2 2m-2-2l-1 1m-1-1l-2 2M3 21l3-3m0 0a5.5 5.5 0 1 0-7.78-7.78 5.5 5.5 0 0 0 7.78 7.78z"></path>
                </svg>
                <span>{{ registerLoading ? 'Створення...' : 'Додати ключ доступу' }}</span>
              </button>

              <div class="dropdown-divider"></div>

              <button
                type="button"
                class="dropdown-item dropdown-item-danger"
                @click="handleLogout"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span>Вийти</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Toast notification -->
      <div v-if="toastMessage" :class="['toast-notification', `toast-${toastType}`]">
        <svg v-if="toastType === 'success'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{{ toastMessage }}</span>
      </div>

      <!-- Main Page Content -->
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  width: 100%;
  background-color: var(--bg-primary);
}

/* Sidebar */
.sidebar {
  width: var(--sidebar-width);
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--surface-border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: transform 0.25s ease;
  z-index: 100;
}

.sidebar-header {
  height: var(--header-height);
  padding: 0 var(--space-20);
  display: flex;
  align-items: center;
  gap: var(--space-12);
  border-bottom: 1px solid var(--surface-border);
}

.logo-mark {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-control);
  background: var(--primary-bg-chip);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-text {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.logo-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.logo-badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  background: var(--primary-bg-chip);
  color: var(--primary);
  padding: 2px 6px;
  border-radius: var(--radius-pill);
  letter-spacing: 0.05em;
}

.sidebar-nav {
  padding: var(--space-16) var(--space-12);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  padding: var(--space-12) var(--space-16);
  border-radius: var(--radius-control);
  color: var(--text-muted);
  font-weight: 500;
  font-size: 14px;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.nav-link:hover {
  background-color: var(--surface);
  color: var(--text-primary);
}

.nav-link-active {
  background-color: var(--primary-bg-chip);
  color: var(--primary);
  font-weight: 600;
}

/* Layout Body */
.layout-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* Header */
.header {
  height: var(--header-height);
  background-color: var(--header-bg);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--surface-border);
  padding: 0 var(--space-24);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 50;
}

.btn-icon {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
  border-radius: var(--radius-control);
  transition: color 0.15s ease, background-color 0.15s ease;
}

.btn-icon:hover {
  color: var(--text-primary);
  background-color: var(--surface);
}

.sidebar-toggle {
  display: none;
}

/* Account dropdown */
.account-menu-container {
  position: relative;
}

.account-btn {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  background: var(--surface);
  border: 1px solid var(--surface-border);
  padding: var(--space-4) var(--space-12) var(--space-4) var(--space-4);
  border-radius: var(--radius-pill);
  cursor: pointer;
  color: var(--text-primary);
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.account-btn:hover {
  background-color: var(--surface-hover);
  border-color: rgba(255, 255, 255, 0.15);
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--primary);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
}

.user-email {
  font-size: 13px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chevron-icon {
  color: var(--text-dim);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + var(--space-8));
  right: 0;
  width: 240px;
  background-color: var(--surface);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-card);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
  padding: var(--space-8);
  z-index: 200;
  display: flex;
  flex-direction: column;
}

.dropdown-header {
  padding: var(--space-8) var(--space-12);
}

.dropdown-user-label {
  font-size: 11px;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
}

.dropdown-user-email {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  word-break: break-all;
}

.dropdown-divider {
  height: 1px;
  background-color: var(--surface-border);
  margin: var(--space-4) 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  width: 100%;
  padding: var(--space-12);
  background: none;
  border: none;
  border-radius: var(--radius-control);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.dropdown-item:hover:not(:disabled) {
  background-color: var(--surface-hover);
}

.dropdown-item:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.dropdown-item-danger {
  color: var(--danger);
}

.dropdown-item-danger:hover:not(:disabled) {
  background-color: var(--danger-bg-chip);
}

/* Toast */
.toast-notification {
  position: fixed;
  top: calc(var(--header-height) + var(--space-16));
  right: var(--space-24);
  padding: var(--space-12) var(--space-16);
  border-radius: var(--radius-control);
  display: flex;
  align-items: center;
  gap: var(--space-8);
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: 300;
  animation: slideIn 0.2s ease-out;
}

.toast-success {
  background-color: #064e3b;
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #a7f3d0;
}

.toast-error {
  background-color: #7f1d1d;
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fecaca;
}

@keyframes slideIn {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Main Content */
.main-content {
  flex: 1;
  padding: var(--space-24);
}

/* Responsive */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
  }

  .sidebar-open {
    transform: translateX(0);
  }

  .sidebar-backdrop {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(2px);
    z-index: 90;
  }

  .sidebar-toggle {
    display: flex;
  }

  .header {
    padding: 0 var(--space-16);
  }

  .main-content {
    padding: var(--space-16);
  }

  .user-email {
    display: none;
  }

  .account-btn {
    padding: var(--space-4);
  }

  .chevron-icon {
    display: none;
  }
}
</style>
