import type { CartItem } from '../types/cart';
import { formatPrice, formatWeight } from '../utils/format';
import { sanitizePhoneNumber } from '../utils/phone';

export interface WhatsAppMessageData {
  name: string;
  items: CartItem[];
  deliveryMode: string;
  deliveryAddress: string;
  paymentMethod: string;
  subtotal: number;
}

const SEPARATOR = '--------------------------------';
const MAX_URL_LENGTH = 2048;
const TRUNCATION_NOTICE = '\n[... mensaje truncado, consulte el detalle en el local ...]';

// ─── Sanitization ────────────────────────────────────────────────

function sanitize(value: string | null | undefined): string {
  return (value ?? '').trim();
}

function sanitizeFallback(value: string | null | undefined, fallback: string): string {
  const s = sanitize(value);
  return s || fallback;
}

function isValidItem(item: CartItem): boolean {
  return Number.isFinite(item.price) && item.price > 0
    && Number.isFinite(item.quantity) && item.quantity > 0;
}

// ─── Label Resolvers ─────────────────────────────────────────────

function resolvePaymentLabel(method: string, deliveryMode: string): string {
  const m = sanitizeFallback(method, 'No especificado');
  if (m === 'efectivo') return deliveryMode === 'envio' ? 'Efectivo al Cadete' : 'Efectivo';
  if (m === 'transferencia') return 'Transferencia';
  return m;
}

// ─── Block Builders ──────────────────────────────────────────────

export function buildHeader(): string {
  return '❄ *Nuevo Pedido Web — Bajo Cero* ❄';
}

export function buildClientBlock(
  name: string,
  deliveryMode: string,
  deliveryAddress: string,
  paymentMethod: string,
): string {
  const n = sanitizeFallback(name, 'Sin nombre');
  const p = resolvePaymentLabel(paymentMethod, deliveryMode);

  if (deliveryMode === 'envio') {
    const a = sanitizeFallback(deliveryAddress, 'No especificada');
    return [
      `👤 *Cliente:* ${n}`,
      '🛵 *Método:* Envio por cadeteria',
      `📍 *Dirección:* ${a}`,
      `💰 *Pago:* ${p}`,
    ].join('\n');
  }

  return [
    `👤 *Cliente:* ${n}`,
    '🏠 *Método:* Retiro en Local',
    `💰 *Pago:* ${p}`,
  ].join('\n');
}

export function isEstimatedItem(item: CartItem): boolean {
  return item.tipoVenta !== undefined && item.tipoVenta !== 'pack';
}

export function hasEstimatedItems(items: CartItem[]): boolean {
  return items.some(isEstimatedItem);
}

export function buildProductList(validItems: CartItem[]): string {
  if (validItems.length === 0) return '_(Sin productos)_';
  return validItems
    .map((item) => {
      const subtotal = item.price * item.quantity;
      const weightLabel = formatWeight(item.quantity, item.presentacion);
      const hasWeight = item.presentacion && item.presentacion !== 'Por Pack';
      if (hasWeight) {
        return `• ${item.name} (${weightLabel}) — ${formatPrice(subtotal)}`;
      }
      return `• ${item.name} x${item.quantity} — ${formatPrice(subtotal)}`;
    })
    .join('\n');
}

export function buildTotalBlock(total: number, items: CartItem[]): string {
  if (hasEstimatedItems(items)) {
    return `💰 *TOTAL ESTIMADO:* ${formatPrice(total)}`;
  }
  return `💰 *TOTAL COMPRA:* ${formatPrice(total)}`;
}

export function buildDisclaimer(): string {
  return '⚖️ El precio final se calcula con el peso exacto en la balanza al preparar tu pedido. El monto final puede variar unos gramos a favor o en contra.';
}

export function buildFooter(): string {
  return '⚡ *Pedido enviado vía Bajo Cero App.*';
}

// ─── Orchestrator ────────────────────────────────────────────────

export function buildWhatsAppMessage(data: WhatsAppMessageData): string {
  const name = sanitizeFallback(data.name, 'Sin nombre');
  const deliveryMode = sanitizeFallback(data.deliveryMode, 'retiro');
  const deliveryAddress = sanitize(data.deliveryAddress);
  const paymentMethod = sanitizeFallback(data.paymentMethod, 'efectivo');
  const validItems = data.items.filter(isValidItem);
  const total = Number.isFinite(data.subtotal) && data.subtotal >= 0 ? data.subtotal : 0;

  const blocks = [
    buildHeader(),
    SEPARATOR,
    buildClientBlock(name, deliveryMode, deliveryAddress, paymentMethod),
    SEPARATOR,
    '🛒 *Productos:*',
    buildProductList(validItems),
    SEPARATOR,
    buildTotalBlock(total, validItems),
    SEPARATOR,
    buildFooter(),
  ];

  if (hasEstimatedItems(validItems)) {
    blocks.splice(blocks.length - 1, 0, buildDisclaimer());
  }

  return blocks.join('\n');
}

// ─── URL Builder ─────────────────────────────────────────────────

export function buildWhatsAppUrl(phone: string, message: string): string {
  const clean = message.replace(/\r\n?/g, '\n').trim();
  const digits = sanitizePhoneNumber(phone);
  const base = `https://api.whatsapp.com/send?phone=${digits}&text=`;
  const maxEncoded = MAX_URL_LENGTH - base.length;

  let finalMsg = clean;
  let encoded = encodeURIComponent(finalMsg);
  if (encoded.length > maxEncoded) {
    finalMsg = clean.slice(0, -TRUNCATION_NOTICE.length); // rough room
    // binary search for safe length
    let lo = 0;
    let hi = finalMsg.length;
    while (lo < hi) {
      const mid = (lo + hi + 1) >>> 1;
      const candidate = finalMsg.slice(0, mid) + TRUNCATION_NOTICE;
      if (encodeURIComponent(candidate).length <= maxEncoded) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    finalMsg = finalMsg.slice(0, lo) + TRUNCATION_NOTICE;
    encoded = encodeURIComponent(finalMsg);
  }

  return base + encoded;
}

export function buildWhatsAppOrderUrl(phone: string, data: WhatsAppMessageData): string {
  const message = buildWhatsAppMessage(data);
  return buildWhatsAppUrl(phone, message);
}
