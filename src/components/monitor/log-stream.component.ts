import { icon } from '@components/ui/icon';
import { createMockSystemLog, createMockSystemLogHistory } from '@mock/system-logs.mock';
import type { SystemLogEntry, SystemLogLevel } from '@mock/system-logs.mock';
import { toast } from '@store/ui.store';
import { escapeHtml } from '@utils/format';

const MAX_LOG_ENTRIES = 250;
const LOG_STREAM_INTERVAL_MS = 1_500;

const LEVEL_STYLES: Record<
  SystemLogLevel,
  { label: string; className: string; badgeClass: string }
> = {
  info: {
    label: 'INFO',
    className: 'system-log-level-info',
    badgeClass: 'bg-primary/10 text-primary border-primary/20',
  },
  warning: {
    label: 'WARN',
    className: 'system-log-level-warning',
    badgeClass: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  },
  error: {
    label: 'ERROR',
    className: 'system-log-level-error',
    badgeClass: 'bg-error/10 text-error border-error/20',
  },
  debug: {
    label: 'DEBUG',
    className: 'system-log-level-debug',
    badgeClass: 'bg-outline-variant/30 text-on-surface-variant border-outline-variant/40',
  },
};

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

function renderLogEntry(entry: SystemLogEntry): string {
  const level = LEVEL_STYLES[entry.level];
  return `
    <article class="system-log-entry py-1 px-2 rounded hover:bg-surface-container-high/40 transition-colors flex items-start gap-2 text-xs font-mono" data-log-id="${entry.id}" data-log-level="${entry.level}">
      <time class="system-log-time text-on-surface-variant/70 shrink-0 text-[11px]" datetime="${entry.timestamp.toISOString()}">${formatTime(entry.timestamp)}</time>
      <span class="system-log-level px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border shrink-0 ${level.badgeClass}">${level.label}</span>
      <span class="system-log-topics text-secondary font-semibold shrink-0 text-[11px]">${escapeHtml(entry.topics)}</span>
      <p class="system-log-message text-on-surface text-[11px] break-all flex-1">${escapeHtml(entry.message)}</p>
    </article>`;
}

export class LogStreamComponent {
  private el: HTMLElement | null = null;
  private scrollPanel: HTMLElement | null = null;
  private logList: HTMLElement | null = null;
  private streamTimer: number | null = null;
  private nextLogId = 1;
  private followingLatest = true;
  private paused = false;
  private unreadCount = 0;
  private entries: SystemLogEntry[] = [];
  private activeLevelFilter: 'all' | SystemLogLevel = 'all';
  private activeTopicFilter = 'all';
  private searchQuery = '';

