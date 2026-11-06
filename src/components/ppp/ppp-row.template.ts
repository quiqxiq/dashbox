import type { IconName, PppSecret, PppStatus } from '@types';
import { escapeHtml } from '@utils/format';
import { icon } from '@components/ui/icon';
import { t } from '@i18n/translate';
import type { TranslationKey } from '@i18n/translate';

interface PppStatusConfig {
  flagIcon: IconName;
  flagClass: string;
  labelKey: TranslationKey;
  pillClass: string;
  dotClass: string;
  ipClass: string;
  commentIcon: IconName;
  commentIconClass: string;
  uptimeClass: string;
}

export const PPP_STATUS_CONFIG: Record<PppStatus, PppStatusConfig> = {
  running: {
    flagIcon: 'play_circle',
    flagClass: 'bg-primary/15 text-primary',
    labelKey: 'status.online',
    pillClass: 'bg-primary/15 text-primary',
    dotClass: 'bg-primary animate-pulse',
    ipClass: 'text-primary',
    commentIcon: 'chat_bubble',
    commentIconClass: 'text-secondary',
    uptimeClass: 'text-secondary',
  },
  standby: {
    flagIcon: 'pause_circle',
    flagClass: 'bg-surface-container-highest text-on-surface-variant',
    labelKey: 'status.idle',
    pillClass: 'bg-surface-variant text-on-surface-variant',
    dotClass: 'bg-outline',
    ipClass: 'text-on-surface-variant',
    commentIcon: 'cottage',
    commentIconClass: 'text-outline',
    uptimeClass: 'text-on-surface-variant/60',
  },
  disabled: {
    flagIcon: 'block',
    flagClass: 'bg-error/15 text-error',
    labelKey: 'status.disabled',
    pillClass: 'bg-error-container/60 text-error',
    dotClass: 'bg-error',
    ipClass: 'text-on-surface-variant',
    commentIcon: 'warning',
    commentIconClass: 'text-error',
    uptimeClass: 'text-outline',
  },
};

function flagMarkup(secret: PppSecret): string {
  const config = PPP_STATUS_CONFIG[secret.status];
  return `<span class="inline-flex w-5 h-5 rounded-md items-center justify-center ${config.flagClass}">${icon(
    config.flagIcon,
    'text-[13px]',
  )}</span>`;
}

function cardUptime(secret: PppSecret): string {
  const config = PPP_STATUS_CONFIG[secret.status];

  if (secret.status === 'running') {
    return `<span class="w-1.5 h-1.5 rounded-full ${config.dotClass}"></span><span>${escapeHtml(secret.uptime)}</span>`;
  }

  if (secret.status === 'standby') return `<span>${escapeHtml(t('ppp.disconnected'))}</span>`;
  return `<span>${escapeHtml(t('ppp.stopped'))}</span>`;
}

