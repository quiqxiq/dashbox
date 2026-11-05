import {
  DASHBOARD_KPIS,
  DASHBOARD_SEARCH_ITEMS,
  DASHBOARD_SHORTCUTS,
  DASHBOARD_TELEMETRY,
  THROUGHPUT_BARS,
} from '@mock/dashboard.mock';
import type { ViewRouter } from '@router/view-router';
import type {
  AccentTone,
  DashboardKpi,
  DashboardSearchFilter,
  DashboardSearchItem,
  DashboardShortcut,
  TelemetryMetric,
  ThroughputBar,
  ViewName,
} from '@types';
import { debounce } from '@utils/debounce';
import { escapeHtml } from '@utils/format';
import { icon } from '@components/ui/icon';
import type { View } from './base.view';

const TONE_TEXT: Record<AccentTone, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  tertiary: 'text-tertiary',
  error: 'text-error',
};

const TONE_GLOW: Record<AccentTone, string> = {
  primary: 'bg-primary/10',
  secondary: 'bg-secondary/10',
  tertiary: 'bg-tertiary/10',
  error: 'bg-error/10',
};

const TONE_BAR: Record<AccentTone, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  tertiary: 'bg-tertiary',
  error: 'bg-error',
};

const BADGE_TONE: Record<AccentTone, string> = {
  primary: 'bg-primary/15 text-primary',
  secondary: 'bg-secondary/15 text-secondary',
  tertiary: 'bg-tertiary/15 text-tertiary',
  error: 'bg-error-container/70 text-error',
};

const FILTERS: ReadonlyArray<{ value: DashboardSearchFilter; label: string; dot?: boolean }> = [
  { value: 'all', label: 'Semua' },
  { value: 'ppp', label: 'PPP Secret' },
  { value: 'hotspot', label: 'Hotspot Users' },
  { value: 'online', label: 'Online', dot: true },
  { value: 'offline', label: 'Offline' },
];

function throughputBarClass(bar: ThroughputBar): string {
  if (bar.active) return 'bg-primary shadow-[0_0_10px_rgba(125,211,252,0.5)]';
  if (bar.height >= 80) return 'bg-primary/80';
  if (bar.height >= 70) return 'bg-primary/70';
  if (bar.height >= 60) return 'bg-primary/60';
  if (bar.height >= 50) return 'bg-primary/50';
  if (bar.height >= 40) return 'bg-primary/40';
  if (bar.height >= 30) return 'bg-primary/30';
  return 'bg-primary/25';
}

export class DashboardView implements View {
  private root: HTMLElement | null = null;
  private filter: DashboardSearchFilter = 'all';
  private query = '';

  constructor(private readonly router: ViewRouter) {}

