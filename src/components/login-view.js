/**
 * @file login-view.js
 * @description Puerta de entrada simulada: nombre + email @cipsa.com.pe.
 *              Emite `login` con { nombre, email } para que app-root cree la
 *              sesión local. No es autenticación (sin backend).
 * @author @carloscus
 * @version 1.0.0
 */

import { LitElement, html, css } from 'lit';
import { validarEmail, saveSession } from '../core/session.js';

export class LoginView extends LitElement {
  static properties = {
    nombre: { type: String },
    email: { type: String },
    error: { type: String },
  };

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px 16px calc(24px + env(safe-area-inset-bottom));
      background: var(--g360-bg);
    }

    .card {
      width: 100%;
      max-width: 400px;
      background: var(--g360-surface);
      border: 1px solid var(--g360-border);
      border-radius: 20px;
      padding: 28px 24px;
      box-shadow: var(--g360-shadow, 0 8px 32px rgba(0, 0, 0, 0.25));
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }

    .brand img {
      width: 44px;
      height: 44px;
      border-radius: 12px;
    }

    h1 {
      margin: 0;
      font-size: 20px;
      color: var(--g360-text);
    }

    .subtitle {
      margin: 2px 0 0;
      font-size: 11px;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--g360-accent);
      font-weight: 700;
    }

    label {
      display: block;
      margin: 14px 0 6px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--g360-muted);
    }

    input {
      width: 100%;
      box-sizing: border-box;
      padding: 13px 14px;
      border-radius: 10px;
      border: 1px solid var(--g360-border);
      background: var(--g360-bg);
      color: var(--g360-text);
      font-size: 15px;
      font-family: inherit;
      outline: none;
    }

    input:focus {
      border-color: var(--g360-accent);
      box-shadow: 0 0 0 3px rgba(0, 208, 132, 0.15);
    }

    .error {
      margin-top: 12px;
      font-size: 12px;
      font-weight: 600;
      color: #ef4444;
    }

    button {
      width: 100%;
      margin-top: 20px;
      padding: 14px;
      border: none;
      border-radius: 12px;
      background: var(--g360-accent);
      color: #06281c;
      font-size: 14px;
      font-weight: 800;
      cursor: pointer;
      font-family: inherit;
    }

    button:hover {
      filter: brightness(1.08);
    }

    .note {
      margin: 16px 0 0;
      font-size: 11px;
      line-height: 1.5;
      color: var(--g360-muted);
      text-align: center;
    }
  `;

  constructor() {
    super();
    this.nombre = '';
    this.email = '';
    this.error = '';
  }

  _onSubmit(e) {
    e.preventDefault();
    this.error = '';
    try {
      const sesion = saveSession({ nombre: this.nombre, email: this.email });
      this.dispatchEvent(new CustomEvent('login', { detail: sesion, bubbles: true, composed: true }));
    } catch (err) {
      this.error = err.message;
    }
  }

  render() {
    return html`
      <form class="card" @submit=${this._onSubmit}>
        <div class="brand">
          <img src="${import.meta.env.BASE_URL}favicon.svg" alt="CIPSA" />
          <div>
            <h1>StockPulse</h1>
            <p class="subtitle">Stock Intelligence</p>
          </div>
        </div>

        <label for="nombre">Nombre</label>
        <input
          id="nombre"
          type="text"
          placeholder="Tu nombre completo"
          .value=${this.nombre}
          @input=${(e) => this.nombre = e.target.value}
          autocomplete="name"
          required
        />

        <label for="email">Correo corporativo</label>
        <input
          id="email"
          type="email"
          placeholder="usuario@cipsa.com.pe"
          .value=${this.email}
          @input=${(e) => this.email = e.target.value}
          autocomplete="email"
          inputmode="email"
          autocapitalize="off"
          spellcheck="false"
          required
        />

        ${this.error ? html`<div class="error" role="alert">${this.error}</div>` : ''}

        <button type="submit">Ingresar</button>

        <p class="note">
          🔒 Acceso local simulado: valida el dominio @cipsa.com.pe en este equipo.
          No reemplaza un login corporativo.
        </p>
      </form>
    `;
  }
}

customElements.define('login-view', LoginView);
