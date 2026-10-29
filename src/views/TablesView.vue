<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { TableMetadata, RowsResponse } from '../services/adminTables';
import { adminTablesApi } from '../services/adminTables';
import { ApiError } from '../services/api';
import RowFormPanel from '../components/admin/RowFormPanel.vue';
import {
  formatLocalDateTimeWithOffset,
  formatDate,
  formatNumber,
} from '../utils/datetime';

const route = useRoute();
const router = useRouter();

// Table registry metadata
const tables = ref<TableMetadata[]>([]);
const tablesLoading = ref(true);
const tablesError = ref<string | null>(null);

// Current table
const currentTableName = computed(() => (route.params.name as string) || '');
const currentTable = computed(() =>
  tables.value.find((t) => t.name === currentTableName.value)
);

// Data rows state
const rows = ref<Record<string, unknown>[]>([]);
const totalRows = ref(0);
const rowsLoading = ref(false);
const rowsError = ref<string | null>(null);

// Local state for toolbar and filter row
const searchInput = ref('');
const searchInputRef = ref<HTMLInputElement | null>(null);
const colFilters = ref<Record<string, string>>({});

// Side sheet panel state
const selectedRow = ref<Record<string, unknown> | null>(null);
const isPanelOpen = ref(false);

const PAGE_SIZE = 50;

// Read query params from URL
const currentPage = computed(() => {
  const p = parseInt(route.query.page as string, 10);
  return isNaN(p) || p < 1 ? 1 : p;
});

const currentSortCol = computed(() => (route.query.order_by as string) || null);
const currentSortDesc = computed(() => route.query.desc === 'true');

// Active filters extracted from URL query
const activeFilterList = computed<string[]>(() => {
  const f = route.query.filter;
  if (!f) return [];
  if (Array.isArray(f)) return f.filter((item): item is string => typeof item === 'string');
  return [f as string];
});

// Parsed active filters map: colName -> value
const parsedFilters = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {};
  for (const item of activeFilterList.value) {
    const idx = item.indexOf(':');
    if (idx !== -1) {
      const col = item.slice(0, idx);
      const val = item.slice(idx + 1);
      map[col] = val;
    }
  }
  return map;
});

// Synchronize local filter inputs with route query
function syncFiltersFromRoute() {
  searchInput.value = (route.query.search as string) || '';
  const newFilters: Record<string, string> = {};
  for (const [col, val] of Object.entries(parsedFilters.value)) {
    newFilters[col] = val;
  }
  colFilters.value = newFilters;
}

// Fetch metadata for all tables
async function fetchTables() {
  tablesLoading.value = true;
  tablesError.value = null;
  try {
    tables.value = await adminTablesApi.getTables();
  } catch (err: unknown) {
    console.error('Failed to load tables metadata:', err);
    tablesError.value =
      err instanceof ApiError ? err.message : 'Не вдалося завантажити список таблиць';
  } finally {
    tablesLoading.value = false;
  }
}

// Fetch rows for the active table using current route query params
async function fetchRows() {
  if (!currentTableName.value) {
    rows.value = [];
    totalRows.value = 0;
    return;
  }

  rowsLoading.value = true;
  rowsError.value = null;

  try {
    const offset = (currentPage.value - 1) * PAGE_SIZE;
    const params = {
      limit: PAGE_SIZE,
      offset,
      order_by: currentSortCol.value || undefined,
      desc: currentSortDesc.value ? true : undefined,
      search: (route.query.search as string) || undefined,
      filter: activeFilterList.value.length > 0 ? activeFilterList.value : undefined,
    };

    const res: RowsResponse = await adminTablesApi.listRows(currentTableName.value, params);
    rows.value = res.items;
    totalRows.value = res.total;
  } catch (err: unknown) {
    console.error('Failed to load table rows:', err);
    rowsError.value =
      err instanceof ApiError ? err.message : 'Не вдалося завантажити дані таблиці';
  } finally {
    rowsLoading.value = false;
  }
}

// Route query updater helper
function updateQuery(newQueryParams: Record<string, string | string[] | undefined>) {
  const q = { ...route.query, ...newQueryParams };
  // Clean undefined or empty string properties
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === '') {
      delete q[k];
    }
  }
  router.push({ query: q });
}

