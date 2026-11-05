import { ConfirmDialogComponent } from '@components/ui/confirm-dialog.component';
import { icon } from '@components/ui/icon';
import { toast } from '@store/ui.store';
import type {
  FirewallAction,
  FirewallConnectionEntry,
  FirewallRuleEntry,
  FirewallTab,
} from '@types';
import { escapeHtml, formatBytes, formatNumber } from '@utils/format';

export interface FirewallTableCallbacks {
  onTabChange: (tab: FirewallTab) => void;
  onToggleRule: (id: string) => void;
  onDeleteRule: (id: string) => void;
  onRefresh: () => void;
}

const ACTION_STYLES: Record<FirewallAction, { label: string; class: string }> = {
  accept: { label: 'accept', class: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  drop: { label: 'drop', class: 'bg-error/15 text-error border-error/30' },
  reject: { label: 'reject', class: 'bg-error/15 text-error border-error/30' },
  'fasttrack-connection': {
    label: 'fasttrack',
    class: 'bg-primary/15 text-primary border-primary/30',
  },
  masquerade: { label: 'masquerade', class: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
  'dst-nat': { label: 'dst-nat', class: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  redirect: { label: 'redirect', class: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  'mark-connection': {
    label: 'mark-conn',
    class: 'bg-tertiary/15 text-tertiary border-tertiary/30',
  },
  'mark-packet': {
    label: 'mark-pkt',
    class: 'bg-tertiary/15 text-tertiary border-tertiary/30',
  },
};

export class FirewallTableComponent {
  private el: HTMLElement | null = null;
  private activeTab: FirewallTab = 'filter';
  private chainFilter = 'all';
  private search = '';

  constructor(private readonly callbacks: FirewallTableCallbacks) {}

  mount(parent: HTMLElement): this {
    const el = document.createElement('div');
    el.className = 'flex flex-col gap-3 w-full';
    el.innerHTML = `
      <!-- Sub-Tabs Firewall -->
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <div class="flex items-center gap-1 p-1 rounded-xl bg-surface-container/60 backdrop-blur-md ring-1 ring-outline-variant/20 overflow-x-auto no-scrollbar" role="tablist">
          <button type="button" data-fw-tab="filter"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/15 text-primary shadow-[0_0_12px_rgba(125,211,252,0.18)] transition-colors shrink-0">
            Filter Rules
          </button>
          <button type="button" data-fw-tab="nat"
            class="px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/40 transition-colors shrink-0">
            NAT
          </button>
          <button type="button" data-fw-tab="mangle"
            class="px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/40 transition-colors shrink-0">
            Mangle
          </button>
          <button type="button" data-fw-tab="connections"
            class="px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/40 transition-colors shrink-0">
            Active Connections
          </button>
        </div>

        <div class="flex items-center gap-2">
          <!-- Chain Filter -->
          <div data-chain-container class="flex items-center">
            <select data-chain-select aria-label="Filter chain firewall"
              class="h-8 px-2.5 rounded-lg bg-surface-container-high/70 text-xs text-on-surface border border-outline-variant/20 focus:outline-none focus:border-primary/50">
              <option value="all">Semua Chain</option>
              <option value="input">Chain: input</option>
              <option value="forward">Chain: forward</option>
              <option value="output">Chain: output</option>
              <option value="srcnat">Chain: srcnat</option>
              <option value="dstnat">Chain: dstnat</option>
              <option value="prerouting">Chain: prerouting</option>
            </select>
          </div>

          <!-- Search Input -->
          <div class="relative min-w-[140px] sm:min-w-[200px]">
            <span class="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-on-surface-variant/60">
              ${icon('search', 'text-[14px]')}
            </span>
            <input type="search" data-fw-search placeholder="Cari rule..."
              class="w-full h-8 pl-8 pr-2.5 bg-surface-container-high/60 rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant/60 ring-1 ring-outline-variant/20 focus:ring-primary/50 focus:outline-none" />
          </div>

          <!-- Refresh -->
          <button type="button" data-fw-refresh title="Muat ulang"
            class="toolbar-btn inline-flex items-center justify-center size-8 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors">
            ${icon('refresh', 'text-[16px]')}
          </button>
        </div>
      </div>

      <!-- Desktop Table View -->
      <div class="hidden md:block overflow-hidden rounded-xl bg-surface-container/60 ring-1 ring-outline-variant/20">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead data-fw-thead class="bg-surface-container-high/50 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/20">
              <tr>
                <th class="py-2.5 px-3 w-12 text-center">Status</th>
                <th class="py-2.5 px-3">Action</th>
                <th class="py-2.5 px-3">Chain</th>
                <th class="py-2.5 px-3">Src / Dst Address</th>
                <th class="py-2.5 px-3">Protocol / Port</th>
                <th class="py-2.5 px-3">Komentar / Match</th>
                <th class="py-2.5 px-3 text-right">Packets / Bytes</th>
                <th class="py-2.5 px-3 text-center w-16">Aksi</th>
              </tr>
            </thead>
            <tbody data-fw-tbody class="divide-y divide-outline-variant/10 font-mono text-[11px]">
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mobile Cards View -->
      <div data-fw-cards class="grid grid-cols-1 gap-2 md:hidden">
      </div>`;

    parent.appendChild(el);
    this.el = el;

    // Sub-tab switching
    el.querySelectorAll<HTMLButtonElement>('button[data-fw-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.fwTab as FirewallTab;
        if (!tab || tab === this.activeTab) return;
        this.activeTab = tab;
        this.updateTabButtons();
        this.callbacks.onTabChange(tab);
      });
    });

    // Chain filter
    const select = el.querySelector<HTMLSelectElement>('[data-chain-select]');
    select?.addEventListener('change', () => {
      this.chainFilter = select.value;
      this.callbacks.onRefresh();
    });

    // Search
    const searchInput = el.querySelector<HTMLInputElement>('[data-fw-search]');
    searchInput?.addEventListener('input', () => {
      this.search = searchInput.value.trim().toLowerCase();
      this.callbacks.onRefresh();
    });

    // Refresh
    el.querySelector<HTMLButtonElement>('[data-fw-refresh]')?.addEventListener('click', () => {
      this.callbacks.onRefresh();
    });

    return this;
  }

  private updateTabButtons(): void {
    if (!this.el) return;
    this.el.querySelectorAll<HTMLButtonElement>('button[data-fw-tab]').forEach((btn) => {
      const active = btn.dataset.fwTab === this.activeTab;
      btn.classList.toggle('bg-primary/15', active);
      btn.classList.toggle('text-primary', active);
      btn.classList.toggle('font-semibold', active);
      btn.classList.toggle('shadow-[0_0_12px_rgba(125,211,252,0.18)]', active);
      btn.classList.toggle('text-on-surface-variant', !active);
      btn.classList.toggle('font-medium', !active);
    });

    // Hide chain filter when on connections tab
    const chainContainer = this.el.querySelector<HTMLElement>('[data-chain-container]');
    if (chainContainer) {
      chainContainer.style.display = this.activeTab === 'connections' ? 'none' : 'flex';
    }
  }

  updateRules(rules: FirewallRuleEntry[]): void {
    if (!this.el || this.activeTab === 'connections') return;

    // Filter
    let list = rules;
    if (this.chainFilter !== 'all') {
      list = list.filter((r) => r.chain === this.chainFilter);
    }
    if (this.search) {
      list = list.filter(
        (r) =>
          (r.comment && r.comment.toLowerCase().includes(this.search)) ||
          r.action.toLowerCase().includes(this.search) ||
          r.chain.toLowerCase().includes(this.search) ||
          (r.srcAddress && r.srcAddress.toLowerCase().includes(this.search)) ||
          (r.dstAddress && r.dstAddress.toLowerCase().includes(this.search)),
      );
    }

    const tbody = this.el.querySelector<HTMLElement>('[data-fw-tbody]');
    const cards = this.el.querySelector<HTMLElement>('[data-fw-cards]');

    // Desktop
    if (tbody) {
      if (list.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" class="py-8 text-center text-on-surface-variant font-sans text-xs">
              Tidak ada aturan firewall yang sesuai.
            </td>
          </tr>`;
      } else {
        tbody.innerHTML = list
          .map((r, index) => {
            const actionStyle = ACTION_STYLES[r.action] ?? {
              label: r.action,
              class: 'bg-surface-container text-on-surface-variant border-outline-variant/30',
            };
            const opacity = r.enabled ? 'opacity-100' : 'opacity-40 line-through';

            return `
              <tr class="hover:bg-surface-container-high/40 transition-colors ${opacity}">
                <td class="py-2 px-3 text-center">
                  <button type="button" data-action="toggle-rule" data-id="${r.id}" title="${r.enabled ? 'Disable rule' : 'Enable rule'}"
                    class="p-1 rounded hover:bg-surface-container-highest transition-colors">
                    ${icon(r.enabled ? 'check_circle' : 'block', r.enabled ? 'text-primary text-[15px]' : 'text-outline text-[15px]')}
                  </button>
                </td>
                <td class="py-2 px-3 whitespace-nowrap">
                  <span class="px-2 py-0.5 rounded text-[10px] uppercase font-sans font-bold border ${actionStyle.class}">
                    ${actionStyle.label}
                  </span>
                </td>
                <td class="py-2 px-3 whitespace-nowrap text-on-surface-variant">
                  <span class="font-sans font-semibold text-xs text-on-surface">${r.chain}</span>
                  <span class="text-[9px] text-outline-variant ml-1">#${index}</span>
                </td>
                <td class="py-2 px-3 whitespace-nowrap">
                  <div class="flex flex-col text-[10px]">
                    <span class="text-on-surface">${r.srcAddress ?? '0.0.0.0/0'}</span>
                    <span class="text-on-surface-variant/70">→ ${r.dstAddress ?? '0.0.0.0/0'}</span>
                  </div>
                </td>
                <td class="py-2 px-3 whitespace-nowrap text-[10px] text-on-surface-variant">
                  <span>${r.protocol.toUpperCase()}</span>
                  ${r.dstPort ? `<span class="text-primary ml-1">:${r.dstPort}</span>` : ''}
                </td>
                <td class="py-2 px-3 font-sans text-xs text-on-surface">
                  <div class="flex flex-col">
                    <span class="truncate max-w-[220px]">${escapeHtml(r.comment ?? '-')}</span>
                    ${r.inInterface ? `<span class="text-[10px] text-on-surface-variant font-mono">in:${r.inInterface}</span>` : ''}
                    ${r.outInterface ? `<span class="text-[10px] text-on-surface-variant font-mono">out:${r.outInterface}</span>` : ''}
                  </div>
                </td>
                <td class="py-2 px-3 text-right whitespace-nowrap text-[10px]">
                  <div class="flex flex-col">
                    <span class="text-primary">${formatBytes(r.bytes)}</span>
                    <span class="text-on-surface-variant/70">${formatNumber(r.packets)} pkts</span>
                  </div>
                </td>
                <td class="py-2 px-3 text-center">
                  <button type="button" data-action="delete-rule" data-id="${r.id}" title="Hapus rule"
                    class="p-1 rounded text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors">
                    ${icon('delete', 'text-[15px]')}
                  </button>
                </td>
              </tr>`;
          })
          .join('');
      }
    }

    // Mobile
    if (cards) {
      if (list.length === 0) {
        cards.innerHTML = `
          <div class="p-6 text-center rounded-xl bg-surface-container/60 text-xs text-on-surface-variant">
            Tidak ada rule firewall.
          </div>`;
      } else {
        cards.innerHTML = list
          .map((r) => {
            const actionStyle = ACTION_STYLES[r.action] ?? {
              label: r.action,
              class: 'bg-surface-container text-on-surface-variant border-outline-variant/30',
            };
            const opacity = r.enabled ? 'opacity-100' : 'opacity-50';

            return `
              <div class="p-3 rounded-xl bg-surface-container/70 backdrop-blur-md ring-1 ring-outline-variant/20 flex flex-col gap-2 ${opacity}">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-1.5">
                    <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${actionStyle.class}">
                      ${actionStyle.label}
                    </span>
                    <span class="text-xs font-semibold text-on-surface">${r.chain}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <button type="button" data-action="toggle-rule" data-id="${r.id}"
                      class="p-1.5 rounded hover:bg-surface-container-high transition-colors">
                      ${icon(r.enabled ? 'check_circle' : 'block', r.enabled ? 'text-primary text-[16px]' : 'text-outline text-[16px]')}
                    </button>
                    <button type="button" data-action="delete-rule" data-id="${r.id}"
                      class="p-1.5 rounded text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors">
                      ${icon('delete', 'text-[16px]')}
                    </button>
                  </div>
                </div>
                ${r.comment ? `<p class="text-xs text-on-surface font-medium">${escapeHtml(r.comment)}</p>` : ''}
                <div class="flex flex-col gap-0.5 text-[10px] font-mono text-on-surface-variant bg-surface-container-high/40 p-2 rounded-lg">
                  <div>Src: ${r.srcAddress ?? '0.0.0.0/0'} → Dst: ${r.dstAddress ?? '0.0.0.0/0'}</div>
                  <div>Proto: ${r.protocol.toUpperCase()} ${r.dstPort ? `· Port: ${r.dstPort}` : ''}</div>
                  <div class="flex justify-between text-on-surface pt-1 border-t border-outline-variant/20">
                    <span>Traffic: ${formatBytes(r.bytes)}</span>
                    <span>${formatNumber(r.packets)} pkts</span>
                  </div>
                </div>
              </div>`;
          })
          .join('');
      }
    }

    this.bindRowActions();
  }

  updateConnections(connections: FirewallConnectionEntry[]): void {
    if (!this.el || this.activeTab !== 'connections') return;

    let list = connections;
    if (this.search) {
      list = list.filter(
        (c) =>
          c.srcAddress.includes(this.search) ||
          c.dstAddress.includes(this.search) ||
          c.protocol.includes(this.search),
      );
    }

    const tbody = this.el.querySelector<HTMLElement>('[data-fw-tbody]');
    const cards = this.el.querySelector<HTMLElement>('[data-fw-cards]');

    if (tbody) {
      tbody.innerHTML = list
        .map(
          (c) => `
          <tr class="hover:bg-surface-container-high/40 transition-colors">
            <td class="py-2 px-3 text-center">
              <span class="size-2 rounded-full bg-emerald-400 inline-block"></span>
            </td>
            <td class="py-2 px-3 whitespace-nowrap">
              <span class="px-2 py-0.5 rounded text-[10px] uppercase font-sans font-bold bg-primary/10 text-primary border border-primary/20">
                ${c.protocol.toUpperCase()}
              </span>
            </td>
            <td class="py-2 px-3 whitespace-nowrap text-on-surface-variant font-mono">
              ${c.tcpState ?? 'active'}
            </td>
            <td class="py-2 px-3 whitespace-nowrap font-mono text-on-surface">
              ${c.srcAddress} → ${c.dstAddress}
            </td>
            <td class="py-2 px-3 whitespace-nowrap font-mono text-on-surface-variant/80">
              ${c.replySrcAddress} → ${c.replyDstAddress}
            </td>
            <td class="py-2 px-3 text-on-surface-variant text-[10px]">
              timeout: ${c.timeout}
            </td>
            <td class="py-2 px-3 text-right whitespace-nowrap text-[10px]">
              <span class="text-primary">${formatBytes(c.origBytes)}</span>
              <span class="text-outline-variant mx-1">/</span>
              <span class="text-secondary">${formatBytes(c.respBytes)}</span>
            </td>
            <td class="py-2 px-3 text-center text-outline">
              -
            </td>
          </tr>`,
        )
        .join('');
    }

    if (cards) {
      cards.innerHTML = list
        .map(
          (c) => `
          <div class="p-3 rounded-xl bg-surface-container/70 backdrop-blur-md ring-1 ring-outline-variant/20 flex flex-col gap-1.5 font-mono text-xs">
            <div class="flex items-center justify-between">
              <span class="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-primary/15 text-primary border border-primary/20">
                ${c.protocol.toUpperCase()} · ${c.tcpState ?? 'active'}
              </span>
              <span class="text-[10px] text-on-surface-variant">Timeout: ${c.timeout}</span>
            </div>
            <div class="text-[11px] text-on-surface font-semibold pt-1">
              ${c.srcAddress} → ${c.dstAddress}
            </div>
            <div class="text-[10px] text-on-surface-variant/80">
              Reply: ${c.replySrcAddress} → ${c.replyDstAddress}
            </div>
            <div class="flex justify-between text-[10px] text-primary pt-1 border-t border-outline-variant/15">
              <span>Orig: ${formatBytes(c.origBytes)}</span>
              <span class="text-secondary">Resp: ${formatBytes(c.respBytes)}</span>
            </div>
          </div>`,
        )
        .join('');
    }
  }

  private bindRowActions(): void {
    if (!this.el) return;

    // Toggle rule
    this.el.querySelectorAll<HTMLButtonElement>('[data-action="toggle-rule"]').forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        if (id) this.callbacks.onToggleRule(id);
      };
    });

    // Delete rule
    this.el.querySelectorAll<HTMLButtonElement>('[data-action="delete-rule"]').forEach((btn) => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        if (!id) return;
        const confirmed = await ConfirmDialogComponent.ask({
          title: 'Hapus Rule Firewall',
          message: 'Apakah Anda yakin ingin menghapus aturan firewall ini?',
          confirmLabel: 'Hapus',
          tone: 'danger',
        });
        if (confirmed) {
          this.callbacks.onDeleteRule(id);
          toast('Rule firewall berhasil dihapus', 'success');
        }
      };
    });
  }

  destroy(): void {
    this.el?.remove();
    this.el = null;
  }
}
