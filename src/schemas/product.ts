import { z } from 'zod';
import { TipoVentaKeySchema } from './cart';

export const productCategorySchema = z.enum([
  'AL FUEGO',
  'PRÁCTICOS Y ACOMPAÑAMIENTOS',
  'PANADERÍA Y FRESCOS',
  'PRODUCTOS',
]);

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  category: productCategorySchema,
  isAvailable: z.boolean(),
  offerLabel: z.string().optional(),
  isFresh: z.boolean().optional(),
  presentacion: z.string().optional(),
  imageUrl: z.string().optional(),
  cantidadPorKg: z.number().optional(),
  tipoVenta: TipoVentaKeySchema,
});

export type ProductSchemaType = z.infer<typeof ProductSchema>;
