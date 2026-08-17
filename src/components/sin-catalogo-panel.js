/**
 * @file sin-catalogo-panel.js
 * @description Lista de productos fuera de catálogo (SKUs sin estado de línea,
 *              sin coincidencia en catálogo maestro) que aún conservan stock.
 *              Útil para detectar ítems nuevos, sin movimiento o próximos a descontinuar.
 * @author @carloscus
 * @version 1.1.0
 */

import { LitElement, html, css } from 'lit';
import { etiquetaStock, esSinCatalogo, esPorUnidades } from '../core/stock-service.js';

export class SinCatalogoPanel extends LitElement {
  static properties = {
    stockData: { type: Object },
    filter: { type: String },
    query: { type: String },
  };

  static styles = css`
    :host {
      display: block;
      padding: 24px;
      margin: 0 auto;
      max-width: 900px;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .title {
      font-size: var(--g360-size-xl);
      font-weight: var(--g360-weight-bold);
      color: var(--g360-text);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .badge {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.3);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: var(--g360-size-base);
      font-weight: var(--g360-weight-semibold);
    }

    .subtitle {
      font-size: 13px;
      color: var(--g360-muted);
      margin-top: 4px;
    }

    .controls {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: var(--g360-surface);
      border: 1px solid var(--g360-border);
      border-radius: 10px;
    }

    .search-box input {
      flex: 1;
      background: transparent;
      border: none;
      color: var(--g360-text);
      font-size: 14px;
      font-family: inherit;
      outline: none;
    }

    .search-box svg {
      color: var(--g360-muted);
      flex-shrink: 0;
    }

    .filters {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 4px;
    }

    .filter-btn {
      padding: 8px 16px;
      border-radius: 8px;
      border: 1px solid var(--g360-border);
      background: var(--g360-surface);
      color: var(--g360-muted);
      cursor: pointer;
      font-size: 13px;
      white-space: nowrap;
      transition: all 0.2s;
    }

    .filter-btn:hover {
      border-color: var(--g360-accent);
    }

    .filter-btn.active {
      background: var(--g360-accent);
      color: var(--g360-bg);
      border-color: var(--g360-accent);
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }

    .summary-card {
      background: var(--g360-surface);
      border: 1px solid var(--g360-border);
      border-radius: 12px;
      padding: 14px 16px;
    }

    .summary-value {
      font-size: 20px;
      font-weight: 800;
      color: var(--g360-accent);
      margin-bottom: 4px;
    }

    .summary-label {
      font-size: 11px;
      color: var(--g360-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    .list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 16px;
      background: var(--g360-surface);
      border-radius: 12px;
      border: 1px solid var(--g360-border);
      transition: all 0.2s;
    }

    .item:hover {
      border-color: var(--g360-accent);
    }

    .item.sinstock {
      opacity: 0.55;
    }

    .item-left {
      flex: 1;
      min-width: 0;
    }

    .item-sku {
      font-size: 12px;
      font-weight: 700;
      color: #f59e0b;
      margin-bottom: 4px;
      letter-spacing: 0.3px;
    }

    .item-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--g360-text);
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    .item-tags {
      display: flex;
      gap: 6px;
      margin-top: 6px;
      flex-wrap: wrap;
    }

    .tag {
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 999px;
      font-weight: 600;
      background: var(--g360-bg);
      border: 1px solid var(--g360-border);
      color: var(--g360-muted);
    }

    .tag.precio {
      background: rgba(0, 208, 132, 0.1);
      border-color: rgba(0, 208, 132, 0.25);
      color: var(--g360-accent);
    }

    .item-right {
      text-align: right;
      flex-shrink: 0;
    }

    .stock-value {
      font-size: 18px;
      font-weight: 700;
      color: var(--g360-text);
      display: block;
    }

    .stock-value.sinstock {
      color: var(--g360-muted);
    }

    .stock-label {
      font-size: 11px;
      color: var(--g360-muted);
    }

    .empty {
      text-align: center;
      padding: 60px 20px;
      color: var(--g360-muted);
    }

    .empty svg {
      width: 56px;
      height: 56px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    @media (max-width: 600px) {
      :host {
        padding: 16px;
      }
      .item {
        padding: 12px;
        gap: 10px;
      }
      .item-right {
        min-width: 60px;
      }
      .item-name {
        white-space: normal;
        overflow-wrap: anywhere;
        word-break: break-word;
      }
    }
  `;

  constructor() {
    super();
    this.filter = 'con-stock';
    this.query = '';
    this.secundarios = [];
    this.totalSecundarios = 0;
  }