  mount(container: HTMLElement): this {
    const root = document.createElement('section');
    root.className = 'view flex flex-col w-full px-3.5 pb-8 space-y-4';
    root.innerHTML = `
      <div class="w-full rounded-2xl bg-surface-container/70 backdrop-blur-xl p-4 shadow-xl relative overflow-hidden ring-1 ring-outline-variant/30">
        <div class="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
        <div class="absolute -left-10 bottom-0 w-36 h-36 rounded-full bg-tertiary/10 blur-2xl pointer-events-none"></div>

        <div class="relative z-10 flex items-center justify-between gap-2 pb-2.5 border-b border-outline-variant/20">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="px-2 py-0.5 rounded-full bg-primary-container/80 text-primary text-[10px] font-bold tracking-wider uppercase">Core Router</span>
            <span class="px-2 py-0.5 rounded-full bg-surface-variant/80 text-on-surface-variant text-[10px] font-mono font-medium">v7.14.3</span>
          </div>
          <div class="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-container-high/80 shrink-0">
            <span class="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">WAN</span>
            <span class="flex items-center text-[11px] font-bold text-primary font-mono">
              ${icon('arrow_downward', 'text-[13px]')}184M
            </span>
            <span class="text-outline-variant text-[10px]">/</span>
            <span class="flex items-center text-[11px] font-bold text-secondary font-mono">
              ${icon('arrow_upward', 'text-[13px]')}46M
            </span>
          </div>
        </div>

        <div class="relative z-10 pt-2.5 pb-3">
          <h2 class="text-[15px] sm:text-base font-bold font-headline text-on-surface tracking-tight leading-snug break-words">MikroTik CCR1009-7G-1C-1S+</h2>
          <div class="flex items-center justify-between flex-wrap gap-y-1 gap-x-2 mt-1">
            <div class="flex items-center gap-1.5">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span class="text-[11px] text-on-surface font-medium">Sistem Berjalan Stabil</span>
            </div>
            <div class="flex items-center gap-1 text-[11px] text-primary font-mono font-medium bg-primary/10 px-2 py-0.5 rounded-full">
              ${icon('schedule', 'text-[13px]')}
              <span>Uptime 48h 14j</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 relative z-10 pt-1">
          ${DASHBOARD_TELEMETRY.map((metric) => this.telemetryCard(metric)).join('')}
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2.5">
        ${DASHBOARD_KPIS.map((kpi) => this.kpiCard(kpi)).join('')}
      </div>

      <div class="rounded-2xl bg-surface-container/60 backdrop-blur-xl p-3.5 ring-1 ring-outline-variant/20">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-1.5">
            ${icon('show_chart', 'text-primary text-[17px]')}
            <h3 class="text-xs font-bold uppercase tracking-wider font-headline text-on-surface">Throughput WAN</h3>
          </div>
          <span class="text-[10px] font-mono text-on-surface-variant">60 detik terakhir</span>
        </div>
        <div class="flex items-end gap-[3px] h-16">
          ${THROUGHPUT_BARS.map(
            (bar) =>
              `<div class="flex-1 rounded-sm ${throughputBarClass(bar)}" style="height:${bar.height}%"></div>`,
          ).join('')}
        </div>
        <div class="flex items-center justify-between mt-2 text-[10px] font-mono text-on-surface-variant">
          <span class="flex items-center gap-1">${icon('arrow_downward', 'text-[13px]')}184 Mbps</span>
          <span class="flex items-center gap-1">${icon('arrow_upward', 'text-[13px]')}46 Mbps</span>
        </div>
      </div>

      <div class="w-full rounded-2xl bg-surface-container/60 backdrop-blur-xl p-3.5 shadow-lg space-y-3 ring-1 ring-outline-variant/20">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            ${icon('travel_explore', 'text-primary text-[18px]')}
            <h3 class="text-xs font-bold uppercase tracking-wider text-on-surface font-headline">Pencarian Cepat</h3>
          </div>
          <span class="text-[11px] text-on-surface-variant">PPP &amp; Hotspot Aktif</span>
        </div>

        <div class="relative w-full">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            ${icon('search', 'text-[20px] text-primary')}
          </div>
          <input data-dashboard-search type="text" aria-label="Cari username, IP, MAC, atau layanan"
            placeholder="Cari username, IP, MAC, layanan..."
            class="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-variant/70 text-on-surface placeholder:text-on-surface-variant/60 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary/60 focus:bg-surface-variant/90 transition-all" />
          <button data-clear-search type="button" aria-label="Bersihkan pencarian"
            class="hidden absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-on-surface">
            ${icon('cancel', 'text-[18px]')}
          </button>
        </div>

        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1" role="group" aria-label="Filter pencarian">
          ${FILTERS.map((filter) => this.filterChip(filter)).join('')}
        </div>

        <div class="space-y-2.5 pt-1" data-results></div>
      </div>

      <div class="w-full rounded-2xl bg-surface-container/60 backdrop-blur-xl p-3.5 ring-1 ring-outline-variant/20">
        <div class="flex items-center gap-1.5 mb-3">
          ${icon('bolt', 'text-primary text-[18px]')}
          <h3 class="text-xs font-bold uppercase tracking-wider text-on-surface font-headline">Akses Cepat</h3>
        </div>
        <div class="grid grid-cols-3 gap-2">
          ${DASHBOARD_SHORTCUTS.map((shortcut) => this.shortcut(shortcut)).join('')}
        </div>
      </div>`;

    container.appendChild(root);
    this.root = root;

    this.bindSearch(root);
    this.bindShortcuts(root);
    this.renderResults();

    return this;
  }

  destroy(): void {
    this.root?.remove();
    this.root = null;
  }

  private telemetryCard(metric: TelemetryMetric): string {
    const percent = Math.min(100, Math.max(0, metric.percent));

    return `
      <div class="p-2.5 rounded-xl bg-surface-container-high/60 backdrop-blur-md flex flex-col justify-between ring-1 ring-outline-variant/20">
        <div class="flex items-center justify-between text-on-surface-variant">
          <span class="text-[11px] font-medium flex items-center gap-1">
            ${icon(metric.icon, `text-[14px] ${TONE_TEXT[metric.tone]}`)}
            ${escapeHtml(metric.label)}
          </span>
          <span class="text-[10px] font-mono ${TONE_TEXT[metric.tone]} font-semibold">${escapeHtml(metric.status)}</span>
        </div>
        <div class="mt-1.5 flex items-baseline justify-between">
          <span class="text-lg font-bold font-headline text-on-surface tracking-tight">${escapeHtml(metric.value)}</span>
          <span class="text-[10px] text-on-surface-variant font-mono">${escapeHtml(metric.meta)}</span>
        </div>
        <div class="w-full bg-surface-container-lowest/80 rounded-full h-1.5 mt-1.5 overflow-hidden">
          <div class="${TONE_BAR[metric.tone]} h-full rounded-full" style="width:${percent}%"></div>
        </div>
      </div>`;
  }

