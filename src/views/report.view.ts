import { ReportResumeComponent } from '@components/report/report-resume.component';
import { ReportSummaryComponent } from '@components/report/report-summary.component';
import { ReportTableComponent } from '@components/report/report-table.component';
import { ReportToolbarComponent } from '@components/report/report-toolbar.component';
import {
  REPORT_ENTRIES,
  computeLast7Days,
  computeReportSummary,
  computeResume,
  downloadFile,
  filterReportEntries,
  toCsv,
  toXlsHtml,
} from '@mock/report.mock';
import { toast } from '@store/ui.store';
import { t } from '@i18n/translate';
import { escapeHtml } from '@utils/format';
import type { ReportEntry, ReportFilter, ReportTab } from '@types';
import type { View } from './base.view';

const EMPTY_FILTER: ReportFilter = { day: 'all', month: 'all', year: 'all', query: '' };

export class ReportView implements View {
  private root: HTMLElement | null = null;
  private summary: ReportSummaryComponent | null = null;
  private toolbar: ReportToolbarComponent | null = null;
  private table: ReportTableComponent | null = null;
  private resume: ReportResumeComponent | null = null;

  private activeTab: ReportTab = 'sales';
  private filter: ReportFilter = { ...EMPTY_FILTER };
  private filtered: ReportEntry[] = [...REPORT_ENTRIES];

  mount(container: HTMLElement): this {
    const root = document.createElement('section');
    root.className = 'view flex flex-col gap-3 w-full px-3.5 pb-8';
    this.root = root;
    container.appendChild(root);

    root.innerHTML = `
      <header class="flex items-center justify-between gap-3 px-1 pt-1">
        <div class="min-w-0">
          <h1 class="text-base font-bold font-headline text-on-surface">${escapeHtml(t('report.title'))}</h1>
          <p class="mt-0.5 text-[11px] text-on-surface-variant">${escapeHtml(t('report.subtitle'))}</p>
        </div>
        <span class="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
          <span class="size-1.5 rounded-full bg-primary animate-pulse"></span>
          <span>LIVE · MOCK</span>
        </span>
      </header>
      <div data-report-toolbar class="w-full"></div>
      <div data-report-summary class="w-full"></div>
      <div data-report-content class="w-full"></div>
      <p class="px-1 text-[10px] text-on-surface-variant/70">Sumber referensi: mikhmon_v4/report · diserialisasikan sebagai mock data (Date, Time, Username, IP, MAC, Profile, Comment, Price)</p>`;

    const toolbarSlot = root.querySelector<HTMLElement>('[data-report-toolbar]');
    const summarySlot = root.querySelector<HTMLElement>('[data-report-summary]');
    const contentSlot = root.querySelector<HTMLElement>('[data-report-content]');

    if (!toolbarSlot || !summarySlot || !contentSlot) {
      throw new Error('Elemen ReportView gagal dibuat');
    }

    this.toolbar = new ReportToolbarComponent({
      onFilterChange: (filter) => {
        this.filter = filter;
        this.apply();
      },
      onTabChange: (tab) => {
        this.activeTab = tab;
        this.renderContent();
      },
      onExportCsv: () => this.exportCsv(),
      onExportXls: () => this.exportXls(),
    });
    this.toolbar.mount(toolbarSlot);

    this.summary = new ReportSummaryComponent();
    this.summary.mount(summarySlot);

    this.renderContent();
    this.apply({ silent: true });

    return this;
  }

  private apply(options: { silent?: boolean } = {}): void {
    this.filtered = filterReportEntries(REPORT_ENTRIES, this.filter);
    const summary = computeReportSummary(REPORT_ENTRIES, this.filtered);
    this.summary?.update(summary);

    if (this.activeTab === 'sales') {
      this.table?.update(this.filtered);
    } else {
      const resumed = computeResume(this.filtered);
      const days = computeLast7Days(REPORT_ENTRIES);
      this.resume?.update(resumed, days);
    }

    if (!options.silent) {
      // tidak perlu toast setiap filter — hanya tampilkan di konsol bila perlu (tetap ringkas)
    }
  }

  private renderContent(): void {
    const slot = this.root?.querySelector<HTMLElement>('[data-report-content]');
    if (!slot) return;

    if (this.table) {
      this.table.destroy();
      this.table = null;
    }
    if (this.resume) {
      this.resume.destroy();
      this.resume = null;
    }
    slot.innerHTML = '';

    if (this.activeTab === 'sales') {
      this.table = new ReportTableComponent();
      this.table.mount(slot);
      this.table.update(this.filtered);
    } else {
      this.resume = new ReportResumeComponent();
      this.resume.mount(slot);
      const resumed = computeResume(this.filtered);
      const days = computeLast7Days(REPORT_ENTRIES);
      this.resume.update(resumed, days);
    }
  }

  private exportCsv(): void {
    if (this.filtered.length === 0) {
      toast('Tidak ada data untuk di-export', 'info');
      return;
    }
    const stamp = new Date().toISOString().slice(0, 10);
    downloadFile(`dashbox-report-${stamp}.csv`, toCsv(this.filtered), 'text/csv');
    toast(`CSV berhasil diunduh · ${this.filtered.length} baris`, 'success');
  }

  private exportXls(): void {
    if (this.filtered.length === 0) {
      toast('Tidak ada data untuk di-export', 'info');
      return;
    }
    const stamp = new Date().toISOString().slice(0, 10);
    downloadFile(
      `dashbox-report-${stamp}.xls`,
      toXlsHtml(this.filtered),
      'application/vnd.ms-excel',
    );
    toast(`XLS berhasil diunduh · ${this.filtered.length} baris`, 'success');
  }

  destroy(): void {
    this.toolbar?.destroy();
    this.summary?.destroy();
    this.table?.destroy();
    this.resume?.destroy();
    this.toolbar = null;
    this.summary = null;
    this.table = null;
    this.resume = null;
    this.root?.remove();
    this.root = null;
  }
}
