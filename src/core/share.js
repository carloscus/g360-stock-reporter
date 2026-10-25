/**
 * @file share.js
 * @description Mensaje compacto para compartir SKUs consultados (WhatsApp/texto).
 *              En PWA móvil compartir texto es más confiable que compartir/descargar
 *              archivos (iOS standalone no siempre permite guardar blobs).
 * @author @carloscus
 * @version 1.0.0
 */

/**
 * Construye el mensaje plano de una lista de SKUs.
 * Formato compacto: SKU, nombre corto y Disponible VES.
 *
 * @param {Array}  productos - productos enriquecidos (stock-service)
 * @param {string} autor     - nombre del solicitante (opcional)
 * @returns {string}
 */
export function construirMensajeStock(productos, autor = '') {
  const items = (productos || []).map((p) => {
    const disponible = Number(p?.stock || 0).toLocaleString('es-PE');
    const nombre = p?.nombre_corto || p?.nombre || '';
    return `• ${p?.sku || ''} — ${nombre}\n  Disponible VES: ${disponible}`;
  });

  const partes = ['StockPulse · Consulta de stock', ...items];
  if (autor) partes.push(`Solicitado por: ${autor}`);
  return partes.join('\n');
}
