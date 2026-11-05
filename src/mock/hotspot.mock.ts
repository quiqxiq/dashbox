import type {
  HotspotActiveSession,
  HotspotGenerateInput,
  HotspotHost,
  HotspotProfile,
  HotspotProfileInput,
  HotspotUser,
  HotspotUserInput,
} from '@types';
import { delay } from './delay';

const USERS: HotspotUser[] = [
  {
    id: 'hsu-1',
    name: 'budi-voucher-01',
    password: 'budi-voucher-01',
    server: 'hs-wlan1',
    profile: '2Jam-5K',
    macAddress: 'DC:2C:6E:9A:11:04',
    uptime: '01:18:42',
    bytesIn: '184 MB',
    bytesOut: '92 MB',
    limitUptime: '2h',
    limitBytesTotal: '1G',
    comment: 'vc-2jam',
    disabled: false,
  },
  {
    id: 'hsu-2',
    name: 'guest-88',
    password: 'guest88',
    server: 'hs-wlan1',
    profile: '2Jam-5K',
    macAddress: 'auto',
    uptime: '00:42:18',
    bytesIn: '62 MB',
    bytesOut: '31 MB',
    limitUptime: '2h',
    limitBytesTotal: '1G',
    comment: 'Tamu lobby',
    disabled: false,
  },
  {
    id: 'hsu-3',
    name: 'siswa-lab-09',
    password: 'lab0909',
    server: 'hs-wlan2',
    profile: 'Siswa-Reguler',
    macAddress: 'A4:2B:8C:11:9F:03',
    uptime: '03:12:06',
    bytesIn: '420 MB',
    bytesOut: '215 MB',
    limitUptime: '8h',
    limitBytesTotal: '5G',
    comment: 'Kelas 9A',
    disabled: false,
  },
  {
    id: 'hsu-4',
    name: 'kantin-01',
    password: 'kantin01',
    server: 'hs-wlan1',
    profile: 'Staff-10M',
    macAddress: '14:AB:C5:11:22:30',
    uptime: '1d 03:10:22',
    bytesIn: '2.1 GB',
    bytesOut: '1.4 GB',
    limitUptime: 'unlimited',
    limitBytesTotal: 'unlimited',
    comment: 'Perangkat kasir',
    disabled: false,
  },
  {
    id: 'hsu-5',
    name: 'visitor-2401',
    password: 'visitor2401',
    server: 'hs-wlan1',
    profile: '1Jam-3K',
    macAddress: 'auto',
    uptime: '00:18:54',
    bytesIn: '48 MB',
    bytesOut: '19 MB',
    limitUptime: '1h',
    limitBytesTotal: '500M',
    comment: 'vc-1jam',
    disabled: false,
  },
  {
    id: 'hsu-6',
    name: 'perpus-tablet',
    password: 'perpus123',
    server: 'hs-wlan2',
    profile: 'Siswa-Reguler',
    macAddress: '90:78:B2:12:40:1A',
    uptime: '04:08:11',
    bytesIn: '690 MB',
    bytesOut: '281 MB',
    limitUptime: '8h',
    limitBytesTotal: '5G',
    comment: 'Tablet perpustakaan',
    disabled: false,
  },
  {
    id: 'hsu-7',
    name: 'tamu-meeting',
    password: 'meeting24',
    server: 'hs-wlan1',
    profile: 'Staff-10M',
    macAddress: 'auto',
    uptime: '00:00:00',
    bytesIn: '0 B',
    bytesOut: '0 B',
    limitUptime: '4h',
    limitBytesTotal: '2G',
    comment: 'Meeting room',
    disabled: true,
  },
  {
    id: 'hsu-8',
    name: 'visitor-2378',
    password: 'visitor2378',
    server: 'hs-wlan1',
    profile: '1Jam-3K',
    macAddress: 'auto',
    uptime: '00:59:17',
    bytesIn: '138 MB',
    bytesOut: '65 MB',
    limitUptime: '1h',
    limitBytesTotal: '500M',
    comment: 'vc-1jam',
    disabled: false,
  },
  {
    id: 'hsu-9',
    name: 'lab-guru-02',
    password: 'guru02pass',
    server: 'hs-wlan2',
    profile: 'Staff-10M',
    macAddress: '54:EF:44:9D:20:02',
    uptime: '05:40:33',
    bytesIn: '1.3 GB',
    bytesOut: '860 MB',
    limitUptime: 'unlimited',
    limitBytesTotal: 'unlimited',
    comment: 'Guru IPA',
    disabled: false,
  },
  {
    id: 'hsu-10',
    name: 'guest-cafe-12',
    password: 'cafe12',
    server: 'hs-wlan1',
    profile: '2Jam-5K',
    macAddress: 'auto',
    uptime: '00:32:19',
    bytesIn: '74 MB',
    bytesOut: '42 MB',
    limitUptime: '2h',
    limitBytesTotal: '1G',
    comment: 'Pengunjung kafe',
    disabled: false,
  },
  {
    id: 'hsu-11',
    name: 'siswa-lab-12',
    password: 'lab1212',
    server: 'hs-wlan2',
    profile: 'Siswa-Reguler',
    macAddress: 'E8:9F:80:76:AA:12',
    uptime: '00:00:00',
    bytesIn: '0 B',
    bytesOut: '0 B',
    limitUptime: '8h',
    limitBytesTotal: '5G',
    comment: 'Kelas 9B',
    disabled: false,
  },
  {
    id: 'hsu-12',
    name: 'staff-frontdesk',
    password: 'frontdesk',
    server: 'hs-wlan1',
    profile: 'Staff-10M',
    macAddress: '8C:85:90:44:FA:01',
    uptime: '2d 01:04:09',
    bytesIn: '3.2 GB',
    bytesOut: '2.7 GB',
    limitUptime: 'unlimited',
    limitBytesTotal: 'unlimited',
    comment: 'Front desk',
    disabled: false,
  },
  {
    id: 'hsu-13',
    name: 'voucher-8k3m',
    password: 'voucher-8k3m',
    server: 'hs-wlan1',
    profile: '2Jam-5K',
    macAddress: 'auto',
    uptime: '00:00:00',
    bytesIn: '0 B',
    bytesOut: '0 B',
    limitUptime: '2h',
    limitBytesTotal: '1G',
    comment: 'vc-2jam',
    disabled: false,
  },
  {
    id: 'hsu-14',
    name: 'monitor-lab',
    password: 'monitorlab',
    server: 'hs-wlan2',
    profile: 'Siswa-Reguler',
    macAddress: '60:32:B1:0C:11:A2',
    uptime: '01:25:46',
    bytesIn: '208 MB',
    bytesOut: '114 MB',
    limitUptime: '8h',
    limitBytesTotal: '5G',
    comment: 'Monitoring kelas',
    disabled: false,
  },
  {
    id: 'hsu-15',
    name: 'visitor-2302',
    password: 'visitor2302',
    server: 'hs-wlan1',
    profile: '1Jam-3K',
    macAddress: 'auto',
    uptime: '00:12:23',
    bytesIn: '29 MB',
    bytesOut: '17 MB',
    limitUptime: '1h',
    limitBytesTotal: '500M',
    comment: 'vc-1jam',
    disabled: false,
  },
  {
    id: 'hsu-16',
    name: 'security-tablet',
    password: 'security',
    server: 'hs-wlan1',
    profile: 'Staff-10M',
    macAddress: '2C:54:91:80:7B:43',
    uptime: '06:18:30',
    bytesIn: '1.6 GB',
    bytesOut: '980 MB',
    limitUptime: 'unlimited',
    limitBytesTotal: 'unlimited',
    comment: 'Pos keamanan',
    disabled: false,
  },
];

