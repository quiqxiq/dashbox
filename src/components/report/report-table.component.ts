import { icon } from '@components/ui/icon';
import { t } from '@i18n/translate';
import { formatRupiah } from '@mock/report.mock';
import type { ReportEntry } from '@types';
import { escapeHtml } from '@utils/format';

export class ReportTableComponent {
  private el: HTMLElement | null = null;

  mount(parent: HTMLElement): this {
    const el = document.createElement('div');
    el.className = 'w-full';
    el.innerHTML = `
      <div class="hidden md:block overflow-hidden rounded-xl bg-surface-container/60 ring-1 ring-outline-variant/20">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-surface-container-high/50 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/20">
              <tr>
                <th class="py-2.5 px-3">${escapeHtml(t('report.tableDate'))}</th>
                <th class="py-2.5 px-3">${escapeHtml(t('report.tableTime'))}</th>
                <th class="py-2.5 px-3">${escapeHtml(t('report.tableUsername'))}</th>
                <th class="py-2.5 px-3">${escapeHtml(t('report.tableIp'))}</th>
                <th class="py-2.5 px-3">${escapeHtml(t('report.tableMac'))}</th>
                <th class="py-2.5 px-3">${escapeHtml(t('report.tableProfile'))}</th>
                <th class="py-2.5 px-3">${escapeHtml(t('report.tableComment'))}</th>
                <th class="py-2.5 px-3 text-right">${escapeHtml(t('report.tablePrice'))}</th>
              </tr>
            </thead>
            <tbody data-report-tbody class="divide-y divide-outline-variant/10 text-[11px]">
            </tbody>
          </table>
        </div>
      </div>
      <div data-report-cards class="grid grid-cols-1 gap-2 md:hidden">
      </div>`;

    parent.appendChild(el);
    this.el = el;
    return this;
  }

  update(entries: ReportEntry[]): void {
    if (!this.el) return;

    const tbody = this.el.querySelector<HTMLElement>('[data-report-tbody]');
    if (tbody) {
      if (entries.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" class="py-10 text-center text-on-surface-variant font-sans text-xs">
              ${escapeHtml(t('report.emptySales'))}
            </td>
          </tr>`;
      } else {
        tbody.innerHTML = entries
          .map(
            (e) => `
            <tr class="hover:bg-surface-container-high/40 transition-colors">
              <td class="py-2.5 px-3 whitespace-nowrap font-mono text-on-surface-variant">${e.date}</td>
              <td class="py-2.5 px-3 whitespace-nowrap font-mono text-on-surface-variant">${e.time}</td>
              <td class="py-2.5 px-3 font-sans font-semibold text-xs text-on-surface">${escapeHtml(e.username)}</td>
              <td class="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-on-surface">${e.ip}</td>
              <td class="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-on-surface-variant">${e.mac}</td>
              <td class="py-2.5 px-3 whitespace-nowrap">
                <span class="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-tertiary/10 text-tertiary border border-tertiary/20">
                  ${escapeHtml(e.profile)}
                </span>
              </td>
              <td class="py-2.5 px-3 font-sans text-xs text-on-surface-variant">${escapeHtml(e.comment || '-')}</td>
              <td class="py-2.5 px-3 text-right whitespace-nowrap font-mono font-bold text-primary">${formatRupiah(e.price)}</td>
            </tr>`,
          )
          .join('');
      }
    }

    const cards = this.el.querySelector<HTMLElement>('[data-report-cards]');
    if (cards) {
      if (entries.length === 0) {
        cards.innerHTML = `
          <div class="p-6 text-center rounded-xl bg-surface-container/60 text-xs text-on-surface-variant">
            ${escapeHtml(t('report.emptySalesShort'))}
          </div>`;
      } else {
        cards.innerHTML = entries
          .map(
            (e) => `
            <div class="p-3 rounded-xl bg-surface-container/70 backdrop-blur-md ring-1 ring-outline-variant/20 flex flex-col gap-2">
              <div class="flex items-center justify-between gap-2">
                <span class="font-semibold text-xs text-on-surface truncate flex items-center gap-1.5">
                  ${icon('confirmation_number', 'text-tertiary text-[15px] shrink-0')}
                  ${escapeHtml(e.username)}
                </span>
                <span class="font-mono font-bold text-xs text-primary shrink-0">${formatRupiah(e.price)}</span>
              </div>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-tertiary/10 text-tertiary border border-tertiary/20">
                  ${escapeHtml(e.profile)}
                </span>
                <span class="font-mono text-[10px] text-on-surface-variant">${e.date} · ${e.time}</span>
              </div>
              <div class="grid grid-cols-2 gap-1.5 pt-1 border-t border-outline-variant/15 font-mono text-[10px] text-on-surface-variant">
                <div>IP <span class="text-on-surface">${e.ip}</span></div>
                <div class="text-right">MAC <span class="text-on-surface">${e.mac}</span></div>
              </div>
            </div>`,
          )
          .join('');
      }
    }
  }

  destroy(): void {
    this.el?.remove();
    this.el = null;
  }
}
