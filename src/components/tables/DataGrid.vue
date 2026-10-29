<script setup lang="ts">
import type { TableMetadata } from '../../services/adminTables';
import GridCell from './GridCell.vue';

const props = defineProps<{
  table: TableMetadata;
  rows: Record<string, unknown>[];
  loading: boolean;
  error: string | null;
  sortCol: string | null;
  sortDesc: boolean;
  colFilters: Record<string, string>;
  selectedRow: Record<string, unknown> | null;
}>();

const emit = defineEmits<{
  (e: 'sort', colName: string): void;
  (e: 'applyFilters'): void;
  (e: 'retry'): void;
  (e: 'selectRow', row: Record<string, unknown>): void;
}>();

function isRowSelected(row: Record<string, unknown>): boolean {
  if (!props.selectedRow || !props.table) return false;
  return props.table.primary_key.every(
    (pk) => props.selectedRow?.[pk] === row[pk]
  );
}
</script>

<template>
  <div class="table-scroll-container">
    <table class="tbl">
      <thead>
        <!-- Row 1: Column Headers with Sorting -->
        <tr>
          <th
            v-for="col in table.columns"
            :key="col.name"
            :aria-sort="
              sortCol === col.name
                ? sortDesc
                  ? 'descending'
                  : 'ascending'
                : undefined
            "
            :class="{
              num: col.type === 'integer' || col.type === 'number',
              sorted: sortCol === col.name,
            }"
          >
            <button
              type="button"
              class="th-sort-btn"
              @click="emit('sort', col.name)"
            >
              <span class="mono">{{ col.name }}</span>
              <svg
                v-if="sortCol === col.name"
                class="i i-s sort-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  v-if="sortDesc"
                  d="M12 5v14M6 13l6 6 6-6"
                />
                <path
                  v-else
                  d="M12 19V5M6 11l6-6 6 6"
                />
              </svg>
            </button>
          </th>
        </tr>

        <!-- Row 2: Per-column Equality Filter Row -->
        <tr class="filter-row">
          <th
            v-for="col in table.columns"
            :key="'filter-' + col.name"
            class="filter-cell"
          >
            <!-- Boolean select -->
            <select
              v-if="col.type === 'boolean'"
              class="filter-input filter-select"
              v-model="colFilters[col.name]"
              @change="emit('applyFilters')"
            >
              <option value="">All</option>
              <option value="true">true</option>
              <option value="false">false</option>
            </select>

            <!-- Enum select -->
            <select
              v-else-if="col.type === 'enum' && col.enum_values"
              class="filter-input filter-select"
              v-model="colFilters[col.name]"
              @change="emit('applyFilters')"
            >
              <option value="">All</option>
              <option
                v-for="ev in col.enum_values"
                :key="ev"
                :value="ev"
              >
                {{ ev }}
              </option>
            </select>

            <!-- Text / generic filter input -->
            <input
              v-else
              type="text"
              class="filter-input"
              :placeholder="'Filter ' + col.name"
              v-model="colFilters[col.name]"
              @keydown.enter="emit('applyFilters')"
              @blur="emit('applyFilters')"
            />
          </th>
        </tr>
      </thead>

      <tbody>
        <!-- Loading State -->
        <tr v-if="loading">
          <td
            :colspan="table.columns.length || 1"
            class="state-cell muted"
          >
            Loading data...
          </td>
        </tr>

        <!-- Error State -->
        <tr v-else-if="error">
          <td
            :colspan="table.columns.length || 1"
            class="state-cell error"
          >
            {{ error }}
            <button
              type="button"
              class="btn btn-outlined btn-sm retry-btn"
              @click="emit('retry')"
            >
              Retry
            </button>
          </td>
        </tr>

        <!-- Empty State -->
        <tr v-else-if="rows.length === 0">
          <td
            :colspan="table.columns.length || 1"
            class="state-cell muted"
          >
            No records found
          </td>
        </tr>

        <!-- Data Rows -->
        <tr
          v-for="(row, idx) in rows"
          :key="idx"
          :class="{ sel: isRowSelected(row) }"
          @click="emit('selectRow', row)"
        >
          <td
            v-for="col in table.columns"
            :key="col.name"
            :class="{
              num: col.type === 'integer' || col.type === 'number',
            }"
          >
            <GridCell :value="row[col.name]" :column="col" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-scroll-container {
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
  min-width: max-content;
  background: var(--md-sys-color-surface-container);
}

.tbl th.sorted {
  color: var(--md-sys-color-on-surface);
}

.th-sort-btn {
  all: unset;
  display: inline-flex;
  gap: 4px;
  align-items: center;
  cursor: pointer;
  color: inherit;
  white-space: nowrap;
}

.th-sort-btn:focus-visible {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: 2px;
}

.filter-row th {
  height: 36px;
  padding: 4px var(--bpt-sp-2);
  background: var(--md-sys-color-surface-container);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  min-width: max-content;
}

.filter-input {
  height: 28px;
  font-size: var(--bpt-fs-label);
  line-height: var(--bpt-lh-label);
  padding: 0 var(--bpt-sp-2);
  border-radius: var(--bpt-radius-badge);
  border: 1px solid var(--md-sys-color-outline);
  background: var(--md-sys-color-surface-container-low);
  color: var(--md-sys-color-on-surface);
  width: 100%;
  min-width: 90px;
  box-sizing: border-box;
}

.filter-input:focus {
  outline: none;
  border: 2px solid var(--md-sys-color-primary);
}

.filter-select {
  appearance: none;
  padding-right: 20px;
  background-image: linear-gradient(45deg, transparent 50%, var(--md-sys-color-on-surface-variant) 50%),
                    linear-gradient(135deg, var(--md-sys-color-on-surface-variant) 50%, transparent 50%);
  background-position: calc(100% - 12px) 50%, calc(100% - 8px) 50%;
  background-size: 4px 4px;
  background-repeat: no-repeat;
}

.tbl td {
  height: var(--bpt-h-row);
  padding: 0 var(--bpt-sp-3);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  white-space: nowrap;
  cursor: pointer;
}

.tbl tr:hover td {
  background: var(--bpt-state-hover);
}

.tbl tr.sel td {
  background: var(--bpt-row-selected);
}

.tbl .num {
  text-align: right;
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
