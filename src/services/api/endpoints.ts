export const API_ENDPOINTS = {
  router: {
    identity: '/system/identity',
    resource: '/system/resource',
  },
  ppp: {
    secrets: '/ppp/secret',
    secretById: (id: number): string => `/ppp/secret/${id}`,
    secretResetCounters: (id: number): string => `/ppp/secret/${id}/reset-counters`,
    profiles: '/ppp/profile',
    active: '/ppp/active',
    servers: '/interface/pppoe-server/server',
    interfaces: '/interface',
  },
  hotspot: {
    users: '/ip/hotspot/user',
    active: '/ip/hotspot/active',
  },
} as const;
