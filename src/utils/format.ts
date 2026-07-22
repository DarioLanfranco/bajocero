import { TIPO_VENTA, presentacionToTipoKey } from '../types/tipoVenta';

export function formatPrice(price: number): string {
  return `$${price.toLocaleString('es-AR')}`;
}

export function formatWeight(quantity: number, presentacion?: string): string {
  if (!presentacion) return `${quantity}`;
  const tipoKey = presentacionToTipoKey(presentacion);
  if (!tipoKey) return `${quantity}`;
  const config = TIPO_VENTA[tipoKey];

  if (tipoKey === 'pack') return `${quantity}`;

  if (tipoKey === 'unidad') {
    if (quantity === 1) return '500g aprox.';
    if (quantity % 2 === 0) return `${quantity / 2} kg aprox.`;
    return `${(quantity / 2).toFixed(1).replace('.', ',')} kg aprox.`;
  }

  if (tipoKey === 'unidad400') {
    const totalGrams = quantity * config.gramsPerUnit!;
    if (totalGrams < 1000) return `${totalGrams}g aprox.`;
    if (totalGrams % 1000 === 0) return `${totalGrams / 1000} kg aprox.`;
    return `${(totalGrams / 1000).toFixed(1).replace('.', ',')} kg aprox.`;
  }

  if (tipoKey === 'kg') {
    if (quantity === 0.5) return '500g aprox.';
    if (quantity === 1) return '1 kg aprox.';
    if (Math.abs(quantity - Math.round(quantity)) < 0.01) return `${Math.round(quantity)} kg aprox.`;
    return `${quantity.toFixed(1).replace('.', ',')} kg aprox.`;
  }

  return `${quantity}`;
}

export function formatWeightDetail(quantity: number, presentacion?: string): string {
  if (!presentacion) return '';
  const tipoKey = presentacionToTipoKey(presentacion);
  if (!tipoKey) return '';

  if (tipoKey === 'unidad') {
    const totalWeight = formatWeight(quantity, presentacion);
    const porciones = quantity === 1 ? '1 porción de 500g' : `${quantity} porciones de 500g`;
    return `Llevás: ${totalWeight} (${porciones})`;
  }

  if (tipoKey === 'unidad400') {
    const totalWeight = formatWeight(quantity, presentacion);
    return `Llevás: ${totalWeight}`;
  }

  if (tipoKey === 'kg') {
    const label = formatWeight(quantity, presentacion);
    return `Llevás: ${label}`;
  }

  if (tipoKey === 'pack') {
    const label = quantity === 1 ? 'unidad' : 'unidades';
    return `Llevás: ${quantity} ${label}`;
  }

  return '';
}

export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL;
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  const separator = base.endsWith('/') ? '' : '/';
  return `${base}${separator}${normalized}`;
}


