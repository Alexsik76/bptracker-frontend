<script setup lang="ts">
import { ref, computed } from 'vue';
import PeriodTabs from './PeriodTabs.vue';
import BpChart from '../BpChart.vue';
import type { Measurement } from '../../types/api';

const props = defineProps<{
  measurements: Measurement[];
}>();

const period = ref<7 | 30 | 90 | 365>(30);

const filtered = computed(() => {
  const cutoff = Date.now() - period.value * 86400000;
  return props.measurements.filter((m) => new Date(m.recordedAt).getTime() >= cutoff);
});
</script>

<template>
  <div class="panel">
    <div class="panel-head">
      <span class="panel-title">Динаміка</span>
      <PeriodTabs v-model="period" />
    </div>
    <div class="legend">
      <div class="legend-item">
        <div class="legend-line" style="background: #818cf8" />
        <span>СИС</span>
      </div>
      <div class="legend-item">
        <div class="legend-line" style="background: #60a5fa" />
        <span>ДІА</span>
      </div>
      <div class="legend-item">
        <div class="legend-line dashed" style="background: #34d399" />
        <span>Пульс</span>
      </div>
    </div>
    <div v-if="filtered.length === 0" class="chart-empty">Немає даних за вибраний період</div>
    <BpChart v-else :data="filtered" />
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
  margin-bottom: 12px;
}

.panel-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
}

.legend {
  display: flex;
  gap: 14px;
  margin-bottom: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: var(--color-text-muted);
}

.legend-line {
  width: 18px;
  height: 2.5px;
  border-radius: 2px;
}

.legend-line.dashed {
  background: repeating-linear-gradient(
    90deg,
    #34d399 0px,
    #34d399 4px,
    transparent 4px,
    transparent 7px
  ) !important;
}

.chart-empty {
  height: 130px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-size: 13px;
}
</style>
