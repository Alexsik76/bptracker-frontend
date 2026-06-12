<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth';
import { useSettingsStore } from '../stores/settings';
import { useRouter } from 'vue-router';
import { useToast } from '../composables/useToast';
import { useConfirm } from '../composables/useConfirm';
import { useTheme, setTheme } from '../composables/useTheme';
import { useLocale } from '../composables/useLocale';
import { useApiErrorMessage } from '../composables/useApiErrorMessage';
import { usePush } from '../composables/usePush';
import type { Theme } from '../composables/useTheme';
import type { AppLocale } from '../i18n';

const { t } = useI18n();
const { theme } = useTheme();
const { locale, setLocale } = useLocale();
const { toMessage } = useApiErrorMessage();

const themeOptions: Array<{ value: Theme; labelKey: string }> = [
  { value: 'auto',  labelKey: 'settings.theme.auto' },
  { value: 'light', labelKey: 'settings.theme.light' },
  { value: 'dark',  labelKey: 'settings.theme.dark' },
];

const localeOptions: Array<{ value: AppLocale; label: string }> = [
  { value: 'uk', label: 'Українська' },
  { value: 'en', label: 'English' },
];

const auth = useAuthStore();
const settingsStore = useSettingsStore();
const router = useRouter();
const toast = useToast();
const { confirm } = useConfirm();
const push = usePush();

const commit = __APP_COMMIT__
const buildDate = __APP_BUILD_DATE__

const form = reactive({
  geminiUrl: '',
  exportEmail: '',
  sheetsTemplateUrl: '',
  sendPhotos: true,
});

const loading = ref(false);

const isIos = computed(() => {
  const ua = window.navigator.userAgent.toLowerCase();
  return ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod');
});

const isStandalone = computed(() => {
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
});

const showIosHint = computed(() => {
  return isIos.value && !isStandalone.value;
});

onMounted(async () => {
  await settingsStore.fetchSettings();
  form.geminiUrl = settingsStore.settings.geminiUrl || '';
  form.exportEmail = settingsStore.settings.exportEmail || '';
  form.sheetsTemplateUrl = settingsStore.settings.sheetsTemplateUrl || '';
  form.sendPhotos = settingsStore.settings.sendPhotos !== false;
  push.checkStatus();
});

async function save() {
  loading.value = true;
  try {
    await settingsStore.updateSettings({ ...form });
    toast.success(t('settings.saved'));
  } catch (err) {
    toast.error(toMessage(err, 'errors.saveFailed'));
  } finally {
    loading.value = false;
  }
}

async function handleLogout() {
  const ok = await confirm(t('settings.logoutConfirm'), {
    confirmText: t('settings.logoutBtn'),
    cancelText: t('common.cancel'),
  });
  if (ok) {
    auth.logout();
    router.push({ name: 'login' });
  }
}
</script>

<template>
  <div class="settings-page">
    <button
      class="corner-help"
      :aria-label="$t('info.title')"
      @click="router.push('/info')"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9aa2b0" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    </button>
    <header class="back-header">
      <button class="back-btn" @click="router.back()" aria-label="Назад">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#e8eaee" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12.5 4 L6 10 L12.5 16"></path>
        </svg>
      </button>
      <h1 class="page-title">{{ $t('settings.title') }}</h1>
    </header>

    <main class="content">
      <section class="user-info card">
        <h2>{{ $t('settings.account.title') }}</h2>
        <p class="email">{{ auth.user?.email }}</p>
        <button class="btn-link danger" @click="handleLogout">{{ $t('settings.account.logout') }}</button>
      </section>

      <section class="card">
        <h2>{{ $t('settings.theme.label') }}</h2>
        <div class="theme-segmented" role="group" :aria-label="$t('settings.theme.label')">
          <button
            v-for="opt in themeOptions"
            :key="opt.value"
            type="button"
            :class="['seg-btn', { active: theme === opt.value }]"
            :aria-pressed="theme === opt.value"
            @click="setTheme(opt.value)"
          >
            {{ $t(opt.labelKey) }}
          </button>
        </div>
      </section>

      <section class="card">
        <h2>{{ $t('settings.locale.label') }}</h2>
        <div class="locale-segmented" role="group" :aria-label="$t('settings.locale.label')">
          <button
            v-for="opt in localeOptions"
            :key="opt.value"
            type="button"
            :class="['seg-btn', { active: locale === opt.value }]"
            :aria-pressed="locale === opt.value"
            @click="setLocale(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </section>

      <section class="card">
        <h2>{{ $t('settings.reminders.title') }}</h2>
        <div class="reminders-setting">
          <div v-if="showIosHint" class="ios-hint-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <span>{{ $t('settings.reminders.iosHint') }}</span>
          </div>

          <div v-else class="reminders-status-row">
            <div class="status-info">
              <span class="status-label">
                {{
                  push.status.value === 'subscribed'
                    ? $t('settings.reminders.statusSupported')
                    : push.status.value === 'denied'
                    ? $t('settings.reminders.statusDenied')
                    : push.status.value === 'unsupported'
                    ? $t('settings.reminders.statusNotSupported')
                    : $t('settings.reminders.statusNotSubscribed')
                }}
              </span>
              <p v-if="push.status.value === 'denied'" class="guidance-text">
                {{ $t('settings.reminders.deniedGuidance') }}
              </p>
            </div>

            <button
              v-if="push.status.value === 'subscribed'"
              class="btn unsubscribe-btn danger-btn"
              :disabled="push.loading.value"
              @click="push.unsubscribe()"
            >
              {{ push.loading.value ? $t('common.wait') : $t('settings.reminders.disableBtn') }}
            </button>
            <button
              v-else-if="push.status.value === 'not'"
              class="btn subscribe-btn primary"
              :disabled="push.loading.value"
              @click="push.requestAndSubscribe()"
            >
              {{ push.loading.value ? $t('common.wait') : $t('settings.reminders.enableBtn') }}
            </button>
          </div>
        </div>
      </section>

      <section class="settings-form card">
        <h2>{{ $t('settings.params.title') }}</h2>
        <form @submit.prevent="save">
          <div class="field">
            <label>
              {{ $t('settings.params.exportEmail') }}
              <input v-model="form.exportEmail" type="email" placeholder="email@example.com" />
            </label>
          </div>

          <div class="field">
            <label>
              {{ $t('settings.params.geminiUrl') }}
              <input v-model="form.geminiUrl" type="url" placeholder="https://..." />
            </label>
          </div>

          <div class="field">
            <label>
              {{ $t('settings.params.sheetsTemplate') }}
              <input
                v-model="form.sheetsTemplateUrl"
                type="url"
                placeholder="https://docs.google.com/spreadsheets/..."
              />
            </label>
          </div>

          <div class="field field-toggle">
            <label class="toggle-label">
              <span class="toggle-text">
                <span class="toggle-title">{{ $t('settings.params.sendPhotos') }}</span>
                <span class="toggle-hint">{{ $t('settings.params.sendPhotosHint') }}</span>
              </span>
              <input type="checkbox" v-model="form.sendPhotos" class="toggle-input" />
            </label>
          </div>

          <button type="submit" class="btn primary" :disabled="loading">
            {{ loading ? $t('settings.saving') : $t('settings.saveChanges') }}
          </button>
        </form>
      </section>

      <p class="version">BP Tracker · build {{ commit }} · {{ buildDate }}</p>
    </main>
  </div>
