export function formatPrice(price: number): string {
  return `$${price.toLocaleString('es-AR')}`;
}

export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL;
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  const separator = base.endsWith('/') ? '' : '/';
  return `${base}${separator}${normalized}`;
}
