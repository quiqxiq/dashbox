import type { IconName } from './icon.types';
import type { HotspotTabName } from './hotspot.types';
import type { MonitorSection } from './monitor.types';
import type { PppTabName } from './ppp.types';
import type { TranslationKey } from '@i18n/translate';

export type ViewName = 'dashboard' | 'ppp' | 'hotspot' | 'report' | 'monitor' | 'settings';

export interface ViewMeta {
  name: ViewName;
  titleKey: TranslationKey;
  icon: IconName;
}

export interface ViewParams {
  tab?: PppTabName;
  id?: string;
  monitorSection?: MonitorSection;
  hotspotTab?: HotspotTabName;
}
