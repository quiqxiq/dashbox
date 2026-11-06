import { icon } from '@components/ui/icon';
import { t } from '@i18n/translate';
import { formatRupiah } from '@mock/report.mock';
import type { ReportSummary } from '@types';
import { escapeHtml } from '@utils/format';

export class ReportSummaryComponent {
  private el: HTMLElement | null = null;

  mount(parent: HTMLElement): this {
    const el = document.createElement('div');
    el.className = 'grid grid-cols-2 lg:grid-cols-4 gap-2.5';
    el.innerHTML = `
      <div class="p-3.5 rounded-xl bg-surface-container/70 backdrop-blur-md ring-1 ring-outline-variant/20 flex flex-col justify-between min-h-[88px]">
        <div class="flex items-center justify-between text-on-surface-variant text-[11px] font-medium">
          <span>${escapeHtml(t('report.today'))}</span>
          ${icon('receipt_long', 'text-primary text-[16px]')}
        </div>
        <div class="mt-2">
          <div data-summary-today class="text-base sm:text-lg font-bold font-mono text-primary">${formatRupiah(0)}</div>
          <div data-summary-today-count class="text-[10px] text-on-surface-variant mt-0.5">${escapeHtml(t('report.todayCount', { count: 0 }))}</div>
        </div>
      </div>
      <div class="p-3.5 rounded-xl bg-surface-container/70 backdrop-blur-md ring-1 ring-outline-variant/20 flex flex-col justify-between min-h-[88px]">
        <div class="flex items-center justify-between text-on-surface-variant text-[11px] font-medium">
          <span>${escapeHtml(t('report.thisMonth'))}</span>
          ${icon('calendar_month', 'text-secondary text-[16px]')}
        </div>
        <div class="mt-2">
          <div data-summary-month class="text-base sm:text-lg font-bold font-mono text-secondary">${formatRupiah(0)}</div>
          <div data-summary-month-count class="text-[10px] text-on-surface-variant mt-0.5">${escapeHtml(t('report.monthCount', { count: 0 }))}</div>
        </div>
      </div>
      <div class="p-3.5 rounded-xl bg-surface-container/70 backdrop-blur-md ring-1 ring-outline-variant/20 flex flex-col justify-between min-h-[88px] col-span-2 lg:col-span-1">
        <div class="flex items-center justify-between text-on-surface-variant text-[11px] font-medium">
          <span>${escapeHtml(t('report.filteredTotal'))}</span>
          ${icon('paid', 'text-tertiary text-[16px]')}
        </div>
        <div class="mt-2">
          <div data-summary-filtered class="text-base sm:text-lg font-bold font-mono text-tertiary">${formatRupiah(0)}</div>
          <div data-summary-filtered-count class="text-[10px] text-on-surface-variant mt-0.5">${escapeHtml(t('report.filteredCount', { count: 0, average: formatRupiah(0) }))}</div>
        </div>
      </div>
      <div class="p-3.5 rounded-xl bg-surface-container/70 backdrop-blur-md ring-1 ring-outline-variant/20 flex flex-col justify-between min-h-[88px] col-span-2 lg:col-span-1">
        <div class="flex items-center justify-between text-on-surface-variant text-[11px] font-medium">
          <span>${escapeHtml(t('report.topProfile'))}</span>
          ${icon('confirmation_number', 'text-emerald-400 text-[16px]')}
        </div>
        <div class="mt-2">
          <div data-summary-top class="text-base sm:text-lg font-bold font-mono text-emerald-400">-</div>
          <div class="text-[10px] text-on-surface-variant mt-0.5">${escapeHtml(t('report.topProfileHint'))}</div>
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
    set('[data-summary-today-count]', t('report.todayCount', { count: summary.todayCount }));
    set('[data-summary-month]', formatRupiah(summary.monthIncome));
    set('[data-summary-month-count]', t('report.monthCount', { count: summary.monthCount }));
    set('[data-summary-filtered]', formatRupiah(summary.filteredIncome));
    set(
      '[data-summary-filtered-count]',
      t('report.filteredCount', {
        count: summary.filteredCount,
        average: formatRupiah(summary.average),
      }),
    );
    set('[data-summary-top]', summary.topProfile);
  }

  destroy(): void {
    this.el?.remove();
    this.el = null;
  }
}
