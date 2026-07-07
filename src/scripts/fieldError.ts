const ERROR_CLASS = 'field--error';

export function markFieldError(el: HTMLElement, hasError: boolean): void {
  el.classList.toggle(ERROR_CLASS, hasError);
}

export function clearAllFieldErrors(els: HTMLElement[]): void {
  els.forEach((el) => el.classList.remove(ERROR_CLASS));
}
