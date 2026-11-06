import { icon } from '@components/ui/icon';
import { t } from '@i18n/translate';
import { toast } from '@store/ui.store';
import type { ReportDatePreset, ReportFilter, ReportTab } from '@types';
import { escapeHtml } from '@utils/format';

export interface ReportToolbarCallbacks {
  onFilterChange: (filter: ReportFilter) => void;
  onTabChange: (tab: ReportTab) => void;
  onExportCsv: () => void;
  onExportXls: () => void;
}

function toIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function datesForPreset(preset: ReportDatePreset): { startDate: string; endDate: string } {
  const now = new Date();
  switch (preset) {
    case 'today': {
      const today = toIsoDate(now);
      return { startDate: today, endDate: today };
    }
    case 'yesterday': {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const str = toIsoDate(yest);
      return { startDate: str, endDate: str };
    }
    case 'last7days': {
      const past = new Date(now);
      past.setDate(past.getDate() - 6);
      return { startDate: toIsoDate(past), endDate: toIsoDate(now) };
    }
    case 'thisMonth': {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: toIsoDate(first), endDate: toIsoDate(now) };
    }
    case 'all':
    case 'custom':
    default:
      return { startDate: '', endDate: '' };
  }
}

export class ReportToolbarComponent {
  private el: HTMLElement | null = null;
  private activeTab: ReportTab = 'sales';
  private readonly filter: ReportFilter = {
    startDate: '',
    endDate: '',
    preset: 'all',
    query: '',
  };

  constructor(private readonly callbacks: ReportToolbarCallbacks) {}

  mount(parent: HTMLElement): this {
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
          <div class="relative">
            <select data-filter-preset aria-label="${escapeHtml(t('report.preset'))}"
              class="h-8 px-2.5 rounded-lg bg-surface-container-high/70 text-xs text-on-surface border border-outline-variant/20 focus:outline-none focus:border-primary/50">
              <option value="all">${escapeHtml(t('report.presetAll'))}</option>
              <option value="today">${escapeHtml(t('report.presetToday'))}</option>
              <option value="yesterday">${escapeHtml(t('report.presetYesterday'))}</option>
              <option value="last7days">${escapeHtml(t('report.presetLast7Days'))}</option>
              <option value="thisMonth">${escapeHtml(t('report.presetThisMonth'))}</option>
              <option value="custom">${escapeHtml(t('report.presetCustom'))}</option>
            </select>
          </div>

          <div class="flex items-center gap-1 bg-surface-container-high/50 px-1.5 py-0.5 rounded-lg border border-outline-variant/20">
            <input type="date" data-filter-start aria-label="${escapeHtml(t('report.startDate'))}" title="${escapeHtml(t('report.startDate'))}"
              class="h-7 px-1.5 rounded bg-surface-container-high text-[11px] font-mono text-on-surface border-0 focus:outline-none focus:ring-1 focus:ring-primary/60 [color-scheme:dark]" />
            <span class="text-[10px] text-on-surface-variant font-mono px-0.5">${escapeHtml(t('report.dateTo'))}</span>
            <input type="date" data-filter-end aria-label="${escapeHtml(t('report.endDate'))}" title="${escapeHtml(t('report.endDate'))}"
              class="h-7 px-1.5 rounded bg-surface-container-high text-[11px] font-mono text-on-surface border-0 focus:outline-none focus:ring-1 focus:ring-primary/60 [color-scheme:dark]" />
          </div>

          <button type="button" data-filter-reset title="${escapeHtml(t('report.resetFilter'))}" aria-label="${escapeHtml(t('report.resetFilter'))}"
            class="toolbar-btn inline-flex items-center justify-center size-8 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors">
            ${icon('filter_list', 'text-[16px]')}
          </button>
        </div>

        <div class="flex items-center gap-1.5 flex-1 sm:flex-none justify-end">
          <div class="relative min-w-[140px] sm:min-w-[200px] flex-1 sm:flex-none">
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

    // Date filters & inputs
    const presetSelect = el.querySelector<HTMLSelectElement>('[data-filter-preset]');
    const startInput = el.querySelector<HTMLInputElement>('[data-filter-start]');
    const endInput = el.querySelector<HTMLInputElement>('[data-filter-end]');
    const searchInput = el.querySelector<HTMLInputElement>('[data-report-search]');

    presetSelect?.addEventListener('change', () => {
      const preset = (presetSelect.value as ReportDatePreset) || 'all';
      this.filter.preset = preset;
      if (preset !== 'custom') {
        const { startDate, endDate } = datesForPreset(preset);
        this.filter.startDate = startDate;
        this.filter.endDate = endDate;
        if (startInput) startInput.value = startDate;
        if (endInput) endInput.value = endDate;
      }
      this.callbacks.onFilterChange({ ...this.filter });
    });

    const handleDateInput = () => {
      this.filter.startDate = startInput?.value ?? '';
      this.filter.endDate = endInput?.value ?? '';
      this.filter.preset = 'custom';
      if (presetSelect) presetSelect.value = 'custom';
      this.callbacks.onFilterChange({ ...this.filter });
    };

    startInput?.addEventListener('change', handleDateInput);
    endInput?.addEventListener('change', handleDateInput);

    searchInput?.addEventListener('input', () => {
      this.filter.query = searchInput?.value ?? '';
      this.callbacks.onFilterChange({ ...this.filter });
    });

    el.querySelector<HTMLButtonElement>('[data-filter-reset]')?.addEventListener('click', () => {
      this.filter.startDate = '';
      this.filter.endDate = '';
      this.filter.preset = 'all';
      this.filter.query = '';
      if (presetSelect) presetSelect.value = 'all';
      if (startInput) startInput.value = '';
      if (endInput) endInput.value = '';
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
