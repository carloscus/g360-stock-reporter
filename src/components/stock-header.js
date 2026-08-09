/**
 * @file stock-header.js
 * @description Header con logo y toggle de tema.
 *              Busqueda se activa solo desde el nav item "Buscar" en app-root.
 * @author @carloscus
 * @version 2.0.0
 */

import { LitElement, html, css } from 'lit';

export class StockHeader extends LitElement {
  static properties = {
    titulo: { type: String },
    theme: { type: String },
    installable: { type: Boolean },
  };

  static styles = css`
    :host {
      display: block;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--g360-space-md);
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

    .icon-btn {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      border: none;
      background: transparent;
      color: var(--g360-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--g360-transition);
      flex-shrink: 0;
    }

    .icon-btn:hover {
      background: var(--g360-bg);
      color: var(--g360-text);
    }

    .icon-btn:focus-visible {
      outline: 2px solid var(--g360-accent);
      outline-offset: 2px;
    }

    .theme-btn {
      color: var(--g360-text);
      background: var(--g360-bg);
      border: 1px solid var(--g360-border);
    }

    .theme-btn:hover {
      border-color: var(--g360-accent);
      background: rgba(0, 208, 132, 0.05);
    }

    .install-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      height: 40px;
      padding: 0 14px;
      border-radius: 10px;
      border: 1px solid var(--g360-border);
      background: var(--g360-bg);
      color: var(--g360-accent);
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .install-btn:hover {
      border-color: var(--g360-accent);
      background: rgba(0, 208, 132, 0.1);
    }

    @media (max-width: 600px) {
      .install-btn {
        width: 40px;
        padding: 0;
        justify-content: center;
        font-size: 0;
      }
      .install-btn span {
        font-size: 18px;
      }
    }

    .theme-emoji {
      font-size: 20px;
      line-height: 1;
    }

    @media (min-width: 1024px) {
      .header {
        padding: var(--g360-space-md) var(--g360-space-lg);
      }
      h1 {
        font-size: 18px;
      }
    }
  `;

  constructor() {
    super();
    this.titulo = 'CIPSA Stock';
    this.installable = false;
    this._onInstallable = (e) => { this.installable = e.detail; };
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('pwa-installable', this._onInstallable);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('pwa-installable', this._onInstallable);
  }

  _install() {
    if (typeof window.promptInstall === 'function') {
      window.promptInstall();
    }
  }

  _dispatchTheme() {
    this.dispatchEvent(new CustomEvent('toggle-theme', { bubbles: true, composed: true }));
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
          ${this.installable ? html`
            <button
              class="install-btn"
              @click=${this._install}
              title="Instalar aplicación"
              aria-label="Instalar aplicación"
            >
              <span aria-hidden="true">⬇️</span>
              Instalar
            </button>
          ` : ''}
          <button
            class="icon-btn theme-btn"
            @click=${this._dispatchTheme}
            title=${this.theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
            aria-label="Cambiar tema"
          >
            <span class="theme-emoji" aria-hidden="true">${this.theme === 'dark' ? '☀️' : '🌙'}</span>
          </button>
        </div>
      </header>
    `;
  }
}

customElements.define('stock-header', StockHeader);
