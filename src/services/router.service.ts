import { appConfig } from '@config/app.config';
import type { RouterHealth, RouterIdentity } from '@types';
import { API_ENDPOINTS } from './api/endpoints';
import type { HttpClient } from './api/http-client';

interface RouterIdentityResponse {
  name?: string;
  version?: string;
  'board-name'?: string;
  uptime?: string;
}

interface RouterResourceResponse {
  'cpu-load'?: string;
  'free-memory'?: string;
  'total-memory'?: string;
  temperature?: string;
  'fan1-speed'?: string;
  'board-name'?: string;
  version?: string;
  uptime?: string;
}

function toNumber(value: string | undefined, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function resolveRouterIp(): string {
  try {
    const url = new URL(appConfig.apiBaseUrl);
    return url.hostname || '192.168.1.1';
  } catch {
    return '192.168.1.1';
  }
}

export class RouterService {
  constructor(private readonly http: HttpClient) {}

  async getIdentity(): Promise<RouterIdentity> {
    const raw = await this.http.get<RouterIdentityResponse>(API_ENDPOINTS.router.identity);

    return {
      name: raw.name ?? 'MikroTik',
      version: raw.version ?? '—',
      boardName: raw['board-name'] ?? raw.name ?? 'RouterOS',
      uptime: raw.uptime ?? '—',
      ipAddress: resolveRouterIp(),
    };
  }

  async getHealth(): Promise<RouterHealth> {
    const raw = await this.http.get<RouterResourceResponse>(API_ENDPOINTS.router.resource);
    const totalMemory = toNumber(raw['total-memory']);
    const freeMemory = toNumber(raw['free-memory']);
    const usedMemory = Math.max(totalMemory - freeMemory, 0);
    const bytesPerGb = 1024 ** 3;

    return {
      cpuLoad: toNumber(raw['cpu-load']),
      memoryUsed: totalMemory > 0 ? usedMemory / bytesPerGb : 0,
      memoryTotal: totalMemory > 0 ? totalMemory / bytesPerGb : 0,
      temperature: toNumber(raw.temperature),
      fanRpm: toNumber(raw['fan1-speed']),
      wanDownMbps: 0,
      wanUpMbps: 0,
      latencyMs: 0,
    };
  }
}
