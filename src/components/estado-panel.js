/**
 * @file estado-panel.js
 * @description Panel de estado del sistema con KPIs corporativos,
 *              lista expandible por categoria con SKUs y cajas VES,
 *              y exportacion de datos.
 * @author @carloscus
 * @version 4.9.0
 */

import { LitElement, html, css } from 'lit';
import { calculateKPIs, calculateStats, etiquetaStock, esPorUnidades, esCatalogo, esSinCatalogo, revisionBadge, UMBRAL_BAJO_STOCK, tieneStock122 } from '../core/stock-service.js';
import { esVigente } from '../core/report-filters.js';
import { ALMACEN_EXPORTACION } from '../core/stock-store.js';
import './almacen-legend.js';

// SKUs renderizados por categoría antes de "Mostrar más" (evita jank al buscar
// en categorías grandes: antes se pintaban todos en cada tecla).
const LIMITE_SKUS = 100;

export class EstadoPanel extends LitElement {
  static properties = {
    stockData: { type: Object },
    filter: { type: String },
    query: { type: String },
    mode: { type: String },
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

    .badge-count {
      background: var(--g360-danger, #ef4444);
      color: #fff;
      border-radius: 999px;
      padding: 2px 10px;
      font-size: 12px;
      font-weight: 800;
      margin-left: 6px;
    }

    .section-download {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border-radius: 8px;
      border: 1px solid var(--g360-border);
      background: var(--g360-bg);
      color: var(--g360-muted);
      cursor: pointer;
      flex-shrink: 0;
    }

    .section-download:hover {
      color: var(--g360-accent);
      border-color: var(--g360-accent);
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

    .legend-row {
      margin: 4px 0 12px;
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
      background: var(--g360-danger-bg);
      color: var(--g360-danger);
      cursor: pointer;
      transition: all 0.15s;
      flex-shrink: 0;
    }

    .export-close:hover {
      background: var(--g360-danger);
      color: #ffffff;
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
      border-left-color: var(--g360-warning);
    }

    .kpi-card.danger {
      border-left-color: var(--g360-danger);
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
      color: var(--g360-warning);
    }

    .kpi-card.danger .kpi-value {
      color: var(--g360-danger);
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
      background: linear-gradient(90deg, var(--g360-accent), var(--g360-accent-bright));
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
      transition: border-color 0.2s;
    }

    .load-more:hover {
      border-color: var(--g360-accent);
    }

    /* === SKU ITEMS === */
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

    /* === EXPANDED DETAIL === */
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
      background: var(--lote-ves-bg);
      border: 1px solid var(--lote-ves-border);
      color: var(--lote-ves);
      font-weight: 600;
    }

    .almacen-chip.inspeccion {
      background: var(--lote-121-bg);
      border-color: var(--lote-121-border);
      color: var(--lote-121);
    }

    .almacen-chip.exportacion {
      background: var(--lote-122-bg);
      border-color: var(--lote-122-border);
      color: var(--lote-122);
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
    this.mode = 'dashboard';
    this._expandedCategories = new Set();
    this._expandedSkus = new Set();
    this._limites = new Map();
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
    if (changed.has('mode') && this.mode === 'alertas' && this.filter === 'conStock') {
      this.filter = 'all';
    }
    if (changed.has('stockData') && this.stockData) {
      // Mismo universo para KPIs y alertas: catálogo vigente (sin descontinuados).
      const base = this._baseProductos();
      this.stats = calculateStats(base);
      this.kpis = calculateKPIs(base);
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

  _setQuery(e) {
    this.query = e.target.value;
    this._limites = new Map(); // reinicia paginado al buscar
    this._expandedSkus = new Set();
  }

  _setFilter(e) {
    this.filter = e.target.value;
    this._limites = new Map();
  }

  /** Productos accionables: catálogo maestro y vigentes (sin descontinuados). */
  _baseProductos() {
    return (this.stockData?.productos || []).filter((p) => esCatalogo(p) && esVigente(p));
  }

  /** Alertas = SKUs vigentes con menos de UMBRAL_BAJO_STOCK cajas en VES. */
  _alertasFiltradas() {
    let list = this._baseProductos().filter((p) => (p.bx ?? 0) < UMBRAL_BAJO_STOCK);
    if (this.filter === 'sinStock') list = list.filter((p) => (p.bx ?? 0) === 0);
    if (this.filter === 'bajoStock') list = list.filter((p) => (p.bx ?? 0) > 0);
    const q = this._normTexto(this.query).trim();
    if (q) {
      list = list.filter((p) =>
        this._normTexto(p.sku).includes(q) ||
        this._normTexto(p.nombre_corto || p.nombre).includes(q)
      );
    }
    return list.sort((a, b) => (a.bx ?? 0) - (b.bx ?? 0) || a.sku.localeCompare(b.sku));
  }

  /** Fila de SKU compartida por el dashboard y la vista de alertas. */
  _renderSkuRow(s) {
    const rev = revisionBadge(s);
    return html`
      <div class="sku-item" @click=${() => this._toggleSku(s.sku)}>
        <div class="sku-left">
          <div class="sku-code">${s.sku}</div>
          <div class="sku-name">${s.nombre}</div>
          ${rev ? html`<span class="sku-flag ${rev.rev === 'descontinuado' ? (s.stock > 0 ? 'ultimas' : 'descontinuado') : 'info'}">${rev.rev === 'descontinuado' && s.stock > 0 ? 'Últimas unidades' : rev.label}</span>` : ''}
        </div>
        <div class="sku-right">
          <div class="sku-bx ${s.bx === 0 ? 'cero' : s.bx < UMBRAL_BAJO_STOCK ? 'bajo' : ''}">${etiquetaStock(s)}</div>
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
            ${(s.almacenes_venta || []).map(a => html`
              <span
                class="almacen-chip ${a.esInspeccion ? 'inspeccion' : a.almacen === ALMACEN_EXPORTACION ? 'exportacion' : ''}"
                title="${a.almacen}${a.nombre ? ` · ${a.nombre}` : ''}"
                aria-label="Almacén ${a.almacen}${a.nombre ? `, ${a.nombre}` : ''}: ${a.disponible} disponibles"
              >${a.almacen}: ${a.disponible}</span>
            `)}
          </div>
        </div>
      ` : ''}
    `;
  }

  _mostrarMas(categoria) {
    this._limites.set(categoria, (this._limites.get(categoria) || LIMITE_SKUS) + LIMITE_SKUS);
    this.requestUpdate();
  }
  _normTexto(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  _getFilteredSkus(categoria) {
    // Mismo universo que KPIs y alertas: catálogo vigente.
    let filtered = this._baseProductos().filter(p => (p.categoria || 'SIN CATEGORIA') === categoria);
    if (this.filter === 'sinStock') {
      filtered = filtered.filter(s => s.bx === 0);
    } else if (this.filter === 'bajoStock') {
      filtered = filtered.filter(s => s.bx > 0 && s.bx < UMBRAL_BAJO_STOCK);
    } else if (this.filter === 'conStock') {
      filtered = filtered.filter(s => s.bx >= UMBRAL_BAJO_STOCK);
    }

    const q = this._normTexto(this.query).trim();
    if (q) {
      filtered = filtered.filter(s =>
        this._normTexto(s.sku).includes(q) ||
        this._normTexto(s.nombre_corto || s.nombre).includes(q)
      );
    }
    return filtered;
  }

  _getSinCatalogoCount() {
    return (this.stockData?.productos || []).filter(esSinCatalogo).length;
  }

  _getExport122Count() {
    return (this.stockData?.productos || []).filter(tieneStock122).length;
  }

  async _export122() {
    try {
      const { generateExport122XLSX, downloadBlob } = await import('../core/report-generator.js');
      const productos = this.stockData?.productos || [];
      const blob = await generateExport122XLSX(productos);
      const fecha = new Date().toLocaleString('es-PE', {
        day: '2-digit', month: '2-digit', year: '2-digit',
      }).replace(/\//g, '-');
      downloadBlob(blob, `StockPulse_122_Exportacion_${fecha}.xlsx`);
    } catch (error) {
      console.error('[estado-panel] Error exportando 122:', error.message);
    } finally {
      this.exportOpen = false;
    }
  }

  async _exportCategoria(categoria) {
    try {
      const { generateReportXLSX, downloadBlob, generarNombreArchivo } = await import('../core/report-generator.js');
      const productos = this.stockData?.productos || [];
      const blob = await generateReportXLSX(categoria, productos, {}, '');
      downloadBlob(blob, generarNombreArchivo(categoria));
    } catch (error) {
      console.error('[estado-panel] Error exportando categoría:', error.message);
    }
  }

  async _exportXLSX(tipo = 'conStock') {
    const labels = { conStock: 'ConStock', bajoStock: 'BajoStock', sinStock: 'SinStock', sinCatalogo: 'SinCatalogo' };
    try {
      const { generateEstadoXLSX, downloadBlob } = await import('../core/report-generator.js');
      // Mismo universo que la vista: catálogo vigente. La hoja Sin Catálogo
      // necesita justamente los que no están en catálogo.
      const productos = tipo === 'sinCatalogo'
        ? (this.stockData?.productos || [])
        : this._baseProductos();
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

  _renderAlertas() {
    // Totales sobre el universo de alertas (sin filtro de texto/estado).
    const todas = this._baseProductos().filter((p) => (p.bx ?? 0) < UMBRAL_BAJO_STOCK);
    const sinStock = todas.filter((p) => (p.bx ?? 0) === 0).length;
    const bajoStock = todas.length - sinStock;

    const alertas = this._alertasFiltradas();
    const limite = this._limites.get('__alertas') || LIMITE_SKUS;
    const visibles = alertas.slice(0, limite);

    return html`
      <div class="header">
        <h1>🚨 Alertas <span class="badge-count">${todas.length}</span></h1>
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
              <button class="export-option" @click=${() => this._exportXLSX('alertas')}>
                <span>Todos</span>
                <span class="count">${todas.length}</span>
              </button>
              <button class="export-option" @click=${() => this._exportXLSX('bajoStock')}>
                <span>Bajo Stock</span>
                <span class="count">${bajoStock}</span>
              </button>
              <button class="export-option" @click=${() => this._exportXLSX('sinStock')}>
                <span>Sin Stock</span>
                <span class="count">${sinStock}</span>
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
          <option value="all" ?selected=${this.filter === 'all'}>Todos (${todas.length})</option>
          <option value="bajoStock" ?selected=${this.filter === 'bajoStock'}>Bajo Stock (${bajoStock})</option>
          <option value="sinStock" ?selected=${this.filter === 'sinStock'}>Sin Stock (${sinStock})</option>
        </select>
      </div>

      <div class="legend-row">
        <almacen-legend></almacen-legend>
      </div>

      <div class="section">
        <div class="section-body">
          ${visibles.length === 0 ? html`<div class="empty">No hay alertas con el filtro seleccionado</div>` : ''}
          ${visibles.map((s) => this._renderSkuRow(s))}
          ${alertas.length > visibles.length ? html`
            <button class="load-more" @click=${() => this._mostrarMas('__alertas')}>
              Mostrar más (${Math.min(LIMITE_SKUS, alertas.length - visibles.length)} de ${alertas.length - visibles.length} restantes)
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  render() {
    if (!this.stockData || !this.kpis) {
      return html`<div style="text-align:center;padding:60px;color:var(--g360-muted)">Cargando estado...</div>`;
    }

    if (this.mode === 'alertas') return this._renderAlertas();

    const categorias = this.kpis.porCategoria || [];
    const totalCajas = this.kpis.cajasTotal || 0;

    // Una sola pasada por categoría: evita refiltrar dos veces por render
    // (antes se llamaba _getFilteredSkus en el map y otra vez en el contador).
    const porCategoria = new Map();
    let totalFiltrados = 0;
    for (const cat of categorias) {
      const skus = this._getFilteredSkus(cat.nombre);
      porCategoria.set(cat.nombre, skus);
      totalFiltrados += skus.length;
    }
    const buscando = (this.query || '').trim().length > 0;

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
              <button class="export-option separator" @click=${() => this._export122()}>
                <span>122 (Exportación)</span>
                <span class="count">${this._getExport122Count()}</span>
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

      <!-- Categories -->
      ${categorias.map(cat => {
        const skus = porCategoria.get(cat.nombre) || [];
        // Buscando: auto-expande secciones con coincidencias y oculta las vacías.
        // Sin búsqueda: respeta el colapsado manual (las secciones inician cerradas).
        if (buscando && skus.length === 0) return '';
        const expanded = buscando || this._expandedCategories.has(cat.nombre);
        const limite = this._limites.get(cat.nombre) || LIMITE_SKUS;
        const visibles = expanded ? skus.slice(0, limite) : [];
        return html`
          <div class="section">
            <div class="section-header" @click=${() => this._toggleCategory(cat.nombre)}>
              <div class="section-header-left">
                <span class="section-toggle ${expanded ? 'open' : ''}">▶</span>
                <span class="section-name">${cat.nombre}</span>
                <span class="section-count">${buscando ? skus.length : cat.skus} SKUs</span>
              </div>
              <button
                class="section-download"
                title="Descargar reporte de ${cat.nombre}"
                aria-label="Descargar reporte de ${cat.nombre}"
                @click=${(e) => { e.stopPropagation(); this._exportCategoria(cat.nombre); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </button>
              
            </div>
            ${expanded ? html`
              <div class="section-body">
                ${skus.length === 0 ? html`<div class="empty">Sin resultados</div>` : ''}
                ${visibles.map((s) => this._renderSkuRow(s))}
                ${skus.length > visibles.length ? html`
                  <button class="load-more" @click=${() => this._mostrarMas(cat.nombre)}>
                    Mostrar más (${Math.min(LIMITE_SKUS, skus.length - visibles.length)} de ${skus.length - visibles.length} restantes)
                  </button>
                ` : ''}
              </div>
            ` : ''}
          </div>
        `;
      })}
      ${totalFiltrados === 0 && buscando ? html`<div class="empty">Sin resultados para "${this.query.trim()}"</div>` : ''}
    `;
  }
}

customElements.define('estado-panel', EstadoPanel);

