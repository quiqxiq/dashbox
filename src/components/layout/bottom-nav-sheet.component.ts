import { icon } from '@components/ui/icon';
import type { IconName } from '@types';
import { escapeHtml } from '@utils/format';

export interface SheetItem {
  id: string;
  label: string;
  icon: IconName;
  badge?: string;
  active?: boolean;
}

export interface SheetOptions {
  title: string;
  icon: IconName;
  items: SheetItem[];
  accent?: string;
}

const ACCENT_MAP: Record<string, string> = {
  primary: 'bg-primary/10 text-primary ring-primary/25',
  tertiary: 'bg-tertiary/10 text-tertiary ring-tertiary/25',
  secondary: 'bg-secondary/10 text-secondary ring-secondary/25',
};

export class BottomNavSheet {
  private root: HTMLElement | null = null;
  private sheetEl: HTMLElement | null = null;
  private onSelect: (id: string) => void = () => {};

  mount(parent: HTMLElement): this {
    if (this.root) return this;
    const root = document.createElement('div');
    root.className =
      'fixed inset-0 z-[70] hidden items-end justify-center bg-background/60 backdrop-blur-sm';
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML = `
      <div data-sheet
        class="w-full max-w-[560px] mx-0 bg-surface-container-low/95 backdrop-blur-2xl rounded-t-3xl ring-1 ring-outline-variant/30 shadow-[0_-8px_40px_rgba(0,0,0,0.5)] translate-y-full transition-transform duration-300 ease-out pb-safe">
        <div class="flex justify-center pt-2.5">
          <span class="w-9 h-1 rounded-full bg-outline-variant/40"></span>
        </div>
        <div class="flex items-center justify-between px-4 pt-2 pb-3">
          <div class="flex items-center gap-2.5 min-w-0">
            <span data-sheet-icon class="size-8 rounded-lg ring-1 flex items-center justify-center shrink-0"></span>
            <h3 data-sheet-title class="text-sm font-bold font-headline text-on-surface truncate"></h3>
          </div>
          <button type="button" data-sheet-close aria-label="Close"
            class="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60 transition-colors shrink-0">
            ${icon('close', 'text-[18px]')}
          </button>
        </div>
        <div data-sheet-items class="grid grid-cols-2 gap-2 px-3 pb-4"></div>
      </div>`;

    parent.appendChild(root);
    this.root = root;
    this.sheetEl = root.querySelector<HTMLElement>('[data-sheet]');

    root.addEventListener('click', (event) => {
      if (event.target === root) this.close();
    });
    root.querySelector<HTMLButtonElement>('[data-sheet-close]')?.addEventListener('click', () => {
      this.close();
    });
    root.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.close();
    });

    root.querySelector<HTMLElement>('[data-sheet-items]')?.addEventListener('click', (event) => {
      const btn = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-item-id]');
      const id = btn?.dataset.itemId;
      if (!id) return;
      this.close();
      this.onSelect(id);
    });

    return this;
  }

  open(options: SheetOptions, onSelect: (id: string) => void): void {
    if (!this.root || !this.sheetEl) return;
    this.onSelect = onSelect;

    const titleEl = this.root.querySelector<HTMLElement>('[data-sheet-title]');
    const iconWrap = this.root.querySelector<HTMLElement>('[data-sheet-icon]');
    const itemsEl = this.root.querySelector<HTMLElement>('[data-sheet-items]');

    if (titleEl) titleEl.textContent = options.title;
    if (iconWrap) {
      iconWrap.innerHTML = icon(options.icon, 'text-[18px]');
      iconWrap.className = `size-8 rounded-lg ring-1 flex items-center justify-center shrink-0 ${ACCENT_MAP[options.accent ?? 'primary'] ?? ACCENT_MAP.primary}`;
    }

    if (itemsEl) {
      itemsEl.innerHTML = options.items
        .map(
          (item) => `
          <button type="button" data-item-id="${escapeHtml(item.id)}"
            class="relative flex items-center gap-2.5 p-3 rounded-xl ring-1 transition-all text-left ${
              item.active
                ? 'bg-primary/15 text-primary ring-primary/30 shadow-[0_0_12px_rgba(125,211,252,0.18)]'
                : 'bg-surface-container/60 text-on-surface-variant ring-outline-variant/20 hover:bg-surface-container-high/60 hover:text-on-surface'
            }">
            <span class="shrink-0">${icon(item.icon, 'text-[18px]')}</span>
            <span class="text-xs font-semibold truncate flex-1">${escapeHtml(item.label)}</span>
            ${
              item.badge
                ? `<span class="shrink-0 px-1.5 py-0.5 rounded-full bg-surface-container-highest text-[10px] font-mono text-on-surface-variant">${escapeHtml(item.badge)}</span>`
                : ''
            }
          </button>`,
        )
        .join('');
    }

    this.root.classList.remove('hidden');
    this.root.classList.add('flex');
    this.root.setAttribute('aria-hidden', 'false');
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-label', options.title);
    window.requestAnimationFrame(() => {
      this.sheetEl?.classList.remove('translate-y-full');
    });
  }

  close(): void {
    if (!this.root || !this.sheetEl) return;
    this.sheetEl.classList.add('translate-y-full');
    window.setTimeout(() => {
      this.root?.classList.add('hidden');
      this.root?.classList.remove('flex');
      this.root?.setAttribute('aria-hidden', 'true');
    }, 280);
  }

  isOpen(): boolean {
    return !!this.root && !this.root.classList.contains('hidden');
  }

  destroy(): void {
    this.onSelect = () => {};
    this.root?.remove();
    this.root = null;
    this.sheetEl = null;
  }
}
