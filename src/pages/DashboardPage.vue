<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useMeasurementStore } from '../stores/measurements';
import { useApi } from '../composables/useApi';
import { useRouter } from 'vue-router';
import MeasurementList from '../components/MeasurementList.vue';
import BpChart from '../components/BpChart.vue';

const auth = useAuthStore();
const measurements = useMeasurementStore();
const api = useApi();
const router = useRouter();

const isExporting = ref(false);

onMounted(() => {
  measurements.fetchMeasurements();
});

function handleLogout() {
  if (confirm('Вийти з акаунту?')) {
    auth.logout();
    router.push({ name: 'login' });
  }
}

async function handleExport() {
  if (confirm('Надіслати CSV з усіма вимірюваннями на ваш email?')) {
    isExporting.value = true;
    try {
      await api.exportCsv();
      alert('Експорт успішно надіслано на ваш email!');
    } catch (err: any) {
      alert(err.message || 'Помилка при експорті. Перевірте налаштування email.');
    } finally {
      isExporting.value = false;
    }
  }
}
</script>

<template>
  <div class="dashboard">
    <header class="header">
      <div class="header-content">
        <h1>BP Tracker</h1>
        <div class="header-actions">
          <button @click="handleLogout" class="user-btn">
            <span class="user-email">{{ auth.user?.email }}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
          <button @click="router.push({ name: 'settings' })" class="settings-btn" title="Налаштування">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
          <button @click="router.push({ name: 'measurement-new' })" class="add-btn">
            + Додати
          </button>
        </div>
      </div>
    </header>

    <main class="main-content">
      <section class="chart-section">
        <BpChart :data="measurements.items" />
      </section>

      <section class="history-section">
        <div class="section-header">
          <h2>Історія вимірювань</h2>
        </div>
        <MeasurementList 
          :items="measurements.items" 
          :loading="measurements.loading"
          @delete="measurements.remove"
        />
        
        <div class="actions-row">
          <button @click="handleExport" :disabled="isExporting" class="export-btn">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            <span>{{ isExporting ? 'Надсилання...' : 'Надіслати CSV на email' }}</span>
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
}

.header {
  background-color: var(--color-primary);
  color: white;
  padding: var(--space-4);
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: var(--shadow-sm);
}

.header-content {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;

  & h1 {
    font-size: var(--text-lg);
    font-weight: bold;
    font-style: italic;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.user-btn {
  color: white;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  opacity: 0.9;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }

  & .user-email {
    font-size: var(--text-sm);
    display: none;
    @media (min-width: 640px) {
      display: inline;
    }
  }
}

.add-btn {
  background: white;
  color: var(--color-primary);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: bold;
  transition: transform 0.1s;

  &:active {
    transform: scale(0.95);
  }
}

.main-content {
  max-width: 1000px;
  margin: 0 auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.chart-section, .history-section {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
}

.section-header {
  margin-bottom: var(--space-4);
  & h2 {
    font-size: var(--text-base);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.actions-row {
  margin-top: var(--space-4);
  display: flex;
  justify-content: flex-start;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background-color: var(--color-primary);
  color: white;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  transition: background-color 0.2s, opacity 0.2s;

  &:hover:not(:disabled) {
    background-color: var(--color-primary-hover);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  & .icon {
    width: 1rem;
    height: 1rem;
  }
}
</style>