  mount(parent: HTMLElement): this {
    const el = document.createElement('div');
    el.className = 'flex flex-col gap-3 w-full';
    el.innerHTML = `
      <!-- Filter Toolbar -->
      <div class="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-surface-container/80 backdrop-blur-xl ring-1 ring-outline-variant/20 flex-wrap">
        <div class="flex items-center gap-1.5 flex-wrap">
          <!-- Level Filters -->
          <div class="flex items-center gap-1 p-0.5 rounded-lg bg-surface-container-high/60 border border-outline-variant/20 text-xs">
            <button type="button" data-level-filter="all"
              class="px-2 py-1 rounded-md font-semibold bg-primary/15 text-primary transition-colors text-[11px]">
              Semua
            </button>
            <button type="button" data-level-filter="info"
              class="px-2 py-1 rounded-md text-on-surface-variant hover:text-on-surface transition-colors text-[11px]">
              Info
            </button>
            <button type="button" data-level-filter="warning"
              class="px-2 py-1 rounded-md text-on-surface-variant hover:text-on-surface transition-colors text-[11px]">
              Warn
            </button>
            <button type="button" data-level-filter="error"
              class="px-2 py-1 rounded-md text-on-surface-variant hover:text-on-surface transition-colors text-[11px]">
              Error
            </button>
            <button type="button" data-level-filter="debug"
              class="px-2 py-1 rounded-md text-on-surface-variant hover:text-on-surface transition-colors text-[11px]">
              Debug
            </button>
          </div>

          <!-- Topic Filter Dropdown -->
          <select data-topic-filter aria-label="Filter topik log"
            class="h-7.5 px-2 rounded-lg bg-surface-container-high/70 text-xs text-on-surface border border-outline-variant/20 focus:outline-none">
            <option value="all">Semua Topik</option>
            <option value="system">Topik: system</option>
            <option value="ppp">Topik: ppp</option>
            <option value="interface">Topik: interface</option>
            <option value="firewall">Topik: firewall</option>
            <option value="dhcp">Topik: dhcp</option>
          </select>
        </div>

        <div class="flex items-center gap-1.5">
          <!-- Search Input -->
          <div class="relative min-w-[130px] sm:min-w-[180px]">
            <span class="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-on-surface-variant/60">
              ${icon('search', 'text-[14px]')}
            </span>
            <input type="search" data-log-search placeholder="Cari isi log..."
              class="w-full h-7.5 pl-8 pr-2.5 bg-surface-container-high/60 rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant/60 ring-1 ring-outline-variant/20 focus:ring-primary/50 focus:outline-none" />
          </div>

          <!-- Copy Logs -->
          <button type="button" data-log-copy title="Salin log ke clipboard"
            class="toolbar-btn inline-flex items-center justify-center size-7.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors">
            ${icon('content_copy', 'text-[15px]')}
          </button>

          <!-- Clear Logs -->
          <button type="button" data-log-clear title="Bersihkan tampilan log"
            class="toolbar-btn inline-flex items-center justify-center size-7.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors">
            ${icon('clear_all', 'text-[16px]')}
          </button>

          <!-- Pause/Resume -->
          <button type="button" data-stream-toggle title="Jeda stream"
            class="inline-flex h-7.5 items-center gap-1 rounded-lg px-2 text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors">
            <span data-stream-icon>${icon('pause_circle', 'text-[14px]')}</span>
            <span data-stream-action>Jeda</span>
          </button>
        </div>
      </div>

      <!-- Main Log Terminal Panel -->
      <div class="system-log-panel overflow-hidden rounded-xl bg-surface-container/70 ring-1 ring-outline-variant/20">
        <!-- Terminal Header -->
        <div class="flex items-center justify-between gap-2 border-b border-outline-variant/15 px-3 py-2 bg-surface-container-high/30">
          <div class="flex items-center gap-2">
            ${icon('terminal', 'text-[15px] text-primary')}
            <span class="text-xs font-semibold text-on-surface">RouterOS Terminal Log</span>
            <span data-log-count class="rounded bg-surface-container-high px-1.5 py-0.5 font-mono text-[9px] text-on-surface-variant">0 baris</span>
          </div>
          <span data-stream-status class="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold text-primary">
            <span data-stream-dot class="size-1.5 rounded-full bg-primary animate-pulse"></span>
            <span data-stream-label>STREAMING · LIVE</span>
          </span>
        </div>

        <!-- Scrollable Log List -->
        <div data-log-scroll class="system-log-scroll overflow-y-auto p-2 h-[420px] max-h-[60vh]" role="log" aria-label="System log router" aria-live="off">
          <div data-log-list class="flex flex-col gap-0.5"></div>
        </div>

        <!-- Terminal Footer -->
        <footer class="flex items-center justify-between gap-2 border-t border-outline-variant/15 px-3 py-2 bg-surface-container-high/30">
          <span data-follow-status class="text-[10px] text-on-surface-variant">Mengikuti log terbaru secara otomatis</span>
          <button type="button" data-jump-to-latest
            class="hidden inline-flex h-6.5 shrink-0 items-center gap-1 rounded-lg bg-primary px-2.5 text-[10px] font-semibold text-on-primary shadow-sm transition-transform active:scale-95">
            ${icon('arrow_downward', 'text-[13px]')}
            <span data-jump-label>Ke terbaru</span>
          </button>
        </footer>
      </div>
      <p class="px-1 text-[10px] text-on-surface-variant/70">Data simulasi real-time · entri baru di-push setiap 1,5 detik</p>`;

    parent.appendChild(el);
    this.el = el;

    this.scrollPanel = el.querySelector<HTMLElement>('[data-log-scroll]');
    this.logList = el.querySelector<HTMLElement>('[data-log-list]');

    this.setupEvents();
    this.initHistory();

    return this;
  }

