<script setup lang="ts">
import { computed } from 'vue'
import KpiCard from './KpiCard.vue'
import { useKpi } from '../../composables/useKpi'
import { BP_CLASS_COLOR, BP_CLASS_LABEL } from '../../utils/bp'
import type { Measurement } from '../../types/api'

interface Props {
  measurements: Measurement[]
}
const props = defineProps<Props>()

const kpi = useKpi(() => props.measurements)

function fmtDelta(n: number | null): string {
  if (n === null) return '—'
  return n > 0 ? `+${n}` : `${n}`
}

const normalValue = computed(() => {
  const k = kpi.value
  if (!k || k.totalLast7 === 0) return '—'
  return `${k.normalCount}/${k.totalLast7}`
})

const normalSub = computed(() => {
  const k = kpi.value
  if (!k || k.totalLast7 === 0) return 'немає даних'
  return `${Math.round((k.normalShare ?? 0) * 100)}% у зеленій зоні`
})

const normalAccent = computed(() => {
  const k = kpi.value
  if (!k || k.totalLast7 === 0 || (k.normalShare ?? 0) < 0.5) return 'var(--color-warning)'
  return 'var(--color-success)'
})

const deltaValue = computed(() => {
  const k = kpi.value
  if (!k || k.deltaSys === null) return '—'
  return `${k.deltaIcon} ${fmtDelta(k.deltaSys)} / ${fmtDelta(k.deltaDia)}`
})

const deltaSub = computed(() => {
  const k = kpi.value
  if (!k || k.deltaSys === null) return 'замало даних'
  return 'мм рт.ст. vs попередній тиждень'
})
</script>

<template>
  <div v-if="kpi" class="kpi-grid">
    <KpiCard
      label="Останній замір"
      :value="`${kpi.last.sys}/${kpi.last.dia}`"
      :sub="BP_CLASS_LABEL[kpi.lastClass]"
      :accentColor="BP_CLASS_COLOR[kpi.lastClass]"
      :valueColor="BP_CLASS_COLOR[kpi.lastClass]"
    >
      {{ kpi.last.sys }}<span class="kpi-sep">/</span>{{ kpi.last.dia }}
    </KpiCard>

    <KpiCard
      label="Середній тиск (7 дн)"
      :value="`${kpi.avgSys ?? '—'}/${kpi.avgDia ?? '—'}`"
      sub="мм рт.ст."
    >
      {{ kpi.avgSys ?? '—' }}<span class="kpi-sep">/</span>{{ kpi.avgDia ?? '—' }}
    </KpiCard>

    <KpiCard
      label="У нормі (7 дн)"
      :value="normalValue"
      :sub="normalSub"
      :accentColor="normalAccent"
    />

    <KpiCard
      label="Зміна за тиждень"
      :value="deltaValue"
      :sub="deltaSub"
      :valueColor="kpi.deltaColor"
    />
  </div>
</template>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);

  @media (min-width: 640px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.kpi-sep {
  font-weight: 400;
  opacity: 0.6;
  margin: 0 1px;
}
</style>
