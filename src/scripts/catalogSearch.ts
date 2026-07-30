function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function matchesCard(card: HTMLElement, query: string): boolean {
  if (!query) return true;
  const q = normalizeText(query);
  const name = card.dataset.productName || '';
  const descEl = card.querySelector('.product-card__description');
  const desc = descEl?.textContent || '';
  return normalizeText(name).includes(q) || normalizeText(desc).includes(q);
}

function syncUI(
  allCards: HTMLElement[],
  currentQuery: string,
  visibleCount: number,
  els: {
    emptyEl: HTMLElement;
    loadMoreEl: HTMLElement;
    countEl: HTMLElement;
  },
): void {
  let shown = 0;
  let totalMatching = 0;

  for (const card of allCards) {
    if (matchesCard(card, currentQuery)) {
      totalMatching++;
      if (shown < visibleCount) {
        card.classList.remove('is-hidden');
        shown++;
      } else {
        card.classList.add('is-hidden');
      }
    } else {
      card.classList.add('is-hidden');
    }
  }

  els.emptyEl.classList.toggle('hidden', totalMatching > 0);
  els.loadMoreEl.classList.toggle('hidden', totalMatching <= visibleCount);
  els.countEl.textContent = String(totalMatching);
}

interface SearchState {
  currentQuery: string;
  visibleCount: number;
}

function handleSearch(
  inputEl: HTMLInputElement | null,
  state: SearchState,
  pageSize: number,
  allCards: HTMLElement[],
  els: { emptyEl: HTMLElement; loadMoreEl: HTMLElement; countEl: HTMLElement },
): void {
  state.currentQuery = inputEl?.value || '';
  state.visibleCount = pageSize;
  syncUI(allCards, state.currentQuery, state.visibleCount, els);
}

function handleLoadMore(
  state: SearchState,
  pageSize: number,
  allCards: HTMLElement[],
  els: { emptyEl: HTMLElement; loadMoreEl: HTMLElement; countEl: HTMLElement },
): void {
  state.visibleCount += pageSize;
  syncUI(allCards, state.currentQuery, state.visibleCount, els);
}

function clearSearch(
  inputEl: HTMLInputElement | null,
  state: SearchState,
  pageSize: number,
  allCards: HTMLElement[],
  els: { emptyEl: HTMLElement; loadMoreEl: HTMLElement; countEl: HTMLElement },
): void {
  if (inputEl) inputEl.value = '';
  state.currentQuery = '';
  state.visibleCount = pageSize;
  syncUI(allCards, state.currentQuery, state.visibleCount, els);
  inputEl?.focus();
}

export function initCatalogSearch(rootId: string, pageSize = 10): () => void {
  const root = document.getElementById(rootId);
  if (!root) return () => {};

  const gridEl = root.querySelector<HTMLElement>('[data-catalog-role="grid"]');
  const inputEl = root.querySelector<HTMLInputElement>('[data-catalog-role="search-input"]');
  const loadMoreEl = root.querySelector<HTMLElement>('[data-catalog-role="load-more"]');
  const emptyEl = root.querySelector<HTMLElement>('[data-catalog-role="empty"]');
  const countEl = root.querySelector<HTMLElement>('[data-catalog-role="count"]');
  const clearBtn = root.querySelector<HTMLElement>('[data-catalog-role="clear-btn"]');

  if (!gridEl || !loadMoreEl || !emptyEl || !countEl || !clearBtn) return () => {};

  const allCards = Array.from(gridEl.querySelectorAll<HTMLElement>('.product-card'));
  const els = { emptyEl, loadMoreEl, countEl };
  const state: SearchState = {
    currentQuery: '',
    visibleCount: Math.min(pageSize, allCards.length),
  };

  const onSearch = () => handleSearch(inputEl, state, pageSize, allCards, els);
  const onLoadMore = () => handleLoadMore(state, pageSize, allCards, els);
  const onClear = () => clearSearch(inputEl, state, pageSize, allCards, els);

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const onInput = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(onSearch, 150);
  };

  inputEl?.addEventListener('input', onInput);
  loadMoreEl.addEventListener('click', onLoadMore);
  clearBtn.addEventListener('click', onClear);

  syncUI(allCards, state.currentQuery, state.visibleCount, els);

  return () => {
    inputEl?.removeEventListener('input', onInput);
    loadMoreEl.removeEventListener('click', onLoadMore);
    clearBtn.removeEventListener('click', onClear);
    if (debounceTimer) clearTimeout(debounceTimer);
  };
}