  willUpdate(changedProperties) {
    if (changedProperties.has('stockData') && this.stockData) {
      const productos = this.stockData.productos || [];
      this.secundarios = productos
        .filter(esSinCatalogo)
        .map((p) => ({
          sku: p.sku,
          nombre: p.nombre,
          stock: p.stock || 0,
          precio: p.precio || 0,
          un_bx: p.un_bx || 1,
          bx: p.bx || 0,
        }))
        .sort((a, b) => b.stock - a.stock);
      this.totalSecundarios = this.secundarios.length;
    }
  }

  get filtered() {
    let list = this.secundarios;
    if (this.filter === 'con-stock') list = list.filter((s) => s.stock > 0);
    if (this.filter === 'sin-stock') list = list.filter((s) => s.stock === 0);
    if (this.filter === 'con-precio') list = list.filter((s) => s.precio > 0);
    if (this.query.trim()) {
      const q = this.query.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.sku.toLowerCase().includes(q) ||
          (s.nombre || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  get conStock() {
    return this.secundarios.filter((s) => s.stock > 0).length;
  }

  get sinStock() {
    return this.secundarios.filter((s) => s.stock === 0).length;
  }

  get conPrecio() {
    return this.secundarios.filter((s) => s.precio > 0).length;
  }

  get unidadesTotales() {
    return this.secundarios.reduce((sum, s) => sum + s.stock, 0);
  }

  render() {
    const filtered = this.filtered;

    return html`
      <div class="header">
        <div>
          <h1 class="title">📦 Sin Catálogo</h1>
          <p class="subtitle">
            SKUs sin estado de línea (sin coincidencia en catálogo maestro) — pueden
            ser nuevos, sin movimiento, o próximos a descontinuar / inactivar.
          </p>
        </div>
        <span class="badge">${this.totalSecundarios} SKUs</span>
      </div>

      <div class="summary-cards">
        <div class="summary-card">
          <div class="summary-value">${this.conStock}</div>
          <div class="summary-label">Con Stock</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${this.sinStock}</div>
          <div class="summary-label">Sin Stock</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${this.unidadesTotales.toLocaleString('es-PE')}</div>
          <div class="summary-label">Unidades Totales</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${this.conPrecio}</div>
          <div class="summary-label">Con Precio</div>
        </div>
      </div>

      <div class="controls">
        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar por SKU o descripción..."
            .value=${this.query}
            @input=${(e) => this.query = e.target.value}
          />
        </div>

        <div class="filters">
          <button
            class="filter-btn ${this.filter === 'con-stock' ? 'active' : ''}"
            @click=${() => this.filter = 'con-stock'}
          >Con Stock (${this.conStock})</button>
          <button
            class="filter-btn ${this.filter === 'sin-stock' ? 'active' : ''}"
            @click=${() => this.filter = 'sin-stock'}
          >Sin Stock (${this.sinStock})</button>
          <button
            class="filter-btn ${this.filter === 'con-precio' ? 'active' : ''}"
            @click=${() => this.filter = 'con-precio'}
          >Con Precio (${this.conPrecio})</button>
          <button
            class="filter-btn ${this.filter === 'todos' ? 'active' : ''}"
            @click=${() => this.filter = 'todos'}
          >Todos (${this.totalSecundarios})</button>
        </div>
      </div>

      ${filtered.length === 0 ? html`
        <div class="empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 12h8"/>
          </svg>
          <p>No hay ítems fuera de catálogo con el filtro seleccionado</p>
        </div>
      ` : html`
        <div class="list">
          ${filtered.map((s) => html`
            <div class="item ${s.stock === 0 ? 'sinstock' : ''}">
              <div class="item-left">
                <div class="item-sku">${s.sku}</div>
                <div class="item-name">${s.nombre}</div>
                <div class="item-tags">
                  ${s.precio > 0 ? html`<span class="tag precio">Precio S/ ${s.precio.toFixed(2)}</span>` : ''}
                  ${esPorUnidades(s) ? '' : html`<span class="tag">${s.un_bx} un/bx</span>`}
                  ${s.stock === 0 ? html`<span class="tag">Agotado</span>` : ''}
                </div>
              </div>
              <div class="item-right">
                <span class="stock-value ${s.stock === 0 ? 'sinstock' : ''}">${s.stock.toLocaleString('es-PE')}</span>
                <span class="stock-label">${etiquetaStock(s)}</span>
              </div>
            </div>
          `)}
        </div>
      `}
    `;
  }
}

customElements.define('sin-catalogo-panel', SinCatalogoPanel);
