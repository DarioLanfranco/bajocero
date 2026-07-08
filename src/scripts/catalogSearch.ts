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
  const TOTAL_COUNT = allCards.length;

  let visibleCount = Math.min(pageSize, TOTAL_COUNT);
  let currentQuery = '';

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

  function syncUI(): void {
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

    emptyEl!.classList.toggle('hidden', totalMatching > 0);
    loadMoreEl!.classList.toggle('hidden', totalMatching <= visibleCount);
    countEl!.textContent = String(totalMatching);
  }

  function handleSearch(): void {
    currentQuery = inputEl?.value || '';
    visibleCount = pageSize;
    syncUI();
  }

  function handleLoadMore(): void {
    visibleCount += pageSize;
    syncUI();
  }

  function clearSearch(): void {
    if (inputEl) inputEl.value = '';
    currentQuery = '';
    visibleCount = pageSize;
    syncUI();
    inputEl?.focus();
  }

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const onInput = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(handleSearch, 150);
  };
  inputEl?.addEventListener('input', onInput);
  loadMoreEl.addEventListener('click', handleLoadMore);
  clearBtn.addEventListener('click', clearSearch);

  syncUI();

  return () => {
    inputEl?.removeEventListener('input', onInput);
    loadMoreEl.removeEventListener('click', handleLoadMore);
    clearBtn.removeEventListener('click', clearSearch);
    if (debounceTimer) clearTimeout(debounceTimer);
  };
}