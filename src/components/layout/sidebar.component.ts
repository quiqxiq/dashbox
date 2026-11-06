import {
  APP_META,
  NAV_GROUPS,
  OVERVIEW_LINKS,
  ROUTER_OPTIONS,
  type NavChild,
} from '@config/navigation.config';
import type { PppStoreApi } from '@store/ppp.store';
import { closeDrawer, toast, uiStore } from '@store/ui.store';
import type { ViewRouter } from '@router/view-router';
import type { HotspotTabName, MonitorSection, PppTabName, ViewName } from '@types';
import { LOCALE_OPTIONS } from '@config/locale.config';
import { subscribeLocale, t } from '@i18n/translate';
import { getLocale, setLocale } from '@store/locale.store';
import { escapeHtml } from '@utils/format';
import { icon } from '@components/ui/icon';

const ACCENT_TEXT: Record<'primary' | 'tertiary' | 'secondary', string> = {
  primary: 'text-primary',
  tertiary: 'text-tertiary',
  secondary: 'text-secondary',
};

const ACCENT_BORDER: Record<'primary' | 'tertiary' | 'secondary', string> = {
  primary: 'border-primary/30',
  tertiary: 'border-tertiary/30',
  secondary: 'border-secondary/30',
};

function isMonitorSection(section: string | undefined): section is MonitorSection {
  return (
    section === 'logs' || section === 'traffic' || section === 'firewall' || section === 'queues'
  );
}

export class SidebarComponent {
  private el: HTMLElement | null = null;
  private wasOpen = false;

  constructor(
    private readonly router: ViewRouter,
    private readonly ppp: PppStoreApi,
  ) {}

