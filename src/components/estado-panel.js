/**
 * @file estado-panel.js
 * @description Dashboard de Estado: KPIs, progreso, búsqueda y árbol de
 *              exploración (categoría → línea → SKU). Las alertas viven en
 *              su propio módulo (alertas-panel).
 * @author @carloscus
 * @version 5.0.0
 */

import { LitElement, html, css } from 'lit';
import {
  calculateKPIs,
  calculateStats,
  productosBase,
  esSinCatalogo,
  tieneStock122,
} from '../core/stock-service.js';
import { descargarEstado, descargar122 } from '../core/report-downloads.js';
import './estado-tree.js';
import './almacen-legend.js';

export class EstadoPanel extends LitElement {
  static properties = {
    stockData: { type: Object },
    filter: { type: String },
    query: { type: String },
    exportOpen: { type: Boolean },
  };

  static styles = css`
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
      margin-bottom: 20px;
    }

    .header h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: var(--g360-text);
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
    .export-option.separator { margin-top: 4px; border-top: 1px solid var(--g360-border); border-radius: 0 0 8px 8px; }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }

    .kpi-card {
      background: var(--g360-surface);
      border: 1px solid var(--g360-border);
      border-left: 3px solid var(--g360-border);
      border-radius: 12px;
      padding: 16px;
    }

    .kpi-card.highlight { border-left-color: var(--g360-accent); }
    .kpi-card.warning { border-left-color: var(--g360-warning); }
    .kpi-card.danger { border-left-color: var(--g360-danger); }

    .kpi-value { font-size: 28px; font-weight: 800; line-height: 1.2; color: var(--g360-text); }
    .kpi-card.highlight .kpi-value { color: var(--g360-accent); }
    .kpi-card.warning .kpi-value { color: var(--g360-warning); }
    .kpi-card.danger .kpi-value { color: var(--g360-danger); }
    .kpi-label { font-size: 11px; font-weight: 600; color: var(--g360-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
    .kpi-sub { font-size: 10px; color: var(--g360-muted); margin-top: 2px; }

    .progress-section {
      background: var(--g360-surface);
      border: 1px solid var(--g360-border);
      border-radius: 12px;
      padding: 14px 16px;
      margin-bottom: 20px;
    }

    .progress-header { display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; color: var(--g360-text); }
    .progress-pct { color: var(--g360-accent); }
    .progress-bar { height: 8px; border-radius: 999px; background: var(--g360-bg); margin: 10px 0 8px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--g360-accent), var(--g360-accent-bright)); }
    .progress-labels { display: flex; justify-content: space-between; font-size: 10px; color: var(--g360-muted); }

    .search-box { display: flex; gap: 8px; margin-bottom: 12px; }

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
  `;

