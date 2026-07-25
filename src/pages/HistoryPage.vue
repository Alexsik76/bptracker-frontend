<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useMeasurementStore } from '../stores/measurements';
import { useExport } from '../composables/useExport';
import MeasurementList from '../components/MeasurementList.vue';

const router = useRouter();
const measurements = useMeasurementStore();
const { isExporting, handleExport } = useExport();
const { t } = useI18n();

type Period = 'week' | 'month' | 'all';
const period = ref<Period>('all');

const periods = computed(() => [
  { label: t('dashboard.filterWeek'), value: 'week' as Period },
  { label: t('dashboard.filterMonth'), value: 'month' as Period },
  { label: t('dashboard.filterAll'), value: 'all' as Period },
]);

const filtered = computed(() => {
  if (period.value === 'all') return measurements.items;
  const days = period.value === 'week' ? 7 : 30;
  const cutoff = Date.now() - days * 86400000;
  return measurements.items.filter(
    (m) => new Date(m.recordedAt).getTime() >= cutoff,
  );
});

function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push({ name: 'dashboard' });
  }
}
</script>

<template>
  <div class="history-page">
    <!-- Header with circular back button and records count -->
    <header class="back-header">
      <button class="back-btn" :aria-label="$t('common.back')" @click="goBack">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#e8eaee" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12.5 4 L6 10 L12.5 16"></path>
        </svg>
      </button>
      <h1 class="page-title">{{ $t('dashboard.tabs.history') }}</h1>
      <span class="count-badge">
        {{ $t('dashboard.records', { n: filtered.length }, filtered.length) }}
      </span>
    </header>

    <!-- Filter chips styled as violet bordered buttons when active -->
    <div class="filter-bar">
      <button
        v-for="p in periods"
        :key="p.value"
        :class="['filter-btn', { active: period === p.value }]"
        @click="period = p.value"
      >
        {{ p.label }}
      </button>
    </div>

    <!-- Scrollable list of measurements -->
    <div class="list-scroll">
      <div class="list-pad">
        <div v-if="measurements.loading && filtered.length === 0" class="state-center">
          <span class="state-text">{{ $t('common.loading') }}</span>
        </div>
        <div v-else-if="filtered.length === 0" class="state-center">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            opacity="0.3"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span class="state-text">{{ $t('dashboard.noRecords') }}</span>
        </div>
        <MeasurementList
          v-else
          :items="filtered"
          :loading="measurements.loading"
          :show-delete="true"
          @delete="measurements.remove"
        />
      </div>
    </div>

    <!-- CSV Export footer -->
    <div class="footer">
      <button
        class="export-btn"
        :disabled="isExporting || filtered.length === 0"
        @click="handleExport"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        {{ isExporting ? $t('dashboard.exporting') : $t('dashboard.exportCsv') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.history-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--color-bg);
}

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

.count-badge {
  font-size: 13px;
  color: #7d8694;
  margin-left: auto;
}

.filter-bar {
  display: flex;
  gap: 10px;
  padding: 12px 16px 8px;
  flex-shrink: 0;
}

.filter-btn {
  font-size: 14px;
  color: #c6cbd4;
  border: 1px solid #2a2f37;
  background: transparent;
  border-radius: 14px;
  padding: 9px 18px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover:not(.active) {
    background: var(--color-surface);
    color: var(--color-text);
  }

  &.active {
    border: 1.5px solid #5b55c7; /* accent-violet */
    background: #1b1d33;
    color: #aeb6ff;
    font-weight: 600;
  }
}

.list-scroll {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.list-pad {
  padding: 0 16px 8px;
  max-width: 600px;
  margin: 0 auto;
}

.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 0;
}

.state-text {
  font-size: 14px;
  color: var(--color-text-muted);
}

.footer {
  flex-shrink: 0;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--color-border);
  background: var(--color-surface-solid);
}

.export-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.15s;

  &:hover:not(:disabled) {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: rgba(129, 140, 248, 0.05);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}
</style>
