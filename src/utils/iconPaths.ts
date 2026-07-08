export interface PathDef {
  tag: 'path' | 'circle' | 'line' | 'polyline' | 'polygon' | 'rect';
  attrs: Record<string, string>;
}

export interface IconDefinition {
  paths: PathDef[];
  fill?: string;
  stroke?: string;
}

export const ICON_DEFS: Record<string, IconDefinition> = {
  layers: {
    paths: [
      { tag: 'path', attrs: { d: 'M12 2L2 7l10 5 10-5-10-5z' } },
      { tag: 'path', attrs: { d: 'M2 17l10 5 10-5' } },
      { tag: 'path', attrs: { d: 'M2 12l10 5 10-5' } },
    ],
  },
  'grid-plus': {
    paths: [
      { tag: 'rect', attrs: { x: '2', y: '2', width: '20', height: '20', rx: '2' } },
      { tag: 'path', attrs: { d: 'M8 12h8' } },
      { tag: 'path', attrs: { d: 'M12 8v8' } },
    ],
  },
  clock: {
    paths: [
      { tag: 'circle', attrs: { cx: '12', cy: '12', r: '10' } },
      { tag: 'polyline', attrs: { points: '12 6 12 12 16 14' } },
    ],
  },
  'map-pin': {
    paths: [
      { tag: 'path', attrs: { d: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z' } },
      { tag: 'circle', attrs: { cx: '12', cy: '10', r: '3' } },
    ],
  },
  phone: {
    paths: [
      { tag: 'path', attrs: { d: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z' } },
    ],
  },
  cart: {
    paths: [
      { tag: 'circle', attrs: { cx: '9', cy: '21', r: '1' } },
      { tag: 'circle', attrs: { cx: '20', cy: '21', r: '1' } },
      { tag: 'path', attrs: { d: 'M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6' } },
    ],
  },
  plus: {
    paths: [
      { tag: 'line', attrs: { x1: '12', y1: '5', x2: '12', y2: '19' } },
      { tag: 'line', attrs: { x1: '5', y1: '12', x2: '19', y2: '12' } },
    ],
  },
  minus: {
    paths: [
      { tag: 'line', attrs: { x1: '5', y1: '12', x2: '19', y2: '12' } },
    ],
  },
  search: {
    paths: [
      { tag: 'circle', attrs: { cx: '11', cy: '11', r: '8' } },
      { tag: 'line', attrs: { x1: '21', y1: '21', x2: '16.65', y2: '16.65' } },
    ],
  },
  'star-filled': {
    paths: [
      { tag: 'polygon', attrs: { points: '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' } },
    ],
    fill: 'currentColor',
    stroke: 'none',
  },
  'search-off': {
    paths: [
      { tag: 'circle', attrs: { cx: '11', cy: '11', r: '8' } },
      { tag: 'line', attrs: { x1: '21', y1: '21', x2: '16.65', y2: '16.65' } },
      { tag: 'line', attrs: { x1: '8', y1: '11', x2: '14', y2: '11' } },
    ],
  },
};
