import type { CartItem } from '../types/cart';
import { formatPrice } from '../utils/format';

export interface WhatsAppMessageData {
  name: string;
  items: CartItem[];
  deliveryLabel: string;
  paymentLabel: string;
  subtotal: number;
}

export function buildWhatsAppMessage(data: WhatsAppMessageData): string {
  const itemsList = data.items
    .map((item) => `• ${item.quantity}x ${item.name} • ($${formatPrice(item.price)})`)
    .join('\n');

  return `❄️ *Nuevo Pedido Web — Bajo Cero* ❄️ 

👤 *Cliente:* ${data.name}
📍 *Método:* ${data.deliveryLabel}
💳 *Pago:* ${data.paymentLabel}

🛒 *Productos:*
${itemsList}

💰 *Total Neto:* *$${formatPrice(data.subtotal)}*


_Pedido enviado desde Bajo Cero App._`;
}
