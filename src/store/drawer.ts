type Listener<T> = (value: T) => void;

function createStore<T>(initial: T) {
  let state = initial;
  const listeners = new Set<Listener<T>>();

  function get(): T {
    return state;
  }

  function set(next: T): void {
    if (state === next) return;
    state = next;
    listeners.forEach((fn) => fn(state));
  }

  function subscribe(fn: Listener<T>): () => void {
    listeners.add(fn);
    fn(state);
    return () => {
      listeners.delete(fn);
    };
  }

  return { get, set, subscribe };
}

export const drawerStore = createStore(false);

export function toggleDrawer(): void {
  drawerStore.set(!drawerStore.get());
}

export function openDrawer(): void {
  drawerStore.set(true);
}

export function closeDrawer(): void {
  drawerStore.set(false);
}
