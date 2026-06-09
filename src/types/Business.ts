export interface BusinessHours {
  days: string;
  hours: string;
}

export interface BusinessInfo {
  name: string;
  slogan: string;
  description: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  addressShort: string;
  instagram: string;
  facebook: string;
  hours: BusinessHours[];
  deliveryZones: string[];
}
