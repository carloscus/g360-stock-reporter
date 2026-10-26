/**
 * @file share.js
 * @description Mensaje breve para compartir SKUs consultados (WhatsApp/texto).
 *              Formato: SKU, línea, descripción y stock (VES; si es 0, el
 *              primer respaldo con stock entre 129/121/92).
 * @author @carloscus
 * @version 2.0.0
 */

import { esPorUnidades, stockEnAlmacen } from './stock-service.js';
import {
  ALMACEN_SECUNDARIO,
  INSPECCION_ALMACEN,
  INSPECCION_ALMACEN_ALT,
} from './stock-store.js';

const RESPALDOS = [ALMACEN_SECUNDARIO, INSPECCION_ALMACEN, INSPECCION_ALMACEN_ALT];

function etiquetaDisponible(producto) {
  const ves = Number(producto?.stock || 0);

  if (ves > 0) {
    const unidades = `${ves.toLocaleString('es-PE')} u`;
    if (esPorUnidades(producto)) return `VES: ${unidades}`;
    const bx = Math.floor(ves / (Number(producto.un_bx) || 1));
    return `VES: ${unidades}${bx > 0 ? ` (${bx} bx)` : ''}`;
  }

  const respaldo = RESPALDOS
    .map((codigo) => ({ codigo, cantidad: stockEnAlmacen(producto, codigo) }))
    .find((r) => r.cantidad > 0);

  return respaldo ? `VES: 0 · ${respaldo.codigo}: ${respaldo.cantidad} u` : 'VES: 0';
}

function recortar(texto, max = 70) {
  const limpio = String(texto || '').trim();
  return limpio.length > max ? `${limpio.slice(0, max - 1)}…` : limpio;
}

/**
 * Construye el mensaje plano de una lista de SKUs.
 *
 * @param {Array}  productos - productos enriquecidos (stock-service)
 * @param {string} autor     - nombre del solicitante (opcional)
 * @returns {string}
 */
export function construirMensajeStock(productos, autor = '') {
  const items = (productos || []).map((p) => {
    const descripcion = recortar(p?.nombre || p?.nombre_corto || '');
    const linea = p?.linea || '—';
    return `• ${p?.sku || ''} — ${descripcion}\n  ${linea} · ${etiquetaDisponible(p)}`;
  });

  const partes = ['StockPulse · Consulta de stock', ...items];
  if (autor) partes.push(`Solicitado por: ${autor}`);
  return partes.join('\n');
}
