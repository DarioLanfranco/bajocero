import type { Product } from '../../types/Product';

export interface FilterState {
  budget: number | null;
  comensales: number | null;
  intention: string;
}

export interface PageElements {
  result: HTMLElement;
  submit: HTMLButtonElement;
  okTemplate: HTMLTemplateElement;
  emptyTemplate: HTMLTemplateElement;
  itemTemplate: HTMLTemplateElement;
  loadingTemplate: HTMLTemplateElement;
}

export function getElements(): PageElements | null {
  const result = document.getElementById('resultado-combo');
  const submit = document.getElementById('ideal-submit');
  const okTemplate = document.getElementById('ideal-result-ok');
  const emptyTemplate = document.getElementById('ideal-result-empty');
  const itemTemplate = document.getElementById('ideal-result-item');
  const loadingTemplate = document.getElementById('ideal-loading');

  if (
    !(result instanceof HTMLElement) ||
    !(submit instanceof HTMLButtonElement) ||
    !(okTemplate instanceof HTMLTemplateElement) ||
    !(emptyTemplate instanceof HTMLTemplateElement) ||
    !(itemTemplate instanceof HTMLTemplateElement) ||
    !(loadingTemplate instanceof HTMLTemplateElement)
  ) return null;

  return { result, submit, okTemplate, emptyTemplate, itemTemplate, loadingTemplate };
}
