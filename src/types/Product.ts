export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
  isOffer?: boolean;
  offerPrice?: number;
  isFresh?: boolean;
  createdAt?: Date;
}
