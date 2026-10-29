import { request } from './api';

export type UsageGroupBy = 'user' | 'module' | 'client' | 'day' | 'route';

export interface UsageStatItem {
  /** user id (or "anonymous"), module, client, YYYY-MM-DD day or route, depending on group_by */
  key: string;
  label: string | null;
  requests: number;
  errors: number;
  client_errors: number;
  avg_ms: number;
  p95_ms: number;
}

export interface UserOverviewItem {
  email: string;
  display_name: string | null;
  created_at: string;
  last_request_at: string | null;
  requests_30d: number;
  measurements_total: number;
  measurements_30d: number;
  prescriptions_active: number;
  intake_reports_30d: number;
  menu_generations_30d: number;
  webauthn_credentials: number;
  active_sessions: number;
}

export interface RequestEvent {
  id: string;
  occurred_at: string;
  user_id: string | null;
  client: string;
  module: string;
  method: string;
  route: string;
  status_code: number;
  duration_ms: number;
}

export interface ErrorEvent {
  id: string;
  occurred_at: string;
  user_id: string | null;
  method: string;
  route: string;
  exception_type: string;
  message: string;
  traceback: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface UsageParams {
  date_from?: string;
  date_to?: string;
  group_by?: UsageGroupBy;
  user_id?: string;
  module?: string;
}

export interface EventsParams {
  date_from?: string;
  date_to?: string;
  user_id?: string;
  module?: string;
  client?: string;
  status_min?: number;
  status_max?: number;
  limit?: number;
  offset?: number;
}

export interface ErrorsParams {
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

function withQuery(path: string, params: object): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  }
  const qs = query.toString();
  return qs ? `${path}?${qs}` : path;
}

export const adminActivityApi = {
  getUsage: async (params: UsageParams = {}): Promise<UsageStatItem[]> => {
    return request<UsageStatItem[]>(withQuery('/admin/stats/usage', params));
  },

  getOverview: async (): Promise<UserOverviewItem[]> => {
    return request<UserOverviewItem[]>('/admin/stats/overview');
  },

  listEvents: async (params: EventsParams = {}): Promise<Paginated<RequestEvent>> => {
    return request<Paginated<RequestEvent>>(withQuery('/admin/events', params));
  },

  listErrors: async (params: ErrorsParams = {}): Promise<Paginated<ErrorEvent>> => {
    return request<Paginated<ErrorEvent>>(withQuery('/admin/errors', params));
  },

  getError: async (id: string): Promise<ErrorEvent> => {
    return request<ErrorEvent>(`/admin/errors/${encodeURIComponent(id)}`);
  },
};
