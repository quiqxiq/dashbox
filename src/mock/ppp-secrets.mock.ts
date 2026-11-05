import type { Paginated, PppSecret, PppSecretCreateInput, PppSecretUpdateInput } from '@types';
import type { ListSecretsQuery } from '@services/ppp-secret.service';
import { delay } from './delay';

let NEXT_ID = 15;

type SeedInput = Omit<
  PppSecret,
  'rateLimit' | 'sessionTimeout' | 'idleTimeout' | 'onlyOneSession' | 'encoding' | 'lastDisconnect'
> &
  Partial<
    Pick<
      PppSecret,
      | 'rateLimit'
      | 'sessionTimeout'
      | 'idleTimeout'
      | 'onlyOneSession'
      | 'encoding'
      | 'lastDisconnect'
    >
  >;

function makeSeed(input: SeedInput): PppSecret {
  return {
    rateLimit: '50M/50M 0/0 0/0 0/0 8',
    sessionTimeout: '00:00:00',
    idleTimeout: '00:05:00',
    onlyOneSession: false,
    encoding: '1480 / MRRU 1500',
    lastDisconnect: 'normal terminate',
    ...input,
  };
}

const SEED: readonly PppSecret[] = [
  makeSeed({
    id: 1,
    name: 'budi_residence_vlan104',
    service: 'pppoe',
    profile: '50M-Unlimited',
    localAddress: '10.10.0.1',
    remoteAddress: '10.10.14.88',
    callerId: 'DC:2C:6E:9A:11:04',
    status: 'running',
    uptime: '4d 18:22:10',
    bytesIn: '18.4 GB',
    bytesOut: '112.6 GB',
    comment: 'Pelanggan VIP Cluster 4',
  }),
  makeSeed({
    id: 2,
    name: 'warnet_core_direct',
    service: 'pppoe',
    profile: '100M-Dedicated',
    localAddress: '10.10.0.1',
    remoteAddress: '10.10.20.2',
    callerId: 'E4:8D:8C:F1:44:B2',
    status: 'running',
    uptime: '12d 04:11:05',
    bytesIn: '94.2 GB',
    bytesOut: '518.0 GB',
    comment: 'Static IP Gaming Center',
    rateLimit: '100M/100M 0/0 0/0 0/0 8',
  }),
  makeSeed({
    id: 3,
    name: 'andi_kantor_vpn',
    service: 'l2tp',
    profile: 'VPN-RemoteWorker',
    localAddress: '172.16.50.1',
    remoteAddress: '172.16.50.12',
    callerId: 'auto',
    status: 'running',
    uptime: '08:45:19',
    bytesIn: '1.2 GB',
    bytesOut: '4.8 GB',
    comment: 'IT Support Field Access',
    rateLimit: '20M/20M 0/0 0/0 0/0 8',
  }),
  makeSeed({
    id: 4,
    name: 'villa_cempaka_guest',
    service: 'sstp',
    profile: '20M-Family',
    localAddress: '10.10.0.1',
    remoteAddress: 'dynamic',
    callerId: 'F0:9F:C2:5B:33:10',
    status: 'standby',
    uptime: '—',
    bytesIn: '0 B',
    bytesOut: '0 B',
    comment: 'Dedicated Homestay PPPoE',
    rateLimit: '20M/20M 0/0 0/0 0/0 8',
    lastDisconnect: '—',
  }),
  makeSeed({
    id: 5,
    name: 'guest_voucher_temp',
    service: 'pppoe',
    profile: '5M-Hourly',
    localAddress: '10.10.0.1',
    remoteAddress: 'dynamic',
    callerId: 'auto',
    status: 'disabled',
    uptime: '—',
    bytesIn: '0 B',
    bytesOut: '0 B',
    comment: 'Expired — tagihan belum dibayar',
    rateLimit: '5M/5M 0/0 0/0 0/0 8',
    lastDisconnect: 'admin disabled',
  }),
  makeSeed({
    id: 6,
    name: 'sekolah_lab_a1',
    service: 'pppoe',
    profile: '30M-Edu',
    localAddress: '10.10.0.1',
    remoteAddress: '10.10.31.5',
    callerId: 'A4:2B:8C:11:9F:03',
    status: 'running',
    uptime: '2d 01:12:44',
    bytesIn: '6.8 GB',
    bytesOut: '22.1 GB',
    comment: 'Lab Komputer SMA 1',
    rateLimit: '30M/30M 0/0 0/0 0/0 8',
  }),
  makeSeed({
    id: 7,
    name: 'klinik_sehat_vpn',
    service: 'l2tp',
    profile: 'VPN-RemoteWorker',
    localAddress: '172.16.50.1',
    remoteAddress: '172.16.50.21',
    callerId: 'auto',
    status: 'running',
    uptime: '01:12:33',
    bytesIn: '240 MB',
    bytesOut: '1.1 GB',
    comment: 'Akses rekam medis',
    rateLimit: '20M/20M 0/0 0/0 0/0 8',
  }),
  makeSeed({
    id: 8,
    name: 'kos_melati_room12',
    service: 'pppoe',
    profile: '20M-Family',
    localAddress: '10.10.0.1',
    remoteAddress: '10.10.44.12',
    callerId: 'B8:27:EB:44:CD:71',
    status: 'running',
    uptime: '9d 07:00:02',
    bytesIn: '32.5 GB',
    bytesOut: '140.2 GB',
    comment: 'Kos mahasiswa',
    rateLimit: '20M/20M 0/0 0/0 0/0 8',
  }),
  makeSeed({
    id: 9,
    name: 'cafe_wifi_backup',
    service: 'sstp',
    profile: '20M-Family',
    localAddress: '10.10.0.1',
    remoteAddress: 'dynamic',
    callerId: 'auto',
    status: 'standby',
    uptime: '—',
    bytesIn: '0 B',
    bytesOut: '0 B',
    comment: 'Link backup cafe',
    rateLimit: '20M/20M 0/0 0/0 0/0 8',
    lastDisconnect: '—',
  }),
  makeSeed({
    id: 10,
    name: 'rt05_komplek_pppoe',
    service: 'pppoe',
    profile: '50M-Unlimited',
    localAddress: '10.10.0.1',
    remoteAddress: '10.10.51.7',
    callerId: '2C:3F:38:9B:22:6A',
    status: 'running',
    uptime: '6d 11:45:30',
    bytesIn: '44.0 GB',
    bytesOut: '210.5 GB',
    comment: 'RT 05 Komplek Griya',
  }),
  makeSeed({
    id: 11,
    name: 'guest_voucher_exp',
    service: 'pppoe',
    profile: '5M-Hourly',
    localAddress: '10.10.0.1',
    remoteAddress: 'dynamic',
    callerId: 'auto',
    status: 'disabled',
    uptime: '—',
    bytesIn: '0 B',
    bytesOut: '0 B',
    comment: 'Voucher kadaluarsa',
    rateLimit: '5M/5M 0/0 0/0 0/0 8',
    lastDisconnect: 'admin disabled',
  }),
  makeSeed({
    id: 12,
    name: 'masjid_public_net',
    service: 'pppoe',
    profile: '30M-Edu',
    localAddress: '10.10.0.1',
    remoteAddress: '10.10.31.20',
    callerId: '70:4F:57:11:88:2C',
    status: 'running',
    uptime: '15d 22:10:08',
    bytesIn: '12.9 GB',
    bytesOut: '58.4 GB',
    comment: 'WiFi jamaah',
    rateLimit: '30M/30M 0/0 0/0 0/0 8',
  }),
  makeSeed({
    id: 13,
    name: 'gudang_cctv_link',
    service: 'pppoe',
    profile: '50M-Unlimited',
    localAddress: '10.10.0.1',
    remoteAddress: '10.10.14.120',
    callerId: 'E0:D5:5E:4F:22:90',
    status: 'running',
    uptime: '3d 03:33:11',
    bytesIn: '88.1 GB',
    bytesOut: '9.4 GB',
    comment: 'Backbone CCTV gudang',
  }),
  makeSeed({
    id: 14,
    name: 'hotel_lobby_static',
    service: 'pppoe',
    profile: '100M-Dedicated',
    localAddress: '10.10.0.1',
    remoteAddress: '10.10.20.15',
    callerId: 'DC:2C:6E:AA:BB:01',
    status: 'running',
    uptime: '20d 06:14:52',
    bytesIn: '120.7 GB',
    bytesOut: '640.2 GB',
    comment: 'Lobby & front office',
    rateLimit: '100M/100M 0/0 0/0 0/0 8',
  }),
];

