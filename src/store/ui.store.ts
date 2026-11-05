import { createStore } from './create-store';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastMessage {
  message: string;
  tone: ToastTone;
}

interface UiState {
  drawerOpen: boolean;
  toast: ToastMessage | null;
}

export const uiStore = createStore<UiState>({ drawerOpen: false, toast: null });

let toastTimer: number | null = null;

export function openDrawer(): void {
  uiStore.setState({ drawerOpen: true });
}

export function closeDrawer(): void {
  uiStore.setState({ drawerOpen: false });
}

export function toast(message: string, tone: ToastTone = 'success'): void {
  if (toastTimer !== null) window.clearTimeout(toastTimer);

  uiStore.setState({ toast: { message, tone } });
  toastTimer = window.setTimeout(() => {
    toastTimer = null;
    uiStore.setState({ toast: null });
  }, 2400);
}
