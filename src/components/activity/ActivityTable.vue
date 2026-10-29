<script setup lang="ts" generic="T extends object">
import { formatNumber } from '../../utils/datetime';

export interface ActivityColumn {
  key: string;
  label: string;
  /** right-aligned monospace numbers */
  num?: boolean;
  sortable?: boolean;
}

defineProps<{
  columns: ActivityColumn[];
  rows: T[];
  loading: boolean;
  error: string | null;
  emptyText: string;
  sortKey?: string;
  sortDesc?: boolean;
}>();

const emit = defineEmits<{
  (e: 'sort', key: string): void;
  (e: 'retry'): void;
}>();

function cellValue(row: T, col: ActivityColumn): unknown {
  const v = (row as Record<string, unknown>)[col.key];
  if (v === null || v === undefined) return '—';
  return col.num && typeof v === 'number' ? formatNumber(v) : v;
}
</script>

<template>
  <div class="table-scroll">
    <table class="tbl">
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :class="{ num: col.num, sorted: sortKey === col.key }"
            :aria-sort="sortKey === col.key ? (sortDesc ? 'descending' : 'ascending') : undefined"
          >
            <button v-if="col.sortable" type="button" class="th-sort-btn" @click="emit('sort', col.key)">
              <span>{{ col.label }}</span>
              <svg v-if="sortKey === col.key" class="i i-s" viewBox="0 0 24 24" aria-hidden="true">
                <path v-if="sortDesc" d="M12 5v14M6 13l6 6 6-6" />
                <path v-else d="M12 19V5M6 11l6-6 6 6" />
              </svg>
            </button>
            <span v-else>{{ col.label }}</span>
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-if="loading">
          <td :colspan="columns.length" class="state-cell muted">Loading data...</td>
        </tr>
        <tr v-else-if="error">
          <td :colspan="columns.length" class="state-cell error">
            {{ error }}
            <button type="button" class="btn btn-outlined btn-sm retry-btn" @click="emit('retry')">
              Retry
            </button>
          </td>
        </tr>
        <tr v-else-if="rows.length === 0">
          <td :colspan="columns.length" class="state-cell muted">{{ emptyText }}</td>
        </tr>

        <template v-else>
          <tr v-for="(row, idx) in rows" :key="idx">
            <td v-for="col in columns" :key="col.key" :class="{ num: col.num }">
              <slot :name="`cell-${col.key}`" :row="row">{{ cellValue(row, col) }}</slot>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-scroll {
  overflow-x: auto;
  width: 100%;
}

.tbl {
  min-width: 100%;
  width: max-content;
  border-collapse: separate;
  border-spacing: 0;
  font-size: var(--bpt-fs-cell);
}

.tbl th {
  text-align: left;
  font-weight: 500;
  font-size: var(--bpt-fs-label);
  color: var(--md-sys-color-on-surface-variant);
  height: var(--bpt-h-control);
  padding: 0 var(--bpt-sp-3);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  white-space: nowrap;
  background: var(--md-sys-color-surface-container);
}

.tbl th.sorted {
  color: var(--md-sys-color-on-surface);
}

.th-sort-btn {
  all: unset;
  display: inline-flex;
  gap: var(--bpt-sp-1);
  align-items: center;
  cursor: pointer;
  color: inherit;
  white-space: nowrap;
}

.th-sort-btn:focus-visible {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: 2px;
}

.tbl td {
  height: var(--bpt-h-row);
  padding: 0 var(--bpt-sp-3);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  white-space: nowrap;
}

.tbl tbody tr:hover td {
  background: var(--bpt-state-hover);
}

.tbl .num {
  text-align: right;
  font-family: var(--bpt-font-mono);
}

.tbl .state-cell {
  text-align: center;
  padding: var(--bpt-sp-6);
  white-space: normal;
}

.tbl .state-cell.error {
  color: var(--md-sys-color-error);
}

.retry-btn {
  margin-left: var(--bpt-sp-3);
}
</style>
