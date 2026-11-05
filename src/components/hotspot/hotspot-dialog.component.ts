import { escapeHtml } from '@utils/format';
import { icon } from '@components/ui/icon';
import type {
  HotspotGenerateInput,
  HotspotProfile,
  HotspotProfileInput,
  HotspotUser,
  HotspotUserInput,
} from '@types';

type DialogMode = 'user' | 'profile' | 'generate';
type DialogSubmit =
  | { mode: 'user'; id?: string; values: HotspotUserInput }
  | { mode: 'profile'; id?: string; values: HotspotProfileInput }
  | { mode: 'generate'; values: HotspotGenerateInput };

export interface HotspotDialogCallbacks {
  onSubmit: (data: DialogSubmit) => Promise<void>;
}

const INPUT_CLASS =
  'w-full h-9 px-3 rounded-lg bg-surface-container text-xs text-on-surface placeholder:text-on-surface-variant/60 ring-1 ring-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary/60';
const LABEL_CLASS = 'text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant';

function field(
  label: string,
  name: string,
  value: string,
  options: {
    required?: boolean;
    type?: string;
    min?: number;
    max?: number;
    placeholder?: string;
  } = {},
): string {
  const type = options.type ?? 'text';
  return `
    <label class="flex flex-col gap-1.5">
      <span class="${LABEL_CLASS}">${escapeHtml(label)}</span>
      <input class="${INPUT_CLASS}" name="${name}" type="${type}" value="${escapeHtml(value)}"
        ${options.required ? 'required' : ''} ${options.min !== undefined ? `min="${options.min}"` : ''}
        ${options.max !== undefined ? `max="${options.max}"` : ''}
        ${options.placeholder ? `placeholder="${escapeHtml(options.placeholder)}"` : ''} />
    </label>`;
}

function selectField(
  label: string,
  name: string,
  options: Array<{ value: string; label: string }>,
  selected: string,
): string {
  return `
    <label class="flex flex-col gap-1.5">
      <span class="${LABEL_CLASS}">${escapeHtml(label)}</span>
      <select class="${INPUT_CLASS}" name="${name}">
        ${options
          .map(
            (option) =>
              `<option value="${escapeHtml(option.value)}" ${option.value === selected ? 'selected' : ''}>${escapeHtml(option.label)}</option>`,
          )
          .join('')}
      </select>
    </label>`;
}

function checkboxField(label: string, name: string, checked: boolean): string {
  return `
    <label class="flex min-h-9 items-center gap-2 rounded-lg bg-surface-container/70 px-3 text-xs text-on-surface">
      <input name="${name}" type="checkbox" class="size-3.5 accent-primary" ${checked ? 'checked' : ''} />
      <span>${escapeHtml(label)}</span>
    </label>`;
}

function options(values: string[], selected: string): Array<{ value: string; label: string }> {
  const unique = [...new Set([selected, ...values].filter(Boolean))];
  return unique.map((value) => ({ value, label: value }));
}

