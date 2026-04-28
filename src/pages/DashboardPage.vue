<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useMeasurementStore } from '../stores/measurements';
import { useApi } from '../composables/useApi';
import { useKpi } from '../composables/useKpi';
import { getZone, DEFAULT_ZONE } from '../composables/useZone';
import DashboardHeader from '../components/dashboard/DashboardHeader.vue';
import HeroCard from '../components/dashboard/HeroCard.vue';
import KpiGrid from '../components/dashboard/KpiGrid.vue';
import ChartPanel from '../components/dashboard/ChartPanel.vue';
import HistoryPanel from '../components/dashboard/HistoryPanel.vue';
import HistoryTab from '../components/dashboard/HistoryTab.vue';
import BottomTabBar from '../components/dashboard/BottomTabBar.vue';
import SchemaCard from '../components/SchemaCard.vue';
import type { TreatmentSchema } from '../types/api';

const router = useRouter();
const measurements = useMeasurementStore();
const api = useApi();
const schema = ref<TreatmentSchema | null>(null);
const controller = new AbortController();
const currentTab = ref(0);

const kpi = useKpi(() => measurements.items);

const currentZone = computed(() => {
  if (!kpi.value) return DEFAULT_ZONE;
  return getZone(kpi.value.last.sys, kpi.value.last.dia);
});

const sparkData = computed(() => {
  const sorted = [...measurements.items]
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    .slice(-7);
  return sorted.map((m) => m.sys);
});

const recentMeasurements = computed(() => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const cutoff = now.getTime() - 86400000;
  return measurements.items.filter(
    (m) => new Date(m.recordedAt).getTime() >= cutoff,
  );
});

onMounted(() => {
  measurements.fetchMeasurements(controller.signal);
  api.getActiveSchema(controller.signal).then((s) => {
    schema.value = s;
  });
});

onUnmounted(() => {
  controller.abort();
});
</script>

<template>
  <div class="dashboard-layout">
    <DashboardHeader
      :zone-color="currentZone.color"
      @add="router.push({ name: 'measurement-new' })"
      @settings="router.push({ name: 'settings' })"
    />

    <main class="scroll-content" :class="{ 'tab-history': currentTab === 1 }">
      <!-- Tab: Дашборд -->
      <template v-if="currentTab === 0">
        <div class="content-pad">
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
            @show-all="currentTab = 1"
          />
          <SchemaCard v-if="schema" :schema="schema" />
        </div>
      </template>

      <!-- Tab: Історія -->
      <template v-else-if="currentTab === 1">
        <HistoryTab />
      </template>

      <!-- Tab: Ліки -->
      <template v-else-if="currentTab === 2">
        <div class="content-pad">
          <SchemaCard v-if="schema" :schema="schema" />
          <div v-else class="empty-tab">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
              <path d="M10.5 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v3" />
              <circle cx="18" cy="18" r="4" />
              <path d="M15.5 18H21" />
            </svg>
            <p>Схема лікування не знайдена</p>
          </div>
        </div>
      </template>
    </main>

    <BottomTabBar
      v-model="currentTab"
      :zone-color="currentZone.color"
      @profile="router.push({ name: 'settings' })"
    />
  </div>
</template>

<style scoped>
.dashboard-layout {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
  background: var(--color-bg);
}

.scroll-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;

  &.tab-history {
    overflow: hidden;
  }
}

.content-pad {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 16px 16px;
  max-width: 600px;
  margin: 0 auto;
}

.empty-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 48px 16px;
  color: var(--color-text-muted);
  font-size: 14px;
  text-align: center;
}
</style>
