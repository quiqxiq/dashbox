import type {
  FirewallConnectionEntry,
  FirewallRuleEntry,
  FirewallTab,
  InterfaceTrafficEntry,
  SimpleQueueEntry,
} from '@types';

// ==========================================
// 1. Interfaces Traffic Mock
// ==========================================

export const INITIAL_INTERFACES: InterfaceTrafficEntry[] = [
  {
    id: 'if-1',
    name: 'ether1-WAN',
    type: 'ethernet',
    status: 'running',
    macAddress: '48:8F:5A:11:22:01',
    linkSpeed: '1 Gbps',
    rxRateBps: 24_580_000,
    txRateBps: 5_240_000,
    rxPacketsPerSec: 2_150,
    txPacketsPerSec: 840,
    totalRxBytes: 14_850_000_000,
    totalTxBytes: 3_120_000_000,
    drops: 0,
    errors: 0,
    comment: 'Primary ISP Fiber (Biznet)',
  },
  {
    id: 'if-2',
    name: 'ether2-LAN-Office',
    type: 'ethernet',
    status: 'running',
    macAddress: '48:8F:5A:11:22:02',
    linkSpeed: '1 Gbps',
    rxRateBps: 4_890_000,
    txRateBps: 22_140_000,
    rxPacketsPerSec: 790,
    txPacketsPerSec: 1_980,
    totalRxBytes: 2_890_000_000,
    totalTxBytes: 13_780_000_000,
    drops: 0,
    errors: 0,
    comment: 'Core Switch Distribution',
  },
  {
    id: 'if-3',
    name: 'ether3-Hotspot-AP',
    type: 'ethernet',
    status: 'running',
    macAddress: '48:8F:5A:11:22:03',
    linkSpeed: '1 Gbps',
    rxRateBps: 1_820_000,
    txRateBps: 7_650_000,
    rxPacketsPerSec: 320,
    txPacketsPerSec: 680,
    totalRxBytes: 1_120_000_000,
    totalTxBytes: 4_950_000_000,
    drops: 12,
    errors: 0,
    comment: 'UniFi AP Master Mesh',
  },
  {
    id: 'if-4',
    name: 'ether4-Backup-WAN',
    type: 'ethernet',
    status: 'link-down',
    macAddress: '48:8F:5A:11:22:04',
    linkSpeed: '1 Gbps',
    rxRateBps: 0,
    txRateBps: 0,
    rxPacketsPerSec: 0,
    txPacketsPerSec: 0,
    totalRxBytes: 240_000_000,
    totalTxBytes: 35_000_000,
    drops: 0,
    errors: 0,
    comment: 'Failover 4G LTE Gateway',
  },
  {
    id: 'if-5',
    name: 'ether5-Reserved',
    type: 'ethernet',
    status: 'disabled',
    macAddress: '48:8F:5A:11:22:05',
    linkSpeed: '1 Gbps',
    rxRateBps: 0,
    txRateBps: 0,
    rxPacketsPerSec: 0,
    txPacketsPerSec: 0,
    totalRxBytes: 0,
    totalTxBytes: 0,
    drops: 0,
    errors: 0,
    comment: 'Unused / Maintenance Port',
  },
  {
    id: 'if-6',
    name: 'sfp-plus1-Uplink',
    type: 'sfp',
    status: 'running',
    macAddress: '48:8F:5A:11:22:06',
    linkSpeed: '10 Gbps',
    rxRateBps: 58_400_000,
    txRateBps: 12_800_000,
    rxPacketsPerSec: 5_200,
    txPacketsPerSec: 1_850,
    totalRxBytes: 48_900_000_000,
    totalTxBytes: 11_400_000_000,
    drops: 0,
    errors: 0,
    comment: '10G Fiber Core Backbone',
  },
  {
    id: 'if-7',
    name: 'bridge-LAN',
    type: 'bridge',
    status: 'running',
    macAddress: '48:8F:5A:11:22:02',
    linkSpeed: '1 Gbps',
    rxRateBps: 6_710_000,
    txRateBps: 29_790_000,
    rxPacketsPerSec: 1_110,
    txPacketsPerSec: 2_660,
    totalRxBytes: 4_010_000_000,
    totalTxBytes: 18_730_000_000,
    drops: 0,
    errors: 0,
    comment: 'Internal Bridge Ports 2-3',
  },
];

let interfacesState = [...INITIAL_INTERFACES];

