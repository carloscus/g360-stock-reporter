import { describe, it, expect } from 'vitest';
import {
  UMBRAL_BAJO_STOCK,
  stockEnAlmacen,
  predespachoEnAlmacen,
  disponibleVES,
  tieneStock122,
  transformAPIResponse,
  revisionBadge,
  sortByOrden,
  calculateBx,
  esPorUnidades,
  esCatalogo,
  esSinCatalogo,
  etiquetaStock,
  cajasEfectivas,
  calculateStats,
  generateAlerts,
  isBusinessHours,
  formatLimaTime,
} from '../src/core/stock-service.js';

/** Producto de ejemplo con los cinco lotes de la jerarquía CIPSA. */
const producto = (over = {}) => ({
  sku: '015939',
  nombre: 'VOLEY VINIBALL GOMA FOLK',
  nombre_corto: 'Voley Viniball Folk',
  linea: 'PELOTAS',
  categoria: 'VINIBALL',
  un_bx: 48,
  estado_linea: 'IMPORTADO',
  orden: 10,
  stock: 4800,
  bx: 100,
  predespacho: 0,
  almacenes_venta: [
    { almacen: 'VES', disponible: 4800, stock: 4800, predespacho: 0, esInspeccion: false },
    { almacen: '129', disponible: 200, stock: 200, predespacho: 0, esInspeccion: false },
    { almacen: '40', disponible: 10, stock: 10, predespacho: 0, esInspeccion: false },
    { almacen: '121', disponible: 480, stock: 480, predespacho: 0, esInspeccion: true },
    { almacen: '122', disponible: 300, stock: 350, predespacho: 50, esInspeccion: false },
  ],
  ...over,
});

describe('disponibleVES', () => {
  it('devuelve solo el disponible de VES, sin sumar otros lotes', () => {
    expect(disponibleVES(producto())).toBe(4800);
  });

  it('devuelve 0 si el SKU no tiene entrada en VES aunque tenga otros lotes', () => {
    const sinVes = producto({
      almacenes_venta: [
        { almacen: '129', disponible: 150, esInspeccion: false },
        { almacen: '121', disponible: 500, esInspeccion: true },
      ],
    });
    expect(disponibleVES(sinVes)).toBe(0);
  });

  it('tolera productos sin almacenes', () => {
    expect(disponibleVES({ sku: 'X' })).toBe(0);
  });
});

describe('stockEnAlmacen / predespachoEnAlmacen', () => {
  it('devuelve el disponible del lote pedido', () => {
    expect(stockEnAlmacen(producto(), '129')).toBe(200);
    expect(stockEnAlmacen(producto(), '40')).toBe(10);
    expect(stockEnAlmacen(producto(), '121')).toBe(480);
  });

  it('devuelve 0 si el lote no existe', () => {
    expect(stockEnAlmacen(producto(), '999')).toBe(0);
  });

  it('devuelve el predespacho propio del lote 122', () => {
    expect(predespachoEnAlmacen(producto(), '122')).toBe(50);
  });
});

describe('tieneStock122', () => {
  it('true si hay disponible en 122', () => {
    expect(tieneStock122(producto())).toBe(true);
  });

  it('true si solo hay predespacho en 122', () => {
    const p = producto({
      almacenes_venta: [{ almacen: '122', disponible: 0, predespacho: 25 }],
    });
    expect(tieneStock122(p)).toBe(true);
  });

  it('false sin movimiento en 122', () => {
    const p = producto({ almacenes_venta: [{ almacen: 'VES', disponible: 10 }] });
    expect(tieneStock122(p)).toBe(false);
  });
});

describe('calculateBx', () => {
  it('calcula cajas completas', () => {
    expect(calculateBx(4800, 48)).toBe(100);
    expect(calculateBx(47, 48)).toBe(0);
  });

  it('trata un_bx 0 o inválido como 1', () => {
    expect(calculateBx(10, 0)).toBe(10);
    expect(calculateBx(10, undefined)).toBe(10);
  });
});

describe('esPorUnidades', () => {
  it('true cuando no hay empaque en cajas', () => {
    expect(esPorUnidades({ un_bx: 1 })).toBe(true);
    expect(esPorUnidades({ un_bx: 0 })).toBe(true);
    expect(esPorUnidades({})).toBe(true);
  });

  it('false cuando se vende por caja', () => {
    expect(esPorUnidades({ un_bx: 48 })).toBe(false);
  });
});

