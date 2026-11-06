import { DICTIONARIES } from '@config/locale.config';
import { localeStore } from '@store/locale.store';
import type { Locale } from '@types';

export type TranslationKey =
  | 'nav.dashboard'
  | 'nav.ppp'
  | 'nav.hotspot'
  | 'nav.report'
  | 'nav.monitor'
  | 'nav.settings'
  | 'nav.overview'
  | 'nav.managementMonitor'
  | 'nav.mainNavigation'
  | 'nav.quickSettings'
  | 'nav.salesReport'
  | 'nav.pppManagement'
  | 'nav.hotspotManagement'
  | 'nav.secrets'
  | 'nav.active'
  | 'nav.activeSessions'
  | 'nav.profiles'
  | 'nav.servers'
  | 'nav.users'
  | 'nav.hosts'
  | 'nav.systemLog'
  | 'nav.interfacesTraffic'
  | 'nav.ipFirewall'
  | 'nav.bandwidthQueues'
  | 'nav.more'
  | 'common.search'
  | 'common.refresh'
  | 'common.save'
  | 'common.delete'
  | 'common.edit'
  | 'common.add'
  | 'common.cancel'
  | 'common.close'
  | 'common.enable'
  | 'common.disable'
  | 'common.clear'
  | 'common.all'
  | 'common.new'
  | 'common.back'
  | 'common.language'
  | 'common.openMenu'
  | 'common.closeMenu'
  | 'dashboard.title'
  | 'dashboard.coreRouter'
  | 'dashboard.systemRunning'
  | 'dashboard.wanThroughput'
  | 'dashboard.last60s'
  | 'dashboard.shortcuts'
  | 'dashboard.telemetry'
  | 'dashboard.cpu'
  | 'dashboard.ram'
  | 'dashboard.temp'
  | 'dashboard.fan'
  | 'dashboard.searchPlaceholder'
  | 'dashboard.viewAll'
  | 'ppp.title'
  | 'ppp.secrets'
  | 'ppp.active'
  | 'ppp.profiles'
  | 'ppp.servers'
  | 'ppp.interface'
  | 'ppp.searchPlaceholder'
  | 'hotspot.title'
  | 'hotspot.users'
  | 'hotspot.profiles'
  | 'hotspot.active'
  | 'hotspot.hosts'
  | 'hotspot.searchPlaceholder'
  | 'report.title'
  | 'report.subtitle'
  | 'report.detail'
  | 'report.resume'
  | 'report.today'
  | 'report.thisMonth'
  | 'report.filteredTotal'
  | 'report.topProfile'
  | 'monitor.title'
  | 'monitor.subtitle'
  | 'monitor.logs'
  | 'monitor.traffic'
  | 'monitor.firewall'
  | 'monitor.queues'
  | 'settings.title'
  | 'settings.languageSection'
  | 'settings.languageHint'
  | 'settings.previewBadge'
  | 'settings.previewBody'
  | 'layout.connected'
  | 'layout.poweredBy';

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

export function t(key: TranslationKey | string, params?: Record<string, string | number>): string {
  const locale = getLocale();
  const value = resolve(DICTIONARIES[locale], key) ?? resolve(DICTIONARIES.id, key) ?? key;
  if (!params) return value;
  return Object.entries(params).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)), value);
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
