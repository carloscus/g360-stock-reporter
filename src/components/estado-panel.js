/**
 * @file estado-panel.js
 * @description Panel de estado del sistema con KPIs corporativos,
 *              lista expandible por categoria con SKUs y cajas VES,
 *              y exportacion de datos.
 * @author @carloscus
 * @version 4.0.0
 */

import { LitElement, html, css } from 'lit';
import { calculateKPIs, calculateStats, etiquetaStock, esPorUnidades, esSinCatalogo } from '../core/stock-service.js';

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
      padding: 16px;
      max-width: 900px;
      margin: 0 auto;
    }

    @media (min-width: 1024px) {
      :host {
        padding: 24px 32px;
      }
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
      transition: all 0.2s;
    }

    .export-btn:hover {
      border-color: var(--g360-accent);
      color: var(--g360-accent);
    }

    .export-wrap {
      position: relative;
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
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .export-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border: none;
      border-radius: 50%;
      background: rgba(239, 68, 68, 0.12);
      color: #ef4444;
      cursor: pointer;
      transition: all 0.15s;
      flex-shrink: 0;
    }

    .export-close:hover {
      background: #ef4444;
      color: #fff;
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
      cursor: pointer;
      border-radius: 7px;
      text-align: left;
      transition: background 0.15s;
    }

    .export-option:hover {
      background: var(--g360-bg);
    }

    .export-option .count {
      font-size: 11px;
      color: var(--g360-muted);
      font-weight: 500;
    }

    .export-option.separator {
      border-top: 1px solid var(--g360-border);
      margin-top: 4px;
      padding-top: 9px;
      border-radius: 0;
    }

    .export-option.separator:hover {
      background: var(--g360-bg);
    }

    /* === KPI CARDS === */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }

    @media (min-width: 768px) {
      .kpi-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .kpi-card {
      background: var(--g360-surface);
      border: 1px solid var(--g360-border);
      border-left: 3px solid var(--g360-border);
      border-radius: 12px;
      padding: 16px;
      transition: all 0.2s;
    }

    .kpi-card.highlight {
      border-left-color: var(--g360-accent);
    }

    .kpi-card.warning {
      border-left-color: #f59e0b;
    }

    .kpi-card.danger {
      border-left-color: #ef4444;
    }


    .kpi-value {
      font-size: 28px;
      font-weight: 800;
      line-height: 1.2;
      color: var(--g360-text);
    }

    .kpi-card.highlight .kpi-value {
      color: var(--g360-accent);
    }

    .kpi-card.warning .kpi-value {
      color: #f59e0b;
    }

    .kpi-card.danger .kpi-value {
      color: #ef4444;
    }

    .kpi-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--g360-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 4px;
    }

    .kpi-sub {
      font-size: 10px;
      color: var(--g360-muted);
      margin-top: 2px;
    }

    /* === PROGRESS === */
    .progress-section {
      background: var(--g360-surface);
      border: 1px solid var(--g360-border);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .progress-title {
      font-size: 12px;
      font-weight: 700;
      color: var(--g360-text);
    }

    .progress-pct {
      font-size: 14px;
      font-weight: 800;
      color: var(--g360-accent);
    }

    .progress-bar {
      height: 8px;
      background: var(--g360-bg);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--g360-accent), #00ff88);
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    .progress-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 10px;
      color: var(--g360-muted);
    }

    /* === SEARCH === */
    .search-box {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }

    .search-input {
      flex: 1;
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid var(--g360-border);
      background: var(--g360-surface);
      color: var(--g360-text);
      font-size: 13px;
      outline: none;
    }

    .search-input:focus {
      border-color: var(--g360-accent);
    }

    .filter-select {
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid var(--g360-border);
      background: var(--g360-surface);
      color: var(--g360-text);
      font-size: 12px;
      outline: none;
      cursor: pointer;
    }

    /* === CATEGORY SECTIONS === */
    .section {
      margin-bottom: 16px;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: var(--g360-surface);
      border: 1px solid var(--g360-border);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .section-header:hover {
      border-color: var(--g360-accent);
    }

    .section-header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .section-toggle {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
    }

    .section-toggle.open {
      transform: rotate(90deg);
    }

    .section-name {
      font-size: 13px;
      font-weight: 700;
      color: var(--g360-text);
    }

    .section-count {
      font-size: 11px;
      color: var(--g360-muted);
      background: var(--g360-bg);
      padding: 2px 8px;
      border-radius: 10px;
    }

    .section-value {
      font-size: 12px;
      font-weight: 600;
      color: var(--g360-accent);
    }

    .section-body {
      padding: 8px 0 0 0;
    }

    /* === SKU ITEMS === */
    .sku-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);
      cursor: pointer;
      transition: background 0.15s;
      border-radius: 6px;
    }

    .sku-item:hover {
      background: rgba(255, 255, 255, 0.02);
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
      color: #ef4444;
    }

    .sku-bx.bajo {
      color: #f59e0b;
    }

    .sku-units {
      font-size: 10px;
      color: var(--g360-muted);
    }

    /* === EXPANDED DETAIL === */
    .sku-detail {
      padding: 12px 16px;
      background: rgba(0, 208, 132, 0.03);
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

    .almacen-chips {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
      margin-top: 8px;
    }

    .almacen-chip {
      font-size: 10px;
      padding: 3px 8px;
      border-radius: 4px;
      background: rgba(0, 208, 132, 0.1);
      border: 1px solid rgba(0, 208, 132, 0.2);
      color: var(--g360-accent);
      font-weight: 600;
    }

    .almacen-chip.inspeccion {
      background: rgba(245, 158, 11, 0.1);
      border-color: rgba(245, 158, 11, 0.3);
      color: #f59e0b;
    }

    .empty {
      text-align: center;
      padding: 40px;
      color: var(--g360-muted);
      font-size: 13px;
    }
  `;

  constructor() {
    super();
    this.filter = 'all';
    this.query = '';
    this._expandedCategories = new Set();
    this._expandedSkus = new Set();
    this.stats = { total: 0, conStock: 0, bajoStock: 0, sinStock: 0 };
    this.kpis = null;
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
    if (!path.includes(this)) {
      this.exportOpen = false;
    }
  }

  willUpdate(changed) {
    if (changed.has('stockData') && this.stockData) {
      const productos = this.stockData.productos || [];
      this.stats = calculateStats(productos);
      this.kpis = calculateKPIs(productos);
    }
  }

  _toggleCategory(cat) {
    if (this._expandedCategories.has(cat)) {
      this._expandedCategories.delete(cat);
    } else {
      this._expandedCategories = new Set([...this._expandedCategories, cat]);
    }
    this.requestUpdate();
  }

  _toggleSku(sku) {
    if (this._expandedSkus.has(sku)) {
      this._expandedSkus.delete(sku);
    } else {
      this._expandedSkus.add(sku);
    }
    this.requestUpdate();
  }

  _getFilteredSkus(categoria) {
    const productos = this.stockData?.productos || [];
    let filtered = productos.filter(p => (p.categoria || 'SIN CATEGORIA') === categoria);
    if (this.filter === 'sinStock') {
      filtered = filtered.filter(s => s.bx === 0);
    } else if (this.filter === 'bajoStock') {
      filtered = filtered.filter(s => s.bx > 0 && s.bx < 10);
    } else if (this.filter === 'conStock') {
      filtered = filtered.filter(s => s.bx >= 10);
    }
    if (this.query) {
      const q = this.query.toLowerCase();
      filtered = filtered.filter(s =>
        s.sku.toLowerCase().includes(q) ||
        (s.nombre_corto || s.nombre || '').toLowerCase().includes(q)
      );
    }
    return filtered;
  }

  _getSinCatalogoCount() {
    return (this.stockData?.productos || []).filter(esSinCatalogo).length;
  }

  async _exportXLSX(tipo = 'conStock') {
    const labels = { conStock: 'ConStock', bajoStock: 'BajoStock', sinStock: 'SinStock', sinCatalogo: 'SinCatalogo' };
    try {
      const { generateEstadoXLSX, downloadBlob, generarNombreArchivo } = await import('../core/report-generator.js');
      const productos = this.stockData?.productos || [];
      const blob = await generateEstadoXLSX(tipo, productos);
      const fecha = new Date().toLocaleString('es-PE', {
        day: '2-digit', month: '2-digit', year: '2-digit',
      }).replace(/\//g, '-');
      downloadBlob(blob, `StockPulse_${labels[tipo]}_${fecha}.xlsx`);
    } catch (error) {
      console.error('[estado-panel] Error exportando XLSX:', error.message);
    } finally {
      this.exportOpen = false;
    }
  }

  _getProgressPercent() {
    return this.stats.total ? Math.round(this.stats.conStock / this.stats.total * 100) : 0;
  }

  render() {
    if (!this.stockData || !this.kpis) {
      return html`<div style="text-align:center;padding:60px;color:var(--g360-muted)">Cargando estado...</div>`;
    }

    const categorias = this.kpis.porCategoria || [];
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
                <span>Con Stock</span>
                <span class="count">${this.stats.conStock}</span>
              </button>
              <button class="export-option" @click=${() => this._exportXLSX('bajoStock')}>
                <span>Bajo Stock (&lt;10)</span>
                <span class="count">${this.stats.bajoStock}</span>
              </button>
              <button class="export-option" @click=${() => this._exportXLSX('sinStock')}>
                <span>Sin Stock</span>
                <span class="count">${this.stats.sinStock}</span>
              </button>
              <button class="export-option separator" @click=${() => this._exportXLSX('sinCatalogo')}>
                <span>Sin Catálogo</span>
                <span class="count">${this._getSinCatalogoCount()}</span>
              </button>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- KPIs -->
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

      <!-- Progress -->
      <div class="progress-section">
        <div class="progress-header">
          <span class="progress-title">Nivel de Disponibilidad</span>
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

      <!-- Search -->
      <div class="search-box">
        <input
          type="text"
          class="search-input"
          placeholder="Buscar SKU o nombre..."
          .value=${this.query}
          @input=${e => this.query = e.target.value}
        />
        <select class="filter-select" @change=${e => this.filter = e.target.value}>
          <option value="all" ?selected=${this.filter === 'all'}>Todos</option>
          <option value="conStock" ?selected=${this.filter === 'conStock'}>Con Stock</option>
          <option value="bajoStock" ?selected=${this.filter === 'bajoStock'}>Bajo Stock</option>
          <option value="sinStock" ?selected=${this.filter === 'sinStock'}>Sin Stock</option>
        </select>
      </div>

      <!-- Categories -->
      ${categorias.map(cat => {
        const skus = this._getFilteredSkus(cat.nombre);
        const expanded = this._expandedCategories.has(cat.nombre);
        return html`
          <div class="section">
            <div class="section-header" @click=${() => this._toggleCategory(cat.nombre)}>
              <div class="section-header-left">
                <span class="section-toggle ${expanded ? 'open' : ''}">▶</span>
                <span class="section-name">${cat.nombre}</span>
                <span class="section-count">${cat.skus} SKUs</span>
              </div>
              
            </div>
            ${expanded ? html`
              <div class="section-body">
                ${skus.length === 0 ? html`<div class="empty">Sin resultados</div>` : ''}
                ${skus.map(s => html`
                  <div class="sku-item" @click=${() => this._toggleSku(s.sku)}>
                    <div class="sku-left">
                      <div class="sku-code">${s.sku}</div>
                      <div class="sku-name">${s.nombre}</div>
                    </div>
                    <div class="sku-right">
                      <div class="sku-bx ${s.bx === 0 ? 'cero' : s.bx < 10 ? 'bajo' : ''}">${etiquetaStock(s)}</div>
                      <div class="sku-units">Disponible venta: ${s.stock} u</div>
                    </div>
                  </div>
                  ${this._expandedSkus.has(s.sku) ? html`
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
                        <span class="detail-label">Cajas</span>
                        <span class="detail-value">${esPorUnidades(s) ? '— (unidades)' : s.bx}</span>
                      </div>
                      <div class="detail-row">
                        <span class="detail-label">Disponible venta</span>
                        <span class="detail-value">${s.stock}</span>
                      </div>

                      <div class="detail-row">
                        <span class="detail-label">Peso</span>
                        <span class="detail-value">${s.peso_kg} kg</span>
                      </div>
                      <div class="almacen-chips">
                        ${(s.almacenes_venta || []).map(a => html`
                          <span class="almacen-chip ${a.esInspeccion ? 'inspeccion' : ''}">${a.almacen}: ${a.disponible}</span>
                        `)}
                      </div>
                    </div>
                  ` : ''}
                `)}
              </div>
            ` : ''}
          </div>
        `;
      })}
    `;
  }
}

customElements.define('estado-panel', EstadoPanel);
