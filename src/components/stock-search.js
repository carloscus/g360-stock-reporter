/**
 * @file stock-search.js
 * @description Componente de búsqueda de productos con Fuse.js.
 *              Recibe datos via prop .stockData del store centralizado.
 * @author @carloscus
 * @version 3.16.0
 */

import { LitElement, html, css } from 'lit';
import { live } from 'lit/directives/live.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import Fuse from 'fuse.js';
import { calculateBx, etiquetaStock, esPorUnidades, esCatalogo, esSinCatalogo, disponibleVES, stockEnAlmacen, revisionBadge, UMBRAL_BAJO_STOCK } from '../core/stock-service.js';
import { construirMensajeStock } from '../core/share.js';
import { ALMACEN_PRINCIPAL, ALMACEN_SECUNDARIO, INSPECCION_ALMACEN_ALT, ALMACEN_TRASLADO, ALMACEN_EXPORTACION } from '../core/stock-store.js';
import { renderAlmacenChips, almacenChipsStyles } from '../ui/almacen-chips.js';
import './almacen-legend.js';

export class StockSearch extends LitElement {
  static properties = {
    searchTerm: { type: String },
    results: { type: Array },
    isLoading: { type: Boolean },
    stockData: { type: Object },
    selectedIndex: { type: Number },
    isListening: { type: Boolean },
    onlyInStock: { type: Boolean },
    selectMode: { type: Boolean },
    autor: { type: String },
    advancedOpen: { type: Boolean },
    facetas: { type: Object },
    _selected: { type: Object },
    _shareMsg: { type: String },
    voiceError: { type: String },
  };