let DB: PppSecret[] = SEED.map((secret) => ({ ...secret }));

export async function mockListSecrets(query: ListSecretsQuery = {}): Promise<Paginated<PppSecret>> {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 6;
  let rows: PppSecret[] = [...DB];

  if (query.status) rows = rows.filter((row) => row.status === query.status);

  if (query.search) {
    const needle = query.search.toLowerCase();
    rows = rows.filter((row) =>
      `${row.name} ${row.service} ${row.profile} ${row.remoteAddress} ${row.callerId} ${row.comment}`
        .toLowerCase()
        .includes(needle),
    );
  }

  const total = rows.length;
  const items = rows.slice((page - 1) * pageSize, page * pageSize);

  return delay({ items, total, page, pageSize });
}

export async function mockGetSecret(id: number): Promise<PppSecret> {
  const found = DB.find((row) => row.id === id);
  if (!found) throw new Error(`Secret ${id} not found`);
  return delay({ ...found }, 120);
}

export async function mockCreateSecret(input: PppSecretCreateInput): Promise<PppSecret> {
  const created: PppSecret = {
    id: NEXT_ID,
    name: input.name,
    service: input.service,
    profile: input.profile,
    localAddress: input.localAddress,
    remoteAddress: input.remoteAddress,
    callerId: input.callerId,
    status: 'standby',
    uptime: '—',
    bytesIn: '0 B',
    bytesOut: '0 B',
    comment: input.comment,
    rateLimit: input.rateLimit,
    sessionTimeout: input.sessionTimeout,
    idleTimeout: input.idleTimeout,
    onlyOneSession: input.onlyOneSession,
    encoding: '1480 / MRRU 1500',
    lastDisconnect: '—',
  };

  NEXT_ID += 1;
  DB = [created, ...DB];
  return delay(created);
}

