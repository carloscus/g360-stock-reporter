/**
 * @file almacen-chips.js
 * @description Render y estilos compartidos de los chips por almacén.
 *              Código visible + nombre oficial en title/aria, color por rol.
 * @author @carloscus
 * @version 1.0.0
 */

import { html, css } from 'lit';
import {
  ALMACEN_PRINCIPAL,
  ALMACEN_SECUNDARIO,
  INSPECCION_ALMACEN_ALT,
  ALMACEN_TRASLADO,
  ALMACEN_EXPORTACION,
} from '../core/stock-store.js';

export const almacenChipsStyles = css`
  .almacen-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 4px;
    background: var(--lote-ves-bg);
    border: 1px solid var(--lote-ves-border);
    color: var(--lote-ves);
    font-size: 10px;
    font-weight: 600;
    white-space: nowrap;
  }

  .almacen-chip.secundario {
    background: var(--lote-129-bg);
    border-color: var(--lote-129-border);
    color: var(--lote-129);
  }

  .almacen-chip.terciario {
    background: var(--lote-40-bg);
    border-color: var(--lote-40-border);
    color: var(--lote-40);
  }

  .almacen-chip.inspeccion {
    background: var(--lote-121-bg);
    border-color: var(--lote-121-border);
    color: var(--lote-121);
  }

  .almacen-chip.inspeccion-sec {
    background: var(--lote-121-bg);
    border: 1px dashed var(--lote-121-border);
    color: var(--lote-121);
  }

  .almacen-chip.exportacion {
    background: var(--lote-122-bg);
    border-color: var(--lote-122-border);
    color: var(--lote-122);
  }

  .almacen-chip.predespacho {
    background: var(--lote-40-bg);
    border-color: var(--lote-40-border);
    color: var(--lote-40);
  }

  .almacen-chip.fallback {
    background: var(--lote-ves-bg);
    border-color: var(--lote-ves-border);
    color: var(--lote-ves);
    font-weight: 700;
  }

  .almacen-chip.qc {
    background: var(--lote-121-bg);
    border-color: var(--lote-121-border);
    color: var(--lote-121);
    font-weight: 700;
  }

  .almacen-chip.traslado {
    background: var(--lote-129-bg);
    border: 1px dashed var(--lote-129-border);
    color: var(--lote-129);
  }

  .almacen-chip.sin-venta {
    background: var(--lote-40-bg);
    border-color: var(--g360-border);
    color: var(--g360-muted);
  }

  .almacen-chips {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    margin-top: 8px;
  }
`;

const rankAlmacen = (a) => {
  if (a.almacen === ALMACEN_PRINCIPAL) return 0;
  if (a.almacen === ALMACEN_SECUNDARIO) return 1;
  if (a.almacen === ALMACEN_TRASLADO) return 2;
  if (a.esInspeccion) return 99;
  if (a.almacen === INSPECCION_ALMACEN_ALT) return 100;
  return 10;
};

const claseAlmacen = (a) => {
  if (a.esInspeccion) return 'inspeccion';
  if (a.almacen === INSPECCION_ALMACEN_ALT) return 'inspeccion-sec';
  if (a.almacen === ALMACEN_SECUNDARIO) return 'secundario';
  if (a.almacen === ALMACEN_TRASLADO) return 'terciario';
  if (a.almacen === ALMACEN_EXPORTACION) return 'exportacion';
  return '';
};

/** Chips de almacén (sin contenedor) ordenados por jerarquía. */
export function renderAlmacenChips(almacenes = []) {
  return [...almacenes]
    .sort((x, y) => rankAlmacen(x) - rankAlmacen(y))
    .map((a) => html`
      <span
        class="almacen-chip ${claseAlmacen(a)}"
        title="${a.almacen}${a.nombre ? ` · ${a.nombre}` : ''}"
        aria-label="Almacén ${a.almacen}${a.nombre ? `, ${a.nombre}` : ''}: ${a.disponible} disponibles"
      >${a.almacen}: ${a.disponible}</span>
    `);
}