// Search box handlers
function handleSearchSubmit() {
  const trimmed = searchInput.value.trim();
  updateQuery({
    search: trimmed || undefined,
    page: undefined, // reset to page 1
  });
}

function handleSearchClear() {
  searchInput.value = '';
  updateQuery({
    search: undefined,
    page: undefined,
  });
}

// Column sort handler
function handleSort(colName: string) {
  if (currentSortCol.value === colName) {
    if (!currentSortDesc.value) {
      // Toggle to desc
      updateQuery({ order_by: colName, desc: 'true', page: undefined });
    } else {
      // Reset sort
      updateQuery({ order_by: undefined, desc: undefined, page: undefined });
    }
  } else {
    // New sort asc
    updateQuery({ order_by: colName, desc: undefined, page: undefined });
  }
}

// Column filters handler
function applyColFilters() {
  const filterList: string[] = [];
  for (const [col, val] of Object.entries(colFilters.value)) {
    const trimmed = typeof val === 'string' ? val.trim() : '';
    if (trimmed !== '') {
      filterList.push(`${col}:${trimmed}`);
    }
  }

  updateQuery({
    filter: filterList.length > 0 ? filterList : undefined,
    page: undefined, // reset to page 1
  });
}

function removeFilter(colName: string) {
  delete colFilters.value[colName];
  applyColFilters();
}

function clearAllFilters() {
  colFilters.value = {};
  searchInput.value = '';
  updateQuery({
    filter: undefined,
    search: undefined,
    page: undefined,
  });
}

// Pagination
const totalPages = computed(() => Math.max(1, Math.ceil(totalRows.value / PAGE_SIZE)));

function goToPage(page: number) {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return;
  updateQuery({ page: page === 1 ? undefined : String(page) });
}

const paginationInfo = computed(() => {
  if (totalRows.value === 0) return '0 з 0';
  const start = (currentPage.value - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage.value * PAGE_SIZE, totalRows.value);
  return `${formatNumber(start)}–${formatNumber(end)} з ${formatNumber(totalRows.value)}`;
});

// Row selection & Side sheet
function openRowDetail(row: Record<string, unknown>) {
  selectedRow.value = row;
  isPanelOpen.value = true;
}

function openCreateRow() {
  selectedRow.value = null;
  isPanelOpen.value = true;
}

function closePanel() {
  isPanelOpen.value = false;
  selectedRow.value = null;
}

function handleRowSaved() {
  fetchRows();
}

function handleRowDeleted() {
  fetchRows();
}

function isRowSelected(row: Record<string, unknown>): boolean {
  if (!selectedRow.value || !currentTable.value) return false;
  return currentTable.value.primary_key.every(
    (pk) => selectedRow.value?.[pk] === row[pk]
  );
}

// Cell formatting & tooltips
function formatCellValue(val: unknown, type: string): string {
  if (val === null || val === undefined) return '—';
  if (type === 'datetime') {
    return formatLocalDateTimeWithOffset(String(val));
  }
  if (type === 'date') {
    return formatDate(String(val));
  }
  if (type === 'boolean') {
    return val ? '✓ так' : '× ні';
  }
  if (type === 'json') {
    return typeof val === 'string' ? val : JSON.stringify(val);
  }
  if (type === 'integer' || type === 'number') {
    return typeof val === 'number' ? formatNumber(val) : String(val);
  }
  return String(val);
}

function getFullCellTooltip(val: unknown, type: string): string {
  if (val === null || val === undefined) return 'null';
  if (type === 'datetime') {
    return `${val} (${formatLocalDateTimeWithOffset(String(val))})`;
  }
  if (type === 'json') {
    return typeof val === 'string' ? val : JSON.stringify(val, null, 2);
  }
  return String(val);
}

function truncate(str: string, maxLen = 45): string {
  if (!str) return '';
  return str.length > maxLen ? `${str.slice(0, maxLen)}…` : str;
}

function parseFk(fkStr: string | null): { table: string; column: string } | null {
  if (!fkStr) return null;
  const parts = fkStr.split('.');
  return { table: parts[0], column: parts[1] || 'id' };
}

// Listen to route changes
watch(
  () => [route.params.name, route.query],
  () => {
    syncFiltersFromRoute();
    fetchRows();
  },
  { immediate: true }
);

