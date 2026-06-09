export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

type Listener = (items: CartItem[]) => void;

export interface CartStore {
  readonly items: CartItem[];
  readonly count: number;
  subscribe(fn: Listener): () => void;
  addItem(item: CartItem): void;
  removeItem(productId: string): void;
  updateQuantity(productId: string, quantity: number): void;
  clear(): void;
}

function createCartStore(): CartStore {
  let items: CartItem[] = [];
  const listeners = new Set<Listener>();

  function notify(): void {
    const snapshot = [...items];
    listeners.forEach((fn) => fn(snapshot));
  }

  return {
    get items(): CartItem[] {
      return [...items];
    },

    get count(): number {
      return items.reduce((sum, item) => sum + item.quantity, 0);
    },

    subscribe(fn: Listener): () => void {
      listeners.add(fn);
      fn([...items]);
      return () => {
        listeners.delete(fn);
      };
    },

    addItem(item: CartItem): void {
      const existing = items.find((i) => i.productId === item.productId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        items.push({ ...item });
      }
      notify();
    },

    removeItem(productId: string): void {
      items = items.filter((i) => i.productId !== productId);
      notify();
    },

    updateQuantity(productId: string, quantity: number): void {
      const item = items.find((i) => i.productId === productId);
      if (item) {
        item.quantity = Math.max(0, quantity);
        if (item.quantity === 0) {
          items = items.filter((i) => i.productId !== productId);
        }
        notify();
      }
    },

    clear(): void {
      items = [];
      notify();
    },
  };
}

export const cartStore = createCartStore();
