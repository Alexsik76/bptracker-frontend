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
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
        </svg>
      </div>

      <h1 class="title">Немає доступу</h1>
      <p class="subtitle">
        Обліковий запис <strong class="mono">{{ authStore.user?.email || 'користувача' }}</strong> не має прав адміністратора для перегляду цієї панелі.
      </p>

      <div class="actions">
        <button type="button" class="btn btn-outline btn-full" @click="handleLogout">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
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
  padding: var(--space-20);
  background-color: var(--bg-primary);
}

.forbidden-card {
  width: 100%;
  max-width: 440px;
  background: var(--surface);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-card);
  padding: var(--space-32) var(--space-24);
  text-align: center;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
}

.icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--danger-bg-chip);
  color: var(--danger);
  margin-bottom: var(--space-20);
}

.title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--space-12);
}

.subtitle {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: var(--space-28);
}

.actions {
  display: flex;
  justify-content: center;
}
</style>
