export interface TipoVentaConfig {
  label: string;
  gramsPerUnit: number | null;
  isWeight: boolean;
  multiplicadorPrecio: number;
}

export const TIPO_VENTA = {
  kg: { label: 'Por 1 kg', gramsPerUnit: 1000, isWeight: true, multiplicadorPrecio: 1 },
  unidad: { label: '500g aprox.', gramsPerUnit: 500, isWeight: false, multiplicadorPrecio: 0.5 },
  unidad400: { label: '400g aprox.', gramsPerUnit: 400, isWeight: false, multiplicadorPrecio: 0.4 },
  pack: { label: 'Por Pack', gramsPerUnit: null, isWeight: false, multiplicadorPrecio: 1 },
} as const satisfies Record<string, TipoVentaConfig>;

export type TipoVentaKey = keyof typeof TIPO_VENTA;

const PRESENTACION_TO_TIPO = new Map<string, TipoVentaKey>(
  (Object.keys(TIPO_VENTA) as TipoVentaKey[]).map((key) => [TIPO_VENTA[key].label, key]),
);

export function presentacionToTipoKey(presentacion: string): TipoVentaKey | undefined {
  return PRESENTACION_TO_TIPO.get(presentacion);
}
