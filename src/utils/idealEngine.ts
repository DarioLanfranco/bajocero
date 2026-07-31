import type { Product } from '../types/Product';
import { PRODUCT_GROUPS, GROUP_IDS, productInRange } from '../data/catalog';

export interface IdealItem {
  product: Product;
  quantity: number;
}

export interface IdealResult {
  items: IdealItem[];
  total: number;
  budgetRemaining: number | null;
}

export interface IdealInput {
  products: Product[];
  budget: number | null;
  comensales: number | null;
  intention: string;
}

const INTENTION_GROUPS: Record<string, readonly string[]> = {
  variado: [GROUP_IDS.AL_FUEGO, GROUP_IDS.PESCADOS, GROUP_IDS.PANADERIA_FRESCOS, GROUP_IDS.VEGETARIANO, GROUP_IDS.PASTAS_PRACTICOS],
  rapido: [GROUP_IDS.AL_FUEGO, GROUP_IDS.PASTAS_PRACTICOS],
  saludable: [GROUP_IDS.PESCADOS, GROUP_IDS.VEGETARIANO],
};

export function getPortionsNeeded(comensales: number | null): number {
  return comensales !== null ? Math.ceil(comensales / 2) : 1;
}

export function getEffectiveBudget(budget: number | null, comensales: number | null): number | null {
  if (budget !== null) return budget;
  if (comensales === null) return null;
  if (comensales <= 2) return 12000;
  if (comensales <= 4) return 22000;
  return 35000;
}

export function getMaxItems(comensales: number | null): number {
  if (comensales === null) return 4;
  if (comensales <= 2) return 2;
  if (comensales <= 4) return 3;
  return 4;
}

function groupProductsByGroup(
  available: Product[],
  groups: typeof PRODUCT_GROUPS,
): Record<string, Product[]> {
  const byGroup: Record<string, Product[]> = {};
  for (const group of groups) {
    const inRange = available
      .filter((p) => productInRange(p, group))
      .sort((a, b) => {
        if (a.offerLabel && !b.offerLabel) return -1;
        if (!a.offerLabel && b.offerLabel) return 1;
        return a.price - b.price;
      });
    if (inRange.length > 0) byGroup[group.id] = inRange;
  }
  return byGroup;
}

function computeGroupPickOrder(
  intention: string,
  maxItems: number,
  activeGroupIds: readonly string[],
): string[] {
  const order = intention === 'variado' && maxItems <= 2
    ? [GROUP_IDS.AL_FUEGO, GROUP_IDS.PASTAS_PRACTICOS, ...activeGroupIds]
    : [...activeGroupIds];
  return [...new Set(order)];
}

function pickProductsFromGroups(
  groupOrder: string[],
  byGroup: Record<string, Product[]>,
  maxItems: number,
  effectiveBudget: number | null,
): Array<{ product: Product; groupId: string }> {
  const picked: Array<{ product: Product; groupId: string }> = [];
  for (const groupId of groupOrder) {
    if (picked.length >= maxItems) break;
    const candidates = byGroup[groupId];
    if (!candidates || candidates.length === 0) continue;
    if (effectiveBudget !== null && candidates[0].price > effectiveBudget) continue;
    picked.push({ product: candidates[0], groupId });
  }
  return picked;
}

function buildInitialItems(
  picked: Array<{ product: Product; groupId: string }>,
  effectiveBudget: number | null,
): { items: IdealItem[]; total: number } {
  const items: IdealItem[] = [];
  let total = 0;
  for (const item of picked) {
    const itemTotal = item.product.price;
    if (effectiveBudget !== null && total + itemTotal > effectiveBudget) continue;
    items.push({ product: item.product, quantity: 1 });
    total += itemTotal;
  }
  return { items, total };
}

function addExtraPortions(
  items: IdealItem[],
  total: number,
  portionsNeeded: number,
  effectiveBudget: number | null,
): { items: IdealItem[]; total: number } {
  let currentPortions = items.reduce((s, i) => s + i.quantity, 0);
  while (currentPortions < portionsNeeded) {
    let added = false;
    for (const ri of items) {
      const extra = ri.product.price;
      if (effectiveBudget !== null && total + extra > effectiveBudget) continue;
      ri.quantity += 1;
      total += extra;
      currentPortions += 1;
      added = true;
      if (currentPortions >= portionsNeeded) break;
    }
    if (!added) break;
  }
  return { items, total };
}

export function calcularComboIdeal(input: IdealInput): IdealResult | null {
  const { products, budget, comensales, intention } = input;
  const effectiveBudget = getEffectiveBudget(budget, comensales);
  const maxItems = getMaxItems(comensales);
  const available = products.filter((p) => p.isAvailable);

  const activeGroupIds = INTENTION_GROUPS[intention] || INTENTION_GROUPS.variado;
  const activeGroups = PRODUCT_GROUPS.filter((g) => activeGroupIds.includes(g.id));

  const byGroup = groupProductsByGroup(available, activeGroups);
  if (Object.keys(byGroup).length === 0) return null;

  const groupOrder = computeGroupPickOrder(intention, maxItems, activeGroupIds);
  const picked = pickProductsFromGroups(groupOrder, byGroup, maxItems, effectiveBudget);
  if (picked.length === 0) return null;

  const portionsNeeded = getPortionsNeeded(comensales);
  const { items, total } = buildInitialItems(picked, effectiveBudget);
  const final = addExtraPortions(items, total, portionsNeeded, effectiveBudget);

  if (final.items.length === 0) return null;

  return {
    items: final.items,
    total: final.total,
    budgetRemaining: effectiveBudget !== null ? Math.max(0, effectiveBudget - final.total) : null,
  };
}
