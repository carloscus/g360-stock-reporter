/**
 * @file app-root.js
 * @description Componente raíz con layout responsive mobile-first.
 *              Carga datos una sola vez y los distribuye a los paneles via store.
 *              Un solo activador para la barra de búsqueda (nav item "Buscar").
 * @author @carloscus
 * @version 3.0.0
 */

import { LitElement, html, css } from 'lit';
import { subscribe, isStale, getTimeAgo } from '../core/stock-store.js';
import { generateAlerts, loadStockData } from '../core/stock-service.js';
import './stock-header.js';
import './pulso-form.js';
import './estado-panel.js';
import './stock-alerts.js';
import './stock-search.js';
import './secundarios-panel.js';

// Definición única de navegación para evitar duplicación
const NAV_ITEMS = [
  {
    id: 'pulso',
    label: 'Pulso',
    icon: '📊',
    title: 'Generar Reporte',
    svg: html`
      <path d="M3 3v18h18" />
      <path d="M18.7 8l-5 5-4-4-6 6" />
    `,
  },
  {
    id: 'estado',
    label: 'Estado',
    icon: '💓',
    title: 'Estado Sistema',
    svg: html`<path d="M22 12h-4l-3 9L9 3l-3 9H2" />`,
  },
  {
    id: 'alertas',
    label: 'Alertas',
    icon: '🚨',
    title: 'Alertas',
    svg: html`
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    `,
  },
  {
    id: 'buscar',
    label: 'Buscar',
    icon: '🔍',
    title: 'Buscar Producto',
    svg: html`
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    `,
  },
  {
    id: 'secundarios',
    label: 'Sin Catálogo',
    icon: '📦',
    title: 'SKUs fuera de catálogo',
    svg: html`
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    `,
  },
];

