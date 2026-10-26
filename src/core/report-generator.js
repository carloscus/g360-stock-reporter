/**
 * @file report-generator.js
 * @description Generación de reportes XLSX en el browser (ExcelJS browser build).
 *              Migrado de scripts/generate-reports-excel.cjs — usa writeBuffer() + Blob
 *              en lugar de fs.writeFileSync. Lazy-loaded via dynamic import en pulso-form.js.
 * @author @carloscus
 * @version 1.15.0
 */

let ExcelJS = window.ExcelJS;
let _excelJsPromise = null;

/**
 * Carga ExcelJS bajo demanda (925 KB / 252 KB gzip) solo al generar un XLSX.
 * El service worker ya lo precachea, así que también funciona offline.
 * @returns {Promise<Object>} namespace de ExcelJS
 */
async function loadExcelJS() {
  if (ExcelJS) return ExcelJS;
  if (!_excelJsPromise) {
    _excelJsPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${import.meta.env.BASE_URL}exceljs.min.js`;
      script.onload = () => {
        ExcelJS = window.ExcelJS;
        ExcelJS ? resolve(ExcelJS) : reject(new Error('ExcelJS no expuso window.ExcelJS'));
      };
      script.onerror = () => reject(new Error('No se pudo cargar exceljs.min.js'));
      document.head.appendChild(script);
    });
  }
  return _excelJsPromise;
}

import { ALMACEN_SECUNDARIO, ALMACEN_SECUNDARIO_ALT, ALMACEN_TRASLADO, ALMACEN_EXPORTACION } from './stock-store.js';
import { sortByOrden, esPorUnidades, esCatalogo, esSinCatalogo, disponibleVES, stockEnAlmacen, predespachoEnAlmacen, tieneStock122, UMBRAL_BAJO_STOCK, calculateBx } from './stock-service.js';
import { filtrarReporte, esVigente, CATEGORIAS_TODOS } from './report-filters.js';

const COLORS = {
  primary: 'FF0E7490',
  secondary: 'FF0891B4',
  accent: 'FF00D084',
  dark: 'FF0F172A',
  green: 'FFDCFCE7',
  greenDark: 'FF059669',
  red: 'FFFEE2E2',
  redDark: 'FFDC2626',
  yellow: 'FFFEF3C7',
  yellowDark: 'FFD97706',
  white: 'FFFFFFFF',
  grayText: 'FF64748B',
  export122: 'FF8B5CF6',
  export122Dark: 'FF6D28D9',
  lineColors: ['FF3B82F6', 'FF10B981', 'FFF59E0B', 'FFEF4444', 'FF8B5CF6', 'FFEC4899', 'FF06B6D4', 'FFF97316'],
};

const getEstado = (bx) => {
  if (bx === 0) return { text: '✗ AGOTADO', bgColor: COLORS.red, fontColor: COLORS.redDark };
  if (bx < UMBRAL_BAJO_STOCK) return { text: '⚠ BAJO', bgColor: COLORS.yellow, fontColor: COLORS.yellowDark };
  return { text: '✓ OK', bgColor: COLORS.green, fontColor: COLORS.greenDark };
};

/**
 * Nombre de hoja para una línea (Excel limita a 31 caracteres).
 * Debe coincidir con el usado al crear las hojas por línea.
 */
function sheetNameForLinea(linea) {
  return (linea || 'Sin Línea').substring(0, 31);
}

/** Workbook con metadatos de marca, igual en todos los reportes. */
function crearWorkbookBase(titulo, autor = null) {
  const wb = new ExcelJS.Workbook();
  wb.properties.title = titulo;
  wb.properties.created = new Date();
  wb.creator = autor
    ? `${autor.nombre}${autor.email ? ` <${autor.email}>` : ''}`
    : 'g360-stock-reporter';
  wb.lastModifiedBy = 'g360-stock-reporter';
  return wb;
}

/** Serializa el workbook a un Blob XLSX listo para descargar. */
async function blobDesdeWorkbook(wb) {
  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Escribe la cabecera estándar de una hoja tabular: columnas, autofiltro,
 * fila congelada y estilo del encabezado (un solo lugar para los 3 reportes).
 */
function crearHojaTabla(ws, headers, { fill = COLORS.primary, border = COLORS.accent, height = 32 } = {}) {
  ws.columns = headers;
  ws.autoFilter = `A1:${String.fromCharCode(64 + headers.length)}1`;
  ws.views = [{ state: 'frozen', ySplit: 1 }];

  const headerRow = ws.getRow(1);
  headerRow.height = height;
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
    cell.font = { bold: true, size: 11, color: { argb: COLORS.white } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { bottom: { style: 'medium', color: { argb: border } } };
  });
  return headerRow;
}

/** Agrupa productos por clave sumando códigos y disponible VES. */
function agruparProductos(productos, clave) {
  const grupos = {};
  productos.forEach((p) => {
    const key = clave(p);
    if (!grupos[key]) grupos[key] = { codigos: 0, stock: 0 };
    grupos[key].codigos++;
    grupos[key].stock += disponibleVES(p);
  });
  return grupos;
}

/**
 * Tabla agregada de 4 columnas (categoría o línea).
 * @returns {number} fila siguiente libre
 */
function escribirTablaAgrupada(ws, { titulo, headerLabel, grupos, startRow, totalUnidades, hipervinculo = false }) {
  let row = startRow;

  ws.mergeCells(`A${row}:D${row}`);
  ws.getCell(`A${row}`).value = titulo;
  ws.getCell(`A${row}`).font = { bold: true, size: 12, color: { argb: COLORS.white } };
  ws.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.dark } };
  ws.getCell(`A${row}`).alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(row).height = 26;

  const headerRow = row + 1;
  [headerLabel, 'Códigos', 'Stock', '%'].forEach((h, i) => {
    const cell = ws.getCell(`${String.fromCharCode(65 + i)}${headerRow}`);
    cell.value = h;
    cell.font = { bold: true, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    cell.alignment = { horizontal: 'center' };
  });

  let dataRow = headerRow + 1;
  Object.entries(grupos).forEach(([nombre, data], idx) => {
    const pct = totalUnidades > 0 ? ((data.stock / totalUnidades) * 100).toFixed(1) : '0';
    const color = COLORS.lineColors[idx % COLORS.lineColors.length];

    const cellNombre = ws.getCell(`A${dataRow}`);
    if (hipervinculo) {
      cellNombre.value = {
        text: nombre,
        hyperlink: `#'${sheetNameForLinea(nombre).replace(/'/g, "''")}'!A1`,
        tooltip: `Ir a la hoja ${nombre}`,
      };
      cellNombre.font = { bold: true, size: 10, color: { argb: color }, underline: true };
    } else {
      cellNombre.value = nombre;
      cellNombre.font = { bold: true, size: 10, color: { argb: color } };
    }

    ws.getCell(`B${dataRow}`).value = data.codigos;
    ws.getCell(`B${dataRow}`).alignment = { horizontal: 'center' };

    ws.getCell(`C${dataRow}`).value = data.stock;
    ws.getCell(`C${dataRow}`).alignment = { horizontal: 'right' };

    ws.getCell(`D${dataRow}`).value = pct + '%';
    ws.getCell(`D${dataRow}`).alignment = { horizontal: 'center' };
    ws.getCell(`D${dataRow}`).font = { bold: true, color: { argb: color } };

    dataRow++;
  });

  return dataRow;
}

