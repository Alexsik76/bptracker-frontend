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
  authStore.error = null;
  try {
    const user = await authStore.loginPasskey();
    handleAuthSuccess(user.is_admin);
  } catch (err: unknown) {
    console.error('Passkey login error:', err);
    errorMessage.value =
      err instanceof Error ? err.message : 'Failed to sign in with passkey';
  } finally {
    loadingPasskey.value = false;
  }
}

async function handleMagicLinkRequest() {
  if (!email.value || !email.value.includes('@')) {
    errorMessage.value = 'Enter a valid email address';
    return;
  }

  loadingMagicLink.value = true;
  errorMessage.value = null;
  authStore.error = null;
  try {
    await authStore.requestMagicLink(email.value.trim());
    magicLinkSent.value = true;
  } catch (err: unknown) {
    console.error('Magic link request error:', err);
    errorMessage.value =
      err instanceof Error ? err.message : 'Failed to send login link';
  } finally {
    loadingMagicLink.value = false;
  }
}

async function handleRetryInit() {
  errorMessage.value = null;
  const success = await authStore.initAuth();
  if (success) {
    handleAuthSuccess(authStore.isAdmin);
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
        err instanceof Error ? err.message : 'Invalid or expired login link';
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
        <h1 class="page-title">Admin Panel</h1>
        <p class="page-subtitle">Sign in to management panel</p>
      </div>

      <div v-if="authStore.error || errorMessage" class="error-banner" role="alert">
        <svg class="i" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div class="error-content">
          <span>{{ authStore.error || errorMessage }}</span>
          <button
            v-if="authStore.error"
            type="button"
            class="btn btn-outlined btn-sm retry-btn"
            :disabled="authStore.status === 'loading'"
            @click="handleRetryInit"
          >
            {{ authStore.status === 'loading' ? 'Checking...' : 'Retry' }}
          </button>
        </div>
      </div>

      <!-- Passkey login -->
      <div class="section">
        <button
          type="button"
          class="btn btn-filled btn-full"
          :disabled="loadingPasskey || loadingMagicLink"
          @click="handlePasskeyLogin"
        >
          <svg class="i" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 2l-2 2m-1-1l-3 3m1 1l-2 2m-2-2l-1 1m-1-1l-2 2M3 21l3-3m0 0a5.5 5.5 0 1 0-7.78-7.78 5.5 5.5 0 0 0 7.78 7.78z" />
          </svg>
          <span>{{ loadingPasskey ? 'Signing in...' : 'Sign in with passkey' }}</span>
        </button>
      </div>

      <div class="divider">
        <span class="divider-text">or with magic link</span>
      </div>

      <!-- Magic link login -->
      <div v-if="!magicLinkSent" class="section">
        <form @submit.prevent="handleMagicLinkRequest">
          <div class="field email-field">
            <label class="label" for="email">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              class="input"
              placeholder="admin@example.com"
              required
              autocomplete="email"
              :disabled="loadingPasskey || loadingMagicLink"
            />
          </div>
          <button
            type="submit"
            class="btn btn-outlined btn-full"
            :disabled="loadingPasskey || loadingMagicLink"
          >
            {{ loadingMagicLink ? 'Sending...' : 'Send magic link' }}
          </button>
        </form>
      </div>

      <div v-else class="magic-sent-box">
        <div class="magic-icon">
          <svg class="i magic-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <h3 class="magic-sent-title">Check your email</h3>
        <p class="magic-sent-desc">
          A sign-in link has been sent to <strong class="mono">{{ email }}</strong>. Follow the link to authenticate.
        </p>
        <button
          type="button"
          class="btn btn-outlined btn-sm"
          @click="magicLinkSent = false"
        >
          Use a different email
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
  padding: var(--bpt-sp-5);
  background: var(--md-sys-color-surface);
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: var(--md-sys-color-surface-container-low);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--bpt-radius-card);
  padding: var(--bpt-sp-8) var(--bpt-sp-6);
  box-shadow: var(--bpt-shadow-overlay);
}

.header-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: var(--bpt-sp-6);
}

.brand-badge {
  display: inline-flex;
  padding: 2px var(--bpt-sp-3);
  border-radius: var(--bpt-radius-full);
  background: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
  font-size: var(--bpt-fs-label);
  font-weight: 600;
  letter-spacing: 0.05em;
  margin-bottom: var(--bpt-sp-3);
  text-transform: uppercase;
}

.page-title {
  font-size: var(--bpt-fs-title-page);
  line-height: var(--bpt-lh-title-page);
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
  margin-bottom: var(--bpt-sp-1);
}

.page-subtitle {
  font-size: var(--bpt-fs-body);
  color: var(--md-sys-color-on-surface-variant);
}

.error-banner {
  display: flex;
  align-items: center;
  gap: var(--bpt-sp-3);
  background: var(--md-sys-color-error-container);
  border: 1px solid var(--md-sys-color-error);
  color: var(--md-sys-color-on-error-container);
  padding: var(--bpt-sp-3) var(--bpt-sp-4);
  border-radius: var(--bpt-radius-control);
  font-size: var(--bpt-fs-cell);
  margin-bottom: var(--bpt-sp-5);
}

.error-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--bpt-sp-3);
  flex: 1;
}

.retry-btn {
  border-color: var(--md-sys-color-error);
  color: var(--md-sys-color-on-error-container);
}

.email-field {
  margin-bottom: var(--bpt-sp-4);
}

.section {
  display: flex;
  flex-direction: column;
}

.btn-full {
  width: 100%;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: var(--bpt-sp-6) 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}

.divider-text {
  padding: 0 var(--bpt-sp-3);
  font-size: var(--bpt-fs-label);
  line-height: var(--bpt-lh-label);
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--md-sys-color-on-surface-variant);
}

.magic-sent-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--bpt-sp-5);
  background: var(--md-sys-color-surface-container);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--bpt-radius-control);
}

.magic-icon {
  color: var(--md-extended-color-success-color);
  margin-bottom: var(--bpt-sp-3);
}

.magic-icon-svg {
  width: var(--bpt-h-control-sm);
  height: var(--bpt-h-control-sm);
}

.magic-sent-title {
  font-size: var(--bpt-fs-topbar);
  font-weight: 600;
  margin-bottom: var(--bpt-sp-2);
}

.magic-sent-desc {
  font-size: var(--bpt-fs-cell);
  color: var(--md-sys-color-on-surface-variant);
  line-height: var(--bpt-lh-body);
  margin-bottom: var(--bpt-sp-4);
}
</style>
