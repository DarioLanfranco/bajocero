import { z } from 'zod';
import type { Product } from '../types/Product';
import { log } from '../utils/logger';

const CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSdu2XYdN2-8QS3Dr863HRGKZp818XjTjsIHvsu6w9C6LymRli_Gql3PllXYnkTjYAYEQgCAjyoUOYS/pub?gid=0&single=true&output=csv';

interface ColumnDef {
  name: string;
  key: string;
  required?: boolean;
}

const COLUMNS: ColumnDef[] = [
  { name: 'PLU', key: 'pluIdx', required: true },
  { name: 'PRODUCTOS', key: 'nameIdx', required: true },
  { name: 'PRECIO', key: 'priceIdx', required: true },
  { name: 'IMAGEN_PRODUCTO', key: 'imgIdx' },
  { name: 'STOCK', key: 'stockIdx' },
  { name: 'OFERTA', key: 'offerIdx' },
  { name: 'VENTA', key: 'ventaIdx' },
  { name: 'CANTIDAD_POR_KG', key: 'cantidadIdx' },
];

const COLUMN_SIGNATURE = COLUMNS.map((c) => c.name).join('|');

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

function detectSeparator(headerLine: string): string {
  return headerLine.includes(';') ? ';' : ',';
}

function parsePrice(raw: string): number {
  const trimmed = raw.trim();
  if (!trimmed) return 0;

  if (/,/.test(trimmed)) {
    const normalized = trimmed.replace(/\./g, '').replace(',', '.');
    const n = parseFloat(normalized);
    return Number.isFinite(n) ? n : 0;
  }

  const cleaned = trimmed.replace(/\./g, '').replace(/[^0-9.-]/g, '');
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return 0;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function parseBool(raw: string): boolean {
  return raw.trim().toUpperCase() === 'SI';
}

function normalizeHeader(header: string): string {
  return header
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/g, '')
    .trim();
}

function resolveIndices(headers: string[]): Record<string, number> | null {
  const indices: Record<string, number> = {};

  for (const col of COLUMNS) {
    const idx = headers.findIndex((h) => h === col.name);
    indices[col.key] = idx;
  }

  const missing = COLUMNS
    .filter((c) => c.required && indices[c.key] === -1)
    .map((c) => c.name);

  if (missing.length > 0) {
    log('csvProducts', 'warn', `Required columns not found: ${missing.join(', ')}`);
    return null;
  }

  return indices;
}

function getValue(cols: string[], indices: Record<string, number>, key: string): string {
  const idx = indices[key];
  return idx !== -1 ? (cols[idx]?.trim() ?? '') : '';
}

function parseRow(cols: string[], indices: Record<string, number>) {
  let price = 0;
  if (indices.priceIdx !== -1) {
    price = parsePrice(cols[indices.priceIdx] ?? '');
  }

  const stock = indices.stockIdx !== -1 ? parseBool(cols[indices.stockIdx] ?? '') : true;
  const offerLabel = getValue(cols, indices, 'offerIdx');
  const venta = getValue(cols, indices, 'ventaIdx');
  const rawCantidad = getValue(cols, indices, 'cantidadIdx');
  const parsedCantidad = rawCantidad ? parseInt(rawCantidad, 10) : 0;
  const cantidadPorKg = Number.isFinite(parsedCantidad) ? parsedCantidad : 0;

  return CSV_ROW_SCHEMA.safeParse({
    plu: getValue(cols, indices, 'pluIdx'),
    name: getValue(cols, indices, 'nameIdx'),
    price,
    imageUrl: getValue(cols, indices, 'imgIdx'),
    stock,
    offerLabel,
    venta,
    cantidadPorKg,
  });
}

const VALID_TIPOS = new Set(['kg', 'unidad', 'unidad400', 'pack']);

function csvRowToProduct(row: CSVRow): Product {
  let price = row.price;
  let presentacion: string | undefined;

  const tipoVenta = VALID_TIPOS.has(row.venta) ? row.venta as 'kg' | 'unidad' | 'unidad400' | 'pack' : 'unidad';

  if (tipoVenta === 'kg') {
    presentacion = 'Por 1 kg';
  } else if (tipoVenta === 'unidad') {
    price = price / 2;
    presentacion = '500g aprox.';
  } else if (tipoVenta === 'unidad400') {
    price = price * 0.4;
    presentacion = '400g aprox.';
  } else if (tipoVenta === 'pack') {
    presentacion = 'Por Pack';
  }

  return {
    id: row.plu,
    name: row.name,
    price,
    category: 'PRODUCTOS',
    isAvailable: row.stock,
    offerLabel: row.offerLabel || undefined,
    presentacion,
    imageUrl: row.imageUrl || undefined,
    cantidadPorKg: row.cantidadPorKg > 0 ? row.cantidadPorKg : undefined,
    tipoVenta,
  };
}

export function parseCSVProducts(raw: string): Product[] {
  const lines = raw.trim().split(/\r?\n/);
  if (lines.length < 2) {
    log('csvProducts', 'warn', 'CSV has fewer than 2 lines, skipping');
    return [];
  }

  const separator = detectSeparator(lines[0]);
  const headers = lines[0].split(separator).map(normalizeHeader);

  const actualSignature = headers.join('|');
  if (actualSignature !== COLUMN_SIGNATURE) {
    log('csvProducts', 'warn', `Column structure differs from expected.\n  Expected: ${COLUMN_SIGNATURE}\n  Got:      ${actualSignature}`);
  }

  const indices = resolveIndices(headers);
  if (!indices) return [];

  const products: Product[] = [];
  let parseErrors = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(separator);

    if (!(cols[indices.nameIdx]?.trim())) continue;

    const result = parseRow(cols, indices);

    if (result.success) {
      products.push(csvRowToProduct(result.data));
    } else {
      parseErrors++;
      log('csvProducts', 'warn', `Row ${i + 1} validation failed:`, result.error.issues);
    }
  }

  if (parseErrors > 0) {
    log('csvProducts', 'error', `${parseErrors} row(s) failed validation — data may be incomplete`);
  }

  return products;
}

let cachedPromise: Promise<Product[]> | null = null;

export async function fetchCSVProducts(): Promise<Product[]> {
  if (cachedPromise) return cachedPromise;

  cachedPromise = (async () => {
  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) {
      const msg = `[csvProducts] HTTP ${response.status} fetching CSV`;
      if (import.meta.env.PROD) throw new Error(msg);
      log('csvProducts', 'warn', msg);
      return [];
    }
    const text = await response.text();
    const products = parseCSVProducts(text);
    if (products.length === 0 && import.meta.env.PROD) {
      throw new Error('[csvProducts] No valid products parsed from CSV — build halted');
    }
    return products;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (import.meta.env.PROD) throw new Error(`[csvProducts] ${msg}`);
    log('csvProducts', 'warn', 'Network error fetching CSV:', error);
    return [];
  }
})();

  return cachedPromise;
}
