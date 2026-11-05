export type PppServiceType = 'pppoe' | 'l2tp' | 'sstp' | 'ovpn' | 'any';
export type PppStatus = 'running' | 'standby' | 'disabled';
export type PppTabName = 'interface' | 'servers' | 'secrets' | 'profiles' | 'active';

export interface PppSecret {
  id: number;
  name: string;
  service: PppServiceType;
  profile: string;
  localAddress: string;
  remoteAddress: string;
  callerId: string;
  status: PppStatus;
  uptime: string;
  bytesIn: string;
  bytesOut: string;
  comment: string;
  rateLimit: string;
  sessionTimeout: string;
  idleTimeout: string;
  onlyOneSession: boolean;
  encoding: string;
  lastDisconnect: string;
}

export interface PppProfile {
  id: string;
  name: string;
  rateLimit: string;
  localAddress: string;
  remoteAddress: string;
}

export type PppSecretCreateInput = Omit<
  PppSecret,
  'id' | 'status' | 'uptime' | 'bytesIn' | 'bytesOut' | 'encoding' | 'lastDisconnect'
> & { password?: string };

export type PppSecretUpdateInput = Partial<
  Pick<
    PppSecret,
    | 'name'
    | 'service'
    | 'profile'
    | 'localAddress'
    | 'remoteAddress'
    | 'callerId'
    | 'comment'
    | 'rateLimit'
    | 'sessionTimeout'
    | 'idleTimeout'
    | 'onlyOneSession'
  >
> & { password?: string };

export interface PppSecretFormValues {
  name: string;
  password: string;
  service: PppServiceType;
  profile: string;
  localAddress: string;
  remoteAddress: string;
  callerId: string;
  comment: string;
  rateLimit: string;
  sessionTimeout: string;
  idleTimeout: string;
  onlyOneSession: boolean;
}
