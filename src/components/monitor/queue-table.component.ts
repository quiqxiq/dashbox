import { ConfirmDialogComponent } from '@components/ui/confirm-dialog.component';
import { icon } from '@components/ui/icon';
import { toast } from '@store/ui.store';
import type { SimpleQueueEntry } from '@types';
import { escapeHtml, formatBitsPerSec, formatBytes } from '@utils/format';

export interface QueueTableCallbacks {
  onToggleQueue: (id: string) => void;
  onDeleteQueue: (id: string) => void;
  onResetBytes: (id: string) => void;
  onRefresh: () => void;
}

function getUsageTone(percent: number): {
  color: string;
  barClass: string;
  bgGlow: string;
  label: string;
} {
  if (percent >= 85) {
    return {
      color: 'text-error',
      barClass: 'bg-error shadow-[0_0_8px_rgba(255,107,107,0.5)]',
      bgGlow: 'bg-error/15 text-error border-error/30',
      label: 'Saturated',
    };
  }
  if (percent >= 50) {
    return {
      color: 'text-amber-400',
      barClass: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]',
      bgGlow: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      label: 'Heavy',
    };
  }
  return {
    color: 'text-emerald-400',
    barClass: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.3)]',
    bgGlow: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    label: 'Normal',
  };
}

export class QueueTableComponent {
  private el: HTMLElement | null = null;
  private search = '';

  constructor(private readonly callbacks: QueueTableCallbacks) {}

  mount(parent: HTMLElement): this {
    const el = document.createElement('div');
    el.className = 'flex flex-col gap-3 w-full';
    el.innerHTML = `
      <!-- Toolbar -->
      <div class="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-surface-container/80 backdrop-blur-xl ring-1 ring-outline-variant/20">
        <div class="flex items-center gap-2 flex-1 max-w-sm">
          <div class="relative w-full">
            <span class="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-on-surface-variant/60">
              ${icon('search', 'text-[15px]')}
            </span>
            <input type="search" data-queue-search placeholder="Cari nama antrean, target IP..."
              class="w-full h-8 pl-8 pr-3 bg-surface-container-high/60 rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant/60 ring-1 ring-outline-variant/20 focus:ring-primary/50 focus:outline-none transition-all" />
          </div>
        </div>

        <div class="flex items-center gap-1.5">
          <button type="button" data-queue-add
            class="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-primary text-on-primary text-xs font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all">
            ${icon('add', 'text-[15px]')}
            <span class="hidden sm:inline">Tambah Queue</span>
          </button>
          <button type="button" data-queue-refresh title="Muat ulang status"
            class="toolbar-btn inline-flex items-center justify-center size-8 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors">
            ${icon('refresh', 'text-[16px]')}
          </button>
        </div>
      </div>

      <!-- Desktop Table View -->
      <div class="hidden md:block overflow-hidden rounded-xl bg-surface-container/60 ring-1 ring-outline-variant/20">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-surface-container-high/50 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/20">
              <tr>
                <th class="py-2.5 px-3 w-10 text-center">Status</th>
                <th class="py-2.5 px-3">Nama Queue</th>
                <th class="py-2.5 px-3">Target IP</th>
                <th class="py-2.5 px-3">Upload (Rate / Limit)</th>
                <th class="py-2.5 px-3">Download (Rate / Limit)</th>
                <th class="py-2.5 px-3">Total Volume</th>
                <th class="py-2.5 px-3 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody data-queue-tbody class="divide-y divide-outline-variant/10 font-mono text-[11px]">
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mobile Cards View -->
      <div data-queue-cards class="grid grid-cols-1 gap-2 md:hidden">
      </div>`;

    parent.appendChild(el);
    this.el = el;

    el.querySelector<HTMLInputElement>('[data-queue-search]')?.addEventListener('input', (e) => {
      this.search = (e.target as HTMLInputElement).value.trim().toLowerCase();
      this.callbacks.onRefresh();
    });

    el.querySelector<HTMLButtonElement>('[data-queue-refresh]')?.addEventListener('click', () => {
      this.callbacks.onRefresh();
    });

    el.querySelector<HTMLButtonElement>('[data-queue-add]')?.addEventListener('click', () => {
      toast('Formulir tambah Simple Queue siap dikonfigurasi', 'info');
    });

    return this;
  }

