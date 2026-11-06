import { icon } from '@components/ui/icon';
import { t } from '@i18n/translate';
import { formatRupiah } from '@mock/report.mock';
import type { ReportDayPoint, ReportResumeRow } from '@types';
import { escapeHtml } from '@utils/format';

function barClassFor(height: number, active: boolean): string {
  if (active) return 'bg-primary shadow-[0_0_10px_rgba(125,211,252,0.5)]';
  if (height >= 80) return 'bg-primary/80';
  if (height >= 65) return 'bg-primary/65';
  if (height >= 50) return 'bg-primary/50';
  if (height >= 35) return 'bg-primary/35';
  return 'bg-primary/25';
}

export class ReportResumeComponent {
  private el: HTMLElement | null = null;

  mount(parent: HTMLElement): this {
    const el = document.createElement('div');
    el.className = 'flex flex-col gap-3 w-full';
    el.innerHTML = `
      <div class="rounded-2xl bg-surface-container/60 backdrop-blur-xl p-3.5 sm:p-4 ring-1 ring-outline-variant/20">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-1.5">
            ${icon('show_chart', 'text-primary text-[17px]')}
            <h3 class="text-xs font-bold uppercase tracking-wider font-headline text-on-surface">${escapeHtml(t('report.chartTitle'))}</h3>
          </div>
          <span class="text-[10px] font-mono text-on-surface-variant">${escapeHtml(t('report.perDay'))}</span>
        </div>
        <div data-resume-chart class="flex items-end gap-2 h-32">
        </div>
        <div data-resume-labels class="flex items-center justify-between mt-2 text-[10px] font-mono text-on-surface-variant">
        </div>
      </div>

      <div class="overflow-hidden rounded-xl bg-surface-container/60 ring-1 ring-outline-variant/20">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-surface-container-high/50 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/20">
              <tr>
                <th class="py-2.5 px-3">${escapeHtml(t('report.colProfileName'))}</th>
                <th class="py-2.5 px-3 text-center">${escapeHtml(t('report.colVoucherCount'))}</th>
                <th class="py-2.5 px-3 text-right">${escapeHtml(t('report.colTotalIncome'))}</th>
                <th class="py-2.5 px-3 w-[180px] hidden sm:table-cell">${escapeHtml(t('report.colContribution'))}</th>
              </tr>
            </thead>
            <tbody data-resume-tbody class="divide-y divide-outline-variant/10 text-[11px]">
            </tbody>
          </table>
        </div>
      </div>`;

    parent.appendChild(el);
    this.el = el;
    return this;
  }

  update(resume: ReportResumeRow[], days: ReportDayPoint[]): void {
    if (!this.el) return;

    const chart = this.el.querySelector<HTMLElement>('[data-resume-chart]');
    const labels = this.el.querySelector<HTMLElement>('[data-resume-labels]');
    if (chart) {
      chart.innerHTML = days
        .map((d, index) => {
          const active = index === days.length - 1;
          const tooltip = t('report.chartTooltip', {
            label: d.label,
            income: formatRupiah(d.income),
            count: d.count,
          });
          return `
            <div class="flex-1 flex flex-col items-center justify-end gap-1 group">
              <span class="text-[9px] font-mono font-bold ${active ? 'text-primary' : 'text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity'}">
                ${formatRupiah(d.income).replace('Rp ', '').replace('IDR ', '')}
              </span>
              <div class="w-full max-w-[36px] rounded-sm ${barClassFor(d.height, active)}" style="height:${d.height}%" title="${escapeHtml(tooltip)}"></div>
            </div>`;
        })
        .join('');
    }
    if (labels) {
      labels.innerHTML = days
        .map((d, index) => {
          const active = index === days.length - 1;
          const cls = active ? 'text-primary font-bold' : 'text-on-surface-variant';
          return `<span class="${cls}">${d.label}</span>`;
        })
        .join('');
    }

    const tbody = this.el.querySelector<HTMLElement>('[data-resume-tbody]');
    if (tbody) {
      const totalIncome = resume.reduce((s, r) => s + r.income, 0);
      if (resume.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="4" class="py-10 text-center text-on-surface-variant font-sans text-xs">
              ${escapeHtml(t('report.emptyResume'))}
            </td>
          </tr>`;
      } else {
        tbody.innerHTML = resume
          .map((r) => {
            const pct = totalIncome > 0 ? Math.round((r.income / totalIncome) * 100) : 0;
            return `
              <tr class="hover:bg-surface-container-high/40 transition-colors">
                <td class="py-2.5 px-3 font-sans font-semibold text-xs text-on-surface">${escapeHtml(r.profile)}</td>
                <td class="py-2.5 px-3 text-center font-mono text-on-surface">${escapeHtml(t('report.voucherCount', { count: r.count }))}</td>
                <td class="py-2.5 px-3 text-right font-mono font-bold text-primary">${formatRupiah(r.income)}</td>
                <td class="py-2.5 px-3 hidden sm:table-cell">
                  <div class="flex items-center gap-2">
                    <div class="h-1.5 flex-1 bg-surface-container-highest rounded-full overflow-hidden">
                      <div class="h-full rounded-full bg-primary/70" style="width:${pct}%"></div>
                    </div>
                    <span class="text-[10px] font-mono text-on-surface-variant w-8 text-right">${pct}%</span>
                  </div>
                </td>
              </tr>`;
          })
          .join('');
      }
    }
  }

  destroy(): void {
    this.el?.remove();
    this.el = null;
  }
}
