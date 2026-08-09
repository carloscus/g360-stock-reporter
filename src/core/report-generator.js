/**
 * @file report-generator.js
 * @description Generación de reportes XLSX en el browser (ExcelJS browser build).
 *              Migrado de scripts/generate-reports-excel.cjs — usa writeBuffer() + Blob
 *              en lugar de fs.writeFileSync. Lazy-loaded via dynamic import en pulso-form.js.
 * @author @carloscus
 * @version 1.0.0
 */

const ExcelJS = window.ExcelJS;

import { INSPECCION_ALMACEN } from './stock-store.js';

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
  lineColors: ['FF3B82F6', 'FF10B981', 'FFF59E0B', 'FFEF4444', 'FF8B5CF6', 'FFEC4899', 'FF06B6D4', 'FFF97316'],
};

const getEstado = (bx) => {
  if (bx === 0) return { text: '✗ AGOTADO', bgColor: COLORS.red, fontColor: COLORS.redDark };
  if (bx < 10) return { text: '⚠ BAJO', bgColor: COLORS.yellow, fontColor: COLORS.yellowDark };
  return { text: '✓ OK', bgColor: COLORS.green, fontColor: COLORS.greenDark };
};

/**
 * Calcula el stock sin incluir el almacén de inspección (121).
 * @param {Object} producto - Producto enriquecido con almacenes_venta[]
 * @returns {number} stock disponible sin 121
 */
function stockSinInspeccion(producto) {
  if (!producto.almacenes_venta || producto.almacenes_venta.length === 0) {
    return producto.stock ?? 0;
  }
  return producto.almacenes_venta
    .filter((a) => a.almacen !== INSPECCION_ALMACEN)
    .reduce((sum, a) => sum + a.disponible, 0);
}

/**
 * Calcula el stock con o sin el almacén 121 según el flag.
 * @param {Object} producto - Producto enriquecido
 * @param {boolean} includeInspeccion - Si true, incluye el 121 en el total
 * @returns {number} stock a usar para cálculos
 */
function getStockParaCalculo(producto, includeInspeccion) {
  return includeInspeccion ? (producto.stock ?? 0) : stockSinInspeccion(producto);
}

/**
 * Crea la hoja "Resumen" con KPIs, totales por categoría y línea.
 * Migrado de createResumenSheet() en generate-reports-excel.cjs.
 */