  private setupEvents(): void {
    if (!this.el || !this.scrollPanel) return;

    this.scrollPanel.addEventListener('scroll', this.onLogScroll, { passive: true });

    // Level Filter Buttons
    this.el.querySelectorAll<HTMLButtonElement>('button[data-level-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lvl = btn.dataset.levelFilter as 'all' | SystemLogLevel;
        if (!lvl) return;
        this.activeLevelFilter = lvl;
        this.updateFilterButtons();
        this.renderFilteredList();
      });
    });

    // Topic Filter
    const topicSelect = this.el.querySelector<HTMLSelectElement>('[data-topic-filter]');
    topicSelect?.addEventListener('change', () => {
      this.activeTopicFilter = topicSelect.value;
      this.renderFilteredList();
    });

    // Search Input
    const searchInput = this.el.querySelector<HTMLInputElement>('[data-log-search]');
    searchInput?.addEventListener('input', () => {
      this.searchQuery = searchInput.value.trim().toLowerCase();
      this.renderFilteredList();
    });

    // Copy Logs
    this.el.querySelector<HTMLButtonElement>('[data-log-copy]')?.addEventListener('click', () => {
      const text = this.entries
        .map(
          (e) =>
            `[${formatTime(e.timestamp)}] [${e.level.toUpperCase()}] (${e.topics}): ${e.message}`,
        )
        .join('\n');
      navigator.clipboard.writeText(text).then(
        () => toast('Log berhasil disalin ke clipboard', 'success'),
        () => toast('Gagal menyalin log', 'error'),
      );
    });

    // Clear Logs
    this.el.querySelector<HTMLButtonElement>('[data-log-clear]')?.addEventListener('click', () => {
      this.entries = [];
      this.renderFilteredList();
      toast('Tampilan log dibersihkan', 'info');
    });

    // Pause/Resume
    this.el
      .querySelector<HTMLButtonElement>('[data-stream-toggle]')
      ?.addEventListener('click', () => {
        this.toggleStreaming();
      });

    // Jump to latest
    this.el
      .querySelector<HTMLButtonElement>('[data-jump-to-latest]')
      ?.addEventListener('click', () => {
        this.jumpToLatest();
      });
  }

  private updateFilterButtons(): void {
    if (!this.el) return;
    this.el.querySelectorAll<HTMLButtonElement>('button[data-level-filter]').forEach((btn) => {
      const active = btn.dataset.levelFilter === this.activeLevelFilter;
      btn.classList.toggle('bg-primary/15', active);
      btn.classList.toggle('text-primary', active);
      btn.classList.toggle('font-semibold', active);
      btn.classList.toggle('text-on-surface-variant', !active);
    });
  }

  private initHistory(): void {
    const history = createMockSystemLogHistory(48);
    this.entries = history;
    this.nextLogId = history.length + 1;
    this.renderFilteredList();
    this.scrollToLatest();
    this.streamTimer = window.setInterval(() => this.appendLiveLog(), LOG_STREAM_INTERVAL_MS);
  }

  private renderFilteredList(): void {
    if (!this.logList) return;

    let filtered = this.entries;
    if (this.activeLevelFilter !== 'all') {
      filtered = filtered.filter((e) => e.level === this.activeLevelFilter);
    }
    if (this.activeTopicFilter !== 'all') {
      filtered = filtered.filter((e) => e.topics.includes(this.activeTopicFilter));
    }
    if (this.searchQuery) {
      filtered = filtered.filter(
        (e) =>
          e.message.toLowerCase().includes(this.searchQuery) ||
          e.topics.toLowerCase().includes(this.searchQuery),
      );
    }

    if (filtered.length === 0) {
      this.logList.innerHTML = `
        <div class="py-12 text-center text-on-surface-variant text-xs font-sans">
          Tidak ada entri log yang sesuai dengan filter.
        </div>`;
    } else {
      this.logList.innerHTML = filtered.map(renderLogEntry).join('');
    }

    const countEl = this.el?.querySelector<HTMLElement>('[data-log-count]');
    if (countEl) countEl.textContent = `${filtered.length} baris`;

    if (this.followingLatest) {
      this.scrollToLatest();
    }
  }

  private readonly onLogScroll = (): void => {
    const panel = this.scrollPanel;
    if (!panel) return;
    const distanceToBottom = panel.scrollHeight - panel.clientHeight - panel.scrollTop;
    this.setFollowingLatest(distanceToBottom < 24);
  };

  private appendLiveLog(): void {
    if (this.paused || !this.logList || !this.scrollPanel) return;

    const entry = createMockSystemLog(this.nextLogId++);
    this.entries.push(entry);

    if (this.entries.length > MAX_LOG_ENTRIES) {
      this.entries.shift();
    }

    // Check if matches active filters
    const matchesLevel = this.activeLevelFilter === 'all' || entry.level === this.activeLevelFilter;
    const matchesTopic =
      this.activeTopicFilter === 'all' || entry.topics.includes(this.activeTopicFilter);
    const matchesSearch =
      !this.searchQuery ||
      entry.message.toLowerCase().includes(this.searchQuery) ||
      entry.topics.toLowerCase().includes(this.searchQuery);

    if (matchesLevel && matchesTopic && matchesSearch) {
      this.logList.insertAdjacentHTML('beforeend', renderLogEntry(entry));
      const firstEntry = this.logList.firstElementChild as HTMLElement | null;
      if (this.logList.childElementCount > MAX_LOG_ENTRIES && firstEntry) {
        firstEntry.remove();
      }
    }

    const countEl = this.el?.querySelector<HTMLElement>('[data-log-count]');
    if (countEl) countEl.textContent = `${this.logList.childElementCount} baris`;

    if (this.followingLatest) {
      this.scrollToLatest();
    } else {
      this.unreadCount += 1;
      this.updateJumpButton();
    }
  }

  private scrollToLatest(): void {
    if (!this.scrollPanel) return;
    this.scrollPanel.scrollTop = this.scrollPanel.scrollHeight;
  }

  private jumpToLatest(): void {
    this.unreadCount = 0;
    this.setFollowingLatest(true);
    this.scrollToLatest();
  }

  private setFollowingLatest(following: boolean): void {
    this.followingLatest = following;
    const status = this.el?.querySelector<HTMLElement>('[data-follow-status]');
    if (status) {
      status.textContent = following
        ? 'Mengikuti log terbaru secara otomatis'
        : 'Auto-scroll dijeda · posisi baca dipertahankan';
    }
    if (following) this.unreadCount = 0;
    this.updateJumpButton();
  }

  private updateJumpButton(): void {
    const button = this.el?.querySelector<HTMLButtonElement>('[data-jump-to-latest]');
    const label = this.el?.querySelector<HTMLElement>('[data-jump-label]');
    if (!button || !label) return;

    const show = !this.followingLatest;
    button.classList.toggle('hidden', !show);
    label.textContent =
      this.unreadCount > 0 ? `Ke terbaru · ${this.unreadCount} baru` : 'Ke terbaru';
  }

  private toggleStreaming(): void {
    this.paused = !this.paused;
    const label = this.el?.querySelector<HTMLElement>('[data-stream-label]');
    const dot = this.el?.querySelector<HTMLElement>('[data-stream-dot]');
    const action = this.el?.querySelector<HTMLElement>('[data-stream-action]');
    const iconElement = this.el?.querySelector<HTMLElement>('[data-stream-icon]');

    if (label) label.textContent = this.paused ? 'PAUSED · MOCK' : 'STREAMING · LIVE';
    if (dot) dot.classList.toggle('animate-pulse', !this.paused);
    if (dot) dot.classList.toggle('opacity-40', this.paused);
    if (action) action.textContent = this.paused ? 'Lanjut' : 'Jeda';
    if (iconElement) {
      iconElement.innerHTML = icon(this.paused ? 'play_circle' : 'pause_circle', 'text-[14px]');
    }
  }

  destroy(): void {
    if (this.streamTimer !== null) {
      window.clearInterval(this.streamTimer);
      this.streamTimer = null;
    }
    this.scrollPanel?.removeEventListener('scroll', this.onLogScroll);
    this.el?.remove();
    this.el = null;
  }
}
