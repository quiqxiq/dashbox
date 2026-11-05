export type HotspotExpiryMode = 'none' | 'remove' | 'notice' | 'remove-record' | 'notice-record';

export interface HotspotUser {
  id: string;
  name: string;
  password: string;
  server: string;
  profile: string;
  macAddress: string;
  uptime: string;
  bytesIn: string;
  bytesOut: string;
  limitUptime: string;
  limitBytesTotal: string;
  comment: string;
  disabled: boolean;
}

export type HotspotUserInput = Omit<HotspotUser, 'id' | 'uptime' | 'bytesIn' | 'bytesOut'>;

export interface HotspotProfile {
  id: string;
  name: string;
  sharedUsers: number;
  rateLimit: string;
  expiryMode: HotspotExpiryMode;
  validity: string;
  price: number;
  sellingPrice: number;
  addressPool: string;
  parentQueue: string;
  lockUser: boolean;
  lockServer: boolean;
}

export type HotspotProfileInput = Omit<HotspotProfile, 'id'>;

export interface HotspotActiveSession {
  id: string;
  server: string;
  name: string;
  address: string;
  macAddress: string;
  uptime: string;
  bytesIn: string;
  bytesOut: string;
  timeLeft: string;
  loginBy: string;
  comment: string;
}

export interface HotspotHost {
  id: string;
  macAddress: string;
  address: string;
  toAddress: string;
  server: string;
  comment: string;
  status: 'authorized' | 'bypassed' | 'waiting';
}

export interface HotspotGenerateInput {
  quantity: number;
  server: string;
  profile: string;
  usernameMode: 'voucher' | 'username-password';
  nameLength: number;
  prefix: string;
  characterSet: 'lower' | 'upper' | 'mixed' | 'digits';
  limitUptime: string;
  limitBytesTotal: string;
  comment: string;
}

export type HotspotTabName = 'users' | 'profiles' | 'active' | 'hosts';

export type HotspotListData =
  | { tab: 'users'; rows: HotspotUser[] }
  | { tab: 'profiles'; rows: HotspotProfile[] }
  | { tab: 'active'; rows: HotspotActiveSession[] }
  | { tab: 'hosts'; rows: HotspotHost[] };
