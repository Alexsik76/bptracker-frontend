<script setup lang="ts">
import { ref, computed } from 'vue';
import { useMeasurementStore } from '../../stores/measurements';
import { useExport } from '../../composables/useExport';
import MeasurementList from '../MeasurementList.vue';

const measurements = useMeasurementStore();
const { isExporting, handleExport } = useExport();

type Period = 'week' | 'month' | 'all';
const period = ref<Period>('all');

const periods: { label: string; value: Period }[] = [
  { label: 'Тиждень', value: 'week' },
  { label: 'Місяць', value: 'month' },
  { label: 'Весь час', value: 'all' },
];

const filtered = computed(() => {
  if (period.value === 'all') return measurements.items;
  const days = period.value === 'week' ? 7 : 30;
  const cutoff = Date.now() - days * 86400000;
  return measurements.items.filter(
    (m) => new Date(m.recordedAt).getTime() >= cutoff,
  );
});
</script>

<template>
  <div class="history-tab">
    <!-- Period filter -->
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

    <!-- Count -->
    <div class="count-row">
      <span class="count-text">
        {{ filtered.length }} {{ filtered.length === 1 ? 'запис' : filtered.length < 5 ? 'записи' : 'записів' }}
      </span>
    </div>

    <!-- Scrollable list -->
    <div class="list-scroll">
      <div class="list-pad">
        <div v-if="measurements.loading && filtered.length === 0" class="state-center">
          <span class="state-text">Завантаження...</span>
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
          <span class="state-text">Немає записів за цей період</span>
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

    <!-- Export footer -->
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
        {{ isExporting ? 'Надсилання...' : 'Отримати CSV на email' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.history-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.filter-bar {
  display: flex;
  gap: 6px;
  padding: 12px 16px 8px;
  flex-shrink: 0;
}

.filter-btn {
  flex: 1;
  padding: 8px 4px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.15s;

  &.active {
    background: rgba(129, 140, 248, 0.12);
    border-color: rgba(129, 140, 248, 0.4);
    color: #818cf8;
    font-weight: 600;
  }

  &:hover:not(.active) {
    background: var(--color-surface);
    color: var(--color-text);
  }
}

.count-row {
  padding: 0 16px 6px;
  flex-shrink: 0;
}

.count-text {
  font-size: 11px;
  color: var(--color-text-muted);
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
  padding: 12px 16px;
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
