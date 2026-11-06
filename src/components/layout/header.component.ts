import type { RouterRepository } from '@repositories/router.repository';
import type { ViewRouter } from '@router/view-router';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog.component';
import { logout } from '@store/auth.store';
import { setLocale, getLocale } from '@store/locale.store';
import { themeStore, toggleTheme, isEffectiveDark } from '@store/theme.store';
import { subscribeLocale, t } from '@i18n/translate';
import { openDrawer, toast } from '@store/ui.store';
import { logger } from '@utils/logger';
import { icon } from '@components/ui/icon';

export class HeaderComponent {
  private el: HTMLElement | null = null;
  private unsubscribeLocale: (() => void) | null = null;
  private unsubscribeRouter: (() => void) | null = null;
  private unsubscribeTheme: (() => void) | null = null;

  constructor(
    private readonly router: ViewRouter,
    private readonly routerRepo: RouterRepository,
  ) {}

  mount(parent: HTMLElement): this {
    const el = document.createElement('header');
    el.className =
      'fixed top-0 inset-x-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/20 shadow-[0_1px_12px_rgba(0,0,0,0.35)] pt-safe';
    el.innerHTML = `
      <div class="h-16 px-3 flex items-center justify-between gap-2">
        <div class="flex items-center gap-2.5 min-w-0">
          <button type="button" data-action="open-drawer" aria-label="${escapeLabel(t('common.openMenu'))}"
            class="w-10 h-10 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-primary active:bg-surface-container/60 transition-colors shrink-0">
            ${icon('menu', 'text-[22px]')}
          </button>
          <img src="/dashbox-mark-light.svg" alt="Dashbox" width="24" height="24" class="shrink-0 object-contain drop-shadow-[0_1px_4px_rgba(63,169,240,0.3)] hidden sm:block dark:hidden" />
          <img src="/dashbox-mark-dark.svg" alt="Dashbox" width="24" height="24" class="shrink-0 object-contain drop-shadow-[0_1px_4px_rgba(63,169,240,0.3)] hidden sm:dark:block" />
          <div class="flex flex-col min-w-0">
            <h1 data-title class="text-[13px] font-headline font-bold tracking-tight text-on-surface truncate leading-tight">${escapeLabel(t('nav.dashboard'))}</h1>
            <div class="flex items-center gap-1.5 mt-0.5 min-w-0">
              <span class="relative flex h-1.5 w-1.5 shrink-0">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
              </span>
              <span data-identity class="text-[10px] font-mono text-on-surface-variant truncate">CCR1009 · 192.168.1.1</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <div class="flex items-center gap-1 px-2 py-1 rounded-full bg-surface-container-high/80 ring-1 ring-outline-variant/30 backdrop-blur-md">
            ${icon('network_ping', 'text-[13px] text-primary')}
            <span data-latency class="text-[11px] font-mono font-bold text-primary tracking-wide">14 ms</span>
          </div>
          <button type="button" data-theme-toggle aria-label="${escapeLabel(t('settings.themeSection'))}" title="${escapeLabel(t('settings.themeSection'))}"
            class="h-8 w-8 rounded-full bg-surface-container-high/80 ring-1 ring-outline-variant/30 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center">
            <span data-theme-icon>${icon(isEffectiveDark() ? 'light_mode' : 'dark_mode', 'text-[15px]')}</span>
          </button>
          <button type="button" data-locale-toggle aria-label="${escapeLabel(t('common.language'))}" title="${escapeLabel(t('common.language'))}"
            class="h-8 px-2 rounded-full bg-surface-container-high/80 ring-1 ring-outline-variant/30 text-[11px] font-bold text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1">
            ${icon('language', 'text-[14px]')}
            <span data-locale-label>${getLocale().toUpperCase()}</span>
          </button>
          <button type="button" data-action="logout" aria-label="${escapeLabel(t('auth.logout'))}" title="${escapeLabel(t('auth.logout'))}"
            class="w-8 h-8 rounded-full bg-primary/20 ring-1 ring-primary/40 hover:bg-error/20 hover:ring-error/40 text-primary hover:text-error transition-all flex items-center justify-center shadow-[0_0_12px_rgba(125,211,252,0.2)] group cursor-pointer">
            <span class="group-hover:hidden">${icon('person', 'text-[17px]')}</span>
            <span class="hidden group-hover:inline">${icon('logout', 'text-[17px]')}</span>
          </button>
        </div>
      </div>`;
    parent.appendChild(el);
    this.el = el;

    el.querySelector<HTMLButtonElement>('[data-action="open-drawer"]')?.addEventListener(
      'click',
      () => openDrawer(),
    );
    el.querySelector<HTMLButtonElement>('[data-theme-toggle]')?.addEventListener('click', () => {
      toggleTheme();
    });
    el.querySelector<HTMLButtonElement>('[data-locale-toggle]')?.addEventListener('click', () => {
      setLocale(getLocale() === 'id' ? 'en' : 'id');
    });

    el.querySelector<HTMLButtonElement>('[data-action="logout"]')?.addEventListener(
      'click',
      async () => {
        const ok = await ConfirmDialogComponent.ask({
          title: t('auth.logoutConfirmTitle'),
          message: t('auth.logoutConfirmMessage'),
          confirmLabel: t('auth.logout'),
          tone: 'danger',
        });
        if (ok) {
          logout();
          toast(t('auth.logout'), 'info');
        }
      },
    );

    this.unsubscribeTheme = themeStore.subscribe((state) => {
      const themeIconEl = el.querySelector<HTMLElement>('[data-theme-icon]');
      if (themeIconEl) {
        themeIconEl.innerHTML = icon(
          state.effectiveDark ? 'light_mode' : 'dark_mode',
          'text-[15px]',
        );
      }
    });

    this.unsubscribeLocale = subscribeLocale(() => {
      const label = el.querySelector<HTMLElement>('[data-locale-label]');
      if (label) label.textContent = getLocale().toUpperCase();
      const btn = el.querySelector<HTMLButtonElement>('[data-locale-toggle]');
      if (btn) {
        btn.setAttribute('aria-label', t('common.language'));
        btn.setAttribute('title', t('common.language'));
      }
      const themeBtn = el.querySelector<HTMLButtonElement>('[data-theme-toggle]');
      if (themeBtn) {
        themeBtn.setAttribute('aria-label', t('settings.themeSection'));
        themeBtn.setAttribute('title', t('settings.themeSection'));
      }
      const logoutBtn = el.querySelector<HTMLButtonElement>('[data-action="logout"]');
      if (logoutBtn) {
        logoutBtn.setAttribute('aria-label', t('auth.logout'));
        logoutBtn.setAttribute('title', t('auth.logout'));
      }
      // Refresh title to current view's translated title
      const titleEl = el.querySelector<HTMLElement>('[data-title]');
      if (titleEl) titleEl.textContent = this.router.currentTitle;
    });

    this.unsubscribeRouter = this.router.subscribe((_view, title) => {
      const titleEl = el.querySelector<HTMLElement>('[data-title]');
      if (titleEl) titleEl.textContent = title;
    });

    void this.loadRouterSummary(el);

    return this;
  }

  destroy(): void {
    if (this.unsubscribeTheme) {
      this.unsubscribeTheme();
      this.unsubscribeTheme = null;
    }
    if (this.unsubscribeLocale) {
      this.unsubscribeLocale();
      this.unsubscribeLocale = null;
    }
    if (this.unsubscribeRouter) {
      this.unsubscribeRouter();
      this.unsubscribeRouter = null;
    }
    this.el?.remove();
    this.el = null;
  }

  private async loadRouterSummary(el: HTMLElement): Promise<void> {
    try {
      const [identity, health] = await Promise.all([
        this.routerRepo.getIdentity(),
        this.routerRepo.getHealth(),
      ]);

      const identityEl = el.querySelector<HTMLElement>('[data-identity]');
      if (identityEl) identityEl.textContent = `${identity.name} · ${identity.ipAddress}`;

      const latencyEl = el.querySelector<HTMLElement>('[data-latency]');
      if (latencyEl) {
        latencyEl.textContent = health.latencyMs > 0 ? `${health.latencyMs} ms` : 'LAN';
      }
    } catch (error) {
      logger.warn('[header] gagal memuat ringkasan router', error);
    }
  }
}

function escapeLabel(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
}
