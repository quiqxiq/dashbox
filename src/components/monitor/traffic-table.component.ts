import { icon } from '@components/ui/icon';
import type { InterfaceTrafficEntry } from '@types';
import { escapeHtml, formatBitsPerSec, formatBytes, formatNumber } from '@utils/format';

export interface TrafficTableCallbacks {
  onRefresh: () => void;
  onSearchChange: (value: string) => void;
}

const TYPE_BADGE: Record<string, string> = {
  ethernet: 'bg-primary/10 text-primary border-primary/20',
  sfp: 'bg-tertiary/10 text-tertiary border-tertiary/20',
  bridge: 'bg-secondary/10 text-secondary border-secondary/20',
  wireless: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  vlan: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  ppp: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
};

export class TrafficTableComponent {
  private el: HTMLElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private search = '';

  constructor(private readonly callbacks: TrafficTableCallbacks) {}

  mount(parent: HTMLElement): this {
    const el = document.createElement('div');
    el.className = 'flex flex-col gap-3 w-full';
    el.innerHTML = `
      <!-- Aggregate Summary Card -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div class="p-3 rounded-xl bg-surface-container/70 backdrop-blur-md ring-1 ring-outline-variant/20 flex flex-col justify-between">
          <div class="flex items-center justify-between text-on-surface-variant text-[11px]">
            <span>Total Download (Rx)</span>
            ${icon('arrow_downward', 'text-primary text-[15px]')}
          </div>
          <div class="mt-1 flex items-baseline gap-1.5">
            <span data-summary-rx class="text-base sm:text-lg font-bold font-mono text-primary">0 bps</span>
          </div>
        </div>
        <div class="p-3 rounded-xl bg-surface-container/70 backdrop-blur-md ring-1 ring-outline-variant/20 flex flex-col justify-between">
          <div class="flex items-center justify-between text-on-surface-variant text-[11px]">
            <span>Total Upload (Tx)</span>
            ${icon('arrow_upward', 'text-secondary text-[15px]')}
          </div>
          <div class="mt-1 flex items-baseline gap-1.5">
            <span data-summary-tx class="text-base sm:text-lg font-bold font-mono text-secondary">0 bps</span>
          </div>
        </div>
        <div class="p-3 rounded-xl bg-surface-container/70 backdrop-blur-md ring-1 ring-outline-variant/20 flex flex-col justify-between">
          <div class="flex items-center justify-between text-on-surface-variant text-[11px]">
            <span>Interface Aktif</span>
            ${icon('swap_calls', 'text-emerald-400 text-[15px]')}
          </div>
          <div class="mt-1 flex items-baseline gap-1.5">
            <span data-summary-active class="text-base sm:text-lg font-bold font-mono text-emerald-400">0</span>
            <span class="text-[10px] text-on-surface-variant">ports link up</span>
          </div>
        </div>
        <div class="p-3 rounded-xl bg-surface-container/70 backdrop-blur-md ring-1 ring-outline-variant/20 flex flex-col justify-between">
          <div class="flex items-center justify-between text-on-surface-variant text-[11px]">
            <span>Total Volume</span>
            ${icon('data_usage', 'text-tertiary text-[15px]')}
          </div>
          <div class="mt-1 flex items-baseline gap-1.5">
            <span data-summary-total class="text-base sm:text-lg font-bold font-mono text-tertiary">0 B</span>
          </div>
        </div>
      </div>

      <!-- Toolbar Search & Actions -->
      <div class="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-surface-container/80 backdrop-blur-xl ring-1 ring-outline-variant/20">
        <div class="flex flex-1 items-center gap-2 max-w-sm">
          <div class="relative w-full">
            <span class="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-on-surface-variant/60">
              ${icon('search', 'text-[15px]')}
            </span>
            <input type="search" data-traffic-search placeholder="Cari nama interface, komentar, tipe..."
              class="w-full h-8 pl-8 pr-3 bg-surface-container-high/60 rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant/60 ring-1 ring-outline-variant/20 focus:ring-primary/50 focus:outline-none transition-all" />
          </div>
        </div>
        <button type="button" data-traffic-refresh title="Muat ulang status"
          class="toolbar-btn inline-flex items-center justify-center size-8 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors">
          ${icon('refresh', 'text-[16px]')}
        </button>
      </div>

      <!-- Desktop Table View -->
      <div class="hidden md:block overflow-hidden rounded-xl bg-surface-container/60 ring-1 ring-outline-variant/20">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-surface-container-high/50 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/20">
              <tr>
                <th class="py-2.5 px-3">Status</th>
                <th class="py-2.5 px-3">Interface</th>
                <th class="py-2.5 px-3">Tipe / Speed</th>
                <th class="py-2.5 px-3">Rx Rate (Down)</th>
                <th class="py-2.5 px-3">Tx Rate (Up)</th>
                <th class="py-2.5 px-3">Packet Rate</th>
                <th class="py-2.5 px-3">Total Transfer</th>
              </tr>
            </thead>
            <tbody data-traffic-tbody class="divide-y divide-outline-variant/10 font-mono text-[11px]">
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mobile Cards View -->
      <div data-traffic-cards class="grid grid-cols-1 gap-2 md:hidden">
      </div>`;

    parent.appendChild(el);
    this.el = el;

    this.searchInput = el.querySelector<HTMLInputElement>('[data-traffic-search]');
    this.searchInput?.addEventListener('input', (e) => {
      this.search = (e.target as HTMLInputElement).value;
      this.callbacks.onSearchChange(this.search);
    });

    el.querySelector<HTMLButtonElement>('[data-traffic-refresh]')?.addEventListener('click', () => {
      this.callbacks.onRefresh();
    });

    return this;
  }

