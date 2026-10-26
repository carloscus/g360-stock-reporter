/**
 * @file report-downloads.js
 * @description Punto único de descargas de la app: reporte primario
 *              (rápido/completo), estados, alertas, sin catálogo y 122.
 *              Carga `report-generator` de forma diferida para mantener el
 *              bundle inicial liviano (ExcelJS se carga dentro del generador).
 * @author @carloscus
 * @version 1.0.0
 */

async function generador() {
  return import('./report-generator.js');
}

const LABELS_ESTADO = {
  conStock: 'ConStock',
  bajoStock: 'BajoStock',
  sinStock: 'SinStock',
  sinCatalogo: 'SinCatalogo',
  alertas: 'Alertas',
};

/**
 * Genera y descarga el reporte primario de una categoría.
 * @returns {Promise<string>} nombre del archivo descargado
 */
export async function descargarReporte({
  categoria,
  perfil = 'rapido',
  linea = '',
  incluirNoVigentes = false,
  includeSecundarios = false,
  includeExport122 = false,
  productos,
  autor = null,
  lastUpdated = '',
}) {
  const { generateReportXLSX, downloadBlob, generarNombreArchivo } = await generador();
  const blob = await generateReportXLSX(
    categoria,
    productos,
    { perfil, linea, incluirNoVigentes, includeSecundarios, includeExport122, autor },
    lastUpdated,
  );
  const filename = generarNombreArchivo(categoria, perfil);
  downloadBlob(blob, filename);
  return filename;
}

/** Descarga rápida o completa de una categoría (árbol / menús). */
export async function descargarCategoria(categoria, { perfil = 'rapido', productos, autor = null, lastUpdated = '' } = {}) {
  return descargarReporte({ categoria, perfil, productos, autor, lastUpdated });
}

/** Descarga una hoja de estado (Con/Bajo/Sin/SinCatálogo/Alertas). */
export async function descargarEstado(tipo, productos) {
  const { generateEstadoXLSX, downloadBlob, generarNombreArchivo } = await generador();
  const blob = await generateEstadoXLSX(tipo, productos);
  const filename = generarNombreArchivo(LABELS_ESTADO[tipo] || 'Estado');
  downloadBlob(blob, filename);
  return filename;
}

/** Alias semántico para las alertas. */
export async function descargarAlertas(tipo, productos) {
  return descargarEstado(tipo, productos);
}

/** Hoja de SKUs fuera de catálogo. */
export async function descargarSinCatalogo(productos) {
  return descargarEstado('sinCatalogo', productos);
}

/** Hoja de stock del almacén 122 (Exportación). */
export async function descargar122(productos) {
  const { generateExport122XLSX, downloadBlob, generarNombreArchivo } = await generador();
  const blob = await generateExport122XLSX(productos);
  const filename = generarNombreArchivo('122_Exportacion');
  downloadBlob(blob, filename);
  return filename;
}
