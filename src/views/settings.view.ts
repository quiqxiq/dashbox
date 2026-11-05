import { icon } from '@components/ui/icon';
import type { View } from './base.view';

export class SettingsView implements View {
  private root: HTMLElement | null = null;

  mount(container: HTMLElement): this {
    const root = document.createElement('section');
    root.className = 'view flex flex-col w-full px-3.5 pb-8';
    root.innerHTML = `
      <div class="relative overflow-hidden rounded-2xl bg-surface-container/60 backdrop-blur-xl p-6 ring-1 ring-outline-variant/25 text-center">
        <div class="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-secondary/10 blur-3xl"></div>
        <div class="absolute -left-10 bottom-0 w-32 h-32 rounded-full bg-primary/10 blur-2xl"></div>
        <div class="relative z-10 flex flex-col items-center">
          <div class="w-14 h-14 rounded-2xl bg-secondary/10 ring-1 ring-secondary/25 flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(136,180,204,0.12)]">
            ${icon('tune', 'text-secondary text-[26px]')}
          </div>
          <span class="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary text-[9px] font-bold uppercase tracking-wider mb-2">Pratinjau</span>
          <h2 class="text-base font-bold font-headline text-on-surface tracking-tight">Pengaturan</h2>
          <p class="text-[11px] text-on-surface-variant mt-1.5 max-w-[280px] leading-relaxed">
            Konfigurasi koneksi RouterOS, preferensi tampilan, dan mode aman akan tersedia di panel ini.
          </p>
          <div class="mt-4 flex items-center gap-2 text-[10px] text-on-surface-variant/70 font-mono">
            ${icon('admin_panel_settings', 'text-[14px] text-secondary')}
            <span>RouterOS REST</span>
            <span class="text-outline-variant">/</span>
            ${icon('verified', 'text-[14px] text-primary')}
            <span>Safe Mode</span>
          </div>
        </div>
      </div>`;
    container.appendChild(root);
    this.root = root;
    return this;
  }

  destroy(): void {
    this.root?.remove();
    this.root = null;
  }
}
