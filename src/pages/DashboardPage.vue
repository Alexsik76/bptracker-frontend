<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useMeasurementStore } from '../stores/measurements';
import { useApi } from '../composables/useApi';
import { useRouter } from 'vue-router';
import MeasurementList from '../components/MeasurementList.vue';
import BpChart from '../components/BpChart.vue';
import { classifyBP, BP_CLASS_COLOR, BP_CLASS_LABEL } from '../utils/bp';

const auth = useAuthStore();
const measurements = useMeasurementStore();
const api = useApi();
const router = useRouter();

const isExporting = ref(false);
const period = ref<7 | 30 | 90 | 365>(30);

const periods = [
  { label: '7д', value: 7 },
  { label: '30д', value: 30 },
  { label: '3м', value: 90 },
  { label: 'Рік', value: 365 },
] as const;

onMounted(() => {
  measurements.fetchMeasurements();
});

const userInitials = computed(() => (auth.user?.email ?? '?').charAt(0).toUpperCase());

const filteredForChart = computed(() => {
  const cutoff = Date.now() - period.value * 86400000;
  return measurements.items.filter(m => new Date(m.recordedAt).getTime() >= cutoff);
});

const kpi = computed(() => {
  const all = [...measurements.items].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  );
  if (!all.length) return null;

  const now = Date.now();
  const week = 7 * 86400000;
  const last7 = all.filter(m => now - new Date(m.recordedAt).getTime() < week);
  const prev7 = all.filter(m => {
    const age = now - new Date(m.recordedAt).getTime();
    return age >= week && age < 2 * week;
  });

  const avgNum = (arr: number[]) =>
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

  const curSys = avgNum(last7.map(m => m.sys));
  const prevSys = avgNum(prev7.map(m => m.sys));
  const last = all[0];

  return {
    last,
    lastClass: classifyBP(last.sys, last.dia),
    avgSys: curSys,
    avgDia: avgNum(last7.map(m => m.dia)),
    avgPulse: avgNum(last7.map(m => m.pulse)),
    trend: curSys !== null && prevSys !== null ? curSys - prevSys : null,
  };
});

const trendIcon = computed(() => {
  const t = kpi.value?.trend;
  if (t == null) return '—';
  if (t > 0) return '↑';
  if (t < 0) return '↓';
  return '→';
});

const trendColor = computed(() => {
  const t = kpi.value?.trend;
  if (t == null || t === 0) return 'var(--color-text-muted)';
  return t > 0 ? 'var(--color-danger)' : 'var(--color-success)';
});

async function handleExport() {
  if (confirm('Надіслати CSV з усіма вимірюваннями на ваш email?')) {
    isExporting.value = true;
    try {
      await api.exportCsv();
      alert('Експорт надіслано на ваш email!');
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

    <main class="main-content">

      <!-- KPI cards -->
      <div v-if="kpi" class="kpi-grid">
        <div class="kpi-card" :style="{ borderTopColor: BP_CLASS_COLOR[kpi.lastClass] }">
          <div class="kpi-label">Останній замір</div>
          <div class="kpi-value" :style="{ color: BP_CLASS_COLOR[kpi.lastClass] }">
            {{ kpi.last.sys }}<span class="kpi-sep">/</span>{{ kpi.last.dia }}
          </div>
          <div class="kpi-sub">{{ BP_CLASS_LABEL[kpi.lastClass] }}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Середній тиск (7 дн)</div>
          <div class="kpi-value">
            {{ kpi.avgSys ?? '—' }}<span class="kpi-sep">/</span>{{ kpi.avgDia ?? '—' }}
          </div>
          <div class="kpi-sub">мм рт.ст.</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Пульс (7 дн)</div>
          <div class="kpi-value">{{ kpi.avgPulse ?? '—' }}</div>
          <div class="kpi-sub">уд/хв</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Тренд (СИС)</div>
          <div class="kpi-value trend-val" :style="{ color: trendColor }">
            {{ trendIcon }}
            <template v-if="kpi.trend !== null && kpi.trend !== 0">
              {{ kpi.trend > 0 ? '+' : '' }}{{ kpi.trend }}
            </template>
          </div>
          <div class="kpi-sub">відносно минулого тижня</div>
        </div>
      </div>

      <!-- Main content grid: chart | history -->
      <div class="content-grid">

        <!-- Chart panel -->
        <div class="panel">
          <div class="panel-head">
            <h2>Динаміка</h2>
            <div class="period-tabs">
              <button
                v-for="p in periods"
                :key="p.value"
                :class="['period-btn', { active: period === p.value }]"
                @click="period = p.value"
              >{{ p.label }}</button>
            </div>
          </div>
          <div v-if="filteredForChart.length === 0" class="chart-empty">
            Немає даних за вибраний період
          </div>
          <BpChart v-else :data="filteredForChart" />
        </div>

        <!-- History panel -->
        <div class="panel">
          <div class="panel-head">
            <h2>Історія</h2>
          </div>

          <!-- Empty state -->
          <div v-if="!measurements.loading && measurements.items.length === 0" class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            <p>Ще немає жодного вимірювання</p>
            <button @click="router.push({ name: 'measurement-new' })" class="btn-primary-sm">
              Додати перший замір
            </button>
          </div>

          <MeasurementList
            v-else
            :items="measurements.items"
            :loading="measurements.loading"
            @delete="measurements.remove"
          />

          <div class="export-row">
            <button @click="handleExport" :disabled="isExporting" class="btn-outline">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              {{ isExporting ? 'Надсилання...' : 'Отримати CSV на email' }}
            </button>
          </div>
        </div>

      </div>
    </main>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
}

/* ── Header ── */
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

/* ── Main ── */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* ── KPI cards ── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);

  @media (min-width: 640px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.kpi-card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
  border-top: 3px solid var(--color-border);

  & .kpi-label {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: var(--space-2);
  }

  & .kpi-value {
    font-size: var(--text-2xl);
    font-weight: 700;
    margin-bottom: var(--space-1);
    line-height: 1.1;
  }

  & .kpi-sep {
    font-weight: 400;
    opacity: 0.6;
    margin: 0 1px;
  }

  & .kpi-sub {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }
}

.trend-val {
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
}

/* ── Content grid (chart | history) ── */
.content-grid {
  display: grid;
  gap: var(--space-4);

  @media (min-width: 900px) {
    grid-template-columns: 3fr 2fr;
    align-items: start;
  }
}

.panel {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);

  & h2 {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.07em;
    font-weight: 600;
  }
}

/* ── Period tabs ── */
.period-tabs {
  display: flex;
  gap: 2px;
  background: var(--color-bg);
  padding: 3px;
  border-radius: var(--radius-md);
}

.period-btn {
  padding: var(--space-1) var(--space-3);
  border-radius: calc(var(--radius-md) - 2px);
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--color-text-muted);
  transition: all 0.15s;

  &.active {
    background: var(--color-surface);
    color: var(--color-text);
    box-shadow: var(--shadow-sm);
  }

  &:hover:not(.active) { color: var(--color-text); }
}

.chart-empty {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

/* ── Empty state ── */
.empty-state {
  padding: var(--space-8) var(--space-4);
  text-align: center;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);

  & svg {
    opacity: 0.3;
  }

  & p {
    font-size: var(--text-sm);
  }
}

.btn-primary-sm {
  background: var(--color-primary);
  color: white;
  padding: var(--space-2) var(--space-5);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  margin-top: var(--space-2);
}

/* ── Export ── */
.export-row {
  margin-top: var(--space-4);
  display: flex;
  justify-content: flex-end;
}

.btn-outline {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  & .icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
}
</style>
