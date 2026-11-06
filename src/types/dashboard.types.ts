import type { IconName } from './icon.types';
import type { TranslationKey } from '@i18n/translate';

export type AccentTone = 'primary' | 'secondary' | 'tertiary' | 'error';
export type DashboardSearchFilter = 'all' | 'ppp' | 'hotspot' | 'online' | 'offline';
export type DashboardSearchStatus = 'online' | 'offline' | 'expired';

export interface DashboardLocalizedText {
  key: TranslationKey;
  params?: Record<string, string | number>;
}

export interface TelemetryMetric {
  key: 'cpu' | 'ram' | 'temp' | 'fan';
  icon: IconName;
  labelKey: TranslationKey;
  value: string;
  meta: string;
  percent: number;
  tone: AccentTone;
  statusKey: TranslationKey;
}

export interface DashboardKpi {
  icon: IconName;
  labelKey: TranslationKey;
  value: string;
  denominator?: string;
  badge?: string;
  badgeKey?: TranslationKey;
  badgeParams?: Record<string, string | number>;
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
  typeLabelKey: TranslationKey;
  name: string;
  ip: string;
  meta: string;
  status: DashboardSearchStatus;
  statusLabelKey: TranslationKey;
  statusNote: DashboardLocalizedText;
  footerIcon: IconName;
  footerLabel: DashboardLocalizedText;
  detailView: 'ppp' | 'hotspot';
  searchText: string;
}

export interface DashboardShortcut {
  labelKey: TranslationKey;
  icon: IconName;
  view: 'ppp' | 'hotspot' | 'report' | 'monitor' | 'settings';
  tone: AccentTone;
}
