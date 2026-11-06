import { icon } from '@components/ui/icon';
import { formatCurrency, t } from '@i18n/translate';
import type { TranslationKey } from '@i18n/translate';
import type {
  HotspotActiveSession,
  HotspotHost,
  HotspotListData,
  HotspotProfile,
  HotspotTabName,
  HotspotUser,
  IconName,
} from '@types';
import { escapeHtml } from '@utils/format';

function emptyLabel(tab: HotspotTabName): string {
  switch (tab) {
    case 'users':
      return t('hotspot.emptyUsers');
    case 'profiles':
      return t('hotspot.emptyProfiles');
    case 'active':
      return t('hotspot.emptyActive');
    case 'hosts':
      return t('hotspot.emptyHosts');
  }
}

function expiryLabel(mode: HotspotProfile['expiryMode']): string {
  switch (mode) {
    case 'none':
      return t('hotspot.expiryNone');
    case 'remove':
      return t('hotspot.expiryRemove');
    case 'notice':
      return t('hotspot.expiryNotice');
    case 'remove-record':
      return t('hotspot.expiryRemoveRecord');
    case 'notice-record':
      return t('hotspot.expiryNoticeRecord');
  }
}

interface HostStatusConfig {
  labelKey: TranslationKey;
  flagIcon: IconName;
  flagClass: string;
  pillClass: string;
}

const HOST_STATUS: Record<HotspotHost['status'], HostStatusConfig> = {
  authorized: {
    labelKey: 'hotspot.hostAuthorized',
    flagIcon: 'verified',
    flagClass: 'bg-primary/15 text-primary',
    pillClass: 'bg-primary/15 text-primary',
  },
  bypassed: {
    labelKey: 'hotspot.hostBypassed',
    flagIcon: 'bolt',
    flagClass: 'bg-tertiary/15 text-tertiary',
    pillClass: 'bg-tertiary/15 text-tertiary',
  },
  waiting: {
    labelKey: 'hotspot.hostWaiting',
    flagIcon: 'schedule',
    flagClass: 'bg-surface-container-highest text-on-surface-variant',
    pillClass: 'bg-surface-container-highest text-on-surface-variant',
  },
};

export const HOTSPOT_COLUMN_COUNT: Record<HotspotTabName, number> = {
  users: 7,
  profiles: 7,
  active: 8,
  hosts: 7,
};

function flagMarkup(iconName: IconName, className: string, label: string): string {
  return `<span class="inline-flex h-5 w-5 items-center justify-center rounded-md ${className}" role="img" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">${icon(iconName, 'text-[13px]')}</span>`;
}

function tagMarkup(label: string, className: string): string {
  return `<span class="inline-flex px-2 py-0.5 rounded text-[10px] font-bold font-mono ${className}">${escapeHtml(label)}</span>`;
}

function statusPill(label: string, className: string): string {
  return `<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${className}"><span class="h-1 w-1 rounded-full bg-current"></span>${escapeHtml(label)}</span>`;
}

function userFlag(user: HotspotUser): string {
  return user.disabled
    ? flagMarkup('block', 'bg-error/15 text-error', t('hotspot.flagInactive'))
    : flagMarkup('check_circle', 'bg-primary/15 text-primary', t('hotspot.flagActive'));
}

function profileFlag(): string {
  return flagMarkup('badge', 'bg-primary/15 text-primary', t('hotspot.flagProfile'));
}

function activeFlag(): string {
  return flagMarkup('play_circle', 'bg-primary/15 text-primary', t('hotspot.flagActiveSession'));
}

function hostFlag(status: HotspotHost['status']): string {
  const config = HOST_STATUS[status];
  return flagMarkup(config.flagIcon, config.flagClass, t(config.labelKey));
}

