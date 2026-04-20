<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter, useRoute } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const email = ref('');
const error = ref('');
const loading = ref(false);
const message = ref('');

onMounted(async () => {
  const token = route.query.token as string;
  if (token) {
    loading.value = true;
    message.value = 'Перевірка посилання...';
    try {
      await auth.consumeMagicLink(token);
      router.push({ name: 'dashboard' });
    } catch (err: any) {
      error.value = err.message || 'Посилання недійсне';
    } finally {
      loading.value = false;
    }
  }
});

async function handlePasskey() {
  if (!email.value) {
    error.value = 'Будь ласка, введіть email';
    return;
  }

  error.value = '';
  loading.value = true;
  try {
    try {
      await auth.loginPasskey();
    } catch (err: any) {
      // User cancelled — do not fall through to registration
      if (err?.name === 'NotAllowedError') throw err;
      // No passkeys found — try registration
      await auth.registerPasskey(email.value);
    }
    router.push({ name: 'dashboard' });
  } catch (err: any) {
    if (err?.name === 'NotAllowedError') {
      error.value = 'Вхід скасовано.';
    } else {
      error.value = 'Помилка автентифікації. Перевірте email або спробуйте інший спосіб.';
    }
  } finally {
    loading.value = false;
  }
}

async function handleMagicLink() {
  if (!email.value) {
    error.value = 'Будь ласка, введіть email';
    return;
  }
  
  error.value = '';
  loading.value = true;
  try {
    await auth.requestMagicLink(email.value);
    message.value = 'Посилання для входу надіслано на вашу пошту!';
  } catch (err: any) {
    error.value = err.message || 'Не вдалося надіслати посилання';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="icon-header">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      </div>
      
      <h1>Вітаємо!</h1>
      <p class="subtitle">Увійдіть або зареєструйтесь за допомогою Passkey або email</p>
      
      <div v-if="error" class="alert error">{{ error }}</div>
      <div v-if="message" class="alert success">{{ message }}</div>
      
      <form @submit.prevent="handlePasskey" class="auth-form">
        <input 
          v-model="email" 
          type="email" 
          required 
          placeholder="vash-email@example.com"
          class="email-input"
          :disabled="loading"
        >
        
        <button type="submit" class="btn primary" :disabled="loading">
          <span v-if="loading">Зачекайте...</span>
          <span v-else>Увійти через Passkey</span>
        </button>
        
        <button type="button" @click="handleMagicLink" class="btn secondary" :disabled="loading">
          Надіслати посилання на email
        </button>
      </form>
      
      <p class="footer-text">
        Passkey — це безпечний спосіб входу без пароля за допомогою відбитку пальця або Face ID.
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-4);
  background-color: var(--color-bg);
}

.login-card {
  background: var(--color-surface);
  padding: var(--space-8);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  width: 100%;
  max-width: 400px;
  text-align: center;

  & h1 {
    font-size: var(--text-xl);
    margin-bottom: var(--space-2);
  }

  & .subtitle {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    margin-bottom: var(--space-8);
  }
}

.icon-header {
  width: 80px;
  height: 80px;
  background-color: color-mix(in srgb, var(--color-primary), transparent 90%);
  color: var(--color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-6);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.email-input {
  width: 100%;
  padding: var(--space-4);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: var(--color-primary);
  }
}

.btn {
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  font-weight: bold;
  font-size: var(--text-base);
  transition: all 0.2s;

  &.primary {
    background-color: var(--color-primary);
    color: white;
    box-shadow: 0 4px 6px -1px color-mix(in srgb, var(--color-primary), transparent 80%);

    &:hover:not(:disabled) {
      background-color: var(--color-primary-hover);
    }
  }

  &.secondary {
    color: var(--color-primary);
    background: transparent;

    &:hover:not(:disabled) {
      background-color: color-mix(in srgb, var(--color-primary), transparent 95%);
    }
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.alert {
  padding: var(--space-3);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
  font-size: var(--text-sm);

  &.error {
    background-color: color-mix(in srgb, var(--color-danger), transparent 90%);
    color: var(--color-danger);
  }

  &.success {
    background-color: color-mix(in srgb, var(--color-success), transparent 90%);
    color: var(--color-success);
  }
}

.footer-text {
  margin-top: var(--space-8);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  line-height: 1.4;
}
</style>
