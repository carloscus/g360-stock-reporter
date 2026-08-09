/**
 * @file estado-panel.js
 * @description Panel de estado del sistema con dashboard.
 *              Recibe datos via prop .stockData del store centralizado.
 * @author @carloscus
 * @version 2.0.0
 */

import { LitElement, html, css } from 'lit';
import { calculateKPIs, calculateStats, generateAlerts } from '../core/stock-service.js';

export class EstadoPanel extends LitElement {
  static properties = {
    stockData: { type: Object },
  };

  static styles = css`
    :host {
      display: block;
    }

    .estado-header {
      margin-bottom: 24px;
    }

    .generico-kpi {
      margin-top: 16px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;
    }

    .kpi-card {
      background: var(--g360-surface);
      border: 1px solid var(--g360-border);
      border-radius: 14px;
      padding: 14px 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
    }

    .kpi-value {
      font-size: 20px;
      font-weight: 800;
      color: var(--g360-accent);
      margin-bottom: 4px;
    }

    .kpi-label {
      font-size: 11px;
      color: var(--g360-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    .linea-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(0, 208, 132, 0.1);
      border: 1px solid rgba(0, 208, 132, 0.25);
      font-size: 11px;
      font-weight: 700;
      color: var(--g360-accent);
    }

    .timestamp {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: var(--g360-size-sm);
      color: var(--g360-muted);
      margin-bottom: 8px;
    }

    .timestamp svg {
      color: var(--g360-accent);
    }

    h2 {
      margin: 0;
      font-size: var(--g360-size-xl);
      font-weight: var(--g360-weight-bold);
      color: var(--g360-text);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: var(--g360-surface);
      border: 1px solid var(--g360-border);
      border-radius: 16px;
      padding: 16px;
      text-align: center;
      transition: all 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .stat-card.highlight {
      grid-column: span 2;
      background: linear-gradient(135deg, var(--g360-accent), #00a06e);
    }

    .stat-card.warning {
      border-color: rgba(245, 158, 11, 0.3);
    }

    .stat-card.danger {
      border-color: rgba(239, 68, 68, 0.3);
      background: rgba(239, 68, 68, 0.05);
    }

    .stat-value {
      font-size: var(--g360-size-2xl);
      font-weight: var(--g360-weight-extrabold);
      color: var(--g360-text);
      line-height: 1;
      margin-bottom: 4px;
    }

    .stat-card.highlight .stat-value {
      color: var(--g360-bg);
    }

    .stat-card.danger .stat-value {
      color: var(--g360-danger);
    }

    .stat-label {
      font-size: var(--g360-size-xs);
      font-weight: var(--g360-weight-semibold);
      color: var(--g360-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-card.highlight .stat-label {
      color: var(--g360-bg);
      opacity: 0.9;
    }

    .stat-card.danger .stat-label {
      color: var(--g360-danger);
    }

    .progress-section {
      background: var(--g360-surface);
      border: 1px solid var(--g360-border);
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 24px;
    }

    .progress-title {
      font-size: 12px;
      font-weight: 700;
      color: var(--g360-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }

    .progress-bar {
      height: 8px;
      background: var(--g360-bg);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--g360-accent), #00a06e);
      border-radius: 4px;
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.5s ease;
    }

    .progress-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 11px;
      color: var(--g360-muted);
    }

    .alerts-section {
      background: var(--g360-surface);
      border: 1px solid var(--g360-border);
      border-radius: 16px;
      padding: 16px;
    }

    .alerts-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .alerts-title {
      font-size: 12px;
      font-weight: 700;
      color: var(--g360-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .alerts-badge {
      background: #ef4444;
      color: white;
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: 700;
    }

    .alert-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: var(--g360-bg);
      border-radius: 10px;
      margin-bottom: 8px;
    }

    .alert-item:last-child {
      margin-bottom: 0;
    }

    .alert-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .alert-icon.critical {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }

    .alert-icon.warning {
      background: rgba(245, 158, 11, 0.2);
      color: #f59e0b;
    }

    .alert-info {
      flex: 1;
    }

    .alert-sku {
      font-size: 11px;
      font-weight: 700;
      color: var(--g360-accent);
    }

    .alert-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--g360-text);
    }

    .alert-stock {
      font-size: 12px;
      font-weight: 700;
      color: var(--g360-muted);
    }

    .alert-stock.critical {
      color: #ef4444;
    }

    .alert-stock.warning {
      color: #f59e0b;
    }

    .stock-units {
      font-size: 9px;
      color: var(--g360-muted);
      font-weight: 400;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;
      margin: 16px 0;
    }

    .kpi-card {
      background: var(--g360-surface);
      border: 1px solid var(--g360-border);
      border-radius: 14px;
      padding: 14px 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
    }

    .kpi-value {
      font-size: 18px;
      font-weight: 800;
      color: var(--g360-accent);
      margin-bottom: 4px;
    }

    .kpi-label {
      font-size: 11px;
      color: var(--g360-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    .kpi-section {
      margin-bottom: 16px;
    }

    .kpi-section-title {
      font-size: var(--g360-size-sm);
      font-weight: 700;
      color: var(--g360-text);
      margin-bottom: 8px;
    }

    .linea-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .linea-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(0, 208, 132, 0.1);
      border: 1px solid rgba(0, 208, 132, 0.25);
      font-size: 11px;
      font-weight: 700;
      color: var(--g360-accent);
    }

    .alert-summary {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      padding: 12px 4px;
    }

    .alert-summary-item {
      flex: 1;
      min-width: 90px;
      text-align: center;
      background: var(--g360-surface);
      border: 1px solid var(--g360-border);
      border-radius: 12px;
      padding: 10px;
    }

    .alert-summary-item.critical .kpi-value {
      color: #ef4444;
    }

    .alert-summary-item.warning .kpi-value {
      color: #f59e0b;
    }

    .alert-summary-note {
      flex-basis: 100%;
      font-size: 12px;
      color: var(--g360-muted);
      text-align: center;
    }

    .alert-summary-note strong {
      color: var(--g360-accent);
    }

    .kpi-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .kpi-list-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      background: var(--g360-bg);
      border: 1px solid var(--g360-border);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .kpi-list-row:hover {
      border-color: var(--g360-accent);
      background: rgba(0, 208, 132, 0.05);
    }

    .kpi-list-row-name {
      flex: 1;
      font-size: 13px;
      font-weight: 600;
      color: var(--g360-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .kpi-list-row-value {
      font-size: 13px;
      font-weight: 800;
      color: var(--g360-accent);
      white-space: nowrap;
    }

    .kpi-list-row-sub {
      font-size: 10px;
      color: var(--g360-muted);
      font-weight: 500;
      white-space: nowrap;
    }

    .kpi-list-detail {
      padding: 8px 12px 12px;
      background: var(--g360-bg);
      border: 1px dashed var(--g360-border);
      border-radius: 0 0 10px 10px;
      border-top: none;
      font-size: 12px;
      color: var(--g360-muted);
    }

    .kpi-list-detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
      gap: 8px;
    }

    .kpi-list-detail-item {
      background: var(--g360-surface);
      border-radius: 8px;
      padding: 8px 10px;
    }

    .kpi-list-detail-item .val {
      font-weight: 800;
      color: var(--g360-text);
      font-size: 13px;
    }

    .kpi-list-detail-item .lbl {
      font-size: 9px;
      color: var(--g360-muted);
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .kpi-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      padding: 10px 12px;
      background: var(--g360-surface);
      border: 1px solid var(--g360-border);
      border-radius: 10px;
      margin-bottom: 8px;
      transition: all 0.2s ease;
    }

    .kpi-section-header:hover {
      border-color: var(--g360-accent);
    }

    .kpi-section-header .chevron {
      transition: transform 0.2s ease;
      color: var(--g360-muted);
    }

    .kpi-section-header.open .chevron {
      transform: rotate(180deg);
    }

    .filter-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 4px 0 12px;
      flex-wrap: wrap;
    }

    .filter-chip {
      display: flex;
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
    }

    .filter-chip.active {
      background: rgba(0, 208, 132, 0.1);
      border-color: var(--g360-accent);
      color: var(--g360-accent);
    }

    .filter-chip .chip-count {
      background: var(--g360-surface);
      border: 1px solid var(--g360-border);
      border-radius: 10px;
      padding: 0 6px;
      font-size: 10px;
    }
  `;

