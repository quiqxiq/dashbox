import { LOCALE_OPTIONS } from '@config/locale.config';
import { icon } from '@components/ui/icon';
import { getLocale, setLocale } from '@store/locale.store';
import { subscribeLocale, t } from '@i18n/translate';
import type { View } from './base.view';

export class SettingsView implements View {
  private root: HTMLElement | null = null;

  mount(container: HTMLElement): this {
    const root = document.createElement('section');
    root.className = 'view flex flex-col gap-3 w-full px-3.5 pb-8';
    root.innerHTML = `
      <header class="flex items-center gap-3 px-1 pt-1">
        <div class="min-w-0">
          <h1 class="text-base font-bold font-headline text-on-surface">${escapeLabel(t('settings.title'))}</h1>
          <p class="mt-0.5 text-[11px] text-on-surface-variant">${escapeLabel(t('settings.languageSection'))}</p>
        </div>
      </header>

      <div class="relative overflow-hidden rounded-2xl bg-surface-container/60 backdrop-blur-xl p-5 sm:p-6 ring-1 ring-outline-variant/25">
        <div class="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-secondary/10 blur-3xl pointer-events-none"></div>
        <div class="absolute -left-10 bottom-0 w-32 h-32 rounded-full bg-primary/10 blur-2xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col gap-4">
          <div class="flex items-start gap-3">
            <div class="w-12 h-12 rounded-2xl bg-primary/10 ring-1 ring-primary/25 flex items-center justify-center shrink-0">
              ${icon('language', 'text-primary text-[24px]')}
            </div>
            <div class="min-w-0">
              <h2 class="text-sm font-bold font-headline text-on-surface">${escapeLabel(t('settings.languageSection'))}</h2>
              <p class="text-[11px] text-on-surface-variant mt-1 leading-relaxed">${escapeLabel(t('settings.languageHint'))}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2" role="radiogroup" aria-label="${escapeLabel(t('settings.languageSection'))}">
            ${LOCALE_OPTIONS.map(
              (opt) => `
              <button type="button" data-locale="${opt.value}" role="radio" aria-checked="${getLocale() === opt.value ? 'true' : 'false'}"
                class="flex items-center gap-2.5 p-3 rounded-xl ring-1 transition-all text-left ${
                  getLocale() === opt.value
                    ? 'bg-primary/15 text-primary ring-primary/30 shadow-[0_0_12px_rgba(125,211,252,0.18)]'
                    : 'bg-surface-container-high/50 text-on-surface-variant ring-outline-variant/20 hover:text-on-surface hover:bg-surface-container-high'
                }">
                <span class="shrink-0">${icon('translate', 'text-[18px]')}</span>
                <span class="min-w-0">
                  <span class="block text-xs font-bold">${opt.value === 'id' ? 'Indonesia' : 'English'}</span>
                  <span class="block text-[10px] opacity-70 truncate">${opt.nativeLabel}</span>
                </span>
                <span class="ml-auto shrink-0 ${getLocale() === opt.value ? 'text-primary' : 'text-on-surface-variant/40'}">
                  ${icon(getLocale() === opt.value ? 'check_circle' : 'radio_button_unchecked', 'text-[16px]')}
                </span>
              </button>`,
            ).join('')}
          </div>

          <div class="flex items-center gap-2 text-[10px] text-on-surface-variant/70 font-mono flex-wrap">
            ${icon('admin_panel_settings', 'text-[14px] text-secondary')}
            <span>RouterOS REST</span>
            <span class="text-outline-variant">/</span>
            ${icon('verified', 'text-[14px] text-primary')}
            <span>Safe Mode</span>
          </div>
        </div>
      </div>

      <div class="rounded-2xl bg-surface-container/60 backdrop-blur-xl p-5 ring-1 ring-outline-variant/25 text-center">
        <span class="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary text-[9px] font-bold uppercase tracking-wider">${escapeLabel(t('settings.previewBadge'))}</span>
        <h3 class="text-sm font-bold font-headline text-on-surface mt-2">${escapeLabel(t('settings.title'))}</h3>
        <p class="text-[11px] text-on-surface-variant mt-1 max-w-[320px] mx-auto leading-relaxed">${escapeLabel(t('settings.previewBody'))}</p>
      </div>`;

    container.appendChild(root);
    this.root = root;

    root.addEventListener('click', (event) => {
      const btn = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-locale]');
      if (!btn?.dataset.locale) return;
      setLocale(btn.dataset.locale as 'id' | 'en');
    });

    subscribeLocale(() => {
      this.destroy();
      // Re-mount into parent
      const parent = root.parentElement as HTMLElement | null;
      if (parent) this.mount(parent);
    });

    return this;
  }

  destroy(): void {
    this.root?.remove();
    this.root = null;
  }
}

function escapeLabel(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
}
