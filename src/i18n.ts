import { createI18n } from 'vue-i18n';
import uk from './locales/uk';
import en from './locales/en';

export type AppLocale = 'uk' | 'en';

export const SUPPORTED_LOCALES: readonly AppLocale[] = ['uk', 'en'] as const;

export function detectInitialLocale(): AppLocale {
  try {
    const stored = localStorage.getItem('bptracker:locale');
    if (stored === 'uk' || stored === 'en') return stored;
  } catch { /* ignore */ }
  const nav = navigator.language?.toLowerCase() ?? '';
  if (nav.startsWith('uk')) return 'uk';
  if (nav.startsWith('en')) return 'en';
  return 'uk';
}

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: detectInitialLocale(),
  fallbackLocale: 'uk',
  messages: { uk, en },
  datetimeFormats: {
    uk: {
      short: { day: '2-digit', month: '2-digit' },
      time: { hour: '2-digit', minute: '2-digit' },
    },
    en: {
      short: { day: '2-digit', month: 'short' },
      time: { hour: '2-digit', minute: '2-digit' },
    },
  },
});