describe('etiquetaStock', () => {
  it('muestra cajas cuando se vende por caja', () => {
    expect(etiquetaStock({ un_bx: 48, bx: 100 })).toBe('100 bx');
  });

  it('muestra cajas + unidades cuando no alcanza una caja', () => {
    expect(etiquetaStock({ un_bx: 48, stock: 24 })).toBe('0 bx · 24 u');
  });

  it('muestra unidades cuando se vende por unidad', () => {
    expect(etiquetaStock({ un_bx: 1, stock: 24 })).toBe('24 u');
  });
});

describe('cajasEfectivas', () => {
  it('los SKUs por unidades aportan 0 cajas', () => {
    expect(cajasEfectivas({ un_bx: 1, stock: 500 })).toBe(0);
  });

  it('los SKUs por caja aportan sus cajas completas', () => {
    expect(cajasEfectivas({ un_bx: 48, stock: 4800, bx: 100 })).toBe(100);
  });
});

describe('sortByOrden', () => {
  it('ordena por campo orden y deja los 0 al final', () => {
    const items = [
      { sku: 'C', orden: 0 },
      { sku: 'A', orden: 2 },
      { sku: 'B', orden: 1 },
    ];
    const out = sortByOrden(items);
    expect(out.map((i) => i.sku)).toEqual(['B', 'A', 'C']);
    expect(items.map((i) => i.sku)).toEqual(['C', 'A', 'B']); // no muta
  });

  it('desempata por SKU cuando ambos no tienen orden', () => {
    const out = sortByOrden([{ sku: 'B', orden: 0 }, { sku: 'A', orden: 0 }]);
    expect(out.map((i) => i.sku)).toEqual(['A', 'B']);
  });
});

describe('esCatalogo / esSinCatalogo', () => {
  it('pertenece al catálogo con estado de línea definido', () => {
    expect(esCatalogo({ estado_linea: 'IMPORTADO' })).toBe(true);
    expect(esSinCatalogo({ estado_linea: 'IMPORTADO' })).toBe(false);
  });

  it('no pertenece al catálogo con estado vacío', () => {
    expect(esCatalogo({ estado_linea: '  ' })).toBe(false);
    expect(esSinCatalogo({ estado_linea: '' })).toBe(true);
  });
});

describe('calculateStats', () => {
  it('cuenta estados por cajas', () => {
    const stats = calculateStats([
      producto({ bx: 100, un_bx: 48 }),
      producto({ bx: 5, un_bx: 48 }),
      producto({ bx: 0, un_bx: 48 }),
    ]);
    expect(stats).toEqual({ total: 3, conStock: 1, bajoStock: 1, sinStock: 1 });
  });
});

describe('generateAlerts', () => {
  it('lista críticas primero y respeta el límite', () => {
    const items = [
      producto({ sku: 'BAJO', bx: 5, un_bx: 48 }),
      producto({ sku: 'AGOTADO', bx: 0, un_bx: 48 }),
      producto({ sku: 'OK', bx: 100, un_bx: 48 }),
    ];
    const alerts = generateAlerts(items);
    expect(alerts.map((a) => a.type)).toEqual(['critical', 'warning']);
    expect(alerts[0].sku).toBe('AGOTADO');
    expect(generateAlerts(items, 1)).toHaveLength(1);
  });

  it('no alerta descontinuados ni no vigentes', () => {
    const items = [
      producto({ sku: 'DISC', bx: 0, descontinuado: true }),
      producto({ sku: 'NOVIG', bx: 0, vigente: false }),
      producto({ sku: 'REPONER', bx: 0 }),
    ];
    expect(generateAlerts(items).map((a) => a.sku)).toEqual(['REPONER']);
  });
});

