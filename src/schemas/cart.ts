import { z } from 'zod';

export const TIPO_VENTA_KEYS = ['kg', 'unidad', 'unidad400', 'pack'] as const;

export const TipoVentaKeySchema = z.enum(TIPO_VENTA_KEYS);

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().int().nonnegative(),
  presentacion: z.string().optional(),
  tipoVenta: TipoVentaKeySchema.optional(),
});

export const cartStorageSchema = z.object({
  version: z.literal(1),
  items: z.array(cartItemSchema),
});

export type CartItemSchema = z.infer<typeof cartItemSchema>;