export class AppRoot extends LitElement {
  static properties = {
    activeTab: { type: String },
    isSearchOpen: { type: Boolean },
    theme: { type: String },
    alertCount: { type: Number },
    _stockData: { type: Object },
  };

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
    }

    /* === LAYOUT PRINCIPAL === */
    .app-layout {
      display: flex;
      min-height: 100vh;
      background: var(--g360-bg);
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      width: 100%;
    }

    /* === DATA STATUS BAR === */
    .data-status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.3px;
      border-bottom: 1px solid var(--g360-border);
      transition: all var(--g360-transition);
    }

    .data-status.fresh {
      background: rgba(0, 208, 132, 0.06);
      color: var(--g360-muted);
    }

    .data-status.stale {
      background: rgba(245, 158, 11, 0.08);
      color: #f59e0b;
      animation: status-pulse 2s ease-in-out infinite;
    }

    @keyframes status-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .data-status.fresh .status-dot {
      background: var(--g360-accent);
    }

    .data-status.stale .status-dot {
      background: #f59e0b;
      animation: dot-blink 1s ease-in-out infinite;
    }

    @keyframes dot-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    .status-text {
      flex: 1;
    }

    .refresh-btn {
      background: none;
      border: 1px solid var(--g360-border);
      border-radius: 6px;
      color: var(--g360-muted);
      cursor: pointer;
      padding: 2px 8px;
      font-size: 14px;
      line-height: 1;
      transition: all 0.2s;
    }

    .refresh-btn:hover {
      border-color: var(--g360-accent);
      color: var(--g360-accent);
    }

    .refresh-btn:disabled {
      opacity: 0.5;
      cursor: wait;
    }
    .refresh-btn.refreshing .spinner-mini {
      display: inline-block;
      width: 0.9em;
      height: 0.9em;
      border: 1.2px solid currentColor;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    main {
      padding: 0 0 80px 0;
      flex: 1;
    }

    /* === MOBILE BOTTOM-NAV === */
    .bottom-nav {
      display: flex;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--g360-glass);
      backdrop-filter: blur(var(--g360-blur));
      -webkit-backdrop-filter: blur(var(--g360-blur));
      border-top: 1px solid var(--g360-border);
      padding: 8px 12px 20px;
      justify-content: space-around;
      z-index: 40;
      gap: 4px;
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      background: none;
      border: none;
      color: var(--g360-muted);
      cursor: pointer;
      padding: 8px 12px;
      border-radius: 10px;
      transition: all var(--g360-transition);
      flex: 1;
      min-width: 0;
      font-family: inherit;
    }

    .nav-item:hover {
      color: var(--g360-text);
    }

    .nav-item.active {
      color: var(--g360-accent);
      background: rgba(0, 208, 132, 0.1);
    }

    .nav-item .nav-icon {
      font-size: 20px;
      line-height: 1;
    }

    .nav-item .nav-label {
      font-size: var(--g360-size-xs);
      font-weight: var(--g360-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }

    .nav-badge {
      position: absolute;
      top: -2px;
      right: 4px;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      border-radius: 999px;
      background: #ef4444;
      color: #fff;
      font-size: 10px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }

    .nav-item {
      position: relative;
    }

    /* === SIDEBAR (PC) === */
    .sidebar {
      display: none;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 10px;
      border: none;
      background: transparent;
      color: var(--g360-muted);
      font-size: var(--g360-size-base);
      font-weight: var(--g360-weight-semibold);
      cursor: pointer;
      transition: all var(--g360-transition);
      text-align: left;
      font-family: inherit;
      width: 100%;
    }

    .menu-item:hover {
      background: rgba(255, 255, 255, 0.05);
      color: var(--g360-text);
    }

    .menu-item.active {
      background: rgba(0, 208, 132, 0.15);
      color: var(--g360-accent);
    }

    .menu-item svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .mobile-menu-footer {
      padding-top: 20px;
      border-top: 1px solid var(--g360-border);
      text-align: center;
    }

    .mobile-menu-footer p {
      margin: 0;
      font-size: 11px;
      color: var(--g360-muted);
    }

    /* === SEARCH OVERLAY === */
    .search-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 50;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 16px;
      animation: g360-fade-in 0.2s ease;
    }

    .search-container {
      width: 100%;
      max-width: 500px;
      background: var(--g360-surface);
      border: 1px solid var(--g360-border);
      border-radius: 24px;
      overflow: hidden;
      animation: g360-slide-up 0.3s ease;
    }

    /* === DESKTOP >= 1024px === */
    @media (min-width: 1024px) {
      .sidebar {
        display: flex;
        width: 240px;
        min-height: 100vh;
        background: var(--g360-glass);
        backdrop-filter: blur(var(--g360-blur));
        -webkit-backdrop-filter: blur(var(--g360-blur));
        border-right: 1px solid var(--g360-border);
        padding: 24px 20px;
        flex-direction: column;
        flex-shrink: 0;
        position: sticky;
        top: 0;
        height: 100vh;
      }

      .sidebar-logo {
        display: flex;
        align-items: center;
        gap: 12px;
        padding-bottom: 20px;
        margin-bottom: 20px;
        border-bottom: 1px solid var(--g360-border);
      }

      .sidebar-logo img {
        width: 40px;
        height: 40px;
        border-radius: 10px;
      }

      .sidebar-logo h2 {
        margin: 0;
        font-size: var(--g360-size-md);
        font-weight: var(--g360-weight-bold);
        color: var(--g360-text);
      }

      .sidebar-logo span {
        font-size: var(--g360-size-xs);
        color: var(--g360-accent);
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .sidebar-nav {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;
        overflow-y: auto;
      }

      .bottom-nav {
        display: none;
      }

      main {
        padding: 0;
      }
    }

    /* === TABLET 768px - 1023px === */
    @media (min-width: 768px) and (max-width: 1023px) {
      .bottom-nav {
        padding: 10px 20px 22px;
      }
      .nav-item .nav-label {
        font-size: 11px;
      }
    }
  `;

  constructor() {
    super();
    this.activeTab = 'pulso';
    this.isSearchOpen = false;
    this.theme = localStorage.getItem('g360-theme') || 'dark';
    this.alertCount = 0;
    this._stockData = null;
    this._isRefreshing = false;
    this._applyTheme();
  }

  firstUpdated() {
    // Suscribirse al store para recibir datos una sola vez
    this._unsubscribe = subscribe((data) => {
      this._stockData = data;
      const catalogados = (data.productos || [])
        .filter((p) => (p.estado_linea || '').trim() !== '');
      this.alertCount = catalogados.length > 0
        ? generateAlerts(catalogados).filter(a => a.type === 'critical').length
        : 0;
      this._updateDataStatus(data);
    });

    // Cargar datos (devuelve cache al instante; refresh se gestiona abajo)
    loadStockData();

    // Auto-refresh en background: refresca cada minuto si los datos están
    // stale (>15 min). El backend expone cache_expiro_en=900s.
    this._stalenessCheck = setInterval(() => {
      if (isStale()) this._autoRefresh();
    }, 60 * 1000);

    // Refresh proactivo al volver a la pestaña / enfocar la ventana,
    // sin necesidad de que el usuario pulse "Actualizar".
    this._onVisible = () => {
      if (document.visibilityState === 'visible' && isStale()) this._autoRefresh();
    };
    document.addEventListener('visibilitychange', this._onVisible);
    window.addEventListener('focus', this._onVisible);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._unsubscribe) this._unsubscribe();
    if (this._stalenessCheck) clearInterval(this._stalenessCheck);
    document.removeEventListener('visibilitychange', this._onVisible);
    window.removeEventListener('focus', this._onVisible);
  }

  async _autoRefresh() {
    if (this._isRefreshing) return;
    this._isRefreshing = true;
    try {
      // La data llega vía subscriber (saveData notifica); esto solo marca estado
      await loadStockData(true);
    } catch (error) {
      console.warn('[app-root] Refresh falló:', error);
    } finally {
      this._isRefreshing = false;
    }
  }

  async _manualRefresh() {
    if (this._isRefreshing) return;
    this._isRefreshing = true;
    this.requestUpdate();
    try {
      await loadStockData(true);
    } catch (e) {
      console.warn('[app-root] Manual refresh failed:', e);
    } finally {
      this._isRefreshing = false;
      this.requestUpdate();
    }
  }

  _applyTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
  }

  _toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('g360-theme', this.theme);
    document.documentElement.setAttribute('data-theme', this.theme);
  }

  _updateDataStatus(data) {
    const meta = data?.lastUpdated;
    if (meta) {
      this._dataAge = getTimeAgo(meta);
      this._isStale = isStale(meta);
    }
  }

  _openSearch() {
    this.isSearchOpen = true;
    this.activeTab = 'buscar';
  }

  _closeSearch() {
    this.isSearchOpen = false;
    this.activeTab = 'pulso';
  }

  _handleTabChange(tab) {
    if (tab === 'buscar') {
      this._openSearch();
    } else {
      this.activeTab = tab;
    }
  }

  _renderMenuItem(item) {
    return html`
      <button
        class="menu-item ${this.activeTab === item.id ? 'active' : ''}"
        @click=${() => this._handleTabChange(item.id)}
        aria-label=${item.title}
        aria-current=${this.activeTab === item.id ? 'page' : 'false'}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          ${item.svg}
        </svg>
        <span>${item.title}</span>
      </button>
    `;
  }

  _renderNavItem(item) {
    return html`
      <button
        class="nav-item ${this.activeTab === item.id ? 'active' : ''}"
        @click=${() => this._handleTabChange(item.id)}
        aria-label=${item.label}
        aria-current=${this.activeTab === item.id ? 'page' : 'false'}
      >
        <span class="nav-icon" aria-hidden="true">${item.icon}</span>
        <span class="nav-label">${item.label}</span>
        ${item.id === 'alertas' && this.alertCount > 0 ? html`
          <span class="nav-badge">${this.alertCount}</span>
        ` : ''}
      </button>
    `;
  }

  _renderActivePanel() {
    switch (this.activeTab) {
      case 'estado':
        return html`<estado-panel .stockData=${this._stockData}></estado-panel>`;
      case 'alertas':
        return html`<stock-alerts .stockData=${this._stockData}></stock-alerts>`;
      case 'secundarios':
        return html`<secundarios-panel .stockData=${this._stockData}></secundarios-panel>`;
      case 'pulso':
      default:
        return html`<pulso-form .stockData=${this._stockData}></pulso-form>`;
    }
  }

  render() {
    return html`
      <div class="app-layout">
        <aside class="sidebar" aria-label="Navegación principal">
          <nav class="sidebar-nav">
            ${NAV_ITEMS.map((item) => this._renderMenuItem(item))}
          </nav>
        </aside>

        <div class="main-content">
          <stock-header
            @toggle-theme=${this._toggleTheme}
            .theme=${this.theme}
          ></stock-header>

          <!-- Status bar: frescura de datos -->
          ${this._stockData ? html`
            <div class="data-status ${this._isStale ? 'stale' : 'fresh'}">
              <span class="status-dot"></span>
              <span class="status-text">
                ${this._isStale ? '🔄 Actualizando…' : `Datos actualizados hace ${this._dataAge || '<1min'}`}
              </span>
              ${this._isStale ? html`<button class="refresh-btn ${this._isRefreshing ? 'refreshing' : ''}" title="Actualizar ahora" @click=${() => loadStockData(true)} disabled?=${this._isRefreshing}>${this._isRefreshing ? html`<span class="spinner-mini"></span>` : html`↻`}</button>` : ''}
            </div>
          ` : ''}

          <main>${this._renderActivePanel()}</main>

          <nav class="bottom-nav" aria-label="Navegación inferior">
            ${NAV_ITEMS.map((item) => this._renderNavItem(item))}
          </nav>
        </div>

        ${this.isSearchOpen ? html`
          <div class="search-overlay" @click=${this._closeSearch}>
            <div class="search-container" @click=${(e) => e.stopPropagation()}>
              <stock-search
                @close=${this._closeSearch}
                .stockData=${this._stockData}
              ></stock-search>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
}

customElements.define('app-root', AppRoot);
