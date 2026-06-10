import type {
  Measurement,
  CreateMeasurementDto,
  User,
  UserSettings,
  TreatmentSchema,
  CreateSchemaDto,
  UpdateSchemaDto,
  ReminderTemplate,
  IntakeReport,
  PushSubscribeDto,
} from '../types/api';
import type { components } from '../types/photo-api';
import type { RegistrationResponseJSON, AuthenticationResponseJSON } from '@simplewebauthn/browser';
import { ApiError, httpStatusToCode } from '../utils/apiError';

type PhotoApiUploadBody = components['schemas']['Body_upload_image_images_upload_post'];

declare global {
  interface Window {
    CONFIG: {
      API_BASE_URL: string;
      CHART_DAYS_LIMIT: number;
    };
  }
}

const FALLBACK_API_URL = 'https://api-bptracker.home.vn.ua/api/v1';
const DEV_PROXY_URL = '/api/v1';

function resolveApiBaseUrl(): string {
  if (import.meta.env.DEV) return DEV_PROXY_URL;
  const raw = window.CONFIG?.API_BASE_URL;
  if (!raw) return FALLBACK_API_URL;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:') {
      console.warn('[API] API_BASE_URL must use https — falling back to default');
      return FALLBACK_API_URL;
    }
    return raw;
  } catch {
    console.warn('[API] API_BASE_URL is not a valid URL — falling back to default');
    return FALLBACK_API_URL;
  }
}

const API_BASE_URL = resolveApiBaseUrl();

const DEV_BYPASS = import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

