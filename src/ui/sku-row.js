/**
 * @file sku-row.js
 * @description Fila y detalle de SKU compartidos por Estado y Alertas.
 *              No es un custom element: exporta estilos y una función de
 *              render para mantener el DOM en el shadow root del host
 *              (más simple de testear y sin anidar shadow roots).
 * @author @carloscus
 * @version 1.0.0
 */

import { html, css } from 'lit';
import { etiquetaStock, esPorUnidades, revisionBadge } from '../core/stock-service.js';
import { renderAlmacenChips } from './almacen-chips.js';

export const skuRowStyles = css`
  .sku-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    border-bottom: 1px solid var(--g360-border);
    cursor: pointer;
    transition: background 0.15s;
    border-radius: 6px;
  }

  .sku-item:hover {
    background: var(--g360-surface);
  }

  .sku-item:last-child {
    border-bottom: none;
  }

  .sku-left {
    flex: 1;
    min-width: 0;
  }

  .sku-code {
    font-size: 11px;
    font-weight: 700;
    color: var(--g360-accent);
    font-family: monospace;
  }

  .sku-name {
    font-size: 12px;
    color: var(--g360-muted);
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .sku-flag {
    display: inline-block;
    margin-top: 2px;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
    white-space: nowrap;
  }

  .sku-flag.descontinuado {
    background: var(--g360-danger-bg);
    border: 1px solid var(--g360-danger-border);
    color: var(--g360-danger);
  }

  .sku-flag.ultimas {
    background: var(--g360-warning-bg);
    border: 1px solid var(--g360-warning-border);
    color: var(--g360-warning);
  }

  .sku-flag.info {
    background: var(--lote-40-bg);
    border: 1px solid var(--lote-40-border);
    color: var(--lote-40);
  }

  .sku-right {
    text-align: right;
    flex-shrink: 0;
    margin-left: 12px;
  }

  .sku-bx {
    font-size: 14px;
    font-weight: 700;
    color: var(--g360-text);
  }

  .sku-bx.cero {
    color: var(--g360-danger);
  }

  .sku-bx.bajo {
    color: var(--g360-warning);
  }

  .sku-units {
    font-size: 10px;
    color: var(--g360-muted);
  }

  .sku-detail {
    padding: 12px 16px;
    background: var(--lote-ves-bg);
    border-left: 2px solid var(--g360-accent);
    margin: 0 0 4px 16px;
    border-radius: 0 6px 6px 0;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    font-size: 11px;
  }

  .detail-label {
    color: var(--g360-muted);
  }

  .detail-value {
    color: var(--g360-text);
    font-weight: 600;
  }
`;

/**
 * Fila de SKU + detalle expandido.
 * @param {Object} s producto enriquecido
 * @param {{open?: boolean, onToggle?: (sku: string) => void}} opts
 */
export function renderSkuRow(s, { open = false, onToggle = null } = {}) {
  const rev = revisionBadge(s);

  return html`
    <div class="sku-item" @click=${() => onToggle?.(s.sku)}>
      <div class="sku-left">
        <div class="sku-code">${s.sku}</div>
        <div class="sku-name">${s.nombre}</div>
        ${rev ? html`<span class="sku-flag ${rev.rev === 'descontinuado' ? (s.stock > 0 ? 'ultimas' : 'descontinuado') : 'info'}">${rev.rev === 'descontinuado' && s.stock > 0 ? 'Últimas unidades' : rev.label}</span>` : ''}
      </div>
      <div class="sku-right">
        <div class="sku-bx ${s.bx === 0 ? 'cero' : s.bx < 10 ? 'bajo' : ''}">${etiquetaStock(s)}</div>
        <div class="sku-units">Disponible venta: ${s.stock} u</div>
      </div>
    </div>
    ${open ? html`
      <div class="sku-detail">
        <div class="detail-row">
          <span class="detail-label">SKU</span>
          <span class="detail-value">${s.sku}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Categoría</span>
          <span class="detail-value">${s.categoria}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Línea</span>
          <span class="detail-value">${s.linea || '—'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Cajas</span>
          <span class="detail-value">${esPorUnidades(s) ? '— (unidades)' : s.bx}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Disponible venta</span>
          <span class="detail-value">${s.stock}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Predespacho</span>
          <span class="detail-value">${s.predespacho ?? 0}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Peso</span>
          <span class="detail-value">${s.peso_kg} kg</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Unidad de medida</span>
          <span class="detail-value">${s.um || '—'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Revisión</span>
          <span class="detail-value">${s.revision || '—'}</span>
        </div>
        <div class="almacen-chips">
          ${renderAlmacenChips(s.almacenes_venta || [])}
        </div>
      </div>
    ` : ''}
  `;
}
