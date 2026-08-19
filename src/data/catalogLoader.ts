import { fetchCSVProducts } from './csvProducts';
import { products as fallbackProducts } from './products';
import type { Product } from '../types/Product';

export async function loadCatalogProducts(): Promise<Product[]> {
  const csvProducts = await fetchCSVProducts();
  return csvProducts.length > 0 ? csvProducts : fallbackProducts;
}
