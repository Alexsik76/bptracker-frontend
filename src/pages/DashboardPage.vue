<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useMeasurementStore } from '../stores/measurements';
import { useKpi } from '../composables/useKpi';
import HeroCard from '../components/dashboard/HeroCard.vue';
import KpiGrid from '../components/dashboard/KpiGrid.vue';
import ChartPanel from '../components/dashboard/ChartPanel.vue';
import HistoryPanel from '../components/dashboard/HistoryPanel.vue';

const router = useRouter();
const measurements = useMeasurementStore();
const controller = new AbortController();

const kpi = useKpi(() => measurements.items);

const sparkData = computed(() => {
  const sorted = [...measurements.items]
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    .slice(-7);
  return sorted.map((m) => m.sys);
});

// Limit recent measurements to exactly 2 latest entries for the preview card
const recentMeasurements = computed(() => {
  return [...measurements.items]
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
    .slice(0, 2);
});

onMounted(() => {
  measurements.fetchMeasurements(controller.signal);
});

onUnmounted(() => {
  controller.abort();
});
</script>

<template>
  <div class="dashboard-layout">
    <main class="scroll-content">
      <div class="content-pad">
        <!-- Top row: wordmark only — clean, no shutter -->
        <div class="wordmark-row">
          <span class="wordmark-wave">∿</span>
          <span class="wordmark-text">BP Tracker</span>
        </div>

        <HeroCard
          v-if="kpi"
          :last="kpi.last"
          :spark-data="sparkData"
        />
        <KpiGrid :measurements="measurements.items" />
        <ChartPanel :measurements="measurements.items" />
        <HistoryPanel
          :measurements="recentMeasurements"
          :loading="measurements.loading"
          :error="measurements.error"
          @show-all="router.push({ name: 'history' })"
        />
      </div>
    </main>
  </div>
</template>

<style scoped>
.dashboard-layout {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  background: var(--color-bg);
}

.scroll-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  overflow-anchor: none;
  -webkit-overflow-scrolling: touch;
  padding-top: 16px; /* clean top, only basic offset */
}

.content-pad {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 16px 16px;
  max-width: 600px;
  margin: 0 auto;
}

.wordmark-row {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding-left: 4px;
}

.wordmark-wave {
  color: var(--rx-accent-bd, #c9c5f8);
  font-size: 20px;
  font-weight: 700;
}

.wordmark-text {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text, #f2f4f7);
}

</style>
