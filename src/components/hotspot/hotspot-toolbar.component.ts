import { icon } from '@components/ui/icon';
import type { HotspotTabName, IconName } from '@types';

export interface HotspotToolbarCallbacks {
  onAddUser: () => void;
  onAddProfile: () => void;
  onGenerate: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onReset: () => void;
  onRefresh: () => void;
  initialSearch: string;
  onSearchChange: (value: string) => void;
}

const SEARCH_LABELS: Record<HotspotTabName, string> = {
  users: 'Cari user, server, IP...',
  profiles: 'Cari profile...',
  active: 'Cari sesi aktif...',
  hosts: 'Cari perangkat...',
};

export class HotspotToolbarComponent {
  private actionsEl: HTMLElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private searchButton: HTMLButtonElement | null = null;
  private clearButton: HTMLButtonElement | null = null;
  private refreshButton: HTMLButtonElement | null = null;
  private refreshIcon: HTMLElement | null = null;
  private readonly actionButtons = new Map<string, HTMLButtonElement>();

  constructor(private readonly callbacks: HotspotToolbarCallbacks) {}

  mount(parent: HTMLElement): this {
    const el = document.createElement('div');
    el.className =
      'flex items-center justify-between gap-1 p-1 rounded-xl bg-surface-container/80 backdrop-blur-xl ring-1 ring-outline-variant/20';
    el.innerHTML = `
      <div data-actions class="flex min-w-0 items-center gap-0.5">
        ${this.actionButton('add-user', 'add', 'Tambah user', 'tb-add')}
        ${this.actionButton('generate', 'confirmation_number', 'Generate voucher', 'tb-add')}
        ${this.actionButton('add-profile', 'add', 'Tambah profile', 'tb-add')}
        ${this.actionButton('edit-selected', 'edit', 'Edit data terpilih', '', true)}
        ${this.actionButton('remove-selected', 'remove', 'Hapus data terpilih', 'tb-remove', true)}
        ${this.actionButton('reset', 'restart_alt', 'Reset counter', 'tb-reset', true)}
      </div>
      <div class="flex shrink-0 items-center gap-0.5">
        <div class="flex items-center">
          <input id="hotspot-toolbar-search" data-hotspot-search type="search" aria-label="Cari data Hotspot"
            aria-hidden="true" tabindex="-1" placeholder="Cari..."
            class="toolbar-search-input h-7 bg-surface-container-high/70 rounded-lg text-[11px] text-on-surface placeholder:text-on-surface-variant/60 ring-1 ring-outline-variant/20 focus:ring-primary/50 focus:outline-none transition-all" />
          <button type="button" data-btn="search" aria-expanded="false" aria-controls="hotspot-toolbar-search"
            title="Cari" aria-label="Cari" class="toolbar-btn tb-search">
            ${icon('search', 'text-[16px]')}
          </button>
          <button type="button" data-clear-filter aria-label="Bersihkan pencarian" title="Bersihkan pencarian"
            class="hidden toolbar-btn tb-clear-filter">
            ${icon('cancel', 'text-[14px]')}
          </button>
        </div>
        <button type="button" data-btn="refresh" title="Muat Ulang" aria-label="Muat Ulang" class="toolbar-btn tb-refresh">
          <span data-refresh-icon class="inline-flex">${icon('refresh', 'text-[16px]')}</span>
        </button>
      </div>`;
    parent.appendChild(el);
    this.actionsEl = el.querySelector<HTMLElement>('[data-actions]');
    this.searchInput = el.querySelector<HTMLInputElement>('[data-hotspot-search]');
    this.searchButton = el.querySelector<HTMLButtonElement>('[data-btn="search"]');
    this.clearButton = el.querySelector<HTMLButtonElement>('[data-clear-filter]');
    this.refreshButton = el.querySelector<HTMLButtonElement>('[data-btn="refresh"]');
    this.refreshIcon = el.querySelector<HTMLElement>('[data-refresh-icon]');

    el.querySelectorAll<HTMLButtonElement>('button[data-action]').forEach((button) => {
      const action = button.dataset.action;
      if (action) this.actionButtons.set(action, button);
    });

    this.actionsEl?.addEventListener('click', (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
        'button[data-action]',
      );
      if (!button || button.disabled) return;

      switch (button.dataset.action) {
        case 'add-user':
          this.callbacks.onAddUser();
          break;
        case 'generate':
          this.callbacks.onGenerate();
          break;
        case 'add-profile':
          this.callbacks.onAddProfile();
          break;
        case 'edit-selected':
          this.callbacks.onEdit();
          break;
        case 'remove-selected':
          this.callbacks.onRemove();
          break;
        case 'reset':
          this.callbacks.onReset();
          break;
      }
    });

