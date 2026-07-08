import { ICON_DEFS } from '../utils/iconPaths';

const SVG_NS = 'http://www.w3.org/2000/svg';

function setAttrs(el: SVGElement, attrs: Record<string, string>): void {
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value);
  }
}

export function createIcon(name: string, size: number, strokeWidth = 2.5): SVGElement {
  const def = ICON_DEFS[name];
  if (!def) throw new Error(`Icon "${name}" not found`);

  const svg = document.createElementNS(SVG_NS, 'svg');
  setAttrs(svg, {
    width: String(size),
    height: String(size),
    viewBox: '0 0 24 24',
    fill: def.fill ?? 'none',
    stroke: def.stroke ?? 'currentColor',
    'stroke-width': String(strokeWidth),
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  });

  for (const p of def.paths) {
    const el = document.createElementNS(SVG_NS, p.tag);
    setAttrs(el, p.attrs);
    svg.appendChild(el);
  }

  return svg;
}

export function createMinusIcon(size: number): SVGElement {
  return createIcon('minus', size, 2.5);
}

export function createPlusIcon(size: number): SVGElement {
  return createIcon('plus', size, 2.5);
}
