import { describe, it, expect } from 'vitest';
import { filtrarReporte, esVigente, CATEGORIAS_TODOS } from '../src/core/report-filters.js';

const p = (over = {}) => ({
  sku: 'X',
  nombre: 'Producto',
  linea: 'PELOTAS',
  categoria: 'VINIBALL',
  estado_linea: 'NACIONAL',
  vigente: true,
  descontinuado: false,
  ...over,
});

describe('esVigente', () => {
  it('excluye descontinuados e inactivos', () => {
    expect(esVigente(p())).toBe(true);
    expect(esVigente(p({ descontinuado: true }))).toBe(false);
    expect(esVigente(p({ vigente: false }))).toBe(false);
  });
});

describe('filtrarReporte', () => {
  it('el reporte rápido deja solo catálogo vigente de categorías principales', () => {
    const items = [
      p({ sku: 'OK' }),
      p({ sku: 'DISC', descontinuado: true }),
      p({ sku: 'NOVIG', vigente: false }),
      p({ sku: 'SINCAT', estado_linea: '' }),
      p({ sku: 'PUBLICIDAD', categoria: 'PUBLICIDAD' }),
    ];
    expect(filtrarReporte(items).map((x) => x.sku)).toEqual(['OK']);
  });

  it('incluirNoVigentes agrega descontinuados e inactivos', () => {
    const items = [p({ sku: 'OK' }), p({ sku: 'DISC', descontinuado: true }), p({ sku: 'NOVIG', vigente: false })];
    expect(filtrarReporte(items, { incluirNoVigentes: true }).map((x) => x.sku))
      .toEqual(['OK', 'DISC', 'NOVIG']);
  });

  it('filtra por categoría específica', () => {
    const items = [p({ sku: 'VB' }), p({ sku: 'VF', categoria: 'VINIFAN' })];
    expect(filtrarReporte(items, { categoria: 'VINIFAN' }).map((x) => x.sku)).toEqual(['VF']);
  });

  it('filtra por línea exacta', () => {
    const items = [p({ sku: 'A', linea: 'PELOTAS' }), p({ sku: 'B', linea: 'JUEGOS' })];
    expect(filtrarReporte(items, { linea: 'JUEGOS' }).map((x) => x.sku)).toEqual(['B']);
  });

  it('categorías de negocio principales son las tres conocidas', () => {
    expect(CATEGORIAS_TODOS).toEqual(['REPRESENTADAS', 'VINIFAN', 'VINIBALL']);
  });
});
