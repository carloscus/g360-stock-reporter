/**
 * @file stock-service.js
 * @description Servicio para cargar datos de stock desde el API backend.
 *              El API ya enriquece cada item con un_bx, peso_kg, ean13, ean14.
 *              Usa stock-store con 3 capas: memoria → sessionStorage → localStorage → API.
 *              Sin dependencias de JSON estáticos (enriquecimiento viene del API).
 * @author @carloscus
 * @version 7.0.0
 */

import { saveData, loadData, isStale, getMeta } from './stock-store.js';
import { INSPECCION_ALMACEN } from './stock-store.js';

const STOCK_API_URL = 'https://g360-stock-api.onrender.com/api/v1/stock?key=cipsa2026';
const API_TIMEOUT_MS = 25000;

let _loading = null;

function _normalizarLinea(lineaApi) {
  if (!lineaApi) return '';
  return lineaApi.replace(/^[\w-]+\s*-\s*/, '').trim();
}

function _generarNombreCorto(descripcion) {
  if (!descripcion) return '';
  let clean = descripcion.replace(/^(N|INFLABLE|PELOTA|BALÓN|JUEGO)\s+/i, '').trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function _extraerAlmacenesVenta(item) {
  return (item.almacenes || [])
    .filter((a) => a.tipo === 'venta')
    .map((a) => ({
      almacen: a.almacen,
      disponible: a.disponible || 0,
      stock: a.stock || 0,
      predespacho: a.predespacho || 0,
      esInspeccion: a.almacen === INSPECCION_ALMACEN,
    }));
}

function _calcularStockTotal(almacenesVenta) {
  if (!almacenesVenta || almacenesVenta.length === 0) return 0;
  return almacenesVenta.reduce((sum, a) => sum + a.disponible, 0);
}

/**
 * Carga datos desde la API.
 * Retorna null si ya hay datos en cache (manejado por loadStockData).
 */
export async function fetchFromAPI() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const response = await fetch(STOCK_API_URL, { cache: 'no-store', signal: controller.signal });
    if (!response.ok) throw new Error(`API HTTP ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Transforma la respuesta del API al formato interno esperado por los componentes.
 * El API ya enriquece cada item con un_bx, peso_kg, ean13, ean14, etc.
 */
function _transformAPIResponse(apiData) {
  const productos = [];
  const stockMap = {};

  for (const item of apiData.items) {
    const almacenesVenta = _extraerAlmacenesVenta(item);
    const stock = _calcularStockTotal(almacenesVenta);
    // un_bx ya viene del API enriquecido
    const unBx = item.un_bx || 1;

    const producto = {
      sku: item.sku,
      nombre: item.descripcion,
      nombre_corto: item.nombre_corto || _generarNombreCorto(item.descripcion),
      linea: _normalizarLinea(item.linea),
      linea_id: item.linea_id || '',
      categoria: item.categoria,
      grupo: item.grupo || '',
      familia: item.familia || '',
      tipo: item.tipo || '',
      un_bx: unBx,
      precio: item.precio || 0,
      precio_lista: item.precio_lista || 0,
      peso_kg: item.peso_kg || 0,
      ean13: item.ean13 || '',
      ean14: item.ean14 || '',
      estado_linea: item.estado_linea || '',
      orden: item.orden || 0,
      sin_catalogo: item.sin_catalogo || false,
      stock,
      bx: Math.floor(stock / unBx),
      predespacho: almacenesVenta.reduce((sum, a) => sum + a.predespacho, 0),
      almacenes_venta: almacenesVenta,
      almacenes_count: almacenesVenta.length,
      keywords: item.keywords || [],
      estado: stock === 0 ? 'AGOTADO' : stock < unBx * 10 ? 'BAJO' : 'OK',
    };

    productos.push(producto);
    stockMap[item.sku] = stock;
  }

  return {
    productos: productos.sort((a, b) => {
      // Items con orden=0 van al final (sin catalogo maestro)
      const aOrd = a.orden || 0;
      const bOrd = b.orden || 0;
      if (aOrd === 0 && bOrd === 0) return a.sku.localeCompare(b.sku);
      if (aOrd === 0) return 1;
      if (bOrd === 0) return -1;
      return aOrd - bOrd;
    }),
    stockMap,
    lastUpdated: apiData.metadata?.fecha_descarga || new Date().toISOString(),
    totalAlmacenes: apiData.metadata?.total_almacenes || almacenesCount(apiData.items),
    totalSkus: productos.length,
    fuente: 'api',
  };
}

function almacenesCount(items) {
  const set = new Set();
  for (const item of items) {
    for (const a of (item.almacenes || [])) {
      if (a.tipo === 'venta') set.add(a.almacen);
    }
  }
  return set.size;
}

/**
 * Carga datos con prioridad de cache + refresh en background si está stale (>15 min).
 *
 * @param {boolean} force - Si true, ignora cache y refresca desde API
 */
export async function loadStockData(force = false) {
  // 1. Cache (instantáneo). El refresh en background cuando los datos están
  //    stale (>15 min) lo orquesta app-root vía setInterval + visibilitychange.
  const mem = loadData();
  if (mem && !force) return mem;

  // 2. Evitar fetches concurrentes
  if (_loading && !force) return _loading;

  _loading = (async () => {
    try {
      const apiData = await fetchFromAPI();
      const newRevision = apiData.metadata?.fecha_descarga || apiData.metadata?.fecha_actualizacion || '';
      const prevRevision = getMeta()?.revision;

      // Si el backend no regeneró el reporte (misma revision) Y su cache es válida,
      // no notificar para evitar refrescos innecesarios de la UI (datos idénticos).
      const cacheExpirado = apiData.metadata?.cache_expirado === true;
      if (newRevision && prevRevision === newRevision && !cacheExpirado) {
        console.log('[stock-service] Datos sin cambios, refresco omitido');
        const cached = loadData();
        if (cached) return cached;
      }
      if (cacheExpirado && newRevision && prevRevision === newRevision) {
        console.log('[stock-service] Cache API expirado, forzando refresco a pesar de misma revision');
      }

      const data = _transformAPIResponse(apiData);
      saveData(data, { source: 'api', version: 'v1', revision: newRevision });
      return data;
    } catch (error) {
      console.warn('[stock-service] API no disponible:', error.message);

      // Si hay datos locales, usarlos y continuar en background
      const local = loadData();
      if (local) {
        console.log('[stock-service] Usando datos locales, refresh en background');
        refreshInBackground();
        return local;
      }

      console.error('[stock-service] Sin datos disponibles');
      const data = {
        productos: [],
        stockMap: {},
        lastUpdated: new Date().toISOString(),
        totalAlmacenes: 0,
        totalSkus: 0,
        fuente: 'error',
        error: error.message,
      };
      saveData(data, { source: 'error' });
      return data;
    } finally {
      _loading = null;
    }
  })();

  return _loading;
}

/**
 * Refresh en background: actualiza datos sin bloquear la UI.
 * Se llama cuando los datos cumplen 15 min (frescura del API).
 */
export function refreshInBackground() {
  if (_loading) return;
  console.log('[stock-service] Refresh en background (datos >15 min)');
  loadStockData(true).catch(err => console.warn('[stock-service] Background refresh falló:', err));
}

/**
 * Calcula las cajas (bx) según stock y unidades por caja.
 */
export function calculateBx(stock, unBx = 1) {
  const u = Number(unBx) || 1;
  return Math.floor((Number(stock) || 0) / u);
}

function _getBx(producto) {
  if (producto.bx !== undefined && producto.bx !== null) return producto.bx;
  return calculateBx(producto.stock ?? 0, producto.un_bx);
}

/**
 * Genera la lista de alertas (críticas y de advertencia) ordenadas.
 */
export function generateAlerts(productos, limit = null) {
  const alerts = [];
  for (const p of productos) {
    const bx = _getBx(p);
    if (bx === 0) {
      alerts.push({ sku: p.sku, nombre: p.nombre_corto || p.nombre, linea: p.linea,
        categoria: p.categoria, stock: p.stock ?? 0, bx, un_bx: p.un_bx || 1, type: 'critical' });
    } else if (bx < 10) {
      alerts.push({ sku: p.sku, nombre: p.nombre_corto || p.nombre, linea: p.linea,
        categoria: p.categoria, stock: p.stock ?? 0, bx, un_bx: p.un_bx || 1, type: 'warning' });
    }
  }
  alerts.sort((a, b) => a.type !== b.type ? (a.type === 'critical' ? -1 : 1) : a.bx - b.bx);
  return limit ? alerts.slice(0, limit) : alerts;
}

/**
 * Calcula estadísticas agregadas del inventario.
 */
export function calculateStats(productos) {
  let conStock = 0, bajoStock = 0, sinStock = 0;
  for (const p of productos) {
    const bx = _getBx(p);
    if (bx === 0) sinStock++;
    else if (bx < 10) bajoStock++;
    else conStock++
  }
  return { total: productos.length, conStock, bajoStock, sinStock };
}

/**
 * Calcula KPIs optimizados usando los datos enriquecidos del API
 * (precio, peso_kg, estado_linea, un_bx).
 * Retorna valor de inventario, peso total, cajas, desglose por
 * estado de línea y disponibilidad porcentual.
 */
export function calculateKPIs(productos) {
  let valorInventario = 0;
  let pesoTotal = 0;
  let cajasTotal = 0;
  let unidades = 0;
  const porEstadoLinea = {};
  const porCategoria = {};
  const conPrecio = [];
  const sinPrecio = [];

  for (const p of productos) {
    const stock = p.stock ?? 0;
    unidades += stock;

    valorInventario += stock * (p.precio || 0);
    pesoTotal += stock * (p.peso_kg || 0);
    cajasTotal += _getBx(p) || 0;

    const estado = (p.estado_linea || 'SIN DEFINIR').trim();
    porEstadoLinea[estado] = (porEstadoLinea[estado] || 0) + 1;

    const cat = p.categoria || 'SIN CATEGORIA';
    if (!porCategoria[cat]) {
      porCategoria[cat] = { skus: 0, valor: 0, peso: 0, cajas: 0, unidades: 0 };
    }
    porCategoria[cat].skus += 1;
    porCategoria[cat].unidades += stock;
    porCategoria[cat].valor += stock * (p.precio || 0);
    porCategoria[cat].peso += stock * (p.peso_kg || 0);
    porCategoria[cat].cajas += _getBx(p) || 0;

    if (p.precio && p.precio > 0) conPrecio.push(p);
    else sinPrecio.push(p);
  }

  // Unidades que no deberían existir (stock sin precio de lista)
  const unidadesSinPrecio = sinPrecio.reduce((s, p) => s + (p.stock ?? 0), 0);

  const estados = Object.entries(porEstadoLinea)
    .sort((a, b) => b[1] - a[1])
    .map(([nombre, skus]) => ({ nombre, skus }));

  return {
    valorInventario,
    pesoTotalKg: pesoTotal,
    cajasTotal,
    unidades,
    porEstadoLinea: estados,
    estadoLineaTotal: Object.keys(porEstadoLinea).length,
    categoriasTotales: Object.keys(porCategoria).length,
    porCategoria: Object.entries(porCategoria)
      .sort((a, b) => b[1].skus - a[1].skus)
      .map(([nombre, v]) => ({ nombre, ...v })),
    conPrecio: conPrecio.length,
    sinPrecio: sinPrecio.length,
    unidadesSinPrecio,
  };
}
