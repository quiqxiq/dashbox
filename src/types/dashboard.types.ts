import type { IconName } from './icon.types';

export type AccentTone = 'primary' | 'secondary' | 'tertiary' | 'error';
export type DashboardSearchFilter = 'all' | 'ppp' | 'hotspot' | 'online' | 'offline';
export type DashboardSearchStatus = 'online' | 'offline' | 'expired';

export interface TelemetryMetric {
  key: 'cpu' | 'ram' | 'temp' | 'fan';
  icon: IconName;
  label: string;
  value: string;
  meta: string;
  percent: number;
  tone: AccentTone;
  status: string;
}

export interface DashboardKpi {
  icon: IconName;
  label: string;
  value: string;
  denominator?: string;
  badge: string;
  tone: AccentTone;
  badgeTone: 'accent' | 'muted' | 'error';
}

export interface ThroughputBar {
  height: number;
  active?: boolean;
}

export interface DashboardSearchItem {
  id: string;
  type: 'ppp' | 'hotspot';
  typeLabel: string;
  name: string;
  ip: string;
  meta: string;
  status: DashboardSearchStatus;
  statusLabel: string;
  statusNote: string;
  footerIcon: IconName;
  footerLabel: string;
  detailView: 'ppp' | 'hotspot';
  searchText: string;
}

export interface DashboardShortcut {
  label: string;
  icon: IconName;
  view: 'ppp' | 'hotspot' | 'report' | 'monitor' | 'settings';
  tone: AccentTone;
}
