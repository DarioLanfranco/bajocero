import { describe, it, expect } from 'vitest';
import {
  getPortionsNeeded,
  getEffectiveBudget,
  getMaxItems,
  calcularComboIdeal,
} from './idealEngine';
import type { Product } from '../types/Product';

const mockProducts: Product[] = [
  { id: '1', name: 'Milanesa de pollo', price: 7425, category: 'AL FUEGO', isAvailable: true, presentacion: 'Por 1 kg', tipoVenta: 'kg' },
  { id: '2', name: 'Milanesa de ternera', price: 5000, category: 'AL FUEGO', isAvailable: true, presentacion: 'Por 1 kg', tipoVenta: 'kg' },
  { id: '5', name: 'Salmón', price: 8000, category: 'AL FUEGO', isAvailable: true, presentacion: 'Por 1 kg', tipoVenta: 'kg' },
  { id: '55', name: 'Hamburguesa vegetal', price: 4500, category: 'VEGETARIANO', isAvailable: true, presentacion: '500g aprox.', tipoVenta: 'unidad' },
  { id: '70', name: 'Sorrentinos', price: 3500, category: 'PANADERÍA Y FRESCOS', isAvailable: true, presentacion: '500g aprox.', tipoVenta: 'unidad' },
  { id: '99', name: 'Fuera de rango', price: 9999, category: 'UNCLASSIFIED', isAvailable: true, presentacion: 'Por 1 kg', tipoVenta: 'kg' },
  { id: '3', name: 'No disponible', price: 3000, category: 'AL FUEGO', isAvailable: false, presentacion: 'Por 1 kg', tipoVenta: 'kg' },
];

describe('getPortionsNeeded', () => {
  it('returns 1 when comensales is null', () => {
    expect(getPortionsNeeded(null)).toBe(1);
  });

  it('returns ceil(comensales / 2) for valid values', () => {
    expect(getPortionsNeeded(1)).toBe(1);
    expect(getPortionsNeeded(2)).toBe(1);
    expect(getPortionsNeeded(3)).toBe(2);
    expect(getPortionsNeeded(4)).toBe(2);
    expect(getPortionsNeeded(5)).toBe(3);
    expect(getPortionsNeeded(6)).toBe(3);
  });
});

describe('getEffectiveBudget', () => {
  it('returns budget when provided', () => {
    expect(getEffectiveBudget(5000, null)).toBe(5000);
    expect(getEffectiveBudget(5000, 4)).toBe(5000);
  });

  it('returns null when both budget and comensales are null', () => {
    expect(getEffectiveBudget(null, null)).toBeNull();
  });

  it('returns default based on comensales', () => {
    expect(getEffectiveBudget(null, 1)).toBe(12000);
    expect(getEffectiveBudget(null, 2)).toBe(12000);
    expect(getEffectiveBudget(null, 3)).toBe(22000);
    expect(getEffectiveBudget(null, 4)).toBe(22000);
    expect(getEffectiveBudget(null, 5)).toBe(35000);
  });
});

describe('getMaxItems', () => {
  it('returns 4 when comensales is null', () => {
    expect(getMaxItems(null)).toBe(4);
  });

  it('returns correct max items based on comensales', () => {
    expect(getMaxItems(1)).toBe(2);
    expect(getMaxItems(2)).toBe(2);
    expect(getMaxItems(3)).toBe(3);
    expect(getMaxItems(4)).toBe(3);
    expect(getMaxItems(5)).toBe(4);
    expect(getMaxItems(6)).toBe(4);
  });
});

