# StockPulse CIPSA — Stock Reporter (Lit PWA)

> Sistema de reportes de stock para CIPSA — PWA offline-first con datos en vivo desde API.
> Desarrollado con Lit Web Components, forma parte del ecosistema G360.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![G360](https://img.shields.io/badge/G360-skill-cipsa--movil-green.svg)](https://github.com/carloscus/g360-cli)

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND → GitHub Pages                                        │
│  https://carloscus.github.io/g360-stock-reporter/               │
│  · Lit 3 Web Components (app-root, pulso-form, estado-panel...) │
│  · ExcelJS (generación de XLSX en browser)                      │
│  · Fuse.js (búsqueda fuzzy)                                     │
│  · PWA con Service Worker                                       │
└──────────────────────┬──────────────────────────────────────────┘
                       │ fetch
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  BACKEND → Render (API)                                         │
│  https://g360-stock-api.onrender.com/api/v1/stock               │
│  · Consulta appweb.cipsa.com.pe:8054 en tiempo real             │
│  · Responde formato enriquecido con 8 almacenes                 │
│  · CORS habilitado                                              │
└─────────────────────────────────────────────────────────────────┘
```

## Flujo de datos — 4 capas con frescura de 15 min

```
┌─────────────────────────────────────────────────────────────────┐
│  CAPA 1: API en vivo (onrender)                                 │
│  → Datos frescos, 7 almacenes, predespacho, inspección (121)    │
│  → Tiempo: ~2-3s, requiere internet                             │
│  → Lectura protegida con clave de alcance reducido              │
│    (operaciones administrativas permanecen separadas)            │
│  → Se actualiza cada ~15 min desde appweb.cipsa.com.pe          │
│  → Reporte: 13 columnas completo                                │
└──────────────────────┬──────────────────────────────────────────┘
                       │ guarda → (todos los niveles)
┌──────────────────────▼──────────────────────────────────────────┐
│  CAPA 2: memoria (in-mem) — <1ms                                │
│  → Variable _cachedData en runtime                               │
│  → Todos los componentes reciben al instante                    │
└──────────────────────┬──────────────────────────────────────────┘
                       │ guarda →
┌──────────────────────▼──────────────────────────────────────────┐
│  CAPA 3: sessionStorage — <5 min                                │
│  → Sobrevive recargas de página                                 │
│  → Reporte: igual que API                                       │
└──────────────────────┬──────────────────────────────────────────┘
                       │ guarda →
┌──────────────────────▼──────────────────────────────────────────┐
│  CAPA 4: localStorage — hasta 7 días                            │
│  → Sobrevive cierre de navegador                                │
│  → Reporte: completo si datos válidos                           │
└─────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────┐
  │  FRESCHNESS CHECK + WAKE (ventana Lun-Sáb 07:00-22:59 Lima) │
  │  · Probe ligero (limit=1, ~1 KB) cada 10 min vs fecha API   │
  │  · Si el servidor cambió fecha_descarga → descarga completa │
  │  · Keep-alive /health (~1 KB) cada 5 min: mantiene Render   │
  │    despierto y evita pagar cold start (30-90s) en descargas │
  │  · Si el probe falla (servidor dormido) → reintenta con     │
  │    backoff (45s/90s) mostrando "Servidor despertando…"      │
  │  · Fuera de la ventana (domingo/madrugada) no se hace red   │
  │  · Badge en UI: 🟢 "hace X min" / 🟡 "Actualizando…"        │
  │                 / 🔵 "Servidor despertando…"                 │
  └─────────────────────────────────────────────────────────────┘
```

**Prioridad de carga en `loadStockData()`:**
```
memoria (<1ms) → sessionStorage (<5min) → localStorage (<7d, >15min=fresh) → API
```

## Estructura

```
src/
├── components/
│   ├── app-root.js        # Raíz: navegación, store subscription
│   ├── stock-header.js    # Header con tema toggle
│   ├── pulso-form.js      # Formulario + modal de descarga XLSX
│   ├── estado-panel.js    # Dashboard KPIs + categorías por estado
│   ├── stock-alerts.js    # Lista filtrada de alertas
│   ├── stock-search.js    # Búsqueda fuzzy con Fuse.js
│   └── sin-catalogo-panel.js  # Ítems fuera del catálogo maestro
├── core/
│   ├── stock-store.js     # Store centralizado (pub/sub + 3 capas cache)
│   ├── stock-service.js   # Carga de datos con fallback a localStorage
│   ├── report-generator.js # Generación XLSX en browser (ExcelJS)
│   └── skill.json         # Configuración del skill G360
├── styles/
│   └── main.css           # Variables G360, tema dark/light
└── index.js               # Entry point
public/
├── manifest.json          # PWA manifest (CIPSA branding)
├── sw.js                  # Service Worker (cache strategies)
├── pwa-register.js        # Registro SW + install prompt
├── favicon.svg            # Logo CIPSA
├── icon-{192,512}.png     # PWA icons
├── exceljs.min.js         # Librería Excel (generación XLSX)
└── g360-signature.js      # Branding G360
```

## Datos

| Fuente | Contenido | Vigencia |
|--------|-----------|----------|
| API onrender | Stock en vivo, 8 almacenes | Tiempo real (refresca ~15 min) |
| localStorage | Última carga exitosa | 7 días |
| sessionStorage | Carga actual | 5 minutos |
| Memoria | Datos en runtime | Sesión actual |

## Regla de unidades vs cajas

El stock se reporta según el empaque de cada SKU (`un_bx` unidades por caja):

- **un_bx > 1** → se vende por caja: se muestra `N bx` (cajas completas). Las cajas
  incompletas solo se muestran cuando no alcanza ni una caja (`0 bx · M u`) para
  revisión granular; no inflan el total de cajas.
- **un_bx 0 / 1 o ausente** → se vende por unidad: se muestra `N u` (unidades) y el
  SKU aporta 0 al total de cajas, evitando inflar el volumen.
- **Estado del SKU**: `AGOTADO` si `bx === 0`, `BAJO` si `1 ≤ bx < 10`, `OK` en otro caso.
- **Disponible para venta**: el dashboard suma únicamente `disponible` de almacenes con tipo `venta`.
  `predespacho` se muestra como comprometido y `stock` representa el total físico (`disponible + predespacho`).
- **Catálogo maestro**: un SKU pertenece al catálogo cuando tiene `estado_linea`
  definido; los demás van al panel "Sin Catálogo".

## Scripts

```bash
npm run dev       # Desarrollo (Vite en puerto 3000)
npm run build     # Producción (dist/)
npm run preview   # Preview producción
```

## Deploy (GitHub Actions)

El deploy es automático vía GitHub Actions: cada push a `main` dispara el
workflow `.github/workflows/deploy.yml` (build con Vite + upload a GitHub Pages).

```bash
git add -A && git commit -m "feat: ..."
git push
```

GitHub → Settings → Pages → Source: `GitHub Actions`.

## Configurar Backend (Render)

El backend (`g360-stock-api`) debe estar desplegado en Render con:
- **CORS** habilitado
- **Endpoint**: `GET /api/v1/stock` con header `X-API-Key` de lectura
- **Fuente de datos**: appweb.cipsa.com.pe:8054
- **Catálogo maestro**: auto-cargado desde `carloscus/g360-master-data` al arrancar (o vía `POST /api/v1/catalog/upload`)

Variables de entorno:
```
PORT=8000
```

## Tech Stack

- **Frontend**: Lit 3.1, Vite 5, ExcelJS, Fuse.js
- **PWA**: Service Worker, manifest.json, cache strategies
- **Backend**: FastAPI, httpx, xlsx (appweb scraper)
- **Hosting**: GitHub Pages (frontend) + Render (backend)
- **G360**: Skill `cipsa-movil`, signature `powered`

## Familia G360

- **[g360-cli](https://github.com/carloscus/g360-cli)**: Bootstrap y gestión de proyectos
- **[g360-signature](https://github.com/carloscus/g360-signature)**: Branding web component
- **[g360-stock-api](https://github.com/carloscus/g360-stock-api)**: Backend de datos de stock
- **[g360-master-data](https://github.com/carloscus/g360-master-data)**: Catálogo maestro de productos

---
**Marca**: CIPSA · **Skill**: cipsa-movil · **Autor**: Carlos Cusi
**Powered by**: [g360-signature](https://github.com/carloscus/g360-signature)
