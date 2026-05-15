import { ref } from 'vue';

export type Theme = 'auto' | 'light' | 'dark';

const STORAGE_KEY = 'bptracker:theme';

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'auto' || stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // localStorage may be unavailable (private mode, SSR, etc.)
  }
  return 'auto';
}

function applyTheme(value: Theme): void {
  document.documentElement.setAttribute('data-theme', value);
}

// Module-level singleton: shared across all useTheme() calls.
const theme = ref<Theme>(readStoredTheme());

export function setTheme(value: Theme): void {
  theme.value = value;
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore
  }
  applyTheme(value);
}

export function useTheme() {
  return { theme, setTheme };
}

/** Call once at app startup to sync DOM with stored value. */
export function initTheme(): void {
  applyTheme(theme.value);
}
