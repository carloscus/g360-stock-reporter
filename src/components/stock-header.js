/**
 * @file stock-header.js
 * @description Header con logo y toggle de tema.
 *              Busqueda se activa solo desde el nav item "Buscar" en app-root.
 * @author @carloscus
 * @version 2.3.0
 */

import { LitElement, html, css } from 'lit';

export class StockHeader extends LitElement {
  static properties = {
    titulo: { type: String },
    theme: { type: String },
    usuario: { type: String },
    email: { type: String },
    menuOpen: { type: Boolean },
  };

  static styles = css`
    :host {
      display: block;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: calc(var(--g360-space-md) + env(safe-area-inset-top)) var(--g360-space-md) var(--g360-space-md);
      background: var(--g360-surface);
      border-bottom: 1px solid var(--g360-border);
      position: sticky;
      top: 0;
      z-index: 40;
      backdrop-filter: blur(var(--g360-blur));
      -webkit-backdrop-filter: blur(var(--g360-blur));
      transition: background-color var(--g360-transition), border-color var(--g360-transition);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: var(--g360-space-sm);
      min-width: 0;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: var(--g360-space-sm);
    }

    .logo {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      overflow: hidden;
      flex-shrink: 0;
    }

    .logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .title-section {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    h1 {
      margin: 0;
      font-size: var(--g360-size-md);
      font-weight: var(--g360-weight-extrabold);
      color: var(--g360-text);
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .subtitle {
      font-size: var(--g360-size-xs);
      color: var(--g360-accent);
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: var(--g360-weight-semibold);
    }

    .user-wrap {
      position: relative;
    }

    .user-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      height: 40px;
      padding: 0 10px 0 6px;
      border-radius: 10px;
      border: 1px solid var(--g360-border);
      background: var(--g360-bg);
      color: var(--g360-text);
      cursor: pointer;
      font-family: inherit;
      font-size: 12px;
      font-weight: 600;
      transition: all 0.2s;
      max-width: 200px;
    }

    .user-btn:hover,
    .user-btn.open {
      border-color: var(--g360-accent);
    }

    .user-avatar {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: var(--g360-accent);
      color: var(--g360-on-accent);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 12px;
      flex-shrink: 0;
    }

    .user-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .chev {
      font-size: 10px;
      color: var(--g360-muted);
      transition: transform 0.2s;
    }

    .user-btn.open .chev {
      transform: rotate(180deg);
    }

    .user-menu {
      position: absolute;
      right: 0;
      top: calc(100% + 6px);
      min-width: 220px;
      background: var(--g360-surface);
      border: 1px solid var(--g360-border);
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
      padding: 6px;
      z-index: 60;
    }

    .menu-head {
      padding: 8px 10px 10px;
      border-bottom: 1px solid var(--g360-border);
      margin-bottom: 6px;
    }

    .menu-name {
      display: block;
      font-size: 12px;
      font-weight: 800;
      color: var(--g360-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .menu-email {
      display: block;
      font-size: 11px;
      color: var(--g360-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: var(--g360-text);
      font-size: 12px;
      font-weight: 600;
      font-family: inherit;
      text-align: left;
      cursor: pointer;
    }

    .menu-item:hover {
      background: var(--g360-bg);
    }

    .menu-item.danger {
      color: var(--g360-danger);
    }

    .menu-item svg {
      flex-shrink: 0;
    }

    @media (max-width: 600px) {
      .user-name {
        display: none;
      }
      .user-btn {
        padding: 0 6px;
      }
    }

    @media (min-width: 1024px) {
      .header {
        padding: calc(var(--g360-space-md) + env(safe-area-inset-top)) var(--g360-space-lg) var(--g360-space-md);
      }
      h1 {
        font-size: 18px;
      }
    }
  `;

  constructor() {
    super();
    this.titulo = 'StockPulse';
    this.menuOpen = false;
    this._onDocClick = this._handleDocClick.bind(this);
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

  _handleDocClick(e) {
    if (!this.menuOpen) return;
    if (e.type === 'keydown') {
      if (e.key === 'Escape') this.menuOpen = false;
      return;
    }
    const path = e.composedPath ? e.composedPath() : [];
    if (!path.includes(this)) this.menuOpen = false;
  }

  _toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  _dispatchTheme() {
    this.menuOpen = false;
    this.dispatchEvent(new CustomEvent('toggle-theme', { bubbles: true, composed: true }));
  }

  _dispatchLogout() {
    this.menuOpen = false;
    this.dispatchEvent(new CustomEvent('logout', { bubbles: true, composed: true }));
  }

  render() {
    return html`
      <header class="header" role="banner">
        <div class="header-left">
          <div class="logo">
            <img src="${import.meta.env.BASE_URL}favicon.svg" alt="CIPSA" />
          </div>
          <div class="title-section">
            <h1>${this.titulo}</h1>
            <span class="subtitle">Stock Intelligence</span>
          </div>
        </div>
        <div class="header-right">
          ${this.usuario ? html`
            <div class="user-wrap">
              <button
                class="user-btn ${this.menuOpen ? 'open' : ''}"
                @click=${this._toggleMenu}
                aria-haspopup="menu"
                aria-expanded=${this.menuOpen ? 'true' : 'false'}
                aria-label="Menú de sesión de ${this.usuario}"
              >
                <span class="user-avatar" aria-hidden="true">${this.usuario.charAt(0).toUpperCase()}</span>
                <span class="user-name">${this.usuario}</span>
                <span class="chev" aria-hidden="true">▾</span>
              </button>
              ${this.menuOpen ? html`
                <div class="user-menu" role="menu">
                  <div class="menu-head">
                    <span class="menu-name">${this.usuario}</span>
                    ${this.email ? html`<span class="menu-email">${this.email}</span>` : ''}
                  </div>
                  <button class="menu-item" role="menuitem" @click=${this._dispatchTheme}>
                    <span aria-hidden="true">${this.theme === 'dark' ? '☀️' : '🌙'}</span>
                    ${this.theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
                  </button>
                  <button class="menu-item danger" role="menuitem" @click=${this._dispatchLogout}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Cerrar sesión
                  </button>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </header>
    `;
  }
}

customElements.define('stock-header', StockHeader);