const PROFILES: HotspotProfile[] = [
  {
    id: 'hsp-1',
    name: '1Jam-3K',
    sharedUsers: 1,
    rateLimit: '5M/5M',
    expiryMode: 'remove-record',
    validity: '1h',
    price: 2000,
    sellingPrice: 3000,
    addressPool: 'hs-pool',
    parentQueue: 'none',
    lockUser: false,
    lockServer: false,
  },
  {
    id: 'hsp-2',
    name: '2Jam-5K',
    sharedUsers: 1,
    rateLimit: '10M/10M',
    expiryMode: 'remove-record',
    validity: '2h',
    price: 3500,
    sellingPrice: 5000,
    addressPool: 'hs-pool',
    parentQueue: 'none',
    lockUser: true,
    lockServer: false,
  },
  {
    id: 'hsp-3',
    name: 'Siswa-Reguler',
    sharedUsers: 1,
    rateLimit: '15M/15M',
    expiryMode: 'notice',
    validity: '8h',
    price: 0,
    sellingPrice: 0,
    addressPool: 'hs-pool-siswa',
    parentQueue: 'queue-siswa',
    lockUser: true,
    lockServer: true,
  },
  {
    id: 'hsp-4',
    name: 'Staff-10M',
    sharedUsers: 2,
    rateLimit: '10M/10M',
    expiryMode: 'none',
    validity: '',
    price: 0,
    sellingPrice: 0,
    addressPool: 'hs-pool',
    parentQueue: 'queue-staff',
    lockUser: false,
    lockServer: false,
  },
];

