import { HotspotCardsComponent } from '@components/hotspot/hotspot-cards.component';
import { HotspotDialogComponent } from '@components/hotspot/hotspot-dialog.component';
import type { HotspotDialogCallbacks } from '@components/hotspot/hotspot-dialog.component';
import { HotspotFiltersComponent } from '@components/hotspot/hotspot-filters.component';
import type {
  HotspotFilterDefinition,
  HotspotFilterKey,
} from '@components/hotspot/hotspot-filters.component';
import { HotspotTableComponent } from '@components/hotspot/hotspot-table.component';
import { HotspotTabsComponent } from '@components/hotspot/hotspot-tabs.component';
import { HotspotToolbarComponent } from '@components/hotspot/hotspot-toolbar.component';
import { PppPaginationComponent } from '@components/ppp/ppp-pagination.component';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog.component';
import { icon } from '@components/ui/icon';
import {
  generateHotspotUsers,
  loadHotspotMockData,
  removeHotspotActiveSession,
  removeHotspotHost,
  removeHotspotProfile,
  removeHotspotUser,
  resetHotspotUserCounters,
  saveHotspotProfile,
  saveHotspotUser,
} from '@mock/hotspot.mock';
import { toast } from '@store/ui.store';
import type {
  HotspotActiveSession,
  HotspotHost,
  HotspotListData,
  HotspotProfile,
  HotspotTabName,
  HotspotUser,
} from '@types';
import { logger } from '@utils/logger';
import type { View } from './base.view';

type HotspotEntry = HotspotUser | HotspotProfile | HotspotActiveSession | HotspotHost;

const PAGE_SIZE = 6;

const LIST_LABEL: Record<HotspotTabName, string> = {
  users: 'Hotspot Users',
  profiles: 'User Profile',
  active: 'Sesi Aktif',
  hosts: 'Hosts',
};

const NOUN: Record<HotspotTabName, string> = {
  users: 'user',
  profiles: 'profile',
  active: 'sesi aktif',
  hosts: 'perangkat',
};

function isUser(entry: HotspotEntry): entry is HotspotUser {
  return 'password' in entry;
}

function isProfile(entry: HotspotEntry): entry is HotspotProfile {
  return 'sharedUsers' in entry;
}

function isActiveSession(entry: HotspotEntry): entry is HotspotActiveSession {
  return 'timeLeft' in entry;
}

function isHost(entry: HotspotEntry): entry is HotspotHost {
  return 'status' in entry;
}

export class HotspotView implements View {
  constructor(initialTab: HotspotTabName = 'users') {
    this.activeTab = initialTab;
  }
  private root: HTMLElement | null = null;
  private listPanel: HTMLElement | null = null;
  private listLabel: HTMLElement | null = null;
  private listCount: HTMLElement | null = null;
  private errorBanner: HTMLElement | null = null;
  private dialog: HotspotDialogComponent | null = null;
  private tabs: HotspotTabsComponent | null = null;
  private toolbar: HotspotToolbarComponent | null = null;
  private filters: HotspotFiltersComponent | null = null;
  private table: HotspotTableComponent | null = null;
  private cards: HotspotCardsComponent | null = null;
  private pagination: PppPaginationComponent | null = null;
  private users: HotspotUser[] = [];
  private profiles: HotspotProfile[] = [];
  private activeSessions: HotspotActiveSession[] = [];
  private hosts: HotspotHost[] = [];
  private activeTab: HotspotTabName = 'users';
  private search = '';
  private profileFilter = '';
  private commentFilter = '';
  private serverFilter = '';
  private hostStatusFilter = '';
  private page = 1;
  private loading = true;
  private error: string | null = null;
  private readonly selectedIds = new Set<string>();

