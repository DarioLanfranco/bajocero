import { describe, it, expect } from 'vitest';
import { validateCheckoutForm } from './checkoutValidation';

describe('validateCheckoutForm', () => {
  it('passes valid retiro form', () => {
    const r = validateCheckoutForm({ name: 'Juan', deliveryMode: 'retiro', address: '', paymentMethod: 'efectivo' });
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual({});
  });

  it('passes valid envio form with address', () => {
    const r = validateCheckoutForm({ name: 'Juan', deliveryMode: 'envio', address: 'Av. Siempre Viva 123', paymentMethod: 'transferencia' });
    expect(r.valid).toBe(true);
  });

  it('fails when name is empty', () => {
    const r = validateCheckoutForm({ name: '', deliveryMode: 'retiro', address: '', paymentMethod: 'efectivo' });
    expect(r.valid).toBe(false);
    expect(r.errors.name).toBeDefined();
  });

  it('fails when envio has no address', () => {
    const r = validateCheckoutForm({ name: 'Juan', deliveryMode: 'envio', address: '', paymentMethod: 'efectivo' });
    expect(r.valid).toBe(false);
    expect(r.errors.address).toBeDefined();
  });

  it('trims whitespace from name', () => {
    const r = validateCheckoutForm({ name: '   ', deliveryMode: 'retiro', address: '', paymentMethod: 'efectivo' });
    expect(r.valid).toBe(false);
  });

  it('passes retiro even without address', () => {
    const r = validateCheckoutForm({ name: 'Juan', deliveryMode: 'retiro', address: '', paymentMethod: 'efectivo' });
    expect(r.valid).toBe(true);
  });
});
