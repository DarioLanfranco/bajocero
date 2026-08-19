import type { Product } from '../types/Product';
import { PRODUCT_GROUPS, GROUP_IDS, type ProductGroup } from '../data/catalog';

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
  includePostre?: boolean;
  includeFrutas?: boolean;
}

interface IntentionConfig {
  /** Grupos de plato principal (prioridad de armado). */
  mainGroups: readonly string[];
  /** Grupos de guarnición / acompañamiento. */
  sideGroups: readonly string[];
}

const INTENTION_CONFIG: Record<string, IntentionConfig> = {
  variado: {
    mainGroups: [GROUP_IDS.AL_FUEGO, GROUP_IDS.PESCADOS, GROUP_IDS.VEGETARIANO],
    sideGroups: [GROUP_IDS.PAPAS, GROUP_IDS.PANADERIA_FRESCOS],
  },
  rapido: {
    mainGroups: [GROUP_IDS.AL_FUEGO],
    sideGroups: [GROUP_IDS.PANADERIA_FRESCOS],
  },
  saludable: {
    // Vegetariano Base (49-59) + Verduras (99-107); la fruta entra vía opcional
    mainGroups: [GROUP_IDS.VEGETARIANO],
    sideGroups: [GROUP_IDS.VERDURAS],
  },
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
  groups: readonly ProductGroup[],
): Record<string, Product[]> {
  const byGroup: Record<string, Product[]> = {};
  for (const group of groups) {
    const inRange = available
      .filter((p) => {
        const plu = Number(p.id);
        return Number.isFinite(plu) && plu >= group.range[0] && plu <= group.range[1];
      })
      .sort((a, b) => {
        if (a.offerLabel && !b.offerLabel) return -1;
        if (!a.offerLabel && b.offerLabel) return 1;
        return a.price - b.price;
      });
    if (inRange.length > 0) byGroup[group.id] = inRange;
  }
  return byGroup;
}

/**
 * Elige el producto más barato (ofertas primero) disponible de los grupos
 * indicados que quepa en el presupuesto restante.
 */
function pickCheapest(
  byGroup: Record<string, Product[]>,
  groupIds: readonly string[],
  effectiveBudget: number | null,
  currentTotal: number,
): Product | null {
  for (const groupId of groupIds) {
    const candidates = byGroup[groupId];
    if (!candidates || candidates.length === 0) continue;
    for (const product of candidates) {
      if (effectiveBudget === null || currentTotal + product.price <= effectiveBudget) {
        return product;
      }
    }
  }
  return null;
}

function addExtraPortions(
  items: IdealItem[],
  total: number,
  portionsNeeded: number,
  effectiveBudget: number | null,
): { items: IdealItem[]; total: number } {
  let currentPortions = items.reduce((sum, item) => sum + item.quantity, 0);
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

/**
 * Algoritmo Determinista de Selección de Combos / Greedy Engine.
 *
 * 1) Elige un plato principal según la intención (respeta presupuesto).
 * 2) Agrega una guarnición si el presupuesto lo permite.
 * 3) Completa porciones para cubrir a los comensales.
 * 4) Opcionales con presupuesto sobrante: Postre (Franui) y/o Fruta.
 * Solo ingresan productos con `isAvailable === true`.
 */
export function calcularComboIdeal(input: IdealInput): IdealResult | null {
  const { products, budget, comensales, intention } = input;
  const includePostre = input.includePostre ?? false;
  const includeFrutas = input.includeFrutas ?? false;

  const effectiveBudget = getEffectiveBudget(budget, comensales);
  const maxItems = getMaxItems(comensales);
  const portionsNeeded = getPortionsNeeded(comensales);

  const available = products.filter((p) => p.isAvailable);
  const config = INTENTION_CONFIG[intention] || INTENTION_CONFIG.variado;

  const byGroup = groupProductsByGroup(available, PRODUCT_GROUPS);
  if (Object.keys(byGroup).length === 0) return null;

  const items: IdealItem[] = [];
  let total = 0;

  // 1) Plato principal (máximo 1, respetando el presupuesto)
  const main = pickCheapest(byGroup, config.mainGroups, effectiveBudget, total);
  if (main) {
    items.push({ product: main, quantity: 1 });
    total += main.price;
  }

  // 2) Guarnición / acompañamiento (máximo 1)
  if (items.length < maxItems) {
    const side = pickCheapest(byGroup, config.sideGroups, effectiveBudget, total);
    if (side) {
      items.push({ product: side, quantity: 1 });
      total += side.price;
    }
  }

  // Fallback: si no hubo plato principal, tomar lo más barato de los grupos activos
  if (items.length === 0) {
    const fallback = pickCheapest(
      byGroup,
      [...config.mainGroups, ...config.sideGroups],
      effectiveBudget,
      total,
    );
    if (fallback) {
      items.push({ product: fallback, quantity: 1 });
      total += fallback.price;
    }
  }

  if (items.length === 0) return null;

  // 3) Completar porciones para los comensales
  const withPortions = addExtraPortions(items, total, portionsNeeded, effectiveBudget);
  total = withPortions.total;

  // 4) Opcionales con presupuesto sobrante
  if (includePostre) {
    const postre = pickCheapest(byGroup, [GROUP_IDS.POSTRES], effectiveBudget, total);
    if (postre) {
      items.push({ product: postre, quantity: 1 });
      total += postre.price;
    }
  }

  if (includeFrutas) {
    const fruta = pickCheapest(byGroup, [GROUP_IDS.FRUTAS], effectiveBudget, total);
    if (fruta) {
      const remaining =
        effectiveBudget === null ? null : Math.max(0, effectiveBudget - total);
      const quantity =
        remaining === null ? 1 : Math.max(1, Math.floor(remaining / fruta.price));
      const clamped = Math.min(quantity, 4);
      items.push({ product: fruta, quantity: clamped });
      total += fruta.price * clamped;
    }
  }

  return {
    items,
    total,
    budgetRemaining:
      effectiveBudget !== null ? Math.max(0, effectiveBudget - total) : null,
  };
}