/** Cabecera de marca del Resumen (filas 1-3). */
function escribirCabeceraResumen(ws, productos, autor) {
  ws.getColumn('A').width = 22;
  ws.getColumn('B').width = 12;
  ws.getColumn('C').width = 15;
  ws.getColumn('D').width = 10;

  // ===== HEADER BRAND =====
  ws.mergeCells('A1:D1');
  ws.getCell('A1').value = '📊 STOCKPULSE - CIPSA';
  ws.getCell('A1').font = { bold: true, size: 18, color: { argb: COLORS.white } };
  ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.accent } };
  ws.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 35;

  const fechaStr = productos.length > 0 && productos[0].lastUpdated
    ? new Date(productos[0].lastUpdated).toLocaleString('es-PE')
    : new Date().toLocaleString('es-PE');
  ws.mergeCells('A2:D2');
  ws.getCell('A2').value = `🔄 Actualizado: ${fechaStr} | 📍 Almacén VES`;
  ws.getCell('A2').font = { size: 10, color: { argb: COLORS.grayText } };
  ws.getCell('A2').alignment = { horizontal: 'center' };
  ws.getRow(2).height = 20;

  // ===== AUTOR =====
  ws.mergeCells('A3:D3');
  const autorPart = autor ? `👤 ${autor.nombre}${autor.email ? ` <${autor.email}>` : ''}` : '';
  ws.getCell('A3').value = [autorPart, '🛠 g360-stock-reporter'].filter(Boolean).join(' | ');
  ws.getCell('A3').font = { italic: true, size: 9, color: { argb: COLORS.grayText } };
  ws.getCell('A3').alignment = { horizontal: 'center' };
  ws.getRow(3).height = 18;
}