export async function mockUpdateSecret(
  id: number,
  input: PppSecretUpdateInput,
): Promise<PppSecret> {
  const index = DB.findIndex((row) => row.id === id);
  if (index < 0) throw new Error(`Secret ${id} not found`);

  const current = DB[index];
  if (!current) throw new Error(`Secret ${id} not found`);

  const patch: PppSecretUpdateInput = { ...input };
  delete patch.password;

  const updated: PppSecret = { ...current, ...patch };
  DB[index] = updated;

  return delay(updated);
}

export async function mockDeleteSecret(id: number): Promise<void> {
  DB = DB.filter((row) => row.id !== id);
  await delay(undefined, 120);
}

export async function mockEnableSecret(id: number): Promise<PppSecret> {
  const index = DB.findIndex((row) => row.id === id);
  if (index < 0) throw new Error(`Secret ${id} not found`);

  const current = DB[index];
  if (!current) throw new Error(`Secret ${id} not found`);

  const updated: PppSecret = { ...current, status: 'running' };
  DB[index] = updated;

  return delay(updated);
}

export async function mockDisableSecret(id: number): Promise<PppSecret> {
  const index = DB.findIndex((row) => row.id === id);
  if (index < 0) throw new Error(`Secret ${id} not found`);

  const current = DB[index];
  if (!current) throw new Error(`Secret ${id} not found`);

  const updated: PppSecret = { ...current, status: 'disabled' };
  DB[index] = updated;

  return delay(updated);
}

export async function mockResetCounters(id: number): Promise<void> {
  const index = DB.findIndex((row) => row.id === id);
  if (index < 0) throw new Error(`Secret ${id} not found`);

  const current = DB[index];
  if (!current) throw new Error(`Secret ${id} not found`);

  DB[index] = { ...current, bytesIn: '0 B', bytesOut: '0 B' };
  await delay(undefined, 120);
}
