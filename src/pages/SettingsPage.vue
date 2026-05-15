<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth';
import { useSettingsStore } from '../stores/settings';
import { useRouter } from 'vue-router';
import { useToast } from '../composables/useToast';
import { useConfirm } from '../composables/useConfirm';
import { useTheme, setTheme } from '../composables/useTheme';
import { useLocale } from '../composables/useLocale';
import { useApiErrorMessage } from '../composables/useApiErrorMessage';
import BpScaleInfo from '../components/settings/BpScaleInfo.vue';
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

const commit = __APP_COMMIT__
const buildDate = __APP_BUILD_DATE__

const form = reactive({
  geminiUrl: '',
  exportEmail: '',
  sheetsTemplateUrl: '',
});

const loading = ref(false);

onMounted(async () => {
  await settingsStore.fetchSettings();
  form.geminiUrl = settingsStore.settings.geminiUrl || '';
  form.exportEmail = settingsStore.settings.exportEmail || '';
  form.sheetsTemplateUrl = settingsStore.settings.sheetsTemplateUrl || '';
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
    <header class="header">
      <button class="back-btn" @click="router.back()">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
      </button>
      <h1>{{ $t('settings.title') }}</h1>
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

          <button type="submit" class="btn primary" :disabled="loading">
            {{ loading ? $t('settings.saving') : $t('settings.saveChanges') }}
          </button>
        </form>
      </section>

      <section class="card">
        <BpScaleInfo />
      </section>

      <p class="version">BP Tracker · build {{ commit }} · {{ buildDate }}</p>
    </main>
  </div>
</template>

<style scoped>
.header {
  padding: var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);

  & h1 {
    font-size: var(--text-base);
    font-weight: bold;
  }
}

.back-btn {
  color: var(--color-text-muted);
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
</style>
