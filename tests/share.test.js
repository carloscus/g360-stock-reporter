import { describe, it, expect } from 'vitest';
import { construirMensajeStock } from '../src/core/share.js';

const p = (sku, nombre_corto, stock) => ({ sku, nombre_corto, nombre: nombre_corto, stock });

describe('construirMensajeStock', () => {
  it('arma el mensaje compacto de un SKU', () => {
    expect(construirMensajeStock([p('015939', 'Voley Viniball Folk', 4800)]))
      .toBe('StockPulse · Consulta de stock\n• 015939 — Voley Viniball Folk\n  Disponible VES: 4,800');
  });

  it('incluye varios SKUs en orden y agrega el autor', () => {
    const msg = construirMensajeStock(
      [p('A', 'Alpha', 1200), p('B', 'Beta', 0)],
      'Carlos Cusi',
    );
    expect(msg).toContain('• A — Alpha\n  Disponible VES: 1,200');
    expect(msg).toContain('• B — Beta\n  Disponible VES: 0');
    expect(msg).toContain('Solicitado por: Carlos Cusi');
    expect(msg.indexOf('• A')).toBeLessThan(msg.indexOf('• B'));
  });

  it('omite el autor cuando está vacío', () => {
    expect(construirMensajeStock([p('A', 'Alpha', 5)])).not.toContain('Solicitado por');
  });

  it('tolera lista vacía (solo encabezado)', () => {
    expect(construirMensajeStock([], '')).toBe('StockPulse · Consulta de stock');
  });

  it('usa el nombre completo si no hay nombre corto', () => {
    const msg = construirMensajeStock([{ sku: 'X', nombre: 'NOMBRE LARGO', stock: 10 }]);
    expect(msg).toContain('• X — NOMBRE LARGO');
  });
});