function handleGlobalKeyDown(e: KeyboardEvent) {
  if (
    e.key === '/' &&
    !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
  ) {
    e.preventDefault();
    searchInputRef.value?.focus();
  }
}

onMounted(() => {
  fetchTables();
  window.addEventListener('keydown', handleGlobalKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeyDown);
});
</script>

<template>
  <div class="tables-view">
    <!-- Left Navigation: List of tables -->
    <nav class="table-list-card card" aria-label="Таблиці бази">
      <div class="table-list-title label">Таблиці бази</div>

      <div v-if="tablesLoading" class="table-list-status muted">
        Завантаження...
      </div>
      <div v-else-if="tablesError" class="table-list-status error">
        {{ tablesError }}
      </div>
      <div v-else class="table-links">
        <router-link
          v-for="tbl in tables"
          :key="tbl.name"
          :to="{ path: `/tables/${tbl.name}` }"
          class="table-link mono"
          :class="{ 'table-link-active': tbl.name === currentTableName }"
          :aria-current="tbl.name === currentTableName ? 'page' : undefined"
        >
          <span class="table-name">{{ tbl.name }}</span>
          <span class="table-label muted">{{ tbl.label }}</span>
        </router-link>
      </div>
    </nav>

    <!-- Main Content Area -->
    <div class="table-content-area">
      <!-- State 1: No table selected (/tables) -->
      <div v-if="!currentTableName" class="table-index-view">
        <div class="index-header">
          <h1 class="page-title">Таблиці</h1>
          <p class="muted">Виберіть таблицю для перегляду та керування записами</p>
        </div>

        <div v-if="tablesLoading" class="card empty-card muted">
          Завантаження метаданих...
        </div>

        <div v-else-if="tablesError" class="card empty-card error">
          {{ tablesError }}
          <button type="button" class="btn btn-outlined btn-sm" @click="fetchTables">
            Спробувати знову
          </button>
        </div>

        <div v-else class="tables-grid">
          <router-link
            v-for="tbl in tables"
            :key="tbl.name"
            :to="{ path: `/tables/${tbl.name}` }"
            class="table-card card"
          >
            <div class="table-card-header">
              <span class="badge b-primary">{{ tbl.name }}</span>
              <span class="table-card-count muted">
                {{ tbl.columns.length }} колонок
              </span>
            </div>
            <h3 class="table-card-title">{{ tbl.label }}</h3>
            <div class="table-card-pks muted mono">
              PK: {{ tbl.primary_key.join(', ') }}
            </div>
            <div class="table-card-badges">
              <span v-if="tbl.can_create" class="badge b-ok">створення</span>
              <span v-if="tbl.can_update" class="badge b-ok">оновлення</span>
              <span v-if="tbl.can_delete" class="badge b-ok">вилучення</span>
              <span
                v-if="!tbl.can_create && !tbl.can_update && !tbl.can_delete"
                class="badge b-ro"
              >
                тільки читання
              </span>
            </div>
          </router-link>
        </div>
      </div>

      <!-- State 2: Table selected (/tables/:name) -->
      <div v-else class="table-grid-view">
        <!-- Table Action Header -->
        <div class="view-header">
          <div class="header-info">
            <h1 class="table-title mono">{{ currentTable?.name || currentTableName }}</h1>
            <p class="table-header-desc muted">
              {{ currentTable?.label || 'Таблиця бази даних' }}
            </p>
          </div>

          <button
            v-if="currentTable?.can_create"
            type="button"
            class="btn btn-filled"
            @click="openCreateRow"
          >
            <svg class="i i-s" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>Додати запис</span>
          </button>
        </div>

        <!-- Data Card -->
        <div class="card data-card">
          <!-- Toolbar -->
          <div class="table-toolbar">
            <form class="search-wrap ig" @submit.prevent="handleSearchSubmit">
              <svg class="i i-s" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-4-4" />
              </svg>
              <input
                ref="searchInputRef"
                v-model="searchInput"
                aria-label="Пошук у таблиці"
                placeholder="Пошук у таблиці..."
              />
              <span v-if="!searchInput" class="kbd">/</span>
              <button
                v-else
                type="button"
                class="btn-icon-clear"
                aria-label="Очистити пошук"
                @click="handleSearchClear"
              >
                ✕
              </button>
            </form>

            <!-- Active filter chips -->
            <div class="active-chips" v-if="Object.keys(parsedFilters).length > 0">
              <span
                v-for="(val, col) in parsedFilters"
                :key="col"
                class="chip"
              >
                <span>{{ col }}: {{ val }}</span>
                <button
                  type="button"
                  :aria-label="'Прибрати фільтр ' + col"
                  @click="removeFilter(col as string)"
                >
                  <svg class="i i-s" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </span>

              <button
                type="button"
                class="btn btn-outlined btn-sm"
                @click="clearAllFilters"
              >
                Очистити всі
              </button>
            </div>
          </div>

          <!-- Table scroll wrapper -->
          <div class="table-scroll-container">
            <table class="tbl">
              <thead>
                <!-- Row 1: Column Headers with Sorting -->
                <tr>
                  <th
                    v-for="col in currentTable?.columns || []"
                    :key="col.name"
                    :aria-sort="
                      currentSortCol === col.name
                        ? currentSortDesc
                          ? 'descending'
                          : 'ascending'
                        : undefined
                    "
                    :class="{
                      num: col.type === 'integer' || col.type === 'number',
                      sorted: currentSortCol === col.name,
                    }"
                  >
                    <button
                      type="button"
                      class="th-sort-btn"
                      @click="handleSort(col.name)"
                    >
                      <span class="mono">{{ col.name }}</span>
                      <svg
                        v-if="currentSortCol === col.name"
                        class="i i-s sort-icon"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          v-if="currentSortDesc"
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
                    v-for="col in currentTable?.columns || []"
                    :key="'filter-' + col.name"
                    class="filter-cell"
                  >
                    <!-- Boolean select -->
                    <select
                      v-if="col.type === 'boolean'"
                      class="filter-input filter-select"
                      v-model="colFilters[col.name]"
                      @change="applyColFilters"
                    >
                      <option value="">Усі</option>
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>

                    <!-- Enum select -->
                    <select
                      v-else-if="col.type === 'enum' && col.enum_values"
                      class="filter-input filter-select"
                      v-model="colFilters[col.name]"
                      @change="applyColFilters"
                    >
                      <option value="">Усі</option>
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
                      :placeholder="'Фільтр ' + col.name"
                      v-model="colFilters[col.name]"
                      @keydown.enter="applyColFilters"
                      @blur="applyColFilters"
                    />
                  </th>
                </tr>
              </thead>

              <tbody>
                <!-- Loading State -->
                <tr v-if="rowsLoading">
                  <td
                    :colspan="currentTable?.columns.length || 1"
                    class="state-cell muted"
                  >
                    Завантаження даних...
                  </td>
                </tr>

                <!-- Error State -->
                <tr v-else-if="rowsError">
                  <td
                    :colspan="currentTable?.columns.length || 1"
                    class="state-cell error"
                  >
                    {{ rowsError }}
                    <button
                      type="button"
                      class="btn btn-outlined btn-sm retry-btn"
                      @click="fetchRows"
                    >
                      Повторити
                    </button>
                  </td>
                </tr>

                <!-- Empty State -->
                <tr v-else-if="rows.length === 0">
                  <td
                    :colspan="currentTable?.columns.length || 1"
                    class="state-cell muted"
                  >
                    Записів не знайдено
                  </td>
                </tr>

                <!-- Data Rows -->
                <tr
                  v-for="(row, idx) in rows"
                  :key="idx"
                  :class="{ sel: isRowSelected(row) }"
                  @click="openRowDetail(row)"
                >
                  <td
                    v-for="col in currentTable?.columns || []"
                    :key="col.name"
                    :class="{
                      num: col.type === 'integer' || col.type === 'number',
                      mono:
                        col.type === 'uuid' ||
                        col.type === 'datetime' ||
                        col.type === 'date' ||
                        col.name === 'id',
                    }"
                  >
                    <!-- Null value -->
                    <span
                      v-if="row[col.name] === null || row[col.name] === undefined"
                      class="cell-null muted mono"
                    >
                      порожнє
                    </span>

                    <!-- Foreign Key Link -->
                    <template v-else-if="col.foreign_key && parseFk(col.foreign_key)">
                      <router-link
                        :to="{
                          path: `/tables/${parseFk(col.foreign_key)?.table}`,
                          query: {
                            filter: `${parseFk(col.foreign_key)?.column}:${row[col.name]}`,
                          },
                        }"
                        class="badge b-link"
                        :title="`Відкрити у таблиці ${parseFk(col.foreign_key)?.table}`"
                        @click.stop
                      >
                        {{ truncate(String(row[col.name]), 25) }}
                      </router-link>
                    </template>

                    <!-- Boolean Badge -->
                    <span
                      v-else-if="col.type === 'boolean'"
                      :class="['badge', row[col.name] ? 'b-ok' : '']"
                    >
                      {{ row[col.name] ? '✓ так' : '× ні' }}
                    </span>

                    <!-- Truncated Text & JSON with Full Value in Tooltip -->
                    <span
                      v-else
                      class="cell-text"
                      :title="getFullCellTooltip(row[col.name], col.type)"
                    >
                      {{ truncate(formatCellValue(row[col.name], col.type), 45) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination Bar -->
          <nav class="pagination-bar" aria-label="Сторінки">
            <span class="mono muted pagination-info">{{ paginationInfo }}</span>

            <span class="pagination-spacer"></span>

            <button
              type="button"
              class="btn btn-icon btn-sm"
              aria-label="Попередня сторінка"
              :disabled="currentPage <= 1 || rowsLoading"
              @click="goToPage(currentPage - 1)"
            >
              <svg class="i i-s" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>

            <!-- Current page and nearby pages -->
            <button
              v-if="currentPage > 2"
              type="button"
              class="btn btn-sm page-btn"
              @click="goToPage(1)"
            >
              1
            </button>

            <span v-if="currentPage > 3" class="muted">…</span>

            <button
              v-if="currentPage > 1"
              type="button"
              class="btn btn-sm page-btn"
              @click="goToPage(currentPage - 1)"
            >
              {{ currentPage - 1 }}
            </button>

            <button
              type="button"
              class="btn btn-sm btn-tonal page-btn"
              aria-current="page"
            >
              {{ currentPage }}
            </button>

            <button
              v-if="currentPage < totalPages"
              type="button"
              class="btn btn-sm page-btn"
              @click="goToPage(currentPage + 1)"
            >
              {{ currentPage + 1 }}
            </button>

            <span v-if="currentPage < totalPages - 2" class="muted">…</span>

            <button
              v-if="currentPage < totalPages - 1"
              type="button"
              class="btn btn-sm page-btn"
              @click="goToPage(totalPages)"
            >
              {{ totalPages }}
            </button>

            <button
              type="button"
              class="btn btn-icon btn-sm"
              aria-label="Наступна сторінка"
              :disabled="currentPage >= totalPages || rowsLoading"
              @click="goToPage(currentPage + 1)"
            >
              <svg class="i i-s" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>

    <!-- Side Panel Form -->
    <RowFormPanel
      v-if="currentTable"
      :table="currentTable"
      :row="selectedRow"
      :is-open="isPanelOpen"
      @close="closePanel"
      @saved="handleRowSaved"
      @deleted="handleRowDeleted"
    />
  </div>
</template>

<style scoped>
.tables-view {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--bpt-sp-4);
  width: 100%;
  min-width: 0;
}

/* Left Sub-navigation: Table list */
.table-list-card {
  flex: 1 1 200px;
  max-width: var(--bpt-w-table-list);
  padding: var(--bpt-sp-3) var(--bpt-sp-2);
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
  border: 1px solid var(--md-sys-color-outline-variant);
}

.table-list-title {
  padding: var(--bpt-sp-1) var(--bpt-sp-3) var(--bpt-sp-2);
}

.table-list-status {
  padding: var(--bpt-sp-2) var(--bpt-sp-3);
  font-size: var(--bpt-fs-cell);
}

.table-list-status.error {
  color: var(--md-sys-color-error);
}

.table-links {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.table-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--bpt-sp-2);
  height: 36px;
  padding: 0 var(--bpt-sp-3);
  border-radius: var(--bpt-radius-full);
  color: var(--md-sys-color-on-surface-variant);
  text-decoration: none;
  font-size: var(--bpt-fs-log);
  line-height: var(--bpt-lh-log);
  transition: background-color var(--bpt-dur-short) var(--bpt-ease-standard),
              color var(--bpt-dur-short) var(--bpt-ease-standard);
}

