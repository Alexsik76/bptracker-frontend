import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export function useTableQuery() {
  const route = useRoute();
  const router = useRouter();

  // Local state synchronized with route query
  const searchInput = ref('');
  const colFilters = ref<Record<string, string>>({});

  // Current page (1-based, default: 1)
  const currentPage = computed(() => {
    const p = parseInt(route.query.page as string, 10);
    return isNaN(p) || p < 1 ? 1 : p;
  });

  // Current sort column and direction
  const currentSortCol = computed(() => (route.query.order_by as string) || null);
  const currentSortDesc = computed(() => route.query.desc === 'true');

  // Active filter strings from URL query (e.g. ['role:admin', 'status:active'])
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

  // Route query updater helper
  function updateQuery(newQueryParams: Record<string, string | string[] | undefined>) {
    const q = { ...route.query, ...newQueryParams };
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

  // Column filters handlers
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

  // Pagination helper
  function goToPage(page: number, totalPages?: number) {
    if (page < 1 || (totalPages !== undefined && page > totalPages) || page === currentPage.value) {
      return;
    }
    updateQuery({ page: page === 1 ? undefined : String(page) });
  }

  return {
    currentPage,
    currentSortCol,
    currentSortDesc,
    activeFilterList,
    parsedFilters,
    searchInput,
    colFilters,
    syncFiltersFromRoute,
    updateQuery,
    handleSearchSubmit,
    handleSearchClear,
    handleSort,
    applyColFilters,
    removeFilter,
    clearAllFilters,
    goToPage,
  };
}
