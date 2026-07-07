export function formatPrice(price: number): string {
  return `$${price.toLocaleString('es-AR')}`;
}

export function formatWeight(quantity: number, presentacion?: string): string {
  if (!presentacion) return `${quantity}`;

  if (presentacion === 'Por 500g') {
    if (quantity === 1) return '500g';
    if (quantity % 2 === 0) return `${quantity / 2} kg`;
    return `${(quantity / 2).toFixed(1)} kg`;
  }

  if (presentacion === 'Por Pack / Unidad') {
    return `${quantity} ${quantity === 1 ? 'unidad' : 'unidades'}`;
  }

  return `${quantity}`;
}

export function formatWeightDetail(quantity: number, presentacion?: string): string {
  if (!presentacion) return '';

  if (presentacion === 'Por 500g') {
    const totalWeight = formatWeight(quantity, presentacion);
    const porciones = quantity === 1 ? '1 porción de 500g' : `${quantity} porciones de 500g`;
    return `Llevás: ${totalWeight} (${porciones})`;
  }

  if (presentacion === 'Por Pack / Unidad') {
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
