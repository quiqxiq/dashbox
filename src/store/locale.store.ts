import type { Locale } from '@types';
import { createStore } from './create-store';

const STORAGE_KEY = 'dashbox.locale';

function detectInitial(): Locale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'id' || stored === 'en') return stored;
  } catch {
    // storage unavailable — fall back to default
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : 'id';
  return nav.startsWith('en') ? 'en' : 'id';
}

interface LocaleState {
  locale: Locale;
}

export const localeStore = createStore<LocaleState>({ locale: detectInitial() });

export function getLocale(): Locale {
  return localeStore.getState().locale;
}

export function setLocale(locale: Locale): void {
  localeStore.setState({ locale });
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // ignore storage errors
  }
  try {
    document.documentElement.lang = locale;
  } catch {
    // noop (e.g. during tests)
  }
}
