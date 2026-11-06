import { icon } from '@components/ui/icon';
import { t } from '@i18n/translate';
import type { ReportSummary } from '@types';
import { formatRupiah } from '@mock/report.mock';

export class ReportSummaryComponent {
  private el: HTMLElement | null = null;

  mount(parent: HTMLElement): this {
    const el = document.createElement('div');
    el.className = 'grid grid-cols-2 lg:grid-cols-4 gap-2.5';
    el.innerHTML = `
      <div class="p-3.5 rounded-xl bg-surface-container/70 backdrop-blur-md ring-1 ring-outline-variant/20 flex flex-col justify-between min-h-[88px]">
        <div class="flex items-center justify-between text-on-surface-variant text-[11px] font-medium">
          <span>${escapeHtmlLocal(t('report.today'))}</span>
          ${icon('receipt_long', 'text-primary text-[16px]')}
        </div>
        <div class="mt-2">
          <div data-summary-today class="text-base sm:text-lg font-bold font-mono text-primary">Rp 0</div>
          <div data-summary-today-count class="text-[10px] text-on-surface-variant mt-0.5">0 voucher terjual</div>
        </div>
      </div>
      <div class="p-3.5 rounded-xl bg-surface-container/70 backdrop-blur-md ring-1 ring-outline-variant/20 flex flex-col justify-between min-h-[88px]">
        <div class="flex items-center justify-between text-on-surface-variant text-[11px] font-medium">
          <span>${escapeHtmlLocal(t('report.thisMonth'))}</span>
          ${icon('calendar_month', 'text-secondary text-[16px]')}
        </div>
        <div class="mt-2">
          <div data-summary-month class="text-base sm:text-lg font-bold font-mono text-secondary">Rp 0</div>
          <div data-summary-month-count class="text-[10px] text-on-surface-variant mt-0.5">0 voucher bulan ini</div>
        </div>
      </div>
      <div class="p-3.5 rounded-xl bg-surface-container/70 backdrop-blur-md ring-1 ring-outline-variant/20 flex flex-col justify-between min-h-[88px] col-span-2 lg:col-span-1">
        <div class="flex items-center justify-between text-on-surface-variant text-[11px] font-medium">
          <span>${escapeHtmlLocal(t('report.filteredTotal'))}</span>
          ${icon('paid', 'text-tertiary text-[16px]')}
        </div>
        <div class="mt-2">
          <div data-summary-filtered class="text-base sm:text-lg font-bold font-mono text-tertiary">Rp 0</div>
          <div data-summary-filtered-count class="text-[10px] text-on-surface-variant mt-0.5">0 transaksi · rata-rata Rp 0</div>
        </div>
      </div>
      <div class="p-3.5 rounded-xl bg-surface-container/70 backdrop-blur-md ring-1 ring-outline-variant/20 flex flex-col justify-between min-h-[88px] col-span-2 lg:col-span-1">
        <div class="flex items-center justify-between text-on-surface-variant text-[11px] font-medium">
          <span>${escapeHtmlLocal(t('report.topProfile'))}</span>
          ${icon('confirmation_number', 'text-emerald-400 text-[16px]')}
        </div>
        <div class="mt-2">
          <div data-summary-top class="text-base sm:text-lg font-bold font-mono text-emerald-400">-</div>
          <div class="text-[10px] text-on-surface-variant mt-0.5">dari pencarian / filter aktif</div>
        </div>
      </div>`;

    parent.appendChild(el);
    this.el = el;
    return this;
  }

  update(summary: ReportSummary): void {
    if (!this.el) return;
    const set = (sel: string, value: string) => {
      const node = this.el?.querySelector(sel);
      if (node) node.textContent = value;
    };
    set('[data-summary-today]', formatRupiah(summary.todayIncome));
    set('[data-summary-today-count]', `${summary.todayCount} voucher terjual`);
    set('[data-summary-month]', formatRupiah(summary.monthIncome));
    set('[data-summary-month-count]', `${summary.monthCount} voucher bulan ini`);
    set('[data-summary-filtered]', formatRupiah(summary.filteredIncome));
    set(
      '[data-summary-filtered-count]',
      `${summary.filteredCount} transaksi · rata-rata ${formatRupiah(summary.average)}`,
    );
    set('[data-summary-top]', summary.topProfile);
  }

  destroy(): void {
    this.el?.remove();
    this.el = null;
  }
}

function escapeHtmlLocal(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
}