export function getMockInterfaces(): InterfaceTrafficEntry[] {
  return [...interfacesState];
}

export function simulateInterfaceTick(): InterfaceTrafficEntry[] {
  interfacesState = interfacesState.map((iface) => {
    if (iface.status !== 'running') return iface;

    // Small jitter +/- 15%
    const jitter = 0.85 + Math.random() * 0.3;
    const newRx = Math.max(10_000, Math.round(iface.rxRateBps * jitter));
    const newTx = Math.max(10_000, Math.round(iface.txRateBps * jitter));
    const rxPps = Math.round(newRx / (8 * 1400));
    const txPps = Math.round(newTx / (8 * 1400));

    return {
      ...iface,
      rxRateBps: newRx,
      txRateBps: newTx,
      rxPacketsPerSec: rxPps,
      txPacketsPerSec: txPps,
      totalRxBytes: iface.totalRxBytes + Math.round(newRx / 8),
      totalTxBytes: iface.totalTxBytes + Math.round(newTx / 8),
    };
  });
  return [...interfacesState];
}

// ==========================================
// 2. IP Firewall Mock
// ==========================================

export const INITIAL_FIREWALL_RULES: FirewallRuleEntry[] = [
  // Filter Rules
  {
    id: 'fw-1',
    subType: 'filter',
    chain: 'input',
    action: 'accept',
    protocol: 'all',
    packets: 1_845_210,
    bytes: 1_289_400_000,
    enabled: true,
    comment: 'defconf: accept established,related,untracked',
  },
  {
    id: 'fw-2',
    subType: 'filter',
    chain: 'input',
    action: 'drop',
    protocol: 'all',
    packets: 42_901,
    bytes: 2_150_400,
    enabled: true,
    comment: 'defconf: drop invalid',
  },
  {
    id: 'fw-3',
    subType: 'filter',
    chain: 'input',
    action: 'accept',
    protocol: 'icmp',
    packets: 18_400,
    bytes: 1_120_000,
    enabled: true,
    comment: 'defconf: accept ICMP',
  },
  {
    id: 'fw-4',
    subType: 'filter',
    chain: 'input',
    action: 'drop',
    protocol: 'tcp',
    dstPort: '22,23',
    packets: 8_720,
    bytes: 485_000,
    enabled: true,
    comment: 'block SSH/Telnet brute force',
  },
  {
    id: 'fw-5',
    subType: 'filter',
    chain: 'input',
    action: 'drop',
    inInterface: '!bridge-LAN',
    protocol: 'all',
    packets: 98_340,
    bytes: 5_210_000,
    enabled: true,
    comment: 'defconf: drop all not from LAN',
  },
  {
    id: 'fw-6',
    subType: 'filter',
    chain: 'forward',
    action: 'fasttrack-connection',
    protocol: 'tcp',
    packets: 8_940_100,
    bytes: 9_450_000_000,
    enabled: true,
    comment: 'defconf: fasttrack',
  },
  {
    id: 'fw-7',
    subType: 'filter',
    chain: 'forward',
    action: 'accept',
    protocol: 'all',
    packets: 3_210_450,
    bytes: 3_180_000_000,
    enabled: true,
    comment: 'defconf: accept in ipsec policy',
  },
  {
    id: 'fw-8',
    subType: 'filter',
    chain: 'forward',
    action: 'drop',
    protocol: 'tcp',
    dstPort: '445,135,139',
    packets: 15_230,
    bytes: 840_000,
    enabled: true,
    comment: 'drop SMB/NetBIOS worm traffic',
  },

  // NAT Rules
  {
    id: 'nat-1',
    subType: 'nat',
    chain: 'srcnat',
    action: 'masquerade',
    outInterface: 'ether1-WAN',
    protocol: 'all',
    packets: 6_890_200,
    bytes: 7_120_000_000,
    enabled: true,
    comment: 'defconf: masquerade WAN 1',
  },
  {
    id: 'nat-2',
    subType: 'nat',
    chain: 'dstnat',
    action: 'redirect',
    protocol: 'tcp',
    dstPort: '80',
    packets: 142_900,
    bytes: 8_900_000,
    enabled: true,
    comment: 'hotspot: redirect to auth portal',
  },
  {
    id: 'nat-3',
    subType: 'nat',
    chain: 'dstnat',
    action: 'dst-nat',
    protocol: 'tcp',
    dstPort: '8080',
    srcAddress: '0.0.0.0/0',
    packets: 28_400,
    bytes: 1_720_000,
    enabled: true,
    comment: 'port forward: NVR Web -> 192.168.1.250:80',
  },

  // Mangle Rules
  {
    id: 'mangle-1',
    subType: 'mangle',
    chain: 'prerouting',
    action: 'mark-connection',
    protocol: 'udp',
    dstPort: '27000-27050,3074',
    packets: 489_200,
    bytes: 42_000_000,
    enabled: true,
    comment: 'QoS: Mark Game Connection (Steam/Valorant)',
  },
  {
    id: 'mangle-2',
    subType: 'mangle',
    chain: 'prerouting',
    action: 'mark-packet',
    protocol: 'udp',
    dstPort: '5060,5061',
    packets: 74_500,
    bytes: 9_800_000,
    enabled: true,
    comment: 'QoS: Mark VoIP High Priority',
  },
];