  update(queues: SimpleQueueEntry[]): void {
    if (!this.el) return;

    const filtered = this.search
      ? queues.filter(
          (q) =>
            q.name.toLowerCase().includes(this.search) ||
            q.target.toLowerCase().includes(this.search) ||
            (q.comment && q.comment.toLowerCase().includes(this.search)),
        )
      : queues;

    const tbody = this.el.querySelector<HTMLElement>('[data-queue-tbody]');
    const cards = this.el.querySelector<HTMLElement>('[data-queue-cards]');

    // Desktop
    if (tbody) {
      if (filtered.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="py-8 text-center text-on-surface-variant font-sans text-xs">
              Tidak ada antrean bandwidth yang sesuai.
            </td>
          </tr>`;
      } else {
        tbody.innerHTML = filtered
          .map((q) => {
            const upPercent = Math.min(
              100,
              Math.round((q.currentRateUploadBps / Math.max(1, q.maxUploadBps)) * 100),
            );
            const downPercent = Math.min(
              100,
              Math.round((q.currentRateDownloadBps / Math.max(1, q.maxDownloadBps)) * 100),
            );

            const upTone = getUsageTone(upPercent);
            const downTone = getUsageTone(downPercent);
            const maxPercent = Math.max(upPercent, downPercent);
            const overallTone = getUsageTone(maxPercent);

            const opacity = q.enabled ? 'opacity-100' : 'opacity-40';

            return `
              <tr class="hover:bg-surface-container-high/40 transition-colors ${opacity}">
                <td class="py-2.5 px-3 text-center">
                  <button type="button" data-action="toggle-queue" data-id="${q.id}" title="${q.enabled ? 'Disable' : 'Enable'}"
                    class="p-1 rounded hover:bg-surface-container-highest transition-colors">
                    ${icon(q.enabled ? 'check_circle' : 'block', q.enabled ? 'text-primary text-[15px]' : 'text-outline text-[15px]')}
                  </button>
                </td>
                <td class="py-2.5 px-3">
                  <div class="flex flex-col font-sans">
                    <div class="flex items-center gap-1.5">
                      <span class="font-semibold text-xs text-on-surface">${escapeHtml(q.name)}</span>
                      <span class="px-1.5 py-0.2 rounded text-[9px] font-bold border ${overallTone.bgGlow}">
                        ${maxPercent}%
                      </span>
                    </div>
                    <span class="text-[10px] text-on-surface-variant/70 font-sans">${escapeHtml(q.comment ?? q.queueType)}</span>
                  </div>
                </td>
                <td class="py-2.5 px-3 whitespace-nowrap text-on-surface">
                  <span class="bg-surface-container-high/60 px-1.5 py-0.5 rounded text-[11px] font-mono border border-outline-variant/20">
                    ${q.target}
                  </span>
                </td>
                <!-- Upload Rate Bar -->
                <td class="py-2.5 px-3 whitespace-nowrap min-w-[140px]">
                  <div class="flex flex-col gap-1">
                    <div class="flex justify-between text-[10px]">
                      <span class="${upTone.color} font-bold">${formatBitsPerSec(q.currentRateUploadBps)}</span>
                      <span class="text-on-surface-variant">/ ${q.maxLimitUpload}</span>
                    </div>
                    <div class="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-300 ${upTone.barClass}" style="width: ${upPercent}%"></div>
                    </div>
                  </div>
                </td>
                <!-- Download Rate Bar -->
                <td class="py-2.5 px-3 whitespace-nowrap min-w-[140px]">
                  <div class="flex flex-col gap-1">
                    <div class="flex justify-between text-[10px]">
                      <span class="${downTone.color} font-bold">${formatBitsPerSec(q.currentRateDownloadBps)}</span>
                      <span class="text-on-surface-variant">/ ${q.maxLimitDownload}</span>
                    </div>
                    <div class="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-300 ${downTone.barClass}" style="width: ${downPercent}%"></div>
                    </div>
                  </div>
                </td>
                <td class="py-2.5 px-3 whitespace-nowrap text-on-surface-variant text-[10px]">
                  <div>${formatBytes(q.totalBytes)}</div>
                  <div class="text-[9px] text-on-surface-variant/60">${q.packetRate}</div>
                </td>
                <td class="py-2.5 px-3 text-center whitespace-nowrap">
                  <div class="flex items-center justify-center gap-1">
                    <button type="button" data-action="reset-queue" data-id="${q.id}" title="Reset byte counter"
                      class="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors">
                      ${icon('restart_alt', 'text-[15px]')}
                    </button>
                    <button type="button" data-action="delete-queue" data-id="${q.id}" title="Hapus queue"
                      class="p-1 rounded text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors">
                      ${icon('delete', 'text-[15px]')}
                    </button>
                  </div>
                </td>
              </tr>`;
          })
          .join('');
      }
    }

    // Mobile
    if (cards) {
      if (filtered.length === 0) {
        cards.innerHTML = `
          <div class="p-6 text-center rounded-xl bg-surface-container/60 text-xs text-on-surface-variant">
            Tidak ada queue yang sesuai.
          </div>`;
      } else {
        cards.innerHTML = filtered
          .map((q) => {
            const upPercent = Math.min(
              100,
              Math.round((q.currentRateUploadBps / Math.max(1, q.maxUploadBps)) * 100),
            );
            const downPercent = Math.min(
              100,
              Math.round((q.currentRateDownloadBps / Math.max(1, q.maxDownloadBps)) * 100),
            );

            const upTone = getUsageTone(upPercent);
            const downTone = getUsageTone(downPercent);
            const maxPercent = Math.max(upPercent, downPercent);
            const overallTone = getUsageTone(maxPercent);
            const opacity = q.enabled ? 'opacity-100' : 'opacity-50';

            return `
              <div class="p-3 rounded-xl bg-surface-container/70 backdrop-blur-md ring-1 ring-outline-variant/20 flex flex-col gap-2 ${opacity}">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <button type="button" data-action="toggle-queue" data-id="${q.id}">
                      ${icon(q.enabled ? 'check_circle' : 'block', q.enabled ? 'text-primary text-[16px]' : 'text-outline text-[16px]')}
                    </button>
                    <span class="font-semibold text-xs text-on-surface truncate">${escapeHtml(q.name)}</span>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${overallTone.bgGlow}">
                    ${maxPercent}%
                  </span>
                </div>
                <div class="flex items-center justify-between text-[11px] text-on-surface-variant font-mono">
                  <span>Target: ${q.target}</span>
                  <span>Total: ${formatBytes(q.totalBytes)}</span>
                </div>
                <!-- Dual Rates -->
                <div class="flex flex-col gap-2 pt-1 border-t border-outline-variant/15 font-mono text-[11px]">
                  <div>
                    <div class="flex justify-between text-[10px] mb-0.5">
                      <span class="${upTone.color} font-bold">Up: ${formatBitsPerSec(q.currentRateUploadBps)}</span>
                      <span class="text-on-surface-variant">Max: ${q.maxLimitUpload} (${upPercent}%)</span>
                    </div>
                    <div class="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                      <div class="h-full rounded-full ${upTone.barClass}" style="width: ${upPercent}%"></div>
                    </div>
                  </div>
                  <div>
                    <div class="flex justify-between text-[10px] mb-0.5">
                      <span class="${downTone.color} font-bold">Down: ${formatBitsPerSec(q.currentRateDownloadBps)}</span>
                      <span class="text-on-surface-variant">Max: ${q.maxLimitDownload} (${downPercent}%)</span>
                    </div>
                    <div class="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                      <div class="h-full rounded-full ${downTone.barClass}" style="width: ${downPercent}%"></div>
                    </div>
                  </div>
                </div>
                <!-- Actions -->
                <div class="flex justify-end gap-2 pt-1">
                  <button type="button" data-action="reset-queue" data-id="${q.id}" class="text-[10px] text-primary flex items-center gap-1 px-2 py-1 rounded bg-primary/10">
                    ${icon('restart_alt', 'text-[12px]')} Reset Counter
                  </button>
                  <button type="button" data-action="delete-queue" data-id="${q.id}" class="text-[10px] text-error flex items-center gap-1 px-2 py-1 rounded bg-error/10">
                    ${icon('delete', 'text-[12px]')} Hapus
                  </button>
                </div>
              </div>`;
          })
          .join('');
      }
    }

    this.bindRowActions();
  }

  private bindRowActions(): void {
    if (!this.el) return;

    this.el.querySelectorAll<HTMLButtonElement>('[data-action="toggle-queue"]').forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        if (id) this.callbacks.onToggleQueue(id);
      };
    });

    this.el.querySelectorAll<HTMLButtonElement>('[data-action="reset-queue"]').forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        if (id) {
          this.callbacks.onResetBytes(id);
          toast('Counter byte queue berhasil direset', 'info');
        }
      };
    });

    this.el.querySelectorAll<HTMLButtonElement>('[data-action="delete-queue"]').forEach((btn) => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        if (!id) return;
        const confirmed = await ConfirmDialogComponent.ask({
          title: 'Hapus Simple Queue',
          message: 'Apakah Anda yakin ingin menghapus antrean bandwidth ini?',
          confirmLabel: 'Hapus',
          tone: 'danger',
        });
        if (confirmed) {
          this.callbacks.onDeleteQueue(id);
          toast('Queue berhasil dihapus', 'success');
        }
      };
    });
  }

  destroy(): void {
    this.el?.remove();
    this.el = null;
  }
}
