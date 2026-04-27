<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useAuthStore } from './stores/auth';
import { useRouter } from 'vue-router';
import ToastContainer from './components/ToastContainer.vue';
import ConfirmDialog from './components/ConfirmDialog.vue';

const auth = useAuthStore();
const router = useRouter();

function handleUnauthorized() {
  // Skip if already on login page to avoid redirect loops
  if (router.currentRoute.value.name === 'login') return;
  auth.clearSession();
  router.push({ name: 'login' });
}

onMounted(() => {
  window.addEventListener('api:unauthorized', handleUnauthorized);
});

onUnmounted(() => {
  window.removeEventListener('api:unauthorized', handleUnauthorized);
});
</script>

<template>
  <div v-if="auth.status === 'idle' || auth.status === 'loading'" class="app-loading">
    <div class="spinner"></div>
  </div>
  <router-view v-else></router-view>
  <ToastContainer />
  <ConfirmDialog />
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