  mount(container: HTMLElement): this {
    const root = document.createElement('section');
    root.className = 'view flex flex-col w-full px-3 pb-8 space-y-2.5';
    container.appendChild(root);
    this.root = root;

    this.dialog = new HotspotDialogComponent({ onSubmit: (data) => this.submitDialog(data) });
    this.dialog.mount();

    const tabs = new HotspotTabsComponent((tab) => this.setTab(tab));
    tabs.mount(root);
    this.tabs = tabs;

    const listPanel = document.createElement('div');
    listPanel.className = 'space-y-2.5';
    root.appendChild(listPanel);
    this.listPanel = listPanel;

    const toolbar = new HotspotToolbarComponent({
      onAddUser: () => this.dialog?.openUser(null, this.profiles, this.servers),
      onAddProfile: () => this.dialog?.openProfile(null),
      onGenerate: () => this.dialog?.openGenerate(this.profiles, this.servers),
      onEdit: () => this.editSelected(),
      onRemove: () => void this.removeRecords([...this.selectedIds]),
      onReset: () => void this.resetUsers([...this.selectedIds]),
      onRefresh: () => void this.refresh(),
      initialSearch: this.search,
      onSearchChange: (value) => this.handleSearch(value),
    });
    toolbar.mount(listPanel);
    this.toolbar = toolbar;

    const filters = new HotspotFiltersComponent((key, value) => this.handleFilter(key, value));
    filters.mount(listPanel);
    this.filters = filters;

    const listHeader = document.createElement('div');
    listHeader.className =
      'flex items-center justify-between px-1 text-[10px] font-semibold tracking-wider text-on-surface-variant uppercase';
    listHeader.innerHTML = `
      <span data-list-label>Hotspot Users</span>
      <span data-list-count class="font-mono normal-case">0 item</span>`;
    listPanel.appendChild(listHeader);
    this.listLabel = listHeader.querySelector<HTMLElement>('[data-list-label]');
    this.listCount = listHeader.querySelector<HTMLElement>('[data-list-count]');

    const table = new HotspotTableComponent({
      onSelect: (id, multi) => this.selectEntry(id, multi),
      onOpen: (id) => this.openEntry(id),
    });
    table.mount(listPanel);
    this.table = table;

    const cards = new HotspotCardsComponent({
      onSelect: (id, multi) => this.selectEntry(id, multi),
      onOpen: (id) => this.openEntry(id),
    });
    cards.mount(listPanel);
    this.cards = cards;

    const pagination = new PppPaginationComponent((page) => {
      this.page = page;
      this.renderList();
    });
    pagination.mount(listPanel);
    this.pagination = pagination;

    const errorBanner = document.createElement('div');
    errorBanner.className =
      'hidden items-start gap-2 p-2.5 rounded-xl bg-error-container/40 ring-1 ring-error/25 text-[11px] text-error';
    errorBanner.setAttribute('role', 'alert');
    errorBanner.innerHTML = `${icon('error', 'text-[16px]')}<span data-error-text></span>`;
    listPanel.appendChild(errorBanner);
    this.errorBanner = errorBanner;

    this.render();
    void this.load();
    return this;
  }

  destroy(): void {
    this.dialog?.destroy();
    this.dialog = null;
    this.root?.remove();
    this.root = null;
    this.listPanel = null;
    this.listLabel = null;
    this.listCount = null;
    this.errorBanner = null;
    this.tabs = null;
    this.toolbar = null;
    this.filters = null;
    this.table = null;
    this.cards = null;
    this.pagination = null;
  }

  private async load(): Promise<boolean> {
    this.loading = true;
    this.error = null;
    this.render();

    try {
      const data = await loadHotspotMockData();
      this.users = data.users;
      this.profiles = data.profiles;
      this.activeSessions = data.activeSessions;
      this.hosts = data.hosts;
      this.loading = false;
      this.pruneSelection();
      this.render();
      return true;
    } catch (error) {
      logger.error('[hotspot] failed to load mock data', error);
      this.loading = false;
      this.error = error instanceof Error ? error.message : 'Data Hotspot gagal dimuat';
      this.render();
      return false;
    }
  }

  private render(): void {
    if (!this.root) return;
    this.renderTabs();
    this.renderToolbar();
    this.renderFilters();
    this.renderList();
    this.renderError();
  }

  private renderTabs(): void {
    this.tabs?.update(this.activeTab, {
      users: this.users.length,
      profiles: this.profiles.length,
      active: this.activeSessions.length,
      hosts: this.hosts.length,
    });
  }

  private renderToolbar(): void {
    this.toolbar?.setState(this.activeTab, this.selectedIds.size, this.loading);
  }

  private renderFilters(): void {
    this.filters?.update(this.filterDefinitions());
  }

  private renderList(): void {
    const { data, total } = this.listData();

    this.table?.setData(data, this.selectedIds, this.loading);
    this.cards?.setData(data, this.selectedIds, this.loading);
    this.pagination?.update(this.page, PAGE_SIZE, total);

    if (this.listLabel) this.listLabel.textContent = LIST_LABEL[this.activeTab];
    if (this.listCount) this.listCount.textContent = this.loading ? 'Memuat...' : `${total} item`;
    this.listPanel?.setAttribute('aria-busy', String(this.loading));
  }

  private renderError(): void {
    if (!this.errorBanner) return;

    const text = this.errorBanner.querySelector<HTMLElement>('[data-error-text]');
    if (text) text.textContent = this.error ?? '';

    this.errorBanner.classList.toggle('hidden', !this.error);
    this.errorBanner.classList.toggle('flex', Boolean(this.error));
  }

