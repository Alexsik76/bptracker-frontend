import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { UserSettings } from '../types/api';
import { useApi } from '../composables/useApi';

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<UserSettings>({});
  const api = useApi();

  async function fetchSettings() {
    try {
      settings.value = await api.getSettings();
    } catch {
      // settings might not exist yet
    }
  }

  async function updateSettings(data: Partial<UserSettings>) {
    settings.value = await api.patchSettings(data);
  }

  function reset() {
    settings.value = {};
  }

  return {
    settings,
    fetchSettings,
    updateSettings,
    reset,
  };
});