  static styles = [
    almacenChipsStyles,
    css`
    :host {
      display: block;
    }

    .search-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-bottom: 1px solid var(--g360-border);
      transition: border-color var(--g360-transition);
    }

    .search-icon {
      color: var(--g360-accent);
      flex-shrink: 0;
    }

    .search-input {
      flex: 1;
      min-width: 0;
      background: transparent;
      border: none;
      color: var(--g360-text);
      font-size: var(--g360-size-md);
      font-family: inherit;
      outline: none;
    }

    .search-input::placeholder {
      color: var(--g360-muted);
    }

    .search-close {
      background: none;
      border: none;
      color: var(--g360-muted);
      cursor: pointer;
      padding: 8px;
      border-radius: 8px;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .search-close:hover {
      background: var(--g360-bg);
      color: var(--g360-text);
    }

    .search-input:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .voice-btn {
      background: none;
      border: none;
      color: var(--g360-muted);
      cursor: pointer;
      padding: 10px;
      min-width: 44px;
      min-height: 44px;
      box-sizing: border-box;
      border-radius: 50%;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .voice-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      animation: none;
    }

    .voice-btn.active {
      color: var(--g360-danger);
      background: var(--g360-danger-bg);
      animation: pulse 1.5s infinite;
    }

    .voice-status {
      padding: 0 16px 8px;
      font-size: 11px;
      font-weight: 700;
      color: var(--g360-accent);
    }

    .voice-error {
      padding: 0 16px 8px;
      font-size: 11px;
      font-weight: 600;
      color: var(--g360-danger);
    }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
      70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
      100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }

    .search-results {
      max-height: 65vh;
      max-height: 60dvh;
      overflow-y: auto;
      padding: 8px;
      overscroll-behavior: contain;
    }

    .result-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 14px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-bottom: 8px;
      background: var(--g360-bg);
      border: 1px solid transparent;
      transition: background-color var(--g360-transition), border-color var(--g360-transition);
    }

    .result-item:hover,
    .result-item.active {
      background: var(--lote-ves-bg);
      border-color: var(--g360-accent);
    }

    .result-item.selected {
      background: var(--lote-ves-bg);
      border-color: var(--g360-accent);
    }

    .pick {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 1.5px solid var(--g360-border);
      color: var(--g360-on-accent);
      font-size: 11px;
      font-weight: 800;
      margin-right: 6px;
      vertical-align: middle;
    }

    .pick.on {
      background: var(--g360-accent);
      border-color: var(--g360-accent);
    }

    .share-bar {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
      border-top: 1px solid var(--g360-border);
      background: var(--g360-glass);
    }

    .share-count {
      flex: 1;
      font-size: 12px;
      font-weight: 700;
      color: var(--g360-text);
    }

    .share-msg {
      font-size: 11px;
      color: var(--g360-accent);
      font-weight: 600;
      margin-left: 4px;
    }

    .share-btn {
      padding: 8px 16px;
      border-radius: 999px;
      border: none;
      background: var(--g360-accent);
      color: var(--g360-on-accent);
      font-weight: 800;
      font-size: 12px;
      cursor: pointer;
      font-family: inherit;
    }

    .share-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .share-clear {
      padding: 8px 12px;
      border-radius: 999px;
      border: 1px solid var(--g360-border);
      background: transparent;
      color: var(--g360-muted);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
    }

    .result-left {
      flex: 1;
      min-width: 0;
    }

    .sku {
      display: inline-block;
      font-size: var(--g360-size-xs);
      font-weight: var(--g360-weight-bold);
      color: var(--g360-on-accent);
      background: var(--g360-accent);
      padding: 4px 8px;
      border-radius: 6px;
      margin-bottom: 6px;
    }

    .nombre {
      display: block;
      font-size: var(--g360-size-base);
      font-weight: var(--g360-weight-semibold);
      color: var(--g360-text);
      margin-bottom: 4px;
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    .linea {
      display: block;
      font-size: var(--g360-size-xs);
      color: var(--g360-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .detalle {
      display: block;
      font-size: 10px;
      color: var(--g360-muted);
      margin-top: 2px;
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    .result-right {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-shrink: 0;
      width: 100%;
    }

    .categoria {
      display: block;
      font-size: var(--g360-size-xs);
      color: var(--g360-muted);
      text-transform: uppercase;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    .stock-info {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
      flex-shrink: 0;
      margin-left: 12px;
    }

    .stock-value {
      font-size: 14px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 6px;
    }

    .stock-value.alto {
      background: var(--g360-success-bg);
      color: var(--g360-success);
    }

    .stock-value.bajo {
      background: var(--g360-warning-bg);
      color: var(--g360-warning);
    }

    .stock-value.cero {
      background: var(--g360-danger-bg);
      color: var(--g360-danger);
    }

    .stock-label {
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--g360-muted);
    }

    .ean {
      font-size: 9px;
      color: var(--g360-muted);
      font-family: monospace;
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: break-word;
      text-align: right;
    }

    .almacenes-row {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 6px;
    }

    .sin-cat-badge {
      display: inline-flex;
      align-items: center;
      margin-top: 6px;
      padding: 2px 8px;
      border-radius: 4px;
      background: var(--g360-warning-bg);
      border: 1px solid var(--g360-warning-border);
      font-size: 10px;
      font-weight: 700;
      color: var(--g360-warning);
      white-space: nowrap;
    }

    .descontinuado-badge {
      display: inline-flex;
      align-items: center;
      margin-top: 6px;
      margin-right: 6px;
      padding: 2px 8px;
      border-radius: 4px;
      background: var(--g360-danger-bg);
      border: 1px solid var(--g360-danger-border);
      font-size: 10px;
      font-weight: 700;
      color: var(--g360-danger);
      white-space: nowrap;
    }

    .descontinuado-badge.ultimas {
      background: var(--g360-warning-bg);
      border-color: var(--g360-warning-border);
      color: var(--g360-warning);
    }

    .descontinuado-badge.info {
      background: var(--lote-40-bg);
      border-color: var(--lote-40-border);
      color: var(--lote-40);
    }

    .no-results {
      text-align: center;
      padding: 40px 20px;
      color: var(--g360-muted);
    }

    .no-results svg {
      width: 48px;
      height: 48px;
      margin-bottom: 12px;
      opacity: 0.5;
    }

    .no-results p {
      margin: 0;
      font-size: 14px;
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: var(--g360-muted);
    }

    .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid var(--g360-border);
      border-top-color: var(--g360-accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-right: 12px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    mark {
      background: transparent;
      color: var(--g360-accent);
      font-weight: 700;
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    .sku mark {
      color: var(--g360-on-accent);
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
    }

    .filter-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      padding: 0 16px 12px;
      border-bottom: 1px solid var(--g360-border);
    }

    .filter-row almacen-legend {
      flex: 1 1 100%;
    }

    .advanced-panel {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 8px 12px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--g360-border);
      background: var(--g360-bg);
    }

    .facet {
      font-size: 10px;
      font-weight: 600;
      color: var(--g360-muted);
    }

    .facet summary {
      cursor: pointer;
      padding: 6px 8px;
      min-height: 36px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      border-radius: 8px;
      border: 1px solid var(--g360-border);
      background: var(--g360-surface);
      color: var(--g360-text);
      font-size: 11px;
      list-style: none;
    }

    .facet summary::-webkit-details-marker { display: none; }

    .facet-options {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 140px;
      overflow: auto;
      margin-top: 4px;
      padding: 6px;
      border: 1px solid var(--g360-border);
      border-radius: 8px;
      background: var(--g360-surface);
    }

    .facet-option {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 500;
      color: var(--g360-text);
      cursor: pointer;
    }

    .facet-option input { accent-color: var(--g360-accent); }

    .facet-empty { font-size: 10px; color: var(--g360-muted); }

    .clear-facets {
      align-self: end;
      padding: 7px 10px;
      border-radius: 8px;
      border: 1px dashed var(--g360-border-strong, var(--g360-border));
      background: transparent;
      color: var(--g360-accent);
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
    }

    .filter-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      min-height: 36px;
      box-sizing: border-box;
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
      background: var(--lote-ves-bg);
      border-color: var(--g360-accent);
      color: var(--g360-accent);
    }

    @media (max-width: 600px) {
      .result-right {
        flex-direction: column;
        align-items: flex-start;
      }
      .stock-info {
        align-items: flex-start;
        margin-left: 0;
        width: 100%;
      }
      .ean {
        text-align: left;
      }
    }

    @media (max-width: 480px) {
      .share-count { flex: 1 1 100%; }
      .share-btn, .share-clear { flex: 1; text-align: center; }
    }
  `,
  ];