/** KPIs del Resumen: productos, unidades y estados. */
function escribirKpisResumen(ws, productos) {
  const totalUnidades = productos.reduce((acc, p) => acc + disponibleVES(p), 0);
  const totalCodigos = productos.length;

  const productosSinStock = productos.filter((p) => disponibleVES(p) === 0);
  const productosBajoStock = productos.filter((p) => {
    const bx = Math.floor(disponibleVES(p) / (p.un_bx || 1));
    return bx > 0 && bx < UMBRAL_BAJO_STOCK;
  });
  const productosOk = totalCodigos - productosSinStock.length - productosBajoStock.length;

  const kpiRows = [
    { label: '✅ CON STOCK', value: productosOk, bg: COLORS.greenDark, color: COLORS.white },
    { label: '⚠️ BAJO STOCK', value: productosBajoStock.length, bg: COLORS.yellowDark, color: COLORS.white },
    { label: '❌ SIN STOCK', value: productosSinStock.length, bg: COLORS.redDark, color: COLORS.white },
  ];

  let rowIdx = 4;

  // KPI Row 1: Total códigos
  ws.mergeCells(`A${rowIdx}:B${rowIdx}`);
  ws.getCell(`A${rowIdx}`).value = '📦 TOTAL PRODUCTOS';
  ws.getCell(`A${rowIdx}`).font = { bold: true, size: 11, color: { argb: COLORS.white } };
  ws.getCell(`A${rowIdx}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.primary } };
  ws.getCell(`A${rowIdx}`).alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(rowIdx).height = 28;

  ws.mergeCells(`C${rowIdx}:D${rowIdx}`);
  ws.getCell(`C${rowIdx}`).value = totalCodigos.toLocaleString('es-PE');
  ws.getCell(`C${rowIdx}`).font = { bold: true, size: 24, color: { argb: COLORS.primary } };
  ws.getCell(`C${rowIdx}`).alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getCell(`C${rowIdx}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };

  rowIdx++;

  // KPI Row 2: Total unidades
  ws.mergeCells(`A${rowIdx}:B${rowIdx}`);
  ws.getCell(`A${rowIdx}`).value = '📊 TOTAL UNIDADES';
  ws.getCell(`A${rowIdx}`).font = { bold: true, size: 11, color: { argb: COLORS.white } };
  ws.getCell(`A${rowIdx}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.secondary } };
  ws.getCell(`A${rowIdx}`).alignment = { vertical: 'middle', horizontal: 'center' };

  ws.mergeCells(`C${rowIdx}:D${rowIdx}`);
  ws.getCell(`C${rowIdx}`).value = totalUnidades.toLocaleString('es-PE');
  ws.getCell(`C${rowIdx}`).font = { bold: true, size: 24, color: { argb: COLORS.secondary } };
  ws.getCell(`C${rowIdx}`).alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getCell(`C${rowIdx}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCFBF5' } };

  rowIdx++;

  // Status indicators
  for (const kpi of kpiRows) {
    ws.mergeCells(`A${rowIdx}:B${rowIdx}`);
    ws.getCell(`A${rowIdx}`).value = kpi.label;
    ws.getCell(`A${rowIdx}`).font = { bold: true, size: 11, color: { argb: kpi.color } };
    ws.getCell(`A${rowIdx}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: kpi.bg } };
    ws.getCell(`A${rowIdx}`).alignment = { vertical: 'middle', horizontal: 'center' };
    ws.getRow(rowIdx).height = 28;

    ws.mergeCells(`C${rowIdx}:D${rowIdx}`);
    const kpiColor = kpi.bg === COLORS.greenDark ? COLORS.greenDark
      : kpi.bg === COLORS.yellowDark ? COLORS.yellowDark
      : COLORS.redDark;
    ws.getCell(`C${rowIdx}`).value = kpi.value;
    ws.getCell(`C${rowIdx}`).font = { bold: true, size: 20, color: { argb: kpiColor } };
    ws.getCell(`C${rowIdx}`).alignment = { vertical: 'middle', horizontal: 'center' };

    const kpiBg = kpi.label.includes('CON') ? COLORS.green
      : kpi.label.includes('BAJO') ? COLORS.yellow
      : COLORS.red;
    ws.getCell(`C${rowIdx}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: kpiBg } };
    rowIdx++;
  }

  return { totalUnidades, nextRow: rowIdx };
}

