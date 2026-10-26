/**
 * @file estado-tree.js
 * @description Árbol de exploración categoría → línea → SKU. Solo lectura:
 *              no descarga; el enlace "Generar reporte" prellena Pulso.
 * @author @carloscus
 * @version 1.0.1
 */

import { LitElement, html, css } from 'lit';
import { renderSkuRow, skuRowStyles } from '../ui/sku-row.js';
import { almacenChipsStyles } from '../ui/almacen-chips.js';
import { UMBRAL_BAJO_STOCK } from '../core/stock-service.js';

const LIMITE = 50;

export class EstadoTree extends LitElement {
  static properties = {
    productos: { type: Array },
    query: { type: String },
    filtro: { type: String },
  };

  static styles = [
    skuRowStyles,
    almacenChipsStyles,
    css`
      :host { display: block; }

      .section {
        border: 1px solid var(--g360-border);
        border-radius: 12px;
        margin-bottom: 10px;
        overflow: hidden;
      }

      .section-header,
      .line-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 14px;
        cursor: pointer;
        background: var(--g360-surface);
      }

      .line-header {
        padding: 9px 14px 9px 30px;
        background: var(--g360-bg);
        border-top: 1px solid var(--g360-border);
      }

      .section-header-left {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
        min-width: 0;
      }

      .section-toggle {
        font-size: 10px;
        color: var(--g360-muted);
        transition: transform 0.2s;
      }

      .section-toggle.open { transform: rotate(90deg); }

      .section-name {
        font-size: 13px;
        font-weight: 700;
        color: var(--g360-text);
      }

      .line-name {
        font-size: 12px;
        font-weight: 600;
        color: var(--g360-text);
      }

      .section-count {
        font-size: 10px;
        color: var(--g360-muted);
        margin-left: auto;
        white-space: nowrap;
      }

      .prefill-btn {
        padding: 5px 10px;
        border-radius: 999px;
        border: 1px solid var(--g360-border);
        background: var(--g360-bg);
        color: var(--g360-accent);
        font-size: 10px;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .prefill-btn:hover {
        border-color: var(--g360-accent);
      }

      .prefill-btn.small {
        padding: 3px 8px;
        font-size: 9px;
      }

      .line-body { padding: 0; }

      .load-more {
        display: block;
        width: calc(100% - 32px);
        margin: 10px 16px;
        padding: 9px 12px;
        border-radius: 8px;
        border: 1px dashed var(--g360-border-strong, var(--g360-border));
        background: transparent;
        color: var(--g360-accent);
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
      }

      .empty {
        text-align: center;
        padding: 40px;
        color: var(--g360-muted);
        font-size: 13px;
      }

      @media (max-width: 480px) {
        .prefill-btn {
          width: 34px;
          height: 34px;
          padding: 0;
          font-size: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .prefill-btn::after {
          content: '↓';
          font-size: 15px;
        }
      }
    `,
  ];

  constructor() {
    super();
    this.productos = [];
    this.query = '';
    this.filtro = 'all';
    this._cats = new Set();
    this._lines = new Set();
    this._skus = new Set();
    this._limites = new Map();
  }

  _norm(texto) {
    return (texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  _pasaFiltro(p) {
    const bx = p.bx ?? 0;
    if (this.filtro === 'sinStock') return bx === 0;
    if (this.filtro === 'bajoStock') return bx > 0 && bx < UMBRAL_BAJO_STOCK;
    if (this.filtro === 'conStock') return bx >= UMBRAL_BAJO_STOCK;
    return true;
  }

  _grupos() {
    const q = this._norm(this.query).trim();
    const arbol = new Map();

    for (const p of (this.productos || [])) {
      if (!this._pasaFiltro(p)) continue;
      if (q) {
        const texto = `${this._norm(p.sku)} ${this._norm(p.nombre_corto || p.nombre)}`;
        if (!texto.includes(q)) continue;
      }
      const cat = p.categoria || 'SIN CATEGORIA';
      const linea = p.linea || 'SIN LÍNEA';
      if (!arbol.has(cat)) arbol.set(cat, new Map());
      const lineas = arbol.get(cat);
      if (!lineas.has(linea)) lineas.set(linea, []);
      lineas.get(linea).push(p);
    }

    return arbol;
  }

  _toggle(nombre, key) {
    const set = new Set(this[nombre]);
    if (set.has(key)) set.delete(key);
    else set.add(key);
    this[nombre] = set;
    this.requestUpdate();
  }

  _mostrarMas(key) {
    this._limites.set(key, (this._limites.get(key) || LIMITE) + LIMITE);
    this.requestUpdate();
  }

  _prefill(categoria, linea, event) {
    event.stopPropagation();
    this.dispatchEvent(new CustomEvent('prefill-report', {
      detail: { categoria, linea },
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    const arbol = this._grupos();
    const buscando = (this.query || '').trim().length > 0;

    return html`
      ${[...arbol.entries()].map(([categoria, lineas]) => {
        const total = [...lineas.values()].reduce((n, items) => n + items.length, 0);
        const abierta = buscando || this._cats.has(categoria);

        return html`
          <div class="section">
            <div class="section-header" @click=${() => this._toggle('_cats', categoria)}>
              <div class="section-header-left">
                <span class="section-toggle ${abierta ? 'open' : ''}">▶</span>
                <span class="section-name">${categoria}</span>
                <span class="section-count">${total} SKUs</span>
              </div>
              <button
                class="prefill-btn"
                title="Generar reporte de ${categoria}"
                aria-label="Generar reporte de ${categoria}"
                @click=${(e) => this._prefill(categoria, '', e)}
              >Generar reporte</button>
            </div>
            ${abierta ? html`
              ${[...lineas.entries()].map(([linea, items]) => {
                const key = `${categoria}|${linea}`;
                const lineaAbierta = buscando || this._lines.has(key);
                const limite = this._limites.get(key) || LIMITE;
                const visibles = items.slice(0, limite);

                return html`
                  <div class="line">
                    <div class="line-header" @click=${() => this._toggle('_lines', key)}>
                      <span class="section-toggle ${lineaAbierta ? 'open' : ''}">▶</span>
                      <span class="line-name">${linea}</span>
                      <span class="section-count">${items.length} SKUs</span>
                      <button
                        class="prefill-btn small"
                        title="Generar reporte de ${linea}"
                        aria-label="Generar reporte de ${linea}"
                        @click=${(e) => this._prefill(categoria, linea, e)}
                      >Generar</button>
                    </div>
                    ${lineaAbierta ? html`
                      <div class="line-body">
                        ${visibles.map((p) => renderSkuRow(p, {
                          open: this._skus.has(p.sku),
                          onToggle: (sku) => this._toggle('_skus', sku),
                        }))}
                        ${items.length > visibles.length ? html`
                          <button class="load-more" @click=${() => this._mostrarMas(key)}>
                            Mostrar más (${Math.min(LIMITE, items.length - visibles.length)} de ${items.length - visibles.length} restantes)
                          </button>
                        ` : ''}
                      </div>
                    ` : ''}
                  </div>
                `;
              })}
            ` : ''}
          </div>
        `;
      })}
      ${arbol.size === 0 ? html`<div class="empty">Sin resultados</div>` : ''}
    `;
  }
}

customElements.define('estado-tree', EstadoTree);
