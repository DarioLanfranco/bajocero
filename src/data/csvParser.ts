import { z } from "zod";
import type { Product } from "../types/Product";
import { TIPO_VENTA } from "../types/tipoVenta";
import type { TipoVentaKey } from "../types/tipoVenta";
import { TipoVentaKeySchema } from "../schemas/cart";
import { log } from "../utils/logger";
import { getProductCategory, UNCLASSIFIED_CATEGORY } from "./catalog";

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
  imageUrl: z
    .string()
    .refine((v) => v === "" || v.startsWith("https://ik.imagekit.io/"), {
      message: "imageUrl must be empty or an allowlisted ImageKit https URL",
    }),
  stock: z.boolean(),
  offerLabel: z.string(),
  venta: z.string(),
  cantidadPorKg: z.number().nonnegative(),
});

type CSVRow = z.infer<typeof CSV_ROW_SCHEMA>;

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