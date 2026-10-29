<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { adminActivityApi, type UsageGroupBy, type UsageStatItem } from '../../services/adminActivity';
import { errorMessage, formatDayKey, formatDuration } from '../../utils/activityFormat';
import { formatNumber } from '../../utils/datetime';
import SegmentedControl from '../ui/SegmentedControl.vue';
import ActivityTable, { type ActivityColumn } from './ActivityTable.vue';

const props = defineProps<{
  range: { date_from?: string; date_to?: string };
  groupBy: UsageGroupBy;
  userId?: string;
  module?: string;
}>();

const emit = defineEmits<{
  (e: 'update:groupBy', value: UsageGroupBy): void;
  (e: 'filterUser', item: UsageStatItem): void;
  (e: 'filterModule', item: UsageStatItem): void;
}>();

const GROUP_OPTIONS: { value: UsageGroupBy; label: string }[] = [
  { value: 'user', label: 'User' },
  { value: 'module', label: 'Module' },
  { value: 'client', label: 'Client' },
  { value: 'day', label: 'Day' },
  { value: 'route', label: 'Route' },
];

const GROUP_LABEL: Record<UsageGroupBy, string> = {
  user: 'User',
  module: 'Module',
  client: 'Client',
  day: 'Day',
  route: 'Route',
};

const items = ref<UsageStatItem[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
let requestSeq = 0;

const columns = computed<ActivityColumn[]>(() => [
  { key: 'label', label: GROUP_LABEL[props.groupBy] },
  { key: 'requests', label: 'Requests', num: true },
  { key: 'share', label: 'Share of busiest' },
  { key: 'errors', label: 'Server errors', num: true },
  { key: 'client_errors', label: 'Client errors', num: true },
  { key: 'avg_ms', label: 'Avg', num: true },
  { key: 'p95_ms', label: 'p95', num: true },
]);

// Days read chronologically; every other grouping keeps the server order (busiest first)
const rows = computed(() =>
  props.groupBy === 'day' ? [...items.value].sort((a, b) => a.key.localeCompare(b.key)) : items.value
);

const maxRequests = computed(() => Math.max(1, ...items.value.map((i) => i.requests)));

function percent(item: UsageStatItem): number {
  return (item.requests / maxRequests.value) * 100;
}

function isClickable(item: UsageStatItem): boolean {
  if (props.groupBy === 'module') return true;
  // "anonymous" has no user id to filter by
  return props.groupBy === 'user' && item.key !== 'anonymous';
}

function handleRowClick(item: UsageStatItem) {
  if (props.groupBy === 'user') emit('filterUser', item);
  else emit('filterModule', item);
}

async function load() {
  const seq = ++requestSeq;
  loading.value = true;
  error.value = null;
  try {
    // A grouping is never narrowed by its own dimension, so its rows stay clickable
    const result = await adminActivityApi.getUsage({
      ...props.range,
      group_by: props.groupBy,
      user_id: props.groupBy === 'user' ? undefined : props.userId,
      module: props.groupBy === 'module' ? undefined : props.module,
    });
    if (seq !== requestSeq) return;
    items.value = result;
  } catch (e) {
    if (seq !== requestSeq) return;
    items.value = [];
    error.value = errorMessage(e);
  } finally {
    if (seq === requestSeq) loading.value = false;
  }
}

watch(
  () => [props.range.date_from, props.range.date_to, props.groupBy, props.userId, props.module],
  load,
  { immediate: true }
);
</script>

<template>
  <section class="card usage-card" aria-labelledby="usage-title">
    <div class="usage-header">
      <h2 id="usage-title" class="section-title">Usage</h2>
      <SegmentedControl
        :options="GROUP_OPTIONS"
        :model-value="groupBy"
        label="Group by"
        @update:model-value="emit('update:groupBy', $event)"
      />
    </div>

    <!-- Day grouping: one vertical bar per day; the table below carries the exact numbers -->
    <div v-if="groupBy === 'day' && !loading && !error && rows.length > 0" class="day-chart" aria-hidden="true">
      <div
        v-for="item in rows"
        :key="item.key"
        class="day-col"
        :title="`${formatDayKey(item.key)}: ${formatNumber(item.requests)} requests`"
      >
        <div class="day-bar-area">
          <div class="day-bar" :style="{ height: `${percent(item)}%` }"></div>
        </div>
        <span class="day-label mono muted">{{ formatDayKey(item.key).slice(0, 5) }}</span>
      </div>
    </div>

    <ActivityTable
      :columns="columns"
      :rows="rows"
      :loading="loading"
      :error="error"
      empty-text="No requests in this period"
      @retry="load"
    >
      <template #cell-label="{ row }">
        <button
          v-if="isClickable(row)"
          type="button"
          class="badge b-link row-filter"
          :title="groupBy === 'user' ? 'Filter by this user' : 'Filter by this module'"
          @click="handleRowClick(row)"
        >
          {{ row.label || row.key }}
        </button>
        <span v-else-if="groupBy === 'day'" class="mono">{{ formatDayKey(row.key) }}</span>
        <span v-else-if="groupBy === 'route'" class="mono">{{ row.key }}</span>
        <span v-else>{{ row.label || row.key }}</span>
      </template>
      <template #cell-share="{ row }">
        <span class="bar-track">
          <span class="bar-fill" :style="{ width: `${percent(row)}%` }"></span>
        </span>
      </template>
      <template #cell-avg_ms="{ row }">
        <span>{{ formatDuration(row.avg_ms) }}</span>
      </template>
      <template #cell-p95_ms="{ row }">
        <span>{{ formatDuration(row.p95_ms) }}</span>
      </template>
    </ActivityTable>
  </section>
</template>

<style scoped>
.usage-card {
  overflow: hidden;
  border: 1px solid var(--md-sys-color-outline-variant);
}

.usage-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--bpt-sp-3);
  flex-wrap: wrap;
  padding: var(--bpt-sp-4) var(--bpt-sp-4) var(--bpt-sp-3);
}

.section-title {
  font-size: var(--bpt-fs-title);
  line-height: var(--bpt-lh-title);
  font-weight: 600;
}

.row-filter {
  border: 0;
  font-family: inherit;
  font-size: var(--bpt-fs-label);
}

.row-filter:hover {
  background: color-mix(in srgb, var(--md-sys-color-on-tertiary-container) calc(var(--md-sys-state-hover-opacity) * 100%), var(--md-sys-color-tertiary-container));
}

.bar-track {
  display: block;
  width: 160px;
  height: var(--bpt-sp-2);
  border-radius: var(--bpt-radius-full);
  background: var(--md-sys-color-surface-container-highest);
  overflow: hidden;
}

.bar-fill {
  display: block;
  height: 100%;
  border-radius: var(--bpt-radius-full);
  background: var(--md-sys-color-primary);
}

.day-chart {
  display: flex;
  align-items: stretch;
  gap: var(--bpt-sp-1);
  padding: var(--bpt-sp-2) var(--bpt-sp-4) var(--bpt-sp-4);
  overflow-x: auto;
}

.day-col {
  flex: 1 0 28px;
  max-width: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--bpt-sp-1);
}

.day-bar-area {
  display: flex;
  align-items: flex-end;
  width: 100%;
  height: 140px;
}

.day-bar {
  width: 100%;
  min-height: 2px;
  border-radius: var(--bpt-radius-badge) var(--bpt-radius-badge) 0 0;
  background: var(--md-sys-color-primary);
}

.day-label {
  font-size: var(--bpt-fs-label);
}
</style>
