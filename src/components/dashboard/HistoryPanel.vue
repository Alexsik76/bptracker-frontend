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
  <div class="panel" @click="emit('show-all')">
    <div class="panel-main">
      <div class="panel-head">
        <span class="panel-title">ОСТАННІ ВИМІРИ</span>
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
    <span class="arrow-icon">›</span>
  </div>
</template>

<style scoped>
.panel {
  background: #14162a;
  border: 1.5px solid #5b55c7;
  border-radius: 20px;
  padding: 14px 16px;
  box-shadow: 0 0 24px rgba(91, 85, 199, 0.18);
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: transform 0.1s;

  &:active {
    transform: scale(0.98);
  }
}

.panel-main {
  flex: 1;
  min-width: 0;
}

.panel-head {
  display: flex;
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

.arrow-icon {
  font-size: 22px;
  color: #6f6acb;
  flex-shrink: 0;
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
