<script setup lang="ts">
import { ref, computed } from 'vue';
import PeriodTabs from './PeriodTabs.vue';
import BpChart from '../BpChart.vue';
import type { Measurement } from '../../types/api';

interface Props {
  measurements: Measurement[];
}
const props = defineProps<Props>();

const period = ref<7 | 30 | 90 | 365>(30);

const filtered = computed(() => {
  const cutoff = Date.now() - period.value * 86400000;
  return props.measurements.filter((m) => new Date(m.recordedAt).getTime() >= cutoff);
});
</script>

<template>
  <div class="panel">
    <div class="panel-head">
      <h2>Динаміка</h2>
      <PeriodTabs v-model="period" />
    </div>
    <div v-if="filtered.length === 0" class="chart-empty">Немає даних за вибраний період</div>
    <BpChart v-else :data="filtered" />
  </div>
</template>

<style scoped>
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

.chart-empty {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}
</style>
