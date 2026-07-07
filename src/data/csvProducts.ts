import type { Product } from '../types/Product';

const CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSdu2XYdN2-8QS3Dr863HRGKZp818XjTjsIHvsu6w9C6LymRli_Gql3PllXYnkTjYAYEQgCAjyoUOYS/pub?gid=0&single=true&output=csv';

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
    .replace(/[^A-Z0-9_]/g, '')
    .trim();
}

export function parseCSVProducts(raw: string): Product[] {
  const lines = raw.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const separator = detectSeparator(lines[0]);
  const headers = lines[0].split(separator).map(normalizeHeader);

  const colIndex = (name: string): number => {
    const idx = headers.findIndex((h) => h.includes(name));
    return idx !== -1 ? idx : -1;
  };

  const pluIdx = colIndex('PLU');
  const nameIdx = colIndex('PRODUCTOS');
  const priceIdx = colIndex('PRECIO');
  const imgIdx = colIndex('IMAGEN');
  const stockIdx = colIndex('STOCK');
  const offerIdx = colIndex('OFERTA');
  const ventaIdx = colIndex('VENTA');

  if (pluIdx === -1 || nameIdx === -1 || priceIdx === -1) return [];

  const products: Product[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(separator);
    const plu = cols[pluIdx]?.trim();
    const name = cols[nameIdx]?.trim();
    if (!plu || !name) continue;

    let price = priceIdx !== -1 ? parsePrice(cols[priceIdx] ?? '') : 0;
    const imageUrl = imgIdx !== -1 ? (cols[imgIdx]?.trim() ?? '') : '';
    const stock = stockIdx !== -1 ? parseBool(cols[stockIdx] ?? '') : true;
    const offerLabel = offerIdx !== -1 ? (cols[offerIdx]?.trim() ?? '') : '';
    const venta = ventaIdx !== -1 ? (cols[ventaIdx]?.trim() ?? '') : '';
    const description = '';

    let presentacion: string | undefined;

    if (venta === 'kg') {
      price = price / 2;
      presentacion = 'Por 500g';
    } else if (venta === 'unidad') {
      presentacion = 'Por Pack / Unidad';
    }

    products.push({
      id: plu,
      name,
      description,
      price,
      category: 'PRODUCTOS',
      isAvailable: stock,
      isOffer: !!offerLabel,
      offerLabel: offerLabel || undefined,
      presentacion,
      imageUrl,
    });
  }

  return products;
}

export async function fetchCSVProducts(): Promise<Product[]> {
  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) return [];
    const text = await response.text();
    return parseCSVProducts(text);
  } catch {
    return [];
  }
}