export interface BusinessHours {
  days: string;
  hours: string;
}

export interface BusinessHoursStructured {
  morning: { open: number; close: number };
  afternoon: { open: number; close: number };
  closedWeekdays: number[];
}

export interface BusinessInfo {
  name: string;
  slogan: string;
  description: string;
  phone: string;
  whatsapp: string;
  email?: string;
  address: string;
  addressShort: string;
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  postalCode: string;
  addressCountry: string;
  latitude: number;
  longitude: number;
  instagram: string;
  facebook: string;
  hours: BusinessHours[];
  hoursStructured: BusinessHoursStructured;
  deliveryZones: string[];
}