  update(entries: InterfaceTrafficEntry[]): void {
    if (!this.el) return;

    // Filter
    const query = this.search.trim().toLowerCase();
    const filtered = query
      ? entries.filter(
          (i) =>
            i.name.toLowerCase().includes(query) ||
            (i.comment && i.comment.toLowerCase().includes(query)) ||
            i.type.toLowerCase().includes(query) ||
            i.macAddress.toLowerCase().includes(query),
        )
      : entries;

    // Aggregate values
    let totalRx = 0;
    let totalTx = 0;
    let totalBytes = 0;
    let activeCount = 0;

    for (const i of entries) {
      if (i.status === 'running') {
        activeCount += 1;
        totalRx += i.rxRateBps;
        totalTx += i.txRateBps;
      }
      totalBytes += i.totalRxBytes + i.totalTxBytes;
    }

    const rxEl = this.el.querySelector('[data-summary-rx]');
    const txEl = this.el.querySelector('[data-summary-tx]');
    const activeEl = this.el.querySelector('[data-summary-active]');
    const totalEl = this.el.querySelector('[data-summary-total]');

    if (rxEl) rxEl.textContent = formatBitsPerSec(totalRx);
    if (txEl) txEl.textContent = formatBitsPerSec(totalTx);
    if (activeEl) activeEl.textContent = String(activeCount);
    if (totalEl) totalEl.textContent = formatBytes(totalBytes);

    // Desktop Tbody
    const tbody = this.el.querySelector<HTMLElement>('[data-traffic-tbody]');
    if (tbody) {
      if (filtered.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="py-8 text-center text-on-surface-variant font-sans text-xs">
              Tidak ada interface yang sesuai dengan pencarian.
            </td>
          </tr>`;
      } else {
        tbody.innerHTML = filtered
          .map((i) => {
            const isRunning = i.status === 'running';
            const statusDot = isRunning
              ? '<span class="size-2 rounded-full bg-emerald-400 animate-pulse inline-block mr-1.5"></span>'
              : i.status === 'link-down'
                ? '<span class="size-2 rounded-full bg-amber-400 inline-block mr-1.5"></span>'
                : '<span class="size-2 rounded-full bg-outline inline-block mr-1.5"></span>';
            const statusLabel =
              i.status === 'running'
                ? 'Running'
                : i.status === 'link-down'
                  ? 'Link Down'
                  : 'Disabled';

            const typeStyle = TYPE_BADGE[i.type] ?? 'bg-surface-container text-on-surface-variant';

            return `
              <tr class="hover:bg-surface-container-high/40 transition-colors group">
                <td class="py-2.5 px-3 whitespace-nowrap">
                  <span class="inline-flex items-center text-[10px] ${isRunning ? 'text-emerald-400' : 'text-on-surface-variant'}">
                    ${statusDot}
                    <span>${statusLabel}</span>
                  </span>
                </td>
                <td class="py-2.5 px-3">
                  <div class="flex flex-col">
                    <span class="font-sans font-semibold text-xs text-on-surface">${escapeHtml(i.name)}</span>
                    <span class="text-[10px] text-on-surface-variant/70 font-sans">${escapeHtml(i.comment ?? i.macAddress)}</span>
                  </div>
                </td>
                <td class="py-2.5 px-3 whitespace-nowrap">
                  <span class="px-2 py-0.5 rounded text-[9px] font-sans font-medium uppercase border ${typeStyle}">
                    ${i.type} · ${i.linkSpeed}
                  </span>
                </td>
                <td class="py-2.5 px-3 whitespace-nowrap">
                  <span class="text-primary font-bold">${formatBitsPerSec(i.rxRateBps)}</span>
                </td>
                <td class="py-2.5 px-3 whitespace-nowrap">
                  <span class="text-secondary font-bold">${formatBitsPerSec(i.txRateBps)}</span>
                </td>
                <td class="py-2.5 px-3 whitespace-nowrap text-on-surface-variant text-[10px]">
                  ${formatNumber(i.rxPacketsPerSec)} / ${formatNumber(i.txPacketsPerSec)} pps
                </td>
                <td class="py-2.5 px-3 whitespace-nowrap text-on-surface text-[10px]">
                  <span class="text-primary">${formatBytes(i.totalRxBytes)}</span>
                  <span class="text-outline-variant mx-1">/</span>
                  <span class="text-secondary">${formatBytes(i.totalTxBytes)}</span>
                </td>
              </tr>`;
          })
          .join('');
      }
    }

    // Mobile Cards
    const cards = this.el.querySelector<HTMLElement>('[data-traffic-cards]');
    if (cards) {
      if (filtered.length === 0) {
        cards.innerHTML = `
          <div class="p-6 text-center rounded-xl bg-surface-container/60 text-xs text-on-surface-variant">
            Tidak ada interface yang sesuai.
          </div>`;
      } else {
        cards.innerHTML = filtered
          .map((i) => {
            const isRunning = i.status === 'running';
            const statusDot = isRunning
              ? '<span class="size-2 rounded-full bg-emerald-400 animate-pulse"></span>'
              : i.status === 'link-down'
                ? '<span class="size-2 rounded-full bg-amber-400"></span>'
                : '<span class="size-2 rounded-full bg-outline"></span>';

            const typeStyle = TYPE_BADGE[i.type] ?? 'bg-surface-container text-on-surface-variant';

            return `
              <div class="p-3 rounded-xl bg-surface-container/70 backdrop-blur-md ring-1 ring-outline-variant/20 flex flex-col gap-2">
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2 min-w-0">
                    ${statusDot}
                    <span class="font-semibold text-xs text-on-surface truncate">${escapeHtml(i.name)}</span>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[9px] uppercase border ${typeStyle}">
                    ${i.type}
                  </span>
                </div>
                ${i.comment ? `<p class="text-[10px] text-on-surface-variant truncate">${escapeHtml(i.comment)}</p>` : ''}
                <div class="grid grid-cols-2 gap-2 pt-1 border-t border-outline-variant/15 font-mono text-[11px]">
                  <div class="flex items-center justify-between bg-surface-container-high/40 px-2 py-1.5 rounded-lg">
                    <span class="text-[10px] text-primary flex items-center gap-1">
                      ${icon('arrow_downward', 'text-[12px]')} Rx
                    </span>
                    <span class="font-bold text-primary">${formatBitsPerSec(i.rxRateBps)}</span>
                  </div>
                  <div class="flex items-center justify-between bg-surface-container-high/40 px-2 py-1.5 rounded-lg">
                    <span class="text-[10px] text-secondary flex items-center gap-1">
                      ${icon('arrow_upward', 'text-[12px]')} Tx
                    </span>
                    <span class="font-bold text-secondary">${formatBitsPerSec(i.txRateBps)}</span>
                  </div>
                </div>
                <div class="flex items-center justify-between text-[10px] text-on-surface-variant/80 pt-0.5">
                  <span>Total: ${formatBytes(i.totalRxBytes + i.totalTxBytes)}</span>
                  <span>${formatNumber(i.rxPacketsPerSec + i.txPacketsPerSec)} pps</span>
                </div>
              </div>`;
          })
          .join('');
      }
    }
  }

  destroy(): void {
    this.el?.remove();
    this.el = null;
    this.searchInput = null;
  }
}
