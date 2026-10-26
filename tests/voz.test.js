// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../src/components/stock-search.js';

class FakeRecognition {
  constructor() {
    this.throwOnStart = false;
    this.lang = '';
    this.continuous = false;
    this.interimResults = false;
  }
  start() {
    if (this.throwOnStart) throw new Error('microphone busy');
    this.onstart?.();
  }
  stop() {
    this.onend?.();
  }
}

const productos = [{
  sku: '015939',
  nombre: 'VOLEY VINIBALL GOMA FOLK',
  nombre_corto: 'Voley Viniball Folk',
  stock: 4800,
  bx: 100,
  un_bx: 48,
  estado_linea: 'IMPORTADO',
  categoria: 'VINIBALL',
  linea: 'PELOTAS',
  orden: 1,
  keywords: ['VOLEY', 'FOLK'],
  ean13: '',
  almacenes_venta: [{ almacen: 'VES', disponible: 4800, esInspeccion: false }],
}];

async function montar() {
  document.body.innerHTML = '';
  const el = document.createElement('stock-search');
  el.stockData = { productos };
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

describe('búsqueda por voz', () => {
  beforeEach(() => {
    window.SpeechRecognition = FakeRecognition;
  });

  afterEach(() => {
    delete window.SpeechRecognition;
  });

  it('normaliza números hablados y tildes', async () => {
    const el = await montar();
    expect(el._normalizarVoz('cero uno cinco nueve tres nueve')).toBe('015939');
    expect(el._normalizarVoz('vóley folk')).toBe('voley folk');
  });

  it('permiso denegado: muestra error y deja de escuchar', async () => {
    const el = await montar();
    el.isListening = true;
    el._recognition.onerror({ error: 'not-allowed' });
    await el.updateComplete;
    expect(el.isListening).toBe(false);
    expect(el.voiceError).toContain('Permiso');
    expect(el.shadowRoot.textContent).toContain('Permiso de micrófono denegado');
  });

  it('start() que falla no deja el botón en estado de escucha', async () => {
    const el = await montar();
    el._recognition.throwOnStart = true;
    el._toggleVoiceSearch();
    await el.updateComplete;
    expect(el.isListening).toBe(false);
    expect(el.voiceError).toContain('No se pudo iniciar');
  });

  it('transcribe, normaliza y busca al resultado final', async () => {
    const el = await montar();
    const evento = { results: [[{ transcript: 'vóley folk' }]] };
    evento.results[0].isFinal = true;

    el._recognition.onresult(evento);
    await new Promise((resolve) => setTimeout(resolve, 20));
    await el.updateComplete;

    expect(el.searchTerm).toBe('voley folk');
    expect(el.results).toHaveLength(1);
    expect(el.results[0].p.sku).toBe('015939');
  });

  it('los resultados intermedios no disparan búsqueda inmediata', async () => {
    const el = await montar();
    const evento = { results: [[{ transcript: 'vo' }]] };
    evento.results[0].isFinal = false;

    el._recognition.onresult(evento);
    expect(el.results).toHaveLength(0); // aún dentro del debounce
    await new Promise((resolve) => setTimeout(resolve, 260));
    expect(el.searchTerm).toBe('vo');
  });

  it('muestra el botón de voz deshabilitado si el navegador no lo soporta', async () => {
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;

    const el = await montar();
    const btn = el.shadowRoot.querySelector('.voice-btn');
    expect(btn).toBeTruthy();
    expect(btn.disabled).toBe(true);
    expect(btn.title).toContain('no disponible');
  });
});
