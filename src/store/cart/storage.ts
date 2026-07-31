import type { CartItem } from '../../types/cart';
import { cartStorageSchema } from '../../schemas/cart';
import { safeStorage } from '../../utils/storage';
import type { StorageAdapter } from './types';

const STORAGE_KEY = 'bajocero-cart';
const STORAGE_VERSION = 1;

export const localStorageAdapter: StorageAdapter = {
  getItem(key) {
    return safeStorage.getItem(key);
  },
  setItem(key, value) {
    safeStorage.setItem(key, value);
  },
  removeItem(key) {
    safeStorage.removeItem(key);
  },
};

export function loadFromStorage(adapter: StorageAdapter): CartItem[] {
  try {
    const raw = adapter.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const result = cartStorageSchema.safeParse(parsed);
    if (!result.success) {
      if (import.meta.env.DEV) {
        console.warn('[cart] localStorage validation failed, clearing:', result.error.issues);
      }
      adapter.removeItem(STORAGE_KEY);
      return [];
    }
    return result.data.items;
  } catch {
    adapter.removeItem(STORAGE_KEY);
    return [];
  }
}

export function saveToStorage(adapter: StorageAdapter, items: CartItem[]): void {
  try {
    adapter.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, items }));
  } catch {
    /* storage full or unavailable */
  }
}
