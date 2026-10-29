import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import type { User } from '../types/auth';
import {
  ApiError,
  authApi,
  getStoredRefreshToken,
  setAccessToken,
  setStoredRefreshToken,
  setOnUnauthorized,
  broadcastLogout,
  broadcastTokenRefreshed,
} from '../services/api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const status = ref<'idle' | 'loading' | 'authenticated' | 'anonymous'>('idle');
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => status.value === 'authenticated' && user.value !== null);
  const isAdmin = computed(() => Boolean(user.value?.is_admin));

  setOnUnauthorized(() => {
    user.value = null;
    status.value = 'anonymous';
    setAccessToken(null);
    setStoredRefreshToken(null);
  });

  async function initAuth(): Promise<boolean> {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
      status.value = 'anonymous';
      return false;
    }

    status.value = 'loading';
    error.value = null;
    try {
      const me = await authApi.getMe();
      user.value = me;
      status.value = 'authenticated';
      error.value = null;
      return true;
    } catch (err: unknown) {
      user.value = null;
      status.value = 'anonymous';

      const isServerAuthFailure =
        err instanceof ApiError && (err.status === 401 || err.status === 403);

      if (isServerAuthFailure) {
        setAccessToken(null);
        setStoredRefreshToken(null);
        error.value = null;
      } else {
        error.value = 'No connection to server';
      }
      return false;
    }
  }

  async function loginPasskey(): Promise<User> {
    status.value = 'loading';
    error.value = null;
    try {
      const options = await authApi.getPasskeyOptions();
      const assertion = await startAuthentication({ optionsJSON: options });
      const tokenResp = await authApi.verifyPasskey(assertion);

      setAccessToken(tokenResp.access_token);
      setStoredRefreshToken(tokenResp.refresh_token);
      broadcastTokenRefreshed(tokenResp.access_token);

      const me = await authApi.getMe();
      user.value = me;
      status.value = 'authenticated';
      return me;
    } catch (err: unknown) {
      status.value = 'anonymous';
      const msg = err instanceof Error ? err.message : 'Passkey sign-in failed';
      error.value = msg;
      throw err;
    }
  }

  async function requestMagicLink(email: string): Promise<string> {
    error.value = null;
    const loginUrl = `${window.location.origin}/login`;
    const res = await authApi.requestMagicLink({
      email,
      login_url: loginUrl,
    });
    return res.detail;
  }

  async function confirmMagicLink(token: string): Promise<User> {
    status.value = 'loading';
    error.value = null;
    try {
      const tokenResp = await authApi.confirmMagicLink({ token });
      setAccessToken(tokenResp.access_token);
      setStoredRefreshToken(tokenResp.refresh_token);
      broadcastTokenRefreshed(tokenResp.access_token);

      const me = await authApi.getMe();
      user.value = me;
      status.value = 'authenticated';
      return me;
    } catch (err: unknown) {
      status.value = 'anonymous';
      const msg = err instanceof Error ? err.message : 'Invalid or expired login link';
      error.value = msg;
      throw err;
    }
  }

  async function registerPasskey(): Promise<void> {
    const options = await authApi.getRegisterPasskeyOptions();
    const attestation = await startRegistration({ optionsJSON: options });
    await authApi.verifyRegisterPasskey(attestation);
  }

  async function logout(): Promise<void> {
    const refreshToken = getStoredRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch (err) {
        console.warn('Logout request failed:', err);
      }
    }

    user.value = null;
    status.value = 'anonymous';
    setAccessToken(null);
    setStoredRefreshToken(null);
    broadcastLogout();
  }

  return {
    user,
    status,
    error,
    isAuthenticated,
    isAdmin,
    initAuth,
    loginPasskey,
    requestMagicLink,
    confirmMagicLink,
    registerPasskey,
    logout,
  };
});
