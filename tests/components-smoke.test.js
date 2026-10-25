// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import '../src/components/app-root.js';
import '../src/components/login-view.js';
import '../src/components/stock-search.js';
import '../src/components/pulso-form.js';
import '../src/components/sin-catalogo-panel.js';

const producto = (over = {}) => ({
  sku: '015939',
  nombre: 'VOLEY VINIBALL GOMA FOLK',
  nombre_corto: 'Voley Viniball Folk',
  linea: 'PELOTAS',
  categoria: 'VINIBALL',
  estado_linea: 'IMPORTADO',
  vigente: true,
  descontinuado: false,
  revision: '',
  um: 'UND',
  un_bx: 48,
  stock: 4800,
  bx: 100,
  predespacho: 0,
  peso_kg: 0.3,
  precio: 9.16,
  ean13: '',
  keywords: [],
  orden: 10,
  almacenes_venta: [
    { almacen: 'VES', disponible: 4800, stock: 4800, predespacho: 0, esInspeccion: false },
  ],
  ...over,
});

const stockData = { productos: [producto()], enriquecido: true };

describe('componentes (smoke de render)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  it('login-view valida el dominio y emite login', async () => {
    const el = document.createElement('login-view');
    document.body.appendChild(el);
    await el.updateComplete;

    el.nombre = 'Carlos Cusi';
    el.email = 'carlos@gmail.com';
    el._onSubmit(new Event('submit'));
    await el.updateComplete;
    expect(el.shadowRoot.textContent).toContain('@cipsa.com.pe');

    let detalle = null;
    el.addEventListener('login', (e) => { detalle = e.detail; });
    el.email = 'carlos@cipsa.com.pe';
    el._onSubmit(new Event('submit'));
    expect(detalle).toEqual({ nombre: 'Carlos Cusi', email: 'carlos@cipsa.com.pe' });
  });

  it('stock-search construye el índice y muestra resultados', async () => {
    const el = document.createElement('stock-search');
    el.stockData = stockData;
    document.body.appendChild(el);
    await el.updateComplete;

    el.searchTerm = 'voley';
    el._search();
    await el.updateComplete;
    expect(el.shadowRoot.querySelectorAll('.result-item').length).toBe(1);
  });

  it('pulso-form renderiza sin campos de identidad', async () => {
    const el = document.createElement('pulso-form');
    el.stockData = stockData;
    el.autor = { nombre: 'Carlos', email: 'carlos@cipsa.com.pe' };
    document.body.appendChild(el);
    await el.updateComplete;
    const texto = el.shadowRoot.textContent;
    expect(texto).toContain('Categoría de Interés');
    expect(texto).not.toContain('Email Corporativo');
  });

  it('sin-catalogo-panel renderiza con datos', async () => {
    const el = document.createElement('sin-catalogo-panel');
    el.stockData = stockData;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot.textContent).toContain('Sin Catálogo');
  });

  it('app-root sin sesión muestra el login', async () => {
    const el = document.createElement('app-root');
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot.querySelector('login-view')).toBeTruthy();
  });
});
