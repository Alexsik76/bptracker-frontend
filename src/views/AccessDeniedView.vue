<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

async function handleLogout() {
  await authStore.logout();
  router.replace('/login');
}
</script>

<template>
  <div class="forbidden-page">
    <div class="forbidden-card">
      <div class="icon-wrap">
        <svg class="i forbidden-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      </div>

      <h1 class="title">Немає доступу</h1>
      <p class="subtitle">
        Обліковий запис <strong class="mono">{{ authStore.user?.email || 'користувача' }}</strong> не має прав адміністратора для перегляду цієї панелі.
      </p>

      <div class="actions">
        <button type="button" class="btn btn-outlined btn-full" @click="handleLogout">
          <svg class="i" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Вийти</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.forbidden-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--bpt-sp-5);
  background-color: var(--md-sys-color-surface);
}

.forbidden-card {
  width: 100%;
  max-width: 440px;
  background: var(--md-sys-color-surface-container-low);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--bpt-radius-card);
  padding: var(--bpt-sp-8) var(--bpt-sp-6);
  text-align: center;
  box-shadow: var(--bpt-shadow-overlay);
}

.icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
  margin-bottom: var(--bpt-sp-5);
}

.forbidden-icon-svg {
  width: var(--bpt-h-control-sm);
  height: var(--bpt-h-control-sm);
}

.title {
  font-size: var(--bpt-fs-title-page);
  line-height: var(--bpt-lh-title-page);
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
  margin-bottom: var(--bpt-sp-3);
}

.subtitle {
  font-size: var(--bpt-fs-body);
  color: var(--md-sys-color-on-surface-variant);
  line-height: var(--bpt-lh-body);
  margin-bottom: var(--bpt-sp-6);
}

.actions {
  display: flex;
  justify-content: center;
}

.btn-full {
  width: 100%;
}
</style>
