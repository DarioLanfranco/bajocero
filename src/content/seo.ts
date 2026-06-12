import type { BusinessInfo } from '../types/Business';

export function getSiteDescription(business: BusinessInfo): string {
  return business.description;
}

export function getSiteTitle(business: BusinessInfo, page?: string): string {
  return page ? `${page} — ${business.name}` : `${business.name} — ${business.slogan}`;
}

interface JsonLdProps {
  business: BusinessInfo;
  siteUrl: string;
  ogImage: string;
}

export function getJsonLd({ business, siteUrl, ogImage }: JsonLdProps): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FoodStore',
    name: business.name,
    image: ogImage,
    '@id': siteUrl,
    url: siteUrl,
    telephone: business.phone.replace(/[\s+]/g, ''),
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Av. Roberto Payró 913',
      addressLocality: 'Río Cuarto',
      addressRegion: 'Córdoba',
      postalCode: 'X5800',
      addressCountry: 'AR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -33.1235,
      longitude: -64.3492,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '14:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '16:00',
        closes: '20:30',
      },
    ],
    sameAs: ['https://www.instagram.com/bajocerooficial'],
  };
}
