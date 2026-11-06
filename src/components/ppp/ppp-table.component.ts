import type { PppSecret } from '@types';
import { icon } from '@components/ui/icon';
import { t } from '@i18n/translate';
import { escapeAttr } from '@utils/format';
import { pppEmptyRow, pppTableRow } from './ppp-row.template';

export interface PppRowCallbacks {
  onSelect: (id: number) => void;
  onOpenInspector: (id: number) => void;
}

export class PppTableComponent {
  private readonly el: HTMLDivElement;
  private lastTap = { id: 0, time: 0 };

  constructor(private readonly callbacks: PppRowCallbacks) {
    this.el = document.createElement('div');
    this.el.className =
      'hidden md:block overflow-x-auto rounded-xl ring-1 ring-outline-variant/20 bg-surface-container/40';
    this.el.innerHTML = `
      <table class="w-full text-xs">
        <thead class="bg-surface-container-low/80 text-[10px] uppercase tracking-wider text-on-surface-variant">
          <tr>
            <th class="text-left px-2.5 py-2 w-9" aria-label="${escapeAttr(t('ppp.colStatus'))}">${icon('flag', 'text-[12px]')}</th>
            <th class="text-left px-2.5 py-2">${escapeAttr(t('ppp.colNameCallerId'))}</th>
            <th class="text-left px-2.5 py-2">${escapeAttr(t('ppp.colService'))}</th>
            <th class="text-left px-2.5 py-2">${escapeAttr(t('ppp.colProfile'))}</th>
            <th class="text-left px-2.5 py-2">${escapeAttr(t('ppp.colRemote'))}</th>
            <th class="text-left px-2.5 py-2">${escapeAttr(t('ppp.colUptime'))}</th>
            <th class="text-left px-2.5 py-2 hidden lg:table-cell">${escapeAttr(t('ppp.colComment'))}</th>
          </tr>
        </thead>
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

  setData(rows: PppSecret[], selectedId: number | null): void {
    const tbody = this.el.querySelector<HTMLElement>('[data-rows]');
    if (!tbody) return;

    tbody.innerHTML = rows.length
      ? rows.map((secret) => pppTableRow(secret, selectedId)).join('')
      : pppEmptyRow();
  }

  private rowId(event: Event): number | null {
    const row = (event.target as HTMLElement).closest<HTMLTableRowElement>('tr[data-id]');
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
