// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import '../src/components/app-root.js';
import '../src/components/login-view.js';
import '../src/components/install-banner.js';
import '../src/components/stock-header.js';
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
    { almacen: 'VES', nombre: 'CENTRO LOGISTICO VES', disponible: 4800, stock: 4800, predespacho: 0, esInspeccion: false },
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

    const chip = el.shadowRoot.querySelector('.almacen-chip');
    expect(chip.getAttribute('title')).toContain('CENTRO LOGISTICO VES');
  });

  it('pulso-form renderiza rápido por defecto y avanzadas al abrir', async () => {
    const el = document.createElement('pulso-form');
    el.stockData = stockData;
    el.autor = { nombre: 'Carlos', email: 'carlos@cipsa.com.pe' };
    document.body.appendChild(el);
    await el.updateComplete;

    const rapido = el.shadowRoot.textContent;
    expect(rapido).toContain('Categoría de Interés');
    expect(rapido).toContain('Opciones avanzadas');
    expect(rapido).toContain('Descarga rápida');
    expect(rapido).not.toContain('Email Corporativo');

    el.advanced = true;
    el.requestUpdate();
    await el.updateComplete;
    expect(el.shadowRoot.textContent).toContain('Perfil de reporte');
  });

  it('sin-catalogo-panel renderiza con datos', async () => {
    const el = document.createElement('sin-catalogo-panel');
    el.stockData = stockData;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot.textContent).toContain('Sin Catálogo');
    expect(el.shadowRoot.querySelector('.export-btn')).toBeTruthy();
  });

  it('app-root sin sesión muestra el login', async () => {
    const el = document.createElement('app-root');
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot.querySelector('login-view')).toBeTruthy();
  });

  it('pulso-form aplica el prefill desde el árbol', async () => {
    localStorage.clear();
    const el = document.createElement('pulso-form');
    el.stockData = stockData;
    el.categoriaInicial = 'VINIFAN';
    el.lineaInicial = 'JUGUETES';
    el.advancedInicial = true;
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.categoria).toBe('VINIFAN');
    expect(el.linea).toBe('JUGUETES');
    expect(el.advanced).toBe(true);
  });

  it('stock-header: el chip abre menú (tema + logout) sin desloguear directo', async () => {
    const el = document.createElement('stock-header');
    el.usuario = 'Carlos Cusi';
    el.email = 'carlos@cipsa.com.pe';
    el.theme = 'dark';
    document.body.appendChild(el);
    await el.updateComplete;

    const eventos = { logout: 0, theme: 0 };
    el.addEventListener('logout', () => eventos.logout++);
    el.addEventListener('toggle-theme', () => eventos.theme++);

    el.shadowRoot.querySelector('.user-btn').click();
    await el.updateComplete;
    expect(el.shadowRoot.querySelector('.user-menu')).toBeTruthy();
    expect(el.shadowRoot.textContent).toContain('carlos@cipsa.com.pe');
    expect(eventos.logout).toBe(0); // abrir no cierra sesión

    el.shadowRoot.querySelector('.menu-item.danger').click();
    expect(eventos.logout).toBe(1);

    el.menuOpen = true;
    await el.updateComplete;
    el.shadowRoot.querySelector('.menu-item:not(.danger)').click();
    expect(eventos.theme).toBe(1);
  });

  it('install-banner: aparece, se descarta y respeta el cooldown', async () => {
    window.__g360Installable = false;
    const el = document.createElement('install-banner');
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot.querySelector('.banner')).toBeNull();

    window.dispatchEvent(new CustomEvent('pwa-installable', { detail: true }));
    await el.updateComplete;
    expect(el.shadowRoot.querySelector('.banner')).toBeTruthy();

    el.shadowRoot.querySelector('.dismiss').click();
    await el.updateComplete;
    expect(el.shadowRoot.querySelector('.banner')).toBeNull();
    expect(localStorage.getItem('g360_install_dismissed_v1')).toBeTruthy();

    const el2 = document.createElement('install-banner');
    document.body.appendChild(el2);
    await el2.updateComplete;
    expect(el2.shadowRoot.querySelector('.banner')).toBeNull();
  });
});
