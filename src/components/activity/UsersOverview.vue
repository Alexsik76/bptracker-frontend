<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { adminActivityApi, type UserOverviewItem } from '../../services/adminActivity';
import { errorMessage, formatDateTime } from '../../utils/activityFormat';
import ActivityTable, { type ActivityColumn } from './ActivityTable.vue';

const columns: ActivityColumn[] = [
  { key: 'email', label: 'Email', sortable: true },
  { key: 'display_name', label: 'Name', sortable: true },
  { key: 'created_at', label: 'Registered', sortable: true },
  { key: 'last_request_at', label: 'Last request', sortable: true },
  { key: 'requests_30d', label: 'Requests 30d', num: true, sortable: true },
  { key: 'measurements_total', label: 'Measurements', num: true, sortable: true },
  { key: 'measurements_30d', label: 'Measurements 30d', num: true, sortable: true },
  { key: 'prescriptions_active', label: 'Active prescriptions', num: true, sortable: true },
  { key: 'intake_reports_30d', label: 'Intake reports 30d', num: true, sortable: true },
  { key: 'menu_generations_30d', label: 'Menu generations 30d', num: true, sortable: true },
  { key: 'webauthn_credentials', label: 'Passkeys', num: true, sortable: true },
  { key: 'active_sessions', label: 'Sessions', num: true, sortable: true },
];

const users = ref<UserOverviewItem[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const sortKey = ref('requests_30d');
const sortDesc = ref(true);

const sorted = computed(() => {
  const key = sortKey.value as keyof UserOverviewItem;
  const dir = sortDesc.value ? -1 : 1;
  return [...users.value].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    // empty values always go last
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });
});

function handleSort(key: string) {
  if (sortKey.value === key) {
    sortDesc.value = !sortDesc.value;
  } else {
    sortKey.value = key;
    sortDesc.value = true;
  }
}

async function load() {
  loading.value = true;
  error.value = null;
  try {
    users.value = await adminActivityApi.getOverview();
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <section class="card section-card" aria-labelledby="users-title">
    <div class="section-header">
      <h2 id="users-title" class="section-title">Users</h2>
      <span class="muted section-note">Columns marked 30d cover the last 30 days</span>
    </div>

    <ActivityTable
      :columns="columns"
      :rows="sorted"
      :loading="loading"
      :error="error"
      empty-text="No users"
      :sort-key="sortKey"
      :sort-desc="sortDesc"
      @sort="handleSort"
      @retry="load"
    >
      <template #cell-created_at="{ row }">
        <span class="mono">{{ formatDateTime(row.created_at) }}</span>
      </template>
      <template #cell-last_request_at="{ row }">
        <span class="mono">{{ formatDateTime(row.last_request_at) }}</span>
      </template>
    </ActivityTable>
  </section>
</template>

<style scoped>
.section-card {
  overflow: hidden;
  border: 1px solid var(--md-sys-color-outline-variant);
}

.section-header {
  display: flex;
  align-items: baseline;
  gap: var(--bpt-sp-3);
  padding: var(--bpt-sp-4) var(--bpt-sp-4) var(--bpt-sp-3);
}

.section-title {
  font-size: var(--bpt-fs-title);
  line-height: var(--bpt-lh-title);
  font-weight: 600;
}

.section-note {
  font-size: var(--bpt-fs-label);
}
</style>
