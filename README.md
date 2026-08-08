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
│  https://g360-stock-api.onrender.com/api/v1/stock?key=cipsa...  │
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
  │  FRESCHNESS CHECK (15 min)                                  │
  │  · setInterval cada 60s verifica isStale()                 │
  │  · Si datos >15 min → refreshInBackground() (silencioso)   │
  │  · Si API falla → usa localStorage + retry en background   │
  │  · Badge en UI: 🟢 "hace X min" / 🟡 "🔄 Actualizando…"    │
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
│   ├── estado-panel.js    # Dashboard KPIs + alertas top 10
│   ├── stock-alerts.js    # Lista filtrada de alertas
│   └── stock-search.js    # Búsqueda fuzzy con Fuse.js
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

## Scripts

```bash
npm run dev       # Desarrollo (Vite en puerto 3000)
npm run build     # Producción (dist/)
npm run preview   # Preview producción
npm run deploy    # Deploy a GitHub Pages (gh-pages)
```

## Configurar GitHub Pages

1. Crear branch `gh-pages`:
```bash
npm run deploy
```

2. GitHub → Settings → Pages → Source: `gh-pages` branch, Folder: `/ (root)`

## Configurar Backend (Render)

El backend (`g360-stock-api`) debe estar desplegado en Render con:
- **CORS** habilitado
- **Endpoint**: `GET /api/v1/stock?key=cipsa2026&enrich=true`
- **Fuente de datos**: appweb.cipsa.com.pe:8054
- **Catálogo maestro**: auto-cargado desde `carloscus/g360-master-data` al arrancar (o vía `POST /api/v1/catalog/upload`)

Variables de entorno:
```
PORT=8000
```

## Deploy

```bash
# Frontend
git add -A && git commit -m "feat: ..."
git push
npm run deploy
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
