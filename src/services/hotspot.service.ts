import type { HotspotUser, Paginated } from '@types';
import { API_ENDPOINTS } from './api/endpoints';
import type { HttpClient } from './api/http-client';

interface HotspotUserResponse {
  '.id'?: string;
  name?: string;
  password?: string;
  server?: string;
  profile?: string;
  'mac-address'?: string;
  uptime?: string;
  'limit-uptime'?: string;
  'limit-bytes-total'?: string;
  'bytes-in'?: string;
  'bytes-out'?: string;
  comment?: string;
  disabled?: boolean;
}

export class HotspotService {
  constructor(private readonly http: HttpClient) {}

  async listUsers(): Promise<Paginated<HotspotUser>> {
    const raw = await this.http.get<HotspotUserResponse[]>(API_ENDPOINTS.hotspot.users);
    const items = raw.map((user) => ({
      id: user['.id'] ?? user.name ?? crypto.randomUUID(),
      name: user.name ?? '—',
      password: user.password ?? '',
      server: user.server ?? 'all',
      profile: user.profile ?? 'default',
      macAddress: user['mac-address'] ?? 'auto',
      uptime: user.uptime ?? '00:00:00',
      limitUptime: user['limit-uptime'] ?? '—',
      limitBytesTotal: user['limit-bytes-total'] ?? 'unlimited',
      bytesIn: user['bytes-in'] ?? '0 B',
      bytesOut: user['bytes-out'] ?? '0 B',
      comment: user.comment ?? '',
      disabled: user.disabled ?? false,
    }));

    return {
      items,
      total: items.length,
      page: 1,
      pageSize: Math.max(items.length, 1),
    };
  }
}
