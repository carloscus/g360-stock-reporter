/**
 * @file pulso-form.js
 * @description Formulario para generar reporte de stock - UI/UX optimizado.
 *              Recibe datos via prop .stockData del store centralizado.
 * @author @carloscus
 * @version 3.6.1
 */

import { LitElement, html, css } from 'lit';

export class PulsoForm extends LitElement {
  static properties = {
    categoria: { type: String },
    isGenerating: { type: Boolean },
    showModal: { type: Boolean },
    perfil: { type: String },
    advanced: { type: Boolean },
    categoriaInicial: { type: String },
    lineaInicial: { type: String },
    advancedInicial: { type: Boolean },
    includeSecundarios: { type: Boolean },
    includeExport122: { type: Boolean },
    incluirNoVigentes: { type: Boolean },
    linea: { type: String },
    showGuide: { type: Boolean },
    stockData: { type: Object },
    autor: { type: Object },
    errorMsg: { type: String },
  };

  static styles = css`
    :host {
      display: block;
      padding: 16px;
    }

    .guide-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 12px 16px;
      background: var(--g360-surface);
      border: 1px solid var(--g360-border);
      border-radius: 12px;
      color: var(--g360-text);
      font-size: var(--g360-size-sm);
      font-weight: var(--g360-weight-semibold);
      cursor: pointer;
      font-family: inherit;
      margin-bottom: 12px;
      transition: border-color var(--g360-transition);
      box-sizing: border-box;
    }

    .guide-toggle:hover {
      border-color: var(--g360-accent);
    }

    .advanced-toggle {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
      padding: 9px 12px;
      margin-bottom: 12px;
      border-radius: 10px;
      border: 1px solid var(--g360-border);
      background: var(--g360-bg);
      color: var(--g360-text);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
    }

    .advanced-toggle.active {
      border-color: var(--g360-accent);
      color: var(--g360-accent);
    }

    .advanced-toggle .chev {
      margin-left: auto;
      color: var(--g360-muted);
      transition: transform 0.2s;
    }

    .advanced-toggle.active .chev {
      transform: rotate(180deg);
    }

    .quick-note {
      margin: 0 0 12px;
      font-size: 11px;
      color: var(--g360-muted);
    }

    .guide-toggle .chev {
      margin-left: auto;
      color: var(--g360-muted);
      transition: transform 0.2s ease;
      font-size: 12px;
    }

    .guide-toggle.open .chev {
      transform: rotate(180deg);
    }

    .guide {
      background: linear-gradient(135deg, var(--lote-ves-bg), transparent);
      border: 1px solid var(--lote-ves-border);
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

    .select-input {
      width: 100%;
      padding: 12px 14px;
      background: var(--g360-bg);
      border: 1px solid var(--g360-border);
      border-radius: 10px;
      color: var(--g360-text);
      font-size: var(--g360-size-base);
      font-family: inherit;
      outline: none;
      margin-bottom: 8px;
    }

    .select-input:focus {
      border-color: var(--g360-accent);
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
      box-shadow: 0 0 0 3px var(--lote-ves-bg);
    }

    input::placeholder {
      color: var(--g360-muted);
      opacity: 0.6;
    }

    input.error {
      border-color: var(--g360-danger);
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--g360-danger);
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
      color: var(--g360-on-accent);
      box-shadow: 0 4px 12px var(--lote-ves-bg);
    }

    .submit-btn {
      width: 100%;
      padding: 14px 20px;
      border: none;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--g360-accent), var(--g360-accent-strong));
      color: var(--g360-on-accent);
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
      box-shadow: 0 8px 20px var(--lote-ves-bg);
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
      background: var(--g360-danger);
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

    /* Checkbox toggle para opciones del reporte */
    .checkbox-row {
      display: flex;
      align-items: flex-start;
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
      flex-shrink: 0;
      margin-top: 1px;
    }

    .checkbox-row label {
      font-size: 12px;
      font-weight: 600;
      color: var(--g360-text);
      cursor: pointer;
      white-space: normal;
      overflow-wrap: break-word;
      line-height: 1.45;
      min-width: 0;
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
      padding: 16px 16px calc(16px + env(safe-area-inset-bottom));
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
      background: var(--lote-ves-bg);
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
    this.categoria = 'TODOS';
    this.isGenerating = false;
    this.showModal = false;
    this.perfil = 'rapido';
    this.categoriaInicial = '';
    this.lineaInicial = '';
    this.advancedInicial = false;
    this.includeSecundarios = false;
    this.includeExport122 = false;
    this.incluirNoVigentes = false;
    this.linea = '';
    this.stockData = null;
    this.autor = null;
    this.errorMsg = '';
    this._blob = null;
    this._filename = '';
    try {
      this.advanced = localStorage.getItem('g360_advanced_v1') === '1';
    } catch {
      this.advanced = false;
    }
    try {
      this.showGuide = localStorage.getItem('g360_guide_v1') !== '0';
    } catch {
      this.showGuide = true;
    }
  }

  willUpdate(changed) {
    if (changed.has('categoriaInicial') && this.categoriaInicial) {
      this.categoria = this.categoriaInicial;
      this.linea = this.lineaInicial || '';
      if (this.advancedInicial) this.advanced = true;
      this.dispatchEvent(new CustomEvent('prefill-consumed', { bubbles: true, composed: true }));
    }
  }

  _toggleAdvanced() {
    this.advanced = !this.advanced;
    try {
      localStorage.setItem('g360_advanced_v1', this.advanced ? '1' : '0');
    } catch { /* almacenamiento no disponible */ }
  }

  _handleCategory(cat) {
    this.categoria = cat;
    this.linea = '';
  }

  /** Líneas del catálogo para el alcance (filtradas por categoría). */
  _lineas() {
    const set = new Set();
    for (const p of (this.stockData?.productos || [])) {
      if (!p.estado_linea || !p.linea) continue;
      if (this.categoria !== 'TODOS' && p.categoria !== this.categoria) continue;
      set.add(p.linea);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }

  _toggleGuide() {
    this.showGuide = !this.showGuide;
    try {
      localStorage.setItem('g360_guide_v1', this.showGuide ? '1' : '0');
    } catch { /* almacenamiento no disponible */ }
  }

  async _handleSubmit(e) {
    e.preventDefault();
    if (!this.stockData || this.isGenerating) return;

    this.isGenerating = true;
    this.errorMsg = '';
    try {
      const { generateReportXLSX, generarNombreArchivo } = await import('../core/report-generator.js');
      const avanzadas = this.advanced;
      const perfil = avanzadas ? this.perfil : 'rapido';
      this._blob = await generateReportXLSX(
        this.categoria,
        this.stockData.productos,
        {
          perfil,
          includeSecundarios: avanzadas ? this.includeSecundarios : false,
          includeExport122: avanzadas ? this.includeExport122 : false,
          incluirNoVigentes: avanzadas ? this.incluirNoVigentes : false,
          linea: avanzadas ? this.linea : '',
          autor: this.autor || null,
        },
        this.stockData.lastUpdated || '',
      );
      this._filename = generarNombreArchivo(this.categoria, perfil);
      this.showModal = true;
    } catch (error) {
      console.error('[pulso-form] Error generando XLSX:', error);
      this.errorMsg = 'No se pudo generar el reporte. Revisa la conexión e intenta de nuevo.';
    } finally {
      this.isGenerating = false;
    }
  }

  _handleDownload() {
    if (!this._blob || !this._filename) return;
    import('../core/report-generator.js')
      .then(({ downloadBlob }) => {
        downloadBlob(this._blob, this._filename);
        this._handleCloseModal();
      })
      .catch((error) => {
        console.error('[pulso-form] Error descargando XLSX:', error);
        this._handleCloseModal();
        this.errorMsg = 'El navegador bloqueó la descarga. Intenta desde Chrome/Safari.';
      });
  }

  _handleCloseModal() {
    this.showModal = false;
    this._blob = null;
    this._filename = '';
    this.categoria = 'TODOS';
    this.linea = '';
    this.perfil = 'rapido';
    this.includeSecundarios = false;
    this.includeExport122 = false;
    this.incluirNoVigentes = false;
  }

  render() {
    const categorias = [
      { id: 'TODOS', nombre: 'Todos', icon: '📋' },
      { id: 'VINIBALL', nombre: 'VINIBALL', icon: '⚽' },
      { id: 'VINIFAN', nombre: 'VINIFAN', icon: '📁' },
      { id: 'REPRESENTADAS', nombre: 'Representadas', icon: '🌎' },
    ];
    const lineas = this._lineas();

    if (!this.stockData) {
      return html`
        <div style="display:flex;align-items:center;justify-content:center;padding:60px;color:var(--g360-muted);gap:12px;">
          <div class="spinner"></div>
          Cargando datos del inventario...
        </div>
      `;
    }

    return html`
      <button
        type="button"
        class="guide-toggle ${this.showGuide ? 'open' : ''}"
        @click=${this._toggleGuide}
        aria-expanded=${this.showGuide ? 'true' : 'false'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        Instrucciones
        <span class="chev" aria-hidden="true">▾</span>
      </button>
      ${this.showGuide ? html`
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
          <li>Selecciona la categoría y presiona "Descargar reporte" (perfil rápido)</li>
          <li>La descarga rápida incluye catálogo vigente y Disponible VES</li>
          <li>Opcional: activa "Opciones avanzadas" para perfil completo, línea, no vigentes u hojas extra</li>
          <li>Opcional: activa "Incluir hoja 122 (Exportación)" para una hoja adicional con el disponible/predespacho de ese almacén</li>
          <li>Opcional: activa "Incluir SKUs fuera de catálogo" para exportar esos ítems en una hoja adicional</li>
        </ol>
      </div>
      ` : ''}

      <form @submit=${this._handleSubmit}>
        <div class="form-card">
          <div class="field">
            <label class="label">Categoría de Interés</label>
            <div class="chips">
              ${categorias.map(cat => html`
                <button
                  type="button"
                  class="chip ${this.categoria === cat.id ? 'active' : ''}"
                  @click=${() => this._handleCategory(cat.id)}
                >
                  ${cat.icon} ${cat.nombre}
                </button>
              `)}
            </div>
          </div>

          <button
            type="button"
            class="advanced-toggle ${this.advanced ? 'active' : ''}"
            @click=${this._toggleAdvanced}
          >
            ⚙ Opciones avanzadas
            <span class="chev" aria-hidden="true">▾</span>
          </button>

          ${this.advanced ? html`
            ${lineas.length > 1 ? html`
              <div class="field">
                <label class="label">Alcance por línea</label>
                <select class="select-input" @change=${(e) => this.linea = e.target.value}>
                  <option value="" ?selected=${!this.linea}>Todas las líneas</option>
                  ${lineas.map((l) => html`
                    <option value=${l} ?selected=${this.linea === l}>${l}</option>
                  `)}
                </select>
              </div>
            ` : ''}

            <div class="field">
              <label class="label">Perfil de reporte</label>
              <select class="select-input" @change=${(e) => this.perfil = e.target.value}>
                <option value="rapido" ?selected=${this.perfil === 'rapido'}>Rápido · Disponible VES</option>
                <option value="completo" ?selected=${this.perfil === 'completo'}>Completo · todos los almacenes</option>
              </select>
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
            <div class="checkbox-row ${this.includeExport122 ? 'checked' : ''}" @click=${() => this.includeExport122 = !this.includeExport122}>
              <input
                type="checkbox"
                .checked=${this.includeExport122}
                @change=${(e) => this.includeExport122 = e.target.checked}
                @click=${(e) => e.stopPropagation()}
              />
              <label>Incluir hoja 122 (Exportación)</label>
            </div>
            <div class="checkbox-row ${this.incluirNoVigentes ? 'checked' : ''}" @click=${() => this.incluirNoVigentes = !this.incluirNoVigentes}>
              <input
                type="checkbox"
                .checked=${this.incluirNoVigentes}
                @change=${(e) => this.incluirNoVigentes = e.target.checked}
                @click=${(e) => e.stopPropagation()}
              />
              <label>Incluir descontinuados / no vigentes</label>
            </div>
          ` : html`
            <p class="quick-note">Descarga rápida: catálogo vigente, categoría seleccionada y Disponible VES.</p>
          `}
        </div>

        <button
          type="submit"
          class="submit-btn"
          ?disabled=${this.isGenerating || !this.stockData}
        >
          ${this.isGenerating ? html`
            <span class="spinner"></span>
            Generando...
          ` : html`
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Descargar reporte
          `}
        </button>
        ${this.errorMsg ? html`
          <div class="error-message" role="alert">${this.errorMsg}</div>
        ` : ''}
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
              <span>${this._filename || 'StockPulse.xlsx'}</span>
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
