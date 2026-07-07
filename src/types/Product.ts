export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isAvailable: boolean;
  isOffer?: boolean;
  offerLabel?: string;
  offerPrice?: number;
  isFresh?: boolean;
  presentacion?: string;
  imageUrl?: string;
}

export interface CSVRow {
  plu: string;
  name: string;
  price: number;
  imageUrl: string;
  stock: boolean;
  offerLabel: string;
  venta: string;
}
