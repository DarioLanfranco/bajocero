import { describe, it, expect, beforeEach, vi } from 'vitest';

beforeEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

function createCheckoutElements() {
  document.body.innerHTML = `
    <input id="checkout-name" />
    <div id="checkout-delivery">
      <input type="radio" name="delivery" value="retiro" checked />
      <input type="radio" name="delivery" value="envio" />
    </div>
    <div id="checkout-payment">
      <input type="radio" name="payment" value="efectivo" checked />
      <input type="radio" name="payment" value="transferencia" />
    </div>
    <input id="checkout-address" />
    <div id="checkout-address-wrapper"></div>
    <div id="checkout-delivery-info"></div>
    <div id="checkout-payment-info"></div>
    <button id="send-btn"></button>
    <button id="back-btn"></button>
  `;
  return {
    checkoutName: document.getElementById('checkout-name') as HTMLInputElement,
    checkoutDelivery: document.getElementById('checkout-delivery') as HTMLElement,
    checkoutPayment: document.getElementById('checkout-payment') as HTMLElement,
    checkoutAddress: document.getElementById('checkout-address') as HTMLInputElement,
    checkoutAddressWrapper: document.getElementById('checkout-address-wrapper') as HTMLElement,
    checkoutDeliveryInfo: document.getElementById('checkout-delivery-info') as HTMLElement,
    checkoutPaymentInfo: document.getElementById('checkout-payment-info') as HTMLElement,
    sendBtn: document.getElementById('send-btn') as HTMLElement,
    backBtn: document.getElementById('back-btn') as HTMLElement,
  };
}

describe('createCheckoutController', () => {
  it('creates a controller with init method', async () => {
    const mod = await import('./checkoutController');
    const els = createCheckoutElements();
    const controller = mod.createCheckoutController(els);
    expect(controller).toHaveProperty('init');
    expect(typeof controller.init).toBe('function');
  });

  it('shows delivery info when delivery mode is envio', async () => {
    const mod = await import('./checkoutController');
    const els = createCheckoutElements();
    const controller = mod.createCheckoutController(els);
    controller.init({ showCartView: vi.fn() });

    const envioRadio = els.checkoutDelivery.querySelector('input[value="envio"]') as HTMLInputElement;
    envioRadio.click();

    expect(els.checkoutDeliveryInfo.hidden).toBe(false);
  });

  it('hides delivery info when switching to retiro from envio', async () => {
    const mod = await import('./checkoutController');
    const els = createCheckoutElements();
    const controller = mod.createCheckoutController(els);
    controller.init({ showCartView: vi.fn() });

    const envioRadio = els.checkoutDelivery.querySelector('input[value="envio"]') as HTMLInputElement;
    envioRadio.click();
    expect(els.checkoutDeliveryInfo.hidden).toBe(false);

    const retiroRadio = els.checkoutDelivery.querySelector('input[value="retiro"]') as HTMLInputElement;
    retiroRadio.click();

    expect(els.checkoutDeliveryInfo.hidden).toBe(true);
  });

  it('shows address wrapper when delivery is envio', async () => {
    const mod = await import('./checkoutController');
    const els = createCheckoutElements();
    const controller = mod.createCheckoutController(els);
    controller.init({ showCartView: vi.fn() });

    const envioRadio = els.checkoutDelivery.querySelector('input[value="envio"]') as HTMLInputElement;
    envioRadio.click();

    expect(els.checkoutAddressWrapper.classList.contains('visible')).toBe(true);
  });

  it('clears address when switching to retiro from envio', async () => {
    const mod = await import('./checkoutController');
    const els = createCheckoutElements();
    els.checkoutAddress.value = 'Calle Falsa 123';
    const controller = mod.createCheckoutController(els);
    controller.init({ showCartView: vi.fn() });

    const envioRadio = els.checkoutDelivery.querySelector('input[value="envio"]') as HTMLInputElement;
    envioRadio.click();
    expect(els.checkoutAddressWrapper.classList.contains('visible')).toBe(true);
    expect(els.checkoutAddress.value).toBe('Calle Falsa 123');

    const retiroRadio = els.checkoutDelivery.querySelector('input[value="retiro"]') as HTMLInputElement;
    retiroRadio.click();

    expect(els.checkoutAddress.value).toBe('');
  });

  it('shows payment info for transferencia', async () => {
    const mod = await import('./checkoutController');
    const els = createCheckoutElements();
    const controller = mod.createCheckoutController(els);
    controller.init({ showCartView: vi.fn() });

    const transferenciaRadio = els.checkoutPayment.querySelector('input[value="transferencia"]') as HTMLInputElement;
    transferenciaRadio.click();

    expect(els.checkoutPaymentInfo.hidden).toBe(false);
  });

  it('hides payment info when switching to efectivo from transferencia', async () => {
    const mod = await import('./checkoutController');
    const els = createCheckoutElements();
    const controller = mod.createCheckoutController(els);
    controller.init({ showCartView: vi.fn() });

    const transferenciaRadio = els.checkoutPayment.querySelector('input[value="transferencia"]') as HTMLInputElement;
    transferenciaRadio.click();
    expect(els.checkoutPaymentInfo.hidden).toBe(false);

    const efectivoRadio = els.checkoutPayment.querySelector('input[value="efectivo"]') as HTMLInputElement;
    efectivoRadio.click();

    expect(els.checkoutPaymentInfo.hidden).toBe(true);
  });
});
