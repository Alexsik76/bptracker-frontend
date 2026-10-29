<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { adminActivityApi, type RequestEvent, type UsageStatItem } from '../../services/adminActivity';
import { useActivityQuery } from '../../composables/useActivityQuery';
import { errorMessage, formatDateTime, formatDuration } from '../../utils/activityFormat';
import SegmentedControl from '../ui/SegmentedControl.vue';
import GridPagination from '../tables/GridPagination.vue';
import ActivityTable, { type ActivityColumn } from './ActivityTable.vue';
import StatusBadge from './StatusBadge.vue';

type StatusFilter = 'all' | 'ok' | 'client' | 'server';

const PAGE_SIZE = 100;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'ok', label: 'Success' },
  { value: 'client', label: 'Client error' },
  { value: 'server', label: 'Server error' },
];

const STATUS_RANGES: Record<StatusFilter, { min: number | null; max: number | null }> = {
  all: { min: null, max: null },
  ok: { min: null, max: 399 },
  client: { min: 400, max: 499 },
  server: { min: 500, max: 599 },
};

const columns: ActivityColumn[] = [
  { key: 'occurred_at', label: 'Time' },
  { key: 'status_code', label: 'Result' },
  { key: 'request', label: 'Request' },
  { key: 'user_id', label: 'User' },
  { key: 'client', label: 'Client' },
  { key: 'module', label: 'Module' },
  { key: 'duration_ms', label: 'Duration' },
];

const props = defineProps<{
  range: { date_from?: string; date_to?: string };
}>();

const { str, num, patch } = useActivityQuery();

const events = ref<RequestEvent[]>([]);
const total = ref(0);
const loading = ref(false);
const error = ref<string | null>(null);
let requestSeq = 0;

const userOptions = ref<UsageStatItem[]>([]);
const moduleOptions = ref<UsageStatItem[]>([]);
const clientOptions = ref<UsageStatItem[]>([]);

const userId = computed(() => str('user_id'));
const module = computed(() => str('module'));
const client = computed(() => str('client'));
const statusMin = computed(() => num('status_min'));
const statusMax = computed(() => num('status_max'));
const page = computed(() => Math.max(1, num('page') ?? 1));

const status = computed<StatusFilter>(() => {
  const found = (Object.keys(STATUS_RANGES) as StatusFilter[]).find((k) => {
    const r = STATUS_RANGES[k];
    return (r.min ?? undefined) === statusMin.value && (r.max ?? undefined) === statusMax.value;
  });
  return found ?? 'all';
});

const userLabels = computed(() => {
  const map = new Map<string, string>();
  for (const u of userOptions.value) map.set(u.key, u.label || u.key);
  return map;
});

// Registered users only: "anonymous" cannot be used as a user_id filter
const selectableUsers = computed(() => userOptions.value.filter((u) => u.key !== 'anonymous'));

function withCurrent(options: UsageStatItem[], current: string | undefined): string[] {
  const keys = options.map((o) => o.key);
  return current && !keys.includes(current) ? [current, ...keys] : keys;
}

const userKeys = computed(() => withCurrent(selectableUsers.value, userId.value));
const moduleKeys = computed(() => withCurrent(moduleOptions.value, module.value));
const clientKeys = computed(() => withCurrent(clientOptions.value, client.value));

function userName(id: string | null): string {
  if (!id) return 'anonymous';
  return userLabels.value.get(id) || id;
}

function durationClass(ms: number): string {
  if (ms >= 1000) return 'dur-slow';
  if (ms >= 300) return 'dur-warn';
  return 'dur-ok';
}

function durationWidth(ms: number): string {
  return `${Math.min(100, (ms / 1000) * 100)}%`;
}

function setStatus(value: StatusFilter) {
  patch({ status_min: STATUS_RANGES[value].min, status_max: STATUS_RANGES[value].max });
}

function clearFilters() {
  patch({ user_id: null, module: null, client: null, status_min: null, status_max: null });
}

const hasFilters = computed(
  () => Boolean(userId.value || module.value || client.value) || status.value !== 'all'
);

async function load() {
  const seq = ++requestSeq;
  loading.value = true;
  error.value = null;
  try {
    const result = await adminActivityApi.listEvents({
      ...props.range,
      user_id: userId.value,
      module: module.value,
      client: client.value,
      status_min: statusMin.value,
      status_max: statusMax.value,
      limit: PAGE_SIZE,
      offset: (page.value - 1) * PAGE_SIZE,
    });
    if (seq !== requestSeq) return;
    events.value = result.items;
    total.value = result.total;
  } catch (e) {
    if (seq !== requestSeq) return;
    events.value = [];
    total.value = 0;
    error.value = errorMessage(e);
  } finally {
    if (seq === requestSeq) loading.value = false;
  }
}

