export interface RouterIdentity {
  name: string;
  version: string;
  boardName: string;
  uptime: string;
  ipAddress: string;
}

export interface RouterHealth {
  cpuLoad: number;
  memoryUsed: number;
  memoryTotal: number;
  temperature: number;
  fanRpm: number;
  wanDownMbps: number;
  wanUpMbps: number;
  latencyMs: number;
}
