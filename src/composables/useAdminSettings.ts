import { ref } from 'vue';
import { adminSettingsApi, type AdminSetting } from '../services/adminSettings';
import { errorMessage } from '../utils/activityFormat';

/** Loads the settings registry and keeps it in sync with per-field saves and resets. */
export function useAdminSettings() {
  const settings = ref<AdminSetting[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function load() {
    loading.value = true;
    error.value = null;
    try {
      settings.value = await adminSettingsApi.list();
    } catch (e) {
      settings.value = [];
      error.value = errorMessage(e);
    } finally {
      loading.value = false;
    }
  }

  function replace(updated: AdminSetting) {
    settings.value = settings.value.map((s) => (s.key === updated.key ? updated : s));
  }

  return { settings, loading, error, load, replace };
}