  constructor() {
    super();
    this.lastUpdated = '';
    this.stats = { total: 0, conStock: 0, bajoStock: 0, sinStock: 0 };
    this.alerts = [];
    this.kpis = null;
    this._showAllAlerts = false;
    this._expandedSection = null;
    this._expandedCategoria = null;
    this._fullProductos = [];
  }

  _toggleSection(name) {
    this._expandedSection = this._expandedSection === name ? null : name;
  }

  willUpdate(changedProperties) {
    if (changedProperties.has('stockData') && this.stockData) {
      // Solo productos del catálogo (con estado de línea definido)
      this._fullProductos = (this.stockData.productos || [])
        .filter((p) => (p.estado_linea || '').trim() !== '');
      this.lastUpdated = this.stockData.lastUpdated || new Date().toISOString();
      this.stats = calculateStats(this._fullProductos);
      this.kpis = calculateKPIs(this._fullProductos);
      this.alerts = generateAlerts(this._fullProductos, 10);
    }
  }

  _formatTimestamp(isoString) {
    return new Date(isoString).toLocaleString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  }

  _getProgressPercent() {
    if (!this.stats.total) return 0;
    return Math.round((this.stats.conStock / this.stats.total) * 100);
  }

  _renderCategoriaRow(cat) {
    const open = this._expandedCategoria === cat.nombre;
    return html`
      <div>
        <div class="kpi-list-row" @click=${() => this._toggleCategoria(cat.nombre)}>
          <span class="kpi-list-row-name">${cat.nombre}</span>
          <span class="kpi-list-row-sub">${cat.skus} SKUs</span>
          <span class="kpi-list-row-value">${cat.valor.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 })}</span>
        </div>
        ${open ? html`
          <div class="kpi-list-detail">
            <div class="kpi-list-detail-grid">
              <div class="kpi-list-detail-item">
                <div class="val">${cat.unidades.toLocaleString('es-PE')}</div>
                <div class="lbl">Unidades</div>
              </div>
              <div class="kpi-list-detail-item">
                <div class="val">${Math.round(cat.peso).toLocaleString('es-PE')} kg</div>
                <div class="lbl">Peso est.</div>
              </div>
              <div class="kpi-list-detail-item">
                <div class="val">${cat.cajas.toLocaleString('es-PE')}</div>
                <div class="lbl">Cajas</div>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  _toggleCategoria(name) {
    this._expandedCategoria = this._expandedCategoria === name ? null : name;
  }

  render() {
    const progress = this._getProgressPercent();
    const alerts = this.alerts;

    return html`
      <div class="estado-header">
        <div class="timestamp">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
          Última actualización: ${alerts.length ? this._formatTimestamp(this.lastUpdated) : '—'}
        </div>
        <h2>Estado del Sistema</h2>
      </div>

      <div class="stats-grid">
        <div class="stat-card highlight">
          <div class="stat-value">${this.stats.total}</div>
          <div class="stat-label">Total SKUs</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${this.stats.conStock}</div>
          <div class="stat-label">Con Stock</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-value" style="color: #f59e0b;">${this.stats.bajoStock}</div>
          <div class="stat-label">Stock Bajo (&lt;5)</div>
        </div>
        <div class="stat-card danger">
          <div class="stat-value">${this.stats.sinStock}</div>
          <div class="stat-label">Sin Stock</div>
        </div>
      </div>

      <div class="progress-section">
        <div class="progress-title">Nivel de Stock</div>
        <div class="progress-bar">
          <div class="progress-fill" style="transform: scaleX(${Math.min(progress / 100, 1)})"></div>
        </div>
        <div class="progress-labels">
          <span>Sin stock: ${this.stats.sinStock}</span>
          <span>${progress}% disponible</span>
        </div>
      </div>

      <!-- KPIs interactivos con datos del catálogo enriquecido -->
      ${this.kpis && this.kpis.unidades > 0 ? html`
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-value">${this.kpis.valorInventario.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 })}</div>
            <div class="kpi-label">Valor de Inventario</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value">${Math.round(this.kpis.pesoTotalKg).toLocaleString('es-PE')} kg</div>
            <div class="kpi-label">Peso Total Est.</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value">${this.kpis.cajasTotal.toLocaleString('es-PE')}</div>
            <div class="kpi-label">Cajas (${this.kpis.unidades.toLocaleString('es-PE')} und)</div>
          </div>
          <div class="kpi-card" @click=${() => this._toggleSection('categorias')}
            style="cursor:pointer;">
            <div class="kpi-value">${this.kpis.categoriasTotales}</div>
            <div class="kpi-label">Categorías ${this._expandedSection === 'categorias' ? '▲' : '▼'}</div>
          </div>
        </div>

        ${this._expandedSection === 'categorias' ? html`
          <div class="kpi-section">
            <div class="kpi-section-title">Desglose por Categoría (${this.kpis.porCategoria.length})</div>
            <div class="kpi-list">
              ${this.kpis.porCategoria.slice(0, 15).map(cat => html`
                ${this._renderCategoriaRow(cat)}
              `)}
            </div>
          </div>
        ` : ''}

        <div class="kpi-section">
          <div class="kpi-section-header ${this._expandedSection === 'estado' ? 'open' : ''}"
            @click=${() => this._toggleSection('estado')}>
            <span class="kpi-section-title" style="margin:0;">Composición por Estado de Línea</span>
            <span class="chevron">🔽</span>
          </div>
          ${this._expandedSection === 'estado' ? html`
            <div class="kpi-list">
              ${this.kpis.porEstadoLinea.map(est => html`
                <div class="kpi-list-row" style="cursor:default;">
                  <span class="kpi-list-row-name">${est.nombre}</span>
                  <span class="kpi-list-row-sub">SKUs</span>
                  <span class="kpi-list-row-value">${est.skus}</span>
                </div>
              `)}
            </div>
          ` : html`
            <div class="linea-chips">
              ${this.kpis.porEstadoLinea.slice(0, 4).map(e => html`
                <span class="linea-chip" @click=${() => this._toggleSection('estado')}>${e.nombre} · ${e.skus}</span>
              `)}
              ${this.kpis.porEstadoLinea.length > 4 ? html`
                <span class="linea-chip" style="cursor:pointer;" @click=${() => this._toggleSection('estado')}>+${this.kpis.porEstadoLinea.length - 4} más…</span>
              ` : ''}
            </div>
          `}
        </div>
      ` : ''}

      <!-- Acceso a alertas: contador resumido, lista completa en tab Alertas -->
      <div class="alerts-section">
        <div class="alerts-header">
          <div class="alerts-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Alertas de Stock
          </div>
          <span class="alerts-badge">${alerts.length}</span>
        </div>

        ${alerts.length === 0 ? html`
          <div style="text-align:center;padding:20px;color:var(--g360-muted);font-size:13px;">
            No hay alertas pendientes
          </div>
        ` : html`
          <div class="alert-summary">
            <div class="alert-summary-item critical">
              <div class="kpi-value">${alerts.filter(a => a.type === 'critical').length}</div>
              <div class="kpi-label">Sin Stock</div>
            </div>
            <div class="alert-summary-item warning">
              <div class="kpi-value">${alerts.filter(a => a.type === 'warning').length}</div>
              <div class="kpi-label">Bajo Stock</div>
            </div>
            <div class="alert-summary-note">Detalle completo en la sección <strong>Alertas</strong> del menú</div>
          </div>
        `}
      </div>
    `;
  }
}

customElements.define('estado-panel', EstadoPanel);