  private kpiCard(kpi: DashboardKpi): string {
    const badgeClass =
      kpi.badgeTone === 'accent'
        ? BADGE_TONE[kpi.tone]
        : kpi.badgeTone === 'error'
          ? 'bg-error-container/70 text-error'
          : 'text-on-surface-variant';

    const denominator = kpi.denominator
      ? `<span class="text-xs text-on-surface-variant font-medium">${kpi.denominator === 'TB' ? ' ' : '/'}${escapeHtml(kpi.denominator)}</span>`
      : '';

    return `
      <div class="rounded-2xl bg-surface-container/60 backdrop-blur-xl p-3 ring-1 ring-outline-variant/20 relative overflow-hidden">
        <div class="absolute -right-6 -top-6 w-20 h-20 rounded-full ${TONE_GLOW[kpi.tone]} blur-2xl"></div>
        <div class="flex items-center justify-between">
          ${icon(kpi.icon, `text-[18px] ${TONE_TEXT[kpi.tone]}`)}
          <span class="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${badgeClass}">${escapeHtml(kpi.badge)}</span>
        </div>
        <p class="mt-2 text-xl font-bold font-headline tracking-tight text-on-surface leading-none">${escapeHtml(kpi.value)}${denominator}</p>
        <p class="text-[10px] text-on-surface-variant mt-1">${escapeHtml(kpi.label)}</p>
      </div>`;
  }

  private filterChip(filter: {
    value: DashboardSearchFilter;
    label: string;
    dot?: boolean;
  }): string {
    const active = filter.value === this.filter;
    const classes = active
      ? 'bg-primary text-on-primary font-semibold'
      : 'bg-surface-variant/80 text-on-surface-variant font-medium';

    return `
      <button type="button" data-filter="${filter.value}"
        class="filter-chip px-3 py-1 rounded-full ${classes} shrink-0 text-xs transition-transform active:scale-95 ${
          filter.dot ? 'flex items-center gap-1' : ''
        }" aria-pressed="${active}">
        ${filter.dot ? '<span class="w-1.5 h-1.5 rounded-full bg-primary"></span>' : ''}
        ${escapeHtml(filter.label)}
      </button>`;
  }

  private shortcut(shortcut: DashboardShortcut): string {
    return `
      <button type="button" data-shortcut-view="${shortcut.view}"
        class="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-surface-container-high/50 hover:bg-surface-container-high/90 ring-1 ring-outline-variant/20 transition-colors active:scale-95">
        ${icon(shortcut.icon, `text-[20px] ${TONE_TEXT[shortcut.tone]}`)}
        <span class="text-[10px] text-on-surface-variant font-medium">${escapeHtml(shortcut.label)}</span>
      </button>`;
  }