</template>

<style scoped>
.back-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 16px 8px;
  flex-shrink: 0;
}

.back-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #15181d;
  border: 1px solid #21262d;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #e8eaee;
  padding: 0;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.85;
  }
}

.page-title {
  font-size: 20px;
  font-weight: 800;
  color: #f2f4f7;
  margin: 0;
}

.content {
  padding: var(--space-6);
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.card {
  background: var(--color-surface);
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);

  & h2 {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    text-transform: uppercase;
    margin-bottom: var(--space-4);
    letter-spacing: 0.05em;
  }
}

.email {
  font-weight: bold;
  font-size: var(--text-lg);
  margin-bottom: var(--space-2);
}

.field {
  margin-bottom: var(--space-6);

  & label {
    display: block;
    font-size: var(--text-sm);
    margin-bottom: var(--space-2);
    font-weight: 500;
  }

  & input {
    width: 100%;
    padding: var(--space-3);
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    outline: none;

    &:focus {
      border-color: var(--color-primary);
    }
  }
}

.field-toggle {
  margin-bottom: var(--space-6);
}

.toggle-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  cursor: pointer;
}

.toggle-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.toggle-title {
  font-size: var(--text-sm);
  font-weight: 500;
}

.toggle-hint {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.toggle-input {
  width: 2.5rem;
  height: 1.5rem;
  accent-color: var(--color-primary);
  cursor: pointer;
  flex-shrink: 0;
}

.btn {
  width: 100%;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  font-weight: bold;

  &.primary {
    background: var(--color-primary);
    color: white;
  }
}

.btn-link {
  font-size: var(--text-sm);
  font-weight: 500;

  &.danger {
    color: var(--color-danger);
  }
}

.version {
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--text-xs);
  margin-top: var(--space-4);
}

.theme-segmented,
.locale-segmented {
  display: inline-flex;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 2px;
  gap: 2px;
}

.seg-btn {
  padding: var(--space-3) var(--space-7);
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  cursor: pointer;
  border-radius: calc(var(--radius-md) - 2px);
  transition: background 0.15s, color 0.15s;
}

.seg-btn.active {
  background: var(--color-primary);
  color: #fff;
}

.reminders-setting {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.ios-hint-box {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-muted);
  font-size: var(--text-sm);

  & svg {
    color: var(--color-primary);
    flex-shrink: 0;
  }
}

.reminders-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.status-label {
  font-weight: 600;
  font-size: var(--text-base);
}

.guidance-text {
  font-size: var(--text-xs);
  color: var(--color-danger);
  line-height: 1.4;
}

.danger-btn {
  background: var(--color-danger);
  color: white;
  border: none;
  cursor: pointer;
  
  &:disabled {
    opacity: 0.6;
  }
}

.corner-help {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 999;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(21, 24, 29, 0.82);
  border: 1px solid #262b33;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  cursor: pointer;
  padding: 0;
}
</style>
