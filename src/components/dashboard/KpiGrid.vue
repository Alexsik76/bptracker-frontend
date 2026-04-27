<script setup lang="ts">
import { computed } from 'vue';
import KpiCard from './KpiCard.vue';
import { useKpi } from '../../composables/useKpi';
import { getZone } from '../../composables/useZone';
import type { Measurement } from '../../types/api';

const props = defineProps<{ measurements: Measurement[] }>();

const kpi = useKpi(() => props.measurements);

const avgZoneColor = computed(() => {
  const k = kpi.value;
  if (!k || k.avgSys === null || k.avgDia === null) return undefined;
  return getZone(k.avgSys, k.avgDia).color;
});

const avgValue = computed(() => {
  const k = kpi.value;
  if (!k || k.avgSys === null) return '—';
  return `${k.avgSys}/${k.avgDia ?? '—'}`;
});

const avgSub = computed(() => {
  const k = kpi.value;
  if (!k || k.avgSys === null) return 'немає даних';
  return getZone(k.avgSys!, k.avgDia!).label;
});

const deltaValue = computed(() => {
  const k = kpi.value;
  if (!k || k.deltaSys === null) return '—';
  const fmt = (n: number) => (n > 0 ? `+${n}` : `${n}`);
  return `${fmt(k.deltaSys)}/${k.deltaDia !== null ? fmt(k.deltaDia) : '—'}`;
});

const deltaAccent = computed(() => {
  const k = kpi.value;
  if (!k || k.deltaSys === null || k.deltaSys === 0) return undefined;
  return k.deltaSys > 0 ? '#ef4444' : '#22c55e';
});

const normalValue = computed(() => {
  const k = kpi.value;
  if (!k || k.totalLast7 === 0) return '—';
  return `${k.normalCount}/${k.totalLast7}`;
});

const normalSub = computed(() => {
  const k = kpi.value;
  if (!k || k.totalLast7 === 0) return 'немає даних';
  return `${Math.round((k.normalShare ?? 0) * 100)}% у нормі`;
});
</script>

<template>
  <div v-if="kpi" class="stat-grid">
    <KpiCard
      label="Серед. за 7 днів"
      :value="avgValue"
      :sub="avgSub"
      :accent="avgZoneColor"
    />
    <KpiCard
      label="Зміна за тиждень"
      :value="deltaValue"
      sub="↑↓ vs минулий тиждень"
      :accent="deltaAccent"
    />
    <KpiCard
      label="У нормі (7д)"
      :value="normalValue"
      :sub="normalSub"
    />
    <KpiCard
      label="Пульс сер."
      :value="kpi.avgPulse !== null ? String(kpi.avgPulse) : '—'"
      sub="уд/хв · 7 днів"
      accent="#34d399"
    />
  </div>
</template>

<style scoped>
.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
</style>
