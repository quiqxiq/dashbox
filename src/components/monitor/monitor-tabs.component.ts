import { icon } from '@components/ui/icon';
import type { TranslationKey } from '@i18n/translate';
import { t } from '@i18n/translate';
import type { IconName, MonitorSection } from '@types';
import { escapeHtml } from '@utils/format';

interface MonitorTabDefinition {
  section: MonitorSection;
  labelKey: TranslationKey;
  icon: IconName;
}

const TABS: readonly MonitorTabDefinition[] = [
  { section: 'logs', labelKey: 'monitor.logs', icon: 'terminal' },
  { section: 'traffic', labelKey: 'monitor.traffic', icon: 'swap_calls' },
  { section: 'firewall', labelKey: 'monitor.firewall', icon: 'security' },
  { section: 'queues', labelKey: 'monitor.queues', icon: 'speed' },
];

export class MonitorTabsComponent {
  private el: HTMLElement | null = null;

  constructor(private readonly onSelect: (section: MonitorSection) => void) {}

  mount(parent: HTMLElement): this {
    const el = document.createElement('div');
    el.className = 'w-full overflow-x-auto no-scrollbar pt-1';
    el.innerHTML = `
      <div class="flex items-center gap-1.5 p-1 rounded-xl bg-surface-container/60 backdrop-blur-md ring-1 ring-outline-variant/20 min-w-max" role="tablist" aria-label="${escapeHtml(t('monitor.tabAria'))}">
        ${TABS.map(
          (tab) => `
            <button type="button" data-section="${tab.section}" role="tab" aria-selected="false"
              class="px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/40 transition-colors flex items-center gap-1.5 shrink-0">
              ${icon(tab.icon, 'text-[15px]')}
              <span>${escapeHtml(t(tab.labelKey))}</span>
              <span data-badge class="px-1.5 rounded-full bg-surface-container-highest text-[10px] font-mono">0</span>
            </button>`,
        ).join('')}
      </div>`;
    parent.appendChild(el);
    this.el = el;

    el.addEventListener('click', (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
        'button[data-section]',
      );
      const section = button?.dataset.section as MonitorSection | undefined;
      if (section) this.onSelect(section);
    });

    return this;
  }

  update(activeSection: MonitorSection, counts: Record<MonitorSection, number>): void {
    if (!this.el) return;

    this.el.querySelectorAll<HTMLButtonElement>('button[data-section]').forEach((button) => {
      const section = button.dataset.section as MonitorSection | undefined;
      if (!section) return;

      const active = section === activeSection;
      button.setAttribute('aria-selected', String(active));

      button.classList.toggle('bg-primary/15', active);
      button.classList.toggle('text-primary', active);
      button.classList.toggle('font-semibold', active);
      button.classList.toggle('shadow-[0_0_12px_rgba(125,211,252,0.18)]', active);
      button.classList.toggle('text-on-surface-variant', !active);
      button.classList.toggle('font-medium', !active);

      const badge = button.querySelector<HTMLElement>('[data-badge]');
      if (badge) {
        badge.textContent = String(counts[section]);
        badge.classList.toggle('bg-primary/20', active);
        badge.classList.toggle('bg-surface-container-highest', !active);
      }
    });
  }

  destroy(): void {
    this.el?.remove();
    this.el = null;
  }
}
