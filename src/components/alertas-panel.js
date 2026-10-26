/**
 * @file alertas-panel.js
 * @description Worklist de reposición: SKUs de catálogo vigente con 0 o bajo
 *              stock (menos de UMBRAL_BAJO_STOCK cajas en VES). Módulo separado
 *              de Estado; comparte fila/detalle y chips con el árbol.
 * @author @carloscus
 * @version 1.0.0
 */

import { LitElement, html, css } from 'lit';
import { productosBase, UMBRAL_BAJO_STOCK } from '../core/stock-service.js';
import { descargarAlertas } from '../core/report-downloads.js';
import { renderSkuRow, skuRowStyles } from '../ui/sku-row.js';
import { almacenChipsStyles } from '../ui/almacen-chips.js';
import './almacen-legend.js';

const LIMITE = 100;

export class AlertasPanel extends LitElement {
  static properties = {
    stockData: { type: Object },
    filter: { type: String },
    query: { type: String },
    exportOpen: { type: Boolean },
  };

  static styles = [
    skuRowStyles,
    almacenChipsStyles,
    css`
      :host {
        display: block;
        padding: 24px;
        margin: 0 auto;
        max-width: 900px;
      }

      @media (min-width: 1024px) {
        :host { padding: 24px 32px; }
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 20px;
      }

      .header h1 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: var(--g360-text);
      }

      .badge-count {
        background: var(--g360-danger);
        color: #fff;
        border-radius: 999px;
        padding: 2px 10px;
        font-size: 12px;
        font-weight: 800;
        margin-left: 6px;
      }

      .export-wrap { position: relative; }

      .export-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        border-radius: 8px;
        border: 1px solid var(--g360-border);
        background: var(--g360-surface);
        color: var(--g360-text);
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
      }

      .export-btn:hover {
        border-color: var(--g360-accent);
        color: var(--g360-accent);
      }

      .export-menu {
        position: absolute;
        right: 0;
        top: calc(100% + 6px);
        min-width: 220px;
        background: var(--g360-surface);
        border: 1px solid var(--g360-border);
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
        padding: 6px;
        z-index: 30;
      }

      .export-menu-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 10px 8px;
        border-bottom: 1px solid var(--g360-border);
        margin-bottom: 6px;
      }

      .export-menu-title {
        font-size: 11px;
        font-weight: 700;
        color: var(--g360-muted);
      }

      .export-close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        border: none;
        border-radius: 50%;
        background: var(--g360-danger-bg);
        color: var(--g360-danger);
        cursor: pointer;
      }

      .export-option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        width: 100%;
        padding: 9px 12px;
        border: none;
        background: transparent;
        color: var(--g360-text);
        font-size: 12px;
        font-weight: 600;
        font-family: inherit;
        text-align: left;
        cursor: pointer;
        border-radius: 8px;
      }

      .export-option:hover { background: var(--g360-bg); }
      .export-option .count { color: var(--g360-muted); font-weight: 700; }

      .search-box {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
      }

      .search-input {
        flex: 1;
        padding: 10px 12px;
        border-radius: 8px;
        border: 1px solid var(--g360-border);
        background: var(--g360-bg);
        color: var(--g360-text);
        font-size: 13px;
        font-family: inherit;
        outline: none;
      }

      .search-input:focus { border-color: var(--g360-accent); }

      .filter-select {
        padding: 10px 12px;
        border-radius: 8px;
        border: 1px solid var(--g360-border);
        background: var(--g360-bg);
        color: var(--g360-text);
        font-size: 12px;
        font-family: inherit;
      }

      .legend-row { margin: 4px 0 12px; }

      .list { border: 1px solid var(--g360-border); border-radius: 12px; overflow: hidden; }

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
    `,
  ];

