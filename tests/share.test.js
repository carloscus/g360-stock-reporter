import { describe, it, expect } from 'vitest';
import { construirMensajeStock } from '../src/core/share.js';

const p = (over = {}) => ({
  sku: '03075',
  nombre: 'FOLDER N VINIFAN FANTASIA OFICIO INFANTIL SURTIDO',
  nombre_corto: 'Folder fantasía',
  linea: 'ARCHIVO',
  un_bx: 48,
  stock: 1200,
  almacenes_venta: [
    { almacen: 'VES', disponible: 1200, esInspeccion: false },
  ],
  ...over,
});

const conLotes = (over = {}) => p({
  stock: 0,
  ...over,
  almacenes_venta: [
    { almacen: 'VES', disponible: 0, esInspeccion: false },
    { almacen: '129', disponible: 200, esInspeccion: false },
    { almacen: '121', disponible: 480, esInspeccion: true },
    { almacen: '92', disponible: 50, esInspeccion: false },
  ],
  ...over,
});

describe('construirMensajeStock', () => {
  it('arma el mensaje con SKU, descripción, línea y VES (cajas)', () => {
    expect(construirMensajeStock([p()])).toBe(
      'StockPulse · Consulta de stock\n' +
      '• 03075 — FOLDER N VINIFAN FANTASIA OFICIO INFANTIL SURTIDO\n' +
      '  ARCHIVO · VES: 1,200 u (25 bx)',
    );
  });

  it('para SKUs por unidades no muestra cajas', () => {
    const msg = construirMensajeStock([p({ un_bx: 1, stock: 24 })]);
    expect(msg).toContain('ARCHIVO · VES: 24 u');
    expect(msg).not.toContain('bx');
  });

  it('si VES = 0 usa el primer respaldo con stock (129 → 121 → 92)', () => {
    expect(construirMensajeStock([conLotes()])).toContain('ARCHIVO · VES: 0 · 129: 200');
    const solo121 = conLotes();
    solo121.almacenes_venta = solo121.almacenes_venta.map((a) =>
      a.almacen === '129' ? { ...a, disponible: 0 } : a);
    expect(construirMensajeStock([solo121])).toContain('VES: 0 · 121: 480');
  });

  it('si no hay stock en ningún lote muestra VES: 0', () => {
    const sinStock = p({ stock: 0, un_bx: 1, almacenes_venta: [{ almacen: 'VES', disponible: 0 }] });
    expect(construirMensajeStock([sinStock])).toContain('ARCHIVO · VES: 0');
  });

  it('incluye varios SKUs y el autor', () => {
    const msg = construirMensajeStock([p(), p({ sku: '03077', nombre: 'OTRO' })], 'Carlos Cusi');
    expect(msg).toContain('• 03075');
    expect(msg).toContain('• 03077');
    expect(msg).toContain('Solicitado por: Carlos Cusi');
    expect(msg.indexOf('• 03075')).toBeLessThan(msg.indexOf('• 03077'));
  });

  it('recorta descripciones largas', () => {
    const largo = 'X'.repeat(100);
    const msg = construirMensajeStock([p({ nombre: largo })]);
    expect(msg).toContain('…');
    expect(msg).not.toContain(largo);
  });

  it('omite el autor cuando está vacío', () => {
    expect(construirMensajeStock([p()])).not.toContain('Solicitado por');
  });
});
