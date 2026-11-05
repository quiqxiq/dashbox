export type SystemLogLevel = 'info' | 'warning' | 'error' | 'debug';

export interface SystemLogEntry {
  id: number;
  timestamp: Date;
  level: SystemLogLevel;
  topics: string;
  message: string;
}

const LOG_MESSAGES: Array<Omit<SystemLogEntry, 'id' | 'timestamp'>> = [
  { level: 'info', topics: 'system,info', message: 'router configuration changed by admin' },
  { level: 'info', topics: 'ppp,info', message: 'user budi_home_pppoe connected, 10.10.20.45' },
  { level: 'info', topics: 'interface,info', message: 'ether1 link up (1Gbps, full duplex)' },
  { level: 'warning', topics: 'system,warning', message: 'CPU load above 70% for 30 seconds' },
  {
    level: 'info',
    topics: 'firewall,info',
    message: 'input connection accepted from 192.168.1.12',
  },
  { level: 'error', topics: 'ppp,error', message: 'user guest_voucher_88 authentication failed' },
  { level: 'debug', topics: 'dhcp,debug', message: 'lease 10.10.20.88 renewed for 01:00:00' },
  { level: 'info', topics: 'system,info', message: 'NTP time synchronized with pool.ntp.org' },
  { level: 'info', topics: 'ppp,info', message: 'user andi_kantor_l2tp disconnected' },
  {
    level: 'warning',
    topics: 'interface,warning',
    message: 'ether3 traffic approaching configured limit',
  },
  { level: 'info', topics: 'firewall,info', message: 'address list updated: trusted-admins' },
  { level: 'debug', topics: 'system,debug', message: 'scheduled backup completed successfully' },
];

export function createMockSystemLog(id: number, timestamp = new Date()): SystemLogEntry {
  const message = LOG_MESSAGES[(id - 1) % LOG_MESSAGES.length];
  if (!message) throw new Error('Mock system log message not found');
  return { id, timestamp, ...message };
}

export function createMockSystemLogHistory(count: number, now = Date.now()): SystemLogEntry[] {
  return Array.from({ length: count }, (_, index) =>
    createMockSystemLog(index + 1, new Date(now - (count - index - 1) * 1_500)),
  );
}
