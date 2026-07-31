import { SITE_URL } from '../config';

export function canonicalizePath(pathname: string): string {
  const clean = pathname.replace(/\/{2,}/g, '/').replace(/\/+$/, '') + '/';
  return new URL(clean, SITE_URL).toString();
}