const ACTIVE_SESSIONS: HotspotActiveSession[] = [
  {
    id: 'hsa-1',
    server: 'hs-wlan1',
    name: 'budi-voucher-01',
    address: '192.168.88.102',
    macAddress: 'DC:2C:6E:9A:11:04',
    uptime: '01:18:42',
    bytesIn: '184 MB',
    bytesOut: '92 MB',
    timeLeft: '41m 18s',
    loginBy: 'http-chap',
    comment: 'vc-2jam',
  },
  {
    id: 'hsa-2',
    server: 'hs-wlan1',
    name: 'guest-88',
    address: '192.168.88.108',
    macAddress: 'AC:12:03:88:10:01',
    uptime: '00:42:18',
    bytesIn: '62 MB',
    bytesOut: '31 MB',
    timeLeft: '1h 17m',
    loginBy: 'http-chap',
    comment: 'Tamu lobby',
  },
  {
    id: 'hsa-3',
    server: 'hs-wlan2',
    name: 'siswa-lab-09',
    address: '192.168.90.109',
    macAddress: 'A4:2B:8C:11:9F:03',
    uptime: '03:12:06',
    bytesIn: '420 MB',
    bytesOut: '215 MB',
    timeLeft: '4h 47m',
    loginBy: 'mac-cookie',
    comment: 'Kelas 9A',
  },
  {
    id: 'hsa-4',
    server: 'hs-wlan1',
    name: 'kantin-01',
    address: '192.168.88.115',
    macAddress: '14:AB:C5:11:22:30',
    uptime: '1d 03:10:22',
    bytesIn: '2.1 GB',
    bytesOut: '1.4 GB',
    timeLeft: 'unlimited',
    loginBy: 'cookie',
    comment: 'Perangkat kasir',
  },
  {
    id: 'hsa-5',
    server: 'hs-wlan1',
    name: 'visitor-2401',
    address: '192.168.88.120',
    macAddress: 'C0:25:E9:24:01:01',
    uptime: '00:18:54',
    bytesIn: '48 MB',
    bytesOut: '19 MB',
    timeLeft: '41m 06s',
    loginBy: 'http-pap',
    comment: 'vc-1jam',
  },
  {
    id: 'hsa-6',
    server: 'hs-wlan2',
    name: 'perpus-tablet',
    address: '192.168.90.120',
    macAddress: '90:78:B2:12:40:1A',
    uptime: '04:08:11',
    bytesIn: '690 MB',
    bytesOut: '281 MB',
    timeLeft: '3h 51m',
    loginBy: 'mac-cookie',
    comment: 'Tablet perpustakaan',
  },
];

