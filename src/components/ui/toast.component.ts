import { uiStore } from '@store/ui.store';
import { icon } from '@components/ui/icon';

const TONE_STYLE = {
  success: { icon: 'verified', text: 'text-primary', ring: 'ring-primary/25' },
  error: { icon: 'error', text: 'text-error', ring: 'ring-error/30' },
  info: { icon: 'info', text: 'text-secondary', ring: 'ring-secondary/30' },
} as const;

export class ToastComponent {
  mount(parent: HTMLElement): this {
    const el = document.createElement('div');
    el.className =
      'fixed top-[5.5rem] left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 opacity-0 pointer-events-none -translate-y-2 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-surface-container-high/95 backdrop-blur-xl ring-1 ring-primary/25 shadow-2xl shadow-black/50 text-xs font-medium text-primary';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    el.innerHTML = `
      <span data-toast-icon class="inline-flex">${icon('verified', 'text-sm')}</span>
      <span data-toast-message></span>`;
    parent.appendChild(el);

    uiStore.subscribe((state) => {
      const currentToast = state.toast;

      if (!currentToast) {
        el.classList.add('opacity-0', 'pointer-events-none', '-translate-y-2');
        el.classList.remove('opacity-100', 'translate-y-0');
        return;
      }

      const messageEl = el.querySelector<HTMLElement>('[data-toast-message]');
      if (messageEl) messageEl.textContent = currentToast.message;

      const iconEl = el.querySelector<HTMLElement>('[data-toast-icon]');
      const tone = TONE_STYLE[currentToast.tone];
      if (iconEl) iconEl.innerHTML = icon(tone.icon, 'text-sm');

      el.classList.remove('text-primary', 'text-error', 'text-secondary');
      el.classList.remove('ring-primary/25', 'ring-error/30', 'ring-secondary/30');
      el.classList.add(tone.text, tone.ring);

      el.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-2');
      el.classList.add('opacity-100', 'translate-y-0');
    });

    return this;
  }
}
