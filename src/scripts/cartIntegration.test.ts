import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseCSVProducts } from '../data/csvProducts';
import type { CartStore } from '../store/cart';
import { buildWhatsAppMessage } from './cartMessage';

const CSV_FIXTURE = `PLU;PRODUCTOS;PRECIO;IMAGEN;STOCK;OFERTA;VENTA;CANTIDAD_POR_KG
1;Milanesa de pollo;7425;https://ik.imagekit.io/img.jpg;SI;;kg;
2;Milanesa de ternera;5000;;NO;;kg;
3;Pata muslo oferta x 3 kg;12600;;SI;OFERTA;unidad;`;

let cartStore: CartStore;

beforeEach(async () => {
  vi.resetModules();
  const mod = await import('../store/cart');
  cartStore = mod.createTestCartStore();
});

describe('CSV → Store → Message pipeline', () => {
  it('parses CSV and each product can be added to the store', () => {
    const products = parseCSVProducts(CSV_FIXTURE);
    expect(products.length).toBeGreaterThan(0);

    for (const p of products) {
      cartStore.addItem({
        productId: p.id,
        name: p.name,
        price: p.price,
        quantity: 1,
        presentacion: p.presentacion,
      });
    }

    expect(cartStore.items).toHaveLength(products.length);
    expect(cartStore.count).toBe(products.length);
  });

  it('builds WhatsApp message from store items', () => {
    const products = parseCSVProducts(CSV_FIXTURE);

    for (const p of products) {
      cartStore.addItem({
        productId: p.id,
        name: p.name,
        price: p.price,
        quantity: 2,
        presentacion: p.presentacion,
      });
    }

    const items = cartStore.items;
    const subtotal = cartStore.subtotal;

    const message = buildWhatsAppMessage({
      name: 'Test User',
      items,
      deliveryMode: 'retiro',
      deliveryAddress: '',
      paymentMethod: 'efectivo',
      subtotal,
    });

    expect(message).toContain('Milanesa de pollo');
    expect(message).toContain('Milanesa de ternera');
    expect(message).toContain('Pata muslo oferta x 3 kg');
    expect(message).toContain('Test User');
    expect(message).toContain('Retiro en Local');
    expect(message).toContain('TOTAL COMPRA');
  });

  it('handles empty store gracefully in message', () => {
    const message = buildWhatsAppMessage({
      name: 'No Items',
      items: [],
      deliveryMode: 'envio',
      deliveryAddress: 'Calle Falsa 123',
      paymentMethod: 'transferencia',
      subtotal: 0,
    });

    expect(message).toContain('No Items');
    expect(message).toContain('Envio por cadeteria');
    expect(message).toContain('Transferencia');
    expect(message).toContain('Sin productos');
  });

  it('combo ideal items can be added to store and messaged', () => {
    const products = parseCSVProducts(CSV_FIXTURE);
    const available = products.filter((p) => p.isAvailable);

    for (const p of available) {
      cartStore.addItem({
        productId: p.id,
        name: p.name,
        price: p.price,
        quantity: 1,
        presentacion: p.presentacion,
      });
    }

    const message = buildWhatsAppMessage({
      name: 'Combo Test',
      items: cartStore.items,
      deliveryMode: 'retiro',
      deliveryAddress: '',
      paymentMethod: 'efectivo',
      subtotal: cartStore.subtotal,
    });

    expect(message).toContain('Combo Test');
    expect(cartStore.items.length).toBeGreaterThan(0);
  });
});
