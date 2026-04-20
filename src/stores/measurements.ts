import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Measurement, CreateMeasurementDto } from '../types/api';
import { useApi } from '../composables/useApi';
import { useOfflineQueue } from '../composables/useOfflineQueue';

export const useMeasurementStore = defineStore('measurements', () => {
  const items = ref<Measurement[]>([]);
  const loading = ref(false);
  const api = useApi();
  const offline = useOfflineQueue();

  async function fetchMeasurements() {
    loading.value = true;
    try {
      await offline.sync(); // Try sync first
      items.value = await api.getMeasurements();
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
        alert('Збережено локально (офлайн). Дані будуть надіслані при появі мережі.');
        return null;
      }
      throw err;
    }
  }

  async function remove(id: string) {
    await api.deleteMeasurement(id);
    items.value = items.value.filter(m => m.id !== id);
  }

  return {
    items,
    loading,
    fetchMeasurements,
    add,
    remove,
  };
});
