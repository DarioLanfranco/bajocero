# Bajo Cero — Frontend

Landing page + catálogo e-commerce de **Bajo Cero**, una carnicería de productos congelados IQF. El sitio es una SPA estática (SSG) con carrito de compras en el cliente, catálogo alimentado por hoja de cálculo, y soporte offline completo como Progressive Web App (PWA).

## Stack

| Área | Tecnología |
| --- | --- |
| Framework | [Astro](https://astro.build) 6 (SSG, `output: 'static'`) |
| Lenguaje | TypeScript 6 |
| Estilos | CSS nativo con `@layer` y CSS custom properties (sin framework UI) |
| Validación de datos | [Zod](https://zod.dev) |
| Generación de PDF | jsPDF (pedido en el carrito) |
| Testing | Vitest + Happy DOM |
| PWA | Service Worker generado en build (`src/pages/sw.js.ts`) |
| Deploy | Vercel (`site: https://bajocero-omega.vercel.app`) |

## Arquitectura de datos

### Flujo del catálogo

1. **Fuente primaria (runtime):** el catálogo se sirve desde una hoja de cálculo pública de Google Sheets publicada como CSV (`PUBLIC_GOOGLE_SHEETS_URL`).
2. **Fallback local:** si el fetch falla, se usa el catálogo hardcodeado en `src/data/products.ts`.
3. **Cache en cliente:** los productos parseados se cachean en `localStorage` (clave `bajocero-csv-cache`, vigencia 30 min) para evitar re-fetchs.
4. **Revalidación en cliente:** `src/scripts/productRevalidation.ts` (`initProductRevalidation`) re-lee el CSV al cargar la página, actualiza precios/disponibilidad en el DOM (atributos `data-product-*`) y dispara el evento `bajocero:products-updated` cuando hay cambios.

### Parser CSV

- `src/data/csvProducts.ts` valida filas con Zod.
- Detecta separador `;`/`,` automáticamente.
- Acepta `IMAGEN` y su alias `IMAGEN_PRODUCTO` para la columna de imagen.
- `COLUMN_SIGNATURE` reporta (solo en dev) diferencias de estructura contra la planilla.

### Estrategia PWA / Service Worker

El SW se genera en build desde `src/pages/sw.js.ts` (cache `bajocero-cache-v8`):

| Request | Estrategia |
| --- | --- |
| Navegaciones (`mode: navigate`) | `networkFirst` con fallback a `404.html` |
| Assets (`js|css|png|jpg|svg|webp|woff2`, etc.) | `cacheFirst` |
| Resto (XHR, Google Fonts, etc.) | `staleWhileRevalidate` |

- Precache en `install` de todas las páginas, manifest e íconos.
- Cache runtime limitada a 50 entradas (`trimRuntimeCache`).
- Registro global del SW en `src/layouts/Layout.astro` vía `public/scripts/sw-register.js` (path derivado de `withBase('/sw.js')`), diferido con `requestIdleCallback` para no impactar FCP.
- La aplicación no usa `unsafe-inline` en `script-src` (CSP estricta en `Layout.astro`); el theme-flash corre en `public/scripts/theme-flash.js`.

## Variables de entorno

Copia `.env.example` a `.env` (solo para desarrollo; en CI se inyectan como variables de Actions):

| Variable | Descripción | Ejemplo |
| --- | --- | --- |
| `PUBLIC_SITE_URL` | URL canónica del sitio (sin trailing slash) | `https://bajocero-omega.vercel.app` |
| `PUBLIC_OG_IMAGE` | URL absoluta de la imagen Open Graph | `https://bajocero-omega.vercel.app/assets/images/og-image.png` |
| `PUBLIC_GOOGLE_SHEETS_URL` | URL pública del catálogo en CSV (`File > Share > Publish to web`) | `https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?gid=0&single=true&output=csv` |
| `PUBLIC_WHATSAPP_NUMBER` | Número de WhatsApp con código de país, sin símbolos | `+543586006854` |

> Las variables `PUBLIC_*` se embeben en el bundle en tiempo de build: no almacenes secretos con ese prefijo. La base del sitio se configura en `astro.config.mjs` (`site` + `base: '/bajocero'`), no como variable de entorno.

## Setup local

```sh
npm install        # instalar dependencias
```

| Comando | Acción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo (Astro dev) en `localhost:4321` |
| `npm run build` | Compilación de producción en `./dist/` (SSG + SW + sitemap/robots) |
| `npm run preview` | Previsualiza el build localmente |
| `npm test` | Ejecuta la suite completa de tests (Vitest) |
| `npm run test:watch` | Suite en modo watch |
| `npx tsc --noEmit` | Verificación estática de tipos sin emitir |

## Pipeline de despliegue

El sitio es 100% estático y se publica en **Vercel** bajo `https://bajocero-omega.vercel.app/` (`base: '/'`).

Flujo recomendado (GitHub Actions):

1. `actions/checkout` + `actions/setup-node` (Node ≥ 22.12).
2. `npm ci`.
3. `npx tsc --noEmit && npm test` (gate de calidad).
4. `npm run build` → produce `dist/`.
5. Publicar `dist/` en la rama `gh-pages` (p. ej. con `peaceiris/actions-gh-pages` o `actions/upload-pages-artifact`).

Configuración de repositorio:

- **Settings → Pages → Source:** `GitHub Actions` (o rama `gh-pages`).
- **Secrets de Actions** (si el deploy lo requiere): ninguno obligatorio; las variables públicas se pasan como `env` en el job (`PUBLIC_SITE_URL`, `PUBLIC_GOOGLE_SHEETS_URL`, etc.).

> El SW precachea las rutas en `src/pages/sw.js.ts`; si agregas páginas, actualiza también `PRECACHE_URLS` y la versión de `CACHE_NAME` para invalidar la caché del navegador.

## Estructura relevante

```text
src/
├── components/        # UI y secciones (cart/, catalog/, sections/)
├── data/              # catálogo, business, faq, csvProducts (fuente CSV)
├── layouts/           # Layout.astro (SEO, CSP, JSON-LD, canonical)
├── pages/             # rutas SSG + sw.js.ts, sitemap.xml.ts, robots.txt.ts
├── scripts/           # lógica de cliente (cart, modal, drawer, revalidación)
├── store/             # estado del carrito
├── styles/            # CSS global (capas + variables)
├── utils/             # helpers (format, seo, images, phone, logger)
└── types/             # tipos de dominio (Product, tipoVenta)
```
