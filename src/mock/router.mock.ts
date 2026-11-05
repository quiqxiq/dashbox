import type { RouterHealth, RouterIdentity } from '@types';
import { delay } from './delay';

export function mockIdentity(): Promise<RouterIdentity> {
  return delay({
    name: 'CCR1009-7G-1C-1S+',
    version: '7.14.3',
    boardName: 'CCR1009-7G-1C-1S+',
    uptime: '48h 14m',
    ipAddress: '192.168.1.1',
  });
}

export function mockHealth(): Promise<RouterHealth> {
  return delay({
    cpuLoad: 24,
    memoryUsed: 1.6,
    memoryTotal: 2.0,
    temperature: 42,
    fanRpm: 2840,
    wanDownMbps: 184,
    wanUpMbps: 46,
    latencyMs: 14,
  });
}
