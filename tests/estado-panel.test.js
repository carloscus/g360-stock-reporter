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
    producto({ sku: '999001', nombre: 'ITEM DESCONTINUADO', bx: 3, stock: 144, descontinuado: true }),
    producto({ sku: '999002', nombre: 'ITEM SIN CATALOGO', estado_linea: '', bx: 2, stock: 96 }),
  ],
};

async function montar() {
  document.body.innerHTML = '';
  const el = document.createElement('estado-panel');
  el.stockData = stockData;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

describe('estado-panel (dashboard + árbol)', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('renderiza KPIs y el menú Exportar', async () => {
    const el = await montar();
    const texto = el.shadowRoot.textContent;
    expect(texto).toContain('Estado del Sistema');
    expect(texto).toContain('Total SKUs');

    const btn = el.shadowRoot.querySelector('.export-btn');
    expect(btn).toBeTruthy();
    btn.click();
    await el.updateComplete;
    expect(el.shadowRoot.querySelector('.export-menu')).toBeTruthy();
  });

  it('monta el árbol y no mezcla descontinuados ni sin catálogo', async () => {
    const el = await montar();
    const tree = el.shadowRoot.querySelector('estado-tree');
    expect(tree).toBeTruthy();
    await tree.updateComplete;

    expect(tree.shadowRoot.textContent).toContain('VINIBALL');
    // expandir categoría VINIBALL
    tree.shadowRoot.querySelector('.section-header').click();
    await tree.updateComplete;
    expect(tree.shadowRoot.textContent).toContain('PELOTAS');
    // expandir línea PELOTAS
    tree.shadowRoot.querySelector('.line-header').click();
    await tree.updateComplete;

    const texto = tree.shadowRoot.textContent;
    expect(texto).toContain('VOLEY VINIBALL GOMA FOLK');
    expect(texto).toContain('BALON BASKET');
    expect(texto).not.toContain('ITEM DESCONTINUADO');
    expect(texto).not.toContain('ITEM SIN CATALOGO');
  });

  it('emite prefill-report al pedir reporte de una categoría', async () => {
    const el = await montar();
    const tree = el.shadowRoot.querySelector('estado-tree');
    await tree.updateComplete;

    let detalle = null;
    el.addEventListener('prefill-report', (e) => { detalle = e.detail; });
    tree.shadowRoot.querySelector('.prefill-btn').click();

    expect(detalle).toEqual({ categoria: 'VINIBALL', linea: '' });
  });
});
