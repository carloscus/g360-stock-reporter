/**
 * @file estado-panel.js
 * @description Panel de estado del sistema con KPIs corporativos,
 *              lista expandible por categoria con SKUs y cajas VES,
 *              y exportacion de datos.
 * @author @carloscus
 * @version 4.0.0
 */

import { LitElement, html, css } from 'lit';
import { calculateKPIs, calculateStats, generateAlerts } from '../core/stock-service.js';

export class EstadoPanel extends LitElement {
  static properties = {
    stockData: { type: Object },
    filter: { type: String },
    query: { type: String },
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
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
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
    this.alerts = [];
  }

  willUpdate(changed) {
    if (changed.has('stockData') && this.stockData) {
      const productos = this.stockData.productos || [];
      this.stats = calculateStats(productos);
      this.kpis = calculateKPIs(productos);
      this.alerts = generateAlerts(productos, 10);
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

  _exportCSV() {
    const rows = [['SKU', 'Nombre', 'Linea', 'Categoria', 'Cajas', 'Unidades', 'Precio', 'Estado']];
    const productos = (this.stockData?.productos || []).filter(p => {
      if (this.filter === 'sinStock') return p.bx === 0;
      if (this.filter === 'bajoStock') return p.bx > 0 && p.bx < 10;
      if (this.filter === 'conStock') return p.bx >= 10;
      return true;
    }).filter(p => {
      if (!this.query) return true;
      const q = this.query.toLowerCase();
      return p.sku.toLowerCase().includes(q) || (p.nombre_corto || '').toLowerCase().includes(q);
    });
    for (const p of productos) {
      rows.push([
        p.sku,
        p.nombre_corto || p.nombre || '',
        p.linea || '',
        p.categoria || '',
        p.bx || 0,
        p.stock || 0,
        p.precio || 0,
        p.estado || ''
      ]);
    }
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StockPulse_Estado_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
        <button class="export-btn" @click=${this._exportCSV}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Exportar
        </button>
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
                      <div class="sku-name">${s.nombre_corto || s.nombre}</div>
                    </div>
                    <div class="sku-right">
                      <div class="sku-bx ${s.bx === 0 ? 'cero' : s.bx < 10 ? 'bajo' : ''}">${s.bx >= 1 ? s.bx + ' bx' : s.stock + ' u'}</div>
                      <div class="sku-units">${s.stock} u</div>
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
                        <span class="detail-value">${s.bx}</span>
                      </div>
                      <div class="detail-row">
                        <span class="detail-label">Unidades</span>
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
