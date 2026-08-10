/**
 * @file pulso-form.js
 * @description Formulario para generar reporte de stock - UI/UX optimizado.
 *              Recibe datos via prop .stockData del store centralizado.
 * @author @carloscus
 * @version 3.0.0
 */

import { LitElement, html, css } from 'lit';

export class PulsoForm extends LitElement {
  static properties = {
    nombre: { type: String },
    email: { type: String },
    categoria: { type: String },
    isValid: { type: Boolean },
    isGenerating: { type: Boolean },
    nombreError: { type: String },
    emailError: { type: String },
    intentos: { type: Number },
    bloqueado: { type: Boolean },
    tiempoBloqueo: { type: Number },
    showModal: { type: Boolean },
    isMobile: { type: Boolean },
    isSaved: { type: Boolean },
    includeInspeccion: { type: Boolean },
    includeSecundarios: { type: Boolean },
    stockData: { type: Object },
  };

  static styles = css`
    :host {
      display: block;
      padding: 16px;
    }

    .guide {
      background: linear-gradient(135deg, rgba(0, 208, 132, 0.15), rgba(0, 208, 132, 0.05));
      border: 1px solid rgba(0, 208, 132, 0.25);
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 20px;
    }

    .guide-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: var(--g360-size-sm);
      font-weight: var(--g360-weight-bold);
      color: var(--g360-accent);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
    }

    .guide ol {
      margin: 0;
      padding-left: 20px;
      font-size: var(--g360-size-sm);
      color: var(--g360-muted);
      line-height: 1.8;
    }

    .guide li {
      font-weight: var(--g360-weight-medium);
    }

    .form-card {
      background: var(--g360-surface);
      border: 1px solid var(--g360-border);
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }

    .label {
      font-size: var(--g360-size-xs);
      font-weight: var(--g360-weight-bold);
      color: var(--g360-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
      display: block;
    }

    .input-wrapper {
      position: relative;
      margin-bottom: 20px;
    }

    .input-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--g360-muted);
      pointer-events: none;
      transition: color 0.2s ease;
    }

    .input-wrapper:focus-within .input-icon {
      color: var(--g360-accent);
    }

    input {
      width: 100%;
      padding: 14px 14px 14px 44px;
      background: var(--g360-bg);
      border: 1px solid var(--g360-border);
      border-radius: 10px;
      color: var(--g360-text);
      font-size: var(--g360-size-base);
      font-family: inherit;
      outline: none;
      transition: all 0.2s ease;
      box-sizing: border-box;
    }

    input:focus {
      border-color: var(--g360-accent);
      box-shadow: 0 0 0 3px rgba(0, 208, 132, 0.15);
    }

    input::placeholder {
      color: var(--g360-muted);
      opacity: 0.6;
    }

    input.error {
      border-color: #ef4444;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #ef4444;
      font-size: 11px;
      font-weight: 600;
      margin-top: 6px;
      animation: shake 0.3s ease;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }

    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .chip {
      flex: 1;
      min-width: 80px;
      padding: 12px 14px;
      border-radius: 10px;
      border: 1px solid var(--g360-border);
      background: var(--g360-bg);
      color: var(--g360-muted);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
    }

    .chip:hover {
      border-color: var(--g360-accent);
    }

    .chip.active {
      background: var(--g360-accent);
      border-color: var(--g360-accent);
      color: var(--g360-bg);
      box-shadow: 0 4px 12px rgba(0, 208, 132, 0.3);
    }

    .submit-btn {
      width: 100%;
      padding: 14px 20px;
      border: none;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--g360-accent), #00a06e);
      color: var(--g360-bg);
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s ease;
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 208, 132, 0.35);
    }

    .submit-btn:active:not(:disabled) {
      transform: translateY(0);
    }

    .submit-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      transform: none;
    }

    .submit-btn.blocked {
      opacity: 0.6;
      background: #ef4444;
      cursor: not-allowed;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid transparent;
      border-top-color: currentColor;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Checkbox toggle for almacén 121 */
    .checkbox-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: var(--g360-bg);
      border: 1px solid var(--g360-border);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: 12px;
    }

    .checkbox-row:hover {
      border-color: var(--g360-accent);
    }

    .checkbox-row input[type="checkbox"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
      accent-color: var(--g360-accent);
    }

    .checkbox-row label {
      font-size: 12px;
      font-weight: 600;
      color: var(--g360-text);
      cursor: pointer;
      white-space: nowrap;
    }

    .checkbox-row input:checked + label,
    .checkbox-row.checked {
      color: var(--g360-accent);
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 16px;
    }

    .modal-content {
      background: var(--g360-surface);
      border: 1px solid var(--g360-border);
      border-radius: 24px;
      padding: 32px;
      max-width: 360px;
      width: 100%;
      position: relative;
      text-align: center;
      animation: modalIn 0.3s ease;
    }

    @keyframes modalIn {
      from { transform: scale(0.9); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .modal-close {
      position: absolute;
      top: 16px;
      right: 16px;
      background: var(--g360-bg);
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--g360-muted);
      cursor: pointer;
    }

    .modal-close:hover {
      color: var(--g360-text);
    }

    .modal-icon {
      width: 80px;
      height: 80px;
      background: rgba(0, 208, 132, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      color: var(--g360-accent);
    }

    .modal-title {
      font-size: 22px;
      font-weight: 700;
      color: var(--g360-text);
      margin-bottom: 8px;
    }

    .modal-subtitle {
      font-size: 14px;
      color: var(--g360-muted);
      margin-bottom: 24px;
    }

    .modal-file {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--g360-bg);
      border: 1px solid var(--g360-border);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
      color: var(--g360-text);
      font-size: 14px;
      font-weight: 600;
    }

    .modal-file svg {
      color: var(--g360-accent);
      flex-shrink: 0;
    }

    .modal-download-btn {
      width: 100%;
      padding: 16px;
      background: var(--g360-accent);
      color: var(--g360-bg);
      border: none;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .modal-download-btn:hover {
      filter: brightness(1.1);
    }
  `;