.table-link:hover {
  background: var(--bpt-state-hover);
  color: var(--md-sys-color-on-surface);
}

.table-link-active,
.table-link[aria-current='page'] {
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}

.table-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.table-label {
  font-size: var(--bpt-fs-label);
  line-height: var(--bpt-lh-label);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90px;
}

/* Main Area */
.table-content-area {
  flex: 999 1 560px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--bpt-sp-4);
}

/* Index View (/tables) */
.table-index-view {
  display: flex;
  flex-direction: column;
  gap: var(--bpt-sp-4);
}

.index-header {
  display: flex;
  flex-direction: column;
  gap: var(--bpt-sp-1);
}

.page-title {
  font-size: var(--bpt-fs-title-page);
  line-height: var(--bpt-lh-title-page);
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
}

.empty-card {
  padding: var(--bpt-sp-8);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--bpt-sp-3);
  border: 1px solid var(--md-sys-color-outline-variant);
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--bpt-sp-4);
}

.table-card {
  padding: var(--bpt-sp-4);
  display: flex;
  flex-direction: column;
  gap: var(--bpt-sp-2);
  border: 1px solid var(--md-sys-color-outline-variant);
  transition: transform var(--bpt-dur-short) var(--bpt-ease-standard),
              border-color var(--bpt-dur-short) var(--bpt-ease-standard);
  text-decoration: none;
}