// Filter options come from the usage breakdown of the selected period
async function loadOptions() {
  const [users, modules, clients] = await Promise.allSettled([
    adminActivityApi.getUsage({ ...props.range, group_by: 'user' }),
    adminActivityApi.getUsage({ ...props.range, group_by: 'module' }),
    adminActivityApi.getUsage({ ...props.range, group_by: 'client' }),
  ]);
  userOptions.value = users.status === 'fulfilled' ? users.value : [];
  moduleOptions.value = modules.status === 'fulfilled' ? modules.value : [];
  clientOptions.value = clients.status === 'fulfilled' ? clients.value : [];
}

watch(() => [props.range.date_from, props.range.date_to], loadOptions, { immediate: true });

watch(
  () => [
    props.range.date_from,
    props.range.date_to,
    userId.value,
    module.value,
    client.value,
    statusMin.value,
    statusMax.value,
    page.value,
  ],
  load,
  { immediate: true }
);
</script>

<template>
  <div class="events">
    <div class="filters">
      <div class="field filter-field">
        <label class="label" for="ev-user">User</label>
        <select
          id="ev-user"
          class="input select"
          :value="userId || ''"
          @change="patch({ user_id: ($event.target as HTMLSelectElement).value })"
        >
          <option value="">All users</option>
          <option v-for="key in userKeys" :key="key" :value="key">{{ userName(key) }}</option>
        </select>
      </div>

      <div class="field filter-field">
        <label class="label" for="ev-module">Module</label>
        <select
          id="ev-module"
          class="input select"
          :value="module || ''"
          @change="patch({ module: ($event.target as HTMLSelectElement).value })"
        >
          <option value="">All modules</option>
          <option v-for="key in moduleKeys" :key="key" :value="key">{{ key }}</option>
        </select>
      </div>

      <div class="field filter-field">
        <label class="label" for="ev-client">Client</label>
        <select
          id="ev-client"
          class="input select"
          :value="client || ''"
          @change="patch({ client: ($event.target as HTMLSelectElement).value })"
        >
          <option value="">All clients</option>
          <option v-for="key in clientKeys" :key="key" :value="key">{{ key }}</option>
        </select>
      </div>

      <SegmentedControl
        :options="STATUS_OPTIONS"
        :model-value="status"
        label="Result"
        @update:model-value="setStatus"
      />

      <button v-if="hasFilters" type="button" class="btn btn-outlined" @click="clearFilters">
        Clear filters
      </button>
    </div>

    <div class="card data-card">
      <ActivityTable
        :columns="columns"
        :rows="events"
        :loading="loading"
        :error="error"
        empty-text="No events match these filters"
        @retry="load"
      >
        <template #cell-occurred_at="{ row }">
          <span class="mono">{{ formatDateTime(row.occurred_at, true) }}</span>
        </template>
        <template #cell-status_code="{ row }">
          <StatusBadge :status="row.status_code" />
        </template>
        <template #cell-request="{ row }">
          <span class="mono request"><span class="muted">{{ row.method }}</span> {{ row.route }}</span>
        </template>
        <template #cell-user_id="{ row }">
          <span :class="{ muted: !row.user_id }">{{ userName(row.user_id) }}</span>
        </template>
        <template #cell-duration_ms="{ row }">
          <span class="dur mono" :class="durationClass(row.duration_ms)">
            <span class="dur-bar"><span :style="{ width: durationWidth(row.duration_ms) }"></span></span>
            {{ formatDuration(row.duration_ms) }}
          </span>
        </template>
      </ActivityTable>

      <GridPagination
        :current-page="page"
        :total-rows="total"
        :page-size="PAGE_SIZE"
        :loading="loading"
        @page-change="patch({ page: $event === 1 ? null : $event })"
      />
    </div>
  </div>
</template>

<style scoped>
.events {
  display: flex;
  flex-direction: column;
  gap: var(--bpt-sp-4);
  min-width: 0;
}

.filters {
  display: flex;
  align-items: flex-end;
  gap: var(--bpt-sp-3);
  flex-wrap: wrap;
}

.filter-field {
  width: 200px;
}

.data-card {
  overflow: hidden;
  border: 1px solid var(--md-sys-color-outline-variant);
}

.request {
  font-size: var(--bpt-fs-log);
}

.dur {
  display: inline-flex;
  align-items: center;
  gap: var(--bpt-sp-2);
  font-size: var(--bpt-fs-log);
}

.dur-bar {
  width: 28px;
  height: var(--bpt-sp-1);
  border-radius: var(--bpt-radius-full);
  background: var(--md-sys-color-surface-container-highest);
  overflow: hidden;
}

.dur-bar span {
  display: block;
  height: 100%;
  background: currentColor;
}

.dur-ok {
  color: var(--md-sys-color-on-surface-variant);
}

.dur-warn {
  color: var(--md-extended-color-warning-color);
}

.dur-slow {
  color: var(--md-sys-color-error);
}
</style>
