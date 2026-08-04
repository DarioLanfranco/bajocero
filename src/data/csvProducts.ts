import { z } from "zod";
import type { Product } from "../types/Product";
import { TIPO_VENTA } from "../types/tipoVenta";
import type { TipoVentaKey } from "../types/tipoVenta";
import { TipoVentaKeySchema } from "../schemas/cart";
import { productCategorySchema } from "../schemas/product";
import { log } from "../utils/logger";
import { safeStorage } from "../utils/storage";
import { products as fallbackProducts } from "./products";
import { getProductCategory, UNCLASSIFIED_CATEGORY } from "./catalog";

const CSV_URL = import.meta.env.PUBLIC_GOOGLE_SHEETS_URL ?? "";

// Sello de versión del build: cambia en cada despliegue (workflow GitHub Actions).
// Al cambiar, la caché local se descarta para que NUNCA se sirva data de un deploy anterior.
const BUILD_ID = import.meta.env.PUBLIC_BUILD_ID ?? "local";

interface ColumnDef {
  name: string;
  key: string;
  required?: boolean;
  aliases?: string[];
}

const COLUMNS: ColumnDef[] = [
  { name: "PLU", key: "pluIdx", required: true },
  { name: "PRODUCTOS", key: "nameIdx", required: true },
  { name: "PRECIO", key: "priceIdx", required: true },
  { name: "IMAGEN", key: "imgIdx", aliases: ["IMAGEN_PRODUCTO"] },
  { name: "STOCK", key: "stockIdx" },
  { name: "OFERTA", key: "offerIdx" },
  { name: "VENTA", key: "ventaIdx" },
  { name: "CANTIDAD_POR_KG", key: "cantidadIdx" },
];

const COLUMN_SIGNATURE = COLUMNS.map((c) => c.name).join("|");

const CSV_ROW_SCHEMA = z.object({
  plu: z.string().min(1),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  imageUrl: z.string(),
  stock: z.boolean(),
  offerLabel: z.string(),
  venta: z.string(),
  cantidadPorKg: z.number().nonnegative(),
});

type CSVRow = z.infer<typeof CSV_ROW_SCHEMA>;

/**
 * Genera una URL con cache-busting para obligar a Google Sheets / CDN
 * a entregar SIEMPRE la versión más reciente de la planilla.
 */
function getFreshCSVUrl(): string {
  if (!CSV_URL) return "";
  const separator = CSV_URL.includes("?") ? "&" : "?";
  return `${CSV_URL}${separator}_cb=${Date.now()}`;
}

/**
 * Configuración de red para forzar una descarga 100% en vivo de la planilla,
 * saltándose cualquier capa de caché (HTTP, CDN, proxy, cliente).
 */
const FRESH_CSV_FETCH_INIT: RequestInit = {
  cache: "no-store",
  headers: {
    Pragma: "no-cache",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Expires: "0",
  },
};

