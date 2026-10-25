import { describe, it, expect } from 'vitest';
import {
  INSPECCION_ALMACEN,
  ALMACEN_SECUNDARIO,
  ALMACEN_TRASLADO,
  ALMACEN_EXPORTACION,
  ALMACEN_PRINCIPAL,
  getTimeAgo,
} from '../src/core/stock-store.js';

describe('jerarquía de almacenes', () => {
  it('los códigos son únicos y estables', () => {
    const codigos = [INSPECCION_ALMACEN, ALMACEN_SECUNDARIO, ALMACEN_TRASLADO, ALMACEN_EXPORTACION, ALMACEN_PRINCIPAL];
    expect(codigos).toEqual(['121', '129', '40', '122', 'VES']);
    expect(new Set(codigos).size).toBe(codigos.length);
  });
});

describe('getTimeAgo', () => {
  it('devuelve null sin fecha', () => {
    expect(getTimeAgo('')).toBeNull();
    expect(getTimeAgo(null)).toBeNull();
  });

  it('formatea minutos y horas', () => {
    const hace2min = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    expect(getTimeAgo(hace2min)).toBe('2 min');

    const hace3h = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(getTimeAgo(hace3h)).toBe('3h 0m');
  });

  it('trata menos de un minuto como "ahora"', () => {
    expect(getTimeAgo(new Date().toISOString())).toBe('ahora');
  });
});