const HOSTS: HotspotHost[] = [
  {
    id: 'hsh-1',
    macAddress: 'DC:2C:6E:9A:11:04',
    address: '192.168.88.102',
    toAddress: '192.168.88.102',
    server: 'hs-wlan1',
    comment: 'budi-voucher-01',
    status: 'authorized',
  },
  {
    id: 'hsh-2',
    macAddress: 'AC:12:03:88:10:01',
    address: '192.168.88.108',
    toAddress: '192.168.88.108',
    server: 'hs-wlan1',
    comment: 'guest-88',
    status: 'authorized',
  },
  {
    id: 'hsh-3',
    macAddress: 'F0:18:98:21:44:0A',
    address: '192.168.88.113',
    toAddress: '192.168.88.113',
    server: 'hs-wlan1',
    comment: 'Perangkat baru',
    status: 'waiting',
  },
  {
    id: 'hsh-4',
    macAddress: 'A4:2B:8C:11:9F:03',
    address: '192.168.90.109',
    toAddress: '192.168.90.109',
    server: 'hs-wlan2',
    comment: 'siswa-lab-09',
    status: 'authorized',
  },
  {
    id: 'hsh-5',
    macAddress: '14:AB:C5:11:22:30',
    address: '192.168.88.115',
    toAddress: '192.168.88.115',
    server: 'hs-wlan1',
    comment: 'kantin-01',
    status: 'authorized',
  },
  {
    id: 'hsh-6',
    macAddress: '72:19:4C:0B:20:31',
    address: '192.168.90.121',
    toAddress: '192.168.90.121',
    server: 'hs-wlan2',
    comment: 'Bypass printer',
    status: 'bypassed',
  },
  {
    id: 'hsh-7',
    macAddress: 'C0:25:E9:24:01:01',
    address: '192.168.88.120',
    toAddress: '192.168.88.120',
    server: 'hs-wlan1',
    comment: 'visitor-2401',
    status: 'authorized',
  },
  {
    id: 'hsh-8',
    macAddress: '9A:33:1D:77:10:FE',
    address: '192.168.90.130',
    toAddress: '192.168.90.130',
    server: 'hs-wlan2',
    comment: 'Perangkat belum login',
    status: 'waiting',
  },
];

let users = USERS.map((user) => ({ ...user }));
let profiles = PROFILES.map((profile) => ({ ...profile }));
let activeSessions = ACTIVE_SESSIONS.map((session) => ({ ...session }));
let hosts = HOSTS.map((host) => ({ ...host }));
let nextUserId = users.length + 1;
let nextProfileId = profiles.length + 1;

function assertUniqueName(
  name: string,
  records: Array<{ id: string; name: string }>,
  id?: string,
): void {
  const duplicate = records.some(
    (record) => record.id !== id && record.name.toLowerCase() === name.trim().toLowerCase(),
  );
  if (duplicate) throw new Error(`Nama "${name}" sudah digunakan`);
}

export async function loadHotspotMockData(): Promise<{
  users: HotspotUser[];
  profiles: HotspotProfile[];
  activeSessions: HotspotActiveSession[];
  hosts: HotspotHost[];
}> {
  await delay(undefined, 140);
  return {
    users: users.map((user) => ({ ...user })),
    profiles: profiles.map((profile) => ({ ...profile })),
    activeSessions: activeSessions.map((session) => ({ ...session })),
    hosts: hosts.map((host) => ({ ...host })),
  };
}

export async function saveHotspotUser(input: HotspotUserInput, id?: string): Promise<HotspotUser> {
  await delay(undefined, 120);
  const name = input.name.trim();
  if (!name) throw new Error('Nama pengguna wajib diisi');
  assertUniqueName(name, users, id);

  const existing = users.find((user) => user.id === id);
  const user: HotspotUser = {
    ...input,
    name,
    id: existing?.id ?? `hsu-${nextUserId++}`,
    uptime: existing?.uptime ?? '00:00:00',
    bytesIn: existing?.bytesIn ?? '0 B',
    bytesOut: existing?.bytesOut ?? '0 B',
  };

  if (existing) users = users.map((item) => (item.id === id ? user : item));
  else users = [user, ...users];
  return { ...user };
}

export async function removeHotspotUser(id: string): Promise<void> {
  await delay(undefined, 100);
  const user = users.find((item) => item.id === id);
  if (!user) throw new Error('Pengguna tidak ditemukan');
  users = users.filter((item) => item.id !== id);
  activeSessions = activeSessions.filter((session) => session.name !== user.name);
}

