import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Measurement, CreateMeasurementDto } from '../types/api';
import { useApi } from '../composables/useApi';
import { useOfflineQueue } from '../composables/useOfflineQueue';
import { useToast } from '../composables/useToast';
import { useApiErrorMessage } from '../composables/useApiErrorMessage';

export const useMeasurementStore = defineStore('measurements', () => {
  const items = ref<Measurement[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const api = useApi();
  const offline = useOfflineQueue();
  const toast = useToast();
  const { t } = useI18n();
  const { toMessage } = useApiErrorMessage();

  async function fetchMeasurements(signal?: AbortSignal) {
    loading.value = true;
    error.value = null;
    try {
      await offline.sync(); // Try sync first
      items.value = await api.getMeasurements(signal);
    } catch (err) {
      // Do not show error for intentional navigation cancellations
      if (err instanceof DOMException && err.name === 'AbortError') return;
      error.value = toMessage(err, 'errors.loadFailed');
    } finally {
      loading.value = false;
    }
  }

  async function add(data: CreateMeasurementDto) {
    try {
      const newItem = await api.addMeasurement(data);
      items.value = [newItem, ...items.value];
      return newItem;
    } catch (err) {
      if (!navigator.onLine) {
        await offline.enqueue(data);
        toast.info(t('measurement.savedOffline'));
        return null;
      }
      throw err;
    }
  }

  async function addWithPhoto(
    data: { sys: number; dia: number; pulse: number },
    photoBlob: Blob,
    geminiSuggestion: { sys: number; dia: number; pulse: number }
  ) {
    const formData = new FormData();
    formData.append('image', photoBlob, 'photo.jpg');
    formData.append('sys', data.sys.toString());
    formData.append('dia', data.dia.toString());
    formData.append('pulse', data.pulse.toString());
    formData.append('geminiSys', geminiSuggestion.sys.toString());
    formData.append('geminiDia', geminiSuggestion.dia.toString());
    formData.append('geminiPulse', geminiSuggestion.pulse.toString());

    const newItem = await api.addMeasurementWithPhoto(formData);
    items.value = [newItem, ...items.value];
    return newItem;
  }

  async function remove(id: string) {
    await api.deleteMeasurement(id);
    items.value = items.value.filter((m) => m.id !== id);
  }

  function reset() {
    items.value = [];
    loading.value = false;
    error.value = null;
  }

  return {
    items,
    loading,
    error,
    fetchMeasurements,
    add,
    addWithPhoto,
    remove,
    reset,
  };
});
