import { describe, it, expect } from 'vitest';
import { parseCSVProducts } from './csvProducts';

const VALID_CSV = `PLU;PRODUCTOS;PRECIO;IMAGEN;STOCK;OFERTA;VENTA
1;Milanesa de pollo;7425;https://ik.imagekit.io/img.jpg;SI;;kg
2;Milanesa de ternera;5000;;NO;;kg
3;Pata muslo oferta x 3 kg;12600;;SI;OFERTA;unidad`;

const CSV_WITH_COMMA_SEPARATOR = `PLU,PRODUCTOS,PRECIO,IMAGEN,STOCK,OFERTA,VENTA
1,Milanesa de pollo,7425,https://ik.imagekit.io/img.jpg,SI,,kg`;

const CSV_MISSING_COLUMNS = `PLU;NOMBRE;PRECIO
1;Test;100`;

const CSV_EMPTY = ``;

const CSV_HEADER_ONLY = `PLU;PRODUCTOS;PRECIO;IMAGEN;STOCK;OFERTA;VENTA`;

const CSV_WITH_INVALID_PRICE = `PLU;PRODUCTOS;PRECIO;IMAGEN;STOCK;OFERTA;VENTA
1;Producto Test;INVALIDO;img.jpg;SI;;unidad`;

describe('parseCSVProducts', () => {
  it('parses valid CSV with semicolon separator', () => {
    const products = parseCSVProducts(VALID_CSV);
    expect(products).toHaveLength(3);
  });

  it('applies kg venta logic (price / 2, presentacion)', () => {
    const products = parseCSVProducts(VALID_CSV);
    const milanesaPollo = products.find((p) => p.id === '1');
    expect(milanesaPollo).toBeDefined();
    expect(milanesaPollo!.price).toBe(3712.5); // 7425 / 2
    expect(milanesaPollo!.presentacion).toBe('Por 500g');
  });

  it('marks unavailable products correctly', () => {
    const products = parseCSVProducts(VALID_CSV);
    const milanesaTernera = products.find((p) => p.id === '2');
    expect(milanesaTernera).toBeDefined();
    expect(milanesaTernera!.isAvailable).toBe(false);
  });

  it('sets offerLabel from OFERTA column', () => {
    const products = parseCSVProducts(VALID_CSV);
    const oferta = products.find((p) => p.id === '3');
    expect(oferta).toBeDefined();
    expect(oferta!.offerLabel).toBe('OFERTA');
  });

  it('handles unidad venta without price halving', () => {
    const products = parseCSVProducts(VALID_CSV);
    const unidad = products.find((p) => p.id === '3');
    expect(unidad).toBeDefined();
    expect(unidad!.price).toBe(12600);
    expect(unidad!.presentacion).toBe('Por Pack / Unidad');
  });

  it('parses CSV with comma separator', () => {
    const products = parseCSVProducts(CSV_WITH_COMMA_SEPARATOR);
    expect(products).toHaveLength(1);
    expect(products[0].id).toBe('1');
  });

  it('returns empty array when required columns are missing', () => {
    const products = parseCSVProducts(CSV_MISSING_COLUMNS);
    expect(products).toHaveLength(0);
  });

  it('returns empty array for empty string', () => {
    const products = parseCSVProducts(CSV_EMPTY);
    expect(products).toHaveLength(0);
  });

  it('returns empty array for header-only CSV', () => {
    const products = parseCSVProducts(CSV_HEADER_ONLY);
    expect(products).toHaveLength(0);
  });

  it('skips rows with invalid price gracefully', () => {
    const products = parseCSVProducts(CSV_WITH_INVALID_PRICE);
    expect(products).toHaveLength(1);
    expect(products[0].price).toBe(0);
  });
});