/**
 * Crea la hoja "Resumen" con KPIs, totales por categoría y línea.
 * Los totales usan SOLO el disponible VES (lotes 129/40/121 nunca suman).
 */
function createResumenSheet(ws, productos, autor = null) {
  escribirCabeceraResumen(ws, productos, autor);
  const { totalUnidades, nextRow } = escribirKpisResumen(ws, productos);

  // ===== POR CATEGORÍA =====
  const categorias = agruparProductos(productos, (p) => p.categoria);
  const catRow = escribirTablaAgrupada(ws, {
    titulo: '🏷️ POR CATEGORÍA',
    headerLabel: 'Categoría',
    grupos: categorias,
    startRow: nextRow + 1,
    totalUnidades,
  });

  // ===== POR LÍNEA =====
  const lineas = agruparProductos(productos, (p) => p.linea);
  const lineaRow = escribirTablaAgrupada(ws, {
    titulo: '📂 POR LÍNEA',
    headerLabel: 'Línea',
    grupos: lineas,
    startRow: catRow + 2,
    totalUnidades,
    hipervinculo: true,
  });

  // Pie de página
  const leyendaRow = escribirLeyendaAlmacenes(ws, productos, lineaRow + 2);
  ws.mergeCells(`A${leyendaRow + 2}:D${leyendaRow + 2}`);
  ws.getCell(`A${leyendaRow + 2}`).value = 'StockPulse - Inteligencia CIPSA';
  ws.getCell(`A${leyendaRow + 2}`).font = { italic: true, size: 9, color: { argb: COLORS.grayText } };
  ws.getCell(`A${leyendaRow + 2}`).alignment = { horizontal: 'center' };
}

/** Roles comerciales por almacén (para la leyenda del Resumen). */
const ALMACEN_ROLES = {
  VES: 'Venta directa',
  '129': 'Secundario',
  '92': 'Secundario',
  '40': 'Traslado',
  '121': 'Inspección/QC',
  '122': 'Exportación',
};
const ORDEN_ALMACENES = ['VES', '129', '92', '40', '121', '122'];

