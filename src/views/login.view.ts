import { icon } from '@components/ui/icon';
import { subscribeLocale, t } from '@i18n/translate';
import { login } from '@store/auth.store';
import { getLocale, setLocale } from '@store/locale.store';
import { escapeHtml } from '@utils/format';
import type { View } from './base.view';

export class LoginView implements View {
  private root: HTMLElement | null = null;
  private unsubscribeLocale: (() => void) | null = null;
  private showPassword = false;

  constructor(private readonly onLoginSuccess?: () => void) {}

  mount(container: HTMLElement): this {
    this.render(container);

    this.unsubscribeLocale = subscribeLocale(() => {
      if (this.root && this.root.isConnected) {
        const usernameVal = this.getUsernameInput()?.value ?? '';
        const passwordVal = this.getPasswordInput()?.value ?? '';
        this.render(container);
        if (this.getUsernameInput()) this.getUsernameInput()!.value = usernameVal;
        if (this.getPasswordInput()) this.getPasswordInput()!.value = passwordVal;
      }
    });

    return this;
  }

  private render(container: HTMLElement): void {
    if (this.root) {
      this.root.remove();
      this.root = null;
    }

    const currentLocale = getLocale();
    const nextLocale = currentLocale === 'id' ? 'en' : 'id';
    const nextLocaleLabel = currentLocale === 'id' ? 'EN' : 'ID';

    const root = document.createElement('div');
    root.className =
      'min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden selection:bg-primary/30';

    root.innerHTML = `
      <!-- Ambient decorative glow -->
      <div class="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-primary/10 blur-[120px] pointer-events-none"></div>
      <div class="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-secondary/10 blur-[120px] pointer-events-none"></div>

      <!-- Top bar with language switcher -->
      <div class="absolute top-4 right-4 z-20">
        <button
          type="button"
          data-action="toggle-locale"
          title="Switch to ${nextLocale.toUpperCase()}"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container/70 backdrop-blur-md hover:bg-surface-container-high text-xs font-semibold text-on-surface-variant hover:text-on-surface ring-1 ring-outline-variant/25 transition-all shadow-sm active:scale-95"
        >
          ${icon('translate', 'text-[14px] text-primary')}
          <span>${nextLocaleLabel}</span>
        </button>
      </div>

      <!-- Centered Login Card -->
      <div class="w-full max-w-sm rounded-2xl bg-surface-container/80 backdrop-blur-2xl ring-1 ring-outline-variant/25 shadow-[0_20px_60px_rgba(0,0,0,0.55)] p-6 sm:p-8 flex flex-col gap-6 relative z-10">
        <!-- Logo & Branding -->
        <div class="flex flex-col items-center text-center">
          <div class="size-14 rounded-2xl bg-gradient-to-br from-primary/25 via-primary/10 to-transparent ring-1 ring-primary/40 shadow-[0_0_24px_rgba(125,211,252,0.22)] flex items-center justify-center mb-3">
            ${icon('router', 'text-[28px] text-primary')}
          </div>
          <h1 class="text-2xl font-extrabold tracking-tight font-headline text-on-surface">Dashbox</h1>
          <p class="text-xs text-on-surface-variant mt-1 font-medium">${escapeHtml(t('auth.loginSubtitle'))}</p>
        </div>

        <!-- Login Form -->
        <form data-login-form class="flex flex-col gap-4">
          <!-- Username Input -->
          <div class="flex flex-col gap-1.5">
            <label for="login-username" class="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              ${escapeHtml(t('auth.usernameLabel'))}
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-3 flex items-center pointer-events-none text-on-surface-variant/60">
                ${icon('person', 'text-[18px]')}
              </span>
              <input
                id="login-username"
                name="username"
                type="text"
                required
                autocomplete="username"
                value="admin"
                placeholder="${escapeHtml(t('auth.usernamePlaceholder'))}"
                class="w-full h-11 pl-10 pr-3 rounded-xl bg-surface-container-high/70 text-sm text-on-surface placeholder:text-on-surface-variant/40 ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary/60 focus:outline-none transition-all"
              />
            </div>
          </div>

          <!-- Password Input -->
          <div class="flex flex-col gap-1.5">
            <label for="login-password" class="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              ${escapeHtml(t('auth.passwordLabel'))}
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-3 flex items-center pointer-events-none text-on-surface-variant/60">
                ${icon('lock', 'text-[18px]')}
              </span>
              <input
                id="login-password"
                name="password"
                type="${this.showPassword ? 'text' : 'password'}"
                autocomplete="current-password"
                placeholder="${escapeHtml(t('auth.passwordPlaceholder'))}"
                class="w-full h-11 pl-10 pr-10 rounded-xl bg-surface-container-high/70 text-sm text-on-surface placeholder:text-on-surface-variant/40 ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary/60 focus:outline-none transition-all font-mono"
              />
              <button
                type="button"
                data-action="toggle-password"
                aria-label="Toggle password visibility"
                class="absolute inset-y-0 right-1 flex items-center px-2.5 text-on-surface-variant/60 hover:text-on-surface transition-colors"
              >
                ${icon(this.showPassword ? 'visibility_off' : 'visibility', 'text-[18px]')}
              </button>
            </div>
          </div>

          <!-- Error Alert Banner -->
          <div data-login-error class="hidden p-3 rounded-xl bg-error/15 ring-1 ring-error/30 text-error text-xs flex items-center gap-2">
            ${icon('error', 'text-[16px] shrink-0')}
            <span data-login-error-text>${escapeHtml(t('auth.invalidCredentials'))}</span>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            data-login-submit
            class="w-full h-11 mt-1 rounded-xl bg-primary text-on-primary font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(125,211,252,0.22)] hover:shadow-[0_0_25px_rgba(125,211,252,0.38)] active:scale-[0.98] transition-all cursor-pointer"
          >
            <span data-submit-text>${escapeHtml(t('auth.signInButton'))}</span>
            ${icon('login', 'text-[18px]')}
          </button>
        </form>

        <!-- Subtle Demo Hint -->
        <p class="text-center text-[11px] text-on-surface-variant/60 font-mono leading-relaxed">
          ${escapeHtml(t('auth.demoHint'))}
        </p>
      </div>
    `;

    container.appendChild(root);
    this.root = root;

    // Attach listeners
    this.attachEvents();
  }