let firewallRulesState = [...INITIAL_FIREWALL_RULES];

export function getMockFirewallRules(tab: FirewallTab): FirewallRuleEntry[] {
  if (tab === 'connections') return [];
  return firewallRulesState.filter((rule) => rule.subType === tab);
}

export function toggleFirewallRule(id: string, enabled?: boolean): FirewallRuleEntry | null {
  const current = firewallRulesState.find((r) => r.id === id);
  if (!current) return null;
  current.enabled = enabled ?? !current.enabled;
  return current;
}

export function deleteFirewallRule(id: string): boolean {
  const initial = firewallRulesState.length;
  firewallRulesState = firewallRulesState.filter((r) => r.id !== id);
  return firewallRulesState.length < initial;
}

export const INITIAL_FIREWALL_CONNECTIONS: FirewallConnectionEntry[] = [
  {
    id: 'conn-1',
    protocol: 'tcp',
    srcAddress: '192.168.1.150:54210',
    dstAddress: '142.250.190.46:443',
    replySrcAddress: '142.250.190.46:443',
    replyDstAddress: '103.14.22.88:54210',
    tcpState: 'established',
    timeout: '23h59m',
    origBytes: 8_420_000,
    respBytes: 42_900_000,
  },
  {
    id: 'conn-2',
    protocol: 'udp',
    srcAddress: '192.168.1.45:49152',
    dstAddress: '8.8.8.8:53',
    replySrcAddress: '8.8.8.8:53',
    replyDstAddress: '103.14.22.88:49152',
    timeout: '2m45s',
    origBytes: 74_200,
    respBytes: 158_900,
  },
  {
    id: 'conn-3',
    protocol: 'tcp',
    srcAddress: '192.168.1.100:60124',
    dstAddress: '104.26.12.14:443',
    replySrcAddress: '104.26.12.14:443',
    replyDstAddress: '103.14.22.88:60124',
    tcpState: 'established',
    timeout: '14h20m',
    origBytes: 1_250_000,
    respBytes: 6_780_000,
  },
  {
    id: 'conn-4',
    protocol: 'tcp',
    srcAddress: '192.168.1.220:41238',
    dstAddress: '52.114.159.201:443',
    replySrcAddress: '52.114.159.201:443',
    replyDstAddress: '103.14.22.88:41238',
    tcpState: 'established',
    timeout: '5h12m',
    origBytes: 12_400_000,
    respBytes: 28_100_000,
  },
  {
    id: 'conn-5',
    protocol: 'udp',
    srcAddress: '192.168.20.14:51820',
    dstAddress: '185.190.140.22:51820',
    replySrcAddress: '185.190.140.22:51820',
    replyDstAddress: '103.14.22.88:51820',
    timeout: '1h50m',
    origBytes: 18_900_000,
    respBytes: 31_200_000,
  },
];

export function getMockFirewallConnections(): FirewallConnectionEntry[] {
  return [...INITIAL_FIREWALL_CONNECTIONS];
}

// ==========================================
// 3. Simple Queues Mock
// ==========================================

