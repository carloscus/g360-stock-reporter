/**
 * @file almacen-legend.js
 * @description Leyenda colapsable de colores de almacenes y badges.
 *              Compartida entre stock-search y estado-panel para que el
 *              vendedor identifique cada lote de un vistazo.
 * @author @carloscus
 * @version 1.0.0
 */

import { LitElement, html, css } from 'lit';

const ITEMS = [
  { cls: 'venta', code: 'VES', label: 'Venta directa' },
  { cls: 'secundario', code: '129', label: 'Secundario · atendible si VES = 0' },
  { cls: 'terciario', code: '40', label: 'Traslado · solo cantidad alta' },
  { cls: 'inspeccion', code: '121', label: 'Inspección/QC · lote por pasar a VES' },
  { cls: 'exportacion', code: '122', label: 'Exportación · solo informativo' },
  { cls: 'predespacho', code: 'Predespacho', label: 'Comprometido / para envío' },
];

export class AlmacenLegend extends LitElement {
  static properties = {
    open: { type: Boolean },
  };

  static styles = css`
    :host {
      display: block;
    }

    .legend-toggle {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 20px;
      background: var(--g360-bg);
      border: 1px solid var(--g360-border);
      color: var(--g360-muted);
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      user-select: none;
      font-family: inherit;
      white-space: nowrap;
    }

    .legend-toggle:hover {
      color: var(--g360-text);
      border-color: var(--g360-muted);
    }

    .legend-toggle.active {
      border-color: var(--g360-accent);
      color: var(--g360-accent);
      background: var(--lote-ves-bg);
    }

    .legend-panel {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
      gap: 6px;
      padding: 10px 4px 2px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      color: var(--g360-muted);
    }

    .sw {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .sw.venta {
      background: var(--lote-ves-bg);
      border: 1px solid var(--lote-ves-border);
      color: var(--lote-ves);
    }

    .sw.secundario {
      background: var(--lote-129-bg);
      border: 1px solid var(--lote-129-border);
      color: var(--lote-129);
    }

    .sw.terciario {
      background: var(--lote-40-bg);
      border: 1px solid var(--lote-40-border);
      color: var(--lote-40);
    }

    .sw.inspeccion {
      background: var(--lote-121-bg);
      border: 1px solid var(--lote-121-border);
      color: var(--lote-121);
    }

    .sw.exportacion {
      background: var(--lote-122-bg);
      border: 1px solid var(--lote-122-border);
      color: var(--lote-122);
    }

    .sw.predespacho {
      background: var(--lote-40-bg);
      border: 1px solid var(--lote-40-border);
      color: var(--lote-40);
    }
  `;

  constructor() {
    super();
    this.open = false;
  }

  _toggleKey(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.open = !this.open;
    }
  }

  render() {
    return html`
      <div
        class="legend-toggle ${this.open ? 'active' : ''}"
        @click=${() => this.open = !this.open}
        @keydown=${this._toggleKey}
        role="button"
        tabindex="0"
        aria-expanded=${this.open ? 'true' : 'false'}
        title="Mostrar leyenda de almacenes"
      >
        <span aria-hidden="true">ⓘ</span> Leyenda
      </div>
      ${this.open ? html`
        <div class="legend-panel">
          ${ITEMS.map((it) => html`
            <div class="legend-item">
              <span class="sw ${it.cls}">${it.code}</span>
              <span>${it.label}</span>
            </div>
          `)}
        </div>
      ` : ''}
    `;
  }
}

customElements.define('almacen-legend', AlmacenLegend);