/**
 * Leyenda de almacenes en el Resumen: código, nombre oficial (si el API lo
 * envía) y rol comercial. Devuelve la fila siguiente libre.
 */
function escribirLeyendaAlmacenes(ws, productos, startRow) {
  const almacenes = new Map();
  for (const p of productos) {
    for (const a of (p.almacenes_venta || [])) {
      if (!almacenes.has(a.almacen)) {
        almacenes.set(a.almacen, { nombre: a.nombre || '', rol: ALMACEN_ROLES[a.almacen] || '' });
      } else if (!almacenes.get(a.almacen).nombre && a.nombre) {
        almacenes.get(a.almacen).nombre = a.nombre;
      }
    }
  }
  if (almacenes.size === 0) return startRow;

  const orden = [...almacenes.keys()].sort((a, b) => {
    const ia = ORDEN_ALMACENES.indexOf(a);
    const ib = ORDEN_ALMACENES.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  let row = startRow;
  ws.mergeCells(`A${row}:D${row}`);
  ws.getCell(`A${row}`).value = '🏭 LEYENDA DE ALMACENES';
  ws.getCell(`A${row}`).font = { bold: true, size: 12, color: { argb: COLORS.white } };
  ws.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.dark } };
  ws.getCell(`A${row}`).alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(row).height = 26;

  const headerRow = row + 1;
  ['Código', 'Nombre', 'Rol', ''].forEach((h, i) => {
    const cell = ws.getCell(`${String.fromCharCode(65 + i)}${headerRow}`);
    cell.value = h;
    cell.font = { bold: true, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    cell.alignment = { horizontal: 'center' };
  });

  let dataRow = headerRow + 1;
  for (const code of orden) {
    const data = almacenes.get(code);
    ws.getCell(`A${dataRow}`).value = code;
    ws.getCell(`A${dataRow}`).font = { bold: true, size: 10 };
    ws.getCell(`B${dataRow}`).value = data.nombre || '—';
    ws.getCell(`C${dataRow}`).value = data.rol || '—';
    dataRow++;
  }
  return dataRow;
}

/**
 * Crea la hoja de datos detallados.
 * - perfil "rapido": Disponible VES + cajas + estado.
 * - perfil "completo": agrega columnas de todos los lotes (129/40/121/122),
 *   predespacho y revisión. Los lotes son informativos y nunca suman al VES.
 */
function createDataSheet(ws, titulo, productos, { perfil = 'rapido', incluirLotes = false } = {}) {
  const completo = perfil === 'completo';

  const headers = [
    { header: '#', key: 'item', width: 5 },
    { header: 'Código', key: 'sku', width: 12 },
    { header: 'Producto', key: 'nombre', width: 45 },
    { header: 'Línea', key: 'linea', width: 18 },
    { header: 'Un/Caja', key: 'unBx', width: 10 },
  ];

  if (completo) {
    headers.push(
      { header: '129 (Secundario)', key: 'secundario', width: 16 },
      { header: '92 (Secundario)', key: 'secundario2', width: 16 },
      { header: '40 (Traslado)', key: 'traslado', width: 16 },
      { header: '121 (Inspección)', key: 'inspeccion', width: 16 },
      { header: '122 (Exportación)', key: 'export122', width: 16 },
      { header: 'Predespacho', key: 'predespacho', width: 14 },
      { header: 'Revisión', key: 'revision', width: 14 },
    );
  } else if (incluirLotes) {
    headers.push(
      { header: '129 (Secundario)', key: 'secundario', width: 16 },
      { header: '40 (Traslado)', key: 'traslado', width: 16 },
      { header: '121 (Inspección)', key: 'inspeccion', width: 16 },
    );
  }

  headers.push({ header: 'Disponible VES', key: 'stock', width: 12 });
  headers.push({ header: 'Cajas', key: 'bx', width: 8 });
  headers.push({ header: 'Estado', key: 'estado', width: 12 });

  crearHojaTabla(ws, headers);

  productos.forEach((p, index) => {
    const stockBase = disponibleVES(p);
    const bx = calculateBx(stockBase, p.un_bx);
    const inspeccionStock = p.almacenes_venta?.find((a) => a.esInspeccion)?.disponible ?? 0;
    const estado = getEstado(bx);

    const rowData = {
      item: index + 1,
      sku: p.sku,
      nombre: p.nombre,
      linea: p.linea,
      unBx: p.un_bx,
    };

    if (completo) {
      rowData.secundario = stockEnAlmacen(p, ALMACEN_SECUNDARIO);
      rowData.secundario2 = stockEnAlmacen(p, ALMACEN_SECUNDARIO_ALT);
      rowData.traslado = stockEnAlmacen(p, ALMACEN_TRASLADO);
      rowData.inspeccion = inspeccionStock;
      rowData.export122 = stockEnAlmacen(p, ALMACEN_EXPORTACION);
      rowData.predespacho = p.predespacho ?? 0;
      rowData.revision = p.revision || '—';
    } else if (incluirLotes) {
      rowData.secundario = stockEnAlmacen(p, ALMACEN_SECUNDARIO);
      rowData.traslado = stockEnAlmacen(p, ALMACEN_TRASLADO);
      rowData.inspeccion = inspeccionStock;
    }

    rowData.stock = stockBase;
    rowData.bx = esPorUnidades(p) ? 0 : bx;
    rowData.estado = estado.text;

    const row = ws.addRow(rowData);

    // Color coding de columnas informativas + estado (mismo criterio por fila)
    const coloredKeys = completo
      ? ['secundario', 'secundario2', 'traslado', 'inspeccion', 'export122', 'predespacho', 'revision', 'stock', 'bx', 'estado']
      : incluirLotes
        ? ['secundario', 'traslado', 'inspeccion', 'stock', 'bx', 'estado']
        : ['stock', 'bx', 'estado'];

    headers.forEach((h, idx) => {
      if (coloredKeys.includes(h.key)) {
        const cell = row.getCell(idx + 1);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: estado.bgColor } };
        cell.font = { bold: true, color: { argb: estado.fontColor } };
        cell.alignment = { horizontal: 'center' };
      }
    });
  });
}

