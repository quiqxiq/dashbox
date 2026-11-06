import { icon } from '@components/ui/icon';
import { t } from '@i18n/translate';
import { toast } from '@store/ui.store';
import type { ReportFilter, ReportTab } from '@types';
import { escapeHtml } from '@utils/format';

export interface ReportToolbarCallbacks {
  onFilterChange: (filter: ReportFilter) => void;
  onTabChange: (tab: ReportTab) => void;
  onExportCsv: () => void;
  onExportXls: () => void;
}

export class ReportToolbarComponent {
  private el: HTMLElement | null = null;
  private activeTab: ReportTab = 'sales';
  private readonly filter: ReportFilter = { day: 'all', month: 'all', year: 'all', query: '' };
  private readonly currentYear = new Date().getFullYear();

  constructor(private readonly callbacks: ReportToolbarCallbacks) {}

  mount(parent: HTMLElement): this {
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
      .map((m) => `<option value="${this.currentYear}-${m}">${m}/${this.currentYear}</option>`)
      .join('');

    const years = [this.currentYear - 1, this.currentYear, this.currentYear + 1]
      .map((y) => `<option value="${y}">${y}</option>`)
      .join('');

    const days = Array.from({ length: 31 }, (_, i) => {
      const d = String(i + 1).padStart(2, '0');
      return `<option value="${d}">${d}</option>`;
    }).join('');

    const el = document.createElement('div');
    el.className = 'flex flex-col gap-2';
    el.innerHTML = `
      <div class="flex items-center gap-1.5 p-1 rounded-xl bg-surface-container/60 backdrop-blur-md ring-1 ring-outline-variant/20 w-fit max-w-full overflow-x-auto no-scrollbar" role="tablist" aria-label="${escapeHtml(t('report.tabAria'))}">
        <button type="button" data-report-tab="sales"
          class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/15 text-primary shadow-[0_0_12px_rgba(125,211,252,0.18)] transition-colors flex items-center gap-1.5 shrink-0">
          ${icon('receipt_long', 'text-[15px]')}
          <span>${escapeHtml(t('report.detail'))}</span>
        </button>
        <button type="button" data-report-tab="resume"
          class="px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/40 transition-colors flex items-center gap-1.5 shrink-0">
          ${icon('show_chart', 'text-[15px]')}
          <span>${escapeHtml(t('report.resume'))}</span>
        </button>
      </div>

      <div class="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-surface-container/80 backdrop-blur-xl ring-1 ring-outline-variant/20 flex-wrap">
        <div class="flex items-center gap-1.5 flex-wrap">
          <select data-filter-day aria-label="${escapeHtml(t('report.filterDay'))}"
            class="h-8 px-2 rounded-lg bg-surface-container-high/70 text-xs text-on-surface border border-outline-variant/20 focus:outline-none focus:border-primary/50">
            <option value="all">${escapeHtml(t('report.allDays'))}</option>
            ${days}
          </select>
          <select data-filter-month aria-label="${escapeHtml(t('report.filterMonth'))}"
            class="h-8 px-2 rounded-lg bg-surface-container-high/70 text-xs text-on-surface border border-outline-variant/20 focus:outline-none focus:border-primary/50">
            <option value="all">${escapeHtml(t('report.allMonths'))}</option>
            ${months}
          </select>
          <select data-filter-year aria-label="${escapeHtml(t('report.filterYear'))}"
            class="h-8 px-2 rounded-lg bg-surface-container-high/70 text-xs text-on-surface border border-outline-variant/20 focus:outline-none focus:border-primary/50">
            <option value="all">${escapeHtml(t('report.allYears'))}</option>
            ${years}
          </select>
          <button type="button" data-filter-reset title="${escapeHtml(t('report.resetFilter'))}" aria-label="${escapeHtml(t('report.resetFilter'))}"
            class="toolbar-btn inline-flex items-center justify-center size-8 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors">
            ${icon('filter_list', 'text-[16px]')}
          </button>
        </div>

        <div class="flex items-center gap-1.5">
          <div class="relative min-w-[150px] sm:min-w-[220px] flex-1 sm:flex-none">
            <span class="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-on-surface-variant/60">
              ${icon('search', 'text-[15px]')}
            </span>
            <input type="search" data-report-search placeholder="${escapeHtml(t('report.search'))}"
              class="w-full h-8 pl-8 pr-3 bg-surface-container-high/60 rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant/60 ring-1 ring-outline-variant/20 focus:ring-primary/50 focus:outline-none transition-all" />
          </div>
          <button type="button" data-export-csv title="${escapeHtml(t('report.exportCsv'))}" aria-label="${escapeHtml(t('report.exportCsv'))}"
            class="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-on-primary bg-primary hover:opacity-90 active:scale-95 transition-all">
            ${icon('download', 'text-[15px]')}
            <span class="hidden sm:inline">CSV</span>
          </button>
          <button type="button" data-export-xls title="${escapeHtml(t('report.exportXls'))}" aria-label="${escapeHtml(t('report.exportXls'))}"
            class="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-secondary bg-secondary/10 ring-1 ring-secondary/30 hover:bg-secondary/20 active:scale-95 transition-all">
            ${icon('download', 'text-[15px]')}
            <span class="hidden sm:inline">XLS</span>
          </button>
        </div>
      </div>`;

    parent.appendChild(el);
    this.el = el;

    // Tab switching
    el.querySelectorAll<HTMLButtonElement>('button[data-report-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.reportTab as ReportTab | undefined;
        if (!tab || tab === this.activeTab) return;
        this.activeTab = tab;
        this.updateTabButtons();
        this.callbacks.onTabChange(tab);
      });
    });

    // Filter selects
    const daySelect = el.querySelector<HTMLSelectElement>('[data-filter-day]');
    const monthSelect = el.querySelector<HTMLSelectElement>('[data-filter-month]');
    const yearSelect = el.querySelector<HTMLSelectElement>('[data-filter-year]');
    const searchInput = el.querySelector<HTMLInputElement>('[data-report-search]');

    const sync = () => {
      this.filter.day = daySelect?.value ?? 'all';
      this.filter.month = monthSelect?.value ?? 'all';
      this.filter.year = yearSelect?.value ?? 'all';
      this.filter.query = searchInput?.value ?? '';
      this.callbacks.onFilterChange({ ...this.filter });
    };

    daySelect?.addEventListener('change', sync);
    monthSelect?.addEventListener('change', sync);
    yearSelect?.addEventListener('change', sync);
    searchInput?.addEventListener('input', sync);

    el.querySelector<HTMLButtonElement>('[data-filter-reset]')?.addEventListener('click', () => {
      this.filter.day = 'all';
      this.filter.month = 'all';
      this.filter.year = 'all';
      this.filter.query = '';
      if (daySelect) daySelect.value = 'all';
      if (monthSelect) monthSelect.value = 'all';
      if (yearSelect) yearSelect.value = 'all';
      if (searchInput) searchInput.value = '';
      this.callbacks.onFilterChange({ ...this.filter });
      toast(t('report.filterResetToast'), 'info');
    });

    el.querySelector<HTMLButtonElement>('[data-export-csv]')?.addEventListener('click', () => {
      this.callbacks.onExportCsv();
    });
    el.querySelector<HTMLButtonElement>('[data-export-xls]')?.addEventListener('click', () => {
      this.callbacks.onExportXls();
    });

    return this;
  }

  private updateTabButtons(): void {
    if (!this.el) return;
    this.el.querySelectorAll<HTMLButtonElement>('button[data-report-tab]').forEach((btn) => {
      const active = btn.dataset.reportTab === this.activeTab;
      btn.classList.toggle('bg-primary/15', active);
      btn.classList.toggle('text-primary', active);
      btn.classList.toggle('font-semibold', active);
      btn.classList.toggle('shadow-[0_0_12px_rgba(125,211,252,0.18)]', active);
      btn.classList.toggle('text-on-surface-variant', !active);
      btn.classList.toggle('font-medium', !active);
    });
  }

  destroy(): void {
    this.el?.remove();
    this.el = null;
  }
}