  constructor() {
    super();
    this.nombre = '';
    this.email = '';
    this.categoria = 'TODOS';
    this.isValid = false;
    this.isGenerating = false;
    this.nombreError = '';
    this.emailError = '';
    this.intentos = 0;
    this.bloqueado = false;
    this.tiempoBloqueo = 0;
    this.showModal = false;
    this.isMobile = window.innerWidth < 768;
    this.isSaved = false;
    this.includeInspeccion = false;
    this.includeSecundarios = false;
    this.stockData = null;
    this._bloqueoTimer = null;
    this._loadSavedData();
  }

  _loadSavedData() {
    if (this.isMobile) {
      const saved = localStorage.getItem('stock_user');
      if (saved) {
        const data = JSON.parse(saved);
        this.nombre = data.nombre || '';
        this.email = data.email || '';
        this.isSaved = !!(this.nombre && this.email);
      }
    }
  }

  _saveData() {
    if (this.isMobile && this.nombre && this.email) {
      localStorage.setItem('stock_user', JSON.stringify({ nombre: this.nombre, email: this.email }));
      this.isSaved = true;
    }
  }

  _validateEmail(email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
    return /@cipsa\.com\.pe$/i.test(email);
  }

  _checkBloqueo() {
    if (this.bloqueado && this.tiempoBloqueo > 0) {
      this.tiempoBloqueo--;
      if (this.tiempoBloqueo === 0) {
        this.bloqueado = false;
        this.intentos = 0;
      } else {
        this._bloqueoTimer = setTimeout(() => this._checkBloqueo(), 1000);
      }
    }
  }

  _incrementarIntentos() {
    this.intentos++;
    if (this.intentos >= 3) {
      this.bloqueado = true;
      this.tiempoBloqueo = 300;
      this._checkBloqueo();
    }
  }

