import type { PppSecret } from '@types';
import { pppCard, pppEmptyCard } from './ppp-row.template';
import type { PppRowCallbacks } from './ppp-table.component';

export class PppCardsComponent {
  private readonly el: HTMLDivElement;
  private lastTap = { id: 0, time: 0 };

  constructor(private readonly callbacks: PppRowCallbacks) {
    this.el = document.createElement('div');
    this.el.className = 'md:hidden flex flex-col gap-1.5';
    this.el.addEventListener('click', (event) => this.handleClick(event));
    this.el.addEventListener('dblclick', (event) => this.handleDoubleClick(event));
    this.el.addEventListener('keydown', (event) => this.handleKeydown(event));
  }

  mount(parent: HTMLElement): this {
    parent.appendChild(this.el);
    return this;
  }

  setData(rows: PppSecret[], selectedId: number | null): void {
    this.el.innerHTML = rows.length
      ? rows.map((secret) => pppCard(secret, selectedId)).join('')
      : pppEmptyCard();
  }

  private rowId(event: Event): number | null {
    const row = (event.target as HTMLElement).closest<HTMLElement>('[data-id]');
    if (!row?.dataset.id) return null;
    const id = Number(row.dataset.id);
    return Number.isFinite(id) ? id : null;
  }

  private handleClick(event: MouseEvent): void {
    if (window.getSelection && String(window.getSelection()).length > 0) return;

    const id = this.rowId(event);
    if (id === null) return;

    event.stopPropagation();
    const now = Date.now();

    if (this.lastTap.id === id && now - this.lastTap.time < 320) {
      this.lastTap = { id: 0, time: 0 };
      this.callbacks.onOpenInspector(id);
    } else {
      this.lastTap = { id, time: now };
      this.callbacks.onSelect(id);
    }
  }

  private handleDoubleClick(event: MouseEvent): void {
    const id = this.rowId(event);
    if (id === null) return;

    event.stopPropagation();
    this.callbacks.onOpenInspector(id);
  }

  private handleKeydown(event: KeyboardEvent): void {
    const id = this.rowId(event);
    if (id === null) return;

    if (event.key === 'Enter') {
      event.preventDefault();
      this.callbacks.onOpenInspector(id);
    } else if (event.key === ' ') {
      event.preventDefault();
      this.callbacks.onSelect(id);
    }
  }
}
