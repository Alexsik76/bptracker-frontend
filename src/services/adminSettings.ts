import { request } from './api';

export type SettingType = 'str' | 'int' | 'bool';
export type SettingValue = string | number | boolean;

export interface SettingConstraints {
  min?: number;
  max?: number;
  min_length?: number;
}

export interface AdminSetting {
  key: string;
  label: string;
  type: SettingType;
  constraints: SettingConstraints;
  value: SettingValue;
  /** "db" = changed in the panel, "env" = taken from the stack settings */
  source: 'db' | 'env';
  env_value: SettingValue;
  updated_at: string | null;
  updated_by: string | null;
}

export interface GeminiModel {
  name: string;
  display_name: string;
  input_token_limit: number | null;
  output_token_limit: number | null;
}

export interface AiTestResult {
  ok: boolean;
  model: string;
  latency_ms: number;
  error: string | null;
}

/** Settings edited on the "AI models" tab; everything else goes to "Parameters". */
export const AI_SETTING_KEYS = [
  'ai.gemini.analyze_model',
  'ai.gemini.menu_model',
  'ai.gemini.timeout_seconds',
  'ai.llm_exchange_log',
] as const;

/** Settings that hold a Gemini model name and get a connection test. */
export const AI_MODEL_KEYS = ['ai.gemini.analyze_model', 'ai.gemini.menu_model'] as const;

export const adminSettingsApi = {
  list: async (): Promise<AdminSetting[]> => {
    return request<AdminSetting[]>('/admin/settings');
  },

  update: async (key: string, value: SettingValue): Promise<AdminSetting> => {
    return request<AdminSetting>(`/admin/settings/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  },

  reset: async (key: string): Promise<void> => {
    return request<void>(`/admin/settings/${encodeURIComponent(key)}`, { method: 'DELETE' });
  },

  listAiModels: async (): Promise<GeminiModel[]> => {
    return request<GeminiModel[]>('/admin/settings/ai/models');
  },

  testAi: async (model?: string): Promise<AiTestResult> => {
    return request<AiTestResult>('/admin/settings/ai/test', {
      method: 'POST',
      body: JSON.stringify(model ? { model } : {}),
    });
  },
};
