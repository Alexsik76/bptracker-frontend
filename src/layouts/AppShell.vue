<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useMeasurementStore } from '../stores/measurements';
import { useKpi } from '../composables/useKpi';
import { getZone, DEFAULT_ZONE } from '../composables/useZone';
import BottomTabBar from '../components/dashboard/BottomTabBar.vue';
import ScanShade from '../components/dashboard/ScanShade.vue';
import { preloadOcrModels } from '../composables/useLocalOcr';
import { useUiStore } from '../stores/ui';

const router = useRouter();
const route = useRoute();
const measurements = useMeasurementStore();
const kpi = useKpi(() => measurements.items);
const uiStore = useUiStore();

// ── Scan shade state ──────────────────────────────────────────────────────────
const COLLAPSED_H = 64;
const EXPANDED_PCT = 0.70;

const shadeProgress = ref(uiStore.hasOpenedShutter ? 0 : 1);
const screenH = ref(window.innerHeight);
const expandedH = computed(() => Math.round(screenH.value * EXPANDED_PCT));
const shadeH = computed(() =>
  Math.round(COLLAPSED_H + (expandedH.value - COLLAPSED_H) * shadeProgress.value)
);

function onResize() {
  screenH.value = window.innerHeight;
}

onMounted(() => {
  if (!measurements.items.length) {
    measurements.fetchMeasurements();
  }
  window.addEventListener('resize', onResize, { passive: true });
  preloadOcrModels();
  uiStore.markShutterAsOpened();
});

onUnmounted(() => {
  window.removeEventListener('resize', onResize);
});

// Collapse the shutter upon navigating between different screens/tabs
watch(() => route.fullPath, () => {
  shadeProgress.value = 0;
});

const zoneColor = computed(() => {
  if (!kpi.value) return DEFAULT_ZONE.color;
  return getZone(kpi.value.last.sys, kpi.value.last.dia).color;
});

const activeTabIndex = computed(() => {
  if (route.name === 'meds-list') return 2;
  if (route.name === 'dashboard') {
    return route.query.tab === 'history' ? 1 : 0;
  }
  return 0;
});

function handleTabUpdate(index: number) {
  if (index === 0) {
    router.push({ name: 'dashboard' });
  } else if (index === 1) {
    router.push({ name: 'dashboard', query: { tab: 'history' } });
  } else if (index === 2) {
    router.push({ name: 'meds-list' });
  }
}

function handleProfile() {
  router.push({ name: 'settings' });
}
</script>

<template>
  <div class="app-shell">
    <ScanShade
      v-model="shadeProgress"
      :expanded-height="expandedH"
      :shade-height="shadeH"
      @scan="router.push({ name: 'measurement-local' })"
      @settings="router.push({ name: 'settings' })"
    />
    <div class="shell-content">
      <router-view />
    </div>
    <BottomTabBar
      :model-value="activeTabIndex"
      :zone-color="zoneColor"
      @update:model-value="handleTabUpdate"
      @profile="handleProfile"
    />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100svh;
  overflow: hidden;
  background: var(--color-bg);
}

.shell-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}
</style>
