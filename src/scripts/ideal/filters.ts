import type { FilterState } from './types';

export function applyFilterPill(
  pill: HTMLButtonElement,
  group: HTMLElement,
  filter: string,
  value: string,
  isAny: boolean,
  state: FilterState,
): void {
  group.querySelectorAll('.ideal__pill').forEach((p) => p.classList.remove('ideal__pill--active'));

  if (filter !== 'intention') {
    const input = group.querySelector<HTMLInputElement>('.ideal__input');
    if (input) input.value = '';
  }

  if (isAny) {
    if (filter === 'budget') state.budget = null;
    else if (filter === 'comensales') state.comensales = null;
  } else {
    pill.classList.add('ideal__pill--active');
    if (filter === 'budget') state.budget = parseInt(value, 10);
    else if (filter === 'comensales') state.comensales = parseInt(value, 10);
    else if (filter === 'intention') state.intention = value;
  }
}

function handlePillClick(e: MouseEvent, state: FilterState): void {
  const pill = e.currentTarget;
  if (!(pill instanceof HTMLButtonElement)) return;
  const group = pill.closest('.ideal__filter-group');
  if (!(group instanceof HTMLElement)) return;
  const filter = group.dataset.filter;
  if (!filter) return;
  const value = pill.dataset.value;
  if (value === undefined) return;
  applyFilterPill(pill, group, filter, value, pill.classList.contains('ideal__pill--any'), state);
}

function handleInputChange(e: Event, state: FilterState): void {
  const input = e.currentTarget;
  if (!(input instanceof HTMLInputElement)) return;
  const group = input.closest('.ideal__filter-group');
  if (!(group instanceof HTMLElement)) return;
  const filter = group.dataset.filter;
  if (!filter) return;
  const val = input.value.trim();

  group.querySelectorAll('.ideal__pill').forEach((p) => p.classList.remove('ideal__pill--active'));

  if (val === '') {
    if (filter === 'budget') state.budget = null;
    else if (filter === 'comensales') state.comensales = null;
  } else {
    const parsed = parseInt(val, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      if (filter === 'budget') state.budget = parsed;
      else if (filter === 'comensales') state.comensales = parsed;
    }
  }
}

export function buildFilterGroups(
  pills: NodeListOf<HTMLButtonElement>,
  inputs: NodeListOf<HTMLInputElement>,
  state: FilterState,
): void {
  pills.forEach((pill) => {
    pill.addEventListener('click', (e) => handlePillClick(e, state));
  });

  inputs.forEach((input) => {
    input.addEventListener('input', (e) => handleInputChange(e, state));
  });
}
