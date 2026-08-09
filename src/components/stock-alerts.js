/**
 * @file stock-alerts.js
 * @description Componente de alertas de stock (productos bajo/sin stock)
 *              Recibe datos via prop .stockData del store centralizado.
 * @author @carloscus
 * @version 2.0.0
 */

import { LitElement, html, css } from 'lit';
import { generateAlerts } from '../core/stock-service.js';

export class StockAlerts extends LitElement {
  static properties = {
    stockData: { type: Object },
    filter: { type: String },
  };

  static styles = css`
    :host {
      display: block;
      padding: 24px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .title {
      font-size: var(--g360-size-xl);
      font-weight: var(--g360-weight-bold);
      color: var(--g360-text);
    }

    .badge {
      background: var(--g360-danger);
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: var(--g360-size-base);
      font-weight: var(--g360-weight-semibold);
    }

    .filters {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
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
      font-size: var(--g360-size-base);
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

    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .alert-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: var(--g360-surface);
      border-radius: 12px;
      border: 1px solid var(--g360-border);
    }

    .alert-item.critical {
      border-left: 2px solid var(--g360-danger);
      background: rgba(239, 68, 68, 0.05);
    }

    .alert-item.warning {
      border-left: 2px solid var(--g360-warning);
      background: rgba(245, 158, 11, 0.05);
    }

    .alert-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .alert-icon.critical {
      background: rgba(239, 68, 68, 0.15);
      color: var(--g360-danger);
    }

    .alert-icon.warning {
      background: rgba(245, 158, 11, 0.15);
      color: var(--g360-warning);
    }

    .alert-info {
      flex: 1;
      min-width: 0;
    }

    .alert-sku {
      font-size: var(--g360-size-sm);
      font-weight: var(--g360-weight-bold);
      color: var(--g360-accent);
      margin-bottom: 4px;
    }

    .alert-name {
      font-size: var(--g360-size-base);
      font-weight: var(--g360-weight-medium);
      color: var(--g360-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .alert-stock {
      text-align: right;
      flex-shrink: 0;
    }

    .stock-value {
      font-size: 18px;
      font-weight: 700;
      display: block;
    }

    .stock-value.critical {
      color: var(--g360-danger);
    }

    .stock-value.warning {
      color: var(--g360-warning);
    }

    .stock-label {
      font-size: 11px;
      color: var(--g360-muted);
    }

    .empty {
      text-align: center;
      padding: 60px;
      color: var(--g360-muted);
    }

    .empty svg {
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    @media (max-width: 600px) {
      :host {
        padding: 16px;
      }
      .alert-item {
        padding: 12px;
      }
      .alert-stock {
        min-width: 70px;
      }
    }
  `;

  constructor() {
    super();
    this.filter = 'all';
    this.alerts = [];
  }

  willUpdate(changedProperties) {
    if (changedProperties.has('stockData') && this.stockData) {
      // Solo productos del catálogo (con estado de línea definido)
      const catalogados = (this.stockData.productos || [])
        .filter((p) => (p.estado_linea || '').trim() !== '');
      this.alerts = generateAlerts(catalogados);
    }
  }

  get filteredAlerts() {
    if (this.filter === 'critical') return this.alerts.filter(a => a.type === 'critical');
    if (this.filter === 'warning') return this.alerts.filter(a => a.type === 'warning');
    return this.alerts;
  }

  render() {
    if (!this.alerts) {
      return html`<div style="text-align:center;padding:60px;color:var(--g360-muted)">Cargando alertas...</div>`;
    }

    const filtered = this.filteredAlerts;
    const criticalCount = this.alerts.filter(a => a.type === 'critical').length;
    const warningCount = this.alerts.filter(a => a.type === 'warning').length;

    return html`
      <div class="header">
        <h1 class="title">🚨 Alertas</h1>
        <span class="badge">${this.alerts.length}</span>
      </div>

      <div class="filters">
        <button
          class="filter-btn ${this.filter === 'all' ? 'active' : ''}"
          @click=${() => this.filter = 'all'}
        >
          Todos (${this.alerts.length})
        </button>
        <button
          class="filter-btn ${this.filter === 'critical' ? 'active' : ''}"
          @click=${() => this.filter = 'critical'}
        >
          Sin Stock (${criticalCount})
        </button>
        <button
          class="filter-btn ${this.filter === 'warning' ? 'active' : ''}"
          @click=${() => this.filter = 'warning'}
        >
          Bajo Stock (${warningCount})
        </button>
      </div>

      ${filtered.length === 0 ? html`
        <div class="empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <p>No hay alertas con el filtro seleccionado</p>
        </div>
      ` : html`
        <div class="alerts-list">
          ${filtered.map(alert => html`
            <div class="alert-item ${alert.type}">
              <div class="alert-icon ${alert.type}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  ${alert.type === 'critical'
                    ? html`<path d="M18 6L6 18M6 6l12 12"/>`
                    : html`<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>`
                  }
                </svg>
              </div>
              <div class="alert-info">
                <div class="alert-sku">${alert.sku} · ${alert.linea}</div>
                <div class="alert-name">${alert.nombre}</div>
              </div>
              <div class="alert-stock">
                <span class="stock-value ${alert.type}">${alert.stock}</span>
                <span class="stock-label">${alert.bx} bx</span>
              </div>
            </div>
          `)}
        </div>
      `}
    `;
  }
}

customElements.define('stock-alerts', StockAlerts);