function createResumenSheet(ws, productos, includeInspeccion) {
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

  // ===== KPI CARDS =====
  const totalUnidades = productos.reduce(
    (acc, p) => acc + getStockParaCalculo(p, includeInspeccion), 0
  );
  const totalCodigos = productos.length;

  const productosConStock = productos.filter(
    (p) => getStockParaCalculo(p, includeInspeccion) > 0
  );
  const productosSinStock = productos.filter(
    (p) => getStockParaCalculo(p, includeInspeccion) === 0
  );
  const productosBajoStock = productos.filter((p) => {
    const stock = getStockParaCalculo(p, includeInspeccion);
    const bx = Math.floor(stock / (p.un_bx || 1));
    return bx > 0 && bx < 10;
  });
  const productosOk = totalCodigos - productosSinStock.length - productosBajoStock.length;

  const kpiRows = [
    { label: '✅ CON STOCK', value: productosOk, bg: COLORS.greenDark, color: COLORS.white },
    { label: '⚠️ BAJO STOCK', value: productosBajoStock.length, bg: COLORS.yellowDark, color: COLORS.white },
    { label: '❌ SIN STOCK', value: productosSinStock.length, bg: COLORS.redDark, color: COLORS.white },
  ];

  let rowIdx = 4;

  // KPI Row 1: Total codes and units
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

  // ===== POR CATEGORÍA =====
  rowIdx += 1;
  ws.mergeCells(`A${rowIdx}:D${rowIdx}`);
  ws.getCell(`A${rowIdx}`).value = '🏷️ POR CATEGORÍA';
  ws.getCell(`A${rowIdx}`).font = { bold: true, size: 12, color: { argb: COLORS.white } };
  ws.getCell(`A${rowIdx}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.dark } };
  ws.getCell(`A${rowIdx}`).alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(rowIdx).height = 26;

  const catHeaderRow = rowIdx + 1;
  ['Categoría', 'Códigos', 'Stock', '%'].forEach((h, i) => {
    const col = String.fromCharCode(65 + i);
    const cell = ws.getCell(`${col}${catHeaderRow}`);
    cell.value = h;
    cell.font = { bold: true, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    cell.alignment = { horizontal: 'center' };
  });

  const categorias = {};
  productos.forEach((p) => {
    if (!categorias[p.categoria]) categorias[p.categoria] = { codigos: 0, stock: 0 };
    categorias[p.categoria].codigos++;
    categorias[p.categoria].stock += getStockParaCalculo(p, includeInspeccion);
  });

  let catRow = catHeaderRow + 1;
  Object.entries(categorias).forEach(([cat, data], idx) => {
    const pct = totalUnidades > 0 ? ((data.stock / totalUnidades) * 100).toFixed(1) : '0';
    const color = COLORS.lineColors[idx % COLORS.lineColors.length];

    const cellCat = ws.getCell(`A${catRow}`);
    cellCat.value = cat;
    cellCat.font = { bold: true, size: 10, color: { argb: color } };

    ws.getCell(`B${catRow}`).value = data.codigos;
    ws.getCell(`B${catRow}`).alignment = { horizontal: 'center' };

    ws.getCell(`C${catRow}`).value = data.stock;
    ws.getCell(`C${catRow}`).alignment = { horizontal: 'right' };

    ws.getCell(`D${catRow}`).value = pct + '%';
    ws.getCell(`D${catRow}`).alignment = { horizontal: 'center' };
    ws.getCell(`D${catRow}`).font = { bold: true, color: { argb: color } };
    catRow++;
  });

  // ===== POR LÍNEA =====
  const lineaStart = catRow + 2;
  ws.mergeCells(`A${lineaStart}:D${lineaStart}`);
  ws.getCell(`A${lineaStart}`).value = '📂 POR LÍNEA';
  ws.getCell(`A${lineaStart}`).font = { bold: true, size: 12, color: { argb: COLORS.white } };
  ws.getCell(`A${lineaStart}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.dark } };
  ws.getCell(`A${lineaStart}`).alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(lineaStart).height = 26;

  const lineaHeaderRow = lineaStart + 1;
  ['Línea', 'Códigos', 'Stock', '%'].forEach((h, i) => {
    const col = String.fromCharCode(65 + i);
    const cell = ws.getCell(`${col}${lineaHeaderRow}`);
    cell.value = h;
    cell.font = { bold: true, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    cell.alignment = { horizontal: 'center' };
  });

  const lineas = {};
  productos.forEach((p) => {
    const id = p.linea_id || p.linea || 'Sin Línea';
    if (!lineas[id]) lineas[id] = { codigos: 0, stock: 0 };
    lineas[id].codigos++;
    lineas[id].stock += getStockParaCalculo(p, includeInspeccion);
  });

  let lineaRow = lineaHeaderRow + 1;
  Object.entries(lineas).forEach(([lin, data], idx) => {
    const pct = totalUnidades > 0 ? ((data.stock / totalUnidades) * 100).toFixed(1) : '0';
    const color = COLORS.lineColors[idx % COLORS.lineColors.length];

    ws.getCell(`A${lineaRow}`).value = lin;
    ws.getCell(`A${lineaRow}`).font = { bold: true, size: 10, color: { argb: color } };

    ws.getCell(`B${lineaRow}`).value = data.codigos;
    ws.getCell(`B${lineaRow}`).alignment = { horizontal: 'center' };

    ws.getCell(`C${lineaRow}`).value = data.stock;
    ws.getCell(`C${lineaRow}`).alignment = { horizontal: 'right' };

    ws.getCell(`D${lineaRow}`).value = pct + '%';
    ws.getCell(`D${lineaRow}`).alignment = { horizontal: 'center' };
    ws.getCell(`D${lineaRow}`).font = { bold: true, color: { argb: color } };
    lineaRow++;
  });

  // Pie de página
  ws.mergeCells(`A${lineaRow + 2}:D${lineaRow + 2}`);
  ws.getCell(`A${lineaRow + 2}`).value = 'StockPulse - Inteligencia CIPSA';
  ws.getCell(`A${lineaRow + 2}`).font = { italic: true, size: 9, color: { argb: COLORS.grayText } };
  ws.getCell(`A${lineaRow + 2}`).alignment = { horizontal: 'center' };
}