.table-card:hover {
  transform: translateY(-2px);
  border-color: var(--md-sys-color-outline);
}

.table-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.table-card-count {
  font-size: var(--bpt-fs-label);
}

.table-card-title {
  font-size: var(--bpt-fs-title);
  line-height: var(--bpt-lh-title);
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
}

.table-card-pks {
  font-size: var(--bpt-fs-label);
}

.table-card-badges {
  display: flex;
  gap: var(--bpt-sp-1);
  flex-wrap: wrap;
  margin-top: auto;
  padding-top: var(--bpt-sp-2);
}

/* Data Grid View (/tables/:name) */
.table-grid-view {
  display: flex;
  flex-direction: column;
  gap: var(--bpt-sp-4);
}

.view-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--bpt-sp-3);
  flex-wrap: wrap;
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: var(--bpt-sp-1);
}

.table-header-desc {
  font-size: var(--bpt-fs-cell);
}

.table-title {
  font-size: var(--bpt-fs-title-page);
  line-height: var(--bpt-lh-title-page);
  font-weight: 500;
  color: var(--md-sys-color-on-surface);
}

.data-card {
  overflow: hidden;
  border: 1px solid var(--md-sys-color-outline-variant);
}

/* Toolbar */
.table-toolbar {
  display: flex;
  gap: var(--bpt-sp-3);
  padding: var(--bpt-sp-3);
  align-items: center;
  flex-wrap: wrap;
}

