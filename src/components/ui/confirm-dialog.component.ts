import { escapeHtml } from '@utils/format';
import { t } from '@i18n/translate';
import { icon } from './icon';

export type ConfirmDialogTone = 'danger' | 'primary';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmDialogTone;
}

const TONE = {
  danger: {
    icon: 'warning',
    iconBox: 'bg-error-container/70 text-error ring-error/25',
    confirm: 'bg-error text-on-error hover:bg-error/90',
  },
  primary: {
    icon: 'info',
    iconBox: 'bg-primary/15 text-primary ring-primary/25',
    confirm: 'bg-primary text-on-primary hover:bg-primary/90',
  },
} as const;

export class ConfirmDialogComponent {
  private static root: HTMLElement | null = null;
  private static dialog: HTMLElement | null = null;
  private static resolver: ((value: boolean) => void) | null = null;
  private static lastFocus: HTMLElement | null = null;
  private static closeTimer: number | null = null;

  static mount(parent: HTMLElement = document.body): void {
    if (this.root) return;

    const root = document.createElement('div');
    root.className =
      'fixed inset-0 z-[80] hidden items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-md';
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML = `
      <div data-confirm-dialog role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-message"
        class="w-full sm:max-w-sm bg-surface-container-high/95 backdrop-blur-2xl rounded-t-3xl sm:rounded-2xl ring-1 ring-outline-variant/30 shadow-2xl flex flex-col overflow-hidden scale-95 opacity-0 transition-all duration-200"></div>`;
    parent.appendChild(root);

    this.root = root;
    this.dialog = root.querySelector<HTMLElement>('[data-confirm-dialog]');

    root.addEventListener('click', (event) => {
      if (event.target === root) this.close(false);
    });
    root.addEventListener('keydown', (event) => this.handleKeydown(event));
  }

  static ask(options: ConfirmDialogOptions): Promise<boolean> {
    this.mount();
    if (!this.root || !this.dialog) return Promise.resolve(false);

    this.settle(false);
    if (this.closeTimer !== null) {
      window.clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }

    this.lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const tone = TONE[options.tone ?? 'danger'];
    const confirmLabel =
      options.confirmLabel ??
      (options.tone === 'primary' ? t('common.continue') : t('common.delete'));
    const cancelLabel = options.cancelLabel ?? t('common.cancel');

    this.dialog.innerHTML = `
      <div class="p-4 flex items-start gap-3">
        <div class="w-10 h-10 rounded-xl ring-1 flex items-center justify-center shrink-0 ${tone.iconBox}">
          ${icon(tone.icon, 'text-[21px]')}
        </div>
        <div class="min-w-0 flex-1">
          <h2 id="confirm-dialog-title" class="text-sm font-bold font-headline text-on-surface tracking-tight">
            ${escapeHtml(options.title)}
          </h2>
          <p id="confirm-dialog-message" class="text-[11px] leading-relaxed text-on-surface-variant mt-1">
            ${escapeHtml(options.message)}
          </p>
        </div>
      </div>
      <div class="px-4 pb-4 flex items-center justify-end gap-2">
        <button type="button" data-confirm-cancel
          class="px-3.5 py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface font-semibold text-xs active:scale-95 transition-all">
          ${escapeHtml(cancelLabel)}
        </button>
        <button type="button" data-confirm-ok
          class="px-4 py-1.5 rounded-lg font-bold text-xs active:scale-95 transition-all ${tone.confirm}">
          ${escapeHtml(confirmLabel)}
        </button>
      </div>`;

    this.root.classList.remove('hidden');
    this.root.classList.add('flex');
    this.root.removeAttribute('inert');
    this.root.setAttribute('aria-hidden', 'false');

    const result = new Promise<boolean>((resolve) => {
      this.resolver = resolve;
    });

    this.dialog
      .querySelector<HTMLButtonElement>('[data-confirm-cancel]')
      ?.addEventListener('click', () => this.close(false));
    this.dialog
      .querySelector<HTMLButtonElement>('[data-confirm-ok]')
      ?.addEventListener('click', () => this.close(true));

    window.requestAnimationFrame(() => {
      this.dialog?.classList.remove('scale-95', 'opacity-0');
      this.dialog?.classList.add('scale-100', 'opacity-100');

      const focusTarget =
        options.tone === 'primary'
          ? this.dialog?.querySelector<HTMLButtonElement>('[data-confirm-ok]')
          : this.dialog?.querySelector<HTMLButtonElement>('[data-confirm-cancel]');
      focusTarget?.focus();
    });

    return result;
  }

  static close(result: boolean): void {
    if (!this.root || !this.dialog) return;

    this.settle(result);
    this.dialog.classList.remove('scale-100', 'opacity-100');
    this.dialog.classList.add('scale-95', 'opacity-0');
    this.root.setAttribute('aria-hidden', 'true');

    this.closeTimer = window.setTimeout(() => {
      this.closeTimer = null;
      if (!this.root) return;
      this.root.classList.add('hidden');
      this.root.classList.remove('flex');
      this.root.setAttribute('inert', '');

      if (this.lastFocus?.isConnected) this.lastFocus.focus();
      this.lastFocus = null;
    }, 160);
  }

  private static settle(result: boolean): void {
    if (!this.resolver) return;
    this.resolver(result);
    this.resolver = null;
  }

  private static handleKeydown(event: KeyboardEvent): void {
    if (!this.root || this.root.classList.contains('hidden')) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close(false);
      return;
    }

    if (event.key !== 'Tab' || !this.dialog) return;

    const focusable = Array.from(
      this.dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );

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
}
