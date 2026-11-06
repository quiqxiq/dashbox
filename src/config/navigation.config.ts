import type { TranslationKey } from '@i18n/translate';
import type { IconName } from '@types';
import type {
  HotspotTabName,
  MonitorSection,
  PppTabName,
  ViewMeta,
  ViewName,
  ViewParams,
} from '@types';

export interface NavChild {
  labelKey: TranslationKey;
  icon: IconName;
  view: ViewName;
  pppTab?: PppTabName;
  monitorSection?: MonitorSection;
  hotspotTab?: HotspotTabName;
  badge?: string;
}

export interface NavGroup {
  labelKey: TranslationKey;
  icon: IconName;
  accent: 'primary' | 'tertiary' | 'secondary';
  children: NavChild[];
}

export interface NavFlatLink {
  labelKey: TranslationKey;
  icon: IconName;
  view: ViewName;
}

export interface NavSubItem {
  id: string;
  labelKey: TranslationKey;
  icon: IconName;
  view: ViewName;
  pppTab?: PppTabName;
  monitorSection?: MonitorSection;
  hotspotTab?: HotspotTabName;
  badge?: string;
}

export interface NavBarItem {
  id: string;
  labelKey: TranslationKey;
  icon: IconName;
  view: ViewName;
  defaultParams?: ViewParams;
  subItems?: NavSubItem[];
  enabled?: boolean;
  badge?: string;
}

export interface RouterOption {
  value: string;
  label: string;
}

export const APP_META = {
  name: 'Dashbox',
  version: 'v1.0.0',
  connectedLabel: 'Terhubung · API 8728 · Dashbox v1.0.0',
} as const;

export const VIEW_META: Record<ViewName, ViewMeta> = {
  dashboard: { name: 'dashboard', titleKey: 'nav.dashboard', icon: 'dashboard' },
  ppp: { name: 'ppp', titleKey: 'nav.ppp', icon: 'hub' },
  hotspot: { name: 'hotspot', titleKey: 'nav.hotspot', icon: 'wifi_tethering' },
  report: { name: 'report', titleKey: 'nav.report', icon: 'receipt_long' },
  monitor: { name: 'monitor', titleKey: 'nav.monitor', icon: 'monitoring' },
  settings: { name: 'settings', titleKey: 'nav.settings', icon: 'tune' },
};

export const OVERVIEW_LINKS: NavFlatLink[] = [
  { labelKey: 'nav.dashboard', icon: 'dashboard', view: 'dashboard' },
  { labelKey: 'nav.salesReport', icon: 'receipt_long', view: 'report' },
  { labelKey: 'nav.quickSettings', icon: 'tune', view: 'settings' },
];

export const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: 'nav.pppManagement',
    icon: 'hub',
    accent: 'primary',
    children: [
      { labelKey: 'nav.secrets', icon: 'key', view: 'ppp', pppTab: 'secrets', badge: '48' },
      { labelKey: 'nav.active', icon: 'sync_alt', view: 'ppp', pppTab: 'active', badge: '32' },
      { labelKey: 'nav.profiles', icon: 'badge', view: 'ppp', pppTab: 'profiles', badge: '7' },
      { labelKey: 'nav.servers', icon: 'dns', view: 'ppp', pppTab: 'servers', badge: '2' },
    ],
  },
  {
    labelKey: 'nav.hotspotManagement',
    icon: 'wifi_tethering',
    accent: 'tertiary',
    children: [
      { labelKey: 'nav.users', icon: 'group', view: 'hotspot', hotspotTab: 'users', badge: '128' },
      { labelKey: 'nav.activeSessions', icon: 'timer', view: 'hotspot', hotspotTab: 'active' },
      { labelKey: 'nav.salesReport', icon: 'receipt_long', view: 'report', badge: '99' },
    ],
  },
  {
    labelKey: 'nav.monitor',
    icon: 'monitoring',
    accent: 'secondary',
    children: [
      { labelKey: 'nav.systemLog', icon: 'terminal', view: 'monitor', monitorSection: 'logs' },
      {
        labelKey: 'nav.interfacesTraffic',
        icon: 'swap_calls',
        view: 'monitor',
        monitorSection: 'traffic',
        badge: '7',
      },
      {
        labelKey: 'nav.ipFirewall',
        icon: 'security',
        view: 'monitor',
        monitorSection: 'firewall',
        badge: '12',
      },
      {
        labelKey: 'nav.bandwidthQueues',
        icon: 'speed',
        view: 'monitor',
        monitorSection: 'queues',
        badge: '5',
      },
    ],
  },
];