describe('calcularComboIdeal', () => {
  it('returns null when no products match any active group', () => {
    const result = calcularComboIdeal({
      products: [{ ...mockProducts[5] }], // only PLU 99, outside all ranges
      budget: null,
      comensales: null,
      intention: 'variado',
    });
    expect(result).toBeNull();
  });

  it('returns null when no available products match', () => {
    const result = calcularComboIdeal({
      products: [mockProducts[6]], // PLU 3, not available
      budget: null,
      comensales: null,
      intention: 'variado',
    });
    expect(result).toBeNull();
  });

  it('picks items from available products matching intention groups', () => {
    const result = calcularComboIdeal({
      products: mockProducts,
      budget: null,
      comensales: null,
      intention: 'variado',
    });
    expect(result).not.toBeNull();
    expect(result!.items.length).toBeGreaterThan(0);
    // All picked items must be available
    result!.items.forEach((item) => {
      expect(item.product.isAvailable).toBe(true);
    });
  });

  it('limits items by maxItems based on comensales', () => {
    const result = calcularComboIdeal({
      products: mockProducts,
      budget: null,
      comensales: 2, // maxItems = 2
      intention: 'variado',
    });
    expect(result).not.toBeNull();
    expect(result!.items.length).toBeLessThanOrEqual(2);
  });

  it('respects budget constraint', () => {
    const result = calcularComboIdeal({
      products: mockProducts,
      budget: 5000,
      comensales: null,
      intention: 'variado',
    });
    expect(result).not.toBeNull();
    expect(result!.total).toBeLessThanOrEqual(5000);
    expect(result!.budgetRemaining).toBe(5000 - result!.total);
  });

  it('calculates budgetRemaining correctly', () => {
    const result = calcularComboIdeal({
      products: mockProducts,
      budget: 10000,
      comensales: null,
      intention: 'variado',
    });
    expect(result).not.toBeNull();
    expect(result!.budgetRemaining).toBeGreaterThanOrEqual(0);
    expect(result!.budgetRemaining).toBeLessThanOrEqual(10000);
  });

  it('sets budgetRemaining to null when no budget provided and no default applies', () => {
    const result = calcularComboIdeal({
      products: mockProducts,
      budget: null,
      comensales: null,
      intention: 'variado',
    });
    expect(result).not.toBeNull();
    expect(result!.budgetRemaining).toBeNull();
  });

  it('filters by intention group — rapido only picks al-fuego and panaderia-frescos', () => {
    const result = calcularComboIdeal({
      products: mockProducts,
      budget: null,
      comensales: null,
      intention: 'rapido',
    });
    expect(result).not.toBeNull();
    // al-fuego range: [1, 29], panaderia-frescos range: [60, 76]
    // mockProducts with PLUs 1, 2, 5 (al-fuego) and 70 (panaderia-frescos)
    const pluIds = result!.items.map((i) => Number(i.product.id));
    const allInRapido = pluIds.every((plu) => (plu >= 1 && plu <= 29) || (plu >= 60 && plu <= 76));
    expect(allInRapido).toBe(true);
  });

  it('saludable picks only vegetariano (49-59) and verduras (99-107) items', () => {
    const result = calcularComboIdeal({
      products: mockProducts,
      budget: null,
      comensales: null,
      intention: 'saludable',
    });
    expect(result).not.toBeNull();
    expect(result!.items.length).toBeGreaterThan(0);
    const pluIds = result!.items.map((i) => Number(i.product.id));
    const allHealthy = pluIds.every((plu) => (plu >= 49 && plu <= 59) || (plu >= 99 && plu <= 107));
    expect(allHealthy).toBe(true);
  });

  it('includePostre adds a Franui (110-111) item when budget allows', () => {
    const products: Product[] = [
      { id: '2', name: 'Milanesa', price: 4000, category: 'AL FUEGO', isAvailable: true, tipoVenta: 'kg' },
      { id: '110', name: 'Franui chocolate', price: 5000, category: 'POSTRES', isAvailable: true, tipoVenta: 'unidad' },
    ];
    const result = calcularComboIdeal({
      products,
      budget: 10000,
      comensales: null,
      intention: 'variado',
      includePostre: true,
    });
    expect(result).not.toBeNull();
    const postre = result!.items.find((i) => i.product.id === '110');
    expect(postre).toBeDefined();
    expect(postre!.quantity).toBe(1);
  });

  it('includePostre does not add the dessert when budget is tight', () => {
    const products: Product[] = [
      { id: '2', name: 'Milanesa', price: 9000, category: 'AL FUEGO', isAvailable: true, tipoVenta: 'kg' },
      { id: '110', name: 'Franui chocolate', price: 5000, category: 'POSTRES', isAvailable: true, tipoVenta: 'unidad' },
    ];
    const result = calcularComboIdeal({
      products,
      budget: 9000,
      comensales: null,
      intention: 'variado',
      includePostre: true,
    });
    expect(result).not.toBeNull();
    expect(result!.total).toBeLessThanOrEqual(9000);
    const postre = result!.items.find((i) => i.product.id === '110');
    expect(postre).toBeUndefined();
  });

  it('includeFrutas adds a frutas (89-97) item sized to the remaining budget', () => {
    const products: Product[] = [
      { id: '2', name: 'Milanesa', price: 3000, category: 'AL FUEGO', isAvailable: true, tipoVenta: 'kg' },
      { id: '90', name: 'Fruta', price: 2000, category: 'FRUTAS', isAvailable: true, tipoVenta: 'unidad' },
    ];
    const result = calcularComboIdeal({
      products,
      budget: 9000,
      comensales: null,
      intention: 'variado',
      includeFrutas: true,
    });
    expect(result).not.toBeNull();
    const fruta = result!.items.find((i) => i.product.id === '90');
    expect(fruta).toBeDefined();
    expect(fruta!.quantity).toBeGreaterThanOrEqual(1);
    expect(result!.total).toBeLessThanOrEqual(9000);
  });

  it('prioritizes offerLabel products within each group', () => {
    const productsWithOffer: Product[] = [
      { id: '10', name: 'Oferta', price: 10000, category: 'AL FUEGO', isAvailable: true, offerLabel: 'OFERTA', presentacion: 'Por 1 kg', tipoVenta: 'kg' },
      { id: '11', name: 'Caro pero sin oferta', price: 5000, category: 'AL FUEGO', isAvailable: true, presentacion: 'Por 1 kg', tipoVenta: 'kg' },
      { id: '12', name: 'Barato sin oferta', price: 3000, category: 'AL FUEGO', isAvailable: true, presentacion: 'Por 1 kg', tipoVenta: 'kg' },
    ];
    const result = calcularComboIdeal({
      products: productsWithOffer,
      budget: null,
      comensales: null,
      intention: 'variado',
    });
    expect(result).not.toBeNull();
    expect(result!.items[0].product.offerLabel).toBe('OFERTA');
  });
});