function readText(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function readNumber(data: FormData, name: string): number {
  const value = Number(readText(data, name));
  return Number.isFinite(value) ? value : 0;
}

function isExpiryMode(value: string): value is HotspotProfile['expiryMode'] {
  return ['none', 'remove', 'notice', 'remove-record', 'notice-record'].includes(value);
}

export class HotspotDialogComponent {
  private dialog: HTMLDialogElement | null = null;
  private currentMode: DialogMode | null = null;
  private currentId: string | undefined;
  private busy = false;
  private lastFocus: HTMLElement | null = null;

  constructor(private readonly callbacks: HotspotDialogCallbacks) {}

  mount(parent: HTMLElement = document.body): this {
    if (this.dialog) return this;

    const dialog = document.createElement('dialog');
    dialog.className =
      'hotspot-dialog w-[min(34rem,calc(100vw-1.5rem))] max-h-[90vh] overflow-hidden rounded-2xl bg-surface-container-high ring-1 ring-outline-variant/30 p-0 text-on-surface shadow-2xl backdrop:bg-background/80 backdrop:backdrop-blur-md';
    dialog.setAttribute('aria-labelledby', 'hotspot-dialog-title');
    parent.appendChild(dialog);
    this.dialog = dialog;

    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) this.close();
    });
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      this.close();
    });
    dialog.addEventListener('submit', (event) => {
      event.preventDefault();
      const form = event.target;
      if (form instanceof HTMLFormElement) void this.submit(form);
    });
    dialog.addEventListener('click', (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
        '[data-dialog-close]',
      );
      if (button) this.close();
    });

    return this;
  }

  openUser(user: HotspotUser | null, profiles: HotspotProfile[], servers: string[]): void {
    const selectedProfile = user?.profile ?? profiles[0]?.name ?? 'default';
    const selectedServer = user?.server ?? servers[0] ?? 'all';
    const currentUser = user;
    this.open(
      'user',
      user?.id,
      user ? `Edit User · ${user.name}` : 'Tambah Hotspot User',
      `
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        ${selectField('Server', 'server', options(servers, selectedServer), selectedServer)}
        ${selectField(
          'Profile',
          'profile',
          options(
            profiles.map((profile) => profile.name),
            selectedProfile,
          ),
          selectedProfile,
        )}
        ${field('Username', 'name', user?.name ?? '', { required: true })}
        ${field('Password', 'password', user?.password ?? '', { required: true })}
        ${field('MAC Address / Lock User', 'macAddress', user?.macAddress ?? 'auto')}
        ${field('Limit Uptime', 'limitUptime', user?.limitUptime ?? '3h', { placeholder: 'Contoh: 3h atau 45m' })}
        ${field('Limit Data', 'limitBytesTotal', user?.limitBytesTotal ?? '1G', { placeholder: 'Contoh: 1G atau 500M' })}
        ${field('Comment', 'comment', user?.comment ?? '')}
      </div>
      ${
        currentUser
          ? `<section class="mt-4 rounded-xl bg-surface-container/70 p-3">
              <h3 class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Pemakaian saat ini</h3>
              <dl class="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                <div><dt class="text-on-surface-variant">Uptime</dt><dd class="mt-0.5 font-mono">${escapeHtml(currentUser.uptime)}</dd></div>
                <div><dt class="text-on-surface-variant">Bytes In / Out</dt><dd class="mt-0.5 font-mono">${escapeHtml(currentUser.bytesIn)} / ${escapeHtml(currentUser.bytesOut)}</dd></div>
              </dl>
            </section>`
          : ''
      }
      <p class="mt-3 text-[10px] text-on-surface-variant">Username harus unik. Password hanya tersimpan di data mock lokal.</p>`,
    );
  }

  openProfile(profile: HotspotProfile | null): void {
    const selectedProfile = profile ?? {
      id: '',
      name: '',
      sharedUsers: 1,
      rateLimit: '10M/10M',
      expiryMode: 'none' as const,
      validity: '',
      price: 0,
      sellingPrice: 0,
      addressPool: 'hs-pool',
      parentQueue: 'none',
      lockUser: false,
      lockServer: false,
    };
    const expiryModes = [
      { value: 'none', label: 'Tidak ada' },
      { value: 'remove', label: 'Hapus saat kedaluwarsa' },
      { value: 'notice', label: 'Tandai kedaluwarsa' },
      { value: 'remove-record', label: 'Hapus & catat' },
      { value: 'notice-record', label: 'Tandai & catat' },
    ];

    this.open(
      'profile',
      profile?.id,
      profile ? `Edit Profile · ${profile.name}` : 'Tambah User Profile',
      `
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        ${field('Nama profile', 'name', selectedProfile.name, { required: true })}
        ${field('Shared users', 'sharedUsers', String(selectedProfile.sharedUsers), { type: 'number', min: 1, max: 999 })}
        ${field('Rate limit', 'rateLimit', selectedProfile.rateLimit, { placeholder: 'Contoh: 10M/10M' })}
        ${field('Address pool', 'addressPool', selectedProfile.addressPool)}
        ${field('Parent queue', 'parentQueue', selectedProfile.parentQueue)}
        ${selectField('Expiry mode', 'expiryMode', expiryModes, selectedProfile.expiryMode)}
        ${field('Validity', 'validity', selectedProfile.validity, { placeholder: 'Contoh: 1d atau 12h' })}
        ${field('Harga modal', 'price', String(selectedProfile.price), { type: 'number', min: 0 })}
        ${field('Harga jual', 'sellingPrice', String(selectedProfile.sellingPrice), { type: 'number', min: 0 })}
      </div>
      <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        ${checkboxField('Kunci ke MAC user', 'lockUser', selectedProfile.lockUser)}
        ${checkboxField('Kunci ke server', 'lockServer', selectedProfile.lockServer)}
      </div>`,
    );
  }

  openGenerate(profiles: HotspotProfile[], servers: string[]): void {
    const profile = profiles[0]?.name ?? 'default';
    const server = servers[0] ?? 'all';
    this.open(
      'generate',
      undefined,
      'Generate Voucher',
      `
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        ${field('Jumlah voucher', 'quantity', '10', { type: 'number', min: 1, max: 100, required: true })}
        ${selectField('Server', 'server', options(servers, server), server)}
        ${selectField(
          'Profile',
          'profile',
          options(
            profiles.map((item) => item.name),
            profile,
          ),
          profile,
        )}
        ${selectField(
          'Mode username',
          'usernameMode',
          [
            { value: 'voucher', label: 'Username = password' },
            { value: 'username-password', label: 'Username & password' },
          ],
          'voucher',
        )}
        ${field('Panjang username/password', 'nameLength', '6', { type: 'number', min: 4, max: 8, required: true })}
        ${field('Prefix', 'prefix', '')}
        ${selectField(
          'Karakter',
          'characterSet',
          [
            { value: 'mixed', label: 'Campuran huruf & angka' },
            { value: 'lower', label: 'Huruf kecil & angka' },
            { value: 'upper', label: 'Huruf besar & angka' },
            { value: 'digits', label: 'Angka saja' },
          ],
          'mixed',
        )}
        ${field('Limit uptime', 'limitUptime', '2h')}
        ${field('Limit data', 'limitBytesTotal', '1G')}
        ${field('Comment', 'comment', 'vc-generated')}
      </div>
      <p class="mt-3 text-[10px] text-on-surface-variant">Voucher dibuat sebagai data mock lokal, maksimal 100 akun per batch.</p>`,
    );
  }

  private open(mode: DialogMode, id: string | undefined, title: string, body: string): void {
    this.mount();
    if (!this.dialog) throw new Error('Dialog Hotspot belum siap');

    this.lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.currentMode = mode;
    this.currentId = id;
    this.busy = false;
    this.dialog.innerHTML = `
      <form class="flex max-h-[90vh] flex-col" novalidate>
        <header class="flex items-start justify-between gap-3 border-b border-outline-variant/15 px-4 py-3">
          <div>
            <h2 id="hotspot-dialog-title" class="text-sm font-bold font-headline">${escapeHtml(title)}</h2>
            <p class="mt-0.5 text-[10px] text-on-surface-variant">${mode === 'generate' ? 'Buat beberapa voucher sekaligus' : 'Data simulasi Hotspot'}</p>
          </div>
          <button type="button" data-dialog-close aria-label="Tutup dialog" class="flex size-8 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface">
            ${icon('close', 'text-[16px]')}
          </button>
        </header>
        <div class="flex flex-col gap-3 overflow-y-auto p-4">
          ${body}
          <p data-dialog-error role="alert" class="hidden rounded-lg bg-error-container/40 px-3 py-2 text-[11px] text-error"></p>
        </div>
        <footer class="flex items-center justify-end gap-2 border-t border-outline-variant/15 px-4 py-3">
          <button type="button" data-dialog-close class="h-8 rounded-lg px-3 text-xs font-medium text-on-surface-variant hover:bg-surface-container">Batal</button>
          <button type="submit" class="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-on-primary transition-transform active:scale-95">
            ${icon(mode === 'generate' ? 'confirmation_number' : 'save', 'text-[14px]')}
            <span data-submit-label>${mode === 'generate' ? 'Generate' : 'Simpan'}</span>
          </button>
        </footer>
      </form>`;
    this.dialog.showModal();
    this.dialog.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
    this.dialog.querySelector<HTMLInputElement>('input[name="quantity"]')?.focus();
  }

  private async submit(form: HTMLFormElement): Promise<void> {
    if (!this.dialog || !this.currentMode || this.busy) return;
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    let submit: DialogSubmit;
    if (this.currentMode === 'user') {
      submit = {
        mode: 'user',
        ...(this.currentId ? { id: this.currentId } : {}),
        values: {
          name: readText(data, 'name'),
          password: readText(data, 'password'),
          server: readText(data, 'server'),
          profile: readText(data, 'profile'),
          macAddress: readText(data, 'macAddress') || 'auto',
          limitUptime: readText(data, 'limitUptime') || 'unlimited',
          limitBytesTotal: readText(data, 'limitBytesTotal') || 'unlimited',
          comment: readText(data, 'comment'),
          disabled: false,
        },
      };
    } else if (this.currentMode === 'profile') {
      const expiryMode = readText(data, 'expiryMode');
      if (!isExpiryMode(expiryMode)) {
        this.showError('Expiry mode tidak valid');
        return;
      }
      submit = {
        mode: 'profile',
        ...(this.currentId ? { id: this.currentId } : {}),
        values: {
          name: readText(data, 'name'),
          sharedUsers: Math.max(1, readNumber(data, 'sharedUsers')),
          rateLimit: readText(data, 'rateLimit') || 'unlimited',
          expiryMode,
          validity: readText(data, 'validity'),
          price: Math.max(0, readNumber(data, 'price')),
          sellingPrice: Math.max(0, readNumber(data, 'sellingPrice')),
          addressPool: readText(data, 'addressPool') || 'none',
          parentQueue: readText(data, 'parentQueue') || 'none',
          lockUser: data.has('lockUser'),
          lockServer: data.has('lockServer'),
        },
      };
    } else {
      const usernameMode = readText(data, 'usernameMode');
      const characterSet = readText(data, 'characterSet');
      if (usernameMode !== 'voucher' && usernameMode !== 'username-password') {
        this.showError('Mode username tidak valid');
        return;
      }
      if (
        characterSet !== 'lower' &&
        characterSet !== 'upper' &&
        characterSet !== 'mixed' &&
        characterSet !== 'digits'
      ) {
        this.showError('Pilihan karakter tidak valid');
        return;
      }
      submit = {
        mode: 'generate',
        values: {
          quantity: Math.min(100, Math.max(1, Math.floor(readNumber(data, 'quantity')))),
          server: readText(data, 'server'),
          profile: readText(data, 'profile'),
          usernameMode,
          nameLength: Math.min(8, Math.max(4, Math.floor(readNumber(data, 'nameLength')))),
          prefix: readText(data, 'prefix'),
          characterSet,
          limitUptime: readText(data, 'limitUptime'),
          limitBytesTotal: readText(data, 'limitBytesTotal'),
          comment: readText(data, 'comment'),
        },
      };
    }

    this.busy = true;
    this.showError('');
    const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const submitLabel = form.querySelector<HTMLElement>('[data-submit-label]');
    if (submitButton) submitButton.disabled = true;
    if (submitLabel) submitLabel.textContent = 'Menyimpan...';

    try {
      await this.callbacks.onSubmit(submit);
      this.close();
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Tidak dapat menyimpan data Hotspot');
      this.busy = false;
      if (submitButton) submitButton.disabled = false;
      if (submitLabel)
        submitLabel.textContent = this.currentMode === 'generate' ? 'Generate' : 'Simpan';
    }
  }

  private showError(message: string): void {
    const error = this.dialog?.querySelector<HTMLElement>('[data-dialog-error]');
    if (!error) return;
    error.textContent = message;
    error.classList.toggle('hidden', message.length === 0);
  }

  private close(): void {
    if (!this.dialog?.open) return;
    this.dialog.close();
    this.currentMode = null;
    this.currentId = undefined;
    if (this.lastFocus?.isConnected) this.lastFocus.focus();
    this.lastFocus = null;
  }

  destroy(): void {
    if (this.dialog?.open) this.dialog.close();
    this.dialog?.remove();
    this.dialog = null;
  }
}
