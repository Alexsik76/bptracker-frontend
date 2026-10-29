<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const email = ref('');
const loadingPasskey = ref(false);
const loadingMagicLink = ref(false);
const magicLinkSent = ref(false);
const errorMessage = ref<string | null>(null);

function handleAuthSuccess(isAdmin: boolean) {
  if (isAdmin) {
    router.replace('/tables');
  } else {
    router.replace('/forbidden');
  }
}

async function handlePasskeyLogin() {
  loadingPasskey.value = true;
  errorMessage.value = null;
  try {
    const user = await authStore.loginPasskey();
    handleAuthSuccess(user.is_admin);
  } catch (err: unknown) {
    console.error('Passkey login error:', err);
    errorMessage.value =
      err instanceof Error ? err.message : 'Не вдалося увійти ключем доступу';
  } finally {
    loadingPasskey.value = false;
  }
}

async function handleMagicLinkRequest() {
  if (!email.value || !email.value.includes('@')) {
    errorMessage.value = 'Введіть коректну адресу електронної пошти';
    return;
  }

  loadingMagicLink.value = true;
  errorMessage.value = null;
  try {
    await authStore.requestMagicLink(email.value.trim());
    magicLinkSent.value = true;
  } catch (err: unknown) {
    console.error('Magic link request error:', err);
    errorMessage.value =
      err instanceof Error ? err.message : 'Не вдалося надіслати посилання для входу';
  } finally {
    loadingMagicLink.value = false;
  }
}

onMounted(async () => {
  const token = route.query.token as string | undefined;
  if (token) {
    loadingMagicLink.value = true;
    errorMessage.value = null;
    try {
      const user = await authStore.confirmMagicLink(token);
      handleAuthSuccess(user.is_admin);
    } catch (err: unknown) {
      console.error('Magic link confirmation error:', err);
      errorMessage.value =
        err instanceof Error ? err.message : 'Не вдалося підтвердити посилання для входу';
    } finally {
      loadingMagicLink.value = false;
    }
  }
});
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="header-section">
        <div class="brand-badge">BP Tracker</div>
        <h1 class="page-title">Панель адміністратора</h1>
        <p class="page-subtitle">Вхід до системи керування</p>
      </div>

      <div v-if="errorMessage" class="error-banner">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Passkey login -->
      <div class="section">
        <button
          type="button"
          class="btn btn-primary btn-full"
          :disabled="loadingPasskey || loadingMagicLink"
          @click="handlePasskeyLogin"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 2l-2 2m-1-1l-3 3m1 1l-2 2m-2-2l-1 1m-1-1l-2 2M3 21l3-3m0 0a5.5 5.5 0 1 0-7.78-7.78 5.5 5.5 0 0 0 7.78 7.78z"></path>
          </svg>
          <span>{{ loadingPasskey ? 'Авторизація...' : 'Увійти ключем доступу' }}</span>
        </button>
      </div>

      <div class="divider">
        <span class="divider-text">або за посиланням</span>
      </div>

      <!-- Magic link login -->
      <div v-if="!magicLinkSent" class="section">
        <form @submit.prevent="handleMagicLinkRequest">
          <div class="form-group">
            <label class="form-label" for="email">Електронна пошта</label>
            <input
              id="email"
              v-model="email"
              type="email"
              class="form-input"
              placeholder="admin@example.com"
              required
              autocomplete="email"
              :disabled="loadingPasskey || loadingMagicLink"
            />
          </div>
          <button
            type="submit"
            class="btn btn-secondary btn-full"
            :disabled="loadingPasskey || loadingMagicLink"
          >
            {{ loadingMagicLink ? 'Надсилання...' : 'Отримати посилання для входу' }}
          </button>
        </form>
      </div>

      <div v-else class="magic-sent-box">
        <div class="magic-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
        </div>
        <h3 class="magic-sent-title">Перевірте пошту</h3>
        <p class="magic-sent-desc">
          Посилання для входу надіслано на <strong class="mono">{{ email }}</strong>. Перейдіть за ним для авторизації.
        </p>
        <button
          type="button"
          class="btn btn-outline btn-sm"
          @click="magicLinkSent = false"
        >
          Надіслати іншу адресу
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-20);
  background: radial-gradient(circle at 50% 20%, #161f33 0%, var(--bg-primary) 70%);
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: var(--surface);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-card);
  padding: var(--space-32) var(--space-24);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
}

.header-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: var(--space-28);
}

.brand-badge {
  display: inline-flex;
  padding: var(--space-4) var(--space-12);
  border-radius: var(--radius-pill);
  background: var(--primary-bg-chip);
  color: var(--primary);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-12);
  text-transform: uppercase;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--space-4);
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-muted);
}

.error-banner {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  background: var(--danger-bg-chip);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: var(--danger);
  padding: var(--space-12) var(--space-16);
  border-radius: var(--radius-control);
  font-size: 13px;
  margin-bottom: var(--space-20);
}

.section {
  display: flex;
  flex-direction: column;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: var(--space-24) 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--surface-border);
}

.divider-text {
  padding: 0 var(--space-12);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.magic-sent-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-20);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-control);
}

.magic-icon {
  color: var(--success);
  margin-bottom: var(--space-12);
}

.magic-sent-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: var(--space-8);
}

.magic-sent-desc {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: var(--space-16);
}
</style>
