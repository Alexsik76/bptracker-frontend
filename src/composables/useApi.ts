import type {
  Measurement,
  CreateMeasurementDto,
  User,
  UserSettings,
  TreatmentSchema,
} from '../types/api';
import type { RegistrationResponseJSON, AuthenticationResponseJSON } from '@simplewebauthn/browser';

declare global {
  interface Window {
    CONFIG: {
      API_BASE_URL: string;
      CHART_DAYS_LIMIT: number;
    };
  }
}

const FALLBACK_API_URL = 'https://api-bptracker.home.vn.ua/api/v1';

function resolveApiBaseUrl(): string {
  const raw = window.CONFIG?.API_BASE_URL;
  if (!raw) return FALLBACK_API_URL;
  try {
    const url = new URL(raw);
    const isSecure = url.protocol === 'https:';
    const isLocalDev = import.meta.env.DEV && url.hostname === 'localhost';
    if (!isSecure && !isLocalDev) {
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

export function useApi() {
  async function _fetch(url: string, options: RequestInit = {}) {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
    });

    if (response.status === 401 && !url.includes('/auth/me')) {
      // Handle session expiration
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
    if (!res.ok) throw new Error('Не вдалося надіслати посилання');
    return true;
  }

  async function consumeMagicLink(token: string) {
    const res = await _fetch(`${API_BASE_URL}/auth/magic-link/consume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) throw new Error('Посилання недійсне');
    return true;
  }

  // Passkey
  async function registerPasskeyBegin(email: string) {
    const res = await _fetch(`${API_BASE_URL}/auth/passkey/register/begin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error('Помилка реєстрації');
    return await res.json();
  }

  async function registerPasskeyComplete(data: RegistrationResponseJSON) {
    const res = await _fetch(`${API_BASE_URL}/auth/passkey/register/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Помилка завершення реєстрації');
    return await res.json();
  }

  async function loginPasskeyBegin() {
    const res = await _fetch(`${API_BASE_URL}/auth/login/begin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!res.ok) throw new Error('Помилка входу');
    return await res.json();
  }

  async function loginPasskeyComplete(data: AuthenticationResponseJSON) {
    const res = await _fetch(`${API_BASE_URL}/auth/login/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Помилка входу');
    return await res.json();
  }

  // Measurements
  async function getMeasurements(signal?: AbortSignal): Promise<Measurement[]> {
    const res = await _fetch(`${API_BASE_URL}/measurements?days=90`, { signal });
    if (!res.ok) throw new Error(`Помилка завантаження: ${res.status} ${res.statusText}`);
    return await res.json();
  }

  async function addMeasurement(data: CreateMeasurementDto): Promise<Measurement> {
    const res = await _fetch(`${API_BASE_URL}/measurements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Помилка збереження');
    return await res.json();
  }

  async function deleteMeasurement(id: string) {
    const res = await _fetch(`${API_BASE_URL}/measurements/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Помилка видалення');
  }

  async function addMeasurementWithPhoto(formData: FormData): Promise<Measurement> {
    const res = await _fetch(`${API_BASE_URL}/measurements/with-photo`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Помилка збереження з фото');
    }
    return await res.json();
  }

  // Settings
  async function getSettings(): Promise<UserSettings> {
    const res = await _fetch(`${API_BASE_URL}/settings`);
    if (!res.ok) throw new Error('Помилка завантаження налаштувань');
    return await res.json();
  }

  async function patchSettings(data: Partial<UserSettings>): Promise<UserSettings> {
    const res = await _fetch(`${API_BASE_URL}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Помилка збереження налаштувань');
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
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'AI не вдалося розпізнати фото');
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

  async function exportCsv() {
    const res = await _fetch(`${API_BASE_URL}/export/csv`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Помилка експорту');
    }
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
    exportCsv,
    getActiveSchema,
  };
}
