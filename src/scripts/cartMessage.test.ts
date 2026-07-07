import { describe, it, expect } from 'vitest';
import { buildWhatsAppMessage, buildWhatsAppUrl } from './cartMessage';
import type { WhatsAppMessageData } from './cartMessage';

function makeData(overrides?: Partial<WhatsAppMessageData>): WhatsAppMessageData {
  return {
    name: 'Test User',
    items: [
      { productId: '1', name: 'Milanesa', price: 5000, quantity: 2 },
      { productId: '2', name: 'Empanadas', price: 3600, quantity: 1 },
    ],
    deliveryMode: 'retiro',
    deliveryAddress: '',
    paymentMethod: 'efectivo',
    subtotal: 13600,
    ...overrides,
  };
}

describe('buildWhatsAppMessage', () => {
  it('builds a message for retiro with efectivo', () => {
    const msg = buildWhatsAppMessage(makeData());
    expect(msg).toContain('Nuevo Pedido Web');
    expect(msg).toContain('Test User');
    expect(msg).toContain('Retiro en Local');
    expect(msg).toContain('Efectivo');
    expect(msg).toContain('2x Milanesa');
    expect(msg).toContain('1x Empanadas');
    expect(msg).toContain('TOTAL COMPRA');
    expect(msg).toContain('$13.600');
  });

  it('builds a message for envio with address', () => {
    const msg = buildWhatsAppMessage(makeData({ deliveryMode: 'envio', deliveryAddress: 'Av. Siempre Viva 123' }));
    expect(msg).toContain('Envio por cadeteria');
    expect(msg).toContain('Av. Siempre Viva 123');
  });

  it('shows transferencia payment label for envio', () => {
    const msg = buildWhatsAppMessage(makeData({ deliveryMode: 'envio', paymentMethod: 'transferencia' }));
    expect(msg).toContain('Transferencia');
    expect(msg).not.toContain('Efectivo al Cadete');
  });

  it('shows efectivo al cadete for envio + efectivo', () => {
    const msg = buildWhatsAppMessage(makeData({ deliveryMode: 'envio', paymentMethod: 'efectivo' }));
    expect(msg).toContain('Efectivo al Cadete');
  });

  it('handles empty items gracefully', () => {
    const msg = buildWhatsAppMessage(makeData({ items: [], subtotal: 0 }));
    expect(msg).toContain('Sin productos');
  });

  it('filters out invalid items', () => {
    const msg = buildWhatsAppMessage(makeData({
      items: [
        { productId: '1', name: 'Valid', price: 100, quantity: 1 },
        { productId: '2', name: 'Zero price', price: 0, quantity: 1 },
        { productId: '3', name: 'Zero qty', price: 100, quantity: 0 },
      ],
      subtotal: 100,
    }));
    expect(msg).toContain('1x Valid');
    expect(msg).not.toContain('Zero price');
    expect(msg).not.toContain('Zero qty');
  });

  it('sanitizes empty name to fallback', () => {
    const msg = buildWhatsAppMessage(makeData({ name: '' }));
    expect(msg).toContain('Sin nombre');
    expect(msg).not.toContain('Cliente:  ');
  });
});

describe('buildWhatsAppUrl', () => {
  it('builds a valid whatsapp URL', () => {
    const url = buildWhatsAppUrl('543584201263', 'Hola mundo');
    expect(url).toContain('https://api.whatsapp.com/send');
    expect(url).toContain('phone=543584201263');
    expect(url).toContain(encodeURIComponent('Hola mundo'));
  });

  it('strips non-digit characters from phone', () => {
    const url = buildWhatsAppUrl('+54 358 4201263', 'test');
    expect(url).toContain('phone=543584201263');
  });
});
