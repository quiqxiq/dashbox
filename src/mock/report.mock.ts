import type {
  ReportDayPoint,
  ReportEntry,
  ReportFilter,
  ReportResumeRow,
  ReportSummary,
} from '@types';

const PROFILES = [
  { name: '1Jam-3K', price: 3000, weight: 5 },
  { name: '2Jam-5K', price: 5000, weight: 7 },
  { name: '3Jam-8K', price: 8000, weight: 3 },
  { name: '12Jam-10K', price: 10000, weight: 2 },
  { name: '24Jam-25K', price: 25000, weight: 1 },
] as const;

const COMMENTS = [
  'vc-1jam',
  'vc-2jam',
  'regular',
  'tamu lobby',
  'siswa lab',
  'voucher baru',
  '',
] as const;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function deterministic(seed: number): () => number {
  // LCG sederhana agar data stabil antar refresh
  let state = seed % 2_147_483_647;
  if (state <= 0) state += 2_147_483_646;
  return () => {
    state = (state * 1_682_807) % 2_147_483_647;
    return (state - 1) / 2_147_483_646;
  };
}

function pickProfile(rnd: () => number): (typeof PROFILES)[number] {
  const totalWeight = PROFILES.reduce((s, p) => s + p.weight, 0);
  let r = rnd() * totalWeight;
  for (const p of PROFILES) {
    r -= p.weight;
    if (r <= 0) return p;
  }
  return PROFILES[0];
}

function makeMac(rnd: () => number): string {
  const hex = () =>
    Math.floor(rnd() * 256)
      .toString(16)
      .toUpperCase()
      .padStart(2, '0');
  return `${hex()}:${hex()}:${hex()}:${hex()}:${hex()}:${hex()}`;
}

function makeIp(rnd: () => number): string {
  return `192.168.88.${100 + Math.floor(rnd() * 130)}`;
}

const NAME_PREFIX = ['tamu', 'guest', 'vc', 'siswa', 'user', 'pelanggan', 'kantor', 'kos'] as const;

function makeUsername(i: number, profileName: string, rnd: () => number): string {
  const prefix = NAME_PREFIX[Math.floor(rnd() * NAME_PREFIX.length)];
  const suffix = pad2(Math.floor(rnd() * 90) + 10);
  const lower = profileName.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return `${prefix}-${lower}-${suffix}-${i}`;
}

function buildReportEntries(countPerDay: number[], daysBack: number): ReportEntry[] {
  const rnd = deterministic(20261106);
  const entries: ReportEntry[] = [];
  let idCounter = 1;

  for (let d = daysBack; d >= 1; d -= 1) {
    const perDay = countPerDay[daysBack - d] ?? 0;
    const base = new Date();
    base.setDate(base.getDate() - d);
    const dateStr = formatDate(base);

    for (let i = 0; i < perDay; i += 1) {
      const profile = pickProfile(rnd);
      const hour = 7 + Math.floor(rnd() * 15); // 07:00 - 21:xx
      const minute = Math.floor(rnd() * 60);
      const second = Math.floor(rnd() * 60);
      entries.push({
        id: `rpt-${idCounter}`,
        date: dateStr,
        time: `${pad2(hour)}:${pad2(minute)}:${pad2(second)}`,
        username: makeUsername(idCounter, profile.name, rnd),
        ip: makeIp(rnd),
        mac: makeMac(rnd),
        profile: profile.name,
        comment: COMMENTS[Math.floor(rnd() * COMMENTS.length)] ?? '',
        price: profile.price,
      });
      idCounter += 1;
    }
  }

  // Hari ini — 14 transaksi
  const today = new Date();
  const todayStr = formatDate(today);
  for (let i = 0; i < 14; i += 1) {
    const profile = pickProfile(rnd);
    const hour = 8 + Math.floor(rnd() * 12);
    const minute = Math.floor(rnd() * 60);
    const second = Math.floor(rnd() * 60);
    entries.push({
      id: `rpt-${idCounter}`,
      date: todayStr,
      time: `${pad2(hour)}:${pad2(minute)}:${pad2(second)}`,
      username: makeUsername(idCounter, profile.name, rnd),
      ip: makeIp(rnd),
      mac: makeMac(rnd),
      profile: profile.name,
      comment: COMMENTS[Math.floor(rnd() * COMMENTS.length)] ?? '',
      price: profile.price,
    });
    idCounter += 1;
  }

  // Urut: terbaru di atas (date desc, time desc)
  entries.sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    if (byDate !== 0) return byDate;
    return b.time.localeCompare(a.time);
  });

  return entries;
}

