<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMeasurementStore } from '../stores/measurements'
import { useApi } from '../composables/useApi'
import DashboardHeader from '../components/dashboard/DashboardHeader.vue'
import KpiGrid from '../components/dashboard/KpiGrid.vue'
import ChartPanel from '../components/dashboard/ChartPanel.vue'
import HistoryPanel from '../components/dashboard/HistoryPanel.vue'
import SchemaCard from '../components/SchemaCard.vue'
import type { TreatmentSchema } from '../types/api'

const measurements = useMeasurementStore()
const api = useApi()
const schema = ref<TreatmentSchema | null>(null)

onMounted(() => {
  measurements.fetchMeasurements()
  api.getActiveSchema().then(s => { schema.value = s })
})
</script>

<template>
  <div class="dashboard">
    <DashboardHeader />
    <main class="main-content">
      <KpiGrid :measurements="measurements.items" />
      <div class="content-grid">
        <ChartPanel :measurements="measurements.items" />
        <HistoryPanel
          :measurements="measurements.items"
          :loading="measurements.loading"
          @delete="measurements.remove"
        />
      </div>
      <SchemaCard v-if="schema" :schema="schema" />
    </main>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.content-grid {
  display: grid;
  gap: var(--space-4);

  @media (min-width: 900px) {
    grid-template-columns: 3fr 2fr;
    align-items: start;
  }
}
</style>
