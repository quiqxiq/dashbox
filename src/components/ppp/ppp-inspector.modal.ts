import type { PppSecret, PppSecretFormValues, PppServiceType } from '@types';
import { toast } from '@store/ui.store';
import { escapeHtml } from '@utils/format';
import { logger } from '@utils/logger';
import { icon } from '@components/ui/icon';
import { t } from '@i18n/translate';
import type { TranslationKey } from '@i18n/translate';
import { PPP_STATUS_CONFIG } from './ppp-row.template';

export type InspectorTab = 'general' | 'limits' | 'status';
export type InspectorMode = 'create' | 'edit';

export interface PppInspectorSubmitPayload {
  mode: InspectorMode;
  id: number | null;
  values: PppSecretFormValues;
}

export interface PppInspectorCallbacks {
  onSubmit: (payload: PppInspectorSubmitPayload) => Promise<PppSecret | null>;
}

export interface PppInspectorOpenOptions {
  tab?: InspectorTab;
  focus?: 'name' | 'comment';
}

const SERVICE_TYPES: readonly PppServiceType[] = ['pppoe', 'l2tp', 'sstp', 'ovpn', 'any'];

const PROFILES: readonly string[] = [
  '50M-Unlimited',
  '100M-Dedicated',
  '20M-Family',
  '5M-Hourly',
  '30M-Edu',
  'VPN-RemoteWorker',
  'default',
];

const TABS: ReadonlyArray<{ tab: InspectorTab; labelKey: TranslationKey }> = [
  { tab: 'general', labelKey: 'ppp.inspector.tabGeneral' },
  { tab: 'limits', labelKey: 'ppp.inspector.tabLimits' },
  { tab: 'status', labelKey: 'ppp.inspector.tabStatus' },
];

function defaultValues(): PppSecretFormValues {
  return {
    name: '',
    password: '',
    service: 'pppoe',
    profile: '50M-Unlimited',
    localAddress: '10.10.0.1',
    remoteAddress: 'dynamic',
    callerId: 'auto',
    comment: '',
    rateLimit: '50M/50M 0/0 0/0 0/0 8',
    sessionTimeout: '00:00:00',
    idleTimeout: '00:05:00',
    onlyOneSession: false,
  };
}

function valuesFromSecret(secret: PppSecret): PppSecretFormValues {
  return {
    name: secret.name,
    password: '',
    service: secret.service,
    profile: secret.profile,
    localAddress: secret.localAddress,
    remoteAddress: secret.remoteAddress,
    callerId: secret.callerId,
    comment: secret.comment,
    rateLimit: secret.rateLimit,
    sessionTimeout: secret.sessionTimeout,
    idleTimeout: secret.idleTimeout,
    onlyOneSession: secret.onlyOneSession,
  };
}

function asServiceType(value: string): PppServiceType {
  return SERVICE_TYPES.includes(value as PppServiceType) ? (value as PppServiceType) : 'pppoe';
}

export class PppInspectorModal {
  private root: HTMLElement | null = null;
  private dialog: HTMLElement | null = null;
  private activeSecret: PppSecret | null = null;
  private mode: InspectorMode = 'create';
  private activeTab: InspectorTab = 'general';
  private onlyOneSession = false;
  private passwordVisible = false;
  private busy = false;
  private closeTimer: number | null = null;
  private lastFocus: HTMLElement | null = null;

  constructor(private readonly callbacks: PppInspectorCallbacks) {}

