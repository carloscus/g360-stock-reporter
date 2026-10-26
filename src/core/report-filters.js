/**
 * @file report-filters.js
 * @description Reglas de segmentación del reporte de inventario.
 *              Reporte rápido (default): catálogo maestro, vigente (sin
 *              descontinuados), categorías principales y alcance opcional
 *              por línea. Lo demás se incluye a pedido.
 * @author @carloscus
 * @version 1.0.0
 */

import { esCatalogo, esVigente } from './stock-service.js';

export { esVigente };

/** Categorías de negocio incluidas cuando el alcance es "TODOS". */
export const CATEGORIAS_TODOS = ['REPRESENTADAS', 'VINIFAN', 'VINIBALL'];

/**
 * Filtra el universo de productos para un reporte.
 *
 * @param {Array}  productos
 * @param {Object} opciones
 * @param {string} opciones.categoria        - 'TODOS' | 'VINIBALL' | 'VINIFAN' | 'REPRESENTADAS'
 * @param {string} opciones.linea            - línea exacta ('' = todas)
 * @param {boolean} opciones.incluirNoVigentes - incluir descontinuados/inactivos
 * @param {boolean} opciones.soloCatalogo    - exigir catálogo maestro (default true)
 * @returns {Array}
 */
export function filtrarReporte(productos, {
  categoria = 'TODOS',
  linea = '',
  incluirNoVigentes = false,
  soloCatalogo = true,
} = {}) {
  return (productos || []).filter((p) => {
    if (soloCatalogo && !esCatalogo(p)) return false;
    if (!incluirNoVigentes && !esVigente(p)) return false;
    if (linea && p.linea !== linea) return false;
    if (categoria === 'TODOS') return CATEGORIAS_TODOS.includes(p.categoria);
    return p.categoria === categoria;
  });
}
