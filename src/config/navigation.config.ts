import type { IconName } from '@types';
import type { MonitorSection, PppTabName, ViewMeta, ViewName } from '@types';

export interface NavChild {
  label: string;
  icon: IconName;
  view: ViewName;
  pppTab?: PppTabName;
  monitorSection?: MonitorSection;
  badge?: string;
}

export interface NavGroup {
  label: string;
  icon: IconName;
  accent: 'primary' | 'tertiary' | 'secondary';
  children: NavChild[];
}

export interface NavFlatLink {
  label: string;
  icon: IconName;
  view: ViewName;
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
  dashboard: { name: 'dashboard', title: 'Dasbor', icon: 'dashboard' },
  ppp: { name: 'ppp', title: 'PPP Suite', icon: 'hub' },
  hotspot: { name: 'hotspot', title: 'Hotspot', icon: 'wifi_tethering' },
  report: { name: 'report', title: 'Report', icon: 'receipt_long' },
  monitor: { name: 'monitor', title: 'Monitor', icon: 'monitoring' },
  settings: { name: 'settings', title: 'Pengaturan', icon: 'tune' },
};

export const OVERVIEW_LINKS: NavFlatLink[] = [
  { label: 'Dasbor', icon: 'dashboard', view: 'dashboard' },
  { label: 'Report Penjualan', icon: 'receipt_long', view: 'report' },
  { label: 'Pengaturan Cepat', icon: 'tune', view: 'settings' },
];

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Manajemen PPP',
    icon: 'hub',
    accent: 'primary',
    children: [
      { label: 'Secrets', icon: 'key', view: 'ppp', pppTab: 'secrets', badge: '48' },
      { label: 'Active', icon: 'sync_alt', view: 'ppp', pppTab: 'active', badge: '32' },
      { label: 'Profiles', icon: 'badge', view: 'ppp', pppTab: 'profiles', badge: '7' },
      { label: 'PPPoE Servers', icon: 'dns', view: 'ppp', pppTab: 'servers', badge: '2' },
    ],
  },
  {
    label: 'Manajemen Hotspot',
    icon: 'wifi_tethering',
    accent: 'tertiary',
    children: [
      { label: 'Users', icon: 'group', view: 'hotspot', badge: '128' },
      { label: 'Active Sessions', icon: 'timer', view: 'hotspot' },
      { label: 'Report Penjualan', icon: 'receipt_long', view: 'report', badge: '99' },
    ],
  },
  {
    label: 'Monitor',
    icon: 'monitoring',
    accent: 'secondary',
    children: [
      { label: 'System Log', icon: 'terminal', view: 'monitor', monitorSection: 'logs' },
      {
        label: 'Interfaces Traffic',
        icon: 'swap_calls',
        view: 'monitor',
        monitorSection: 'traffic',
        badge: '7',
      },
      {
        label: 'IP Firewall',
        icon: 'security',
        view: 'monitor',
        monitorSection: 'firewall',
        badge: '12',
      },
      {
        label: 'Bandwidth Queues',
        icon: 'speed',
        view: 'monitor',
        monitorSection: 'queues',
        badge: '5',
      },
    ],
  },
];

export const BOTTOM_NAV: NavFlatLink[] = [
  { label: 'Dasbor', icon: 'dashboard', view: 'dashboard' },
  { label: 'PPP', icon: 'hub', view: 'ppp' },
  { label: 'Hotspot', icon: 'wifi_tethering', view: 'hotspot' },
  { label: 'Report', icon: 'receipt_long', view: 'report' },
  { label: 'Monitor', icon: 'monitoring', view: 'monitor' },
  { label: 'Pengaturan', icon: 'tune', view: 'settings' },
];

export const ROUTER_OPTIONS: RouterOption[] = [
  { value: 'ccr1009', label: 'CCR1009-7G-1C-1S+ · Core' },
  { value: 'rb4011', label: 'RB4011-iGS+ · Distribution' },
  { value: 'hexs', label: 'hEX S · Branch Office' },
  { value: 'ccr2004', label: 'CCR2004-16G-2S+ · DC' },
];