  constructor() {
    super();
    this.stockData = null;
    this.filter = 'all';
    this.query = '';
    this.exportOpen = false;
    this.stats = { total: 0, conStock: 0, bajoStock: 0, sinStock: 0 };
    this.kpis = null;
    this._base = [];
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
      this.stats = calculateStats(this._base);
      this.kpis = calculateKPIs(this._base);
    }
  }

  _setQuery(e) {
    this.query = e.target.value;
  }

  _setFilter(e) {
    this.filter = e.target.value;
  }

  _onPrefill(e) {
    this.dispatchEvent(new CustomEvent('prefill-report', {
      detail: e.detail,
      bubbles: true,
      composed: true,
    }));
  }

  _getProgressPercent() {
    return this.stats.total ? Math.round((this.stats.conStock / this.stats.total) * 100) : 0;
  }

  async _exportXLSX(tipo) {
    try {
      const productos = tipo === 'sinCatalogo'
        ? (this.stockData?.productos || [])
        : this._base;
      await descargarEstado(tipo, productos);
    } catch (error) {
      console.error('[estado-panel] Error exportando:', error);
    } finally {
      this.exportOpen = false;
    }
  }

  async _export122() {
    try {
      await descargar122(this.stockData?.productos || []);
    } catch (error) {
      console.error('[estado-panel] Error exportando 122:', error);
    } finally {
      this.exportOpen = false;
    }
  }

  render() {
    if (!this.stockData || !this.kpis) {
      return html`<div style="text-align:center;padding:60px;color:var(--g360-muted)">Cargando estado...</div>`;
    }

    const sinCatalogoCount = (this.stockData.productos || []).filter(esSinCatalogo).length;
    const export122Count = (this.stockData.productos || []).filter(tieneStock122).length;
    const totalCajas = this.kpis.cajasTotal || 0;

    return html`
      <div class="header">
        <h1>Estado del Sistema</h1>
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
                <span class="export-menu-title">Descargar reporte</span>
                <button class="export-close" @click=${() => this.exportOpen = false} aria-label="Cerrar">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <button class="export-option" @click=${() => this._exportXLSX('conStock')}>
                <span>Con Stock</span><span class="count">${this.stats.conStock}</span>
              </button>
              <button class="export-option" @click=${() => this._exportXLSX('bajoStock')}>
                <span>Bajo Stock</span><span class="count">${this.stats.bajoStock}</span>
              </button>
              <button class="export-option" @click=${() => this._exportXLSX('sinStock')}>
                <span>Sin Stock</span><span class="count">${this.stats.sinStock}</span>
              </button>
              <button class="export-option separator" @click=${() => this._exportXLSX('sinCatalogo')}>
                <span>Sin Catálogo</span><span class="count">${sinCatalogoCount}</span>
              </button>
              <button class="export-option separator" @click=${() => this._export122()}>
                <span>122 (Exportación)</span><span class="count">${export122Count}</span>
              </button>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card highlight">
          <div class="kpi-value">${this.stats.total}</div>
          <div class="kpi-label">Total SKUs</div>
          <div class="kpi-sub">${totalCajas.toLocaleString()} cajas</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">${this.stats.conStock}</div>
          <div class="kpi-label">Con Stock</div>
          <div class="kpi-sub">${this._getProgressPercent()}% del total</div>
        </div>
        <div class="kpi-card warning">
          <div class="kpi-value">${this.stats.bajoStock}</div>
          <div class="kpi-label">Stock Bajo (&lt;10)</div>
          <div class="kpi-sub">Requiere atención</div>
        </div>
        <div class="kpi-card danger">
          <div class="kpi-value">${this.stats.sinStock}</div>
          <div class="kpi-label">Sin Stock</div>
          <div class="kpi-sub">Reabastecer</div>
        </div>
      </div>

      <div class="progress-section">
        <div class="progress-header">
          <span>Nivel de Disponibilidad</span>
          <span class="progress-pct">${this._getProgressPercent()}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${this._getProgressPercent()}%"></div>
        </div>
        <div class="progress-labels">
          <span>Sin stock: ${this.stats.sinStock}</span>
          <span>Disponible: ${this.stats.conStock}</span>
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
          aria-label="Buscar SKU en el estado"
        />
        <select class="filter-select" @change=${this._setFilter}>
          <option value="all" ?selected=${this.filter === 'all'}>Todos</option>
          <option value="conStock" ?selected=${this.filter === 'conStock'}>Con Stock</option>
          <option value="bajoStock" ?selected=${this.filter === 'bajoStock'}>Bajo Stock</option>
          <option value="sinStock" ?selected=${this.filter === 'sinStock'}>Sin Stock</option>
        </select>
      </div>

      <div class="legend-row">
        <almacen-legend></almacen-legend>
      </div>

      <estado-tree
        .productos=${this._base}
        .query=${this.query}
        .filtro=${this.filter}
        @prefill-report=${this._onPrefill}
      ></estado-tree>
    `;
  }
}

customElements.define('estado-panel', EstadoPanel);
