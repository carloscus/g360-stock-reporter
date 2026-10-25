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
│  → Datos frescos, 8 almacenes, predespacho, inspección (121)    │
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
│   ├── app-root.js        # Raíz: navegación, sesión, store subscription
│   ├── login-view.js      # Login local simulado (@cipsa.com.pe)
│   ├── stock-header.js    # Header + menú de sesión (tema / cerrar sesión)
│   ├── install-banner.js  # Banner flotante de instalación PWA (cooldown 14 días)
│   ├── pulso-form.js      # Reporte XLSX (usa la sesión como autor)
│   ├── estado-panel.js    # Dashboard KPIs + categorías + vista de alertas
│   ├── stock-search.js    # Búsqueda fuzzy multi-término + compartir SKUs
│   ├── almacen-legend.js  # Leyenda de colores de almacenes (compartida)
│   └── sin-catalogo-panel.js  # Ítems fuera del catálogo maestro
├── core/
│   ├── stock-store.js     # Store centralizado (pub/sub + 3 capas cache)
│   ├── stock-service.js   # Datos del API, modelo enriquecido y helpers
│   ├── report-generator.js # Generación XLSX en browser (ExcelJS)
│   ├── report-filters.js  # Segmentación del reporte (vigente/categoría/línea)
│   ├── share.js           # Mensaje compacto para compartir SKUs
│   ├── session.js         # Sesión local (nombre + email corporativo)
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
- **Estado del SKU** (sobre cajas del disponible VES): `AGOTADO` si `bx === 0`,
  `BAJO` si `1 ≤ bx < 10`, `OK` en otro caso.
- **Disponible para venta = VES exacto**: el único almacén de venta directa. Los lotes
  129/40/121/122 son informativos y **nunca se suman** (son lotes diferentes).
  `stockFisico` conserva el total físico en almacenes de venta para el valor/peso
  de inventario (KPIs).
- **Catálogo maestro**: un SKU pertenece al catálogo cuando tiene `estado_linea`
  definido; los demás van al panel "Sin Catálogo".

## Jerarquía de almacenes

| Almacén | Rol | Dónde se ve |
|---------|-----|-------------|
| **VES** | Venta directa (disponible principal) | Número principal, columna "Disponible VES", KPIs, estados |
| **129** | Secundario · atendible si VES = 0 | Badge "Atendible del 129", columna informativa |
| **40** | Traslado · solo cantidad alta (≥10 bx) | Badge "Trasladable del 40", columna informativa |
| **121** | Inspección/QC · lote por pasar a VES | Badge "En QC" (≥10 bx), columna informativa |
| **122** | Exportación · solo informativo | Hoja "122 (Exportación)", chip violeta |

- **Buscador**: número = VES exacto; badges de predespacho y fallbacks (129/40/QC);
  chips por almacén con color por rol + leyenda colapsable compartida
  (`almacen-legend.js`); búsqueda multi-término AND insensible a tildes
  (`ignoreDiacritics`); link compartido `?q=SKU` abre la búsqueda ya filtrada.
- **Compartir**: modo "Seleccionar" en el buscador → mensaje compacto de varios
  SKUs (SKU, nombre y Disponible VES) por `navigator.share` (WhatsApp) con
  fallback a `wa.me`/portapapeles. Pensado para PWA móvil, donde compartir texto
  es más confiable que descargar archivos.
- **XLSX**: por defecto es un **reporte rápido**: catálogo vigente (sin
  descontinuados), categorías principales y Disponible VES; el alcance puede
  acotarse a **una línea** y se pueden incluir no vigentes a pedido. Columnas
  informativas 129/40/121 (checkbox) + hoja adicional "122 (Exportación)"
  (checkbox propio o descarga directa desde el menú Exportar del dashboard).
- **Acceso**: login local simulado (nombre + email `@cipsa.com.pe`) como página de
  entrada; sesión en localStorage y menú de sesión en el header (tema claro/oscuro
  y cerrar sesión). No es autenticación (sin backend): firma los reportes y evita
  pedir datos en cada descarga.
- **Instalar (PWA)**: banner flotante en móvil; Android usa el prompt nativo e iOS
  muestra los pasos manuales. Se oculta si ya está instalada o si se cerró en los
  últimos 14 días.
- **Formulario**: sin campos de identidad (usa la sesión); guía "Instrucciones"
  colapsable (abierta en primera visita).
- **PWA**: banner "Nueva versión → Actualizar" al detectar update del SW; safe-areas
  para notch/gestos; sin `orientation` forzada; SW sin requests duplicados al API.

## Paleta y temas

Los componentes **no usan colores sueltos**: todo sale de tokens semánticos
definidos en `src/styles/main.css` para dark y light (contrastes AA en claro).

| Rol | Dark | Light |
|-----|------|-------|
| Acento de marca (VES, CTAs) | `#00d084` | `#047857` |
| Texto sobre acento | `#06281c` | `#ffffff` |
| Success / Warning / Danger / Info | `#22c55e` / `#f59e0b` / `#ef4444` / `#3b82f6` | `#15803d` / `#b45309` / `#dc2626` / `#0369a1` |
| Lote 129 (secundario) | `#38bdf8` | `#0369a1` |
| Lote 40 (traslado) | `#94a3b8` | `#64748b` |
| Lote 121 (inspección/QC) | `#fbbf24` | `#b45309` |
| Lote 122 (exportación) | `#a78bfa` | `#6d28d9` |

Cada lote expone `--lote-<n>`, `--lote-<n>-bg` y `--lote-<n>-border`; los estados
usan `--g360-success/warning/danger/info` (con `-bg` y `-border`). `skill.json`
está alineado a la paleta `cipsa-movil`.

## Modelo enriquecido del API

El frontend consume el `ItemStockEnriched` completo (no solo stock):

| Campo | Uso en la app |
|-------|---------------|
| `revision` | Badge único: `Descontinuado`, `Revisión venta`, `Por activar`, `Compromiso` |
| `descontinuado` / `vigente` | Excluidos de alertas de reposición |
| `categoria_venta` | Semáforo comercial (incluye `REVISION_VENTA`) |
| `sin_stock` / `por_activar` | SKU en catálogo sin stock / sin precio |
| `compromiso` / `cotizable` / `en_guia` | Flags comerciales por SKU |
| `origen` / `derivado_de` | Trazabilidad de la ficha |
| `um` | Unidad de medida (detalle del dashboard) |
| `metadata.enriquecido` | Si es `false`, la barra de estado avisa "Datos sin catálogo" |

> Los flags vienen del catálogo maestro v3.6.0; `revision` es el estado que el
> backend designa para badges del frontend.


## Scripts

```bash
npm run dev       # Desarrollo (Vite en puerto 3000)
npm run build     # Producción (dist/)
npm run preview   # Preview producción
npm test          # Tests de comportamiento (Vitest)
```

## Verificación

Un solo comando deja el repo listo y verifica que todo esté en verde
(offline tras el install; la app no necesita configuración para arrancar):

```bash
npm ci
npm test
npm run build
```

- **Entorno**: `.env.example` declara `VITE_STOCK_API_URL` y
  `VITE_STOCK_READ_KEY` con defaults seguros (la app funciona sin `.env`).
- **Tests**: `tests/` cubre la jerarquía de almacenes (VES/129/40/121/122),
  disponible VES, cajas/unidades, alertas, estados y ventana operativa.
- **Stack**: Node ≥ 22.12 (Vitest 5), Vite 8.

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

- **Frontend**: Lit 3.1, Vite 8, ExcelJS, Fuse.js
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
