// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import '../src/components/alertas-panel.js';

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
  almacenes_venta: [
    { almacen: 'VES', nombre: 'CENTRO LOGISTICO VES', disponible: 4800, stock: 4800, predespacho: 0, esInspeccion: false },
  ],
  ...over,
});

const stockData = {
  productos: [
    producto(),
    producto({ sku: '011019', nombre: 'BALON BASKET', bx: 5, stock: 240, un_bx: 48 }),
    producto({ sku: '031177', nombre: 'ROMPECABEZAS', bx: 0, stock: 0, categoria: 'VINIFAN' }),
    producto({ sku: '999001', nombre: 'ITEM DESCONTINUADO', bx: 0, stock: 0, descontinuado: true }),
  ],
};

async function montar() {
  document.body.innerHTML = '';
  const el = document.createElement('alertas-panel');
  el.stockData = stockData;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

describe('alertas-panel', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('lista solo 0 y bajo stock del catálogo vigente', async () => {
    const el = await montar();
    const texto = el.shadowRoot.textContent;
    expect(texto).toContain('Alertas');
    expect(el.shadowRoot.querySelectorAll('.sku-item')).toHaveLength(2); // 5 bx y 0 bx
    expect(texto).not.toContain('ITEM DESCONTINUADO');
    expect(texto).not.toContain('VOLEY VINIBALL GOMA FOLK'); // 100 bx no es alerta
  });

  it('muestra conteos coherentes y exporta', async () => {
    const el = await montar();
    const texto = el.shadowRoot.textContent;
    expect(el.shadowRoot.querySelector('.badge-count').textContent).toBe('2');
    expect(texto).toContain('Todos (2)');
    expect(texto).toContain('Bajo Stock (1)');
    expect(texto).toContain('Sin Stock (1)');

    el.shadowRoot.querySelector('.export-btn').click();
    await el.updateComplete;
    expect(el.shadowRoot.querySelector('.export-menu').textContent).toContain('Descargar alertas');
  });

  it('expande el detalle del SKU', async () => {
    const el = await montar();
    el.shadowRoot.querySelector('.sku-item').click();
    await el.updateComplete;
    const detalle = el.shadowRoot.querySelector('.sku-detail');
    expect(detalle).toBeTruthy();
    expect(detalle.textContent).toContain('Línea');
    expect(detalle.textContent).toContain('Predespacho');
  });
});
