import { DICTIONARIES } from '@config/locale.config';
import type { TranslationKey } from '@config/locale.config';
import { localeStore } from '@store/locale.store';
import type { Locale } from '@types';

export type { TranslationKey } from '@config/locale.config';

function resolve(dict: unknown, key: string): string | undefined {
  let cur: unknown = dict;
  for (const part of key.split('.')) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === 'string' ? cur : undefined;
}

export function getLocale(): Locale {
  return localeStore.getState().locale;
}

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const locale = getLocale();
  const value = resolve(DICTIONARIES[locale], key) ?? resolve(DICTIONARIES.id, key) ?? key;
  if (!params) return value;
  return Object.entries(params).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)), value);
}

export function getIntlLocale(): string {
  return getLocale() === 'id' ? 'id-ID' : 'en-US';
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(getIntlLocale()).format(value);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat(getIntlLocale(), {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: Date, options: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat(getIntlLocale(), options).format(value);
}

export function formatDateTime(
  value: Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  },
): string {
  return formatDate(value, options);
}

export function subscribeLocale(listener: () => void): () => void {
  let first = true;
  return localeStore.subscribe(() => {
    if (first) {
      first = false;
      return;
    }
    listener();
  });
}