  private filterDefinitions(): HotspotFilterDefinition[] {
    if (this.activeTab === 'users') {
      const comments = [...new Set(this.users.map((user) => user.comment).filter(Boolean))].sort();

      return [
        {
          key: 'profile',
          label: 'Filter profile',
          allLabel: 'Semua Profile',
          value: this.profileFilter,
          options: this.profiles.map((profile) => ({
            value: profile.name,
            label: profile.name,
          })),
        },
        {
          key: 'comment',
          label: 'Filter komentar',
          allLabel: 'Semua Komentar',
          value: this.commentFilter,
          options: comments.map((comment) => ({ value: comment, label: comment })),
        },
      ];
    }

    if (this.activeTab === 'active') {
      return [
        {
          key: 'server',
          label: 'Filter server',
          allLabel: 'Semua Server',
          value: this.serverFilter,
          options: this.servers.map((server) => ({ value: server, label: server })),
        },
      ];
    }

    if (this.activeTab === 'hosts') {
      return [
        {
          key: 'server',
          label: 'Filter server',
          allLabel: 'Semua Server',
          value: this.serverFilter,
          options: this.servers.map((server) => ({ value: server, label: server })),
        },
        {
          key: 'host-status',
          label: 'Filter status',
          allLabel: 'Semua Status',
          value: this.hostStatusFilter,
          options: [
            { value: 'authorized', label: 'Authorized' },
            { value: 'bypassed', label: 'Bypassed' },
            { value: 'waiting', label: 'Menunggu' },
          ],
        },
      ];
    }

    return [];
  }

  private listData(): { data: HotspotListData; total: number } {
    const all = this.filteredRows();
    const total = all.length;
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
    this.page = Math.min(Math.max(1, this.page), pageCount);

    const start = (this.page - 1) * PAGE_SIZE;
    const rows = all.slice(start, start + PAGE_SIZE);

    switch (this.activeTab) {
      case 'users':
        return { data: { tab: 'users', rows: rows.filter(isUser) }, total };
      case 'profiles':
        return { data: { tab: 'profiles', rows: rows.filter(isProfile) }, total };
      case 'active':
        return { data: { tab: 'active', rows: rows.filter(isActiveSession) }, total };
      case 'hosts':
        return { data: { tab: 'hosts', rows: rows.filter(isHost) }, total };
    }
  }

  private filteredRows(): HotspotEntry[] {
    const query = this.search.trim().toLowerCase();

    switch (this.activeTab) {
      case 'users':
        return this.users.filter((user) => {
          const matchesQuery =
            !query ||
            [user.name, user.server, user.profile, user.macAddress, user.comment].some((value) =>
              value.toLowerCase().includes(query),
            );

          return (
            matchesQuery &&
            (!this.profileFilter || user.profile === this.profileFilter) &&
            (!this.commentFilter || user.comment === this.commentFilter)
          );
        });
      case 'profiles':
        return this.profiles.filter((profile) =>
          [
            profile.name,
            profile.rateLimit,
            profile.addressPool,
            profile.parentQueue,
            profile.validity,
          ].some((value) => value.toLowerCase().includes(query)),
        );
      case 'active':
        return this.activeSessions.filter((session) => {
          const matchesQuery =
            !query ||
            [
              session.server,
              session.name,
              session.address,
              session.macAddress,
              session.comment,
            ].some((value) => value.toLowerCase().includes(query));

          return matchesQuery && (!this.serverFilter || session.server === this.serverFilter);
        });
      case 'hosts':
        return this.hosts.filter((host) => {
          const matchesQuery =
            !query ||
            [host.macAddress, host.address, host.toAddress, host.server, host.comment].some(
              (value) => value.toLowerCase().includes(query),
            );

          return (
            matchesQuery &&
            (!this.serverFilter || host.server === this.serverFilter) &&
            (!this.hostStatusFilter || host.status === this.hostStatusFilter)
          );
        });
    }
  }

  private get servers(): string[] {
    return [
      ...new Set([
        ...this.users.map((user) => user.server),
        ...this.activeSessions.map((session) => session.server),
        ...this.hosts.map((host) => host.server),
      ]),
    ].sort();
  }

  private setTab(tab: HotspotTabName): void {
    if (tab === this.activeTab) return;

    this.activeTab = tab;
    this.page = 1;
    this.search = '';
    this.profileFilter = '';
    this.commentFilter = '';
    this.serverFilter = '';
    this.hostStatusFilter = '';
    this.selectedIds.clear();
    this.toolbar?.setSearch('');
    this.render();
  }

  private handleSearch(value: string): void {
    this.search = value;
    this.page = 1;
    this.renderList();
  }

  private handleFilter(key: HotspotFilterKey, value: string): void {
    if (key === 'profile') this.profileFilter = value;
    else if (key === 'comment') this.commentFilter = value;
    else if (key === 'server') this.serverFilter = value;
    else this.hostStatusFilter = value;

    this.page = 1;
    this.renderList();
  }

