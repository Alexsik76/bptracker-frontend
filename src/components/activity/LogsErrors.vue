<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { adminActivityApi, type ErrorEvent } from '../../services/adminActivity';
import { useActivityQuery } from '../../composables/useActivityQuery';
import { errorMessage, formatDateTime } from '../../utils/activityFormat';
import GridPagination from '../tables/GridPagination.vue';
import ActivityTable, { type ActivityColumn } from './ActivityTable.vue';

const PAGE_SIZE = 50;

const columns: ActivityColumn[] = [
  { key: 'occurred_at', label: 'Time' },
  { key: 'route', label: 'Route' },
  { key: 'exception_type', label: 'Exception' },
  { key: 'message', label: 'Message' },
];

const props = defineProps<{
  range: { date_from?: string; date_to?: string };
}>();

const { str, num, patch } = useActivityQuery();

const errors = ref<ErrorEvent[]>([]);
const total = ref(0);
const loading = ref(false);
const error = ref<string | null>(null);
let listSeq = 0;

const selected = ref<ErrorEvent | null>(null);
const detailLoading = ref(false);
const detailError = ref<string | null>(null);
const copied = ref(false);
let detailSeq = 0;
let copiedTimer: number | null = null;

const selectedId = computed(() => str('error'));
const page = computed(() => Math.max(1, num('page') ?? 1));

async function loadList() {
  const seq = ++listSeq;
  loading.value = true;
  error.value = null;
  try {
    const result = await adminActivityApi.listErrors({
      ...props.range,
      limit: PAGE_SIZE,
      offset: (page.value - 1) * PAGE_SIZE,
    });
    if (seq !== listSeq) return;
    errors.value = result.items;
    total.value = result.total;
  } catch (e) {
    if (seq !== listSeq) return;
    errors.value = [];
    total.value = 0;
    error.value = errorMessage(e);
  } finally {
    if (seq === listSeq) loading.value = false;
  }
}

async function loadDetail() {
  const id = selectedId.value;
  const seq = ++detailSeq;
  selected.value = null;
  detailError.value = null;
  copied.value = false;
  if (!id) return;
  detailLoading.value = true;
  try {
    const result = await adminActivityApi.getError(id);
    if (seq === detailSeq) selected.value = result;
  } catch (e) {
    if (seq === detailSeq) detailError.value = errorMessage(e);
  } finally {
    if (seq === detailSeq) detailLoading.value = false;
  }
}

async function copyTraceback() {
  if (!selected.value) return;
  try {
    await navigator.clipboard.writeText(selected.value.traceback);
    copied.value = true;
    if (copiedTimer) clearTimeout(copiedTimer);
    copiedTimer = window.setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    detailError.value = 'Could not copy to the clipboard';
  }
}

watch(() => [props.range.date_from, props.range.date_to, page.value], loadList, { immediate: true });
watch(selectedId, loadDetail, { immediate: true });
</script>

<template>
  <!-- Full record -->
  <div v-if="selectedId" class="card detail-card">
    <div class="detail-header">
      <button type="button" class="btn btn-outlined btn-sm" @click="patch({ error: null, page: page > 1 ? page : null })">
        <svg class="i i-s" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" />
        </svg>
        <span>Back to list</span>
      </button>
      <h2 class="detail-title">Error</h2>
      <span class="mono muted detail-id">{{ selectedId }}</span>
    </div>

    <p v-if="detailLoading" class="state muted">Loading data...</p>
    <div v-else-if="detailError" class="state error">
      {{ detailError }}
      <button type="button" class="btn btn-outlined btn-sm" @click="loadDetail">Retry</button>
    </div>

    <template v-else-if="selected">
      <dl class="meta">
        <div class="meta-item">
          <dt class="label">Time</dt>
          <dd class="mono">{{ formatDateTime(selected.occurred_at, true) }}</dd>
        </div>
        <div class="meta-item">
          <dt class="label">Request</dt>
          <dd class="mono"><span class="muted">{{ selected.method }}</span> {{ selected.route }}</dd>
        </div>
        <div class="meta-item">
          <dt class="label">Exception</dt>
          <dd class="mono">{{ selected.exception_type }}</dd>
        </div>
        <div class="meta-item">
          <dt class="label">User</dt>
          <dd class="mono">{{ selected.user_id || 'anonymous' }}</dd>
        </div>
      </dl>

      <div class="message-block">
        <span class="label">Message</span>
        <p class="message">{{ selected.message }}</p>
      </div>

      <div class="traceback-header">
        <span class="label">Traceback</span>
        <button type="button" class="btn btn-tonal btn-sm" @click="copyTraceback">
          <svg class="i i-s" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5a1 1 0 011-1h10" />
          </svg>
          <span>{{ copied ? 'Copied' : 'Copy traceback' }}</span>
        </button>
      </div>
      <pre class="code traceback">{{ selected.traceback }}</pre>
    </template>
  </div>

  <!-- List -->
  <div v-else class="card data-card">
    <ActivityTable
      :columns="columns"
      :rows="errors"
      :loading="loading"
      :error="error"
      empty-text="No errors in this period"
      @retry="loadList"
    >
      <template #cell-occurred_at="{ row }">
        <span class="mono">{{ formatDateTime(row.occurred_at, true) }}</span>
      </template>
      <template #cell-route="{ row }">
        <span class="mono"><span class="muted">{{ row.method }}</span> {{ row.route }}</span>
      </template>
      <template #cell-exception_type="{ row }">
        <span class="mono">{{ row.exception_type }}</span>
      </template>
      <template #cell-message="{ row }">
        <button type="button" class="msg-link" :title="row.message" @click="patch({ error: row.id, page: page > 1 ? page : null })">
          {{ row.message }}
        </button>
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
</template>

<style scoped>
.data-card,
.detail-card {
  overflow: hidden;
  border: 1px solid var(--md-sys-color-outline-variant);
}

.detail-card {
  padding: var(--bpt-sp-4);
  display: flex;
  flex-direction: column;
  gap: var(--bpt-sp-4);
}

.detail-header {
  display: flex;
  align-items: center;
  gap: var(--bpt-sp-3);
  flex-wrap: wrap;
}

.detail-title {
  font-size: var(--bpt-fs-title);
  line-height: var(--bpt-lh-title);
  font-weight: 600;
}

.detail-id {
  font-size: var(--bpt-fs-label);
}

.state {
  padding: var(--bpt-sp-6);
  text-align: center;
}

.state.error {
  color: var(--md-sys-color-error);
}

.meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--bpt-sp-3) var(--bpt-sp-6);
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: var(--bpt-sp-1);
  min-width: 0;
  word-break: break-word;
}

.message-block {
  display: flex;
  flex-direction: column;
  gap: var(--bpt-sp-1);
}

.message {
  color: var(--md-sys-color-error);
  word-break: break-word;
}

.traceback-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--bpt-sp-2);
}

.traceback {
  max-height: 520px;
  overflow: auto;
}

.msg-link {
  all: unset;
  display: block;
  max-width: 520px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--md-sys-color-primary);
  cursor: pointer;
}

.msg-link:hover {
  text-decoration: underline;
}

.msg-link:focus-visible {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: 2px;
}
</style>
