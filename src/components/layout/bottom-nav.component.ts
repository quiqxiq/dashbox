import { BOTTOM_NAV } from '@config/navigation.config';
import type { ViewRouter } from '@router/view-router';
import type { ViewName } from '@types';
import { escapeHtml } from '@utils/format';
import { icon } from '@components/ui/icon';

export class BottomNavComponent {
  constructor(private readonly router: ViewRouter) {}

  mount(parent: HTMLElement): this {
    const el = document.createElement('nav');
    el.className =
      'fixed bottom-0 inset-x-0 z-40 pb-safe bg-surface/80 backdrop-blur-xl shadow-[0_-2px_16px_rgba(0,0,0,0.35)]';
    el.setAttribute('aria-label', 'Navigasi utama');
    el.innerHTML = `
      <div class="flex justify-around items-center h-16 px-1 gap-0.5">
        ${BOTTOM_NAV.map(
          (item) => `
            <a href="#" data-nav="${item.view}"
              class="flex flex-col items-center justify-center gap-1 flex-1 min-w-0 h-12 text-on-surface-variant transition-colors">
              ${icon(item.icon, 'text-[22px]')}
              <span class="text-[10px] leading-none tracking-tight truncate max-w-full">${escapeHtml(item.label)}</span>
            </a>`,
        ).join('')}
      </div>`;
    parent.appendChild(el);

    el.addEventListener('click', (event) => {
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[data-nav]');
      if (!link) return;

      event.preventDefault();
      const view = link.dataset.nav as ViewName | undefined;
      if (view) this.router.navigate(view);
    });

    this.router.subscribe((view) => {
      el.querySelectorAll<HTMLAnchorElement>('a[data-nav]').forEach((link) => {
        const active = link.dataset.nav === view;
        link.classList.toggle('text-primary', active);
        link.classList.toggle('font-semibold', active);
        link.classList.toggle('text-on-surface-variant', !active);

        if (active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    });

    return this;
  }
}