  _resetearIntentos() {
    this.intentos = 0;
    this.bloqueado = false;
    this.tiempoBloqueo = 0;
    if (this._bloqueoTimer) {
      clearTimeout(this._bloqueoTimer);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._bloqueoTimer) clearTimeout(this._bloqueoTimer);
  }

  _handleInput(e, field) {
    this[field] = e.target.value;

    if (field === 'nombre') {
      this.nombreError = this.nombre.length > 0 && this.nombre.length < 3 ? 'Mínimo 3 caracteres' : '';
    }

    if (field === 'email') {
      if (!this._validateEmail(this.email)) {
        this.emailError = this.email.length > 0 && !/@cipsa\.com\.pe$/i.test(this.email)
          ? 'Solo emails @cipsa.com.pe'
          : this.email.length > 0 ? 'Email inválido' : '';
      } else {
        this.emailError = '';
      }
    }

    this.isValid = this.nombre.length >= 3 && this._validateEmail(this.email);
  }

  _handleCategory(cat) {
    this.categoria = cat;
  }

  _handleSubmit(e) {
    e.preventDefault();

    if (this.bloqueado) {
      this.emailError = `Demasiados intentos. Bloqueado por ${Math.ceil(this.tiempoBloqueo / 60)} min`;
      return;
    }

    if (!this.isValid) return;

    this.isGenerating = true;
    this._resetearIntentos();

    this.dispatchEvent(new CustomEvent('generar-reporte', {
      detail: { categoria: this.categoria, includeInspeccion: this.includeInspeccion, includeSecundarios: this.includeSecundarios },
      bubbles: true,
      composed: true,
    }));

    this.showModal = true;
    this.isGenerating = false;
  }

  _handleCloseModal() {
    this.showModal = false;
    this.nombre = '';
    this.email = '';
    this.categoria = 'TODOS';
    this.includeInspeccion = false;
    this.includeSecundarios = false;
    this._resetearIntentos();
  }

  _clearCredentials() {
    try { localStorage.removeItem('stock_user'); } catch { /* noop */ }
    this.isSaved = false;
  }

  async _handleDownload() {
    try {
      const { generateReportXLSX, downloadBlob, generarNombreArchivo } = await import('../core/report-generator.js');
      const data = this.stockData;
      const lastUpdated = data.lastUpdated || '';

      this.isGenerating = true;

const blob = await generateReportXLSX(
          this.categoria,
          data.productos,
          {
            includeInspeccion: this.includeInspeccion,
            includeSecundarios: this.includeSecundarios,
            autor: { nombre: this.nombre, email: this.email },
          },
          lastUpdated,
        );
      this.isGenerating = false;

      const filename = generarNombreArchivo(this.categoria);
      downloadBlob(blob, filename);

      // Limpiar credenciales para exigir reingreso en la siguiente descarga
      this._clearCredentials();
      this._handleCloseModal();
    } catch (error) {
      console.error('[pulso-form] Error generando XLSX:', error);
      this._handleCloseModal();
    } finally {
      this.isGenerating = false;
    }
  }

