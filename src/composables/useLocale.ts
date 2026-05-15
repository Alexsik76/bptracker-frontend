import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { AppLocale } from '../i18n';

export function useLocale() {
  const i18n = useI18n();

  const locale = computed<AppLocale>({
    get: () => i18n.locale.value as AppLocale,
    set: (val) => {
      i18n.locale.value = val;
      try {
        localStorage.setItem('bptracker:locale', val);
      } catch { /* ignore */ }
      document.documentElement.setAttribute('lang', val);
    },
  });

  function setLocale(val: AppLocale) {
    locale.value = val;
  }

  return { locale, setLocale };
}
