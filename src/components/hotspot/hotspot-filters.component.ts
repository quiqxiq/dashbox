import { icon } from '@components/ui/icon';
import { t } from '@i18n/translate';
import { escapeHtml } from '@utils/format';

export type HotspotFilterKey = 'profile' | 'comment' | 'server' | 'host-status';

export interface HotspotFilterOption {
  value: string;
  label: string;
}

export interface HotspotFilterDefinition {
  key: HotspotFilterKey;
  label: string;
  allLabel: string;
  value: string;
  options: HotspotFilterOption[];
}

export class HotspotFiltersComponent {
  private el: HTMLElement | null = null;

  constructor(private readonly onChange: (key: HotspotFilterKey, value: string) => void) {}

  mount(parent: HTMLElement): this {
    const el = document.createElement('div');
    el.className = 'hidden flex-wrap items-center gap-1.5 px-0.5';
    parent.appendChild(el);
    this.el = el;

    el.addEventListener('change', (event) => {
      const select = (event.target as HTMLElement).closest<HTMLSelectElement>(
        'select[data-filter-key]',
      );
      const key = select?.dataset.filterKey as HotspotFilterKey | undefined;
      if (select && key) this.onChange(key, select.value);
    });

    return this;
  }

  update(filters: HotspotFilterDefinition[]): void {
    if (!this.el) return;

    const hasFilters = filters.length > 0;
    this.el.classList.toggle('hidden', !hasFilters);
    this.el.classList.toggle('flex', hasFilters);

    if (!hasFilters) {
      this.el.innerHTML = '';
      return;
    }

    this.el.innerHTML = `
      <span class="inline-flex items-center gap-1 px-0.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
        ${icon('filter_list', 'text-[13px]')}
        <span class="hidden sm:inline">${escapeHtml(t('common.filter'))}</span>
      </span>
      ${filters
        .map(
          (filter) => `
            <label class="sr-only" for="hotspot-filter-${filter.key}">${escapeHtml(filter.label)}</label>
            <select id="hotspot-filter-${filter.key}" data-filter-key="${filter.key}"
              title="${escapeHtml(filter.label)}" aria-label="${escapeHtml(filter.label)}"
              class="h-7 max-w-[10.5rem] rounded-lg bg-surface-container/60 px-2 text-[10px] font-medium text-on-surface-variant ring-1 ring-outline-variant/20 focus:outline-none focus:ring-primary/50">
              <option value="">${escapeHtml(filter.allLabel)}</option>
              ${filter.options
                .map(
                  (option) =>
                    `<option value="${escapeHtml(option.value)}" ${option.value === filter.value ? 'selected' : ''}>${escapeHtml(option.label)}</option>`,
                )
                .join('')}
            </select>`,
        )
        .join('')}`;
  }
}