  mount(parent: HTMLElement = document.body): this {
    if (this.root) return this;

    const root = document.createElement('div');
    root.className =
      'fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-md opacity-0 pointer-events-none transition-opacity duration-200';
    root.setAttribute('aria-hidden', 'true');
    root.setAttribute('inert', '');
    root.innerHTML = `
      <div data-inspector-dialog role="dialog" aria-modal="true" aria-labelledby="inspector-title"
        class="w-full sm:max-w-lg bg-surface-container-high/95 backdrop-blur-2xl rounded-t-3xl sm:rounded-2xl ring-1 ring-outline-variant/30 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden scale-95 opacity-0 transition-all duration-200"></div>`;
    parent.appendChild(root);

    this.root = root;
    this.dialog = root.querySelector<HTMLElement>('[data-inspector-dialog]');

    root.addEventListener('click', (event) => {
      if (event.target === root) this.close();
    });
    root.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && event.target instanceof HTMLInputElement && !this.busy) {
        event.preventDefault();
        void this.submit('ok');
        return;
      }
      this.handleKeydown(event);
    });

    return this;
  }

  open(secret: PppSecret | null, options: PppInspectorOpenOptions = {}): void {
    this.mount();
    if (!this.root || !this.dialog) return;

    if (this.closeTimer !== null) {
      window.clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }

    if (this.root.getAttribute('aria-hidden') === 'true') {
      this.lastFocus =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }

    this.activeSecret = secret;
    this.mode = secret ? 'edit' : 'create';
    this.activeTab = options.focus === 'comment' ? 'general' : (options.tab ?? 'general');
    this.onlyOneSession = secret?.onlyOneSession ?? false;
    this.passwordVisible = false;
    this.busy = false;

    this.render();

    this.root.removeAttribute('inert');
    this.root.setAttribute('aria-hidden', 'false');
    this.root.classList.remove('pointer-events-none', 'opacity-0');
    this.root.classList.add('opacity-100');

    window.requestAnimationFrame(() => {
      this.dialog?.classList.remove('scale-95', 'opacity-0');
      this.dialog?.classList.add('scale-100', 'opacity-100');

      const focusSelector =
        options.focus === 'comment'
          ? '[data-field="comment"]'
          : this.activeTab === 'limits'
            ? '[data-field="rateLimit"]'
            : this.activeTab === 'status'
              ? '[data-ok]'
              : '[data-field="name"]';
      this.dialog?.querySelector<HTMLElement>(focusSelector)?.focus();
    });
  }

  close(): void {
    if (!this.root || !this.dialog || this.busy) return;

    this.dialog.classList.remove('scale-100', 'opacity-100');
    this.dialog.classList.add('scale-95', 'opacity-0');
    this.root.classList.add('pointer-events-none', 'opacity-0');
    this.root.classList.remove('opacity-100');
    this.root.setAttribute('aria-hidden', 'true');

    if (this.closeTimer !== null) window.clearTimeout(this.closeTimer);
    this.closeTimer = window.setTimeout(() => {
      this.closeTimer = null;
      this.root?.setAttribute('inert', '');
      this.activeSecret = null;

      if (this.lastFocus?.isConnected) this.lastFocus.focus();
      this.lastFocus = null;
    }, 160);
  }

  destroy(): void {
    if (this.closeTimer !== null) window.clearTimeout(this.closeTimer);
    this.root?.remove();
    this.root = null;
    this.dialog = null;
    this.activeSecret = null;
    this.lastFocus = null;
  }

  private render(): void {
    if (!this.dialog) return;

    const secret = this.activeSecret;
    const values = secret ? valuesFromSecret(secret) : defaultValues();
    const statusPill = secret
      ? `<span data-modal-status class="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase shrink-0 ${PPP_STATUS_CONFIG[secret.status].pillClass}">${secret.status}</span>`
      : `<span data-modal-status class="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase shrink-0 bg-surface-variant text-on-surface-variant">${escapeHtml(t('status.draft'))}</span>`;

    const titleText = t('ppp.inspector.title', {
      name: secret?.name || t('ppp.inspector.newSecret'),
    });

    this.dialog.innerHTML = `
      <div class="px-4 py-3 bg-surface-container/90 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-2.5 min-w-0">
          ${icon('badge', 'text-primary text-[20px]')}
          <div class="flex items-center gap-1.5 min-w-0">
            <span id="inspector-title" data-modal-title class="text-xs font-semibold text-on-surface font-headline truncate">
              ${escapeHtml(titleText)}
            </span>
            ${statusPill}
          </div>
        </div>
        <button type="button" data-close aria-label="${escapeAttr(t('common.close'))}"
          class="w-7 h-7 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 flex items-center justify-center shrink-0">
          ${icon('close', 'text-[16px]')}
        </button>
      </div>

      <div class="px-4 pt-2 pb-1 bg-surface-container/50 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0" role="tablist" aria-label="${escapeAttr(t('ppp.inspector.sectionsAria'))}">
        ${TABS.map(
          (tab) => `
            <button type="button" data-tab="${tab.tab}" role="tab" aria-selected="false"
              class="px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:text-on-surface shrink-0">
              ${escapeHtml(t(tab.labelKey))}
            </button>`,
        ).join('')}
      </div>

      <div class="p-4 overflow-y-auto flex-1 flex flex-col gap-3 text-xs">
        <div data-panel="general" class="flex flex-col gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant" for="inspector-name">${escapeHtml(t('ppp.inspector.name'))}</label>
            <input id="inspector-name" data-field="name" type="text" value="${escapeHtml(values.name)}"
              class="h-9 px-3 bg-surface-container rounded-lg text-on-surface font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary/60 transition-all" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant" for="inspector-password">${escapeHtml(t('ppp.inspector.password'))}</label>
            <div class="relative w-full">
              <input id="inspector-password" data-field="password" type="password" value=""
                placeholder="${secret ? escapeAttr(t('ppp.inspector.passwordUnchanged')) : '••••••••'}"
                class="w-full h-9 pl-3 pr-10 bg-surface-container rounded-lg text-on-surface font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary/60 transition-all" />
              <button type="button" data-toggle-password aria-label="${escapeAttr(t('ppp.inspector.showPassword'))}"
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant hover:text-primary">
                <span data-password-icon class="inline-flex">${icon('visibility', 'text-[18px]')}</span>
              </button>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant" for="inspector-service">${escapeHtml(t('ppp.inspector.service'))}</label>
              <select id="inspector-service" data-field="service"
                class="h-9 px-2 bg-surface-container rounded-lg text-on-surface font-mono text-xs focus:outline-none cursor-pointer">
                ${SERVICE_TYPES.map(
                  (service) =>
                    `<option value="${service}" ${service === values.service ? 'selected' : ''}>${service}</option>`,
                ).join('')}
              </select>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant" for="inspector-profile">${escapeHtml(t('ppp.inspector.profile'))}</label>
              <select id="inspector-profile" data-field="profile"
                class="h-9 px-2 bg-surface-container rounded-lg text-on-surface font-mono text-xs focus:outline-none cursor-pointer">
                ${this.profileOptions(values.profile)}
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant" for="inspector-local">${escapeHtml(t('ppp.inspector.localAddress'))}</label>
              <input id="inspector-local" data-field="localAddress" type="text" value="${escapeHtml(values.localAddress)}"
                class="h-9 px-3 bg-surface-container rounded-lg text-on-surface font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary/60" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant" for="inspector-remote">${escapeHtml(t('ppp.inspector.remoteAddress'))}</label>
              <input id="inspector-remote" data-field="remoteAddress" type="text" value="${escapeHtml(values.remoteAddress)}"
                class="h-9 px-3 bg-surface-container rounded-lg text-on-surface font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary/60" />
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant" for="inspector-caller">${escapeHtml(t('ppp.inspector.callerId'))}</label>
            <input id="inspector-caller" data-field="callerId" type="text" value="${escapeHtml(values.callerId)}"
              class="h-9 px-3 bg-surface-container rounded-lg text-on-surface font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary/60" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant" for="inspector-comment">${escapeHtml(t('ppp.inspector.comment'))}</label>
            <input id="inspector-comment" data-field="comment" type="text" value="${escapeHtml(values.comment)}"
              class="h-9 px-3 bg-surface-container rounded-lg text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary/60" />
          </div>
        </div>

        <div data-panel="limits" class="flex flex-col gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant" for="inspector-rate">${escapeHtml(t('ppp.inspector.rateLimit'))}</label>
            <input id="inspector-rate" data-field="rateLimit" type="text" value="${escapeHtml(values.rateLimit)}"
              class="h-9 px-3 bg-surface-container rounded-lg text-on-surface font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary/60" />
            <span class="text-[10px] text-on-surface-variant">${escapeHtml(t('ppp.inspector.rateLimitHint'))}</span>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant" for="inspector-session">${escapeHtml(t('ppp.inspector.sessionTimeout'))}</label>
              <input id="inspector-session" data-field="sessionTimeout" type="text" value="${escapeHtml(values.sessionTimeout)}"
                class="h-9 px-3 bg-surface-container rounded-lg text-on-surface font-mono text-xs focus:outline-none" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant" for="inspector-idle">${escapeHtml(t('ppp.inspector.idleTimeout'))}</label>
              <input id="inspector-idle" data-field="idleTimeout" type="text" value="${escapeHtml(values.idleTimeout)}"
                class="h-9 px-3 bg-surface-container rounded-lg text-on-surface font-mono text-xs focus:outline-none" />
            </div>
          </div>
          <div class="p-3 rounded-xl bg-surface-container/60 flex items-center justify-between ring-1 ring-outline-variant/20">
            <div class="flex flex-col">
              <span class="text-xs font-semibold text-on-surface">${escapeHtml(t('ppp.inspector.onlyOneSession'))}</span>
              <span class="text-[10px] text-on-surface-variant">${escapeHtml(t('ppp.inspector.onlyOneSessionHint'))}</span>
            </div>
            <button type="button" data-session-toggle role="switch" aria-checked="${this.onlyOneSession}"
              aria-label="${escapeAttr(t('ppp.inspector.onlyOneSession'))}"
              class="w-10 h-6 rounded-full p-1 flex items-center cursor-pointer transition-colors ${
                this.onlyOneSession
                  ? 'bg-primary/30 justify-end'
                  : 'bg-surface-container-highest justify-start'
              }">
              <span data-session-knob class="w-4 h-4 rounded-full shadow-sm transition-colors ${
                this.onlyOneSession ? 'bg-primary' : 'bg-on-surface-variant'
              }"></span>
            </button>
          </div>
        </div>

        <div data-panel="status" class="flex flex-col gap-3">
          <div class="grid grid-cols-2 gap-2">
            <div class="p-2.5 rounded-xl bg-surface-container/80 flex flex-col ring-1 ring-outline-variant/20">
              <span class="text-[10px] text-on-surface-variant uppercase font-medium">${escapeHtml(t('ppp.inspector.uptime'))}</span>
              <span class="text-xs font-mono font-bold text-primary mt-1">${escapeHtml(secret?.uptime ?? '—')}</span>
            </div>
            <div class="p-2.5 rounded-xl bg-surface-container/80 flex flex-col ring-1 ring-outline-variant/20">
              <span class="text-[10px] text-on-surface-variant uppercase font-medium">${escapeHtml(t('ppp.inspector.sessionIp'))}</span>
              <span class="text-xs font-mono font-bold text-on-surface mt-1">${escapeHtml(secret?.remoteAddress ?? '—')}</span>
            </div>
          </div>
          <div class="p-3 rounded-xl bg-surface-container/80 flex flex-col gap-2 ring-1 ring-outline-variant/20">
            <span class="text-[10px] text-on-surface-variant uppercase font-medium">${escapeHtml(t('ppp.inspector.trafficTotal'))}</span>
            <div class="flex items-center justify-between font-mono text-xs">
              <span class="text-on-surface-variant">${escapeHtml(t('ppp.inspector.bytesIn'))}</span>
              <span class="font-bold text-tertiary">${escapeHtml(secret?.bytesIn ?? '—')}</span>
            </div>
            <div class="flex items-center justify-between font-mono text-xs">
              <span class="text-on-surface-variant">${escapeHtml(t('ppp.inspector.bytesOut'))}</span>
              <span class="font-bold text-primary">${escapeHtml(secret?.bytesOut ?? '—')}</span>
            </div>
          </div>
          <div class="p-3 rounded-xl bg-surface-container/80 flex flex-col gap-1.5 font-mono text-[11px] ring-1 ring-outline-variant/20">
            <div class="flex items-center justify-between text-on-surface-variant">
              <span>${escapeHtml(t('ppp.inspector.encodingMtu'))}</span><span class="text-on-surface">${escapeHtml(secret?.encoding ?? '—')}</span>
            </div>
            <div class="flex items-center justify-between text-on-surface-variant">
              <span>${escapeHtml(t('ppp.inspector.lastDisconnect'))}</span><span class="text-on-surface">${escapeHtml(secret?.lastDisconnect ?? '—')}</span>
            </div>
          </div>
        </div>
      </div>

      <p data-error class="hidden px-4 py-2 text-[11px] text-error bg-error-container/30"></p>

      <div class="px-4 py-3 bg-surface-container/90 flex items-center justify-end gap-2 shrink-0">
        <button type="button" data-cancel
          class="px-3.5 py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface font-semibold text-xs active:scale-95 transition-all">
          ${escapeHtml(t('ppp.inspector.cancel'))}
        </button>
        <button type="button" data-apply
          class="px-3.5 py-1.5 rounded-lg bg-surface-container-highest text-secondary hover:text-on-surface font-semibold text-xs active:scale-95 transition-all">
          ${escapeHtml(t('ppp.inspector.apply'))}
        </button>
        <button type="button" data-ok
          class="px-5 py-1.5 rounded-lg bg-primary text-on-primary font-bold text-xs shadow-lg shadow-primary/20 active:scale-95 transition-all">
          ${escapeHtml(t('ppp.inspector.ok'))}
        </button>
      </div>`;

    this.bindEvents();
    this.switchTab(this.activeTab);
    this.syncSessionToggle();
  }

  private bindEvents(): void {
    if (!this.dialog) return;

    this.dialog.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        const tab = button.dataset.tab as InspectorTab | undefined;
        if (tab) this.switchTab(tab);
      });
    });

    this.dialog.querySelector<HTMLButtonElement>('[data-close]')?.addEventListener('click', () => {
      this.close();
    });
    this.dialog.querySelector<HTMLButtonElement>('[data-cancel]')?.addEventListener('click', () => {
      this.close();
    });
    this.dialog.querySelector<HTMLButtonElement>('[data-apply]')?.addEventListener('click', () => {
      void this.submit('apply');
    });
    this.dialog.querySelector<HTMLButtonElement>('[data-ok]')?.addEventListener('click', () => {
      void this.submit('ok');
    });

    this.dialog
      .querySelector<HTMLButtonElement>('[data-toggle-password]')
      ?.addEventListener('click', () => this.togglePassword());

    this.dialog
      .querySelector<HTMLButtonElement>('[data-session-toggle]')
      ?.addEventListener('click', () => {
        this.onlyOneSession = !this.onlyOneSession;
        this.syncSessionToggle();
      });
  }

  private switchTab(tab: InspectorTab): void {
    if (!this.dialog) return;

    this.activeTab = tab;

    this.dialog.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((button) => {
      const active = button.dataset.tab === tab;
      button.setAttribute('aria-selected', String(active));
      button.classList.toggle('bg-primary/20', active);
      button.classList.toggle('text-primary', active);
      button.classList.toggle('font-semibold', active);
      button.classList.toggle('text-on-surface-variant', !active);
      button.classList.toggle('font-medium', !active);
    });

    this.dialog.querySelectorAll<HTMLElement>('[data-panel]').forEach((panel) => {
      panel.style.display = panel.dataset.panel === tab ? 'flex' : 'none';
    });
  }

  private togglePassword(): void {
    const input = this.dialog?.querySelector<HTMLInputElement>('[data-field="password"]');
    const iconHost = this.dialog?.querySelector<HTMLElement>('[data-password-icon]');
    const button = this.dialog?.querySelector<HTMLButtonElement>('[data-toggle-password]');
    if (!input) return;

    this.passwordVisible = input.type === 'password';
    input.type = this.passwordVisible ? 'text' : 'password';

    if (iconHost) {
      iconHost.innerHTML = icon(
        this.passwordVisible ? 'visibility_off' : 'visibility',
        'text-[18px]',
      );
    }

    button?.setAttribute(
      'aria-label',
      this.passwordVisible ? t('ppp.inspector.hidePassword') : t('ppp.inspector.showPassword'),
    );
  }

  private syncSessionToggle(): void {
    const button = this.dialog?.querySelector<HTMLButtonElement>('[data-session-toggle]');
    const knob = this.dialog?.querySelector<HTMLElement>('[data-session-knob]');
    if (!button) return;

    button.setAttribute('aria-checked', String(this.onlyOneSession));
    button.classList.toggle('bg-primary/30', this.onlyOneSession);
    button.classList.toggle('justify-end', this.onlyOneSession);
    button.classList.toggle('bg-surface-container-highest', !this.onlyOneSession);
    button.classList.toggle('justify-start', !this.onlyOneSession);

    if (knob) {
      knob.classList.toggle('bg-primary', this.onlyOneSession);
      knob.classList.toggle('bg-on-surface-variant', !this.onlyOneSession);
    }
  }

  private readValues(): PppSecretFormValues {
    const value = (field: string): string =>
      this.dialog?.querySelector<HTMLInputElement | HTMLSelectElement>(`[data-field="${field}"]`)
        ?.value ?? '';

    return {
      name: value('name').trim(),
      password: value('password'),
      service: asServiceType(value('service')),
      profile: value('profile') || 'default',
      localAddress: value('localAddress').trim(),
      remoteAddress: value('remoteAddress').trim(),
      callerId: value('callerId').trim(),
      comment: value('comment').trim(),
      rateLimit: value('rateLimit').trim(),
      sessionTimeout: value('sessionTimeout').trim(),
      idleTimeout: value('idleTimeout').trim(),
      onlyOneSession: this.onlyOneSession,
    };
  }

  private async submit(action: 'apply' | 'ok'): Promise<void> {
    if (this.busy) return;

    const values = this.readValues();
    if (!values.name) {
      this.setError(t('ppp.inspector.errorNameRequired'));
      this.dialog?.querySelector<HTMLElement>('[data-field="name"]')?.focus();
      return;
    }

    this.setError(null);
    this.setBusy(true);

    const previousMode = this.mode;
    const payload: PppInspectorSubmitPayload = {
      mode: this.mode,
      id: this.activeSecret?.id ?? null,
      values,
    };

    try {
      const saved = await this.callbacks.onSubmit(payload);

      if (saved) {
        this.activeSecret = saved;
        this.mode = 'edit';
        this.updateHeader();
      }

      toast(
        previousMode === 'create'
          ? t('ppp.inspector.toastCreated')
          : t('ppp.inspector.toastUpdated'),
      );
      this.setBusy(false);

      if (action === 'ok') {
        this.close();
        return;
      }
    } catch (error) {
      logger.error('[inspector] gagal menyimpan secret', error);
      const message = error instanceof Error ? error.message : t('ppp.inspector.errorSave');
      this.setError(message);
      toast(message, 'error');
    } finally {
      this.setBusy(false);
    }
  }

  private updateHeader(): void {
    if (!this.dialog || !this.activeSecret) return;

    const secret = this.activeSecret;
    const title = this.dialog.querySelector<HTMLElement>('[data-modal-title]');
    if (title) {
      title.textContent = t('ppp.inspector.title', { name: secret.name });
    }

    const status = this.dialog.querySelector<HTMLElement>('[data-modal-status]');
    if (!status) return;

    status.className = `px-1.5 py-0.5 rounded text-[9px] font-mono uppercase shrink-0 ${PPP_STATUS_CONFIG[secret.status].pillClass}`;
    status.textContent = secret.status;
  }

  private setBusy(busy: boolean): void {
    this.busy = busy;
    this.dialog?.setAttribute('aria-busy', String(busy));

    this.dialog
      ?.querySelectorAll<HTMLButtonElement>('[data-apply], [data-ok], [data-cancel], [data-close]')
      .forEach((button) => {
        button.disabled = busy;
      });
  }

  private setError(message: string | null): void {
    const errorEl = this.dialog?.querySelector<HTMLElement>('[data-error]');
    if (!errorEl) return;

    if (message) {
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
    } else {
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
    }
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (!this.root || this.root.getAttribute('aria-hidden') === 'true') return;

    if (event.key === 'Escape') {
      if (!this.busy) {
        event.preventDefault();
        this.close();
      }
      return;
    }

    if (event.key !== 'Tab' || !this.dialog) return;

    const focusable = Array.from(
      this.dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ),
    );

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private profileOptions(selectedProfile: string): string {
    const profiles = PROFILES.includes(selectedProfile) ? PROFILES : [selectedProfile, ...PROFILES];

    return profiles
      .map(
        (profile) =>
          `<option value="${escapeHtml(profile)}" ${profile === selectedProfile ? 'selected' : ''}>${escapeHtml(profile)}</option>`,
      )
      .join('');
  }
}

function escapeAttr(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
}
