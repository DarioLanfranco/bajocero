export function initCatalogSearch(config: {
  gridId: string;
  inputId: string;
  loadMoreId: string;
  emptyId: string;
  countId: string;
  clearId: string;
  pageSize?: number;
}): void {
  const gridEl = document.getElementById(config.gridId);
  const inputEl = document.getElementById(config.inputId) as HTMLInputElement | null;
  const loadMoreEl = document.getElementById(config.loadMoreId);
  const emptyEl = document.getElementById(config.emptyId);
  const countEl = document.getElementById(config.countId);
  const clearBtn = document.getElementById(config.clearId);

  if (!gridEl || !loadMoreEl || !emptyEl || !countEl || !clearBtn) return;

  const allCards = Array.from(gridEl.querySelectorAll<HTMLElement>('.product-card'));
  const PAGE_SIZE = config.pageSize || 10;
  const TOTAL_COUNT = allCards.length;

  let visibleCount = Math.min(PAGE_SIZE, TOTAL_COUNT);
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
    visibleCount = PAGE_SIZE;
    syncUI();
  }

  function handleLoadMore(): void {
    visibleCount += PAGE_SIZE;
    syncUI();
  }

  function clearSearch(): void {
    if (inputEl) inputEl.value = '';
    currentQuery = '';
    visibleCount = PAGE_SIZE;
    syncUI();
    inputEl?.focus();
  }

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  inputEl?.addEventListener('input', () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(handleSearch, 150);
  });

  loadMoreEl.addEventListener('click', handleLoadMore);
  clearBtn.addEventListener('click', clearSearch);

  syncUI();
}
