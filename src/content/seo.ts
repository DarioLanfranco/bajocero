import type { BusinessInfo } from "../types/Business";

export function getSiteDescription(business: BusinessInfo): string {
  return business.description;
}

export function getSiteTitle(business: BusinessInfo): string {
  return `${business.name} — ${business.slogan}`;
}

interface JsonLdProps {
  business: BusinessInfo;
  siteUrl: string;
  ogImage: string;
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const mins = (minutes % 60).toString().padStart(2, "0");
  return `${hours}:${mins}`;
}

function getOpenDays(business: BusinessInfo): string[] {
  const closed = new Set(business.hoursStructured.closedWeekdays);
  return DAY_NAMES.filter((_, index) => !closed.has(index));
}

function getOpeningHours(business: BusinessInfo): Array<Record<string, unknown>> {
  const dayOfWeek = getOpenDays(business);
  const { morning, afternoon } = business.hoursStructured;
  return [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek,
      opens: minutesToTime(morning.open),
      closes: minutesToTime(morning.close),
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek,
      opens: minutesToTime(afternoon.open),
      closes: minutesToTime(afternoon.close),
    },
  ];
}

function getSameAs(business: BusinessInfo): string[] {
  const links: string[] = [];
  if (business.instagram) {
    links.push(`https://www.instagram.com/${business.instagram}`);
  }
  if (business.facebook) {
    links.push(business.facebook);
  }
  return links;
}

export function getJsonLd({
  business,
  siteUrl,
  ogImage,
}: JsonLdProps): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FoodStore",
    name: business.name,
    image: ogImage,
    "@id": siteUrl,
    url: siteUrl,
    telephone: business.phone.replace(/\s+/g, ""),
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: business.streetAddress,
      addressLocality: business.addressLocality,
      addressRegion: business.addressRegion,
      postalCode: business.postalCode,
      addressCountry: business.addressCountry,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: business.latitude,
      longitude: business.longitude,
    },
    openingHoursSpecification: getOpeningHours(business),
    sameAs: getSameAs(business),
  };
}
