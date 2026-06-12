<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useMeasurementStore } from '../stores/measurements';
import { useSchemaStore } from '../stores/schemas';
import { useKpi } from '../composables/useKpi';
import ScanShade from '../components/dashboard/ScanShade.vue';
import HeroCard from '../components/dashboard/HeroCard.vue';
import KpiGrid from '../components/dashboard/KpiGrid.vue';
import ChartPanel from '../components/dashboard/ChartPanel.vue';
import HistoryPanel from '../components/dashboard/HistoryPanel.vue';
import HistoryTab from '../components/dashboard/HistoryTab.vue';
import { preloadOcrModels } from '../composables/useLocalOcr';
import type { TreatmentSchema } from '../types/api';

const router = useRouter();
const route = useRoute();
const measurements = useMeasurementStore();
const schemaStore = useSchemaStore();
const controller = new AbortController();
const currentTab = computed(() => route.query.tab === 'history' ? 1 : 0);

const kpi = useKpi(() => measurements.items);



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

// ── Scan shade state ──────────────────────────────────────────────────────────

const COLLAPSED_H = 64;
const EXPANDED_PCT = 0.70;

const shadeProgress = ref(1);
const screenH = ref(window.innerHeight);
const expandedH = computed(() => Math.round(screenH.value * EXPANDED_PCT));
const shadeH = computed(() =>
  Math.round(COLLAPSED_H + (expandedH.value - COLLAPSED_H) * shadeProgress.value)
);

function onResize() {
  screenH.value = window.innerHeight;
}

onMounted(() => {
  measurements.fetchMeasurements(controller.signal);
  schemaStore.fetchSchemas(controller.signal);
  window.addEventListener('resize', onResize, { passive: true });
  preloadOcrModels();
});

onUnmounted(() => {
  controller.abort();
  window.removeEventListener('resize', onResize);
});

function fmtShort(iso: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`;
}

function countMeds(schema: TreatmentSchema): number {
  if (!schema.scheduleDocument) return 0;
  return Object.values(schema.scheduleDocument).reduce((n, arr) => n + arr.length, 0);
}

function pluralMeds(n: number): string {
  const t = n % 10, h = n % 100;
  if (t === 1 && h !== 11) return 'препарат';
  if (t >= 2 && t <= 4 && (h < 12 || h > 14)) return 'препарати';
  return 'препаратів';
}

function activePeriods(schema: TreatmentSchema): string[] {
  if (!schema.scheduleDocument) return [];
  const order = ['Morning', 'Day', 'Evening', 'Night', 'Afternoon'];
  return order.filter((k) => schema.scheduleDocument![k]?.length);
}

const PERIOD_ICONS: Record<string, string> = {
  Morning: 'morning', Day: 'day', Afternoon: 'day', Evening: 'evening', Night: 'evening',
};
</script>

<template>
  <div class="dashboard-layout">

    <!-- Frosted-glass scan shade (fixed overlay) -->
    <ScanShade
      v-model="shadeProgress"
      :expanded-height="expandedH"
      :shade-height="shadeH"
      @scan="router.push({ name: 'measurement-local' })"
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
            @show-all="router.push({ name: 'dashboard', query: { tab: 'history' } })"
          />
          <div v-if="schemaStore.active" class="section-label-active">
            <span>Активне призначення</span>
          </div>
        </div>
      </template>

      <!-- Tab: Історія -->
      <template v-else-if="currentTab === 1">
        <HistoryTab />
      </template>
    </main>

    <!-- Pinned active schema at bottom (outside scroll area) -->
    <div
      v-if="schemaStore.active && currentTab === 0"
      class="dash-pinned"
      @click="router.push(`/meds/${schemaStore.active.id}`)"
    >
      <div class="dp-left">
        <div class="dp-doctor">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="7.5" r="3.5"/><path d="M5 20.5a7 7 0 0 1 14 0"/><path d="M12 11v2"/><path d="M10.5 12.5h3"/>
          </svg>
          {{ schemaStore.active.doctor || '—' }}
        </div>
        <div class="dp-meta">
          {{ fmtShort(schemaStore.active.prescribedOn) }} · {{ countMeds(schemaStore.active) }} {{ pluralMeds(countMeds(schemaStore.active)) }}
        </div>
      </div>
      <div class="dp-chips">
        <span v-for="k in activePeriods(schemaStore.active)" :key="k" class="chip">
          <svg v-if="PERIOD_ICONS[k] === 'morning'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 18a5 5 0 0 0-10 0"/><line x1="2" y1="18" x2="22" y2="18"/>
            <line x1="12" y1="3" x2="12" y2="6"/><polyline points="9 9 12 6 15 9"/>
          </svg>
          <svg v-else-if="PERIOD_ICONS[k] === 'day'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4.2"/>
            <line x1="12" y1="2.5" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="21.5"/>
            <line x1="2.5" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="21.5" y2="12"/>
          </svg>
          <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>
          </svg>
          {{ schemaStore.active.scheduleDocument?.[k]?.length }}
        </span>
      </div>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color: var(--rx-dim);">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </div>

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
  padding-top: 64px; /* always reserve space for collapsed shade */

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

.section-label-active {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--color-text-muted);
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 12px 4px 9px;
  margin-top: 4px;
}

.dash-pinned {
  flex: none;
  margin: 0 16px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  background: linear-gradient(180deg, rgba(141, 140, 245, 0.10), transparent), var(--rx-card);
  border: 1.5px solid var(--rx-accent-bd);
  border-radius: 16px;
  padding: 14px;
  box-shadow: 0 0 0 4px var(--rx-accent-glow);
  color: var(--rx-dim);
}

.dp-left {
  flex: 1;
  min-width: 0;
}

.dp-doctor {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  font-size: 15px;
  color: var(--rx-text);
  
  & svg {
    color: var(--rx-accent2);
    flex: none;
  }
}

.dp-meta {
  color: var(--rx-dim);
  font-size: 12.5px;
  font-weight: 600;
  margin-top: 4px;
  padding-left: 24px;
}

.dp-chips {
  display: flex;
  gap: 6px;
  flex: none;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--rx-accent-bg);
  color: var(--rx-accent2);
  border-radius: 9px;
  padding: 5px 8px;
  font-size: 13px;
  font-weight: 800;
  
  & svg {
    width: 15px;
    height: 15px;
  }
}
</style>