describe('transformAPIResponse (modelo enriquecido)', () => {
  const payload = {
    metadata: {
      fuente: 'General (VES, 40, 118...)',
      fecha_descarga: '2026-10-25T00:35:53-05:00',
      total_almacenes: 8,
      total_skus: 1,
      enriquecido: true,
    },
    items: [{
      sku: '011019',
      descripcion: 'N SEMIDEPORTIVA FUTBOL CRACKCITO',
      um: 'UND',
      linea: '01 - PELOTAS',
      grupo: 'NACIONAL',
      tipo: 'SEMI-DEPORTIVA',
      familia: 'FUTBOL',
      categoria: 'VINIBALL',
      almacenes: [
        { almacen: 'VES', nombre: 'CENTRO LOGISTICO VES', tipo: 'venta', disponible: 1111, stock: 1846, predespacho: 735 },
        { almacen: '118', nombre: 'ALMACEN MARKETING', tipo: 'mktd', disponible: 10, stock: 10, predespacho: 0 },
        { almacen: '40', nombre: 'ALMACEN PROD. TERMINADOS', tipo: 'venta', disponible: 36, stock: 36, predespacho: 0 },
      ],
      estado_linea: 'NACIONAL',
      linea_id: '01',
      sin_catalogo: false,
      un_bx: 60,
      peso_kg: 0.2,
      precio: 9.16,
      nombre_corto: 'Semideportiva Futbol Crackcito',
      ean13: '7754807110198',
      ean14: '',
      keywords: ['FUTBOL'],
      orden: 79,
      sin_stock: false,
      descontinuado: false,
      categoria_venta: 'VINIBALL',
      en_guia: true,
      compromiso: true,
      cotizable: true,
      por_activar: false,
      vigente: true,
      origen: 'erp',
      derivado_de: '',
      revision: 'compromiso',
    }],
  };

  it('mapea los flags comerciales y el estado de revisión', () => {
    const data = transformAPIResponse(payload);
    expect(data.enriquecido).toBe(true);
    const p = data.productos[0];
    expect(p).toMatchObject({
      um: 'UND',
      categoria_venta: 'VINIBALL',
      en_guia: true,
      compromiso: true,
      cotizable: true,
      por_activar: false,
      vigente: true,
      origen: 'erp',
      revision: 'compromiso',
      sin_stock: false,
      descontinuado: false,
    });
  });

  it('calcula stock con criterio VES y descarta almacenes mktd', () => {
    const p = transformAPIResponse(payload).productos[0];
    expect(p.stock).toBe(1111);
    expect(p.stockFisico).toBe(1147);
    expect(p.predespacho).toBe(735);
    expect(p.almacenes_venta.map((a) => a.almacen)).toEqual(['VES', '40']);
    expect(p.almacenes_venta[0]).toMatchObject({ almacen: 'VES', nombre: 'CENTRO LOGISTICO VES' });
  });

  it('propaga enriquecido=false (catálogo no disponible)', () => {
    const data = transformAPIResponse({
      metadata: { fecha_descarga: '', enriquecido: false },
      items: [],
    });
    expect(data.enriquecido).toBe(false);
    expect(data.productos).toEqual([]);
  });
});

describe('revisionBadge', () => {
  it('traduce los estados del backend', () => {
    expect(revisionBadge({ revision: 'descontinuado' })).toEqual({ rev: 'descontinuado', label: 'Descontinuado' });
    expect(revisionBadge({ revision: 'revision_venta' })).toEqual({ rev: 'revision_venta', label: 'Revisión venta' });
    expect(revisionBadge({ revision: 'por_activar' })).toEqual({ rev: 'por_activar', label: 'Por activar' });
    expect(revisionBadge({ revision: 'compromiso' }).label).toBe('Compromiso');
  });

  it('no muestra badge para vacío ni sin_catalogo (ya hay badge propio)', () => {
    expect(revisionBadge({ revision: '' })).toBeNull();
    expect(revisionBadge({ revision: 'sin_catalogo' })).toBeNull();
    expect(revisionBadge({})).toBeNull();
  });
});

describe('UMBRAL_BAJO_STOCK', () => {
  it('es el umbral único de negocio (10 cajas)', () => {
    expect(UMBRAL_BAJO_STOCK).toBe(10);
  });
});

describe('ventana operativa y hora Lima', () => {
  it('Lun-Sáb 07:00-22:59 Lima está dentro', () => {
    // 2026-09-14 es lunes; 15:00 UTC = 10:00 Lima
    expect(isBusinessHours(new Date('2026-09-14T15:00:00Z'))).toBe(true);
  });

  it('madrugada y domingo están fuera', () => {
    expect(isBusinessHours(new Date('2026-09-14T11:00:00Z'))).toBe(false); // 06:00 Lima
    expect(isBusinessHours(new Date('2026-09-13T15:00:00Z'))).toBe(false); // domingo
  });

  it('formatea la hora en Lima', () => {
    expect(formatLimaTime('2026-09-14T15:30:00Z')).toBe('10:30');
    expect(formatLimaTime('')).toBe('—');
  });
});