function rowClasses(selected: boolean, disabled = false): string {
  return [
    'row-item',
    'cursor-pointer',
    'border-t',
    'border-outline-variant/10',
    selected ? 'is-selected' : '',
    disabled ? 'is-disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

function cardClasses(selected: boolean, disabled = false): string {
  return [
    'row-item',
    'p-2.5',
    'rounded-xl',
    'bg-surface-container/60',
    'backdrop-blur-md',
    'cursor-pointer',
    'flex',
    'flex-col',
    'gap-1.5',
    selected ? 'is-selected' : '',
    disabled ? 'is-disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

function commentMarkup(comment: string): string {
  const label = comment || '—';
  const iconClass = comment ? 'text-secondary' : 'text-outline';

  return `<div class="flex items-center gap-1.5 max-w-[220px]">${icon(
    'chat_bubble',
    `text-[13px] ${iconClass}`,
  )}<span class="text-[11px] text-on-surface-variant truncate">${escapeHtml(label)}</span></div>`;
}

function currency(value: number): string {
  return value ? formatCurrency(value) : '—';
}

function lockLabel(profile: HotspotProfile): string {
  const locks: string[] = [];
  if (profile.lockUser) locks.push(t('hotspot.lockMac'));
  if (profile.lockServer) locks.push(t('hotspot.lockServer'));
  return locks.length ? locks.join(' / ') : '—';
}

function cardShell(
  id: string,
  selected: boolean,
  disabled: boolean,
  label: string,
  body: string,
): string {
  return `<div class="${cardClasses(
    selected,
    disabled,
  )}" data-id="${escapeHtml(id)}" role="button" tabindex="0" aria-label="${escapeHtml(
    label,
  )}" aria-pressed="${selected}">${body}</div>`;
}

export function hotspotTableHead(tab: HotspotTabName): string {
  const statusHeader = `<th class="text-left px-2.5 py-2 w-9" aria-label="${escapeHtml(t('hotspot.colStatus'))}">${icon(
    'flag',
    'text-[12px]',
  )}</th>`;

  switch (tab) {
    case 'users':
      return `<tr>${statusHeader}
        <th class="text-left px-2.5 py-2">${escapeHtml(t('hotspot.colUserMac'))}</th>
        <th class="text-left px-2.5 py-2">${escapeHtml(t('hotspot.colProfile'))}</th>
        <th class="text-left px-2.5 py-2">${escapeHtml(t('hotspot.colServer'))}</th>
        <th class="text-left px-2.5 py-2">${escapeHtml(t('hotspot.colUptime'))}</th>
        <th class="text-left px-2.5 py-2">${escapeHtml(t('hotspot.colTraffic'))}</th>
        <th class="text-left px-2.5 py-2 hidden lg:table-cell">${escapeHtml(t('hotspot.colComment'))}</th>
      </tr>`;
    case 'profiles':
      return `<tr>${statusHeader}
        <th class="text-left px-2.5 py-2">${escapeHtml(t('hotspot.colProfileName'))}</th>
        <th class="text-left px-2.5 py-2">${escapeHtml(t('hotspot.colRateLimit'))}</th>
        <th class="text-left px-2.5 py-2">${escapeHtml(t('hotspot.colShared'))}</th>
        <th class="text-left px-2.5 py-2">${escapeHtml(t('hotspot.colValidity'))}</th>
        <th class="text-left px-2.5 py-2">${escapeHtml(t('hotspot.colPrice'))}</th>
        <th class="text-left px-2.5 py-2 hidden lg:table-cell">${escapeHtml(t('hotspot.colLock'))}</th>
      </tr>`;
    case 'active':
      return `<tr>${statusHeader}
        <th class="text-left px-2.5 py-2">${escapeHtml(t('hotspot.colUserMac'))}</th>
        <th class="text-left px-2.5 py-2">${escapeHtml(t('hotspot.colAddress'))}</th>
        <th class="text-left px-2.5 py-2">${escapeHtml(t('hotspot.colServer'))}</th>
        <th class="text-left px-2.5 py-2">${escapeHtml(t('hotspot.colUptime'))}</th>
        <th class="text-left px-2.5 py-2">${escapeHtml(t('hotspot.colTraffic'))}</th>
        <th class="text-left px-2.5 py-2">${escapeHtml(t('hotspot.colTimeLeft'))}</th>
        <th class="text-left px-2.5 py-2 hidden lg:table-cell">${escapeHtml(t('hotspot.colLoginComment'))}</th>
      </tr>`;
    case 'hosts':
      return `<tr>${statusHeader}
        <th class="text-left px-2.5 py-2">${escapeHtml(t('hotspot.colMacAddress'))}</th>
        <th class="text-left px-2.5 py-2">${escapeHtml(t('hotspot.colAddress'))}</th>
        <th class="text-left px-2.5 py-2">${escapeHtml(t('hotspot.colToAddress'))}</th>
        <th class="text-left px-2.5 py-2">${escapeHtml(t('hotspot.colServer'))}</th>
        <th class="text-left px-2.5 py-2">${escapeHtml(t('hotspot.colStatus'))}</th>
        <th class="text-left px-2.5 py-2 hidden lg:table-cell">${escapeHtml(t('hotspot.colComment'))}</th>
      </tr>`;
  }
}

export function hotspotUserRow(user: HotspotUser, selected: boolean): string {
  return `
    <tr class="${rowClasses(selected, user.disabled)}" data-id="${escapeHtml(user.id)}" tabindex="0" aria-selected="${selected}">
      <td class="px-2.5 py-2 align-middle">${userFlag(user)}</td>
      <td class="px-2.5 py-2 align-middle">
        <div class="cell-name text-[12px] font-semibold text-on-surface truncate max-w-[220px]">${escapeHtml(user.name)}</div>
        <div class="text-[10px] font-mono text-on-surface-variant truncate max-w-[220px]">${escapeHtml(user.macAddress)}</div>
      </td>
      <td class="px-2.5 py-2 align-middle">${tagMarkup(user.profile, 'bg-primary/10 text-primary')}</td>
      <td class="px-2.5 py-2 align-middle"><span class="text-[11px] text-on-surface-variant">${escapeHtml(user.server)}</span></td>
      <td class="px-2.5 py-2 align-middle"><span class="text-[11px] font-mono text-secondary">${escapeHtml(user.uptime)}</span></td>
      <td class="px-2.5 py-2 align-middle"><span class="text-[10px] font-mono text-on-surface-variant">${escapeHtml(user.bytesIn)} / ${escapeHtml(user.bytesOut)}</span></td>
      <td class="px-2.5 py-2 align-middle hidden lg:table-cell">${commentMarkup(user.comment)}</td>
    </tr>`;
}

export function hotspotProfileRow(profile: HotspotProfile, selected: boolean): string {
  return `
    <tr class="${rowClasses(selected)}" data-id="${escapeHtml(profile.id)}" tabindex="0" aria-selected="${selected}">
      <td class="px-2.5 py-2 align-middle">${profileFlag()}</td>
      <td class="px-2.5 py-2 align-middle">
        <div class="cell-name text-[12px] font-semibold text-on-surface truncate max-w-[220px]">${escapeHtml(profile.name)}</div>
        <div class="text-[10px] text-on-surface-variant truncate max-w-[220px]">${escapeHtml(t('hotspot.sharedUser', { count: profile.sharedUsers }))}</div>
      </td>
      <td class="px-2.5 py-2 align-middle"><span class="text-[11px] font-mono font-medium text-primary">${escapeHtml(profile.rateLimit || 'unlimited')}</span></td>
      <td class="px-2.5 py-2 align-middle"><span class="text-[11px] font-mono">${profile.sharedUsers}</span></td>
      <td class="px-2.5 py-2 align-middle">
        <div class="text-[11px] text-on-surface">${escapeHtml(profile.validity || '—')}</div>
        <div class="text-[10px] text-on-surface-variant truncate max-w-[180px]">${escapeHtml(expiryLabel(profile.expiryMode))}</div>
      </td>
      <td class="px-2.5 py-2 align-middle">
        <div class="text-[11px] font-mono text-on-surface">${currency(profile.sellingPrice)}</div>
        <div class="text-[10px] text-on-surface-variant">${escapeHtml(t('hotspot.cost', { value: currency(profile.price) }))}</div>
      </td>
      <td class="px-2.5 py-2 align-middle hidden lg:table-cell"><span class="text-[11px] text-on-surface-variant">${escapeHtml(lockLabel(profile))}</span></td>
    </tr>`;
}

export function hotspotActiveRow(session: HotspotActiveSession, selected: boolean): string {
  return `
    <tr class="${rowClasses(selected)}" data-id="${escapeHtml(session.id)}" tabindex="0" aria-selected="${selected}">
      <td class="px-2.5 py-2 align-middle">${activeFlag()}</td>
      <td class="px-2.5 py-2 align-middle">
        <div class="cell-name text-[12px] font-semibold text-on-surface truncate max-w-[220px]">${escapeHtml(session.name)}</div>
        <div class="text-[10px] font-mono text-on-surface-variant truncate max-w-[220px]">${escapeHtml(session.macAddress)}</div>
      </td>
      <td class="px-2.5 py-2 align-middle"><span class="text-[11px] font-mono font-medium text-primary">${escapeHtml(session.address)}</span></td>
      <td class="px-2.5 py-2 align-middle"><span class="text-[11px] text-on-surface-variant">${escapeHtml(session.server)}</span></td>
      <td class="px-2.5 py-2 align-middle"><span class="text-[11px] font-mono text-secondary">${escapeHtml(session.uptime)}</span></td>
      <td class="px-2.5 py-2 align-middle"><span class="text-[10px] font-mono text-on-surface-variant">${escapeHtml(session.bytesIn)} / ${escapeHtml(session.bytesOut)}</span></td>
      <td class="px-2.5 py-2 align-middle"><span class="text-[11px] font-mono text-secondary">${escapeHtml(session.timeLeft)}</span></td>
      <td class="px-2.5 py-2 align-middle hidden lg:table-cell">
        <div class="text-[11px] text-on-surface">${escapeHtml(session.loginBy)}</div>
        <div class="text-[10px] text-on-surface-variant truncate max-w-[180px]">${escapeHtml(session.comment || '—')}</div>
      </td>
    </tr>`;
}

export function hotspotHostRow(host: HotspotHost, selected: boolean): string {
  const config = HOST_STATUS[host.status];

  return `
    <tr class="${rowClasses(selected)}" data-id="${escapeHtml(host.id)}" tabindex="0" aria-selected="${selected}">
      <td class="px-2.5 py-2 align-middle">${hostFlag(host.status)}</td>
      <td class="px-2.5 py-2 align-middle"><span class="text-[11px] font-mono text-on-surface">${escapeHtml(host.macAddress)}</span></td>
      <td class="px-2.5 py-2 align-middle"><span class="text-[11px] font-mono font-medium text-primary">${escapeHtml(host.address)}</span></td>
      <td class="px-2.5 py-2 align-middle"><span class="text-[11px] font-mono text-on-surface-variant">${escapeHtml(host.toAddress)}</span></td>
      <td class="px-2.5 py-2 align-middle"><span class="text-[11px] text-on-surface-variant">${escapeHtml(host.server)}</span></td>
      <td class="px-2.5 py-2 align-middle">${statusPill(t(config.labelKey), config.pillClass)}</td>
      <td class="px-2.5 py-2 align-middle hidden lg:table-cell">${commentMarkup(host.comment)}</td>
    </tr>`;
}

export function hotspotUserCard(user: HotspotUser, selected: boolean): string {
  return cardShell(
    user.id,
    selected,
    user.disabled,
    t('hotspot.openDetail', { name: user.name }),
    `
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2.5 min-w-0">
          ${userFlag(user)}
          <div class="flex flex-col min-w-0">
            <span class="text-xs font-semibold text-on-surface tracking-tight truncate ${user.disabled ? 'line-through' : ''}">${escapeHtml(user.name)}</span>
            <span class="text-[10px] font-mono text-on-surface-variant truncate">MAC: ${escapeHtml(user.macAddress)}</span>
          </div>
        </div>
        <div class="flex shrink-0 items-center gap-2">${tagMarkup(user.profile, 'bg-primary/10 text-primary')}</div>
      </div>
      <div class="flex items-center justify-between gap-2 pt-1 text-[10px] text-on-surface-variant">
        <div class="flex min-w-0 items-center gap-1.5">
          ${icon('dns', 'text-[13px] text-outline')}
          <span class="truncate">${escapeHtml(user.server)}</span>
          <span class="truncate font-mono">${escapeHtml(user.bytesIn)} / ${escapeHtml(user.bytesOut)}</span>
        </div>
        <div class="flex shrink-0 items-center gap-1 font-mono text-secondary">
          ${icon('timer', 'text-[13px]')}
          <span>${escapeHtml(user.uptime)}</span>
        </div>
      </div>
      ${
        user.comment
          ? `<div class="flex items-center gap-1.5 text-[10px] text-on-surface-variant">${icon(
              'chat_bubble',
              'text-[12px] text-secondary',
            )}<span class="truncate">${escapeHtml(user.comment)}</span></div>`
          : ''
      }
    `,
  );
}

export function hotspotProfileCard(profile: HotspotProfile, selected: boolean): string {
  return cardShell(
    profile.id,
    selected,
    false,
    t('hotspot.openDetail', { name: profile.name }),
    `
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2.5 min-w-0">
          ${profileFlag()}
          <div class="flex flex-col min-w-0">
            <span class="text-xs font-semibold text-on-surface tracking-tight truncate">${escapeHtml(profile.name)}</span>
            <span class="text-[10px] text-on-surface-variant truncate">${escapeHtml(t('hotspot.sharedUser', { count: profile.sharedUsers }))}</span>
          </div>
        </div>
        <span class="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-primary/10 text-primary">${escapeHtml(profile.rateLimit || 'unlimited')}</span>
      </div>
      <div class="flex items-center justify-between gap-2 pt-1 text-[10px] text-on-surface-variant">
        <div class="flex min-w-0 items-center gap-1.5">
          ${icon('schedule', 'text-[13px] text-outline')}
          <span class="truncate">${escapeHtml(profile.validity || t('hotspot.noValidity'))}</span>
        </div>
        <div class="flex shrink-0 items-center gap-1 font-mono text-primary">${currency(profile.sellingPrice)}</div>
      </div>
      <div class="text-[10px] text-on-surface-variant truncate">${escapeHtml(expiryLabel(profile.expiryMode))} · ${escapeHtml(lockLabel(profile))}</div>
    `,
  );
}

export function hotspotActiveCard(session: HotspotActiveSession, selected: boolean): string {
  const loginInfo = session.comment ? `${session.loginBy} · ${session.comment}` : session.loginBy;

  return cardShell(
    session.id,
    selected,
    false,
    t('hotspot.openDetail', { name: session.name }),
    `
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2.5 min-w-0">
          ${activeFlag()}
          <div class="flex flex-col min-w-0">
            <span class="text-xs font-semibold text-on-surface tracking-tight truncate">${escapeHtml(session.name)}</span>
            <span class="text-[10px] font-mono text-on-surface-variant truncate">MAC: ${escapeHtml(session.macAddress)}</span>
          </div>
        </div>
        <div class="flex shrink-0 flex-col items-end">
          <span class="text-[11px] font-mono font-medium text-primary">${escapeHtml(session.address)}</span>
          <span class="text-[10px] font-mono text-secondary">${escapeHtml(session.timeLeft)}</span>
        </div>
      </div>
      <div class="flex items-center justify-between gap-2 pt-1 text-[10px] text-on-surface-variant">
        <div class="flex min-w-0 items-center gap-1.5">
          ${icon('dns', 'text-[13px] text-outline')}
          <span class="truncate">${escapeHtml(session.server)}</span>
          <span class="truncate font-mono">${escapeHtml(session.bytesIn)} / ${escapeHtml(session.bytesOut)}</span>
        </div>
        <div class="flex shrink-0 items-center gap-1 font-mono text-secondary">
          ${icon('timer', 'text-[13px]')}
          <span>${escapeHtml(session.uptime)}</span>
        </div>
      </div>
      <div class="text-[10px] text-on-surface-variant truncate">Login: ${escapeHtml(loginInfo)}</div>
    `,
  );
}

export function hotspotHostCard(host: HotspotHost, selected: boolean): string {
  const config = HOST_STATUS[host.status];

  return cardShell(
    host.id,
    selected,
    false,
    t('hotspot.openDetail', { name: host.macAddress }),
    `
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2.5 min-w-0">
          ${hostFlag(host.status)}
          <div class="flex flex-col min-w-0">
            <span class="text-xs font-semibold font-mono text-on-surface truncate">${escapeHtml(host.macAddress)}</span>
            <span class="flex items-center gap-1 text-[10px] font-mono text-on-surface-variant truncate">
              <span class="text-primary">${escapeHtml(host.address)}</span>
              ${icon('arrow_forward', 'text-[11px] text-outline')}
              <span>${escapeHtml(host.toAddress)}</span>
            </span>
          </div>
        </div>
        ${statusPill(t(config.labelKey), config.pillClass)}
      </div>
      <div class="flex items-center justify-between gap-2 pt-1 text-[10px] text-on-surface-variant">
        <div class="flex min-w-0 items-center gap-1.5">
          ${icon('dns', 'text-[13px] text-outline')}
          <span class="truncate">${escapeHtml(host.server)}</span>
        </div>
        <div class="flex min-w-0 items-center gap-1.5">
          ${icon('chat_bubble', 'text-[12px] text-secondary')}
          <span class="truncate">${escapeHtml(host.comment || '—')}</span>
        </div>
      </div>
    `,
  );
}

function hotspotEmptyRow(tab: HotspotTabName, columns: number): string {
  return `
    <tr>
      <td colspan="${columns}" class="px-3 py-8 text-center text-on-surface-variant text-xs">
        ${icon('search_off', 'text-[22px] block mx-auto text-on-surface-variant/60')}
        <span class="mt-2 inline-block">${escapeHtml(emptyLabel(tab))}</span>
      </td>
    </tr>`;
}

function hotspotLoadingRow(columns: number): string {
  return `
    <tr>
      <td colspan="${columns}" class="px-3 py-8 text-center text-on-surface-variant text-xs">
        <span class="inline-flex animate-spin text-primary">${icon('refresh', 'text-[22px]')}</span>
        <span class="mt-2 inline-block">${escapeHtml(t('hotspot.loading'))}</span>
      </td>
    </tr>`;
}

function hotspotEmptyCard(tab: HotspotTabName): string {
  return `
    <div class="p-6 rounded-xl bg-surface-container/40 ring-1 ring-outline-variant/20 text-center">
      ${icon('search_off', 'text-[26px] text-on-surface-variant/60')}
      <p class="text-xs text-on-surface-variant mt-2">${escapeHtml(emptyLabel(tab))}</p>
    </div>`;
}

function hotspotLoadingCard(): string {
  return `
    <div class="p-6 rounded-xl bg-surface-container/40 ring-1 ring-outline-variant/20 text-center">
      <span class="inline-flex animate-spin text-primary">${icon('refresh', 'text-[24px]')}</span>
      <p class="text-xs text-on-surface-variant mt-2">${escapeHtml(t('hotspot.loading'))}</p>
    </div>`;
}

export function hotspotTableBody(
  data: HotspotListData,
  selectedIds: ReadonlySet<string>,
  loading: boolean,
): string {
  const columns = HOTSPOT_COLUMN_COUNT[data.tab];
  if (loading) return hotspotLoadingRow(columns);
  if (data.rows.length === 0) return hotspotEmptyRow(data.tab, columns);

  switch (data.tab) {
    case 'users':
      return data.rows.map((user) => hotspotUserRow(user, selectedIds.has(user.id))).join('');
    case 'profiles':
      return data.rows
        .map((profile) => hotspotProfileRow(profile, selectedIds.has(profile.id)))
        .join('');
    case 'active':
      return data.rows
        .map((session) => hotspotActiveRow(session, selectedIds.has(session.id)))
        .join('');
    case 'hosts':
      return data.rows.map((host) => hotspotHostRow(host, selectedIds.has(host.id))).join('');
  }
}

export function hotspotCardsMarkup(
  data: HotspotListData,
  selectedIds: ReadonlySet<string>,
  loading: boolean,
): string {
  if (loading) return hotspotLoadingCard();
  if (data.rows.length === 0) return hotspotEmptyCard(data.tab);

  switch (data.tab) {
    case 'users':
      return data.rows.map((user) => hotspotUserCard(user, selectedIds.has(user.id))).join('');
    case 'profiles':
      return data.rows
        .map((profile) => hotspotProfileCard(profile, selectedIds.has(profile.id)))
        .join('');
    case 'active':
      return data.rows
        .map((session) => hotspotActiveCard(session, selectedIds.has(session.id)))
        .join('');
    case 'hosts':
      return data.rows.map((host) => hotspotHostCard(host, selectedIds.has(host.id))).join('');
  }
}
