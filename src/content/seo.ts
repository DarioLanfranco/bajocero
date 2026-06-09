import type { BusinessInfo } from '../types/Business';

export function getSiteDescription(business: BusinessInfo): string {
  return business.description;
}

export function getSiteTitle(business: BusinessInfo, page?: string): string {
  return page ? `${page} — ${business.name}` : `${business.name} — ${business.slogan}`;
}