/**
 * Hoja adicional "122 (Exportación)": stock del almacén 122, SOLO informativa
 * (nunca suma al Disponible VES). Muestra disponible y predespacho por lote.
 */
function createSheet122(ws, productos) {
  const headers = [
    { header: '#', key: 'item', width: 5 },
    { header: 'Código', key: 'sku', width: 12 },
    { header: 'Producto', key: 'nombre', width: 45 },
    { header: 'Línea', key: 'linea', width: 18 },
    { header: 'Un/Caja', key: 'unBx', width: 10 },
    { header: 'Disponible 122', key: 'disponible', width: 14 },
    { header: 'Predespacho 122', key: 'predespacho', width: 16 },
  ];

  // Header violeta: identifica la hoja como información específica (122)
  crearHojaTabla(ws, headers, { fill: COLORS.export122, border: COLORS.export122Dark });

  productos.forEach((p, index) => {
    const disp122 = stockEnAlmacen(p, ALMACEN_EXPORTACION);
    const pred122 = predespachoEnAlmacen(p, ALMACEN_EXPORTACION);

    const row = ws.addRow({
      item: index + 1,
      sku: p.sku,
      nombre: p.nombre,
      linea: p.linea,
      unBx: p.un_bx,
      disponible: disp122,
      predespacho: pred122,
    });

    const cellDisp = row.getCell(6);
    if (disp122 > 0) {
      cellDisp.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.green } };
      cellDisp.font = { bold: true, color: { argb: COLORS.greenDark } };
    }
    cellDisp.alignment = { horizontal: 'center' };

    const cellPred = row.getCell(7);
    if (pred122 > 0) {
      cellPred.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.yellow } };
      cellPred.font = { bold: true, color: { argb: COLORS.yellowDark } };
    }
    cellPred.alignment = { horizontal: 'center' };
  });
}

