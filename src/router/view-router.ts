import { VIEW_META } from '@config/navigation.config';
import { createStore } from '@store/create-store';
import type { ViewName, ViewParams } from '@types';
import { logger } from '@utils/logger';
import type { View } from '@views/base.view';

export type ViewRenderer = (container: HTMLElement, params: ViewParams) => View;

interface RouterState {
  current: ViewName;
  params: ViewParams;
}

export class ViewRouter {
  private readonly store = createStore<RouterState>({ current: 'dashboard', params: {} });
  private readonly renderers = new Map<ViewName, ViewRenderer>();
  private container: HTMLElement | null = null;
  private currentView: View | null = null;

  bind(container: HTMLElement): void {
    this.container = container;
  }

  register(view: ViewName, renderer: ViewRenderer): void {
    this.renderers.set(view, renderer);
  }

  navigate(view: ViewName, params: ViewParams = {}): void {
    const renderer = this.renderers.get(view);
    if (!renderer) {
      logger.warn(`[router] renderer not registered for "${view}"`);
      return;
    }

    this.currentView?.destroy();
    this.currentView = null;

    this.store.setState({ current: view, params });

    if (!this.container) {
      logger.warn('[router] container is not bound');
      return;
    }

    this.container.innerHTML = '';
    this.currentView = renderer(this.container, params);
    window.scrollTo(0, 0);
  }

  get current(): ViewName {
    return this.store.getState().current;
  }

  get currentParams(): Readonly<ViewParams> {
    return this.store.getState().params;
  }

  get currentTitle(): string {
    return VIEW_META[this.current].title;
  }

  subscribe(listener: (view: ViewName, title: string, params: ViewParams) => void): () => void {
    return this.store.subscribe((state) => {
      listener(state.current, VIEW_META[state.current].title, state.params);
    });
  }
}