  mount(parent: HTMLElement): this {
    const el = document.createElement('aside');
    el.className =
      'fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] bg-surface-container-low/95 backdrop-blur-2xl shadow-[0_0_40px_rgba(0,0,0,0.6)] flex flex-col transform -translate-x-full transition-transform duration-300 ease-out pt-safe pb-safe';
    el.setAttribute('aria-label', 'Menu navigasi utama');
    el.innerHTML = this.markup();
    parent.appendChild(el);
    this.el = el;

    el.addEventListener('click', (event) => this.handleClick(event));
    el.addEventListener('keydown', (event) => this.trapFocus(event));

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && uiStore.getState().drawerOpen) closeDrawer();
    });

    uiStore.subscribe((state) => {
      el.classList.toggle('-translate-x-full', !state.drawerOpen);
      el.toggleAttribute('inert', !state.drawerOpen);
      el.setAttribute('aria-hidden', String(!state.drawerOpen));

      if (state.drawerOpen && !this.wasOpen) {
        window.requestAnimationFrame(() => {
          el.querySelector<HTMLElement>('[data-action="close-drawer"]')?.focus();
        });
      }

      if (!state.drawerOpen && this.wasOpen) {
        document.querySelector<HTMLElement>('[data-action="open-drawer"]')?.focus();
      }

      this.wasOpen = state.drawerOpen;
    });

    this.router.subscribe(() => this.refreshActive());
    this.ppp.store.subscribe(() => this.refreshActive());
    subscribeLocale(() => {
      el.innerHTML = this.markup();
      this.refreshActive();
    });

    const routerSelect = el.querySelector<HTMLSelectElement>('[data-router-select]');
    routerSelect?.addEventListener('change', () => {
      const label = routerSelect.selectedOptions[0]?.textContent ?? 'Router';
      toast(`Router aktif: ${label}`, 'info');
    });

    return this;
  }

  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (target.closest('[data-action="close-drawer"]')) {
      closeDrawer();
      return;
    }

    const localeBtn = target.closest<HTMLButtonElement>('[data-locale]');
    if (localeBtn?.dataset.locale) {
      setLocale(localeBtn.dataset.locale as 'id' | 'en');
      return;
    }

    const link = target.closest<HTMLAnchorElement>('a[data-view]');
    if (!link) return;

    event.preventDefault();
    event.stopPropagation();

    const view = link.dataset.view as ViewName | undefined;
    if (!view) return;

    const tab = link.dataset.pppTab as PppTabName | undefined;
    const hotspotTab = link.dataset.hotspotTab as HotspotTabName | undefined;
    if (view === 'ppp' && tab) {
      this.router.navigate(view, { tab });
    } else if (view === 'hotspot' && hotspotTab) {
      this.router.navigate(view, { hotspotTab });
    } else if (view === 'monitor' && isMonitorSection(link.dataset.monitorSection)) {
      this.router.navigate(view, {
        monitorSection: link.dataset.monitorSection,
      });
    } else {
      this.router.navigate(view);
    }

    closeDrawer();
  }

  private trapFocus(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || !uiStore.getState().drawerOpen) return;

    const focusable = Array.from(
      this.el?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), select, summary, [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    ).filter((element) => !element.hasAttribute('inert') && element.offsetParent !== null);

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private refreshActive(): void {
    if (!this.el) return;

    const current = this.router.current;
    const currentTab = this.ppp.store.getState().tab;
    const currentMonitorSection = this.router.currentParams.monitorSection ?? 'logs';

    this.el.querySelectorAll<HTMLAnchorElement>('a[data-view]').forEach((link) => {
      const view = link.dataset.view;
      const tab = link.dataset.pppTab;
      const monitorSection = link.dataset.monitorSection;
      const active =
        view === current &&
        (tab
          ? current === 'ppp' && tab === currentTab
          : monitorSection
            ? current === 'monitor' && monitorSection === currentMonitorSection
            : true);

      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    this.el.querySelectorAll<HTMLDetailsElement>('details.side-group').forEach((group) => {
      if (group.querySelector('a.is-active')) group.open = true;
    });
  }

  private markup(): string {
    const overview = OVERVIEW_LINKS.map(
      (link) => `
        <a href="#" data-view="${link.view}"
          class="side-link flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium">
          ${icon(link.icon, 'text-[18px]')}
          <span>${escapeHtml(t(link.labelKey))}</span>
        </a>`,
    ).join('');

    const groups = NAV_GROUPS.map(
      (group, index) => `
        <details class="side-group group" ${index === 0 ? 'open' : ''}>
          <summary class="flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container/50 hover:text-on-surface cursor-pointer list-none select-none transition-colors">
            <div class="flex items-center gap-2.5">
              ${icon(group.icon, `text-[18px] ${ACCENT_TEXT[group.accent]}`)}
              <span>${escapeHtml(t(group.labelKey))}</span>
            </div>
            ${icon('expand_more', 'side-chevron text-[16px] text-on-surface-variant/60')}
          </summary>
          <div class="mt-0.5 ml-3 pl-3 border-l ${ACCENT_BORDER[group.accent]} space-y-0.5">
            ${group.children.map((child) => this.childMarkup(child, group.accent)).join('')}
          </div>
        </details>`,
    ).join('');

    const options = ROUTER_OPTIONS.map(
      (option, index) =>
        `<option value="${escapeHtml(option.value)}" ${index === 0 ? 'selected' : ''}>${escapeHtml(option.label)}</option>`,
    ).join('');

    return `
      <div class="h-14 px-4 flex items-center justify-between shrink-0 border-b border-outline-variant/15">
        <div class="flex items-center gap-2 min-w-0">
          <img src="/favicon.svg" alt="Dashbox" width="26" height="26" class="rounded-md shrink-0 ring-1 ring-outline-variant/30" />
          <span class="font-headline font-bold text-sm text-on-surface tracking-wide">${APP_META.name}</span>
          <span class="text-[10px] font-mono text-on-surface-variant/70">${APP_META.version}</span>
        </div>
        <button type="button" data-action="close-drawer" aria-label="${escapeHtml(t('common.closeMenu'))}"
          class="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60 transition-colors">
          ${icon('close', 'text-[18px]')}
        </button>
      </div>

      <div class="px-3 pt-2.5 pb-2 shrink-0">
        <div class="relative">
          <span class="absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary pointer-events-none"></span>
          <select data-router-select aria-label="Pilih Router Aktif"
            class="w-full appearance-none rounded-lg bg-surface-container/60 border border-outline-variant/25 pl-6 pr-7 py-1.5 text-[11px] font-medium text-on-surface focus:outline-none focus:border-primary/40 cursor-pointer transition-colors">
            ${options}
          </select>
          ${icon('expand_more', 'pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[14px] text-on-surface-variant')}
        </div>
        <p class="mt-1 px-1 text-[9px] font-mono text-on-surface-variant/70">192.168.1.1 · RouterOS 7.14.3</p>
      </div>

      <nav class="flex-1 overflow-y-auto px-2 py-1" aria-label="${escapeHtml(t('nav.mainNavigation'))}">
        <div class="mb-2">
          <p class="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/60">${escapeHtml(t('nav.overview'))}</p>
          ${overview}
        </div>
        <div>
          <p class="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/60">${escapeHtml(t('nav.managementMonitor'))}</p>
          ${groups}
        </div>
      </nav>

      <div class="px-4 py-3 shrink-0 border-t border-outline-variant/15">
        <div class="flex items-center gap-2 mb-2.5">
          <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
          <span class="text-[10px] font-mono text-on-surface-variant">${APP_META.connectedLabel}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="text-on-surface-variant flex items-center gap-1 text-[10px] font-medium shrink-0">${icon('language', 'text-[14px]')}</span>
          ${LOCALE_OPTIONS.map(
            (opt) => `
            <button type="button" data-locale="${opt.value}"
              class="flex-1 px-2 py-1 rounded-md text-[10px] font-bold transition-colors ${
                getLocale() === opt.value
                  ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                  : 'text-on-surface-variant bg-surface-container/50 hover:text-on-surface'
              }">
              ${opt.value === 'id' ? 'ID' : 'EN'}
            </button>`,
          ).join('')}
        </div>
      </div>`;
  }

  private childMarkup(child: NavChild, accent: 'primary' | 'tertiary' | 'secondary'): string {
    const dataTab = child.pppTab ? `data-ppp-tab="${child.pppTab}"` : '';
    const dataMonitorSection = child.monitorSection
      ? `data-monitor-section="${child.monitorSection}"`
      : '';
    const dataHotspotTab = child.hotspotTab ? `data-hotspot-tab="${child.hotspotTab}"` : '';
    const badge = child.badge
      ? `<span class="text-[9px] font-mono text-on-surface-variant/70">${escapeHtml(child.badge)}</span>`
      : '';

    return `
      <a href="#" data-view="${child.view}" ${dataTab} ${dataMonitorSection} ${dataHotspotTab}
        class="side-link flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] font-medium">
        ${icon(child.icon, `text-[15px] ${ACCENT_TEXT[accent]}`)}
        <span class="flex-1">${escapeHtml(t(child.labelKey))}</span>
        ${badge}
      </a>`;
  }
}
