const SVG_NS = 'http://www.w3.org/2000/svg';

export function createMinusIcon(size: number): SVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2.5');
  svg.setAttribute('stroke-linecap', 'round');
  const line = document.createElementNS(SVG_NS, 'line');
  line.setAttribute('x1', '5');
  line.setAttribute('y1', '12');
  line.setAttribute('x2', '19');
  line.setAttribute('y2', '12');
  svg.appendChild(line);
  return svg;
}

export function createPlusIcon(size: number): SVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2.5');
  svg.setAttribute('stroke-linecap', 'round');
  const h = document.createElementNS(SVG_NS, 'line');
  h.setAttribute('x1', '12');
  h.setAttribute('y1', '5');
  h.setAttribute('x2', '12');
  h.setAttribute('y2', '19');
  const v = document.createElementNS(SVG_NS, 'line');
  v.setAttribute('x1', '5');
  v.setAttribute('y1', '12');
  v.setAttribute('x2', '19');
  v.setAttribute('y2', '12');
  svg.append(h, v);
  return svg;
}