  private bindSearch(root: HTMLElement): void {
    const input = root.querySelector<HTMLInputElement>('[data-dashboard-search]');
    const clearButton = root.querySelector<HTMLButtonElement>('[data-clear-search]');
    const results = root.querySelector<HTMLElement>('[data-results]');
    if (!input || !clearButton || !results) return;

    const applyInput = debounce(() => {
      this.query = input.value;
      this.renderResults();
    }, 120);

    input.addEventListener('input', () => {
      clearButton.classList.toggle('hidden', input.value.length === 0);
      applyInput();
    });

    clearButton.addEventListener('click', () => {
      input.value = '';
      this.query = '';
      clearButton.classList.add('hidden');
      this.renderResults();
      input.focus();
    });

    root.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const filter = chip.dataset.filter as DashboardSearchFilter | undefined;
        if (!filter) return;

        this.filter = filter;
        this.refreshFilterChips(root);
        this.renderResults();
      });
    });

    results.addEventListener('click', (event) => {
      const detail = (event.target as HTMLElement).closest<HTMLElement>('[data-detail-view]');
      const view = detail?.dataset.detailView as ViewName | undefined;
      if (!view) return;

      if (view === 'ppp') this.router.navigate('ppp', { tab: 'secrets' });
      else this.router.navigate(view);
    });
  }

  private bindShortcuts(root: HTMLElement): void {
    root.querySelectorAll<HTMLButtonElement>('[data-shortcut-view]').forEach((button) => {
      button.addEventListener('click', () => {
        const view = button.dataset.shortcutView as ViewName | undefined;
        if (view) this.router.navigate(view);
      });
    });
  }

  private refreshFilterChips(root: HTMLElement): void {
    root.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((chip) => {
      const active = chip.dataset.filter === this.filter;
      chip.setAttribute('aria-pressed', String(active));

      chip.classList.toggle('bg-primary', active);
      chip.classList.toggle('text-on-primary', active);
      chip.classList.toggle('font-semibold', active);
      chip.classList.toggle('bg-surface-variant/80', !active);
      chip.classList.toggle('text-on-surface-variant', !active);
      chip.classList.toggle('font-medium', !active);
    });
  }

  private renderResults(): void {
    const results = this.root?.querySelector<HTMLElement>('[data-results]');
    if (!results) return;

    const query = this.query.trim().toLowerCase();
    const items = DASHBOARD_SEARCH_ITEMS.filter((item) => {
      if (query && !item.searchText.toLowerCase().includes(query)) return false;
      if (this.filter === 'ppp') return item.type === 'ppp';
      if (this.filter === 'hotspot') return item.type === 'hotspot';
      if (this.filter === 'online') return item.status === 'online';
      if (this.filter === 'offline') return item.status !== 'online';
      return true;
    });

    if (!items.length) {
      results.innerHTML = `
        <div class="p-5 rounded-xl bg-surface-container-high/40 ring-1 ring-outline-variant/20 text-center">
          ${icon('search_off', 'text-[26px] text-on-surface-variant/60')}
          <p class="text-xs text-on-surface-variant mt-2">Tidak ada hasil untuk pencarian ini.</p>
        </div>`;
      return;
    }

    results.innerHTML = items.map((item) => this.searchResult(item)).join('');
  }

  private searchResult(item: DashboardSearchItem): string {
    const online = item.status === 'online';
    const typeBadge = online
      ? item.type === 'ppp'
        ? 'bg-primary-container text-on-primary-container'
        : 'bg-tertiary-container text-on-tertiary-container'
      : 'bg-surface-variant text-on-surface-variant';
    const itemClass = online
      ? 'bg-surface-container-high/60'
      : 'bg-surface-container-high/40 opacity-90';
    const nameClass = online ? 'text-on-surface' : 'text-on-surface/90';
    const ipClass = online
      ? item.type === 'ppp'
        ? 'text-primary'
        : 'text-tertiary'
      : 'text-on-surface-variant';
    const statusPill = online
      ? 'bg-primary/20 text-primary'
      : 'bg-surface-variant text-on-surface-variant';
    const statusNoteClass =
      item.status === 'expired'
        ? 'text-error/90'
        : online
          ? 'text-on-surface-variant'
          : 'text-on-surface-variant/70';

    const metaMarkup =
      item.type === 'ppp'
        ? `<span class="px-1 rounded bg-surface-variant text-[10px] text-secondary">${escapeHtml(item.meta)}</span>`
        : `<span class="text-[10px] text-on-surface-variant">${escapeHtml(item.meta)}</span>`;

    const footer = online
      ? `
        <div class="mt-2 pt-2 flex items-center justify-between text-[11px] text-on-surface-variant/80 bg-surface-container-lowest/40 rounded-lg px-2 py-1">
          <span class="flex items-center gap-1">${icon(item.footerIcon, `text-[13px] ${TONE_TEXT[item.type === 'ppp' ? 'primary' : 'tertiary']}`)} ${escapeHtml(item.footerLabel)}</span>
          <button type="button" data-detail-view="${item.detailView}" data-id="${escapeHtml(item.id)}"
            class="flex items-center gap-1 text-primary hover:underline">
            <span>Detail</span>${icon('arrow_forward', 'text-[13px]')}
          </button>
        </div>`
      : '';

    return `
      <div class="search-item rounded-xl ${itemClass} backdrop-blur-md p-3 transition-colors hover:bg-surface-container-high/90" data-status="${item.status}" data-type="${item.type}">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="px-1.5 py-0.5 rounded ${typeBadge} text-[9px] font-bold tracking-wide uppercase">${escapeHtml(item.typeLabel)}</span>
              <span class="text-xs font-bold ${nameClass} truncate">${escapeHtml(item.name)}</span>
            </div>
            <p class="text-[11px] text-on-surface-variant mt-1 flex items-center gap-2 flex-wrap">
              <span class="${ipClass} font-mono font-medium">${escapeHtml(item.ip)}</span>
              <span>·</span>
              ${metaMarkup}
            </p>
          </div>
          <div class="flex flex-col items-end shrink-0">
            <span class="px-2 py-0.5 rounded-full ${statusPill} text-[10px] font-bold flex items-center gap-1">
              ${online ? '<span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>' : ''}
              ${escapeHtml(item.statusLabel)}
            </span>
            <span class="text-[10px] ${statusNoteClass} mt-1">${escapeHtml(item.statusNote)}</span>
          </div>
        </div>
        ${footer}
      </div>`;
  }
}
