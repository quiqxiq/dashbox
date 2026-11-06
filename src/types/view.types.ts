import type { IconName } from './icon.types';
import type { MonitorSection } from './monitor.types';
import type { PppTabName } from './ppp.types';

export type ViewName = 'dashboard' | 'ppp' | 'hotspot' | 'report' | 'monitor' | 'settings';

export interface ViewMeta {
  name: ViewName;
  title: string;
  icon: IconName;
}

export interface ViewParams {
  tab?: PppTabName;
  id?: string;
  monitorSection?: MonitorSection;
}
