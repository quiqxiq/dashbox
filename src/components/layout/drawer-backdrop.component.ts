import { closeDrawer, uiStore } from '@store/ui.store';

export class DrawerBackdropComponent {
  mount(parent: HTMLElement): this {
    const el = document.createElement('div');
    el.className =
      'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-opacity duration-300 opacity-0 pointer-events-none';
    el.setAttribute('aria-hidden', 'true');
    parent.appendChild(el);

    el.addEventListener('click', () => closeDrawer());

    uiStore.subscribe((state) => {
      el.classList.toggle('opacity-0', !state.drawerOpen);
      el.classList.toggle('pointer-events-none', !state.drawerOpen);
      document.body.classList.toggle('overflow-hidden', state.drawerOpen);
    });

    return this;
  }
}