.search-wrap {
  flex: 1 1 240px;
  max-width: 360px;
}

.btn-icon-clear {
  background: none;
  border: none;
  color: var(--md-sys-color-on-surface-variant);
  cursor: pointer;
  padding: 4px;
}

.active-chips {
  display: flex;
  align-items: center;
  gap: var(--bpt-sp-2);
  flex-wrap: wrap;
}

/* Table */
.table-scroll-container {
  overflow-x: auto;
  max-width: 100%;
}

.tbl {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: var(--bpt-fs-cell);
}

.tbl th {
  text-align: left;
  font-weight: 500;
  font-size: var(--bpt-fs-label);
  color: var(--md-sys-color-on-surface-variant);
  height: 40px;
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
  gap: 4px;
  align-items: center;
  cursor: pointer;
  color: inherit;
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
}

.tbl .state-cell.error {
  color: var(--md-sys-color-error);
}

.retry-btn {
  margin-left: var(--bpt-sp-3);
}

.cell-null {
  font-size: var(--bpt-fs-label);
}

.cell-text {
  display: inline-block;
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
}

/* Pagination Bar */
.pagination-bar {
  display: flex;
  align-items: center;
  gap: var(--bpt-sp-2);
  padding: var(--bpt-sp-3);
  flex-wrap: wrap;
}

.pagination-info {
  font-size: var(--bpt-fs-cell);
}

.pagination-spacer {
  flex: 1;
}

.page-btn {
  width: 32px;
  padding: 0;
}
</style>
