// @vitest-environment happy-dom
/**
 * Simulación de flujos completos:
 *  - 3 escenarios de solicitud de XLSX (rápido, completo+122, export directo/estado)
 *  - 3 escenarios de búsqueda y compartir
 * Se ejecuta contra el generador real (ExcelJS) y el componente real.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { createRequire } from 'node:module';
import '../src/components/stock-search.js';
import { construirMensajeStock } from '../src/core/share.js';

const require = createRequire(import.meta.url);

let rg;

beforeAll(async () => {
  require('../public/exceljs.min.js'); // adjunta window.ExcelJS
  rg = await import('../src/core/report-generator.js');
});

const lote = (almacen, disponible, extra = {}) => ({
  almacen, disponible, stock: disponible, predespacho: 0, esInspeccion: almacen === '121', ...extra,
});

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
  ean14: '',
  keywords: [],
  orden: 10,
  almacenes_venta: [lote('VES', 4800), lote('129', 200), lote('40', 10), lote('121', 480), lote('122', 300, { stock: 350, predespacho: 50 })],
  ...over,
});

// Catálogo de simulación
const VIGENTE = producto({ keywords: ['VOLEY', 'FOLK'], ean13: '7754807159395' });
const DESCONTINUADO = producto({ sku: '999001', nombre: 'ITEM DESCONTINUADO', nombre_corto: 'Item descontinuado', bx: 10, stock: 480, descontinuado: true });
const SIN_CATALOGO = producto({ sku: '999002', nombre: 'ITEM SIN CATALOGO', nombre_corto: 'Item sin catálogo', estado_linea: '', bx: 5, stock: 60 });
const AGOTADO = producto({ sku: '783390', nombre: 'PELOTA PLAYA 40CM', nombre_corto: 'Pelota Playa 40cm', categoria: 'VINIFAN', linea: 'JUGUETES', bx: 0, stock: 0, orden: 90, almacenes_venta: [lote('121', 240)] });
const LOGICA = producto({
  sku: '031177', nombre: 'ROMPECABEZAS LÓGICA 500 PZAS', nombre_corto: 'Rompecabezas lógica',
  categoria: 'VINIFAN', linea: 'JUGUETES', un_bx: 24, stock: 960, bx: 40, orden: 60,
  almacenes_venta: [lote('VES', 960)],
});

const CATALOGO = [VIGENTE, DESCONTINUADO, SIN_CATALOGO, AGOTADO, LOGICA];

const leer = async (blob) => {
  const wb = new window.ExcelJS.Workbook();
  await wb.xlsx.load(await blob.arrayBuffer());
  return wb;
};
const headers = (ws) => ws.getRow(1).values.slice(1).map(String);
const filas = (ws) => ws.rowCount - 1;

describe('Simulación XLSX', () => {
  it('ESCENARIO 1: reporte rápido (vigente, categorías principales, VES)', async () => {
    const wb = await leer(await rg.generateReportXLSX('TODOS', CATALOGO, {}, '2026-10-25T10:00:00-05:00'));

    expect(wb.worksheets.map((w) => w.name)).toEqual(['Resumen', 'PELOTAS', 'JUGUETES']);
    const ws = wb.getWorksheet('PELOTAS');
    expect(headers(ws)).toEqual(['#', 'Código', 'Producto', 'Línea', 'Un/Caja', 'Disponible VES', 'Cajas', 'Estado']);
    expect(filas(ws)).toBe(1); // solo el vigente
    expect(ws.getRow(2).getCell(2).value).toBe('015939');
    expect(ws.getRow(2).getCell(6).value).toBe(4800);

    const resumen = wb.getWorksheet('Resumen');
    expect(String(resumen.getCell('C5').value)).toBe('5,760'); // 4800 + 960
    expect(resumen.getCell('C8').value).toBe(1); // sin stock = AGOTADO

    console.log('[SIM 1] rápido -> hojas:', wb.worksheets.map((w) => w.name).join(' | '), '| filas PELOTAS:', filas(ws));
  });

  it('ESCENARIO 2: completo con columnas 129/40/121 + hoja 122, acotado a PELOTAS', async () => {
    const wb = await leer(await rg.generateReportXLSX('TODOS', CATALOGO, {
      includeInspeccion: true,
      includeSecundarios: true,
      includeExport122: true,
      linea: 'PELOTAS',
    }, ''));

    expect(wb.worksheets.map((w) => w.name)).toEqual(['Resumen', 'PELOTAS', 'Sin Catálogo', '122 (Exportación)']);

    const ws = wb.getWorksheet('PELOTAS');
    expect(headers(ws)).toEqual([
      '#', 'Código', 'Producto', 'Línea', 'Un/Caja',
      '129 (Secundario)', '40 (Traslado)', '121 (Inspección)', 'Disponible VES', 'Cajas', 'Estado',
    ]);
    const fila = ws.getRow(2);
    expect([fila.getCell(6).value, fila.getCell(7).value, fila.getCell(8).value]).toEqual([200, 10, 480]);
    expect(fila.getCell(9).value).toBe(4800); // Disponible nunca suma lotes

    const ws122 = wb.getWorksheet('122 (Exportación)');
    expect(filas(ws122)).toBe(1);
    expect([ws122.getRow(2).getCell(6).value, ws122.getRow(2).getCell(7).value]).toEqual([300, 50]);

    console.log('[SIM 2] completo+línea -> hojas:', wb.worksheets.map((w) => w.name).join(' | '), '| sin catálogo:', filas(wb.getWorksheet('Sin Catálogo')));
  });

  it('ESCENARIO 3: incluir no vigentes + export directo 122 + estado sin stock', async () => {
    const conVigentes = await leer(await rg.generateReportXLSX('TODOS', CATALOGO, { incluirNoVigentes: true }, ''));
    const skus = [];
    conVigentes.getWorksheet('PELOTAS').eachRow((row, n) => { if (n > 1) skus.push(String(row.getCell(2).value)); });
    expect(skus).toContain('999001'); // descontinuado incluido a pedido

    const directo = await leer(await rg.generateExport122XLSX([VIGENTE, AGOTADO]));
    expect(directo.worksheets.map((w) => w.name)).toEqual(['122 (Exportación)']);
    expect(filas(directo.worksheets[0])).toBe(1);
    expect([directo.worksheets[0].getRow(2).getCell(6).value, directo.worksheets[0].getRow(2).getCell(7).value]).toEqual([300, 50]);

    const estado = await leer(await rg.generateEstadoXLSX('sinStock', [VIGENTE, LOGICA, AGOTADO]));
    expect(estado.worksheets[0].name).toBe('SinStock');
    expect(filas(estado.worksheets[0])).toBe(1);
    expect(estado.worksheets[0].getRow(2).getCell(1).value).toBe('783390');

    console.log('[SIM 3] no vigentes:', skus.join(','), '| 122 directo:', filas(directo.worksheets[0]), '| sin stock:', filas(estado.worksheets[0]));
  });
});

describe('Simulación búsqueda + compartir', () => {
  let el;

  beforeEach(async () => {
    document.body.innerHTML = '';
    el = document.createElement('stock-search');
    el.stockData = { productos: [VIGENTE, AGOTADO, LOGICA] };
    el.autor = 'Carlos Cusi';
    document.body.appendChild(el);
    await el.updateComplete;
  });

  const buscar = async (term) => {
    el.searchTerm = term;
    el._search();
    await el.updateComplete;
    return [...el.shadowRoot.querySelectorAll('.result-item')].map((n) => n.textContent);
  };

  it('ESCENARIO A: palabras compuestas, tildes y SKU', async () => {
    expect(await buscar('voley folk')).toHaveLength(1);   // multi-término
    expect(await buscar('logica')).toHaveLength(1);       // sin tilde
    expect(await buscar('lógica')).toHaveLength(1);       // con tilde
    expect(await buscar('015939')).toHaveLength(1);       // SKU exacto
    expect(await buscar('zzz-no-existe')).toHaveLength(0);
    console.log('[SIM A] voley folk / logica / 015939 / zzz -> OK');
  });

  it('ESCENARIO B: selección múltiple + mensaje compacto de WhatsApp', async () => {
    el.results = [
      { p: VIGENTE, score: 0, matches: [] },
      { p: LOGICA, score: 0, matches: [] },
    ];
    el._toggleSelectMode();
    await el.updateComplete;
    expect(el.shadowRoot.querySelector('.share-btn').disabled).toBe(true);

    el._toggleSelect(VIGENTE);
    el._toggleSelect(LOGICA);
    await el.updateComplete;
    expect(el.shadowRoot.querySelectorAll('.result-item.selected')).toHaveLength(2);

    const msg = construirMensajeStock(el._productosSeleccionados(), el.autor);
    expect(msg).toContain('• 015939 — Voley Viniball Folk\n  Disponible VES: 4,800');
    expect(msg).toContain('• 031177 — Rompecabezas lógica\n  Disponible VES: 960');
    expect(msg).toContain('Solicitado por: Carlos Cusi');
    expect(el.shadowRoot.querySelector('.share-btn').disabled).toBe(false);

    console.log('[SIM B] seleccionados: 2 | mensaje:\n' + msg);
  });

  it('ESCENARIO C: filtro solo con stock en la búsqueda', async () => {
    el.onlyInStock = true;
    const res = await buscar('playa');
    expect(res).toHaveLength(0); // "PELOTA PLAYA" no tiene stock en VES
    el.onlyInStock = false;
    expect(await buscar('playa')).toHaveLength(1);
    console.log('[SIM C] filtro solo-con-stock -> OK');
  });
});
