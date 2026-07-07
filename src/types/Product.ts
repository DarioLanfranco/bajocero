export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  isAvailable: boolean;
  offerLabel?: string;
  isFresh?: boolean;
  presentacion?: string;
  imageUrl?: string;
  cantidadPorKg?: number;
}