// 6 hari sebelumnya (7, 6, 5, 4, 3, 2, 1 hari lalu) + hari ini
export const REPORT_ENTRIES: ReportEntry[] = buildReportEntries([12, 15, 11, 18, 13, 16, 14], 7);

export function filterReportEntries(entries: ReportEntry[], filter: ReportFilter): ReportEntry[] {
  const query = filter.query.trim().toLowerCase();
  return entries.filter((e) => {
    if (filter.day !== 'all' && !e.date.endsWith(`-${filter.day}`)) return false;
    if (filter.month !== 'all' && !e.date.startsWith(filter.month)) return false;
    if (filter.year !== 'all' && !e.date.startsWith(filter.year)) return false;
    if (!query) return true;
    const haystack = `${e.username} ${e.ip} ${e.mac} ${e.profile} ${e.comment}`.toLowerCase();
    return haystack.includes(query);
  });
}

export function computeReportSummary(
  entries: ReportEntry[],
  filtered: ReportEntry[],
): ReportSummary {
  const todayStr = formatDate(new Date());
  const monthPrefix = todayStr.slice(0, 7);

  const todayEntries = entries.filter((e) => e.date === todayStr);
  const monthEntries = entries.filter((e) => e.date.startsWith(monthPrefix));

  const todayIncome = todayEntries.reduce((s, e) => s + e.price, 0);
  const monthIncome = monthEntries.reduce((s, e) => s + e.price, 0);
  const filteredIncome = filtered.reduce((s, e) => s + e.price, 0);

  // Top profile dari filtered
  const byProfile = new Map<string, number>();
  for (const e of filtered) {
    byProfile.set(e.profile, (byProfile.get(e.profile) ?? 0) + 1);
  }
  let topProfile = '-';
  let topCount = 0;
  for (const [profile, count] of byProfile) {
    if (count > topCount) {
      topCount = count;
      topProfile = profile;
    }
  }

  return {
    todayIncome,
    todayCount: todayEntries.length,
    monthIncome,
    monthCount: monthEntries.length,
    filteredIncome,
    filteredCount: filtered.length,
    average: filtered.length > 0 ? Math.round(filteredIncome / filtered.length) : 0,
    topProfile,
  };
}

export function computeResume(entries: ReportEntry[]): ReportResumeRow[] {
  const map = new Map<string, { count: number; income: number }>();
  for (const e of entries) {
    const cur = map.get(e.profile) ?? { count: 0, income: 0 };
    cur.count += 1;
    cur.income += e.price;
    map.set(e.profile, cur);
  }
  return Array.from(map.entries())
    .map(([profile, v]) => ({ profile, count: v.count, income: v.income }))
    .sort((a, b) => b.income - a.income);
}

export function computeLast7Days(entries: ReportEntry[]): ReportDayPoint[] {
  const points: ReportDayPoint[] = [];
  for (let back = 6; back >= 0; back -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - back);
    const dateStr = formatDate(d);
    const label = `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
    const dayEntries = entries.filter((e) => e.date === dateStr);
    const income = dayEntries.reduce((s, e) => s + e.price, 0);
    points.push({ label, income, count: dayEntries.length, height: 0 });
  }
  const max = Math.max(1, ...points.map((p) => p.income));
  for (const p of points) {
    p.height = Math.max(8, Math.round((p.income / max) * 100));
  }
  return points;
}

export function formatRupiah(value: number): string {
  return `Rp ${new Intl.NumberFormat('id-ID').format(value)}`;
}

// ---- Export helpers (diperlukan oleh toolbar view) ----

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function toCsv(entries: ReportEntry[]): string {
  const header = [
    'Date',
    'Time',
    'Username',
    'IP Address',
    'MAC Address',
    'Profile',
    'Comment',
    'Price',
  ];
  const rows = entries.map((e) =>
    [e.date, e.time, e.username, e.ip, e.mac, e.profile, e.comment, String(e.price)]
      .map(escapeCsvCell)
      .join(','),
  );
  return [header.join(','), ...rows].join('\n');
}

export function toXlsHtml(entries: ReportEntry[]): string {
  const rows = entries
    .map(
      (e) =>
        `<tr><td>${e.date}</td><td>${e.time}</td><td>${e.username}</td><td>${e.ip}</td><td>${e.mac}</td><td>${e.profile}</td><td>${e.comment}</td><td>${e.price}</td></tr>`,
    )
    .join('');
  return `<html xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="utf-8"></head><body><table border="1"><thead><tr><th>Date</th><th>Time</th><th>Username</th><th>IP Address</th><th>MAC Address</th><th>Profile</th><th>Comment</th><th>Price</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
}

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