  render() {
    const categorias = [
      { id: 'TODOS', nombre: 'Todos', icon: '📋' },
      { id: 'VINIBALL', nombre: 'VINIBALL', icon: '⚽' },
      { id: 'VINIFAN', nombre: 'VINIFAN', icon: '📁' },
      { id: 'REPRESENTADAS', nombre: 'Representadas', icon: '🌎' },
    ];

    if (!this.stockData) {
      return html`
        <div style="display:flex;align-items:center;justify-content:center;padding:60px;color:var(--g360-muted);gap:12px;">
          <div class="spinner"></div>
          Cargando datos del inventario...
        </div>
      `;
    }

    return html`
      <div class="guide">
        <div class="guide-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          Cómo Usar
        </div>
        <ol>
          <li>Ingresa tu correo corporativo (@cipsa.com.pe) y nombre</li>
          <li>Selecciona el tipo de reporte</li>
          <li>Presiona "Real Time" para generar → DESCARGAR AHORA</li>
          <li>Opcional: activa "Incluir almacén 121 (Inspección)" para stock transitorio</li>
          <li>Opcional: activa "Incluir SKUs fuera de catálogo" para exportar esos ítems en una hoja adicional</li>
        </ol>
      </div>

      <form @submit=${this._handleSubmit}>
        <div class="form-card">
          <div class="field">
            <label class="label">Solicitante</label>
            <div class="input-wrapper">
              <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <input
                type="text"
                placeholder="Tu nombre completo"
                class="${this.nombreError ? 'error' : ''}"
                .value=${this.nombre}
                @input=${(e) => this._handleInput(e, 'nombre')}
                ?disabled=${this.bloqueado}
              />
            </div>
            ${this.nombreError ? html`
              <div class="error-message">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                ${this.nombreError}
              </div>
            ` : ''}
          </div>

          <div class="field">
            <label class="label">Email Corporativo</label>
            <div class="input-wrapper">
              <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <input
                type="email"
                placeholder="usuario@cipsa.com.pe"
                class="${this.emailError ? 'error' : ''}"
                .value=${this.email}
                @input=${(e) => this._handleInput(e, 'email')}
                ?disabled=${this.bloqueado}
              />
            </div>
            ${this.emailError ? html`
              <div class="error-message">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                ${this.emailError}
              </div>
            ` : this.intentos > 0 && !this.bloqueado ? html`
              <div class="error-message" style="color: #f59e0b;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                Intentos restantes: ${3 - this.intentos}
              </div>
            ` : ''}
          </div>

          <div class="field">
            <label class="label">Categoría de Interés</label>
            <div class="chips">
              ${categorias.map(cat => html`
                <button
                  type="button"
                  class="chip ${this.categoria === cat.id ? 'active' : ''}"
                  @click=${() => this._handleCategory(cat.id)}
                  ?disabled=${this.bloqueado}
                >
                  ${cat.icon} ${cat.nombre}
                </button>
              `)}
            </div>
          </div>

          <div class="checkbox-row ${this.includeInspeccion ? 'checked' : ''}" @click=${() => this.includeInspeccion = !this.includeInspeccion}>
            <input
              type="checkbox"
              .checked=${this.includeInspeccion}
              @change=${(e) => this.includeInspeccion = e.target.checked}
              @click=${(e) => e.stopPropagation()}
            />
            <label>Incluir almacén 121 (Inspección)</label>
          </div>
          <div class="checkbox-row ${this.includeSecundarios ? 'checked' : ''}" @click=${() => this.includeSecundarios = !this.includeSecundarios}>
            <input
              type="checkbox"
              .checked=${this.includeSecundarios}
              @change=${(e) => this.includeSecundarios = e.target.checked}
              @click=${(e) => e.stopPropagation()}
            />
            <label>Incluir SKUs fuera de catálogo (hoja adicional)</label>
          </div>
        </div>

        <button
          type="submit"
          class="submit-btn ${this.bloqueado ? 'blocked' : ''}"
          ?disabled=${!this.isValid || this.isGenerating || this.bloqueado}
        >
          ${this.isGenerating ? html`
            <span class="spinner"></span>
            Generando...
          ` : this.bloqueado ? html`
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Bloqueado (${Math.ceil(this.tiempoBloqueo / 60)} min)
          ` : html`
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Generar Inventario Real-Time
          `}
        </button>
      </form>

      ${this.showModal ? html`
        <div class="modal-overlay" @click=${this._handleCloseModal}>
          <div class="modal-content" @click=${(e) => e.stopPropagation()}>
            <button class="modal-close" @click=${this._handleCloseModal}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>

            <div class="modal-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>

            <h3 class="modal-title">¡Snapshot Listo!</h3>
            <p class="modal-subtitle">El reporte de stock ha sido generado con éxito.</p>

            <div class="modal-file">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span>StockPulse_${this.categoria}.xlsx</span>
            </div>

            <button class="modal-download-btn" @click=${this._handleDownload}>
              DESCARGAR AHORA
            </button>
          </div>
        </div>
      ` : ''}
    `;
  }
}

customElements.define('pulso-form', PulsoForm);