export async function resetHotspotUserCounters(id: string): Promise<void> {
  await delay(undefined, 100);
  let found = false;
  users = users.map((user) => {
    if (user.id !== id) return user;
    found = true;
    return { ...user, bytesIn: '0 B', bytesOut: '0 B' };
  });
  if (!found) throw new Error('Pengguna tidak ditemukan');
}

export async function saveHotspotProfile(
  input: HotspotProfileInput,
  id?: string,
): Promise<HotspotProfile> {
  await delay(undefined, 120);
  const name = input.name.trim();
  if (!name) throw new Error('Nama profil wajib diisi');
  assertUniqueName(name, profiles, id);

  const profile: HotspotProfile = {
    ...input,
    name,
    id: profiles.find((item) => item.id === id)?.id ?? `hsp-${nextProfileId++}`,
  };
  const existingProfile = profiles.find((item) => item.id === id);
  const existing = Boolean(existingProfile);
  profiles = existing
    ? profiles.map((item) => (item.id === id ? profile : item))
    : [profile, ...profiles];
  if (existingProfile && existingProfile.name !== name) {
    users = users.map((user) =>
      user.profile === existingProfile.name ? { ...user, profile: name } : user,
    );
  }
  return { ...profile };
}

export async function removeHotspotProfile(id: string): Promise<void> {
  await delay(undefined, 100);
  const profile = profiles.find((item) => item.id === id);
  if (!profile) throw new Error('Profil tidak ditemukan');
  if (users.some((user) => user.profile === profile.name)) {
    throw new Error(
      'Profil masih dipakai pengguna. Pindahkan pengguna ke profil lain terlebih dahulu.',
    );
  }
  profiles = profiles.filter((item) => item.id !== id);
}

function randomString(length: number, characters: string): string {
  let value = '';
  for (let index = 0; index < length; index += 1) {
    value += characters[Math.floor(Math.random() * characters.length)] ?? '';
  }
  return value;
}

export async function generateHotspotUsers(input: HotspotGenerateInput): Promise<HotspotUser[]> {
  await delay(undefined, 220);
  const quantity = Math.min(100, Math.max(1, Math.floor(input.quantity)));
  const charsets = {
    lower: 'abcdefghjkmnpqrstuvwxyz23456789',
    upper: 'ABCDEFGHJKMNPQRSTUVWXYZ23456789',
    mixed: 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789',
    digits: '23456789',
  };
  const characters = charsets[input.characterSet];
  const created: HotspotUser[] = [];

  while (created.length < quantity) {
    const name = `${input.prefix.trim()}${randomString(input.nameLength, characters)}`;
    if (users.some((user) => user.name === name) || created.some((user) => user.name === name))
      continue;
    const password =
      input.usernameMode === 'voucher' ? name : randomString(input.nameLength, characters);
    created.push({
      id: `hsu-${nextUserId++}`,
      name,
      password,
      server: input.server,
      profile: input.profile,
      macAddress: 'auto',
      uptime: '00:00:00',
      bytesIn: '0 B',
      bytesOut: '0 B',
      limitUptime: input.limitUptime.trim() || 'unlimited',
      limitBytesTotal: input.limitBytesTotal.trim() || 'unlimited',
      comment: input.comment.trim() || 'vc-generated',
      disabled: false,
    });
  }

  users = [...created, ...users];
  return created.map((user) => ({ ...user }));
}

export async function removeHotspotActiveSession(id: string): Promise<void> {
  await delay(undefined, 100);
  if (!activeSessions.some((session) => session.id === id)) {
    throw new Error('Sesi aktif tidak ditemukan');
  }
  activeSessions = activeSessions.filter((session) => session.id !== id);
}

export async function removeHotspotHost(id: string): Promise<void> {
  await delay(undefined, 100);
  if (!hosts.some((host) => host.id === id)) throw new Error('Perangkat tidak ditemukan');
  hosts = hosts.filter((host) => host.id !== id);
}