/**
 * Genera un reporte XLSX completo en memoria (browser).
 * Reemplaza generate-reports-excel.cjs.
 * Por defecto: reporte rápido (catálogo vigente, categorías principales,
 * disponible VES). Los lotes y hojas extra se activan a pedido.
 *
 * @param {string} categoria        - 'TODOS', 'VINIBALL', 'VINIFAN', 'REPRESENTADAS'
 * @param {Array}  productos        - productos enriquecidos (stock-service.js)
 * @param {Object} options          - { perfil, incluirLotes, includeSecundarios,
 *                                      includeExport122, incluirNoVigentes, linea, autor }
 *                                    perfil: 'rapido' (Disponible VES) o 'completo'
 *                                    (todos los lotes 129/40/121/122 + predespacho
 *                                    + revisión, como columnas).
 *                                    incluirLotes: agrega 129/40/121 en perfil rápido
 *                                    (compatibilidad); en completo ya vienen.
 *                                    includeExport122: agrega hoja adicional
 *                                    "122 (Exportación)" con disponible/predespacho
 *                                    de ese almacén (solo informativa).
 *                                    incluirNoVigentes: incluye descontinuados/inactivos.
 *                                    linea: limita el reporte a una línea exacta.
 * @param {string} lastUpdated      - timestamp ISO del API
 * @returns {Promise<Blob>}        - Blob listo para descargar
 */
export async function generateReportXLSX(categoria, productos, options = {}, lastUpdated = '') {
  const {
    perfil = 'rapido',
    incluirLotes = false,
    includeSecundarios = false,
    includeExport122 = false,
    incluirNoVigentes = false,
    linea = '',
    autor = null,
  } = options;

  await loadExcelJS();

  // Reporte rápido: catálogo vigente de categorías principales (y línea a pedido).
  const filtered = filtrarReporte(productos, { categoria, linea, incluirNoVigentes });

  filtered.forEach((p) => { if (lastUpdated) p.lastUpdated = lastUpdated; });

  const wb = crearWorkbookBase(`StockPulse - ${categoria}`, autor);

  // Hoja 1: Resumen (KPIs)
  const wsResumen = wb.addWorksheet('Resumen');
  createResumenSheet(wsResumen, filtered, autor);

  // Agrupar por línea y crear una hoja por cada línea
  const lineas = {};
  filtered.forEach((p) => {
    const linea = p.linea || 'Sin Línea';
    if (!lineas[linea]) lineas[linea] = [];
    lineas[linea].push(p);
  });

  Object.entries(lineas).forEach(([linea, items]) => {
    const sheetName = sheetNameForLinea(linea);
    const wsLinea = wb.addWorksheet(sheetName);
    createDataSheet(wsLinea, linea, sortByOrden(items), { perfil, incluirLotes });
  });

  // Hoja adicional: SKUs fuera de catálogo (solo categorías principales)
  if (includeSecundarios) {
    const secundarios = productos.filter(
      (p) => !esCatalogo(p)
        && CATEGORIAS_TODOS.includes(p.categoria)
        && (incluirNoVigentes || esVigente(p))
    );
    if (secundarios.length > 0) {
      const wsSinCat = wb.addWorksheet('Sin Catálogo');
      createDataSheet(wsSinCat, 'Sin Catálogo', sortByOrden(secundarios), { perfil, incluirLotes });
    }
  }

  // Hoja adicional: stock en almacén 122 (Exportación), SOLO informativa
  // (nunca suma al Disponible VES). Incluye SKUs con disponible o predespacho.
  if (includeExport122) {
    const en122 = filtered.filter(tieneStock122);
    if (en122.length > 0) {
      const ws122 = wb.addWorksheet('122 (Exportación)');
      createSheet122(ws122, sortByOrden(en122));
    }
  }

  // Browser: writeBuffer → Blob
  return blobDesdeWorkbook(wb);
}

