import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { User } from '../types/api';
import { useApi } from '../composables/useApi';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const status = ref<'idle' | 'loading' | 'authenticated' | 'anonymous'>('idle');
  const api = useApi();

  async function checkSession() {
    status.value = 'loading';
    const data = await api.checkMe();
    if (data) {
      user.value = data;
      status.value = 'authenticated';
    } else {
      user.value = null;
      status.value = 'anonymous';
    }
    return user.value;
  }

  async function loginPasskey() {
    try {
      const options = await api.loginPasskeyBegin();
      const assertion = await startAuthentication(options);
      await api.loginPasskeyComplete(assertion);
      return await checkSession();
    } catch (err) {
      console.error('Passkey login failed:', err);
      throw err;
    }
  }

  async function registerPasskey(email: string) {
    try {
      const options = await api.registerPasskeyBegin(email);
      const attestation = await startRegistration(options);
      await api.registerPasskeyComplete(attestation);
      return await checkSession();
    } catch (err) {
      console.error('Passkey registration failed:', err);
      throw err;
    }
  }

  async function requestMagicLink(email: string) {
    return await api.requestMagicLink(email);
  }

  async function consumeMagicLink(token: string) {
    await api.consumeMagicLink(token);
    return await checkSession();
  }

  async function logout() {
    await api.logout();
    user.value = null;
    status.value = 'anonymous';
  }

  return {
    user,
    status,
    checkSession,
    loginPasskey,
    registerPasskey,
    requestMagicLink,
    consumeMagicLink,
    logout,
  };
});
