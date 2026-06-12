<script setup lang="ts">
import MeasurementList from '../MeasurementList.vue';
import type { Measurement } from '../../types/api';

interface Props {
  measurements: Measurement[];
  loading: boolean;
  error?: string | null;
}
defineProps<Props>();

const emit = defineEmits<{ 'show-all': [] }>();
</script>

<template>
  <div class="panel">
    <div class="panel-head">
      <span class="panel-title">ОСТАННІ ВИМІРИ</span>
      <button class="show-all-btn" @click="emit('show-all')">
        Всі <span class="chevron">›</span>
      </button>
    </div>

    <div v-if="error" class="error-banner" role="alert">
      {{ $t('errors.loadMeasurements') }}
    </div>

    <div v-else-if="!loading && measurements.length === 0" class="empty-state">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        opacity="0.3"
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
      <p>{{ $t('dashboard.noMeasurements') }}</p>
    </div>

    <MeasurementList
      v-else
      :items="measurements"
      :loading="loading"
      :show-delete="false"
    />
  </div>
</template>

<style scoped>
.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 14px 16px;
  box-shadow: var(--shadow-card);
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.panel-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
}

.show-all-btn {
  font-size: 13px;
  font-weight: 600;
  color: var(--rx-accent2, #b9b4f3);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 2px;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.75;
  }
}

.chevron {
  font-size: 15px;
  line-height: 1;
}

.error-banner {
  padding: 10px;
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
  border-radius: 10px;
  font-size: 13px;
  margin: 8px 0;
}

.empty-state {
  padding: 24px 0;
  text-align: center;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
</style>
