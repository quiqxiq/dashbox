export type MonitorSection = 'logs' | 'traffic' | 'firewall' | 'queues';

export type InterfaceType = 'ethernet' | 'wireless' | 'vlan' | 'bridge' | 'sfp' | 'ppp';
export type InterfaceStatus = 'running' | 'disabled' | 'link-down';

export interface InterfaceTrafficEntry {
  id: string;
  name: string;
  type: InterfaceType;
  status: InterfaceStatus;
  macAddress: string;
  linkSpeed: string;
  rxRateBps: number;
  txRateBps: number;
  rxPacketsPerSec: number;
  txPacketsPerSec: number;
  totalRxBytes: number;
  totalTxBytes: number;
  drops: number;
  errors: number;
  comment?: string;
}

export type FirewallTab = 'filter' | 'nat' | 'mangle' | 'connections';

export type FirewallChain =
  'input' | 'forward' | 'output' | 'srcnat' | 'dstnat' | 'prerouting' | 'postrouting';

export type FirewallAction =
  | 'accept'
  | 'drop'
  | 'reject'
  | 'fasttrack-connection'
  | 'masquerade'
  | 'dst-nat'
  | 'redirect'
  | 'mark-connection'
  | 'mark-packet';

export interface FirewallRuleEntry {
  id: string;
  subType: 'filter' | 'nat' | 'mangle';
  chain: FirewallChain;
  action: FirewallAction;
  srcAddress?: string;
  dstAddress?: string;
  protocol: 'tcp' | 'udp' | 'icmp' | 'all';
  srcPort?: string;
  dstPort?: string;
  inInterface?: string;
  outInterface?: string;
  packets: number;
  bytes: number;
  enabled: boolean;
  comment?: string;
}

export interface FirewallConnectionEntry {
  id: string;
  protocol: string;
  srcAddress: string;
  dstAddress: string;
  replySrcAddress: string;
  replyDstAddress: string;
  tcpState?: string;
  timeout: string;
  origBytes: number;
  respBytes: number;
}

export interface SimpleQueueEntry {
  id: string;
  name: string;
  target: string;
  maxLimitUpload: string;
  maxLimitDownload: string;
  maxUploadBps: number;
  maxDownloadBps: number;
  currentRateUploadBps: number;
  currentRateDownloadBps: number;
  packetRate: string;
  totalBytes: number;
  priority: number;
  queueType: string;
  enabled: boolean;
  comment?: string;
}
