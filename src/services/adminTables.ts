import { request } from './api';

export type ColumnType =
  | 'string'
  | 'text'
  | 'integer'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'uuid'
  | 'json'
  | 'enum';

export interface ColumnMetadata {
  name: string;
  type: ColumnType;
  nullable: boolean;
  read_only: boolean;
  foreign_key: string | null;
  enum_values: string[] | null;
}

export interface TableMetadata {
  name: string;
  label: string;
  primary_key: string[];
  columns: ColumnMetadata[];
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
}

export interface RowsResponse {
  items: Record<string, unknown>[];
  total: number;
  limit: number;
  offset: number;
}

export interface ListRowsParams {
  limit?: number;
  offset?: number;
  order_by?: string;
  desc?: boolean;
  search?: string;
  filter?: string[];
}

export interface CreateRowRequest {
  values: Record<string, unknown>;
}

export interface UpdateRowRequest {
  pk: Record<string, unknown>;
  values: Record<string, unknown>;
}

export interface DeleteRowRequest {
  pk: Record<string, unknown>;
}

export const adminTablesApi = {
  getTables: async (): Promise<TableMetadata[]> => {
    return request<TableMetadata[]>('/admin/tables');
  },

  listRows: async (name: string, params: ListRowsParams = {}): Promise<RowsResponse> => {
    const query = new URLSearchParams();
    if (params.limit !== undefined) {
      query.set('limit', String(params.limit));
    }
    if (params.offset !== undefined) {
      query.set('offset', String(params.offset));
    }
    if (params.order_by) {
      query.set('order_by', params.order_by);
    }
    if (params.desc !== undefined) {
      query.set('desc', String(params.desc));
    }
    if (params.search) {
      query.set('search', params.search);
    }
    if (params.filter && params.filter.length > 0) {
      for (const f of params.filter) {
        query.append('filter', f);
      }
    }

    const qs = query.toString();
    const url = `/admin/tables/${encodeURIComponent(name)}/rows${qs ? `?${qs}` : ''}`;
    return request<RowsResponse>(url);
  },

  createRow: async (name: string, values: Record<string, unknown>): Promise<Record<string, unknown>> => {
    return request<Record<string, unknown>>(`/admin/tables/${encodeURIComponent(name)}/rows`, {
      method: 'POST',
      body: JSON.stringify({ values }),
    });
  },

  updateRow: async (
    name: string,
    pk: Record<string, unknown>,
    values: Record<string, unknown>
  ): Promise<Record<string, unknown>> => {
    return request<Record<string, unknown>>(`/admin/tables/${encodeURIComponent(name)}/rows`, {
      method: 'PATCH',
      body: JSON.stringify({ pk, values }),
    });
  },

  deleteRow: async (name: string, pk: Record<string, unknown>): Promise<void> => {
    return request<void>(`/admin/tables/${encodeURIComponent(name)}/rows/delete`, {
      method: 'POST',
      body: JSON.stringify({ pk }),
    });
  },
};