export function useApi() {
  async function _fetch(url: string, options: RequestInit = {}) {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
    });

    if (response.status === 401 && !url.includes('/auth/me') && !DEV_BYPASS) {
      window.dispatchEvent(new CustomEvent('api:unauthorized'));
    }

    return response;
  }

  // Auth
  async function checkMe(): Promise<User | null> {
    try {
      const res = await _fetch(`${API_BASE_URL}/auth/me`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async function logout() {
    await _fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' });
  }

  async function requestMagicLink(email: string) {
    const res = await _fetch(`${API_BASE_URL}/auth/magic-link/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new ApiError(httpStatusToCode(res.status), `HTTP ${res.status}`);
    return true;
  }

  async function consumeMagicLink(token: string) {
    const res = await _fetch(`${API_BASE_URL}/auth/magic-link/consume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) throw new ApiError(httpStatusToCode(res.status), `HTTP ${res.status}`);
    return true;
  }

  // Passkey
  async function registerPasskeyBegin(email: string) {
    const res = await _fetch(`${API_BASE_URL}/auth/passkey/register/begin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new ApiError(httpStatusToCode(res.status), `HTTP ${res.status}`);
    return await res.json();
  }

  async function registerPasskeyComplete(data: RegistrationResponseJSON) {
    const res = await _fetch(`${API_BASE_URL}/auth/passkey/register/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new ApiError(httpStatusToCode(res.status), `HTTP ${res.status}`);
    return await res.json();
  }

  async function loginPasskeyBegin() {
    const res = await _fetch(`${API_BASE_URL}/auth/login/begin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!res.ok) throw new ApiError(httpStatusToCode(res.status), `HTTP ${res.status}`);
    return await res.json();
  }

  async function loginPasskeyComplete(data: AuthenticationResponseJSON) {
    const res = await _fetch(`${API_BASE_URL}/auth/login/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new ApiError(httpStatusToCode(res.status), `HTTP ${res.status}`);
    return await res.json();
  }

  // Measurements
  async function getMeasurements(signal?: AbortSignal): Promise<Measurement[]> {
    const res = await _fetch(`${API_BASE_URL}/measurements?days=90`, { signal });
    if (!res.ok) throw new ApiError(httpStatusToCode(res.status), `HTTP ${res.status}`);
    return await res.json();
  }

  async function addMeasurement(data: CreateMeasurementDto): Promise<Measurement> {
    const res = await _fetch(`${API_BASE_URL}/measurements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new ApiError(httpStatusToCode(res.status), `HTTP ${res.status}`);
    return await res.json();
  }

  async function deleteMeasurement(id: string) {
    const res = await _fetch(`${API_BASE_URL}/measurements/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new ApiError(httpStatusToCode(res.status), `HTTP ${res.status}`);
  }

  async function addMeasurementWithPhoto(formData: FormData): Promise<Measurement> {
    const res = await _fetch(`${API_BASE_URL}/measurements/with-photo`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(httpStatusToCode(res.status), body.error ?? `HTTP ${res.status}`);
    }
    return await res.json();
  }

  // Settings
  async function getSettings(): Promise<UserSettings> {
    const res = await _fetch(`${API_BASE_URL}/settings`);
    if (!res.ok) throw new ApiError(httpStatusToCode(res.status), `HTTP ${res.status}`);
    return await res.json();
  }

  async function patchSettings(data: Partial<UserSettings>): Promise<UserSettings> {
    const res = await _fetch(`${API_BASE_URL}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new ApiError(httpStatusToCode(res.status), `HTTP ${res.status}`);
    return await res.json();
  }

  async function analyzeImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    const res = await _fetch(`${API_BASE_URL}/measurements/analyze`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(httpStatusToCode(res.status), body.error ?? `HTTP ${res.status}`);
    }
    return await res.json();
  }

  async function getActiveSchema(signal?: AbortSignal): Promise<TreatmentSchema | null> {
    try {
      const res = await _fetch(`${API_BASE_URL}/schemas/active`, { signal });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async function getSchemas(signal?: AbortSignal): Promise<TreatmentSchema[]> {
    const res = await _fetch(`${API_BASE_URL}/schemas`, { signal });
    if (!res.ok) throw new ApiError(httpStatusToCode(res.status), `HTTP ${res.status}`);
    return await res.json();
  }

  async function createSchema(data: CreateSchemaDto): Promise<TreatmentSchema> {
    const res = await _fetch(`${API_BASE_URL}/schemas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new ApiError(httpStatusToCode(res.status), `HTTP ${res.status}`);
    return await res.json();
  }

  async function updateSchema(id: string, data: UpdateSchemaDto): Promise<TreatmentSchema> {
    const res = await _fetch(`${API_BASE_URL}/schemas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new ApiError(httpStatusToCode(res.status), `HTTP ${res.status}`);
    return await res.json();
  }

  async function activateSchema(id: string): Promise<void> {
    const res = await _fetch(`${API_BASE_URL}/schemas/${id}/activate`, { method: 'POST' });
    if (!res.ok) throw new ApiError(httpStatusToCode(res.status), `HTTP ${res.status}`);
  }

  async function deleteSchema(id: string): Promise<void> {
    const res = await _fetch(`${API_BASE_URL}/schemas/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new ApiError(httpStatusToCode(res.status), `HTTP ${res.status}`);
  }

  async function uploadMeasurementPhoto(
    id: string,
    blob: Blob,
    measurement: { sys: number; dia: number; pul: number; recordedAt: string },
    aiResult: { sys: number; dia: number; pul: number } | null,
    source: 'local_ocr' | 'user_confirmed',
    ocrMeta?: components['schemas']['OcrMeta'] | null,
  ): Promise<void> {
    // Typed against photo-api schema — tsc will error here when photo-api adds required fields
    const body: Omit<PhotoApiUploadBody, 'file' | 'device_model' | 'corrected_by_user'> = {
      sys: measurement.sys,
      dia: measurement.dia,
      pul: measurement.pul,
      timestamp: measurement.recordedAt,
      source,
      ...(aiResult ? {
        ai_suggested_sys: aiResult.sys,
        ai_suggested_dia: aiResult.dia,
        ai_suggested_pul: aiResult.pul,
      } : undefined),
      ...(ocrMeta ? { ocr_meta: ocrMeta } : undefined),
    };

    const formData = new FormData();
    formData.append('image', blob, 'photo.jpg');
    for (const [key, value] of Object.entries(body)) {
      if (value !== null && value !== undefined) {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
    }
    await _fetch(`${API_BASE_URL}/measurements/${id}/photo`, {
      method: 'POST',
      body: formData,
    });
  }

  async function exportCsv() {
    const res = await _fetch(`${API_BASE_URL}/export/csv`, { method: 'POST' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(httpStatusToCode(res.status), body.error ?? `HTTP ${res.status}`);
    }
    return await res.json();
  }

  async function getVapidPublicKey(): Promise<{ publicKey: string }> {
    const res = await _fetch(`${API_BASE_URL}/push/vapid-public-key`);
    if (!res.ok) throw new ApiError(httpStatusToCode(res.status), `HTTP ${res.status}`);
    return await res.json();
  }

  async function subscribePush(data: PushSubscribeDto): Promise<{ status: string }> {
    const res = await _fetch(`${API_BASE_URL}/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new ApiError(httpStatusToCode(res.status), `HTTP ${res.status}`);
    return await res.json();
  }

  async function unsubscribePush(endpoint: string): Promise<void> {
    const res = await _fetch(`${API_BASE_URL}/push/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint }),
    });
    if (!res.ok) throw new ApiError(httpStatusToCode(res.status), `HTTP ${res.status}`);
  }

  async function getActiveTemplate(): Promise<ReminderTemplate | null> {
    const res = await _fetch(`${API_BASE_URL}/reminders/template/active`);
    if (res.status === 404) return null;
    if (!res.ok) throw new ApiError(httpStatusToCode(res.status), `HTTP ${res.status}`);
    return await res.json();
  }

  async function confirmIntake(period: string): Promise<IntakeReport> {
    const res = await _fetch(`${API_BASE_URL}/reminders/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period }),
    });
    if (!res.ok) throw new ApiError(httpStatusToCode(res.status), `HTTP ${res.status}`);
    return await res.json();
  }

  async function getReminderReports(days: number): Promise<IntakeReport[]> {
    const res = await _fetch(`${API_BASE_URL}/reminders/reports?days=${days}`);
    if (!res.ok) throw new ApiError(httpStatusToCode(res.status), `HTTP ${res.status}`);
    return await res.json();
  }

  return {
    checkMe,
    logout,
    requestMagicLink,
    consumeMagicLink,
    registerPasskeyBegin,
    registerPasskeyComplete,
    loginPasskeyBegin,
    loginPasskeyComplete,
    getMeasurements,
    addMeasurement,
    addMeasurementWithPhoto,
    deleteMeasurement,
    getSettings,
    patchSettings,
    analyzeImage,
    uploadMeasurementPhoto,
    exportCsv,
    getActiveSchema,
    getSchemas,
    createSchema,
    updateSchema,
    activateSchema,
    deleteSchema,
    getVapidPublicKey,
    subscribePush,
    unsubscribePush,
    getActiveTemplate,
    confirmIntake,
    getReminderReports,
  };
}
