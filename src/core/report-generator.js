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
 * Ordena productos por el campo `orden` del API (catálogo maestro).
 * Los ítems sin orden (0) van al final; dentro del mismo orden, por SKU.
 */
function sortByOrden(items) {
  return [...items].sort((a, b) => {
    const aOrd = a.orden || 0;
    const bOrd = b.orden || 0;
    if (aOrd === 0 && bOrd === 0) return a.sku.localeCompare(b.sku);
    if (aOrd === 0) return 1;
    if (bOrd === 0) return -1;
    return aOrd - bOrd;
  });
}

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
function createResumenSheet(ws, productos, includeInspeccion, autor = null) {
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
    if (!lineas[p.linea]) lineas[p.linea] = { codigos: 0, stock: 0 };
    lineas[p.linea].codigos++;
    lineas[p.linea].stock += getStockParaCalculo(p, includeInspeccion);
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
 */
function createDataSheet(ws, titulo, productos, includeInspeccion) {
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

  headers.push({ header: 'Disponible', key: 'stock', width: 10 });
  headers.push({ header: 'Cajas', key: 'bx', width: 8 });
  headers.push({ header: 'Estado', key: 'estado', width: 12 });

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
const estado = getEstado(bx);

    const rowData = {
      item: index + 1,
      sku: p.sku,
      nombre: p.nombre,
      linea: p.linea,
      unBx: p.un_bx,
    };

    if (includeInspeccion) {
      rowData.inspeccion = inspeccionStock;
    }

    rowData.stock = p.almacenes_venta
      ? p.almacenes_venta.reduce((sum, a) => sum + a.disponible, 0)
      : stockBase;
    rowData.bx = bx;
    rowData.estado = estado.text;

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
 * @param {string} categoria        - 'TODOS', 'VINIBALL', 'VINIFAN', 'REPRESENTADAS'
 * @param {Array}  productos        - productos enriquecidos (stock-service.js)
 * @param {Object} options          - { includeInspeccion, includeSecundarios }
 * @param {string} lastUpdated      - timestamp ISO del API
 * @returns {Promise<Blob>}        - Blob listo para descargar
 */
export async function generateReportXLSX(categoria, productos, options = {}, lastUpdated = '') {
  const { includeInspeccion = false, includeSecundarios = false, autor = null } = options;

  if (!ExcelJS) {
    throw new Error('[report-generator] ExcelJS no está cargado. Asegúrate de que exceljs.min.js se haya cargado.');
  }

  // Un producto pertenece al catálogo maestro cuando tiene estado de línea.
  const esCatalogo = (p) => (p.estado_linea || '').trim() !== '';

  // Los reportes descargados incluyen solo SKUs del catálogo maestro.
  // Los secundarios (sin estado de línea) van a la hoja "Sin Catálogo".
  const filtered = productos.filter((p) => {
    if (!esCatalogo(p)) return false;
    if (categoria === 'TODOS') return CATEGORIAS_TODOS.includes(p.categoria);
    return p.categoria === categoria;
  });

  filtered.forEach((p) => { if (lastUpdated) p.lastUpdated = lastUpdated; });

  const wb = new ExcelJS.Workbook();
  wb.properties.title = `StockPulse - ${categoria}`;
  wb.properties.created = new Date();
  if (autor) {
    wb.creator = `${autor.nombre}${autor.email ? ` <${autor.email}>` : ''}`;
    wb.lastModifiedBy = 'g360-stock-reporter';
  }

  // Hoja 1: Resumen (KPIs)
  const wsResumen = wb.addWorksheet('Resumen');
  createResumenSheet(wsResumen, filtered, includeInspeccion, autor);

  // Agrupar por línea y crear una hoja por cada línea
  const lineas = {};
  filtered.forEach((p) => {
    const linea = p.linea || 'Sin Línea';
    if (!lineas[linea]) lineas[linea] = [];
    lineas[linea].push(p);
  });

  Object.entries(lineas).forEach(([linea, items]) => {
    const sheetName = linea.substring(0, 31);
    const wsLinea = wb.addWorksheet(sheetName);
    createDataSheet(wsLinea, linea, sortByOrden(items), includeInspeccion);
  });

  // Hoja adicional: SKUs fuera de catálogo (solo categorías principales)
  if (includeSecundarios) {
    const secundarios = productos.filter(
      (p) => !esCatalogo(p) && CATEGORIAS_TODOS.includes(p.categoria)
    );
    if (secundarios.length > 0) {
      const wsSinCat = wb.addWorksheet('Sin Catálogo');
      createDataSheet(wsSinCat, 'Sin Catálogo', sortByOrden(secundarios), includeInspeccion);
    }
  }

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
