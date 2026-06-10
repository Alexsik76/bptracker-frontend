import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ReminderTemplate, IntakeReport } from '../types/api';
import { useApi } from '../composables/useApi';
import { useToast } from '../composables/useToast';
import { useApiErrorMessage } from '../composables/useApiErrorMessage';

export const useReminderStore = defineStore('reminders', () => {
  const activeTemplate = ref<ReminderTemplate | null>(null);
  const todayReports = ref<IntakeReport[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const api = useApi();
  const toast = useToast();
  const { toMessage } = useApiErrorMessage();

  async function fetchActiveTemplate() {
    try {
      activeTemplate.value = await api.getActiveTemplate();
    } catch (err) {
      activeTemplate.value = null;
    }
  }

  async function fetchTodayReports() {
    try {
      todayReports.value = await api.getReminderReports(1);
    } catch (err) {
      todayReports.value = [];
    }
  }

  async function confirm(period: string) {
    try {
      await api.confirmIntake(period);
      await fetchTodayReports();
      toast.success('Прийом ліків підтверджено!');
    } catch (err) {
      toast.error(toMessage(err, 'errors.saveFailed'));
      throw err;
    }
  }

  async function init() {
    loading.value = true;
    try {
      await Promise.all([fetchActiveTemplate(), fetchTodayReports()]);
    } finally {
      loading.value = false;
    }
  }

  return {
    activeTemplate,
    todayReports,
    loading,
    error,
    confirm,
    init,
    fetchActiveTemplate,
    fetchTodayReports,
  };
});
