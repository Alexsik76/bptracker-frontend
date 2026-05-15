import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.resetModules();
  });

  it('default theme is "auto" when localStorage is empty', async () => {
    const { useTheme } = await import('../useTheme');
    const { theme } = useTheme();
    expect(theme.value).toBe('auto');
  });

  it('reads stored theme from localStorage', async () => {
    localStorage.setItem('bptracker:theme', 'dark');
    const { useTheme } = await import('../useTheme');
    const { theme } = useTheme();
    expect(theme.value).toBe('dark');
  });

  it('falls back to "auto" on invalid stored value', async () => {
    localStorage.setItem('bptracker:theme', 'banana');
    const { useTheme } = await import('../useTheme');
    const { theme } = useTheme();
    expect(theme.value).toBe('auto');
  });

  it('setTheme persists to localStorage', async () => {
    const { setTheme } = await import('../useTheme');
    setTheme('light');
    expect(localStorage.getItem('bptracker:theme')).toBe('light');
  });

  it('setTheme applies data-theme attribute to <html>', async () => {
    const { setTheme } = await import('../useTheme');
    setTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('setTheme updates the reactive ref', async () => {
    const { useTheme, setTheme } = await import('../useTheme');
    setTheme('light');
    const { theme } = useTheme();
    expect(theme.value).toBe('light');
  });

  it('initTheme applies the stored theme attribute', async () => {
    localStorage.setItem('bptracker:theme', 'light');
    const { initTheme } = await import('../useTheme');
    initTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
