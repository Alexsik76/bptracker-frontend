<script setup lang="ts">
import { useRouter } from 'vue-router';
import MeasurementList from '../MeasurementList.vue';
import type { Measurement } from '../../types/api';

interface Props {
  measurements: Measurement[];
  loading: boolean;
  error?: string | null;
}
defineProps<Props>();

const router = useRouter();
</script>

<template>
  <div class="panel">
    <div class="panel-head">
      <span class="panel-title">Історія</span>
      <button class="show-all-btn" @click="router.push({ name: 'history' })">Всі →</button>
    </div>

    <div v-if="error" class="error-banner" role="alert">
      Не вдалося завантажити виміри
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
      <p>Ще немає жодного вимірювання</p>
    </div>

    <MeasurementList
      v-else
      :items="measurements"
      :loading="loading"
      :show-delete="false"
    />

    <button class="see-all-row" @click="router.push({ name: 'history' })">
      Переглянути всю історію →
    </button>
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
  margin-bottom: 2px;
}

.panel-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
}

.show-all-btn {
  font-size: 11px;
  font-weight: 500;
  color: #818cf8;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;

  &:hover {
    opacity: 0.75;
  }
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

.see-all-row {
  display: block;
  width: 100%;
  margin-top: 12px;
  padding: 10px;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  color: #818cf8;
  border: 1px solid rgba(129, 140, 248, 0.25);
  border-radius: 10px;
  background: rgba(129, 140, 248, 0.05);
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: rgba(129, 140, 248, 0.1);
  }
}
</style>
