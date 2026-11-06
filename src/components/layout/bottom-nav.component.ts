import {
  getBottomNavOverflow,
  getBottomNavPrimary,
  getVisibleBottomNav,
} from '@config/navigation.config';
import type { NavBarItem } from '@config/navigation.config';
import { BottomNavSheet } from '@components/layout/bottom-nav-sheet.component';
import { icon } from '@components/ui/icon';
import { subscribeLocale, t } from '@i18n/translate';
import type { ViewRouter } from '@router/view-router';
import type { ViewName, ViewParams } from '@types';

export class BottomNavComponent {
  private sheet: BottomNavSheet | null = null;
  private el: HTMLElement | null = null;

  constructor(private readonly router: ViewRouter) {}

  mount(parent: HTMLElement): this {
    const el = document.createElement('nav');
    el.className =
      'md:hidden fixed bottom-0 inset-x-0 z-40 pb-safe bg-surface/80 backdrop-blur-xl shadow-[0_-2px_16px_rgba(0,0,0,0.35)]';
    el.setAttribute('aria-label', t('nav.mainNavigation'));
    el.innerHTML = this.render();
    parent.appendChild(el);
    this.el = el;

    this.sheet = new BottomNavSheet();
    this.sheet.mount(parent);

    el.addEventListener('click', (event) => {
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[data-nav]');
      if (link) {
        event.preventDefault();
        this.handleNavClick(link.dataset.nav, link);
        return;
      }
      const moreBtn = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-nav-more]');
      if (moreBtn) {
        event.preventDefault();
        this.openMoreSheet();
      }
    });

    this.router.subscribe(() => this.refreshActive());
    subscribeLocale(() => this.refreshLabels());
    this.refreshActive();

