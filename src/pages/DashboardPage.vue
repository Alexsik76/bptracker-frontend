<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';
import { useMeasurementStore } from '../stores/measurements';
import { useSchemaStore } from '../stores/schemas';
import { useKpi } from '../composables/useKpi';
import { getZone, DEFAULT_ZONE } from '../composables/useZone';
import ScanShade from '../components/dashboard/ScanShade.vue';
import HeroCard from '../components/dashboard/HeroCard.vue';
import KpiGrid from '../components/dashboard/KpiGrid.vue';
import ChartPanel from '../components/dashboard/ChartPanel.vue';
import HistoryPanel from '../components/dashboard/HistoryPanel.vue';
import HistoryTab from '../components/dashboard/HistoryTab.vue';
import BottomTabBar from '../components/dashboard/BottomTabBar.vue';
import SchemaCard from '../components/SchemaCard.vue';
import SchemaList from '../components/SchemaList.vue';
import SchemaForm from '../components/SchemaForm.vue';
import { preloadOcrModels } from '../composables/useLocalOcr';
import type { TreatmentSchema } from '../types/api';

const router = useRouter();
const measurements = useMeasurementStore();
const schemaStore = useSchemaStore();
const controller = new AbortController();
const currentTab = ref(0);
const formDialogRef = useTemplateRef<HTMLDialogElement>('formDialog');
const editingSchema = ref<TreatmentSchema | undefined>(undefined);

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

function openCreateForm() {
  editingSchema.value = undefined;
  formDialogRef.value?.showModal();
}

function openEditForm(schema: TreatmentSchema) {
  editingSchema.value = schema;
  formDialogRef.value?.showModal();
}

function closeForm() {
  formDialogRef.value?.close();
}
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
            @show-all="currentTab = 1"
          />
          <SchemaCard v-if="schemaStore.active" :schema="schemaStore.active" />
        </div>
      </template>

      <!-- Tab: Історія -->
      <template v-else-if="currentTab === 1">
        <HistoryTab />
      </template>

      <!-- Tab: Ліки -->
      <template v-else-if="currentTab === 2">
        <div class="content-pad">
          <div class="meds-tab-header">
            <button class="btn-add-schema" @click="openCreateForm">+ {{ $t('schema.addSchema') }}</button>
          </div>
          <SchemaList :schemas="schemaStore.items" @edit="openEditForm" />
          <SchemaCard v-if="schemaStore.active" :schema="schemaStore.active" />
          <div v-else-if="!schemaStore.loading && !schemaStore.items.length" class="empty-tab">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
              <path d="M10.5 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v3" />
              <circle cx="18" cy="18" r="4" />
              <path d="M15.5 18H21" />
            </svg>
            <p>{{ $t('schema.notFound') }}</p>
          </div>
        </div>
      </template>
    </main>

    <BottomTabBar
      v-model="currentTab"
      :zone-color="currentZone.color"
      @profile="router.push({ name: 'settings' })"
    />

    <dialog ref="formDialog" class="form-dialog" @cancel.prevent="closeForm">
      <SchemaForm
        :schema="editingSchema"
        @saved="closeForm"
        @cancel="closeForm"
      />
    </dialog>
  </div>
</template>

<style scoped>
.dashboard-layout {
  display: flex;
  flex-direction: column;
  height: 100svh;
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

.meds-tab-header {
  display: flex;
  justify-content: flex-end;
}

.btn-add-schema {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  border: none;
  background: var(--color-primary);
  color: white;
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: var(--color-primary-hover);
  }
}

.form-dialog {
  border: none;
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
  background: var(--color-surface);
  color: var(--color-text);
  max-width: 520px;
  width: calc(100vw - var(--space-8));
  max-height: 90svh;
  overflow-y: auto;

  &::backdrop {
    background: rgba(0, 0, 0, 0.4);
  }
}
</style>