export const INITIAL_QUEUES: SimpleQueueEntry[] = [
  {
    id: 'q-1',
    name: '1. Core-Server-Cluster',
    target: '192.168.1.10/32',
    maxLimitUpload: '50M',
    maxLimitDownload: '100M',
    maxUploadBps: 50_000_000,
    maxDownloadBps: 100_000_000,
    currentRateUploadBps: 12_400_000,
    currentRateDownloadBps: 28_900_000,
    packetRate: '1240/2150 pps',
    totalBytes: 84_500_000_000,
    priority: 1,
    queueType: 'default-small',
    enabled: true,
    comment: 'Internal Web & Database Servers',
  },
  {
    id: 'q-2',
    name: '2. Executive-VIP-Floor',
    target: '192.168.1.50/29',
    maxLimitUpload: '20M',
    maxLimitDownload: '30M',
    maxUploadBps: 20_000_000,
    maxDownloadBps: 30_000_000,
    currentRateUploadBps: 18_800_000,
    currentRateDownloadBps: 28_600_000,
    packetRate: '890/1640 pps',
    totalBytes: 32_100_000_000,
    priority: 2,
    queueType: 'default-small',
    enabled: true,
    comment: 'Boardroom & VIP Office (Saturated!)',
  },
  {
    id: 'q-3',
    name: '3. Hotspot-Users-Bandwidth',
    target: '192.168.20.0/24',
    maxLimitUpload: '15M',
    maxLimitDownload: '50M',
    maxUploadBps: 15_000_000,
    maxDownloadBps: 50_000_000,
    currentRateUploadBps: 9_200_000,
    currentRateDownloadBps: 34_500_000,
    packetRate: '410/1180 pps',
    totalBytes: 51_200_000_000,
    priority: 6,
    queueType: 'pcq-upload-default',
    enabled: true,
    comment: 'Shared Hotspot Pool (Moderate load)',
  },
  {
    id: 'q-4',
    name: '4. CCTV-Security-NVR',
    target: '192.168.30.0/24',
    maxLimitUpload: '10M',
    maxLimitDownload: '10M',
    maxUploadBps: 10_000_000,
    maxDownloadBps: 10_000_000,
    currentRateUploadBps: 4_200_000,
    currentRateDownloadBps: 4_100_000,
    packetRate: '280/290 pps',
    totalBytes: 19_800_000_000,
    priority: 4,
    queueType: 'default-small',
    enabled: true,
    comment: 'IP Cam Stream & Offsite Backup',
  },
  {
    id: 'q-5',
    name: '5. Guest-WiFi-Limit',
    target: '192.168.40.0/24',
    maxLimitUpload: '5M',
    maxLimitDownload: '10M',
    maxUploadBps: 5_000_000,
    maxDownloadBps: 10_000_000,
    currentRateUploadBps: 4_850_000,
    currentRateDownloadBps: 9_620_000,
    packetRate: '190/580 pps',
    totalBytes: 7_800_000_000,
    priority: 8,
    queueType: 'default-small',
    enabled: true,
    comment: 'Lobby & Visitor Rate limit (Limit Hit)',
  },
];

let queuesState = [...INITIAL_QUEUES];

export function getMockSimpleQueues(): SimpleQueueEntry[] {
  return [...queuesState];
}

export function toggleSimpleQueue(id: string, enabled?: boolean): SimpleQueueEntry | null {
  const current = queuesState.find((q) => q.id === id);
  if (!current) return null;
  current.enabled = enabled ?? !current.enabled;
  return current;
}

export function deleteSimpleQueue(id: string): boolean {
  const initial = queuesState.length;
  queuesState = queuesState.filter((q) => q.id !== id);
  return queuesState.length < initial;
}

export function resetSimpleQueueBytes(id: string): SimpleQueueEntry | null {
  const current = queuesState.find((q) => q.id === id);
  if (!current) return null;
  current.totalBytes = 0;
  return current;
}

export function simulateQueuesTick(): SimpleQueueEntry[] {
  queuesState = queuesState.map((q) => {
    if (!q.enabled) return q;

    // Small jitter
    const jitterUp = 0.85 + Math.random() * 0.3;
    const jitterDown = 0.85 + Math.random() * 0.3;

    const nextUp = Math.min(
      q.maxUploadBps,
      Math.max(50_000, Math.round(q.currentRateUploadBps * jitterUp)),
    );
    const nextDown = Math.min(
      q.maxDownloadBps,
      Math.max(100_000, Math.round(q.currentRateDownloadBps * jitterDown)),
    );

    return {
      ...q,
      currentRateUploadBps: nextUp,
      currentRateDownloadBps: nextDown,
      totalBytes: q.totalBytes + Math.round((nextUp + nextDown) / 8),
    };
  });
  return [...queuesState];
}
