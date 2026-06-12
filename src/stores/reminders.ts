import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import type { TodayRemindersResponse } from '../types/api';
import { useApi } from '../composables/useApi';
import { useToast } from '../composables/useToast';
import { useApiErrorMessage } from '../composables/useApiErrorMessage';
import { i18n } from '../i18n';

export const useReminderStore = defineStore('reminders', () => {
  const todayData = ref<TodayRemindersResponse | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const api = useApi();
  const toast = useToast();
  const { toMessage } = useApiErrorMessage();

  async function fetchTodayData() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      todayData.value = await api.getTodayReminders(tz);
    } catch (err) {
      todayData.value = null;
    }
  }

  async function confirm(period: string) {
    if (!todayData.value) return;
    const backupIntakes = JSON.parse(JSON.stringify(todayData.value.intakes));

    const matchingIntake = todayData.value.intakes.find(
      i => i.period.toLowerCase() === period.toLowerCase()
    );
    if (matchingIntake) {
      matchingIntake.status = 'Confirmed';
      matchingIntake.timeTaken = new Date().toISOString();
    }

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await api.confirmIntake(period, tz);
      await fetchTodayData();
      toast.success(i18n.global.t('schema.reminders.confirmedToast'));
    } catch (err) {
      if (todayData.value) {
        todayData.value.intakes = backupIntakes;
      }
      toast.error(toMessage(err, 'errors.saveFailed'));
      throw err;
    }
  }

  async function init() {
    loading.value = true;
    try {
      await fetchTodayData();
    } finally {
      loading.value = false;
    }
  }

  watch(
    todayData,
    (newData) => {
      if (!('setAppBadge' in navigator)) return;

      if (!newData || !newData.intakes) {
        navigator.clearAppBadge().catch(err => console.error('[Badge] Error clearing badge:', err));
        return;
      }

      const unconfirmedCount = newData.intakes.filter(i => i.status === null).length;

      if (unconfirmedCount > 0) {
        navigator.setAppBadge(unconfirmedCount).catch(err => console.error('[Badge] Error setting badge:', err));
      } else {
        navigator.clearAppBadge().catch(err => console.error('[Badge] Error clearing badge:', err));
      }
    },
    { deep: true, immediate: true }
  );

  return {
    todayData,
    loading,
    error,
    confirm,
    init,
    fetchTodayData,
  };
});