export function pppTableRow(secret: PppSecret, selectedId: number | null): string {
  const config = PPP_STATUS_CONFIG[secret.status];
  const isSelected = secret.id === selectedId;
  const isDisabled = secret.status === 'disabled';
  const classes = [
    'row-item',
    'cursor-pointer',
    'border-t border-outline-variant/10',
    isSelected ? 'is-selected' : '',
    isDisabled ? 'is-disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return `
    <tr class="${classes}" data-id="${secret.id}" tabindex="0" aria-selected="${isSelected}">
      <td class="px-2.5 py-2 align-middle">${flagMarkup(secret)}</td>
      <td class="px-2.5 py-2 align-middle">
        <div class="cell-name text-[12px] font-semibold text-on-surface truncate max-w-[220px]">${escapeHtml(secret.name)}</div>
        <div class="text-[10px] font-mono text-on-surface-variant truncate max-w-[220px]">${escapeHtml(secret.callerId)}</div>
      </td>
      <td class="px-2.5 py-2 align-middle">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
          secret.status === 'running'
            ? 'bg-primary/10 text-primary'
            : 'bg-surface-container-highest text-on-surface-variant'
        }">${escapeHtml(secret.service.toUpperCase())}</span>
      </td>
      <td class="px-2.5 py-2 align-middle">
        <span class="text-[11px] text-on-surface-variant truncate max-w-[140px] inline-block">${escapeHtml(secret.profile)}</span>
      </td>
      <td class="px-2.5 py-2 align-middle">
        <span class="text-[11px] font-mono font-medium ${config.ipClass}">${escapeHtml(secret.remoteAddress)}</span>
      </td>
      <td class="px-2.5 py-2 align-middle">
        <span class="text-[11px] font-mono ${config.uptimeClass}">${escapeHtml(secret.uptime)}</span>
      </td>
      <td class="px-2.5 py-2 align-middle hidden lg:table-cell">
        <div class="flex items-center gap-1.5 max-w-[220px]">
          ${icon(config.commentIcon, `text-[13px] ${config.commentIconClass}`)}
          <span class="text-[11px] text-on-surface-variant truncate">${escapeHtml(secret.comment)}</span>
        </div>
      </td>
    </tr>`;
}

export function pppCard(secret: PppSecret, selectedId: number | null): string {
  const config = PPP_STATUS_CONFIG[secret.status];
  const isSelected = secret.id === selectedId;
  const isDisabled = secret.status === 'disabled';
  const classes = [
    'row-item',
    'p-2.5',
    'rounded-xl',
    'bg-surface-container/60',
    'backdrop-blur-md',
    'cursor-pointer',
    'flex',
    'flex-col',
    'gap-1.5',
    isSelected ? 'is-selected' : '',
    isDisabled ? 'is-disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return `
    <div class="${classes}" data-id="${secret.id}" role="button" tabindex="0"
      aria-label="${escapeHtml(t('ppp.openDetail', { name: secret.name }))}">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2.5 min-w-0">
          ${flagMarkup(secret)}
          <div class="flex flex-col min-w-0">
            <span class="text-xs font-semibold text-on-surface tracking-tight truncate ${
              isDisabled ? 'line-through' : ''
            }">${escapeHtml(secret.name)}</span>
            <span class="text-[10px] font-mono text-on-surface-variant truncate">MAC: ${escapeHtml(secret.callerId)}</span>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
            secret.status === 'running'
              ? 'bg-primary/10 text-primary'
              : 'bg-surface-container-highest text-on-surface-variant'
          }">${escapeHtml(secret.service.toUpperCase())}</span>
          <span class="text-[11px] font-mono font-medium ${config.ipClass}">${escapeHtml(secret.remoteAddress)}</span>
        </div>
      </div>
      <div class="flex items-center justify-between text-[10px] text-on-surface-variant pt-1">
        <div class="flex items-center gap-1.5 truncate max-w-[200px]">
          ${icon(config.commentIcon, `text-[13px] ${config.commentIconClass}`)}
          <span class="truncate">${escapeHtml(secret.comment)}</span>
        </div>
        <div class="flex items-center gap-1 font-mono ${config.uptimeClass}">${cardUptime(secret)}</div>
      </div>
    </div>`;
}

export function pppEmptyRow(): string {
  return `
    <tr>
      <td colspan="7" class="px-3 py-8 text-center text-on-surface-variant text-xs">
        ${icon('search_off', 'text-[22px] block mx-auto text-on-surface-variant/60')}
        <span class="mt-2 inline-block">${escapeHtml(t('ppp.empty'))}</span>
      </td>
    </tr>`;
}

export function pppEmptyCard(): string {
  return `
    <div class="p-6 rounded-xl bg-surface-container/40 ring-1 ring-outline-variant/20 text-center">
      ${icon('search_off', 'text-[26px] text-on-surface-variant/60')}
      <p class="text-xs text-on-surface-variant mt-2">${escapeHtml(t('ppp.empty'))}</p>
    </div>`;
}
