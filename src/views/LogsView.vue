<script setup lang="ts">
import { computed } from 'vue';
import { useActivityQuery } from '../composables/useActivityQuery';
import SegmentedControl from '../components/ui/SegmentedControl.vue';
import PeriodPicker from '../components/activity/PeriodPicker.vue';
import LogsEvents from '../components/activity/LogsEvents.vue';
import LogsErrors from '../components/activity/LogsErrors.vue';

type LogTab = 'events' | 'errors';

const TABS: { value: LogTab; label: string }[] = [
  { value: 'events', label: 'Events' },
  { value: 'errors', label: 'Errors' },
];

const { str, patch, period, customFrom, customTo, range, setPeriod } = useActivityQuery();

const tab = computed<LogTab>(() => (str('tab') === 'errors' ? 'errors' : 'events'));

// Filters and the open error belong to one tab only, so they are dropped on switch
function setTab(value: LogTab) {
  patch({
    tab: value === 'events' ? null : value,
    error: null,
    user_id: null,
    module: null,
    client: null,
    status_min: null,
    status_max: null,
  });
}
</script>

<template>
  <div class="logs-view">
    <div class="view-header">
      <h1 class="view-title">Logs</h1>
      <span class="muted retention">Kept for 180 days</span>
    </div>

    <div class="logs-controls">
      <SegmentedControl :options="TABS" :model-value="tab" label="Log type" @update:model-value="setTab" />
      <PeriodPicker
        :period="period"
        :from="customFrom"
        :to="customTo"
        @update:period="setPeriod"
        @update:from="patch({ from: $event })"
        @update:to="patch({ to: $event })"
      />
    </div>

    <LogsEvents v-if="tab === 'events'" :range="range" />
    <LogsErrors v-else :range="range" />
  </div>
</template>

<style scoped>
.logs-view {
  display: flex;
  flex-direction: column;
  gap: var(--bpt-sp-4);
  min-width: 0;
}

.view-header {
  display: flex;
  align-items: baseline;
  gap: var(--bpt-sp-3);
}

.view-title {
  font-size: var(--bpt-fs-title-page);
  line-height: var(--bpt-lh-title-page);
  font-weight: 500;
}

.retention {
  font-size: var(--bpt-fs-label);
}

.logs-controls {
  display: flex;
  align-items: flex-end;
  gap: var(--bpt-sp-4);
  flex-wrap: wrap;
}
</style>
