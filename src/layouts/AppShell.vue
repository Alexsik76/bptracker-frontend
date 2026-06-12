<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useMeasurementStore } from '../stores/measurements';
import { useKpi } from '../composables/useKpi';
import { getZone, DEFAULT_ZONE } from '../composables/useZone';
import BottomTabBar from '../components/dashboard/BottomTabBar.vue';

const router = useRouter();
const route = useRoute();
const measurements = useMeasurementStore();
const kpi = useKpi(() => measurements.items);

onMounted(() => {
  if (!measurements.items.length) {
    measurements.fetchMeasurements();
  }
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