/**
 * Genera un XLSX de una sola hoja con el stock del almacén 122 (Exportación).
 * Acceso directo independiente del reporte completo; SOLO informativo.
 *
 * @param {Array}  productos - Productos enriquecidos del store
 * @param {Object} autor     - { nombre, email } opcional
 * @returns {Promise<Blob>}
 */
export async function generateExport122XLSX(productos, autor = null) {
  await loadExcelJS();

  const en122 = productos.filter(tieneStock122);

  const wb = crearWorkbookBase('StockPulse 122 (Exportación)', autor);

  const ws = wb.addWorksheet('122 (Exportación)');
  createSheet122(ws, sortByOrden(en122));

  return blobDesdeWorkbook(wb);
}

/**
 * Helper: descargar un Blob como archivo XLSX.
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Helper: generar nombre de archivo con timestamp Perú.
 */
export function generarNombreArchivo(categoria) {
  const fecha = new Date().toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).replace(/\//g, '-').replace(',', '').replace(/:/g, '').replace(' ', '_');
  const catSuffix = categoria === 'TODOS' ? 'TODOS' : categoria;
  return `StockPulse_${catSuffix}_${fecha}.xlsx`;
}

/**
 * Genera un XLSX de una sola hoja con el estado filtrado del dashboard
 * (Con Stock / Bajo Stock / Sin Stock / Sin Catálogo). Mismo filtrado
 * y columnas que el CSV anterior, pero en formato hoja de cálculo.
 *
 * @param {string} tipo  - 'conStock' | 'bajoStock' | 'sinStock' | 'sinCatalogo'
 * @param {Array} productos - Productos enriquecidos del store
 * @returns {Promise<Blob>}
 */
export async function generateEstadoXLSX(tipo, productos) {
  await loadExcelJS();

  const labels = { conStock: 'ConStock', bajoStock: 'BajoStock', sinStock: 'SinStock', sinCatalogo: 'SinCatalogo', alertas: 'Alertas' };
  const filtros = {
    conStock: (p) => (p.bx || 0) >= UMBRAL_BAJO_STOCK,
    bajoStock: (p) => (p.bx || 0) > 0 && (p.bx || 0) < UMBRAL_BAJO_STOCK,
    sinStock: (p) => (p.bx || 0) === 0,
    sinCatalogo: esSinCatalogo,
    alertas: (p) => (p.bx || 0) < UMBRAL_BAJO_STOCK,
  };
  const filtro = filtros[tipo] || filtros.conStock;
  const items = sortByOrden(productos.filter(filtro));

  const wb = crearWorkbookBase(`StockPulse ${labels[tipo]}`);

  const ws = wb.addWorksheet(labels[tipo]);

  const headers = ['SKU', 'Nombre', 'Línea', 'Categoría', 'Cajas', 'Disponible VES', 'Estado'];
  const widths = [14, 40, 20, 18, 10, 16, 12];
  crearHojaTabla(ws, headers.map((h, i) => ({ header: h, key: `c${i}`, width: widths[i] })), { height: 22 });

  for (const p of items) {
    const row = ws.addRow([
      p.sku,
      p.nombre || '',
      p.linea || '',
      p.categoria || '',
      esPorUnidades(p) ? 0 : (p.bx || 0),
      p.stock || 0,
      p.estado || '',
    ]);
    const estado = p.estado || '';
    const color = estado === 'AGOTADO' ? COLORS.red
      : estado === 'BAJO' ? COLORS.yellow
      : COLORS.green;
    row.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
    row.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
    row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
  }

  return blobDesdeWorkbook(wb);
}
