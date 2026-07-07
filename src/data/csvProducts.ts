import { z } from 'zod';
import type { Product } from '../types/Product';

const CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSdu2XYdN2-8QS3Dr863HRGKZp818XjTjsIHvsu6w9C6LymRli_Gql3PllXYnkTjYAYEQgCAjyoUOYS/pub?gid=0&single=true&output=csv';

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
  const cleaned = raw
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^0-9.-]/g, '');
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

function parseRow(
  cols: string[],
  indices: Record<string, number>,
) {
  const get = (key: string): string => {
    const idx = indices[key];
    return idx !== -1 ? (cols[idx]?.trim() ?? '') : '';
  };

  let price = 0;
  if (indices.priceIdx !== -1) {
    price = parsePrice(cols[indices.priceIdx] ?? '');
  }

  const stock = indices.stockIdx !== -1 ? parseBool(cols[indices.stockIdx] ?? '') : true;
  const offerLabel = get('offerIdx');
  const venta = get('ventaIdx');
  const rawCantidad = get('cantidadIdx');
  const parsedCantidad = rawCantidad ? parseInt(rawCantidad, 10) : 0;
  const cantidadPorKg = Number.isFinite(parsedCantidad) ? parsedCantidad : 0;

  return CSV_ROW_SCHEMA.safeParse({
    plu: get('pluIdx'),
    name: get('nameIdx'),
    price,
    imageUrl: get('imgIdx'),
    stock,
    offerLabel,
    venta,
    cantidadPorKg,
  });
}

function csvRowToProduct(row: CSVRow): Product {
  let price = row.price;
  let presentacion: string | undefined;

  if (row.venta === 'kg') {
    price = price / 2;
    presentacion = 'Por 500g';
  } else if (row.venta === 'unidad') {
    presentacion = 'Por Pack / Unidad';
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
  };
}

export function parseCSVProducts(raw: string): Product[] {
  const lines = raw.trim().split(/\r?\n/);
  if (lines.length < 2) {
    console.warn('[csvProducts] CSV has fewer than 2 lines, skipping');
    return [];
  }

  const separator = detectSeparator(lines[0]);
  const headers = lines[0].split(separator).map(normalizeHeader);

  const colIndex = (name: string): number => {
    const idx = headers.findIndex((h) => h === name);
    return idx !== -1 ? idx : -1;
  };

  const pluIdx = colIndex('PLU');
  const nameIdx = colIndex('PRODUCTOS');
  const priceIdx = colIndex('PRECIO');
  const imgIdx = colIndex('IMAGEN_PRODUCTO');
  const stockIdx = colIndex('STOCK');
  const offerIdx = colIndex('OFERTA');
  const ventaIdx = colIndex('VENTA');
  const cantidadIdx = colIndex('CANTIDAD_POR_KG');

  if (pluIdx === -1 || nameIdx === -1 || priceIdx === -1) {
    console.warn('[csvProducts] Required columns not found (PLU, PRODUCTOS, PRECIO)');
    return [];
  }

  const indices = { pluIdx, nameIdx, priceIdx, imgIdx, stockIdx, offerIdx, ventaIdx, cantidadIdx };
  const products: Product[] = [];
  let parseErrors = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(separator);

    if (!(cols[nameIdx]?.trim())) continue;

    const result = parseRow(cols, indices);

    if (result.success) {
      products.push(csvRowToProduct(result.data));
    } else {
      parseErrors++;
      console.warn(`[csvProducts] Row ${i + 1} validation failed:`, result.error.issues);
    }
  }

  if (parseErrors > 0) {
    console.error(`[csvProducts] ${parseErrors} row(s) failed validation — data may be incomplete`);
  }

  return products;
}

export async function fetchCSVProducts(): Promise<Product[]> {
  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) {
      const msg = `[csvProducts] HTTP ${response.status} fetching CSV`;
      if (import.meta.env.PROD) throw new Error(msg);
      console.warn(msg);
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
    console.warn('[csvProducts] Network error fetching CSV:', error);
    return [];
  }
}