/** Descarga el CSV con cache-busting y cabeceras anti-caché. Devuelve el texto crudo. */
async function fetchFreshCSV(): Promise<string> {
  const response = await fetch(getFreshCSVUrl(), FRESH_CSV_FETCH_INIT);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function detectSeparator(headerLine: string): string {
  return headerLine.includes(";") ? ";" : ",";
}

function parsePrice(raw: string): number {
  const trimmed = raw.trim();
  if (!trimmed) return 0;

  if (/,/.test(trimmed)) {
    const normalized = trimmed.replace(/\./g, "").replace(",", ".");
    const n = parseFloat(normalized);
    return Number.isFinite(n) ? n : 0;
  }

  const cleaned = trimmed.replace(/\./g, "").replace(/[^0-9.-]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return 0;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function parseBool(raw: string): boolean {
  return raw.trim().toUpperCase() === "SI";
}

function normalizeHeader(header: string): string {
  return header
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "")
    .trim();
}

function resolveIndices(headers: string[]): Record<string, number> | null {
  const indices: Record<string, number> = {};

  for (const col of COLUMNS) {
    const names = [col.name, ...(col.aliases ?? [])];
    const idx = headers.findIndex((h) => names.includes(h));
    indices[col.key] = idx;
  }

  const missing = COLUMNS.filter(
    (c) => c.required && indices[c.key] === -1,
  ).map((c) => c.name);

  if (missing.length > 0) {
    log(
      "csvProducts",
      "warn",
      `Required columns not found: ${missing.join(", ")}`,
    );
    return null;
  }

  return indices;
}

function getValue(
  cols: string[],
  indices: Record<string, number>,
  key: string,
): string {
  const idx = indices[key];
  return idx !== -1 ? (cols[idx]?.trim() ?? "") : "";
}

function parseRow(cols: string[], indices: Record<string, number>) {
  let price = 0;
  if (indices.priceIdx !== -1) {
    price = parsePrice(cols[indices.priceIdx] ?? "");
  }

  const stock =
    indices.stockIdx !== -1 ? parseBool(cols[indices.stockIdx] ?? "") : true;
  const offerLabel = getValue(cols, indices, "offerIdx");
  const venta = getValue(cols, indices, "ventaIdx");
  const rawCantidad = getValue(cols, indices, "cantidadIdx");
  const parsedCantidad = rawCantidad ? parseInt(rawCantidad, 10) : 0;
  const cantidadPorKg = Number.isFinite(parsedCantidad) ? parsedCantidad : 0;

  return CSV_ROW_SCHEMA.safeParse({
    plu: getValue(cols, indices, "pluIdx"),
    name: getValue(cols, indices, "nameIdx"),
    price,
    imageUrl: getValue(cols, indices, "imgIdx"),
    stock,
    offerLabel,
    venta,
    cantidadPorKg,
  });
}

function csvRowToProduct(row: CSVRow): Product {
  const rawTipo = row.venta;
  const parsedTipo = TipoVentaKeySchema.safeParse(rawTipo);
  const tipoVenta: TipoVentaKey = parsedTipo.success
    ? parsedTipo.data
    : "unidad";
  const config = TIPO_VENTA[tipoVenta];

  const category = getProductCategory(row.plu);
  if (
    category === UNCLASSIFIED_CATEGORY &&
    (import.meta.env.DEV || typeof window === "undefined")
  ) {
    console.warn(
      `[catalog] Producto huérfano — PLU ${row.plu} fuera de todo rango del catálogo. Categoría asignada: '${UNCLASSIFIED_CATEGORY}'`,
      { plu: row.plu, name: row.name },
    );
  }

  return {
    id: row.plu,
    name: row.name,
    price: config.multiplicadorPrecio * row.price,
    category,
    isAvailable: row.stock,
    offerLabel: row.offerLabel || undefined,
    presentacion: config.label,
    imageUrl: row.imageUrl || undefined,
    cantidadPorKg: row.cantidadPorKg > 0 ? row.cantidadPorKg : undefined,
    tipoVenta,
  };
}

export function parseCSVProducts(raw: string): Product[] {
  const lines = raw.trim().split(/\r?\n/);
  if (lines.length < 2) {
    log("csvProducts", "warn", "CSV has fewer than 2 lines, skipping");
    return [];
  }

  const separator = detectSeparator(lines[0]);
  const headers = lines[0].split(separator).map(normalizeHeader);

  const actualSignature = headers.join("|");
  if (actualSignature !== COLUMN_SIGNATURE) {
    log(
      "csvProducts",
      "warn",
      `Column structure differs from expected.\n  Expected: ${COLUMN_SIGNATURE}\n  Got:      ${actualSignature}`,
    );
  }

  const indices = resolveIndices(headers);
  if (!indices) return [];

  const products: Product[] = [];
  let parseErrors = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(separator);

    if (!cols[indices.nameIdx]?.trim()) continue;

    const result = parseRow(cols, indices);

    if (result.success) {
      products.push(csvRowToProduct(result.data));
    } else {
      parseErrors++;
      log(
        "csvProducts",
        "warn",
        `Row ${i + 1} validation failed:`,
        result.error.issues,
      );
    }
  }

  if (parseErrors > 0) {
    log(
      "csvProducts",
      "error",
      `${parseErrors} row(s) failed validation — data may be incomplete`,
    );
  }

  return products;
}

const CACHE_KEY = "bajocero-csv-cache";
const CACHE_MAX_BYTES = 4 * 1024 * 1024;
// Reducimos el tiempo de cache local en cliente a 1 minuto para revalidaciones rápidas
const REVALIDATE_INTERVAL_MS = 60 * 1000;

interface CacheEntry {
  buildId: string;
  fetchedAt: number;
  products: Product[];
}

const CachedProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  category: productCategorySchema,
  isAvailable: z.boolean(),
  offerLabel: z.string().optional(),
  isFresh: z.boolean().optional(),
  presentacion: z.string().optional(),
  imageUrl: z.string().optional(),
  cantidadPorKg: z.number().optional(),
  tipoVenta: TipoVentaKeySchema,
});

