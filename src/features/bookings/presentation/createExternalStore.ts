export type ExternalStore<T> = {
  get: () => T;
  set: (next: T) => void;
  /** Stable reference, ready for `useSyncExternalStore`. */
  subscribe: (listener: () => void) => () => void;
  /** Restores the initial value (used by tests). */
  reset: () => void;
};

/**
 * Module-level in-memory store: the mock layer has no backend, so state lives until a page
 * reload and survives tab switches inside the SPA (panels unmount, the store does not).
 */
export function createExternalStore<T>(initial: T): ExternalStore<T> {
  let value = initial;
  const listeners = new Set<() => void>();

  function set(next: T): void {
    value = next;
    listeners.forEach((listener) => listener());
  }

  return {
    get: () => value,
    set,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    reset: () => set(initial),
  };
}
