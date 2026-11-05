import { createMockSystemLog, createMockSystemLogHistory } from '@mock/system-logs.mock';
import type { SystemLogEntry, SystemLogLevel } from '@mock/system-logs.mock';
import { escapeHtml } from '@utils/format';
import { icon } from '@components/ui/icon';
import type { ViewParams } from '@types';
import type { View } from './base.view';

const MAX_LOG_ENTRIES = 200;
const LOG_STREAM_INTERVAL_MS = 1_500;

const LEVEL_STYLES: Record<SystemLogLevel, { label: string; className: string }> = {
  info: { label: 'INFO', className: 'system-log-level-info' },
  warning: { label: 'WARN', className: 'system-log-level-warning' },
  error: { label: 'ERROR', className: 'system-log-level-error' },
  debug: { label: 'DEBUG', className: 'system-log-level-debug' },
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
    <article class="system-log-entry" data-log-entry="${entry.id}">
      <time class="system-log-time" datetime="${entry.timestamp.toISOString()}">${formatTime(entry.timestamp)}</time>
      <span class="system-log-level ${level.className}">${level.label}</span>
      <span class="system-log-topics">${escapeHtml(entry.topics)}</span>
      <p class="system-log-message">${escapeHtml(entry.message)}</p>
    </article>`;
}

export class MonitorView implements View {
  private root: HTMLElement | null = null;
  private scrollPanel: HTMLElement | null = null;
  private logList: HTMLElement | null = null;
  private streamTimer: number | null = null;
  private nextLogId = 1;
  private followingLatest = true;
  private paused = false;
  private unreadCount = 0;
  private section: ViewParams['monitorSection'];

  constructor(section: ViewParams['monitorSection'] = 'logs') {
    this.section = section ?? 'logs';
  }

  mount(container: HTMLElement): this {
    const root = document.createElement('section');
    root.className = 'view flex flex-col gap-3 w-full px-3.5 pb-8';
    this.root = root;
    container.appendChild(root);

    if (this.section !== 'logs') {
      this.renderPreview(root);
      return this;
    }

    root.innerHTML = `
      <header class="flex items-center justify-between gap-3 px-1">
        <div class="min-w-0">
          <h1 class="text-base font-bold font-headline text-on-surface">System Log</h1>
          <p class="mt-0.5 text-[11px] text-on-surface-variant">Aktivitas router secara real time</p>
        </div>
        <span data-stream-status class="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
          <span data-stream-dot class="size-1.5 rounded-full bg-primary animate-pulse"></span>
          <span data-stream-label>LIVE · MOCK</span>
        </span>
      </header>
      <div class="system-log-panel overflow-hidden rounded-xl bg-surface-container/70 ring-1 ring-outline-variant/20">
        <div class="flex items-center justify-between gap-2 border-b border-outline-variant/15 px-3 py-2">
          <div class="flex min-w-0 items-center gap-2">
            ${icon('terminal', 'text-[15px] text-primary')}
            <span class="text-[11px] font-semibold text-on-surface">Log Router</span>
            <span data-log-count class="rounded bg-surface-container-high px-1.5 py-0.5 font-mono text-[9px] text-on-surface-variant">0</span>
          </div>
          <button type="button" data-stream-toggle aria-label="Jeda streaming log" title="Jeda streaming"
            class="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg px-2 text-[10px] font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface">
            <span data-stream-icon>${icon('pause_circle', 'text-[14px]')}</span>
            <span data-stream-action>Jeda</span>
          </button>
        </div>
        <div data-log-scroll class="system-log-scroll overflow-y-auto p-2" role="log" aria-label="System log router" aria-live="off">
          <div data-log-list class="flex flex-col gap-1"></div>
        </div>
        <footer class="flex items-center justify-between gap-2 border-t border-outline-variant/15 px-3 py-2">
          <span data-follow-status class="text-[10px] text-on-surface-variant">Mengikuti log terbaru</span>
          <button type="button" data-jump-to-latest
            class="hidden inline-flex h-7 shrink-0 items-center gap-1 rounded-lg bg-primary px-2.5 text-[10px] font-semibold text-on-primary shadow-sm transition-transform active:scale-95">
            ${icon('arrow_downward', 'text-[14px]')}
            <span data-jump-label>Ke terbaru</span>
          </button>
        </footer>
      </div>
      <p class="px-1 text-[10px] text-on-surface-variant/70">Data simulasi · entri terbaru ditambahkan setiap 1,5 detik</p>`;

    this.scrollPanel = root.querySelector<HTMLElement>('[data-log-scroll]');
    this.logList = root.querySelector<HTMLElement>('[data-log-list]');
    const jumpButton = root.querySelector<HTMLButtonElement>('[data-jump-to-latest]');
    const streamToggle = root.querySelector<HTMLButtonElement>('[data-stream-toggle]');

    if (!this.scrollPanel || !this.logList || !jumpButton || !streamToggle) {
      throw new Error('Elemen System Log tidak berhasil dibuat');
    }

    this.scrollPanel.addEventListener('scroll', this.onLogScroll, { passive: true });
    jumpButton.addEventListener('click', () => this.jumpToLatest());
    streamToggle.addEventListener('click', () => this.toggleStreaming());

    const history = createMockSystemLogHistory(48);
    this.nextLogId = history.length + 1;
    this.logList.innerHTML = history.map(renderLogEntry).join('');
    this.updateLogCount();
    this.scrollToLatest();
    this.streamTimer = window.setInterval(() => this.appendLiveLog(), LOG_STREAM_INTERVAL_MS);

    return this;
  }

  destroy(): void {
    if (this.streamTimer !== null) {
      window.clearInterval(this.streamTimer);
      this.streamTimer = null;
    }
    this.scrollPanel?.removeEventListener('scroll', this.onLogScroll);
    this.root?.remove();
    this.root = null;
    this.scrollPanel = null;
    this.logList = null;
  }

  private readonly onLogScroll = (): void => {
    const panel = this.scrollPanel;
    if (!panel) return;

    const distanceToBottom = panel.scrollHeight - panel.clientHeight - panel.scrollTop;
    this.setFollowingLatest(distanceToBottom < 24);
  };

  private appendLiveLog(): void {
    if (this.paused || !this.logList || !this.scrollPanel) return;

    const wasFollowing = this.followingLatest;
    const entry = createMockSystemLog(this.nextLogId++);
    this.logList.insertAdjacentHTML('beforeend', renderLogEntry(entry));

    const firstEntry = this.logList.firstElementChild as HTMLElement | null;
    if (this.logList.childElementCount > MAX_LOG_ENTRIES && firstEntry) {
      const removedHeight = firstEntry.offsetHeight;
      firstEntry.remove();
      if (!wasFollowing)
        this.scrollPanel.scrollTop = Math.max(0, this.scrollPanel.scrollTop - removedHeight);
    }

    this.updateLogCount();
    if (wasFollowing) {
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
    const status = this.root?.querySelector<HTMLElement>('[data-follow-status]');
    if (status) {
      status.textContent = following
        ? 'Mengikuti log terbaru'
        : 'Auto-scroll dijeda · posisi baca dipertahankan';
    }
    if (following) this.unreadCount = 0;
    this.updateJumpButton();
  }

  private updateJumpButton(): void {
    const button = this.root?.querySelector<HTMLButtonElement>('[data-jump-to-latest]');
    const label = this.root?.querySelector<HTMLElement>('[data-jump-label]');
    if (!button || !label) return;

    const show = !this.followingLatest;
    button.classList.toggle('hidden', !show);
    label.textContent =
      this.unreadCount > 0 ? `Ke terbaru · ${this.unreadCount} baru` : 'Ke terbaru';
  }

  private updateLogCount(): void {
    const count = this.root?.querySelector<HTMLElement>('[data-log-count]');
    if (count && this.logList) count.textContent = String(this.logList.childElementCount);
  }

  private toggleStreaming(): void {
    this.paused = !this.paused;
    const label = this.root?.querySelector<HTMLElement>('[data-stream-label]');
    const dot = this.root?.querySelector<HTMLElement>('[data-stream-dot]');
    const action = this.root?.querySelector<HTMLElement>('[data-stream-action]');
    const button = this.root?.querySelector<HTMLButtonElement>('[data-stream-toggle]');
    const iconElement = this.root?.querySelector<HTMLElement>('[data-stream-icon]');

    if (label) label.textContent = this.paused ? 'PAUSED · MOCK' : 'LIVE · MOCK';
    if (dot) dot.classList.toggle('animate-pulse', !this.paused);
    if (dot) dot.classList.toggle('opacity-40', this.paused);
    if (action) action.textContent = this.paused ? 'Lanjut' : 'Jeda';
    if (button) {
      button.setAttribute(
        'aria-label',
        this.paused ? 'Lanjutkan streaming log' : 'Jeda streaming log',
      );
      button.title = this.paused ? 'Lanjutkan streaming' : 'Jeda streaming';
    }
    if (iconElement) {
      iconElement.innerHTML = icon(this.paused ? 'play_circle' : 'pause_circle', 'text-[14px]');
    }
  }

  private renderPreview(root: HTMLElement): void {
    const preview =
      this.section === 'traffic'
        ? {
            icon: 'swap_calls' as const,
            title: 'Interfaces Traffic',
            body: 'Pemantauan trafik interface akan tersedia di panel ini.',
          }
        : {
            icon: 'security' as const,
            title: 'IP Firewall',
            body: 'Daftar rule firewall dan statistik trafik akan tersedia di panel ini.',
          };

    root.innerHTML = `
      <div class="relative overflow-hidden rounded-2xl bg-surface-container/60 p-6 text-center ring-1 ring-outline-variant/25 backdrop-blur-xl">
        <div class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl"></div>
        <div class="relative z-10 flex flex-col items-center">
          <div class="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/25">
            ${icon(preview.icon, 'text-primary text-[26px]')}
          </div>
          <span class="mb-2 rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">Pratinjau</span>
          <h2 class="text-base font-bold font-headline text-on-surface">${preview.title}</h2>
          <p class="mt-1.5 max-w-[280px] text-[11px] leading-relaxed text-on-surface-variant">${preview.body}</p>
        </div>
      </div>`;
  }
}
