const IMAGEKIT_RE = /^https:\/\/ik\.imagekit\.io\//;
const SRC_SET_WIDTHS = [320, 480, 640, 800, 1200, 1920];

export const DEFAULT_IMAGE_SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

export interface ImageLoaderOptions {
  width: number;
  height?: number;
  quality?: number;
}

export type ImageLoader = (url: string, opts: ImageLoaderOptions) => string;

function imageKitLoader(url: string, opts: ImageLoaderOptions): string {
  const params = [`w-${opts.width}`, 'f-auto'];
  if (opts.height) params.push(`h-${opts.height}`);
  params.push(`q-${opts.quality ?? 80}`);
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}tr=${params.join(',')}`;
}

function passthroughLoader(url: string, _opts: ImageLoaderOptions): string {
  return url;
}

let currentLoader: ImageLoader = (url, opts) => {
  return IMAGEKIT_RE.test(url) ? imageKitLoader(url, opts) : passthroughLoader(url, opts);
};

export function setImageLoader(loader: ImageLoader): void {
  currentLoader = loader;
}

export function transformImageUrl(url: string, opts: ImageLoaderOptions): string {
  return currentLoader(url, opts);
}

export function generateSrcSet(url: string): string {
  if (!url) return '';
  return SRC_SET_WIDTHS
    .map((w) => `${transformImageUrl(url, { width: w })} ${w}w`)
    .join(', ');
}
