import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { TreatmentSchema, CreateSchemaDto, UpdateSchemaDto } from '../types/api';
import { useApi } from '../composables/useApi';
import { useToast } from '../composables/useToast';
import { useApiErrorMessage } from '../composables/useApiErrorMessage';

export const useSchemaStore = defineStore('schemas', () => {
  const items = ref<TreatmentSchema[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const api = useApi();
  const toast = useToast();
  const { toMessage } = useApiErrorMessage();

  const active = computed(() => items.value.find((s) => s.isActive) ?? null);

  async function fetchSchemas(signal?: AbortSignal) {
    loading.value = true;
    error.value = null;
    try {
      items.value = await api.getSchemas(signal);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      error.value = toMessage(err, 'errors.loadFailed');
    } finally {
      loading.value = false;
    }
  }

  async function create(dto: CreateSchemaDto) {
    try {
      await api.createSchema(dto);
      await fetchSchemas();
    } catch (err) {
      toast.error(toMessage(err, 'errors.saveFailed'));
      throw err;
    }
  }

  async function update(id: string, dto: UpdateSchemaDto) {
    try {
      await api.updateSchema(id, dto);
      await fetchSchemas();
    } catch (err) {
      toast.error(toMessage(err, 'errors.saveFailed'));
      throw err;
    }
  }

  async function activate(id: string) {
    const prev = items.value.map((s) => s.isActive);
    items.value = items.value.map((s) => ({ ...s, isActive: s.id === id }));
    try {
      await api.activateSchema(id);
      await fetchSchemas();
    } catch (err) {
      items.value = items.value.map((s, i) => ({ ...s, isActive: prev[i] }));
      toast.error(toMessage(err, 'errors.saveFailed'));
      throw err;
    }
  }

  async function remove(id: string) {
    try {
      await api.deleteSchema(id);
      items.value = items.value.filter((s) => s.id !== id);
    } catch (err) {
      toast.error(toMessage(err, 'errors.deleteFailed'));
      throw err;
    }
  }

  return {
    items,
    loading,
    error,
    active,
    fetchSchemas,
    create,
    update,
    activate,
    remove,
  };
});