  constructor() {
    super();
    this.stockData = null;
    this.filter = 'all';
    this.query = '';
    this.exportOpen = false;
    this._expandedSkus = new Set();
    this._limite = LIMITE;
    this._base = [];
    this._todas = [];
    this._onDocClick = this._handleDocumentClick.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this._onDocClick);
    document.addEventListener('keydown', this._onDocClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._onDocClick);
    document.removeEventListener('keydown', this._onDocClick);
  }

  _handleDocumentClick(e) {
    if (!this.exportOpen) return;
    if (e.type === 'keydown') {
      if (e.key === 'Escape') this.exportOpen = false;
      return;
    }
    const path = e.composedPath ? e.composedPath() : [];
    if (!path.includes(this)) this.exportOpen = false;
  }

  willUpdate(changed) {
    if (changed.has('stockData') && this.stockData) {
      this._base = productosBase(this.stockData.productos);
      this._todas = this._base.filter((p) => (p.bx ?? 0) < UMBRAL_BAJO_STOCK);
    }
  }

  _toggleSku(sku) {
    const next = new Set(this._expandedSkus);
    if (next.has(sku)) next.delete(sku);
    else next.add(sku);
    this._expandedSkus = next;
    this.requestUpdate();
  }

  _setQuery(e) {
    this.query = e.target.value;
    this._limite = LIMITE;
  }

  _setFilter(e) {
    this.filter = e.target.value;
    this._limite = LIMITE;
  }

  _mostrarMas() {
    this._limite += LIMITE;
    this.requestUpdate();
  }

  _filtradas() {
    let list = this._todas;
    if (this.filter === 'sinStock') list = list.filter((p) => (p.bx ?? 0) === 0);
    if (this.filter === 'bajoStock') list = list.filter((p) => (p.bx ?? 0) > 0);
    const q = (this.query || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    if (q) {
      list = list.filter((p) =>
        (p.sku || '').toLowerCase().includes(q) ||
        (p.nombre || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q)
      );
    }
    return [...list].sort((a, b) => (a.bx ?? 0) - (b.bx ?? 0) || a.sku.localeCompare(b.sku));
  }

  async _exportar(tipo) {
    try {
      await descargarAlertas(tipo, this._base);
    } catch (error) {
      console.error('[alertas-panel] Error exportando:', error);
    } finally {
      this.exportOpen = false;
    }
  }

  render() {
    const sinStock = this._todas.filter((p) => (p.bx ?? 0) === 0).length;
    const bajoStock = this._todas.length - sinStock;
    const lista = this._filtradas();
    const visibles = lista.slice(0, this._limite);

    return html`
      <div class="header">
        <h1>🚨 Alertas <span class="badge-count">${this._todas.length}</span></h1>
        <div class="export-wrap">
          <button class="export-btn" @click=${() => this.exportOpen = !this.exportOpen}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exportar
          </button>
          ${this.exportOpen ? html`
            <div class="export-menu">
              <div class="export-menu-header">
                <span class="export-menu-title">Descargar alertas</span>
                <button class="export-close" @click=${() => this.exportOpen = false} aria-label="Cerrar">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <button class="export-option" @click=${() => this._exportar('alertas')}>
                <span>Todos</span><span class="count">${this._todas.length}</span>
              </button>
              <button class="export-option" @click=${() => this._exportar('bajoStock')}>
                <span>Bajo Stock</span><span class="count">${bajoStock}</span>
              </button>
              <button class="export-option" @click=${() => this._exportar('sinStock')}>
                <span>Sin Stock</span><span class="count">${sinStock}</span>
              </button>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="search-box">
        <input
          type="search"
          class="search-input"
          placeholder="Buscar SKU o nombre..."
          .value=${this.query}
          @input=${this._setQuery}
          spellcheck="false"
          autocapitalize="off"
          enterkeyhint="search"
          aria-label="Buscar alerta"
        />
        <select class="filter-select" @change=${this._setFilter}>
          <option value="all" ?selected=${this.filter === 'all'}>Todos (${this._todas.length})</option>
          <option value="bajoStock" ?selected=${this.filter === 'bajoStock'}>Bajo Stock (${bajoStock})</option>
          <option value="sinStock" ?selected=${this.filter === 'sinStock'}>Sin Stock (${sinStock})</option>
        </select>
      </div>

      <div class="legend-row">
        <almacen-legend></almacen-legend>
      </div>

      <div class="list">
        ${visibles.length === 0 ? html`<div class="empty">No hay alertas con el filtro seleccionado</div>` : ''}
        ${visibles.map((p) => renderSkuRow(p, {
          open: this._expandedSkus.has(p.sku),
          onToggle: (sku) => this._toggleSku(sku),
        }))}
        ${lista.length > visibles.length ? html`
          <button class="load-more" @click=${this._mostrarMas}>
            Mostrar más (${Math.min(LIMITE, lista.length - visibles.length)} de ${lista.length - visibles.length} restantes)
          </button>
        ` : ''}
      </div>
    `;
  }
}

customElements.define('alertas-panel', AlertasPanel);
