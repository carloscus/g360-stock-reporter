// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import '../src/components/estado-panel.js';

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
  peso_kg: 0.3,
  almacenes_venta: [
    { almacen: 'VES', disponible: 4800, stock: 4800, predespacho: 0, esInspeccion: false },
  ],
  ...over,
});

const stockData = {
  productos: [
    producto(),
    producto({ sku: '011019', nombre: 'BALON BASKET', bx: 5, stock: 240, un_bx: 48 }),
    producto({ sku: '031177', nombre: 'ROMPECABEZAS', bx: 0, stock: 0, categoria: 'VINIFAN' }),
    // Fuera del universo accionable: no deben aparecer en Estado ni Alertas
    producto({ sku: '999001', nombre: 'ITEM DESCONTINUADO', bx: 3, stock: 144, descontinuado: true }),
    producto({ sku: '999002', nombre: 'ITEM SIN CATALOGO', estado_linea: '', bx: 2, stock: 96 }),
  ],
};

async function montar(mode) {
  const el = document.createElement('estado-panel');
  el.stockData = stockData;
  el.mode = mode;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

describe('estado-panel (render real)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renderiza el dashboard y el menú Exportar', async () => {
    const el = await montar('dashboard');
    const texto = el.shadowRoot.textContent;
    expect(texto).toContain('Estado del Sistema');
    expect(texto).toContain('Total SKUs');

    const btn = el.shadowRoot.querySelector('.export-btn');
    expect(btn).toBeTruthy();
    btn.click();
    await el.updateComplete;
    expect(el.shadowRoot.querySelector('.export-menu')).toBeTruthy();
  });

  it('las secciones no mezclan descontinuados ni SKUs sin catálogo', async () => {
    const el = await montar('dashboard');
    el._expandedCategories = new Set(['VINIBALL']);
    el.requestUpdate();
    await el.updateComplete;

    const texto = el.shadowRoot.textContent;
    expect(texto).toContain('VOLEY VINIBALL GOMA FOLK');
    expect(texto).toContain('BALON BASKET');
    expect(texto).not.toContain('ITEM DESCONTINUADO');
    expect(texto).not.toContain('ITEM SIN CATALOGO');
    expect(el.shadowRoot.querySelectorAll('.sku-item')).toHaveLength(2);
  });

  it('renderiza alertas con búsqueda y filtros', async () => {
    const el = await montar('alertas');
    const texto = el.shadowRoot.textContent;
    expect(texto).toContain('Alertas');
    expect(el.shadowRoot.querySelector('.search-input')).toBeTruthy();
    expect(el.shadowRoot.querySelectorAll('.sku-item').length).toBe(2);

    // Los contadores del header y de los filtros coinciden con la vista.
    expect(el.shadowRoot.querySelector('.badge-count').textContent).toBe('2');
    expect(texto).toContain('Todos (2)');
    expect(texto).toContain('Bajo Stock (1)');
    expect(texto).toContain('Sin Stock (1)');
  });
});