const CacheEntrySchema = z.object({
  buildId: z.string().optional(),
  fetchedAt: z.number(),
  products: z.array(CachedProductSchema),
});

function loadCSVCache(): CacheEntry | null {
  try {
    const raw = safeStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const result = CacheEntrySchema.safeParse(parsed);
    if (!result.success) {
      log("csvProducts", "warn", "Cache validation failed, discarding");
      return null;
    }
    // Caché de un despliegue anterior: descartarla para evitar stale data
    if (result.data.buildId && result.data.buildId !== BUILD_ID) {
      log("csvProducts", "warn", "Cache belongs to a previous deployment, discarding");
      return null;
    }
    return result.data as CacheEntry;
  } catch {
    return null;
  }
}

function saveCSVCache(products: Product[]): void {
  try {
    const entry: CacheEntry = { buildId: BUILD_ID, fetchedAt: Date.now(), products };
    const serialized = JSON.stringify(entry);
    if (serialized.length > CACHE_MAX_BYTES) {
      log(
        "csvProducts",
        "warn",
        `Cache too large (${serialized.length} bytes), skipping`,
      );
      return;
    }
    safeStorage.setItem(CACHE_KEY, serialized);
  } catch {
    /* storage unavailable — skip cache */
  }
}

export function clearCSVCache(): void {
  safeStorage.removeItem(CACHE_KEY);
  cachedPromise = null;
}

let cachedPromise: Promise<Product[]> | null = null;

export async function fetchCSVProducts(): Promise<Product[]> {
  if (cachedPromise) return cachedPromise;

  const promise = (async (): Promise<Product[]> => {
    if (!CSV_URL) {
      log(
        "csvProducts",
        "warn",
        "PUBLIC_GOOGLE_SHEETS_URL is not set, using fallback products",
      );
      return fallbackProducts;
    }

    try {
      // Descarga 100% en vivo: URL con cache-busting + cabeceras anti-caché
      const text = await fetchFreshCSV();
      const products = parseCSVProducts(text);
      if (products.length > 0) {
        saveCSVCache(products);
        return products;
      }
      log("csvProducts", "warn", "CSV returned 0 products");
    } catch (error) {
      log(
        "csvProducts",
        "error",
        `Failed to fetch CSV: ${error instanceof Error ? error.message : String(error)}`,
      );
      if (import.meta.env.DEV) {
        console.error(
          "[csvProducts] Fetch failed — check PUBLIC_GOOGLE_SHEETS_URL is correct and the sheet is published:\n  URL:",
          CSV_URL,
          "\n  Error:",
          error,
        );
      }
    }

    const cached = loadCSVCache();
    if (cached && cached.products.length > 0) {
      log("csvProducts", "warn", "Using cached CSV products");
      return cached.products;
    }

    log("csvProducts", "warn", "Falling back to hardcoded products");
    return fallbackProducts;
  })();

  cachedPromise = promise;
  return promise;
}

export function isCatalogCacheFresh(): boolean {
  const cached = loadCSVCache();
  return (
    cached !== null && Date.now() - cached.fetchedAt < REVALIDATE_INTERVAL_MS
  );
}

export function getCachedProducts(): Product[] | null {
  const cached = loadCSVCache();
  return cached && cached.products.length > 0 ? cached.products : null;
}

let revalidatePromise: Promise<Product[] | null> | null = null;

export async function revalidateProducts(
  force = false,
): Promise<Product[] | null> {
  if (typeof window === "undefined") return null;

  // Si no se fuerza la revalidación y la cache local es joven (menos de 1 min), usa la cache local
  if (!force && isCatalogCacheFresh()) {
    return getCachedProducts();
  }

  if (revalidatePromise) return revalidatePromise;

  revalidatePromise = (async (): Promise<Product[] | null> => {
    if (!CSV_URL) {
      log(
        "csvProducts",
        "warn",
        "PUBLIC_GOOGLE_SHEETS_URL is not set, skipping revalidation",
      );
      return null;
    }

    try {
      const text = await fetchFreshCSV();
      const products = parseCSVProducts(text);
      if (products.length > 0) {
        saveCSVCache(products);
        return products;
      }
      log("csvProducts", "warn", "CSV returned 0 products during revalidation");
    } catch (error) {
      log(
        "csvProducts",
        "error",
        `Revalidation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return null;
  })();

  try {
    return await revalidatePromise;
  } finally {
    revalidatePromise = null;
  }
}
