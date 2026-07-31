import { describe, it, expect } from 'vitest';
import { parseCSVProducts } from './csvProducts';

const VALID_CSV = `PLU;PRODUCTOS;PRECIO;IMAGEN;STOCK;OFERTA;VENTA;CANTIDAD_POR_KG
1;Milanesa de pollo;7425;https://ik.imagekit.io/img.jpg;SI;;kg;
2;Milanesa de ternera;5000;;NO;;kg;
3;Pata muslo oferta x 3 kg;12600;;SI;OFERTA;unidad;`;

const CSV_WITH_COMMA_SEPARATOR = `PLU,PRODUCTOS,PRECIO,IMAGEN,STOCK,OFERTA,VENTA,CANTIDAD_POR_KG
1,Milanesa de pollo,7425,https://ik.imagekit.io/img.jpg,SI,,kg,`;

const CSV_MISSING_COLUMNS = `PLU;NOMBRE;PRECIO
1;Test;100`;

const CSV_EMPTY = ``;

const CSV_HEADER_ONLY = `PLU;PRODUCTOS;PRECIO;IMAGEN;STOCK;OFERTA;VENTA;CANTIDAD_POR_KG`;

const CSV_WITH_INVALID_PRICE = `PLU;PRODUCTOS;PRECIO;IMAGEN;STOCK;OFERTA;VENTA
1;Producto Test;INVALIDO;img.jpg;SI;;unidad`;

describe('parseCSVProducts', () => {
  it('parses valid CSV with semicolon separator', () => {
    const products = parseCSVProducts(VALID_CSV);
    expect(products).toHaveLength(3);
  });

  it('parses imageUrl from IMAGEN column', () => {
    const products = parseCSVProducts(VALID_CSV);
    const milanesaPollo = products.find((p) => p.id === '1');
    expect(milanesaPollo).toBeDefined();
    expect(milanesaPollo!.imageUrl).toBe('https://ik.imagekit.io/img.jpg');
  });

  it('parses imageUrl from IMAGEN_PRODUCTO alias column', () => {
    const csv = `PLU;PRODUCTOS;PRECIO;IMAGEN_PRODUCTO;STOCK;OFERTA;VENTA;CANTIDAD_POR_KG
1;Milanesa de pollo;7425;https://ik.imagekit.io/alias.jpg;SI;;kg;`;
    const products = parseCSVProducts(csv);
    expect(products).toHaveLength(1);
    expect(products[0].imageUrl).toBe('https://ik.imagekit.io/alias.jpg');
  });

  it('applies kg venta logic (keeps full price, presentacion Por 1 kg)', () => {
    const products = parseCSVProducts(VALID_CSV);
    const milanesaPollo = products.find((p) => p.id === '1');
    expect(milanesaPollo).toBeDefined();
    expect(milanesaPollo!.price).toBe(7425);
    expect(milanesaPollo!.presentacion).toBe('Por 1 kg');
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

  it('handles unidad venta (divides price by 2, presentacion 500g aprox.)', () => {
    const products = parseCSVProducts(VALID_CSV);
    const unidad = products.find((p) => p.id === '3');
    expect(unidad).toBeDefined();
    expect(unidad!.price).toBe(6300); // 12600 / 2
    expect(unidad!.presentacion).toBe('500g aprox.');
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

  it('parses cantidadPorKg from CSV when present', () => {
    const csv = `PLU;PRODUCTOS;PRECIO;IMAGEN;STOCK;OFERTA;VENTA;CANTIDAD_POR_KG
5;Medallones de espinaca;5000;img.jpg;SI;;kg;4`;
    const products = parseCSVProducts(csv);
    expect(products).toHaveLength(1);
    expect(products[0].cantidadPorKg).toBe(4);
  });

  it('defaults cantidadPorKg to undefined when column is missing', () => {
    const products = parseCSVProducts(VALID_CSV);
    const milanesa = products.find((p) => p.id === '1');
    expect(milanesa?.cantidadPorKg).toBeUndefined();
  });

  it('parses cantidadPorKg as 0 when value is empty', () => {
    const csv = `PLU;PRODUCTOS;PRECIO;IMAGEN;STOCK;OFERTA;VENTA;CANTIDAD_POR_KG
6;Ravioles;6000;img.jpg;SI;;unidad;`;
    const products = parseCSVProducts(csv);
    expect(products).toHaveLength(1);
    expect(products[0].cantidadPorKg).toBeUndefined();
  });

  it('handles unidad400 venta (multiplies by 0.4, presentacion 400g aprox.)', () => {
    const csv = `PLU;PRODUCTOS;PRECIO;IMAGEN;STOCK;OFERTA;VENTA;CANTIDAD_POR_KG
7;Medallones de espinaca;5000;img.jpg;SI;;unidad400;4`;
    const products = parseCSVProducts(csv);
    expect(products).toHaveLength(1);
    const p = products[0];
    expect(p.price).toBe(2000); // 5000 * 0.4
    expect(p.presentacion).toBe('400g aprox.');
    expect(p.tipoVenta).toBe('unidad400');
  });

  it('handles pack venta (keeps full price, presentacion Por Pack)', () => {
    const csv = `PLU;PRODUCTOS;PRECIO;IMAGEN;STOCK;OFERTA;VENTA;CANTIDAD_POR_KG
8;Pizza Mozzarella;4500;img.jpg;SI;;pack;`;
    const products = parseCSVProducts(csv);
    expect(products).toHaveLength(1);
    const p = products[0];
    expect(p.price).toBe(4500);
    expect(p.presentacion).toBe('Por Pack');
    expect(p.tipoVenta).toBe('pack');
  });
});