    return this;
  }

  private render(): string {
    const primary = getBottomNavPrimary();
    const overflow = getBottomNavOverflow();
    const hasOverflow = overflow.length > 0;

    const items = primary
      .map(
        (item) => `
          <a href="#" data-nav="${item.id}" data-view="${item.view}" aria-expanded="false"
            class="relative flex flex-col items-center justify-center gap-1 flex-1 min-w-0 h-12 text-on-surface-variant transition-colors">
            <span class="nav-dot absolute top-0.5 w-1 h-1 rounded-full bg-primary opacity-0 transition-opacity"></span>
            ${icon(item.icon, 'text-[22px]')}
            <span class="text-[10px] leading-none tracking-tight truncate max-w-full">${escapeHtmlLabel(t(item.labelKey))}</span>
            ${
              item.badge
                ? `<span class="absolute top-1 right-[calc(50%-18px)] px-1 py-px rounded-full bg-primary text-on-primary text-[8px] font-bold leading-none">${escapeHtmlLabel(item.badge)}</span>`
                : ''
            }
          </a>`,
      )
      .join('');

    const more = hasOverflow
      ? `
        <button type="button" data-nav-more aria-haspopup="dialog" aria-expanded="false"
          class="relative flex flex-col items-center justify-center gap-1 flex-1 min-w-0 h-12 text-on-surface-variant transition-colors">
          <span class="nav-dot absolute top-0.5 w-1 h-1 rounded-full bg-primary opacity-0 transition-opacity"></span>
          ${icon('more_horiz', 'text-[22px]')}
          <span class="text-[10px] leading-none tracking-tight truncate max-w-full">${escapeHtmlLabel(t('nav.more'))}</span>
          <span class="absolute top-1 right-[calc(50%-16px)] px-1 py-px rounded-full bg-tertiary text-on-tertiary text-[8px] font-bold leading-none">${overflow.length}</span>
        </button>`
      : '';

    return `
      <div class="flex justify-around items-center h-16 px-1 gap-0.5">
        ${items}${more}
      </div>`;
  }

  private refreshLabels(): void {
    if (!this.el) return;
    const activeId = this.getActiveItemId();
    this.el.setAttribute('aria-label', t('nav.mainNavigation'));
    this.el.innerHTML = this.render();
    this.markActive(activeId);
  }

  private getActiveItemId(): string | null {
    const current = this.router.current;
    const params = this.router.currentParams;
    for (const item of getVisibleBottomNav()) {
      if (item.view === current) {
        // Check if current sub-item matches this top-level item
        if (item.subItems?.some((s) => matchesSub(s, params, current))) return item.id;
        // If item has subItems but current params don't match any, still mark parent as active
        // when view matches and item is the default for that view
        if (!item.subItems || item.view !== current) return item.id;
        // For views with subItems, the parent that owns the matching subItem wins above;
        // if none matched, fall through to no match (e.g. dashboard opened via sidebar)
        if (item.subItems?.length) continue;
        return item.id;
      }
    }
    return null;
  }

  private handleNavClick(id: string | undefined, link: HTMLAnchorElement): void {
    if (!id) return;
    const item = getVisibleBottomNav().find((i) => i.id === id);
    if (!item) return;

    const isAlreadyActive = this.getActiveItemId() === id && this.router.current === item.view;

    if (item.subItems && item.subItems.length > 0) {
      if (isAlreadyActive) {
        this.openSubSheet(item);
      } else {
        this.router.navigate(item.view, item.defaultParams ?? {});
        // After navigation, if user clicks again it will open sheet; also open sheet
        // immediately on second click is enough. For first click, navigate to default.
      }
    } else {
      this.router.navigate(item.view, item.defaultParams ?? {});
    }
    void link;
  }

  private openSubSheet(item: NavBarItem): void {
    if (!this.sheet) return;
    const params = this.router.currentParams;
    const items = (item.subItems ?? []).map((sub) => ({
      id: sub.id,
      label: t(sub.labelKey),
      icon: sub.icon,
      ...(sub.badge ? { badge: sub.badge } : {}),
      active: matchesSub(sub, params, this.router.current),
    }));

    this.sheet.open(
      {
        title: t(item.labelKey),
        icon: item.icon,
        items,
        accent: item.id === 'ppp' ? 'primary' : item.id === 'hotspot' ? 'tertiary' : 'secondary',
      },
      (subId) => {
        const sub = (item.subItems ?? []).find((s) => s.id === subId);
        if (!sub) return;
        const next: ViewParams = {};
        if (sub.pppTab) next.tab = sub.pppTab;
        if (sub.monitorSection) next.monitorSection = sub.monitorSection;
        if (sub.hotspotTab) next.hotspotTab = sub.hotspotTab;
        this.router.navigate(sub.view, next);
      },
    );
  }

  private openMoreSheet(): void {
    if (!this.sheet) return;
    const overflow = getBottomNavOverflow();
    const activeId = this.getActiveItemId();
    const items = overflow.map((item) => ({
      id: item.id,
      label: t(item.labelKey),
      icon: item.icon,
      ...(item.badge ? { badge: item.badge } : {}),
      active: item.id === activeId,
    }));

    this.sheet.open(
      { title: t('nav.more'), icon: 'more_horiz', items, accent: 'secondary' },
      (id) => {
        const item = overflow.find((i) => i.id === id);
        if (!item) return;
        if (item.subItems?.length) {
          this.router.navigate(item.view, item.defaultParams ?? {});
          window.setTimeout(() => this.openSubSheet(item), 80);
        } else {
          this.router.navigate(item.view, item.defaultParams ?? {});
        }
      },
    );
  }

  private refreshActive(): void {
    this.markActive(this.getActiveItemId());
  }

  private markActive(activeId: string | null): void {
    if (!this.el) return;
    this.el.querySelectorAll<HTMLAnchorElement>('a[data-nav]').forEach((link) => {
      const active = link.dataset.nav === activeId;
      link.classList.toggle('text-primary', active);
      link.classList.toggle('font-semibold', active);
      link.classList.toggle('text-on-surface-variant', !active);
      link.setAttribute('aria-expanded', 'false');
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
      const dot = link.querySelector<HTMLElement>('.nav-dot');
      if (dot) dot.style.opacity = active ? '1' : '0';
    });

    // Highlight "More" if active item is in overflow
    const moreBtn = this.el.querySelector<HTMLButtonElement>('[data-nav-more]');
    if (moreBtn) {
      const overflow = getBottomNavOverflow();
      const inOverflow = overflow.some((i) => i.id === activeId);
      moreBtn.classList.toggle('text-primary', !!inOverflow);
      moreBtn.classList.toggle('font-semibold', !!inOverflow);
      moreBtn.classList.toggle('text-on-surface-variant', !inOverflow);
      if (inOverflow) moreBtn.setAttribute('aria-current', 'page');
      else moreBtn.removeAttribute('aria-current');
      const dot = moreBtn.querySelector<HTMLElement>('.nav-dot');
      if (dot) dot.style.opacity = inOverflow ? '1' : '0';
    }
  }
}

function matchesSub(
  sub: { pppTab?: string; monitorSection?: string; hotspotTab?: string },
  params: ViewParams,
  current: ViewName,
): boolean {
  if (sub.pppTab) return current === 'ppp' && params.tab === sub.pppTab;
  if (sub.monitorSection)
    return current === 'monitor' && params.monitorSection === sub.monitorSection;
  if (sub.hotspotTab) return current === 'hotspot' && params.hotspotTab === sub.hotspotTab;
  return false;
}

function escapeHtmlLabel(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