    this.refreshButton?.addEventListener('click', () => this.callbacks.onRefresh());
    this.bindSearch();

    return this;
  }

  setState(tab: HotspotTabName, selectedCount: number, loading: boolean): void {
    const hasSelection = selectedCount > 0;
    const singleSelection = selectedCount === 1;
    const isUsers = tab === 'users';
    const isProfiles = tab === 'profiles';

    this.show('add-user', isUsers);
    this.show('generate', isUsers);
    this.show('add-profile', isProfiles);
    this.show('edit-selected', isUsers || isProfiles);
    this.show('reset', isUsers);
    this.show('remove-selected', true);

    this.enable('edit-selected', singleSelection && (isUsers || isProfiles));
    this.enable('remove-selected', hasSelection);
    this.enable('reset', hasSelection);

    const remove = this.actionButtons.get('remove-selected');
    if (remove) {
      const label =
        tab === 'active'
          ? 'Putuskan sesi'
          : tab === 'hosts'
            ? 'Hapus perangkat'
            : tab === 'profiles'
              ? 'Hapus profile'
              : 'Hapus user';
      const iconName: IconName = tab === 'active' ? 'link_off' : 'remove';

      remove.title = label;
      remove.setAttribute('aria-label', label);

      if (remove.dataset.icon !== iconName) {
        remove.innerHTML = icon(iconName, 'text-[16px]');
        remove.dataset.icon = iconName;
      }
    }

    const searchLabel = SEARCH_LABELS[tab];
    if (this.searchInput) {
      this.searchInput.placeholder = searchLabel;
      this.searchInput.setAttribute('aria-label', searchLabel);
    }
    if (this.searchButton) {
      this.searchButton.title = searchLabel;
      this.searchButton.setAttribute('aria-label', searchLabel);
    }

    if (this.refreshButton) {
      this.refreshButton.disabled = loading;
      this.refreshButton.setAttribute('aria-busy', String(loading));
    }
    this.refreshIcon?.classList.toggle('animate-spin', loading);
  }

  setSearch(value: string): void {
    if (!this.searchInput) return;

    this.searchInput.value = value;
    this.clearButton?.classList.toggle('hidden', value.length === 0);
    this.setSearchOpen(value.length > 0);
  }

  private actionButton(
    action: string,
    iconName: IconName,
    label: string,
    className: string,
    disabled = false,
  ): string {
    return `<button type="button" data-action="${action}" data-icon="${iconName}" class="toolbar-btn ${className}" title="${label}" aria-label="${label}" ${disabled ? 'disabled' : ''}>${icon(iconName, 'text-[16px]')}</button>`;
  }

  private bindSearch(): void {
    const searchInput = this.searchInput;
    const searchButton = this.searchButton;
    const clearButton = this.clearButton;
    if (!searchInput || !searchButton || !clearButton) return;

    searchInput.value = this.callbacks.initialSearch;
    clearButton.classList.toggle('hidden', searchInput.value.length === 0);
    this.setSearchOpen(searchInput.value.length > 0);

    searchButton.addEventListener('click', () => {
      const shouldOpen = searchInput.getAttribute('aria-hidden') === 'true';
      this.setSearchOpen(shouldOpen);
      if (shouldOpen) searchInput.focus();
    });

    searchInput.addEventListener('input', () => {
      clearButton.classList.toggle('hidden', searchInput.value.length === 0);
      this.callbacks.onSearchChange(searchInput.value);
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
      this.callbacks.onSearchChange('');
      searchInput.focus();
    });
  }

  private setSearchOpen(open: boolean): void {
    if (!this.searchInput || !this.searchButton) return;

    this.searchInput.classList.toggle('is-open', open);
    this.searchInput.setAttribute('aria-hidden', String(!open));
    this.searchInput.tabIndex = open ? 0 : -1;
    this.searchButton.setAttribute('aria-expanded', String(open));
  }

  private show(action: string, visible: boolean): void {
    this.actionButtons.get(action)?.classList.toggle('hidden', !visible);
  }

  private enable(action: string, enabled: boolean): void {
    const button = this.actionButtons.get(action);
    if (button) button.disabled = !enabled;
  }
}
