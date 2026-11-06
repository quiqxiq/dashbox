import type { IconName, PppTabName } from '@types';
import type { TranslationKey } from '@i18n/translate';
import { t } from '@i18n/translate';
import { escapeHtml } from '@utils/format';
import { icon } from '@components/ui/icon';

interface PppTabDefinition {
  tab: PppTabName;
  labelKey: TranslationKey;
  icon: IconName;
  badge?: string;
}

const TABS: readonly PppTabDefinition[] = [
  { tab: 'interface', labelKey: 'ppp.interface', icon: 'lan', badge: '8' },
  { tab: 'servers', labelKey: 'ppp.servers', icon: 'dns', badge: '2' },
  { tab: 'secrets', labelKey: 'ppp.secrets', icon: 'key', badge: '48' },
  { tab: 'profiles', labelKey: 'ppp.profiles', icon: 'badge', badge: '7' },
  { tab: 'active', labelKey: 'ppp.active', icon: 'bolt', badge: '32' },
];

export class PppTabsComponent {
  private el: HTMLElement | null = null;

  constructor(private readonly onSelect: (tab: PppTabName) => void) {}

  mount(parent: HTMLElement): this {
    const el = document.createElement('div');
    el.className = 'w-full overflow-x-auto no-scrollbar pt-1';
    el.innerHTML = `
      <div class="flex items-center gap-1.5 p-1 rounded-xl bg-surface-container/60 backdrop-blur-md ring-1 ring-outline-variant/20 min-w-max" role="tablist" aria-label="Tab PPP Suite">
        ${TABS.map(
          (tab) => `
            <button type="button" data-tab="${tab.tab}" role="tab" aria-selected="false"
              class="ppp-tab px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/40 transition-colors flex items-center gap-1.5 shrink-0">
              ${icon(tab.icon, 'text-[15px]')}
              <span>${escapeHtml(t(tab.labelKey))}</span>
              ${
                tab.badge
                  ? `<span data-badge class="px-1.5 rounded-full bg-surface-container-highest text-[10px] font-mono">${escapeHtml(tab.badge)}</span>`
                  : ''
              }
            </button>`,
        ).join('')}
      </div>`;
    parent.appendChild(el);
    this.el = el;

    el.addEventListener('click', (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-tab]');
      const tab = button?.dataset.tab as PppTabName | undefined;
      if (tab) this.onSelect(tab);
    });

    return this;
  }

  setActive(activeTab: PppTabName): void {
    if (!this.el) return;

    this.el.querySelectorAll<HTMLButtonElement>('button[data-tab]').forEach((button) => {
      const active = button.dataset.tab === activeTab;
      button.setAttribute('aria-selected', String(active));

      button.classList.toggle('bg-primary/15', active);
      button.classList.toggle('text-primary', active);
      button.classList.toggle('font-semibold', active);
      button.classList.toggle('shadow-[0_0_12px_rgba(125,211,252,0.18)]', active);
      button.classList.toggle('text-on-surface-variant', !active);
      button.classList.toggle('font-medium', !active);

      const badge = button.querySelector<HTMLElement>('[data-badge]');
      if (badge) {
        badge.classList.toggle('bg-primary/20', active);
        badge.classList.toggle('text-primary', active);
        badge.classList.toggle('font-bold', active);
        badge.classList.toggle('bg-surface-container-highest', !active);
        badge.classList.toggle('text-on-surface-variant', !active);
      }
    });
  }
}