  private selectEntry(id: string, multi: boolean): void {
    if (multi) {
      if (this.selectedIds.has(id)) this.selectedIds.delete(id);
      else this.selectedIds.add(id);
    } else {
      this.selectedIds.clear();
      this.selectedIds.add(id);
    }

    this.table?.setSelected(this.selectedIds);
    this.cards?.setSelected(this.selectedIds);
    this.renderToolbar();
  }

  private openEntry(id: string): void {
    if (this.activeTab === 'users') {
      const user = this.users.find((item) => item.id === id);
      if (user) this.dialog?.openUser(user, this.profiles, this.servers);
    } else if (this.activeTab === 'profiles') {
      const profile = this.profiles.find((item) => item.id === id);
      if (profile) this.dialog?.openProfile(profile);
    }
  }

  private editSelected(): void {
    if (this.selectedIds.size !== 1) return;
    const [id] = this.selectedIds;
    if (id) this.openEntry(id);
  }

  private pruneSelection(): void {
    const ids = new Set<string>([
      ...this.users.map((item) => item.id),
      ...this.profiles.map((item) => item.id),
      ...this.activeSessions.map((item) => item.id),
      ...this.hosts.map((item) => item.id),
    ]);

    for (const id of [...this.selectedIds]) {
      if (!ids.has(id)) this.selectedIds.delete(id);
    }
  }

  private async refresh(): Promise<void> {
    const loaded = await this.load();
    if (loaded) toast('Data Hotspot diperbarui', 'success');
  }

  private async submitDialog(
    data: Parameters<HotspotDialogCallbacks['onSubmit']>[0],
  ): Promise<void> {
    if (data.mode === 'user') {
      const user = await saveHotspotUser(data.values, data.id);
      await this.load();
      toast(
        data.id ? `User '${user.name}' diperbarui` : `User '${user.name}' ditambahkan`,
        'success',
      );
      return;
    }

    if (data.mode === 'profile') {
      const profile = await saveHotspotProfile(data.values, data.id);
      await this.load();
      toast(
        data.id ? `Profile '${profile.name}' diperbarui` : `Profile '${profile.name}' ditambahkan`,
        'success',
      );
      return;
    }

    const users = await generateHotspotUsers(data.values);
    this.activeTab = 'users';
    this.page = 1;
    this.search = '';
    this.profileFilter = '';
    this.commentFilter = '';
    this.serverFilter = '';
    this.hostStatusFilter = '';
    this.selectedIds.clear();
    this.toolbar?.setSearch('');
    await this.load();
    toast(`${users.length} voucher berhasil dibuat`, 'success');
  }

  private async removeRecords(ids: string[]): Promise<void> {
    if (!ids.length) return;

    const noun = NOUN[this.activeTab];
    const isSession = this.activeTab === 'active';
    const action = isSession ? 'diputuskan' : 'dihapus';
    const confirmed = await ConfirmDialogComponent.ask({
      title: isSession ? 'Putuskan sesi?' : `Hapus ${noun}?`,
      message: `${ids.length} ${noun} yang dipilih akan ${action} dari data mock.`,
      confirmLabel: isSession ? 'Putuskan' : 'Hapus',
      tone: 'danger',
    });
    if (!confirmed) return;

    try {
      for (const id of ids) {
        if (this.activeTab === 'users') await removeHotspotUser(id);
        else if (this.activeTab === 'profiles') await removeHotspotProfile(id);
        else if (this.activeTab === 'active') await removeHotspotActiveSession(id);
        else await removeHotspotHost(id);
      }

      this.selectedIds.clear();
      await this.load();
      toast(`${ids.length} ${noun} berhasil ${action}`, 'success');
    } catch (error) {
      logger.error('[hotspot] remove failed', error);
      toast(error instanceof Error ? error.message : `Gagal menghapus ${noun}`, 'error');
      await this.load();
    }
  }

  private async resetUsers(ids: string[]): Promise<void> {
    if (!ids.length) return;

    const confirmed = await ConfirmDialogComponent.ask({
      title: 'Reset counter user?',
      message: `Byte In dan Byte Out dari ${ids.length} user yang dipilih akan direset di data mock.`,
      confirmLabel: 'Reset counter',
      tone: 'primary',
    });
    if (!confirmed) return;

    try {
      for (const id of ids) await resetHotspotUserCounters(id);
      this.selectedIds.clear();
      await this.load();
      toast(`Counter ${ids.length} user direset`, 'success');
    } catch (error) {
      logger.error('[hotspot] reset user counters failed', error);
      toast(error instanceof Error ? error.message : 'Counter user gagal direset', 'error');
    }
  }
}
