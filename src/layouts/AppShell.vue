<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useMeasurementStore } from '../stores/measurements';
import { useReminderStore } from '../stores/reminders';
import BottomTabBar from '../components/dashboard/BottomTabBar.vue';
import CornerGear from '../components/dashboard/CornerGear.vue';

const router = useRouter();
const route = useRoute();
const measurements = useMeasurementStore();
const reminderStore = useReminderStore();

onMounted(() => {
  if (!measurements.items.length) {
    measurements.fetchMeasurements();
  }
  reminderStore.init();
});

const activeTabIndex = computed(() => {
  if (route.meta.tab === 'schedule') return 1;
  if (route.meta.tab === 'dashboard') return 0;
  return -1;
});

const isRootTab = computed(() => {
  return route.name === 'dashboard' || route.name === 'schedule';
});

const hasMissedIntakes = computed(() => {
  if (!reminderStore.todayData || !reminderStore.todayData.intakes) return false;
  const now = new Date();
  return reminderStore.todayData.intakes.some(intake => {
    if (intake.status === 'Confirmed') return false;
    const [hours, minutes] = intake.time.split(':').map(Number);
    const scheduled = new Date();
    scheduled.setHours(hours, minutes, 0, 0);
    return now > scheduled;
  });
});

function handleTabUpdate(index: number) {
  if (index === 0) {
    router.push({ name: 'dashboard' });
  } else if (index === 1) {
    router.push({ name: 'schedule' });
  }
}

function handleScan() {
  router.push({ name: 'measurement-local' });
}
</script>

<template>
  <div class="app-shell">
    <!-- Floating settings button (top-right, roots only, scroll-aware) -->
    <CornerGear v-if="isRootTab" />

    <div class="shell-content">
      <router-view />
    </div>

    <!-- Asymmetric bottom tab bar -->
    <BottomTabBar
      :model-value="activeTabIndex"
      :has-missed-intakes="hasMissedIntakes"
      @update:model-value="handleTabUpdate"
      @scan="handleScan"
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
