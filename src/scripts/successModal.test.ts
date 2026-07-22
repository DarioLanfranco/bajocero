import { describe, it, expect, beforeEach, vi } from 'vitest';

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('showSuccessModal', () => {
  it('creates overlay and modal in the DOM', async () => {
    const mod = await import('./successModal');
    const promise = mod.showSuccessModal();

    await new Promise((r) => requestAnimationFrame(r));

    expect(document.querySelector('.modal-overlay')).not.toBeNull();
    expect(document.querySelector('.success-modal')).not.toBeNull();
    expect(document.querySelector('.success-modal__title')?.textContent).toContain('Gracias');

    (document.querySelector('.success-modal__btn') as HTMLElement).click();
    await promise;
    await new Promise((r) => setTimeout(r, 350));
    expect(document.querySelector('.success-modal')).toBeNull();
  });

  it('shows WhatsApp link when whatsappUrl is provided', async () => {
    const mod = await import('./successModal');
    mod.showSuccessModal({ whatsappUrl: 'https://wa.me/123' });

    await new Promise((r) => requestAnimationFrame(r));

    const link = document.querySelector('.success-modal__btn') as HTMLAnchorElement;
    expect(link).not.toBeNull();
    expect(link.href).toBe('https://wa.me/123');
    expect(link.target).toBe('_blank');
  });

  it('shows button when no whatsappUrl', async () => {
    const mod = await import('./successModal');
    mod.showSuccessModal();

    await new Promise((r) => requestAnimationFrame(r));

    const btn = document.querySelector('.success-modal__btn') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    expect(btn.tagName).toBe('BUTTON');
  });

  it('calls onConfirm when button/link is clicked', async () => {
    const mod = await import('./successModal');
    const onConfirm = vi.fn();
    mod.showSuccessModal({ onConfirm });

    await new Promise((r) => requestAnimationFrame(r));
    (document.querySelector('.success-modal__btn') as HTMLElement).click();

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
