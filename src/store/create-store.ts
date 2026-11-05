type Listener<T> = (state: Readonly<T>) => void;
type Updater<T> = Partial<T> | ((prev: Readonly<T>) => Partial<T>);

export interface Store<T> {
  getState(): Readonly<T>;
  setState(updater: Updater<T>): void;
  subscribe(listener: Listener<T>): () => void;
}

export function createStore<T extends object>(initial: T): Store<T> {
  let state: Readonly<T> = Object.freeze({ ...initial });
  const listeners = new Set<Listener<T>>();

  return {
    getState: (): Readonly<T> => state,
    setState(updater) {
      const next = typeof updater === 'function' ? updater(state) : updater;
      state = Object.freeze({ ...state, ...next });
      for (const listener of listeners) listener(state);
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
