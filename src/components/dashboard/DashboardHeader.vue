<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const userInitials = computed(() => (auth.user?.email ?? '?').charAt(0).toUpperCase())
</script>

<template>
  <header class="header">
    <div class="header-content">
      <div class="logo">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
        <h1>BP Tracker</h1>
      </div>
      <div class="header-actions">
        <button @click="router.push({ name: 'settings' })" class="settings-btn" title="Налаштування">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
        <div class="user-chip" @click="router.push({ name: 'settings' })" title="Профіль">
          <span class="avatar">{{ userInitials }}</span>
          <span class="user-email">{{ auth.user?.email }}</span>
        </div>
        <button @click="router.push({ name: 'measurement-new' })" class="add-btn">
          + Додати
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  background-color: var(--color-primary);
  color: white;
  padding: var(--space-3) var(--space-4);
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: var(--shadow-md);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: white;

  & h1 {
    font-size: var(--text-lg);
    font-weight: 700;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.settings-btn {
  color: rgba(255,255,255,0.8);
  transition: color 0.2s;

  &:hover { color: white; }
}

.user-chip {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  color: rgba(255,255,255,0.9);
  transition: color 0.2s;

  &:hover { color: white; }

  & .avatar {
    width: 28px;
    height: 28px;
    background: rgba(255,255,255,0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: var(--text-xs);
    flex-shrink: 0;
  }

  & .user-email {
    font-size: var(--text-sm);
    display: none;
    @media (min-width: 640px) { display: inline; }
  }
}

.add-btn {
  background: white;
  color: var(--color-primary);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: 700;
  font-size: var(--text-sm);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  transition: box-shadow 0.15s, transform 0.1s;

  &:hover {
    box-shadow: 0 4px 14px rgba(0,0,0,0.22);
    transform: translateY(-1px);
  }

  &:active { transform: scale(0.97); }
}
</style>
