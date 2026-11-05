import { PppTabsComponent } from '@components/ppp/ppp-tabs.component';
import { PppToolbarComponent } from '@components/ppp/ppp-toolbar.component';
import { PppTableComponent } from '@components/ppp/ppp-table.component';
import { PppCardsComponent } from '@components/ppp/ppp-cards.component';
import { PppPaginationComponent } from '@components/ppp/ppp-pagination.component';
import type { PppInspectorModal } from '@components/ppp/ppp-inspector.modal';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog.component';
import { icon } from '@components/ui/icon';
import type { PppStoreApi } from '@store/ppp.store';
import { toast } from '@store/ui.store';
import type { ViewRouter } from '@router/view-router';
import type { IconName, PppSecret, PppTabName } from '@types';
import { debounce } from '@utils/debounce';
import { escapeHtml } from '@utils/format';
import { logger } from '@utils/logger';
import type { View } from './base.view';

const OTHER_TAB_META: Record<
  Exclude<PppTabName, 'secrets' | 'active'>,
  { icon: IconName; title: string; body: string }
> = {
  interface: {
    icon: 'lan',
    title: 'Interface',
    body: 'Daftar interface PPP, status link, dan negosiasi LCP akan ditampilkan di panel ini.',
  },
  servers: {
    icon: 'dns',
    title: 'PPPoE Servers',
    body: 'Konfigurasi PPPoE server, service name, dan binding interface mengikuti pola tab Secrets.',
  },
  profiles: {
    icon: 'badge',
    title: 'Profiles',
    body: 'Profil rate limit, address pool, dan timeout siap dikelola dengan tabel serta inspector yang sama.',
  },
};

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Terjadi kesalahan pada data PPP';
}

export class PppSuiteView implements View {
  private root: HTMLElement | null = null;
  private listPanel: HTMLElement | null = null;
  private otherPanel: HTMLElement | null = null;
  private errorBanner: HTMLElement | null = null;
  private unsubscribe: (() => void) | null = null;
  private readonly onDocumentClick = (event: MouseEvent): void => {
    if (!this.root || this.router.current !== 'ppp') return;

    const target = event.target as HTMLElement;
    if (
      target.closest('.row-item') ||
      target.closest('[data-btn]') ||
      target.closest('[data-ppp-search-control]') ||
      target.closest('[data-inspector-dialog]') ||
      target.closest('[data-confirm-dialog]')
    ) {
      return;
    }

    this.ppp.select(null);
  };

  constructor(
    private readonly ppp: PppStoreApi,
    private readonly router: ViewRouter,
    private readonly inspector: PppInspectorModal,
  ) {}

  mount(container: HTMLElement): this {
    const root = document.createElement('section');
    root.className = 'view flex flex-col w-full px-3 pb-8 space-y-2.5';
    container.appendChild(root);
    this.root = root;

    const tabs = new PppTabsComponent((tab) => {
      void this.ppp.setTab(tab);
    });
    tabs.mount(root);

    const listPanel = document.createElement('div');
    listPanel.className = 'space-y-2.5';
    root.appendChild(listPanel);
    this.listPanel = listPanel;

    const toolbar = new PppToolbarComponent({
      onAdd: () => this.inspector.open(null, { tab: 'general', focus: 'name' }),
      onRemove: () => void this.removeSelected(),
      onEnable: () => void this.enableSelected(),
      onDisable: () => void this.disableSelected(),
      onComment: () => this.openCommentEditor(),
      onReset: () => void this.resetCounters(),
      onRefresh: () => void this.refresh(),
      initialFilter: this.ppp.store.getState().filter,
      onFilterChange: debounce((filter: string) => {
        void this.ppp.setFilter(filter);
      }, 180),
    });
    toolbar.mount(listPanel);

    const listHeader = document.createElement('div');
    listHeader.className =
      'flex items-center justify-between px-1 text-[10px] font-semibold tracking-wider text-on-surface-variant uppercase';
    listHeader.innerHTML = `
      <span data-list-label>Secret &amp; Binding</span>
      <span data-list-count class="font-mono normal-case">0 item</span>`;
    listPanel.appendChild(listHeader);

    const table = new PppTableComponent({
      onSelect: (id) => this.ppp.select(id),
      onOpenInspector: (id) => this.openInspector(id),
    });
    table.mount(listPanel);

    const cards = new PppCardsComponent({
      onSelect: (id) => this.ppp.select(id),
      onOpenInspector: (id) => this.openInspector(id),
    });
    cards.mount(listPanel);

    const pagination = new PppPaginationComponent((page) => {
      void this.ppp.setPage(page);
    });
    pagination.mount(listPanel);

    const errorBanner = document.createElement('div');
    errorBanner.className =
      'hidden items-start gap-2 p-2.5 rounded-xl bg-error-container/40 ring-1 ring-error/25 text-[11px] text-error';
    errorBanner.setAttribute('role', 'alert');
    errorBanner.innerHTML = `${icon('error', 'text-[16px]')}<span data-error-text></span>`;
    listPanel.appendChild(errorBanner);
    this.errorBanner = errorBanner;

    const otherPanel = document.createElement('div');
    otherPanel.className = 'flex flex-col gap-2';
    otherPanel.style.display = 'none';
    root.appendChild(otherPanel);
    this.otherPanel = otherPanel;

    this.unsubscribe = this.ppp.store.subscribe((state) => {
      tabs.setActive(state.tab);

      const selected = state.secrets.find((secret) => secret.id === state.selectedId) ?? null;
      toolbar.setEnabled(state.selectedId !== null, selected?.status === 'disabled');
      toolbar.setLoading(state.loading);

      table.setData(state.secrets, state.selectedId);
      cards.setData(state.secrets, state.selectedId);
      pagination.update(state.page, state.pageSize, state.total);

      const label = this.listPanel?.querySelector<HTMLElement>('[data-list-label]');
      const count = this.listPanel?.querySelector<HTMLElement>('[data-list-count]');
      if (label) label.textContent = state.tab === 'active' ? 'Sesi Aktif' : 'Secret & Binding';
      if (count) count.textContent = `${state.total} item`;

      const isList = state.tab === 'secrets' || state.tab === 'active';
      if (this.listPanel) {
        this.listPanel.style.display = isList ? '' : 'none';
        this.listPanel.setAttribute('aria-busy', String(state.loading));
      }

      if (this.otherPanel) {
        this.otherPanel.style.display = isList ? 'none' : 'flex';
        if (!isList) this.renderOtherTab(state.tab);
      }

      this.renderError(state.error);
    });

    const requestedTab = this.router.currentParams.tab;
    if (requestedTab) void this.ppp.setTab(requestedTab);
    else void this.ppp.load();

    document.addEventListener('click', this.onDocumentClick);

    return this;
  }

