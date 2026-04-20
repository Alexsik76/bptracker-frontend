<script setup lang="ts">
import { useAuthStore } from './stores/auth';

const auth = useAuthStore();
</script>

<template>
  <div v-if="auth.status === 'idle' || auth.status === 'loading'" class="app-loading">
    <div class="spinner"></div>
  </div>
  <router-view v-else></router-view>
</template>

<style>
.app-loading {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
