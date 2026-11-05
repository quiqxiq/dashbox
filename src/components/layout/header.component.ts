import type { RouterRepository } from '@repositories/router.repository';
import type { ViewRouter } from '@router/view-router';
import { openDrawer } from '@store/ui.store';
import { logger } from '@utils/logger';
import { icon } from '@components/ui/icon';

export class HeaderComponent {
  constructor(
    private readonly router: ViewRouter,
    private readonly routerRepo: RouterRepository,
  ) {}

  mount(parent: HTMLElement): this {
    const el = document.createElement('header');
    el.className =
      'fixed top-0 inset-x-0 z-40 bg-surface/75 backdrop-blur-xl shadow-[0_1px_12px_rgba(0,0,0,0.35)] pt-safe';
    el.innerHTML = `
      <div class="h-16 px-3 flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <button type="button" data-action="open-drawer" aria-label="Buka menu"
            class="w-11 h-11 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-primary active:bg-surface-container/60 transition-colors">
            ${icon('menu', 'text-[24px]')}
          </button>
          <div class="flex flex-col min-w-0">
            <h1 data-title class="text-[13px] font-headline font-bold tracking-tight text-on-surface truncate leading-tight">Dasbor</h1>
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
          <div role="img" aria-label="Profil administrator"
            class="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-[0_0_12px_rgba(125,211,252,0.3)]">
            ${icon('person', 'text-on-primary text-[17px]')}
          </div>
        </div>
      </div>`;
    parent.appendChild(el);

    el.querySelector<HTMLButtonElement>('[data-action="open-drawer"]')?.addEventListener(
      'click',
      () => openDrawer(),
    );

    this.router.subscribe((_view, title) => {
      const titleEl = el.querySelector<HTMLElement>('[data-title]');
      if (titleEl) titleEl.textContent = title;
    });

    void this.loadRouterSummary(el);

    return this;
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