export const BOTTOM_NAV: NavBarItem[] = [
  { id: 'dashboard', labelKey: 'nav.dashboard', icon: 'dashboard', view: 'dashboard' },
  {
    id: 'ppp',
    labelKey: 'nav.ppp',
    icon: 'hub',
    view: 'ppp',
    defaultParams: { tab: 'secrets' },
    subItems: [
      {
        id: 'ppp-secrets',
        labelKey: 'nav.secrets',
        icon: 'key',
        view: 'ppp',
        pppTab: 'secrets',
        badge: '48',
      },
      {
        id: 'ppp-active',
        labelKey: 'nav.active',
        icon: 'sync_alt',
        view: 'ppp',
        pppTab: 'active',
        badge: '32',
      },
      {
        id: 'ppp-profiles',
        labelKey: 'nav.profiles',
        icon: 'badge',
        view: 'ppp',
        pppTab: 'profiles',
        badge: '7',
      },
      {
        id: 'ppp-servers',
        labelKey: 'nav.servers',
        icon: 'dns',
        view: 'ppp',
        pppTab: 'servers',
        badge: '2',
      },
    ],
  },
  {
    id: 'hotspot',
    labelKey: 'nav.hotspot',
    icon: 'wifi_tethering',
    view: 'hotspot',
    defaultParams: { hotspotTab: 'users' },
    subItems: [
      {
        id: 'hs-users',
        labelKey: 'nav.users',
        icon: 'group',
        view: 'hotspot',
        hotspotTab: 'users',
        badge: '128',
      },
      {
        id: 'hs-active',
        labelKey: 'nav.activeSessions',
        icon: 'timer',
        view: 'hotspot',
        hotspotTab: 'active',
      },
      {
        id: 'hs-profiles',
        labelKey: 'nav.profiles',
        icon: 'badge',
        view: 'hotspot',
        hotspotTab: 'profiles',
      },
      { id: 'hs-hosts', labelKey: 'nav.hosts', icon: 'lan', view: 'hotspot', hotspotTab: 'hosts' },
    ],
  },
  { id: 'report', labelKey: 'nav.report', icon: 'receipt_long', view: 'report' },
  {
    id: 'monitor',
    labelKey: 'nav.monitor',
    icon: 'monitoring',
    view: 'monitor',
    defaultParams: { monitorSection: 'logs' },
    subItems: [
      {
        id: 'mon-logs',
        labelKey: 'nav.systemLog',
        icon: 'terminal',
        view: 'monitor',
        monitorSection: 'logs',
      },
      {
        id: 'mon-traffic',
        labelKey: 'nav.interfacesTraffic',
        icon: 'swap_calls',
        view: 'monitor',
        monitorSection: 'traffic',
        badge: '7',
      },
      {
        id: 'mon-firewall',
        labelKey: 'nav.ipFirewall',
        icon: 'security',
        view: 'monitor',
        monitorSection: 'firewall',
        badge: '12',
      },
      {
        id: 'mon-queues',
        labelKey: 'nav.bandwidthQueues',
        icon: 'speed',
        view: 'monitor',
        monitorSection: 'queues',
        badge: '5',
      },
    ],
  },
  { id: 'settings', labelKey: 'nav.settings', icon: 'tune', view: 'settings' },
];

/** Batas tampil di bottom nav utama. Item berlebih masuk ke tombol "More". */
export const BOTTOM_NAV_MAX_VISIBLE = 6;

export function getVisibleBottomNav(): NavBarItem[] {
  return BOTTOM_NAV.filter((item) => item.enabled !== false);
}

export function getBottomNavOverflow(): NavBarItem[] {
  const visible = getVisibleBottomNav();
  if (visible.length <= BOTTOM_NAV_MAX_VISIBLE) return [];
  return visible.slice(BOTTOM_NAV_MAX_VISIBLE - 1);
}

export function getBottomNavPrimary(): NavBarItem[] {
  const visible = getVisibleBottomNav();
  if (visible.length <= BOTTOM_NAV_MAX_VISIBLE) return visible;
  return visible.slice(0, BOTTOM_NAV_MAX_VISIBLE - 1);
}

export const ROUTER_OPTIONS: RouterOption[] = [
  { value: 'ccr1009', label: 'CCR1009-7G-1C-1S+ · Core' },
  { value: 'rb4011', label: 'RB4011-iGS+ · Distribution' },
  { value: 'hexs', label: 'hEX S · Branch Office' },
  { value: 'ccr2004', label: 'CCR2004-16G-2S+ · DC' },
];
