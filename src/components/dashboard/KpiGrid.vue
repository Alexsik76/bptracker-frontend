<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import KpiCard from './KpiCard.vue';
import { useKpi } from '../../composables/useKpi';
import { useBpLabels } from '../../composables/useBpLabels';
import { getZone } from '../../composables/useZone';
import type { Measurement } from '../../types/api';

const props = defineProps<{ measurements: Measurement[] }>();
const { t } = useI18n();

const kpi = useKpi(() => props.measurements);
const bpLabels = useBpLabels();

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
  if (!k || k.avgSys === null) return t('dashboard.kpi.noData');
  return bpLabels.value[getZone(k.avgSys!, k.avgDia!).key];
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
  return k.deltaSys > 0 ? 'var(--color-danger)' : 'var(--color-success)';
});

const normalValue = computed(() => {
  const k = kpi.value;
  if (!k || k.totalLast7 === 0) return '—';
  return `${k.normalCount}/${k.totalLast7}`;
});

const normalSub = computed(() => {
  const k = kpi.value;
  if (!k || k.totalLast7 === 0) return t('dashboard.kpi.noData');
  return t('dashboard.kpi.inRangePercent', { n: Math.round((k.normalShare ?? 0) * 100) });
});
</script>

<template>
  <div v-if="kpi" class="stat-grid">
    <KpiCard
      :label="$t('dashboard.kpi.avgWeek')"
      :value="avgValue"
      :sub="avgSub"
      :accent="avgZoneColor"
    />
    <KpiCard
      :label="$t('dashboard.kpi.weekChange')"
      :value="deltaValue"
      :sub="$t('dashboard.kpi.vsLastWeek')"
      :accent="deltaAccent"
    />
    <KpiCard
      :label="$t('dashboard.kpi.inRange')"
      :value="normalValue"
      :sub="normalSub"
    />
    <KpiCard
      :label="$t('dashboard.kpi.avgPulse')"
      :value="kpi.avgPulse !== null ? String(kpi.avgPulse) : '—'"
      :sub="$t('dashboard.kpi.bpmWeek')"
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
