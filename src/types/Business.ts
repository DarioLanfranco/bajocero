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
  instagram: string;
  facebook: string;
  hours: BusinessHours[];
  hoursStructured: BusinessHoursStructured;
  deliveryZones: string[];
}