  destroy(): void {
    document.removeEventListener('click', this.onDocumentClick);
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.inspector.close();
    this.root?.remove();
    this.root = null;
    this.listPanel = null;
    this.otherPanel = null;
    this.errorBanner = null;
  }

  private openInspector(id: number): void {
    const secret = this.ppp.store.getState().secrets.find((item) => item.id === id);
    if (secret) this.inspector.open(secret);
  }

  private openCommentEditor(): void {
    const state = this.ppp.store.getState();
    const selected = state.secrets.find((secret) => secret.id === state.selectedId);
    if (selected) this.inspector.open(selected, { focus: 'comment' });
  }

  private async removeSelected(): Promise<void> {
    const selected = this.selectedSecret();
    if (!selected) return;

    const confirmed = await ConfirmDialogComponent.ask({
      title: 'Hapus PPP Secret?',
      message: `Secret "${selected.name}" akan dihapus dari router. Tindakan ini tidak dapat dibatalkan.`,
      confirmLabel: 'Hapus',
      tone: 'danger',
    });
    if (!confirmed) return;

    try {
      const removed = await this.ppp.removeSelected();
      if (removed) toast(`Secret '${removed.name}' dihapus`);
    } catch (error) {
      logger.error('[ppp-suite] remove failed', error);
      toast(messageOf(error), 'error');
    }
  }

  private async enableSelected(): Promise<void> {
    const selected = this.selectedSecret();
    if (!selected) return;

    try {
      const updated = await this.ppp.enableSelected();
      if (updated) toast(`'${updated.name}' di-enable`);
    } catch (error) {
      logger.error('[ppp-suite] enable failed', error);
      toast(messageOf(error), 'error');
    }
  }

  private async disableSelected(): Promise<void> {
    const selected = this.selectedSecret();
    if (!selected) return;

    try {
      const updated = await this.ppp.disableSelected();
      if (updated) toast(`'${updated.name}' di-disable`);
    } catch (error) {
      logger.error('[ppp-suite] disable failed', error);
      toast(messageOf(error), 'error');
    }
  }

  private async resetCounters(): Promise<void> {
    const selected = this.selectedSecret();
    if (!selected) return;

    const confirmed = await ConfirmDialogComponent.ask({
      title: 'Reset counters?',
      message: `Counter Bytes In dan Bytes Out untuk "${selected.name}" akan dikembalikan ke nol.`,
      confirmLabel: 'Reset',
      tone: 'primary',
    });
    if (!confirmed) return;

    try {
      const reset = await this.ppp.resetSelectedCounters();
      if (reset) toast(`Counter '${reset.name}' direset`);
    } catch (error) {
      logger.error('[ppp-suite] reset counters failed', error);
      toast(messageOf(error), 'error');
    }
  }

  private async refresh(): Promise<void> {
    try {
      await this.ppp.refresh();
      toast('Cache PPP Secrets diperbarui');
    } catch (error) {
      logger.error('[ppp-suite] refresh failed', error);
      toast(messageOf(error), 'error');
    }
  }

  private selectedSecret(): PppSecret | null {
    const state = this.ppp.store.getState();
    if (state.selectedId === null) return null;
    return state.secrets.find((secret) => secret.id === state.selectedId) ?? null;
  }

  private renderOtherTab(tab: PppTabName): void {
    if (!this.otherPanel || tab === 'secrets' || tab === 'active') return;

    const meta = OTHER_TAB_META[tab];
    this.otherPanel.innerHTML = `
      <div class="p-6 rounded-2xl bg-surface-container/50 backdrop-blur-xl ring-1 ring-outline-variant/25 text-center">
        <div class="w-12 h-12 rounded-2xl bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center mx-auto">
          ${icon(meta.icon, 'text-[24px] text-primary/80')}
        </div>
        <h3 class="mt-3 text-sm font-bold text-on-surface font-headline">${escapeHtml(meta.title)}</h3>
        <p class="text-[11px] text-on-surface-variant mt-1 max-w-[280px] mx-auto leading-relaxed">${escapeHtml(meta.body)}</p>
        <span class="inline-flex mt-3 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[9px] font-bold uppercase tracking-wider">Pratinjau</span>
      </div>`;
  }

  private renderError(error: string | null): void {
    if (!this.errorBanner) return;

    const text = this.errorBanner.querySelector<HTMLElement>('[data-error-text]');
    if (text) text.textContent = error ?? '';

    this.errorBanner.classList.toggle('hidden', !error);
    this.errorBanner.classList.toggle('flex', Boolean(error));
  }
}
