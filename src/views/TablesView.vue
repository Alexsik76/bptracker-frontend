<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { TableMetadata } from '../services/adminTables';
import { useTableQuery } from '../composables/useTableQuery';
import { useTableData } from '../composables/useTableData';
import TableListNav from '../components/tables/TableListNav.vue';
import GridToolbar from '../components/tables/GridToolbar.vue';
import DataGrid from '../components/tables/DataGrid.vue';
import GridPagination from '../components/tables/GridPagination.vue';
import RowFormPanel from '../components/admin/RowFormPanel.vue';

const route = useRoute();
const router = useRouter();

const {
  currentPage,
  currentSortCol,
  currentSortDesc,
  activeFilterList,
  parsedFilters,
  searchInput,
  colFilters,
  syncFiltersFromRoute,
  handleSearchSubmit,
  handleSearchClear,
  handleSort,
  applyColFilters,
  removeFilter,
  clearAllFilters,
  goToPage,
} = useTableQuery();

const {
  tables,
  tablesLoading,
  tablesError,
  rows,
  totalRows,
  rowsLoading,
  rowsError,
  PAGE_SIZE,
  fetchTables,
  fetchRows,
} = useTableData();

// Current table identifier and metadata
const currentTableName = computed(() => (route.params.name as string) || '');
const currentTable = computed(() =>
  tables.value.find((t) => t.name === currentTableName.value)
);

// Side sheet panel state
const selectedRow = ref<Record<string, unknown> | null>(null);
const isPanelOpen = ref(false);

const gridToolbarRef = ref<InstanceType<typeof GridToolbar> | null>(null);

function handleTableRedirect(metadataList: TableMetadata[]) {
  if (currentTableName.value) return;

  let target = 'users';
  try {
    const last = localStorage.getItem('bpt_last_table');
    if (last && metadataList.some((t) => t.name === last)) {
      target = last;
    } else if (metadataList.some((t) => t.name === 'users')) {
      target = 'users';
    } else if (metadataList.length > 0) {
      target = metadataList[0].name;
    }
  } catch (e) {
    if (metadataList.some((t) => t.name === 'users')) {
      target = 'users';
    } else if (metadataList.length > 0) {
      target = metadataList[0].name;
    }
  }

  router.replace({ path: `/tables/${target}` });
}

// Remember the last opened table
watch(
  currentTableName,
  (name) => {
    if (name) {
      try {
        localStorage.setItem('bpt_last_table', name);
      } catch (e) {
        // ignore localStorage errors
      }
    }
  },
  { immediate: true }
);

function loadRows() {
  if (!currentTableName.value) return;
  fetchRows(currentTableName.value, {
    page: currentPage.value,
    sortCol: currentSortCol.value,
    sortDesc: currentSortDesc.value,
    search: (route.query.search as string) || undefined,
    filterList: activeFilterList.value,
  });
}

// Side sheet handlers
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
  loadRows();
}

function handleRowDeleted() {
  loadRows();
}

// Listen to route changes to update filters and fetch rows
watch(
  () => [route.params.name, route.query],
  () => {
    syncFiltersFromRoute();
    loadRows();
  },
  { immediate: true }
);

// Listen to path changes when user directly hits /tables
watch(
  () => route.path,
  (path) => {
    if (path === '/tables' || !route.params.name) {
      if (tables.value.length > 0) {
        handleTableRedirect(tables.value);
      }
    }
  }
);

function handleGlobalKeyDown(e: KeyboardEvent) {
  if (
    e.key === '/' &&
    !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
  ) {
    e.preventDefault();
    gridToolbarRef.value?.focusInput();
  }
}

onMounted(async () => {
  const loadedTables = await fetchTables();
  if (!currentTableName.value) {
    handleTableRedirect(loadedTables);
  }
  window.addEventListener('keydown', handleGlobalKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeyDown);
});
</script>

<template>
  <div class="tables-view">
    <!-- Left Navigation: List of tables -->
    <TableListNav
      :tables="tables"
      :current-table-name="currentTableName"
      :loading="tablesLoading"
      :error="tablesError"
    />

    <!-- Main Content Area -->
    <div class="table-content-area">
      <!-- Loading metadata state when no table name is resolved yet -->
      <div v-if="!currentTableName && tablesLoading" class="card empty-card muted">
        Loading metadata...
      </div>

      <div v-else-if="!currentTableName && tablesError" class="card empty-card error">
        {{ tablesError }}
        <button type="button" class="btn btn-outlined btn-sm" @click="fetchTables">
          Retry
        </button>
      </div>

      <!-- Table selected (/tables/:name) -->
      <div v-else-if="currentTableName" class="table-grid-view">
        <!-- Table Action Header: table name in mono as title; no subtitle -->
        <div class="view-header">
          <div class="header-info">
            <h1 class="table-title mono">{{ currentTable?.name || currentTableName }}</h1>
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
            <span>Add record</span>
          </button>
        </div>

        <!-- Data Card -->
        <div class="card data-card">
          <!-- Toolbar -->
          <GridToolbar
            ref="gridToolbarRef"
            v-model:search="searchInput"
            :parsed-filters="parsedFilters"
            @search="handleSearchSubmit"
            @clear-search="handleSearchClear"
            @remove-filter="removeFilter"
            @clear-all="clearAllFilters"
          />

          <!-- Data Grid -->
          <DataGrid
            v-if="currentTable"
            :table="currentTable"
            :rows="rows"
            :loading="rowsLoading"
            :error="rowsError"
            :sort-col="currentSortCol"
            :sort-desc="currentSortDesc"
            :col-filters="colFilters"
            :selected-row="selectedRow"
            @sort="handleSort"
            @apply-filters="applyColFilters"
            @retry="loadRows"
            @select-row="openRowDetail"
          />

          <!-- Pagination -->
          <GridPagination
            :current-page="currentPage"
            :total-rows="totalRows"
            :page-size="PAGE_SIZE"
            :loading="rowsLoading"
            @page-change="goToPage($event, Math.max(1, Math.ceil(totalRows / PAGE_SIZE)))"
          />
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

.table-content-area {
  flex: 999 1 560px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--bpt-sp-4);
}

.table-grid-view {
  display: flex;
  flex-direction: column;
  gap: var(--bpt-sp-4);
  min-width: 0;
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

.table-title {
  font-size: var(--bpt-fs-title-page);
  line-height: var(--bpt-lh-title-page);
  font-weight: 500;
  font-family: var(--bpt-font-mono);
  color: var(--md-sys-color-on-surface);
}

.data-card {
  overflow: hidden;
  border: 1px solid var(--md-sys-color-outline-variant);
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

.empty-card.error {
  color: var(--md-sys-color-error);
}
</style>
