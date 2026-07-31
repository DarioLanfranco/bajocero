// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const CSV_URL = 'https://example.com/data.csv';

const CSV = `PLU;PRODUCTOS;PRECIO;IMAGEN;STOCK;OFERTA;VENTA;CANTIDAD_POR_KG
1;Milanesa de pollo;7425;https://ik.imagekit.io/img.jpg;SI;;kg;
2;Milanesa de ternera;5000;;NO;;kg;`;

async function loadModule() {
  return import('./csvProducts');
}

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('PUBLIC_GOOGLE_SHEETS_URL', CSV_URL);
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('revalidateProducts', () => {
  it('fetches the CSV source and parses products when cache is stale', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(CSV, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const { revalidateProducts } = await loadModule();
    const fresh = await revalidateProducts();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fresh).toHaveLength(2);
    expect(fresh?.[0]).toMatchObject({
      id: '1',
      name: 'Milanesa de pollo',
      price: 7425,
      imageUrl: 'https://ik.imagekit.io/img.jpg',
    });
  });

  it('returns null on HTTP 500 and keeps the previous cache', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 500 }));
    vi.stubGlobal('fetch', fetchMock);

    const { revalidateProducts } = await loadModule();
    const result = await revalidateProducts();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();
  });

  it('returns null on network error and keeps the fallback intact', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Network Error'));
    vi.stubGlobal('fetch', fetchMock);

    const { revalidateProducts } = await loadModule();
    const result = await revalidateProducts();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();
  });
});