  constructor() {
    super();
    this.searchTerm = '';
    this.results = [];
    this.isLoading = true;
    this.stockData = null;
    this.selectedIndex = -1;
    this.isListening = false;
    this.onlyInStock = false;
    this.selectMode = false;
    this.autor = '';
    this.advancedOpen = false;
    this.facetas = {
      grupo: [], tipo: [], familia: [], categoria: [], linea: [],
      licencia: [], stock: [], vigencia: [],
    };
    this._selected = new Set();
    this._shareMsg = '';
    this.voiceError = '';
    this._debounceTimer = null;
    this._fuse = null;
    this._recognition = null;
    this._unsubscribe = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._setupSpeechRecognition();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._debounceTimer) clearTimeout(this._debounceTimer);
    if (this._unsubscribe) this._unsubscribe();
    this._stopVoiceSearch();
  }

  willUpdate(changedProperties) {
    if (changedProperties.has('stockData') && this.stockData) {
      this.isLoading = false;
      this._initFuse();
      if (this.searchTerm.length >= 2 || this._facetasActivas()) this._search();
    }
  }

  _setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this._recognition = new SpeechRecognition();
      this._recognition.continuous = false;
      this._recognition.interimResults = true;
      this._recognition.maxAlternatives = 1;
      this._recognition.lang = 'es-PE';

      this._recognition.onstart = () => {
        this.isListening = true;
        this.voiceError = '';
      };

      this._recognition.onerror = (event) => {
        const code = event?.error || '';
        this.isListening = false;
        this.voiceError =
          code === 'not-allowed' || code === 'service-not-allowed'
            ? 'Permiso de micrófono denegado'
            : code === 'no-speech'
              ? 'No se escuchó nada, intenta de nuevo'
              : code === 'network'
                ? 'Sin conexión para el dictado'
                : 'No se pudo usar el micrófono';
        this.requestUpdate();
      };

      this._recognition.onresult = (event) => {
        let transcript = '';
        let esFinal = false;
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) esFinal = true;
        }
        this.searchTerm = this._normalizarVoz(transcript);
        // Debounce: los resultados intermedios no deben disparar una búsqueda
        // por cada sílaba (parpadeo y trabajo de Fuse innecesario).
        if (this._debounceTimer) clearTimeout(this._debounceTimer);
        if (this.searchTerm.length >= 2) {
          this._debounceTimer = setTimeout(() => this._search(), esFinal ? 0 : 200);
        }
      };

      this._recognition.onend = () => { this.isListening = false; };

      this._recognition.onnomatch = () => {
        this.isListening = false;
        this.voiceError = 'No se entendió, intenta de nuevo';
        this.requestUpdate();
      };
    }
  }

  /**
   * Normaliza el transcript de voz para búsqueda:
   *  - Quita tildes y puntuación.
   *  - Convierte números hablados (cero, uno, dos...) a dígitos.
   *  - Descarta ruido ("sku", "codigo", "busca", artículos).
   *  - Si el resultado es un código (solo dígitos, ej. SKU/EAN) lo une sin
   *    espacios: "cero uno uno cero uno nueve" → "011019".
   *  - Si es un nombre, conserva espacios para el matching por términos de Fuse.
   */
  _normalizarVoz(texto) {
    if (!texto) return '';
    const numeros = {
      cero: '0', uno: '1', dos: '2', tres: '3', cuatro: '4', cinco: '5',
      seis: '6', siete: '7', ocho: '8', nueve: '9',
      diez: '10', once: '11', doce: '12', trece: '13', catorce: '14',
      quince: '15', dieciseis: '16', diecisiete: '17', dieciocho: '18', diecinueve: '19',
      veinte: '20', veintiuno: '21', veintidos: '22', veintitres: '23', veinticuatro: '24',
      veinticinco: '25', veintiseis: '26', veintisiete: '27', veintiocho: '28', veintinueve: '29',
      treinta: '30', cuarenta: '40', cincuenta: '50', sesenta: '60',
      setenta: '70', ochenta: '80', noventa: '90', cien: '100', ciento: '100',
    };
    const ruido = new Set([
      'sku', 'codigo', 'producto', 'articulo', 'busca', 'buscar', 'muestrame',
      'por', 'favor', 'de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'y', 'a', 'al', 'en',
    ]);
    const palabras = texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

    const tokens = [];
    for (const p of palabras) {
      if (ruido.has(p)) continue;
      tokens.push(numeros[p] ?? p);
    }

    if (tokens.length > 0 && tokens.every((t) => /^\d+$/.test(t))) {
      return tokens.join('');
    }
    return tokens.join(' ');
  }

  _stopVoiceSearch() {
    if (this._recognition) {
      this._recognition.stop();
      this.isListening = false;
    }
  }

  _norm(texto) {
    return (texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  _skuSinCeros(sku) {
    return this._norm(sku).replace(/^0+/, '');
  }

  /** Coincidencia exacta por SKU (con/sin ceros) o EAN-13/14. */
  _exactos(term) {
    const q = this._norm(term).replace(/[\s-]+/g, '');
    if (!q) return [];
    const out = [];
    for (const p of (this.stockData?.productos || [])) {
      const sku = this._norm(p.sku);
      const ean13 = this._norm(p.ean13);
      const ean14 = this._norm(p.ean14);
      if (sku === q || this._skuSinCeros(p.sku) === q || ean13 === q || ean14 === q) {
        out.push({ item: p, score: 0, matches: [] });
      }
    }
    return out;
  }

  _licencia(p) {
    const familia = this._norm(p.familia);
    if (familia.includes('con licencia')) return 'con';
    if (familia.includes('sin licencia')) return 'sin';
    return '';
  }

  _facetasActivas() {
    return Object.values(this.facetas || {}).some((v) => Array.isArray(v) ? v.length > 0 : v !== '');
  }

  _pasaFacetas(p) {
    const f = this.facetas || {};
    const en = (campo, valor) => !(f[campo] || []).length || (f[campo] || []).includes(valor);

    if (!en('grupo', p.grupo || '')) return false;
    if (!en('tipo', p.tipo || '')) return false;
    if (!en('familia', p.familia || '')) return false;
    if (!en('categoria', p.categoria || '')) return false;
    if (!en('linea', p.linea || '')) return false;
    if (!en('licencia', this._licencia(p))) return false;

    const stock = f.stock || [];
    if (stock.length) {
      const okVes = stock.includes('ves') && (p.stock || 0) > 0;
      const okAny = stock.includes('any') && (p.almacenes_venta || []).some((a) => (a.disponible || 0) > 0);
      if (!okVes && !okAny) return false;
    }

    const vigencia = f.vigencia || [];
    if (vigencia.includes('vigente') && (p.descontinuado || p.vigente === false)) return false;

    return true;
  }

  _opciones(campo) {
    const valores = new Set();
    for (const p of (this.stockData?.productos || [])) {
      if (campo === 'licencia') {
        const lic = this._licencia(p);
        if (lic) valores.add(lic);
      } else if (p[campo]) {
        valores.add(p[campo]);
      }
    }
    return [...valores].sort((a, b) => a.localeCompare(b));
  }

  _renderFaceta(label, campo) {
    const opciones = this._opciones(campo);
    const seleccion = this.facetas[campo] || [];

    return html`
      <details class="facet">
        <summary>${label}${seleccion.length ? ` (${seleccion.length})` : ''}</summary>
        <div class="facet-options">
          ${opciones.length === 0 ? html`<span class="facet-empty">Sin valores</span>` : ''}
          ${opciones.map((v) => html`
            <label class="facet-option">
              <input
                type="checkbox"
                .checked=${seleccion.includes(v)}
                @change=${() => this._toggleFaceta(campo, v)}
              />
              <span>${v}</span>
            </label>
          `)}
        </div>
      </details>
    `;
  }

  _renderFacetaFija(label, campo, opciones) {
    const seleccion = this.facetas[campo] || [];
    return html`
      <details class="facet">
        <summary>${label}${seleccion.length ? ` (${seleccion.length})` : ''}</summary>
        <div class="facet-options">
          ${opciones.map(({ valor, texto }) => html`
            <label class="facet-option">
              <input
                type="checkbox"
                .checked=${seleccion.includes(valor)}
                @change=${() => this._toggleFaceta(campo, valor)}
              />
              <span>${texto}</span>
            </label>
          `)}
        </div>
      </details>
    `;
  }

  _toggleAdvanced() {
    this.advancedOpen = !this.advancedOpen;
  }

  _toggleFaceta(campo, valor) {
    const actuales = this.facetas[campo] || [];
    const siguientes = actuales.includes(valor)
      ? actuales.filter((v) => v !== valor)
      : [...actuales, valor];
    this.facetas = { ...this.facetas, [campo]: siguientes };
    this._search();
  }

  _limpiarFacetas() {
    this.facetas = {
      grupo: [], tipo: [], familia: [], categoria: [], linea: [],
      licencia: [], stock: [], vigencia: [],
    };
    this._search();
  }

  _initFuse() {
    if (!Fuse || !this.stockData?.productos) return;
    const options = {
      keys: [
        { name: 'sku', weight: 2 },
        { name: 'nombre_corto', weight: 1.5 },
        { name: 'nombre', weight: 1 },
        { name: 'keywords', weight: 0.6 },
        { name: 'ean13', weight: 1 },
        { name: 'ean14', weight: 0.8 },
        { name: 'linea', weight: 0.5 },
        { name: 'categoria', weight: 0.5 },
        { name: 'tipo', weight: 0.9 },
        { name: 'familia', weight: 0.7 },
        { name: 'grupo', weight: 0.4 },
        { name: 'um', weight: 0.2 },
      ],
      threshold: 0.3,
      includeScore: true,
      includeMatches: true,
      ignoreLocation: true,
      minMatchCharLength: 2,
      // Tildes transparentes: "logica" y "lógica" matchean igual (Fuse 7.x).
      ignoreDiacritics: true,
    };
    this._fuse = new Fuse(this.stockData.productos, options);
    if (this.searchTerm.length >= 2 || this._facetasActivas()) this._search();
  }

  _handleInput(e) {
    this.searchTerm = e.target.value;
    this.selectedIndex = -1;
    if (this._debounceTimer) clearTimeout(this._debounceTimer);
    if (this.searchTerm.length >= 2 || this._facetasActivas()) {
      this._debounceTimer = setTimeout(() => this._search(), 180);
    } else {
      this.results = [];
    }
  }

  _toggleVoiceSearch() {
    if (!this._recognition) return;
    this.voiceError = '';
    if (this.isListening) {
      this._stopVoiceSearch();
      return;
    }
    try {
      this._recognition.start();
      this.isListening = true;
    } catch {
      // start() lanza si ya está activo o si el permiso fue denegado.
      this.isListening = false;
      this.voiceError = 'No se pudo iniciar el micrófono';
    }
  }

  _toggleInStock() {
    this.onlyInStock = !this.onlyInStock;
    if (this.searchTerm.length >= 2 || this._facetasActivas()) this._search();
  }

  /** Alterna el modo multiselección para compartir SKUs por WhatsApp/texto. */
  _toggleSelectMode() {
    this.selectMode = !this.selectMode;
    this._shareMsg = '';
    if (!this.selectMode) this._selected = new Set();
    this.requestUpdate();
  }

  _toggleSelect(p) {
    const next = new Set(this._selected);
    if (next.has(p.sku)) next.delete(p.sku);
    else next.add(p.sku);
    this._selected = next;
    this._shareMsg = '';
  }

  _productosSeleccionados() {
    const porSku = new Map((this.stockData?.productos || []).map((p) => [p.sku, p]));
    return [...this._selected].map((sku) => porSku.get(sku)).filter(Boolean);
  }

  async _compartir() {
    const productos = this._productosSeleccionados();
    if (!productos.length) return;
    const texto = construirMensajeStock(productos, this.autor || '');
    this._shareMsg = '';

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Consulta de stock', text: texto });
        this._shareMsg = 'Compartido';
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return;
      }
    }

    // Fallback: WhatsApp directo; si el navegador bloquea la ventana, copiar.
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    const win = window.open(url, '_blank', 'noopener');
    if (win) {
      this._shareMsg = 'Abriendo WhatsApp…';
      return;
    }
    try {
      await navigator.clipboard.writeText(texto);
      this._shareMsg = 'Copiado al portapapeles';
    } catch {
      this._shareMsg = 'No se pudo compartir';
    }
  }

  _clearSearch() {
    this.searchTerm = '';
    this.results = [];
    this.renderRoot.querySelector('.search-input')?.focus();
  }

  _applyFuseHighlight(text, matches, key) {
    if (!matches) return text;
    const match = matches.find(m => m.key === key);
    if (!match) return text;
    let result = '';
    let lastIndex = 0;
    match.indices.forEach(([start, end]) => {
      result += text.substring(lastIndex, start);
      result += `<mark>${text.substring(start, end + 1)}</mark>`;
      lastIndex = end + 1;
    });
    result += text.substring(lastIndex);
    return result;
  }

  /**
   * Búsqueda multi-término con semántica AND: cada palabra (≥2 letras) debe
   * matchear en el SKU ("voley folk" encuentra "VOLEY VINIBALL GOMA FOLK").
   * Intersecta resultados por SKU, promedia scores y fusiona los matches por
   * key para que el resaltado siga funcionando. Un solo token usa la
   * búsqueda Fuse directa (comportamiento original).
   */
  _multiTermSearch(term) {
    const tokens = term.replace(/[\s-]+/g, ' ').trim().split(' ').filter((t) => t.length >= 2);
    if (tokens.length <= 1) {
      return this._fuse.search(term);
    }
    const perSku = new Map();
    for (const tok of tokens) {
      for (const res of this._fuse.search(tok)) {
        const sku = res.item.sku;
        if (!perSku.has(sku)) {
          perSku.set(sku, { item: res.item, score: 0, hits: 0, matches: new Map() });
        }
        const acc = perSku.get(sku);
        acc.score += res.score;
        acc.hits += 1;
        for (const m of (res.matches || [])) {
          if (!acc.matches.has(m.key)) acc.matches.set(m.key, []);
          acc.matches.get(m.key).push(...(m.indices || []));
        }
      }
    }
    return [...perSku.values()]
      .filter((a) => a.hits === tokens.length)
      .map((a) => ({
        item: a.item,
        score: a.score / tokens.length,
        matches: [...a.matches.entries()].map(([key, indices]) => ({ key, indices })),
      }))
      .sort((a, b) => a.score - b.score);
  }

  _search() {
    const term = this.searchTerm.trim();
    const facetas = this._facetasActivas();
    if ((!term && !facetas) || !this._fuse) {
      this.results = [];
      return;
    }

    let fuseResults;
    if (term) {
      const exactos = this._exactos(term);
      if (exactos.length) {
        fuseResults = exactos;
      } else {
        fuseResults = this._multiTermSearch(term);
        if (fuseResults.length === 0) {
          // Red de seguridad: frase completa (typos fuertes en algún token)
          fuseResults = this._fuse.search(term);
        }
      }
    } else {
      // Sin texto pero con facetas: partir del universo completo.
      fuseResults = (this.stockData?.productos || []).map((p) => ({ item: p, score: 0, matches: [] }));
    }

    if (facetas) {
      fuseResults = fuseResults.filter((res) => this._pasaFacetas(res.item));
    }
    if (this.onlyInStock) {
      fuseResults = fuseResults.filter(res => (res.item.stock || 0) > 0);
    }
    // Catálogo primero (SKUs con estado de línea), después fuera de catálogo
    fuseResults.sort((a, b) => {
      const aCat = esCatalogo(a.item);
      const bCat = esCatalogo(b.item);
      if (aCat !== bCat) return aCat ? -1 : 1;
      return a.score - b.score;
    });
    this.results = fuseResults.map(res => ({
      p: res.item,
      score: res.score,
      matches: res.matches,
    })).slice(0, 50);
  }

  _handleKeyDown(e) {
    if (e.key === 'Escape') {
      this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
      return;
    }
    if (!this.results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.selectedIndex = Math.min(this.selectedIndex + 1, this.results.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.isListening && this._recognition) this._recognition.stop();
      const target = this.selectedIndex >= 0 ? this.selectedIndex : 0;
      if (this.results[target]) {
        if (this.selectMode) this._toggleSelect(this.results[target].p);
        else this._select(this.results[target].p);
      }
    }
  }

  _select(producto) {
    this._stopVoiceSearch();
    this.dispatchEvent(new CustomEvent('product-select', {
      detail: producto,
      bubbles: true,
      composed: true,
    }));
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
  }

  render() {
    return html`
      <div class="search-header">
        <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="search"
          class="search-input"
          placeholder="Buscar por SKU, EAN, nombre, tipo o familia..."
          .value=${live(this.searchTerm)}
          @input=${this._handleInput}
          @keydown=${this._handleKeyDown}
          autofocus
          spellcheck="false"
          autocapitalize="off"
          enterkeyhint="search"
          aria-label="Buscar producto"
          ?disabled=${this.isLoading}
        />
        ${this.searchTerm ? html`
          <button class="search-close" @click=${this._clearSearch} title="Limpiar búsqueda">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        ` : ''}
        <button
          class="voice-btn ${this.isListening ? 'active' : ''}"
          @click=${this._toggleVoiceSearch}
          ?disabled=${!this._recognition || this.isLoading}
          title=${this._recognition ? 'Buscar por voz' : 'Dictado no disponible en este navegador'}
          aria-label=${this._recognition ? 'Buscar por voz' : 'Dictado no disponible en este navegador'}
          aria-pressed=${this.isListening ? 'true' : 'false'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
          </svg>
        </button>
        <button
          class="search-close"
          @click=${() => this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }))}
          title="Cerrar búsqueda"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="filter-row">
        <div
          class="filter-chip ${this.onlyInStock ? 'active' : ''}"
          @click=${this._toggleInStock}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            ${this.onlyInStock
              ? html`<polyline points="20 6 9 17 4 12"/>`
              : html`<circle cx="12" cy="12" r="10"/>`
            }
          </svg>
          Solo con stock
        </div>
        <div class="filter-chip ${this.selectMode ? 'active' : ''}" @click=${this._toggleSelectMode}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            ${this.selectMode
              ? html`<polyline points="20 6 9 17 4 12"/>`
              : html`<rect x="4" y="4" width="16" height="16" rx="3"/>`
            }
          </svg>
          ${this.selectMode ? 'Seleccionando' : 'Seleccionar'}
        </div>
        <div class="filter-chip ${this.advancedOpen ? 'active' : ''}" @click=${this._toggleAdvanced}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            ${this.advancedOpen
              ? html`<polyline points="20 6 9 17 4 12"/>`
              : html`<path d="M4 6h16M7 12h10M10 18h4"/>`
            }
          </svg>
          Búsqueda avanzada
        </div>
        <almacen-legend></almacen-legend>
      </div>

      ${this.advancedOpen ? html`
        <div class="advanced-panel">
          ${this._renderFaceta('Grupo', 'grupo')}
          ${this._renderFaceta('Tipo', 'tipo')}
          ${this._renderFaceta('Familia', 'familia')}
          ${this._renderFaceta('Categoría', 'categoria')}
          ${this._renderFaceta('Línea', 'linea')}
          ${this._renderFacetaFija('Licencia', 'licencia', [
            { valor: 'con', texto: 'Con licencia' },
            { valor: 'sin', texto: 'Sin licencia' },
          ])}
          ${this._renderFacetaFija('Stock', 'stock', [
            { valor: 'ves', texto: 'Con stock VES' },
            { valor: 'any', texto: 'Con stock en cualquier almacén' },
          ])}
          ${this._renderFacetaFija('Vigencia', 'vigencia', [
            { valor: 'vigente', texto: 'Solo vigentes' },
          ])}
          <button class="clear-facets" @click=${this._limpiarFacetas}>Limpiar filtros</button>
        </div>
      ` : ''}

      ${this.isListening ? html`
        <div class="voice-status" role="status" aria-live="polite">🎙 Escuchando… habla ahora</div>
      ` : ''}
      ${this.voiceError ? html`<div class="voice-error" role="status" aria-live="polite">${this.voiceError}</div>` : ''}

      <div class="search-results">
        ${this.isLoading ? html`
          ${Array(5).fill(0).map(() => html`
            <div class="skeleton-item">
              <div class="result-left">
                <div class="skeleton-box skeleton-sku"></div>
                <div class="skeleton-box skeleton-nombre"></div>
                <div class="skeleton-box skeleton-linea"></div>
              </div>
              <div class="result-right">
                <div class="skeleton-box skeleton-stock"></div>
              </div>
            </div>
          `)}
        ` : this.results.length > 0 ? this.results.map(({ p, matches }, idx) => {
          const sinCatalogo = esSinCatalogo(p);

          const nombre = this._applyFuseHighlight(p.nombre || '', matches, 'nombre');
          const sku = this._applyFuseHighlight(p.sku || '', matches, 'sku');
          const linea = this._applyFuseHighlight(p.linea || '', matches, 'linea');
          const categoria = this._applyFuseHighlight(p.categoria || '', matches, 'categoria');

          const almacenesVenta = p.almacenes_venta || [];
          const vesStock = disponibleVES(p);
          const inspeccionStock = almacenesVenta.find((a) => a.esInspeccion)?.disponible || 0;
          const secundarioStock = stockEnAlmacen(p, ALMACEN_SECUNDARIO);
          const trasladoStock = stockEnAlmacen(p, ALMACEN_TRASLADO);
          const predespacho = p.predespacho || 0;

          const bxVes = calculateBx(vesStock, p.un_bx);
          const stockClass = esPorUnidades(p)
            ? (vesStock === 0 ? 'cero' : vesStock < UMBRAL_BAJO_STOCK ? 'bajo' : 'alto')
            : bxVes === 0 ? 'cero' : bxVes < UMBRAL_BAJO_STOCK ? 'bajo' : 'alto';

          const bxQC = calculateBx(inspeccionStock, p.un_bx);
          const mostrarQC = bxQC >= UMBRAL_BAJO_STOCK;
          const qcLabel = esPorUnidades(p) ? `${inspeccionStock} u` : `${bxQC} bx`;
          const mostrarFallback129 = vesStock === 0 && secundarioStock > 0;
          const bxTraslado = calculateBx(trasladoStock, p.un_bx);
          const mostrarTraslado40 = vesStock === 0 && secundarioStock === 0 && bxTraslado >= UMBRAL_BAJO_STOCK;
          const trasladoLabel = esPorUnidades(p) ? `${trasladoStock} u` : `${bxTraslado} bx`;
          const revBadge = (() => {
            const b = revisionBadge(p);
            // El buscador ya muestra "Predespacho: N"; no duplicar con "Compromiso".
            return b && b.rev !== 'compromiso' ? b : null;
          })();

          const almacenesChips = renderAlmacenChips(almacenesVenta);

          return html`
            <div
              class="result-item ${idx === this.selectedIndex ? 'active' : ''} ${this._selected.has(p.sku) ? 'selected' : ''}"
              @click=${() => this.selectMode ? this._toggleSelect(p) : this._select(p)}
              @mouseenter=${() => this.selectedIndex = idx}
              role="option"
              aria-selected=${idx === this.selectedIndex}
            >
              <div class="result-left">
                ${this.selectMode ? html`<span class="pick ${this._selected.has(p.sku) ? 'on' : ''}" aria-hidden="true">${this._selected.has(p.sku) ? '✓' : ''}</span>` : ''}
                <span class="sku">${unsafeHTML(sku)}</span>
                <span class="nombre">${unsafeHTML(nombre)}</span>
                <span class="linea">${unsafeHTML(linea)}</span>
                ${(p.grupo || p.tipo || p.familia) ? html`
                  <span class="detalle">${[p.grupo, p.tipo, p.familia].filter(Boolean).join(' · ')}</span>
                ` : ''}
                 <div class="almacenes-row">
                   ${mostrarFallback129 ? html`<span class="almacen-chip fallback">Atendible del 129: ${secundarioStock}</span>` : ''}
                   ${mostrarTraslado40 ? html`<span class="almacen-chip traslado">Trasladable del 40: ${trasladoLabel}</span>` : ''}
                   ${mostrarQC ? html`<span class="almacen-chip qc">En QC: ${qcLabel} por pasar a VES</span>` : ''}
                   ${predespacho > 0 ? html`<span class="almacen-chip predespacho">Predespacho: ${predespacho}</span>` : ''}
                   ${almacenesChips.length > 0
                     ? almacenesChips
                     : html`<span class="almacen-chip sin-venta">Sin almacenes de venta</span>`}
                 </div>
                ${revBadge ? html`<span class="descontinuado-badge ${revBadge.rev === 'descontinuado' ? (vesStock > 0 ? 'ultimas' : '') : 'info'}">${revBadge.rev === 'descontinuado' && vesStock > 0 ? 'Últimas unidades' : revBadge.label}</span>` : ''}
                ${sinCatalogo ? html`<span class="sin-cat-badge">Sin catálogo</span>` : ''}
              </div>
              <div class="result-right">
                <span class="categoria">${unsafeHTML(categoria)}</span>
                <div class="stock-info">
                  <span class="stock-label">Disponible VES</span>
                  <span class="stock-value ${stockClass}">${vesStock}</span>
                  <span class="ean">${esPorUnidades(p) ? 'Venta por unidades' : etiquetaStock(p, vesStock)}</span>
                </div>
              </div>
            </div>
          `;
        }) : html`
          <div class="no-results">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
              <path d="M8 8l6 6M14 8l-6 6"/>
            </svg>
            <p>${this.searchTerm.length >= 2 ? 'No se encontraron productos' : 'Escribe para buscar productos...'}</p>
          </div>
        `}
      </div>

      ${this.selectMode ? html`
        <div class="share-bar">
          <span class="share-count">
            ${this._selected.size} seleccionado${this._selected.size === 1 ? '' : 's'}
            ${this._shareMsg ? html`<span class="share-msg">· ${this._shareMsg}</span>` : ''}
          </span>
          ${this._selected.size > 0 ? html`
            <button
              class="share-clear"
              @click=${() => { this._selected = new Set(); this._shareMsg = ''; this.requestUpdate(); }}
            >Limpiar</button>
          ` : ''}
          <button
            class="share-btn"
            ?disabled=${this._selected.size === 0}
            @click=${this._compartir}
          >Compartir</button>
          <button class="share-clear" @click=${this._toggleSelectMode}>Cancelar</button>
        </div>
      ` : ''}
    `;
  }
}

customElements.define('stock-search', StockSearch);
