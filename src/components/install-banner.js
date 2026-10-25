/**
 * @file install-banner.js
 * @description Banner flotante para instalar la PWA en móvil.
 *              Android/Chrome usa el prompt nativo; iOS muestra los pasos
 *              manuales (no existe prompt programático). Se oculta si ya está
 *              instalada o si el usuario lo cerró en los últimos 14 días.
 * @author @carloscus
 * @version 1.0.0
 */

import { LitElement, html, css } from 'lit';

const DISMISS_KEY = 'g360_install_dismissed_v1';
const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

const esIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export class InstallBanner extends LitElement {
  static properties = {
    visible: { type: Boolean },
    ios: { type: Boolean },
    showHelp: { type: Boolean },
  };

  static styles = css`
    :host {
      display: block;
    }

    .banner {
      position: fixed;
      left: 12px;
      right: 12px;
      bottom: calc(84px + env(safe-area-inset-bottom));
      z-index: 46;
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 14px;
      border-radius: 16px;
      background: var(--g360-surface);
      border: 1px solid var(--g360-accent);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
      animation: g360-slide-up 0.3s ease;
    }

    .row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .icon {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      background: var(--g360-accent);
      color: #06281c;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .text {
      flex: 1;
      min-width: 0;
    }

    .title {
      margin: 0;
      font-size: 13px;
      font-weight: 800;
      color: var(--g360-text);
    }

    .subtitle {
      margin: 1px 0 0;
      font-size: 11px;
      color: var(--g360-muted);
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    button {
      border-radius: 999px;
      font-family: inherit;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      padding: 8px 14px;
    }

    .install {
      flex: 1;
      border: none;
      background: var(--g360-accent);
      color: #06281c;
    }

    .dismiss {
      border: 1px solid var(--g360-border);
      background: transparent;
      color: var(--g360-muted);
    }

    .help {
      margin: 0;
      padding: 10px 12px;
      border-radius: 10px;
      background: var(--g360-bg);
      border: 1px solid var(--g360-border);
      font-size: 12px;
      line-height: 1.55;
      color: var(--g360-text);
    }

    @media (min-width: 768px) {
      .banner {
        left: auto;
        right: 20px;
        width: 360px;
        bottom: 20px;
      }
    }
  `;

  constructor() {
    super();
    this.visible = false;
    this.ios = false;
    this.showHelp = false;
    this._installable = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this.ios = esIOS();
    this._onInstallable = (e) => {
      this._installable = e.detail === true;
      if (this._installable) this._maybeShow();
      else this.visible = false;
    };
    this._onInstalled = () => { this.visible = false; };
    window.addEventListener('pwa-installable', this._onInstallable);
    window.addEventListener('appinstalled', this._onInstalled);
    this._maybeShow();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('pwa-installable', this._onInstallable);
    window.removeEventListener('appinstalled', this._onInstalled);
  }

  _isStandalone() {
    return window.matchMedia?.('(display-mode: standalone)')?.matches === true
      || window.navigator.standalone === true;
  }

  _dismissed() {
    try {
      const ts = Number(localStorage.getItem(DISMISS_KEY) || 0);
      return Date.now() - ts < COOLDOWN_MS;
    } catch {
      return false;
    }
  }

  _maybeShow() {
    if (this._isStandalone() || this._dismissed()) return;
    if (this.ios || this._installable || window.__g360Installable === true) {
      this.visible = true;
    }
  }

  _instalar() {
    if (this.ios) {
      this.showHelp = !this.showHelp;
      return;
    }
    if (window.promptInstall?.()) this.visible = false;
  }

  _descartar() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch { /* almacenamiento no disponible */ }
    this.visible = false;
  }

  render() {
    if (!this.visible) return '';
    return html`
      <div class="banner" role="region" aria-label="Instalar aplicación">
        <div class="row">
          <div class="icon" aria-hidden="true">⬇</div>
          <div class="text">
            <p class="title">Instala StockPulse</p>
            <p class="subtitle">Acceso directo desde tu pantalla de inicio</p>
          </div>
        </div>
        ${this.showHelp ? html`
          <p class="help">
            En iPhone/iPad: toca <strong>Compartir ⬆️</strong> en Safari y elige
            <strong>“Añadir a pantalla de inicio”</strong>.
          </p>
        ` : ''}
        <div class="actions">
          <button class="install" @click=${this._instalar}>
            ${this.ios ? 'Cómo instalar' : 'Instalar'}
          </button>
          <button class="dismiss" @click=${this._descartar}>Ahora no</button>
        </div>
      </div>
    `;
  }
}

customElements.define('install-banner', InstallBanner);
