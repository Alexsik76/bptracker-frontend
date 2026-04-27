<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useSettingsStore } from '../stores/settings';
import { useRouter } from 'vue-router';
import { useToast } from '../composables/useToast';
import { useConfirm } from '../composables/useConfirm';

const auth = useAuthStore();
const settingsStore = useSettingsStore();
const router = useRouter();
const toast = useToast();
const { confirm } = useConfirm();

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
    toast.success('Налаштування збережено!');
  } catch {
    toast.error('Помилка при збереженні');
  } finally {
    loading.value = false;
  }
}

async function handleLogout() {
  const ok = await confirm('Вийти з акаунту?', { confirmText: 'Вийти', cancelText: 'Скасувати' });
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
      <h1>Налаштування</h1>
    </header>

    <main class="content">
      <section class="user-info card">
        <h2>Акаунт</h2>
        <p class="email">{{ auth.user?.email }}</p>
        <button class="btn-link danger" @click="handleLogout">Вийти з системи</button>
      </section>

      <section class="settings-form card">
        <h2>Параметри</h2>
        <form @submit.prevent="save">
          <div class="field">
            <label>
              Email для експорту CSV
              <input v-model="form.exportEmail" type="email" placeholder="email@example.com" />
            </label>
          </div>

          <div class="field">
            <label>
              Gemini API URL (custom)
              <input v-model="form.geminiUrl" type="url" placeholder="https://..." />
            </label>
          </div>

          <div class="field">
            <label>
              Шаблон Google Sheets для імпорту CSV
              <input
                v-model="form.sheetsTemplateUrl"
                type="url"
                placeholder="https://docs.google.com/spreadsheets/..."
              />
            </label>
          </div>

          <button type="submit" class="btn primary" :disabled="loading">
            {{ loading ? 'Збереження...' : 'Зберегти зміни' }}
          </button>
        </form>
      </section>

      <p class="version">BP Tracker v2.0.0 (Vue SPA)</p>
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
</style>