/**
 * Crea la hoja de datos detallados con columnas de stock, cajas, almacenes.
 * ORDEN por orden maestro (orden) + índice local #.
 */
function createDataSheet(ws, titulo, productos, includeInspeccion, includePredespacho) {
  const headers = [
    { header: '#', key: 'item', width: 5 },
    { header: 'Código', key: 'sku', width: 12 },
    { header: 'Producto', key: 'nombre', width: 45 },
    { header: 'Línea', key: 'linea', width: 18 },
    { header: 'Un/Caja', key: 'unBx', width: 10 },
  ];

  // ✅ Columna 121 (Inspección) — SOLO si el checkbox está activado
  if (includeInspeccion) {
    headers.push({ header: '121 (Inspección)', key: 'inspeccion', width: 16 });
  }

  headers.push({ header: 'Stock', key: 'stock', width: 10 });
  headers.push({ header: 'Cajas', key: 'bx', width: 8 });

  if (includePredespacho) {
    headers.push({ header: 'Predespacho', key: 'predespacho', width: 12 });
  }

  headers.push({ header: 'Estado', key: 'estado', width: 12 });

  headers.push({ header: 'Orden', key: 'orden', width: 8 });
  headers.push({ header: 'Línea ID', key: 'lineaId', width: 10 });

  ws.columns = headers;
  ws.autoFilter = `A1:${String.fromCharCode(64 + headers.length)}1`;
  ws.views = [{ state: 'frozen', ySplit: 1 }];

  const headerRow = ws.getRow(1);
  headerRow.height = 32;
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.primary } };
    cell.font = { bold: true, size: 11, color: { argb: COLORS.white } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { bottom: { style: 'medium', color: { argb: COLORS.accent } } };
  });

  productos.forEach((p, index) => {
    const stockBase = getStockParaCalculo(p, includeInspeccion);
    const bx = Math.floor(stockBase / (p.un_bx || 1));
    const inspeccionStock = p.almacenes_venta?.find((a) => a.esInspeccion)?.disponible ?? 0;
    const predespacho = p.almacenes_venta
      ? p.almacenes_venta.reduce((sum, a) => sum + (a.predespacho || 0), 0)
      : p.predespacho || 0;

    const estado = getEstado(bx);

    const rowData = {
      item: index + 1,
      sku: p.sku,
      nombre: p.nombre,
      linea: p.linea,
      unBx: p.un_bx,
      stock: p.almacenes_venta
        ? p.almacenes_venta.reduce((sum, a) => sum + a.disponible, 0)
        : stockBase,
      bx: bx,
      orden: p.orden || 0,
      lineaId: p.linea_id || '',
    };

    if (includeInspeccion) {
      rowData.inspeccion = inspeccionStock;
    }

    rowData.stock = p.almacenes_venta
      ? p.almacenes_venta.reduce((sum, a) => sum + a.disponible, 0)
      : stockBase;
    rowData.bx = bx;
    if (includePredespacho) rowData.predespacho = predespacho;
    rowData.estado = estado.text;
    rowData.orden = p.orden || 0;
    rowData.lineaId = p.linea_id || '';

    const row = ws.addRow(rowData);

    // Color coding para Stock, Cajas, Estado, Inspección
    const coloredKeys = includeInspeccion
      ? ['inspeccion', 'stock', 'bx', 'estado']
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
 * Categorías incluidas cuando se selecciona "TODOS".
 * Representa los tres canales de negocio: Representadas, Vinifan, Viniball.
 */
const CATEGORIAS_TODOS = ['REPRESENTADAS', 'VINIFAN', 'VINIBALL'];

/**
 * Genera un reporte XLSX completo en memoria (browser).
 * Reemplaza generate-reports-excel.cjs.
 *
 * Hojas por línea usando linea_id (01, 78, AD, 85, etc.)
 * Cada hoja: ordenada por orden maestro + índice local #.
 * Resumen: hipervínculos a cada hoja de línea.
 */
export async function generateReportXLSX(categoria, productos, options = {}, lastUpdated = '') {
  const { includeInspeccion = false, includePredespacho = true } = options;

  if (!ExcelJS) {
    throw new Error('[report-generator] ExcelJS no está cargado. Asegúrate de que exceljs.min.js se haya cargado.');
  }

  const filtered = categoria === 'TODOS'
    ? productos.filter((p) => CATEGORIAS_TODOS.includes(p.categoria))
    : productos.filter((p) => p.categoria === categoria);

  // Ordenar por orden maestro (orden)
  filtered.sort((a, b) => (a.orden || 0) - (b.orden || 0));

  filtered.forEach((p) => { if (lastUpdated) p.lastUpdated = lastUpdated; });

  const wb = new ExcelJS.Workbook();
  wb.properties.title = `StockPulse - ${categoria}`;
  wb.properties.created = new Date();

  // Hoja 1: Resumen (KPIs)
  const wsResumen = wb.addWorksheet('Resumen');
  createResumenSheet(wsResumen, filtered, includeInspeccion);

  // Agrupar por linea_id y crear una hoja por cada línea
  const lineasPorId = {};
  filtered.forEach((p) => {
    const id = p.linea_id || 'ZZ';
    if (!lineasPorId[id]) lineasPorId[id] = { name: p.linea || 'Sin Línea', items: [] };
    lineasPorId[id].items.push(p);
  });

  // Primero: crear todas las hojas de línea y guardar los nombres
  const sheetNames = [];
  Object.entries(lineasPorId).forEach(([lineaId, data]) => {
    const nombreCorto = data.name.replace(/\s+/g, '_').toLowerCase().substring(0, 25);
    const sheetName = `${lineaId}_${nombreCorto}`.substring(0, 31);
    sheetNames.push({ id: lineaId, name: data.name, sheetName });
    const wsLinea = wb.addWorksheet(sheetName);
    createDataSheet(wsLinea, data.name, data.items, includeInspeccion, includePredespacho);
  });

  // Segundo: agregar hipervínculos en el resumen (después de la sección POR LÍNEA)
  // Encontrar la última fila con datos en el resumen
  let lastDataRow = 1;
  wsResumen.eachRow((row, rowNumber) => {
    if (row.getCell(1).value !== null) lastDataRow = rowNumber;
  });
  const linkStartRow = lastDataRow + 3;

  // Título de sección
  wsResumen.getCell(`A${linkStartRow}`).value = '🔗 IR A HOJA POR LÍNEA';
  wsResumen.getCell(`A${linkStartRow}`).font = { bold: true, size: 12, color: { argb: COLORS.white } };
  wsResumen.getCell(`A${linkStartRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.dark } };
  wsResumen.mergeCells(`A${linkStartRow}:D${linkStartRow}`);
  wsResumen.getCell(`A${linkStartRow}`).alignment = { vertical: 'middle', horizontal: 'center' };
  wsResumen.getRow(linkStartRow).height = 26;

  // Encabezados
  const hdrRow = linkStartRow + 1;
  ['ID', 'Línea', 'Hoja', 'Items'].forEach((h, i) => {
    const col = String.fromCharCode(65 + i);
    const cell = wsResumen.getCell(`${col}${hdrRow}`);
    cell.value = h;
    cell.font = { bold: true, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    cell.alignment = { horizontal: 'center' };
  });

  // Filas con hipervínculos
  sheetNames.forEach((s, idx) => {
    const r = hdrRow + 1 + idx;
    wsResumen.getCell(`A${r}`).value = s.id;
    wsResumen.getCell(`A${r}`).font = { bold: true, size: 10 };
    wsResumen.getCell(`A${r}`).alignment = { horizontal: 'center' };

    wsResumen.getCell(`B${r}`).value = s.name;
    wsResumen.getCell(`B${r}`).font = { size: 10 };
    wsResumen.getCell(`B${r}`).alignment = { horizontal: 'left' };

    wsResumen.getCell(`C${r}`).value = s.sheetName;
    wsResumen.getCell(`C${r}`).font = { size: 10, color: { argb: COLORS.secondary }, underline: true };
    wsResumen.getCell(`C${r}`).hyperlink = { target: `'${s.sheetName}'!A1`, tooltip: `Ir a ${s.sheetName}` };

    wsResumen.getCell(`D${r}`).value = lineasPorId[s.id]?.items.length || 0;
    wsResumen.getCell(`D${r}`).alignment = { horizontal: 'center' };
  });

  // Browser: writeBuffer → Blob
  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
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
