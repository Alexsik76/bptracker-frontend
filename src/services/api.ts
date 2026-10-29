import type {
  PublicKeyCredentialRequestOptionsJSON,
  PublicKeyCredentialCreationOptionsJSON,
} from '@simplewebauthn/browser';
import type {
  User,
  TokenResponse,
  MagicLinkRequest,
  MagicLinkConfirm,
  LogoutRequest,
} from '../types/auth';

declare global {
  interface Window {
    __APP_CONFIG__?: {
      apiUrl?: string;
    };
  }
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function resolveBaseUrl(): string {
  // When running locally in Vite dev server on localhost, use the /api proxy to prevent CORS issues
  if (import.meta.env.DEV && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return '/api';
  }
  const windowUrl = window.__APP_CONFIG__?.apiUrl;
  const envUrl = import.meta.env.VITE_API_URL;
  const raw = windowUrl || envUrl || 'https://api2-bptracker-dev.home.vn.ua';
  return raw.replace(/\/+$/, '');
}

export const API_BASE_URL = resolveBaseUrl();

// Storage key for refresh token
const REFRESH_TOKEN_KEY = 'bpt_admin_refresh_token';

let inMemoryAccessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;
let onUnauthorizedCallback: (() => void) | null = null;

// Synchronize access token across browser tabs
const authChannel =
  typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('bpt-admin-auth') : null;

if (authChannel) {
  authChannel.onmessage = (event) => {
    if (event.data?.type === 'TOKEN_REFRESHED' && typeof event.data.accessToken === 'string') {
      inMemoryAccessToken = event.data.accessToken;
    } else if (event.data?.type === 'TOKEN_CLEARED') {
      inMemoryAccessToken = null;
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    } else if (event.data?.type === 'REQUEST_ACCESS_TOKEN' && inMemoryAccessToken) {
      authChannel.postMessage({
        type: 'TOKEN_REFRESHED',
        accessToken: inMemoryAccessToken,
      });
    }
  };
}

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setStoredRefreshToken(token: string | null) {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function setOnUnauthorized(cb: () => void) {
  onUnauthorizedCallback = cb;
}

export function broadcastLogout() {
  authChannel?.postMessage({ type: 'TOKEN_CLEARED' });
}

export function broadcastTokenRefreshed(token: string) {
  authChannel?.postMessage({
    type: 'TOKEN_REFRESHED',
    accessToken: token,
  });
}

async function refreshAccessToken(): Promise<string | null> {
  const startingRefreshToken = getStoredRefreshToken();
  if (!startingRefreshToken) {
    return null;
  }

  const performRefresh = async (): Promise<string | null> => {
    const currentRefreshToken = getStoredRefreshToken();
    if (!currentRefreshToken) {
      return null;
    }

    // If refresh token differs, another tab already rotated it
    if (currentRefreshToken !== startingRefreshToken) {
      if (inMemoryAccessToken) {
        return inMemoryAccessToken;
      }
      if (authChannel) {
        authChannel.postMessage({ type: 'REQUEST_ACCESS_TOKEN' });
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(resolve, 300);
          const handler = (ev: MessageEvent) => {
            if (ev.data?.type === 'TOKEN_REFRESHED' && ev.data.accessToken) {
              clearTimeout(timeout);
              authChannel.removeEventListener('message', handler);
              resolve();
            }
          };
          authChannel.addEventListener('message', handler);
        });
      }
      return inMemoryAccessToken;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client': 'admin',
        },
        body: JSON.stringify({ refresh_token: currentRefreshToken }),
      });

      if (!res.ok) {
        setAccessToken(null);
        setStoredRefreshToken(null);
        authChannel?.postMessage({ type: 'TOKEN_CLEARED' });
        return null;
      }

      const data: TokenResponse = await res.json();
      setAccessToken(data.access_token);
      setStoredRefreshToken(data.refresh_token);
      authChannel?.postMessage({
        type: 'TOKEN_REFRESHED',
        accessToken: data.access_token,
      });
      return data.access_token;
    } catch (err) {
      console.error('Failed to refresh token:', err);
      setAccessToken(null);
      setStoredRefreshToken(null);
      authChannel?.postMessage({ type: 'TOKEN_CLEARED' });
      return null;
    }
  };

  // Serialize across browser tabs with Web Locks API
  if (typeof navigator !== 'undefined' && 'locks' in navigator && navigator.locks?.request) {
    return await navigator.locks.request('bpt-admin-refresh', performRefresh);
  }

  return await performRefresh();
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Always identify admin client
  headers.set('X-Client', 'admin');

  if (inMemoryAccessToken) {
    headers.set('Authorization', `Bearer ${inMemoryAccessToken}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized with single in-flight refresh promise
  if (response.status === 401 && !isRetry && !path.includes('/auth/')) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;
    if (newToken) {
      return request<T>(path, options, true);
    } else {
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
      throw new ApiError('Сесія завершилась. Будь ласка, увійдіть знову.', 401);
    }
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  if (!response.ok) {
    let errorDetail = `Помилка ${response.status}`;
    let errorData: unknown = null;
    try {
      errorData = await response.json();
      if (typeof errorData === 'object' && errorData !== null && 'detail' in errorData) {
        const detail = (errorData as { detail: unknown }).detail;
        if (typeof detail === 'string') {
          errorDetail = detail;
        } else if (Array.isArray(detail)) {
          errorDetail = detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join(', ');
        }
      }
    } catch {
      // response body not JSON
    }
    throw new ApiError(errorDetail, response.status, errorData);
  }

  return response.json() as Promise<T>;
}

// Auth API endpoints
export const authApi = {
  getPasskeyOptions: async () => {
    return request<PublicKeyCredentialRequestOptionsJSON>('/auth/webauthn/authenticate/options', {
      method: 'POST',
    });
  },

  verifyPasskey: async (body: unknown) => {
    return request<TokenResponse>('/auth/webauthn/authenticate/verify', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  requestMagicLink: async (data: MagicLinkRequest) => {
    return request<{ detail: string }>('/auth/magic-link/request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  confirmMagicLink: async (data: MagicLinkConfirm) => {
    return request<TokenResponse>('/auth/magic-link/confirm', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getRegisterPasskeyOptions: async () => {
    return request<PublicKeyCredentialCreationOptionsJSON>('/auth/webauthn/register/options', {
      method: 'POST',
    });
  },

  verifyRegisterPasskey: async (body: unknown) => {
    return request<unknown>('/auth/webauthn/register/verify', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  logout: async (refreshToken: string) => {
    return request<void>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken } as LogoutRequest),
    });
  },

  getMe: async () => {
    return request<User>('/users/me');
  },
};
