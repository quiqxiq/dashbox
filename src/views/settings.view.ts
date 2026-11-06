import { LOCALE_OPTIONS } from '@config/locale.config';
import { icon } from '@components/ui/icon';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog.component';
import { authStore, logout } from '@store/auth.store';
import { getLocale, setLocale } from '@store/locale.store';
import { toast } from '@store/ui.store';
import { t } from '@i18n/translate';
import { escapeHtml } from '@utils/format';
import type { View } from './base.view';

export class SettingsView implements View {
  private root: HTMLElement | null = null;

  mount(container: HTMLElement): this {
    const user = authStore.getState().user;
    const username = user?.username ?? 'admin';

    const root = document.createElement('section');
    root.className = 'view flex flex-col gap-3.5 pb-8';
    root.innerHTML = `
      <header class="flex items-center gap-3 px-1 pb-1">
        <div class="min-w-0">
          <h1 class="text-base font-bold font-headline text-on-surface">${escapeHtml(t('settings.title'))}</h1>
          <p class="mt-0.5 text-[11px] text-on-surface-variant">${escapeHtml(t('settings.languageSection'))}</p>
        </div>
      </header>

      <!-- Account & Session -->
      <div class="relative overflow-hidden rounded-2xl bg-surface-container/60 backdrop-blur-xl p-5 sm:p-6 ring-1 ring-outline-variant/25">
        <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-primary/10 ring-1 ring-primary/25 flex items-center justify-center shrink-0">
              ${icon('person', 'text-primary text-[24px]')}
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h2 class="text-sm font-bold font-headline text-on-surface">${escapeHtml(username)}</h2>
                <span class="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[9px] font-bold uppercase tracking-wider">${escapeHtml(t('auth.roleAdmin'))}</span>
              </div>
              <p class="text-[11px] text-on-surface-variant mt-0.5">${escapeHtml(t('auth.accountSection'))}</p>
            </div>
          </div>
          <button type="button" data-action="logout" class="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-error/15 text-error ring-1 ring-error/30 hover:bg-error/25 font-semibold text-xs transition-all active:scale-95 cursor-pointer w-fit">
            ${icon('logout', 'text-[16px]')}
            <span>${escapeHtml(t('auth.logout'))}</span>
          </button>
        </div>
      </div>

      <div class="relative overflow-hidden rounded-2xl bg-surface-container/60 backdrop-blur-xl p-5 sm:p-6 ring-1 ring-outline-variant/25">
        <div class="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-secondary/10 blur-3xl pointer-events-none"></div>
        <div class="absolute -left-10 bottom-0 w-32 h-32 rounded-full bg-primary/10 blur-2xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col gap-4">
          <div class="flex items-start gap-3">
            <div class="w-12 h-12 rounded-2xl bg-primary/10 ring-1 ring-primary/25 flex items-center justify-center shrink-0">
              ${icon('language', 'text-primary text-[24px]')}
            </div>
            <div class="min-w-0">
              <h2 class="text-sm font-bold font-headline text-on-surface">${escapeHtml(t('settings.languageSection'))}</h2>
              <p class="text-[11px] text-on-surface-variant mt-1 leading-relaxed">${escapeHtml(t('settings.languageHint'))}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2" role="radiogroup" aria-label="${escapeHtml(t('settings.languageSection'))}">
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
            <span>${escapeHtml(t('settings.routerosRest'))}</span>
            <span class="text-outline-variant">/</span>
            ${icon('verified', 'text-[14px] text-primary')}
            <span>${escapeHtml(t('settings.safeMode'))}</span>
          </div>
        </div>
      </div>

      <div class="rounded-2xl bg-surface-container/60 backdrop-blur-xl p-6 ring-1 ring-outline-variant/25 text-center flex flex-col items-center">
        <img src="/dashbox-mark-dark.svg" alt="Dashbox" width="36" height="36" class="mb-3 object-contain drop-shadow-[0_2px_8px_rgba(63,169,240,0.3)]" />
        <span class="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary text-[9px] font-bold uppercase tracking-wider">${escapeHtml(t('settings.previewBadge'))}</span>
        <h3 class="text-sm font-bold font-headline text-on-surface mt-2">${escapeHtml(t('settings.title'))}</h3>
        <p class="text-[11px] text-on-surface-variant mt-1 max-w-[320px] mx-auto leading-relaxed">${escapeHtml(t('settings.previewBody'))}</p>
      </div>`;

    container.appendChild(root);
    this.root = root;

    root.addEventListener('click', async (event) => {
      const btn = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-locale]');
      if (btn?.dataset.locale) {
        setLocale(btn.dataset.locale as 'id' | 'en');
        return;
      }

      const logoutBtn = (event.target as HTMLElement).closest<HTMLButtonElement>(
        '[data-action="logout"]',
      );
      if (logoutBtn) {
        const ok = await ConfirmDialogComponent.ask({
          title: t('auth.logoutConfirmTitle'),
          message: t('auth.logoutConfirmMessage'),
          confirmLabel: t('auth.logout'),
          tone: 'danger',
        });
        if (ok) {
          logout();
          toast(t('auth.logout'), 'info');
        }
      }
    });

    return this;
  }

  destroy(): void {
    this.root?.remove();
    this.root = null;
  }
}
