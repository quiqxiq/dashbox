import type { IconName } from './icon.types';
import type { PppTabName } from './ppp.types';

export type ViewName = 'dashboard' | 'ppp' | 'hotspot' | 'monitor' | 'settings';

export interface ViewMeta {
  name: ViewName;
  title: string;
  icon: IconName;
}

export interface ViewParams {
  tab?: PppTabName;
  id?: string;
  monitorSection?: 'logs' | 'traffic' | 'firewall';
}
