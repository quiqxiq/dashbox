import { createStore } from './create-store';

export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'dashbox.theme';
const DEFAULT_THEME: ThemePreference = 'system';

function detectInitial(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'system' || stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // storage not accessible
  }
  return DEFAULT_THEME;
}

function resolveEffectiveDark(preference: ThemePreference): boolean {
  if (preference === 'dark') return true;
  if (preference === 'light') return false;
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return true;
}

interface ThemeState {
  theme: ThemePreference;
  effectiveDark: boolean;
}

const initialTheme = detectInitial();
const initialDark = resolveEffectiveDark(initialTheme);

export const themeStore = createStore<ThemeState>({
  theme: initialTheme,
  effectiveDark: initialDark,
});

export function getTheme(): ThemePreference {
  return themeStore.getState().theme;
}

export function isEffectiveDark(): boolean {
  return themeStore.getState().effectiveDark;
}

export function applyDomTheme(isDark: boolean): void {
  if (typeof document === 'undefined') return;

  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  const metaTheme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.content = isDark ? '#0a0e1a' : '#f5f7fb';
  }
}

export function setTheme(preference: ThemePreference): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // ignore
  }
  const effectiveDark = resolveEffectiveDark(preference);
  themeStore.setState({ theme: preference, effectiveDark });
  applyDomTheme(effectiveDark);
}

export function toggleTheme(): void {
  const current = themeStore.getState();
  // If currently effective dark, switch to light; otherwise switch to dark
  setTheme(current.effectiveDark ? 'light' : 'dark');
}

// Media query listener for system theme changes
if (typeof window !== 'undefined' && window.matchMedia) {
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  const listener = (e: MediaQueryListEvent): void => {
    if (themeStore.getState().theme === 'system') {
      themeStore.setState({ effectiveDark: e.matches });
      applyDomTheme(e.matches);
    }
  };

  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', listener);
  } else if (typeof mql.addListener === 'function') {
    // Older Safari support
    mql.addListener(listener);
  }
}

// Apply on file load
applyDomTheme(initialDark);
