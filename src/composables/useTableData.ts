import { ref } from 'vue';
import type { TableMetadata, RowsResponse, ListRowsParams } from '../services/adminTables';
import { adminTablesApi } from '../services/adminTables';
import { ApiError } from '../services/api';

export const PAGE_SIZE = 50;

export interface FetchRowsOptions {
  page?: number;
  sortCol?: string | null;
  sortDesc?: boolean;
  search?: string;
  filterList?: string[];
}

export function useTableData() {
  const tables = ref<TableMetadata[]>([]);
  const tablesLoading = ref(true);
  const tablesError = ref<string | null>(null);

  const rows = ref<Record<string, unknown>[]>([]);
  const totalRows = ref(0);
  const rowsLoading = ref(false);
  const rowsError = ref<string | null>(null);

  // Fetch metadata for all tables
  async function fetchTables(): Promise<TableMetadata[]> {
    tablesLoading.value = true;
    tablesError.value = null;
    try {
      const data = await adminTablesApi.getTables();
      tables.value = data;
      return data;
    } catch (err: unknown) {
      console.error('Failed to load tables metadata:', err);
      tablesError.value =
        err instanceof ApiError ? err.message : 'Failed to load tables list';
      return [];
    } finally {
      tablesLoading.value = false;
    }
  }

  // Fetch rows for a specific table
  async function fetchRows(tableName: string, options: FetchRowsOptions = {}): Promise<void> {
    if (!tableName) {
      rows.value = [];
      totalRows.value = 0;
      return;
    }

    rowsLoading.value = true;
    rowsError.value = null;

    try {
      const page = options.page && options.page > 0 ? options.page : 1;
      const offset = (page - 1) * PAGE_SIZE;

      const params: ListRowsParams = {
        limit: PAGE_SIZE,
        offset,
        order_by: options.sortCol || undefined,
        desc: options.sortDesc ? true : undefined,
        search: options.search || undefined,
        filter: options.filterList && options.filterList.length > 0 ? options.filterList : undefined,
      };

      const res: RowsResponse = await adminTablesApi.listRows(tableName, params);
      rows.value = res.items;
      totalRows.value = res.total;
    } catch (err: unknown) {
      console.error('Failed to load table rows:', err);
      rowsError.value =
        err instanceof ApiError ? err.message : 'Failed to load table data';
    } finally {
      rowsLoading.value = false;
    }
  }

  return {
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
  };
}
