export function formatPrice(price: number): string {
  return `$${price.toLocaleString('es-AR')}`;
}

export function formatWeight(quantity: number, presentacion?: string): string {
  if (!presentacion || presentacion === 'Por Pack') return `${quantity}`;

  if (presentacion === '500g aprox.') {
    if (quantity === 1) return '500g aprox.';
    if (quantity % 2 === 0) return `${quantity / 2} kg aprox.`;
    return `${(quantity / 2).toFixed(1).replace('.', ',')} kg aprox.`;
  }

  if (presentacion === '400g aprox.') {
    const totalGrams = quantity * 400;
    if (totalGrams < 1000) return `${totalGrams}g aprox.`;
    if (totalGrams % 1000 === 0) return `${totalGrams / 1000} kg aprox.`;
    return `${(totalGrams / 1000).toFixed(1).replace('.', ',')} kg aprox.`;
  }

  if (presentacion === 'Por 1 kg') {
    if (quantity === 0.5) return '500g aprox.';
    if (quantity === 1) return '1 kg aprox.';
    if (Math.abs(quantity - Math.round(quantity)) < 0.01) return `${Math.round(quantity)} kg aprox.`;
    return `${quantity.toFixed(1).replace('.', ',')} kg aprox.`;
  }

  return `${quantity}`;
}

export function formatWeightDetail(quantity: number, presentacion?: string): string {
  if (!presentacion) return '';

  if (presentacion === '500g aprox.') {
    const totalWeight = formatWeight(quantity, presentacion);
    const porciones = quantity === 1 ? '1 porción de 500g' : `${quantity} porciones de 500g`;
    return `Llevás: ${totalWeight} (${porciones})`;
  }

  if (presentacion === '400g aprox.') {
    const totalWeight = formatWeight(quantity, presentacion);
    return `Llevás: ${totalWeight}`;
  }

  if (presentacion === 'Por 1 kg') {
    const label = formatWeight(quantity, presentacion);
    return `Llevás: ${label}`;
  }

  if (presentacion === 'Por Pack') {
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
