import { z } from "zod";
import type { Product } from "../types/Product";
import { TipoVentaKeySchema } from "../schemas/cart";
import { productCategorySchema } from "../schemas/product";
import { log } from "../utils/logger";
import { safeStorage } from "../utils/storage";
import { products as fallbackProducts } from "./products";
import { parseCSVProducts } from "./csvParser";

export { parseCSVProducts };

const CSV_URL = import.meta.env.PUBLIC_GOOGLE_SHEETS_URL ?? "";

// Sello de versión del build: cambia en cada despliegue (workflow GitHub Actions).
// Al cambiar, la caché local se descarta para que NUNCA se sirva data de un deploy anterior.
const BUILD_ID = import.meta.env.PUBLIC_BUILD_ID ?? "local";

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
 * Configuración de red para descargar la planilla forzando a la capa HTTP
 * a revalidar contra el origen. Se evita deliberadamente enviar cabeceras
 * personalizadas (Cache-Control/Pragma): en el navegador disparan un preflight
 * CORS que Google Sheets rechaza. La frescura se garantiza con el cache-busting
 * por query param (`_cb`) en `getFreshCSVUrl`.
 */
const FRESH_CSV_FETCH_INIT: RequestInit = {
  cache: "reload",
};

/** Descarga el CSV con cache-busting y cabeceras anti-caché. Devuelve el texto crudo. */
async function fetchFreshCSV(): Promise<string> {
  const response = await fetch(getFreshCSVUrl(), FRESH_CSV_FETCH_INIT);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

const CACHE_KEY = "bajocero-csv-cache";
const CACHE_MAX_BYTES = 4 * 1024 * 1024;

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

export function getCachedProducts(): Product[] | null {
  const cached = loadCSVCache();
  return cached && cached.products.length > 0 ? cached.products : null;
}

let revalidatePromise: Promise<Product[] | null> | null = null;

export async function revalidateProducts(): Promise<Product[] | null> {
  if (typeof window === "undefined") return null;

  const cached = loadCSVCache();
  if (cached) {
    log("csvProducts", "info", "Using cached CSV products (same BUILD_ID)");
    return cached.products;
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