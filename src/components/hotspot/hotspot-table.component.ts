import { hotspotTableBody, hotspotTableHead } from './hotspot-row.template';
import type { HotspotListData } from '@types';

export interface HotspotRowCallbacks {
  onSelect: (id: string, multi: boolean) => void;
  onOpen: (id: string) => void;
}

export class HotspotTableComponent {
  private readonly el: HTMLDivElement;
  private lastTap = { id: '', time: 0 };

  constructor(private readonly callbacks: HotspotRowCallbacks) {
    this.el = document.createElement('div');
    this.el.className =
      'hidden md:block overflow-x-auto rounded-xl ring-1 ring-outline-variant/20 bg-surface-container/40';
    this.el.innerHTML = `
      <table class="w-full text-xs">
        <thead class="bg-surface-container-low/80 text-[10px] uppercase tracking-wider text-on-surface-variant" data-head></thead>
        <tbody data-rows></tbody>
      </table>`;

    this.el.addEventListener('click', (event) => this.handleClick(event));
    this.el.addEventListener('dblclick', (event) => this.handleDoubleClick(event));
    this.el.addEventListener('keydown', (event) => this.handleKeydown(event));
  }

  mount(parent: HTMLElement): this {
    parent.appendChild(this.el);
    return this;
  }

  setData(data: HotspotListData, selectedIds: ReadonlySet<string>, loading: boolean): void {
    const head = this.el.querySelector<HTMLElement>('[data-head]');
    const body = this.el.querySelector<HTMLElement>('[data-rows]');
    if (head) head.innerHTML = hotspotTableHead(data.tab);
    if (body) body.innerHTML = hotspotTableBody(data, selectedIds, loading);
  }

  setSelected(selectedIds: ReadonlySet<string>): void {
    this.el.querySelectorAll<HTMLElement>('tr[data-id]').forEach((row) => {
      const selected = row.dataset.id ? selectedIds.has(row.dataset.id) : false;
      row.classList.toggle('is-selected', selected);
      row.setAttribute('aria-selected', String(selected));
    });
  }

  private rowId(event: Event): string | null {
    const row = (event.target as HTMLElement).closest<HTMLElement>('tr[data-id]');
    return row?.dataset.id ?? null;
  }

  private handleClick(event: MouseEvent): void {
    if (window.getSelection && String(window.getSelection()).length > 0) return;

    const id = this.rowId(event);
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
    const id = this.rowId(event);
    if (!id) return;

    event.stopPropagation();
    this.callbacks.onOpen(id);
  }

  private handleKeydown(event: KeyboardEvent): void {
    const id = this.rowId(event);
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
