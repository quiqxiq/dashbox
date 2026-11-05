import { hotspotCardsMarkup } from './hotspot-row.template';
import type { HotspotRowCallbacks } from './hotspot-table.component';
import type { HotspotListData } from '@types';

export class HotspotCardsComponent {
  private readonly el: HTMLDivElement;
  private lastTap = { id: '', time: 0 };

  constructor(private readonly callbacks: HotspotRowCallbacks) {
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

  setData(data: HotspotListData, selectedIds: ReadonlySet<string>, loading: boolean): void {
    this.el.innerHTML = hotspotCardsMarkup(data, selectedIds, loading);
  }

  setSelected(selectedIds: ReadonlySet<string>): void {
    this.el.querySelectorAll<HTMLElement>('[data-id]').forEach((card) => {
      const selected = card.dataset.id ? selectedIds.has(card.dataset.id) : false;
      card.classList.toggle('is-selected', selected);
      card.setAttribute('aria-pressed', String(selected));
    });
  }

  private cardId(event: Event): string | null {
    const card = (event.target as HTMLElement).closest<HTMLElement>('[data-id]');
    return card?.dataset.id ?? null;
  }

  private handleClick(event: MouseEvent): void {
    if (window.getSelection && String(window.getSelection()).length > 0) return;

    const id = this.cardId(event);
    if (!id) return;

    event.stopPropagation();
    const now = Date.now();

    if (this.lastTap.id === id && now - this.lastTap.time < 320) {
      this.lastTap = { id: '', time: 0 };
      this.callbacks.onOpen(id);
    } else {
      this.lastTap = { id, time: now };
      this.callbacks.onSelect(id, event.ctrlKey || event.metaKey);
    }
  }

  private handleDoubleClick(event: MouseEvent): void {
    const id = this.cardId(event);
    if (!id) return;

    event.stopPropagation();
    this.callbacks.onOpen(id);
  }

  private handleKeydown(event: KeyboardEvent): void {
    const id = this.cardId(event);
    if (!id) return;

    if (event.key === 'Enter') {
      event.preventDefault();
      this.callbacks.onOpen(id);
    } else if (event.key === ' ') {
      event.preventDefault();
      this.callbacks.onSelect(id, event.ctrlKey || event.metaKey);
    }
  }
}
