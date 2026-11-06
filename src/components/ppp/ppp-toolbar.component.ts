import { icon } from '@components/ui/icon';
import { t } from '@i18n/translate';

export interface PppToolbarCallbacks {
  onAdd: () => void;
  onRemove: () => void;
  onEnable: () => void;
  onDisable: () => void;
  onComment: () => void;
  onReset: () => void;
  onRefresh: () => void;
  initialFilter: string;
  onFilterChange: (filter: string) => void;
}

export class PppToolbarComponent {
  private el: HTMLElement | null = null;
  private readonly buttons = new Map<string, HTMLButtonElement>();

  constructor(private readonly callbacks: PppToolbarCallbacks) {}

  mount(parent: HTMLElement): this {
    const el = document.createElement('div');
    el.className =
      'ppp-toolbar flex items-center justify-between gap-1 p-1 rounded-xl bg-surface-container/80 backdrop-blur-xl ring-1 ring-outline-variant/20';
    el.innerHTML = `
      <div class="flex items-center gap-0.5">
        <button type="button" data-btn="add" title="${escapeAttr(t('ppp.toolbarAdd'))}" aria-label="${escapeAttr(t('ppp.toolbarAdd'))}" class="toolbar-btn tb-add">
          ${icon('add', 'text-[16px]')}
        </button>
        <button type="button" data-btn="remove" class="toolbar-btn tb-remove" disabled title="${escapeAttr(t('ppp.toolbarRemove'))}" aria-label="${escapeAttr(t('ppp.toolbarRemove'))}">
          ${icon('remove', 'text-[16px]')}
        </button>
        <button type="button" data-btn="enable" class="toolbar-btn tb-enable" disabled title="${escapeAttr(t('ppp.toolbarEnable'))}" aria-label="${escapeAttr(t('ppp.toolbarEnable'))}">
          ${icon('check', 'text-[16px]')}
        </button>
        <button type="button" data-btn="disable" class="toolbar-btn tb-disable" disabled title="${escapeAttr(t('ppp.toolbarDisable'))}" aria-label="${escapeAttr(t('ppp.toolbarDisable'))}">
          ${icon('close', 'text-[16px]')}
        </button>
        <button type="button" data-btn="comment" class="toolbar-btn tb-comment" disabled title="${escapeAttr(t('ppp.toolbarComment'))}" aria-label="${escapeAttr(t('ppp.toolbarComment'))}">
          ${icon('chat_bubble', 'text-[15px]')}
        </button>
        <button type="button" data-btn="reset" class="toolbar-btn tb-reset" disabled title="${escapeAttr(t('ppp.toolbarReset'))}" aria-label="${escapeAttr(t('ppp.toolbarReset'))}">
          ${icon('restart_alt', 'text-[16px]')}
        </button>
      </div>
      <div class="flex items-center gap-0.5">
        <div data-ppp-search-control class="flex items-center">
          <input id="ppp-toolbar-search" data-ppp-search type="text" aria-label="${escapeAttr(t('ppp.toolbarSearch'))}"
            aria-hidden="true" tabindex="-1" placeholder="${escapeAttr(t('ppp.searchPlaceholder'))}"
            class="toolbar-search-input h-7 bg-surface-container-high/70 rounded-lg text-[11px] text-on-surface placeholder:text-on-surface-variant/60 ring-1 ring-outline-variant/20 focus:ring-primary/50 focus:outline-none transition-all" />
          <button type="button" data-btn="search" aria-expanded="false" aria-controls="ppp-toolbar-search"
            title="${escapeAttr(t('ppp.toolbarSearch'))}" aria-label="${escapeAttr(t('ppp.toolbarSearch'))}" class="toolbar-btn tb-search">
            ${icon('search', 'text-[16px]')}
          </button>
          <button type="button" data-clear-filter aria-label="${escapeAttr(t('ppp.toolbarClear'))}" title="${escapeAttr(t('ppp.toolbarClear'))}"
            class="hidden toolbar-btn tb-clear-filter">
            ${icon('cancel', 'text-[14px]')}
          </button>
        </div>
        <button type="button" data-btn="refresh" title="${escapeAttr(t('ppp.toolbarRefresh'))}" aria-label="${escapeAttr(t('ppp.toolbarRefresh'))}" class="toolbar-btn tb-refresh">
          <span data-refresh-icon class="inline-flex">${icon('refresh', 'text-[16px]')}</span>
        </button>
      </div>`;
    parent.appendChild(el);
    this.el = el;

    el.querySelectorAll<HTMLButtonElement>('button[data-btn]').forEach((button) => {
      const key = button.dataset.btn;
      if (key) this.buttons.set(key, button);
    });

    this.bind('add', this.callbacks.onAdd);
    this.bind('remove', this.callbacks.onRemove);
    this.bind('enable', this.callbacks.onEnable);
    this.bind('disable', this.callbacks.onDisable);
    this.bind('comment', this.callbacks.onComment);
    this.bind('reset', this.callbacks.onReset);
    this.bind('refresh', this.callbacks.onRefresh);

    const searchButton = this.buttons.get('search');
    const searchInput = el.querySelector<HTMLInputElement>('[data-ppp-search]');
    const clearButton = el.querySelector<HTMLButtonElement>('[data-clear-filter]');
    if (searchButton && searchInput && clearButton) {
      searchInput.value = this.callbacks.initialFilter;
      clearButton.classList.toggle('hidden', searchInput.value.length === 0);
      this.setSearchOpen(searchInput.value.length > 0);

      searchButton.addEventListener('click', () => {
        const shouldOpen = searchInput.getAttribute('aria-hidden') === 'true';
        this.setSearchOpen(shouldOpen);
        if (shouldOpen) searchInput.focus();
      });

      searchInput.addEventListener('input', () => {
        clearButton.classList.toggle('hidden', searchInput.value.length === 0);
        this.callbacks.onFilterChange(searchInput.value);
      });

      searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && searchInput.value.length === 0) {
          this.setSearchOpen(false);
          searchButton.focus();
        }
      });

      clearButton.addEventListener('click', () => {
        searchInput.value = '';
        clearButton.classList.add('hidden');
        this.callbacks.onFilterChange('');
        searchInput.focus();
      });
    }

    return this;
  }

  setEnabled(hasSelection: boolean, isDisabled: boolean): void {
    this.setButtonEnabled('remove', hasSelection);
    this.setButtonEnabled('comment', hasSelection);
    this.setButtonEnabled('reset', hasSelection);
    this.setButtonEnabled('enable', hasSelection && isDisabled);
    this.setButtonEnabled('disable', hasSelection && !isDisabled);
  }

  setLoading(loading: boolean): void {
    const refresh = this.buttons.get('refresh');
    const iconEl = this.el?.querySelector<HTMLElement>('[data-refresh-icon]');

    if (refresh) {
      refresh.disabled = loading;
      refresh.setAttribute('aria-busy', String(loading));
    }

    iconEl?.classList.toggle('animate-spin', loading);
  }

  private bind(key: string, callback: () => void): void {
    this.buttons.get(key)?.addEventListener('click', callback);
  }

  private setButtonEnabled(key: string, enabled: boolean): void {
    const button = this.buttons.get(key);
    if (button) button.disabled = !enabled;
  }

  private setSearchOpen(open: boolean): void {
    const searchInput = this.el?.querySelector<HTMLInputElement>('[data-ppp-search]');
    const searchButton = this.buttons.get('search');
    if (!searchInput || !searchButton) return;

    searchInput.classList.toggle('is-open', open);
    searchInput.setAttribute('aria-hidden', String(!open));
    searchInput.tabIndex = open ? 0 : -1;
    searchButton.setAttribute('aria-expanded', String(open));
  }
}

function escapeAttr(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
}
