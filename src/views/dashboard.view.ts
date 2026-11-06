import {
  DASHBOARD_KPIS,
  DASHBOARD_SEARCH_ITEMS,
  DASHBOARD_TELEMETRY,
  THROUGHPUT_BARS,
} from '@mock/dashboard.mock';
import type { ViewRouter } from '@router/view-router';
import type {
  AccentTone,
  DashboardKpi,
  DashboardSearchFilter,
  DashboardSearchItem,
  TelemetryMetric,
  ThroughputBar,
  ViewName,
} from '@types';
import { debounce } from '@utils/debounce';
import { escapeHtml } from '@utils/format';
import { icon } from '@components/ui/icon';
import { subscribeLocale, t } from '@i18n/translate';
import type { TranslationKey } from '@i18n/translate';
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

const FILTERS: ReadonlyArray<{
  value: DashboardSearchFilter;
  labelKey: TranslationKey;
  dot?: boolean;
}> = [
  { value: 'all', labelKey: 'dashboard.filterAll' },
  { value: 'ppp', labelKey: 'dashboard.filterPpp' },
  { value: 'hotspot', labelKey: 'dashboard.filterHotspot' },
  { value: 'online', labelKey: 'dashboard.filterOnline', dot: true },
  { value: 'offline', labelKey: 'dashboard.filterOffline' },
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
  private unsubscribeLocale: (() => void) | null = null;
  private filter: DashboardSearchFilter = 'all';
  private query = '';

  constructor(private readonly router: ViewRouter) {}

  mount(container: HTMLElement): this {
    this.render(container);

    this.unsubscribeLocale = subscribeLocale(() => {
      if (this.root && this.root.isConnected) {
        const queryVal = this.query;
        this.render(container);
        const input = this.root?.querySelector<HTMLInputElement>('[data-dashboard-search]');
        if (input) {
          input.value = queryVal;
          this.query = queryVal;
          const clearButton = this.root?.querySelector<HTMLButtonElement>('[data-clear-search]');
          if (clearButton) clearButton.classList.toggle('hidden', queryVal.length === 0);
          this.renderContent();
        }
      }
    });

    return this;
  }

  private render(container: HTMLElement): void {
    if (this.root) {
      this.root.remove();
      this.root = null;
    }

    const root = document.createElement('section');
    root.className = 'view flex flex-col pb-8 space-y-4';
    root.innerHTML = `
      <!-- Search & Filter Card (Primary Interface) -->
      <div class="w-full rounded-2xl bg-surface-container/70 backdrop-blur-xl p-4 shadow-lg space-y-3 ring-1 ring-outline-variant/20 relative overflow-hidden">
        <div class="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
        <div class="absolute -left-10 bottom-0 w-36 h-36 rounded-full bg-secondary/10 blur-2xl pointer-events-none"></div>

        <div class="relative z-10 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="p-1.5 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              ${icon('travel_explore', 'text-[18px]')}
            </span>
            <div>
              <h2 class="text-sm font-bold font-headline text-on-surface tracking-tight">${escapeHtml(t('dashboard.quickSearch'))}</h2>
              <p class="text-[10px] text-on-surface-variant font-medium">${escapeHtml(t('dashboard.searchScope'))}</p>
            </div>
          </div>
          <div class="flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-surface-container-high/80 text-on-surface-variant">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span>CCR1009</span>
          </div>
        </div>

        <div class="relative z-10 w-full">
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            ${icon('search', 'text-[18px] text-primary')}
          </div>
          <input data-dashboard-search type="text" aria-label="${escapeHtml(t('dashboard.searchAria'))}"
            placeholder="${escapeHtml(t('dashboard.searchPlaceholder'))}"
            class="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-variant/70 text-on-surface placeholder:text-on-surface-variant/60 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-surface-variant/90 transition-all shadow-inner" />
          <button data-clear-search type="button" aria-label="${escapeHtml(t('dashboard.clearSearch'))}"
            class="hidden absolute inset-y-0 right-0 pr-3.5 flex items-center text-on-surface-variant hover:text-on-surface cursor-pointer">
            ${icon('cancel', 'text-[18px]')}
          </button>
        </div>

        <div class="relative z-10 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 -mx-1 px-1" role="group" aria-label="${escapeHtml(t('dashboard.filterAria'))}">
          ${FILTERS.map((filter) => this.filterChip(filter)).join('')}
        </div>
      </div>

      <!-- Dynamic Content Area:
           - Query empty: Displays System Status & Telemetry + Hotspot & PPPoE KPIs + WAN Throughput
           - Query non-empty: Displays Interactive Search Results with Pulsing Dots (no text status)
      -->
      <div data-dashboard-content class="space-y-4"></div>
    `;

    container.appendChild(root);
    this.root = root;

    this.bindSearch(root);
    this.renderContent();
  }

  private renderContent(): void {
    const content = this.root?.querySelector<HTMLElement>('[data-dashboard-content]');
    if (!content) return;

    const query = this.query.trim().toLowerCase();

    if (!query) {
      // Empty Query State: System Status & Telemetry, KPIs, WAN Throughput
      content.innerHTML = `
        <!-- MikroTik System Status & Telemetry -->
        <div class="w-full rounded-2xl bg-surface-container/60 backdrop-blur-xl p-4 shadow-md ring-1 ring-outline-variant/20 relative overflow-hidden">
          <div class="flex items-center justify-between gap-2 pb-3 border-b border-outline-variant/15 flex-wrap">
            <div class="flex items-center gap-2">
              <div class="p-1.5 rounded-lg bg-secondary/15 text-secondary flex items-center justify-center">
                ${icon('router', 'text-[18px]')}
              </div>
              <div>
                <h3 class="text-xs font-bold uppercase tracking-wider font-headline text-on-surface">${escapeHtml(t('dashboard.systemStatus'))}</h3>
                <p class="text-[10px] text-on-surface-variant">${escapeHtml(t('dashboard.systemStatusDesc'))}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-mono font-bold">CCR1009-7G-1C-1S+</span>
              <span class="px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant text-[10px] font-mono">v7.14.3</span>
              <span class="px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant text-[10px] font-mono">${escapeHtml(t('dashboard.uptime', { value: '48h 14m' }))}</span>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-3">
            ${DASHBOARD_TELEMETRY.map((metric) => this.telemetryCard(metric)).join('')}
          </div>
        </div>

        <!-- Hotspot & PPPoE KPIs Overview -->
        <div>
          <div class="flex items-center gap-1.5 mb-2 px-1">
            ${icon('monitoring', 'text-primary text-[16px]')}
            <h3 class="text-xs font-bold uppercase tracking-wider font-headline text-on-surface">${escapeHtml(t('dashboard.kpiOverview'))}</h3>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            ${DASHBOARD_KPIS.map((kpi) => this.kpiCard(kpi)).join('')}
          </div>
        </div>

        <!-- WAN Live Throughput -->
        <div class="rounded-2xl bg-surface-container/60 backdrop-blur-xl p-3.5 ring-1 ring-outline-variant/20">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-1.5">
              ${icon('show_chart', 'text-primary text-[17px]')}
              <h3 class="text-xs font-bold uppercase tracking-wider font-headline text-on-surface">${escapeHtml(t('dashboard.wanThroughput'))}</h3>
            </div>
            <span class="text-[10px] font-mono text-on-surface-variant">${escapeHtml(t('dashboard.last60s'))}</span>
          </div>
          <div class="flex items-end gap-[3px] h-16">
            ${THROUGHPUT_BARS.map(
              (bar) =>
                `<div class="flex-1 rounded-sm ${throughputBarClass(bar)}" style="height:${bar.height}%"></div>`,
            ).join('')}
          </div>
          <div class="flex items-center justify-between mt-2 text-[10px] font-mono text-on-surface-variant">
            <span class="flex items-center gap-1 font-bold text-primary">${icon('arrow_downward', 'text-[13px]')}184 Mbps Down</span>
            <span class="flex items-center gap-1 font-bold text-secondary">${icon('arrow_upward', 'text-[13px]')}46 Mbps Up</span>
          </div>
        </div>

        <!-- Search Hint Footer -->
        <div class="p-3 rounded-xl bg-surface-container/40 ring-1 ring-outline-variant/15 flex items-center gap-2.5 text-on-surface-variant text-xs">
          ${icon('info', 'text-primary text-[18px] shrink-0')}
          <span class="leading-relaxed text-[11px]">${escapeHtml(t('dashboard.searchEmptyHint'))}</span>
        </div>
      `;
      return;
    }

    // Active Query State: Display Interactive Search Results
    const items = DASHBOARD_SEARCH_ITEMS.filter((item) => {
      if (!item.searchText.toLowerCase().includes(query)) return false;
      if (this.filter === 'ppp') return item.type === 'ppp';
      if (this.filter === 'hotspot') return item.type === 'hotspot';
      if (this.filter === 'online') return item.status === 'online';
      if (this.filter === 'offline') return item.status !== 'online';
      return true;
    });

    if (!items.length) {
      content.innerHTML = `
        <div class="p-8 rounded-2xl bg-surface-container/60 backdrop-blur-xl ring-1 ring-outline-variant/20 text-center flex flex-col items-center justify-center">
          <div class="w-12 h-12 rounded-2xl bg-surface-variant/60 flex items-center justify-center text-on-surface-variant/60 mb-2">
            ${icon('travel_explore', 'text-[24px]')}
          </div>
          <p class="text-xs font-semibold text-on-surface">${escapeHtml(t('dashboard.noResults'))}</p>
          <p class="text-[11px] text-on-surface-variant mt-1">"${escapeHtml(this.query)}"</p>
        </div>`;
      return;
    }

    content.innerHTML = `
      <div class="flex items-center justify-between px-1">
        <span class="text-xs font-bold text-on-surface font-headline">${escapeHtml(t('dashboard.resultsCount', { count: items.length }))}</span>
        <span class="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">${escapeHtml(t('dashboard.searchScope'))}</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5" data-results-list>
        ${items.map((item) => this.searchResultCard(item)).join('')}
      </div>
    `;

    // Bind navigation click to cards
    content.querySelectorAll<HTMLElement>('[data-detail-view]').forEach((card) => {
      card.addEventListener('click', () => {
        const view = card.dataset.detailView as ViewName | undefined;
        if (!view) return;
        if (view === 'ppp') this.router.navigate('ppp', { tab: 'secrets' });
        else this.router.navigate(view);
      });
    });
  }

  private telemetryCard(metric: TelemetryMetric): string {
    const percent = Math.min(100, Math.max(0, metric.percent));

    return `
      <div class="p-3 rounded-xl bg-surface-container-high/60 backdrop-blur-md flex flex-col justify-between ring-1 ring-outline-variant/20 relative overflow-hidden group">
        <div class="flex items-center justify-between text-on-surface-variant">
          <span class="text-[11px] font-medium flex items-center gap-1.5">
            ${icon(metric.icon, `text-[15px] ${TONE_TEXT[metric.tone]}`)}
            ${escapeHtml(t(metric.labelKey))}
          </span>
          <span class="text-[10px] font-mono ${TONE_TEXT[metric.tone]} font-semibold">${escapeHtml(t(metric.statusKey))}</span>
        </div>
        <div class="mt-2 flex items-baseline justify-between">
          <span class="text-lg font-bold font-headline text-on-surface tracking-tight">${escapeHtml(metric.value)}</span>
          <span class="text-[10px] text-on-surface-variant font-mono">${escapeHtml(metric.meta)}</span>
        </div>
        <div class="mt-2 w-full h-1 rounded-full bg-surface-variant/80 overflow-hidden">
          <div class="h-full rounded-full ${TONE_BAR[metric.tone]} transition-all duration-500" style="width: ${percent}%"></div>
        </div>
      </div>`;
  }

  private kpiCard(kpi: DashboardKpi): string {
    const badgeClass =
      kpi.badgeTone === 'accent'
        ? 'bg-primary/20 text-primary'
        : kpi.badgeTone === 'error'
          ? 'bg-error-container/70 text-error'
          : 'bg-surface-variant text-on-surface-variant';

    const denominator = kpi.denominator
      ? `<span class="text-xs text-on-surface-variant font-medium">${kpi.denominator === 'TB' ? ' ' : '/'}${escapeHtml(kpi.denominator)}</span>`
      : '';
    const badge = kpi.badgeKey ? t(kpi.badgeKey, kpi.badgeParams) : (kpi.badge ?? '');

    return `
      <div class="rounded-2xl bg-surface-container/60 backdrop-blur-xl p-3.5 ring-1 ring-outline-variant/20 relative overflow-hidden">
        <div class="absolute -right-6 -top-6 w-20 h-20 rounded-full ${TONE_GLOW[kpi.tone]} blur-2xl"></div>
        <div class="flex items-center justify-between">
          <span class="p-1.5 rounded-lg bg-surface-container-high/60 ${TONE_TEXT[kpi.tone]}">${icon(kpi.icon, 'text-[18px]')}</span>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${badgeClass}">${escapeHtml(badge)}</span>
        </div>
        <p class="mt-2.5 text-xl font-bold font-headline tracking-tight text-on-surface leading-none">${escapeHtml(kpi.value)}${denominator}</p>
        <p class="text-[10px] text-on-surface-variant mt-1.5 font-medium">${escapeHtml(t(kpi.labelKey))}</p>
      </div>`;
  }

  private filterChip(filter: {
    value: DashboardSearchFilter;
    labelKey: TranslationKey;
    dot?: boolean;
  }): string {
    const active = filter.value === this.filter;
    const classes = active
      ? 'bg-primary text-on-primary font-semibold shadow-sm'
      : 'bg-surface-variant/80 text-on-surface-variant font-medium hover:bg-surface-variant';

    return `
      <button type="button" data-filter="${filter.value}"
        class="filter-chip px-3 py-1 rounded-full ${classes} shrink-0 text-xs transition-all active:scale-95 cursor-pointer ${
          filter.dot ? 'flex items-center gap-1.5' : ''
        }" aria-pressed="${active}">
        ${filter.dot ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>' : ''}
        ${escapeHtml(t(filter.labelKey))}
      </button>`;
  }

  private searchResultCard(item: DashboardSearchItem): string {
    const isOnline = item.status === 'online';

    // Type badge styling
    const typeBadge =
      item.type === 'ppp'
        ? 'bg-primary/15 text-primary ring-1 ring-primary/25'
        : 'bg-tertiary/15 text-tertiary ring-1 ring-tertiary/25';

    // Pulsing Dot Indicator ONLY (No status text online/offline!)
    const statusIndicator = isOnline
      ? `
        <span class="relative flex h-2.5 w-2.5 shrink-0" title="Online / Aktif">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>`
      : `
        <span class="relative flex h-2.5 w-2.5 shrink-0" title="Offline / Nonaktif">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
        </span>`;

    const footerLabel = t(item.footerLabel.key, item.footerLabel.params);
    const statusNote = t(item.statusNote.key, item.statusNote.params);

    return `
      <div class="search-item rounded-xl bg-surface-container/70 backdrop-blur-md p-3.5 ring-1 ring-outline-variant/20 hover:ring-primary/40 hover:bg-surface-container-high/80 transition-all cursor-pointer flex flex-col justify-between group shadow-sm active:scale-[0.99]"
        data-detail-view="${item.detailView}" data-id="${escapeHtml(item.id)}">
        <div>
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <span class="px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase ${typeBadge}">
                ${escapeHtml(t(item.typeLabelKey))}
              </span>
              <h4 class="text-xs font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                ${escapeHtml(item.name)}
              </h4>
            </div>
            <!-- Interactive blinking indicator (Green for Online, Red for Offline/Expired) -->
            <div class="flex items-center gap-1.5 pt-0.5 shrink-0">
              ${statusIndicator}
            </div>
          </div>

          <div class="mt-2 flex items-center justify-between text-[11px] font-mono text-on-surface-variant flex-wrap gap-1">
            <span class="text-primary font-semibold">${escapeHtml(item.ip)}</span>
            <span class="px-1.5 py-0.5 rounded bg-surface-variant/80 text-[10px] text-on-surface-variant">${escapeHtml(item.meta)}</span>
          </div>
        </div>

        <div class="mt-2.5 pt-2 border-t border-outline-variant/15 flex items-center justify-between text-[10px] text-on-surface-variant/80">
          <span class="flex items-center gap-1">
            ${icon(item.footerIcon, 'text-[13px] text-on-surface-variant')}
            ${escapeHtml(footerLabel || statusNote)}
          </span>
          <span class="flex items-center gap-0.5 text-primary font-semibold group-hover:translate-x-0.5 transition-transform">
            <span>${escapeHtml(t('common.detail'))}</span>
            ${icon('chevron_right', 'text-[13px]')}
          </span>
        </div>
      </div>`;
  }

  private bindSearch(root: HTMLElement): void {
    const input = root.querySelector<HTMLInputElement>('[data-dashboard-search]');
    const clearButton = root.querySelector<HTMLButtonElement>('[data-clear-search]');
    if (!input || !clearButton) return;

    const applyInput = debounce(() => {
      this.query = input.value;
      this.renderContent();
    }, 120);

    input.addEventListener('input', () => {
      clearButton.classList.toggle('hidden', input.value.length === 0);
      applyInput();
    });

    clearButton.addEventListener('click', () => {
      input.value = '';
      this.query = '';
      clearButton.classList.add('hidden');
      this.renderContent();
      input.focus();
    });

    root.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const filter = chip.dataset.filter as DashboardSearchFilter | undefined;
        if (!filter) return;

        this.filter = filter;
        this.refreshFilterChips(root);
        this.renderContent();
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
      chip.classList.toggle('shadow-sm', active);
      chip.classList.toggle('bg-surface-variant/80', !active);
      chip.classList.toggle('text-on-surface-variant', !active);
      chip.classList.toggle('font-medium', !active);
    });
  }

  destroy(): void {
    if (this.unsubscribeLocale) {
      this.unsubscribeLocale();
      this.unsubscribeLocale = null;
    }
    this.root?.remove();
    this.root = null;
  }
}
