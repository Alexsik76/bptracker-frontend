import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Measurement, CreateMeasurementDto } from '../types/api';
import { useApi } from '../composables/useApi';
import { useOfflineQueue } from '../composables/useOfflineQueue';
import { useToast } from '../composables/useToast';

export const useMeasurementStore = defineStore('measurements', () => {
  const items = ref<Measurement[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const api = useApi();
  const offline = useOfflineQueue();
  const toast = useToast();

  async function fetchMeasurements(signal?: AbortSignal) {
    loading.value = true;
    error.value = null;
    try {
      await offline.sync(); // Try sync first
      items.value = await api.getMeasurements(signal);
    } catch (err) {
      // Do not show error for intentional navigation cancellations
      if (err instanceof DOMException && err.name === 'AbortError') return;
      error.value = err instanceof Error ? err.message : 'Не вдалося завантажити виміри';
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
        toast.info('Збережено локально — дані буде надіслано при появі мережі.');
        return null;
      }
      throw err;
    }
  }

  async function remove(id: string) {
    await api.deleteMeasurement(id);
    items.value = items.value.filter(m => m.id !== id);
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
    remove,
    reset,
  };
});