  private attachEvents(): void {
    if (!this.root) return;

    // Language switcher
    this.root
      .querySelector<HTMLButtonElement>('[data-action="toggle-locale"]')
      ?.addEventListener('click', () => {
        const next = getLocale() === 'id' ? 'en' : 'id';
        setLocale(next);
      });

    // Password visibility toggle
    this.root
      .querySelector<HTMLButtonElement>('[data-action="toggle-password"]')
      ?.addEventListener('click', () => {
        this.showPassword = !this.showPassword;
        const passInput = this.getPasswordInput();
        const toggleBtn = this.root?.querySelector<HTMLButtonElement>(
          '[data-action="toggle-password"]',
        );
        if (passInput) {
          passInput.type = this.showPassword ? 'text' : 'password';
        }
        if (toggleBtn) {
          toggleBtn.innerHTML = icon(
            this.showPassword ? 'visibility_off' : 'visibility',
            'text-[18px]',
          );
        }
      });

    // Form submit
    const form = this.root.querySelector<HTMLFormElement>('[data-login-form]');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });
  }

  private handleLogin(): void {
    const username = this.getUsernameInput()?.value ?? '';
    const password = this.getPasswordInput()?.value ?? '';

    const submitBtn = this.root?.querySelector<HTMLButtonElement>('[data-login-submit]');
    const submitText = this.root?.querySelector<HTMLElement>('[data-submit-text]');
    const errorBanner = this.root?.querySelector<HTMLElement>('[data-login-error]');

    if (errorBanner) errorBanner.classList.add('hidden');
    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.textContent = t('auth.signingIn');

    // Simulate light async verification
    window.setTimeout(() => {
      const res = login(username, password);

      if (res.success) {
        this.onLoginSuccess?.();
      } else {
        if (submitBtn) submitBtn.disabled = false;
        if (submitText) submitText.textContent = t('auth.signInButton');
        if (errorBanner) {
          errorBanner.classList.remove('hidden');
        }
      }
    }, 280);
  }

  private getUsernameInput(): HTMLInputElement | null {
    return this.root?.querySelector<HTMLInputElement>('#login-username') ?? null;
  }

  private getPasswordInput(): HTMLInputElement | null {
    return this.root?.querySelector<HTMLInputElement>('#login-password') ?? null;
  }

  destroy(): void {
    if (this.unsubscribeLocale) {
      this.unsubscribeLocale();
      this.unsubscribeLocale = null;
    }
    this.root?.remove();
    this.root = null;
  }
}
