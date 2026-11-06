import { icon } from '@components/ui/icon';
import { t } from '@i18n/translate';
import { escapeHtml } from '@utils/format';

export class PppPaginationComponent {
  private el: HTMLElement | null = null;
  private current = 1;
  private totalPages = 1;

  constructor(private readonly onPageChange: (page: number) => void) {}

  mount(parent: HTMLElement): this {
    const el = document.createElement('div');
    el.className = 'flex items-center justify-between gap-2 pt-1';
    el.innerHTML = `
      <span data-info class="text-[10px] font-mono text-on-surface-variant">—</span>
      <div class="flex items-center gap-1">
        <button type="button" data-prev aria-label="${escapeHtml(t('ppp.paginationPrev'))}"
          class="w-8 h-8 rounded-lg bg-surface-container/70 ring-1 ring-outline-variant/20 text-on-surface-variant flex items-center justify-center active:scale-90 transition-all disabled:opacity-30 disabled:pointer-events-none">
          ${icon('chevron_left', 'text-[18px]')}
        </button>
        <div data-numbers class="flex items-center gap-1"></div>
        <button type="button" data-next aria-label="${escapeHtml(t('ppp.paginationNext'))}"
          class="w-8 h-8 rounded-lg bg-surface-container/70 ring-1 ring-outline-variant/20 text-on-surface-variant flex items-center justify-center active:scale-90 transition-all disabled:opacity-30 disabled:pointer-events-none">
          ${icon('chevron_right', 'text-[18px]')}
        </button>
      </div>`;
    parent.appendChild(el);
    this.el = el;

    el.querySelector<HTMLButtonElement>('[data-prev]')?.addEventListener('click', () => {
      if (this.current > 1) this.onPageChange(this.current - 1);
    });

    el.querySelector<HTMLButtonElement>('[data-next]')?.addEventListener('click', () => {
      if (this.current < this.totalPages) this.onPageChange(this.current + 1);
    });

    el.querySelector<HTMLElement>('[data-numbers]')?.addEventListener('click', (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-page]');
      if (!button?.dataset.page) return;

      const page = Number(button.dataset.page);
      if (Number.isFinite(page) && page !== this.current) this.onPageChange(page);
    });

    return this;
  }

  update(page: number, pageSize: number, total: number): void {
    if (!this.el) return;

    this.totalPages = Math.max(1, Math.ceil(total / pageSize));
    this.current = Math.min(Math.max(1, page), this.totalPages);

    const info = this.el.querySelector<HTMLElement>('[data-info]');
    if (info) {
      const ofLabel = t('common.of');
      info.textContent =
        total === 0
          ? `0 ${ofLabel} 0`
          : `${(this.current - 1) * pageSize + 1}–${Math.min(
              this.current * pageSize,
              total,
            )} ${ofLabel} ${total}`;
    }

    const prev = this.el.querySelector<HTMLButtonElement>('[data-prev]');
    const next = this.el.querySelector<HTMLButtonElement>('[data-next]');
    if (prev) prev.disabled = this.current <= 1;
    if (next) next.disabled = this.current >= this.totalPages;

    const numbers = this.el.querySelector<HTMLElement>('[data-numbers]');
    if (!numbers) return;

    const maxButtons = 5;
    let from = Math.max(1, this.current - 2);
    const to = Math.min(this.totalPages, from + maxButtons - 1);
    from = Math.max(1, to - maxButtons + 1);

    const buttons: string[] = [];
    for (let pageNumber = from; pageNumber <= to; pageNumber += 1) {
      const active = pageNumber === this.current;
      const classes = active
        ? 'bg-primary text-on-primary font-bold shadow-[0_0_12px_rgba(125,211,252,0.3)]'
        : 'bg-surface-container/60 ring-1 ring-outline-variant/20 text-on-surface-variant hover:text-on-surface';

      buttons.push(`
        <button type="button" data-page="${pageNumber}" ${active ? 'aria-current="page"' : ''}
          class="w-8 h-8 rounded-lg text-xs font-mono flex items-center justify-center transition-all active:scale-90 ${classes}">
          ${pageNumber}
        </button>`);
    }

    numbers.innerHTML = buttons.join('');
  }
}
