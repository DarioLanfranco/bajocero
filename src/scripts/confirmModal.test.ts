import { describe, it, expect, beforeEach, vi } from 'vitest';

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('showConfirmModal', () => {
  it('creates overlay and modal in the DOM', async () => {
    const mod = await import('./confirmModal');
    const items = [{ productId: '1', name: 'Test', price: 100, quantity: 1 }];
    const promise = mod.showConfirmModal(items, 100);

    await new Promise((r) => requestAnimationFrame(r));

    expect(document.querySelector('.modal-overlay')).not.toBeNull();
    expect(document.querySelector('.modal')).not.toBeNull();
    expect(document.querySelector('.confirm-modal__title')?.textContent).toBe('¿Está todo bien con tu compra?');

    const confirmBtn = document.querySelector('.confirm-modal__btn--primary') as HTMLButtonElement;
    confirmBtn.click();
    await promise;
    await new Promise((r) => setTimeout(r, 350));
    expect(document.querySelector('.modal')).toBeNull();
  });

  it('resolves with confirmed:true on confirm click', async () => {
    const mod = await import('./confirmModal');
    const items = [{ productId: '1', name: 'Test', price: 100, quantity: 1 }];
    const promise = mod.showConfirmModal(items, 100);

    await new Promise((r) => requestAnimationFrame(r));
    (document.querySelector('.confirm-modal__btn--primary') as HTMLButtonElement).click();

    const result = await promise;
    expect(result.confirmed).toBe(true);
  });

  it('resolves with confirmed:false on cancel click', async () => {
    const mod = await import('./confirmModal');
    const items = [{ productId: '1', name: 'Test', price: 100, quantity: 1 }];
    const promise = mod.showConfirmModal(items, 100);

    await new Promise((r) => requestAnimationFrame(r));
    (document.querySelector('.confirm-modal__btn--secondary') as HTMLButtonElement).click();

    const result = await promise;
    expect(result.confirmed).toBe(false);
  });

  it('renders all passed items', async () => {
    const mod = await import('./confirmModal');
    const items = [
      { productId: '1', name: 'Item A', price: 100, quantity: 2 },
      { productId: '2', name: 'Item B', price: 200, quantity: 1 },
    ];
    mod.showConfirmModal(items, 400);

    await new Promise((r) => requestAnimationFrame(r));
    const names = document.querySelectorAll('.confirm-modal__product-name');
    expect(names.length).toBe(2);
    expect(names[0].textContent).toBe('Item A');
    expect(names[1].textContent).toBe('Item B');
  });
});
