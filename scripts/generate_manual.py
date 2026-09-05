"""
StockPulse CIPSA - Manual Técnico v4 (Enhanced Design)
Mejoras: jerarquía tipográfica, espaciado, profundidad, iconografía SVG
"""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn
import os

# Paleta corporativa CIPSA/G360
C = {
    'primary': RGBColor(0x00, 0xD0, 0x84),      # Verde accent
    'dark': RGBColor(0x0F, 0x17, 0x2A),          # Fondo principal
    'surface': RGBColor(0x1E, 0x29, 0x3B),       # Superficie cards
    'text': RGBColor(0xF0, 0xF4, 0xF8),          # Texto principal
    'muted': RGBColor(0x94, 0xA3, 0xB8),         # Texto secundario
    'accent': RGBColor(0x0E, 0x74, 0x90),        # Azul secundario
    'white': RGBColor(0xFF, 0xFF, 0xFF),
    'border': RGBColor(0x33, 0x41, 0x55),
}

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)

def add_text(p, text, size_pt, bold=False, color=None, align=None, spacing_before=0, spacing_after=0):
    """Helper para agregar texto formateado"""
    p.text = text
    for run in p.runs:
        run.font.size = Pt(size_pt)
        run.font.bold = bold
        if color:
            run.font.color.rgb = color
        run.font.name = 'Segoe UI'
    if align:
        p.alignment = align
    if spacing_before:
        p.space_before = Pt(spacing_before)
    if spacing_after:
        p.space_after = Pt(spacing_after)

def add_para(tf, text, size_pt=14, bold=False, color=None, level=0, spacing_before=4, spacing_after=0):
    """Agrega un párrafo con formato"""
    p = tf.add_paragraph() if tf.paragraphs[0].text else tf.paragraphs[0]
    add_text(p, text, size_pt, bold, color, spacing_before=spacing_before, spacing_after=spacing_after)
    p.level = level
    return p

def set_bg(slide, color):
    """Fondo completo"""
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, SLIDE_W, SLIDE_H)
    bg.fill.solid()
    bg.fill.fore_color.rgb = color
    bg.line.fill.background()
    spTree = slide.shapes._spTree
    sp = bg._element
    spTree.remove(sp)
    spTree.insert(2, sp)

def add_accent_line(slide, y, width=2.0):
    """Línea decorativa accent"""
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.5), y, Inches(width), Inches(0.04))
    line.fill.solid()
    line.fill.fore_color.rgb = C['primary']
    line.line.fill.background()

def add_title_slide(prs, title, subtitle=""):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(slide, C['dark'])
    
    # Logo accent bar
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.5), Inches(0.4), Inches(0.08), Inches(0.8))
    bar.fill.solid()
    bar.fill.fore_color.rgb = C['primary']
    bar.line.fill.background()
    
    # Logo text
    lb = slide.shapes.add_textbox(Inches(0.7), Inches(0.45), Inches(1.5), Inches(0.5))
    add_text(lb.text_frame.paragraphs[0], "G360", 20, True, C['primary'])
    
    # Main title
    tb = slide.shapes.add_textbox(Inches(0.5), Inches(2.5), Inches(12.333), Inches(1.2))
    add_text(tb.text_frame.paragraphs[0], title, 48, True, C['text'])
    
    # Subtitle
    if subtitle:
        sb = slide.shapes.add_textbox(Inches(0.5), Inches(3.9), Inches(12.333), Inches(0.8))
        add_text(sb.text_frame.paragraphs[0], subtitle, 22, False, C['muted'])
    
    # Bottom accent
    bottom = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.5), Inches(6.8), Inches(3), Inches(0.04))
    bottom.fill.solid()
    bottom.fill.fore_color.rgb = C['primary']
    bottom.line.fill.background()
    
    # Footer
    fb = slide.shapes.add_textbox(Inches(0.5), Inches(6.9), Inches(12.333), Inches(0.4))
    add_text(fb.text_frame.paragraphs[0], "CIPSA · Intelligence Division", 12, False, C['muted'], align=PP_ALIGN.RIGHT)
    return slide

def add_section_slide(prs, section_title):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(slide, C['dark'])
    
    # Large accent line
    add_accent_line(slide, Inches(2.6), 2.5)
    
    # Title
    tb = slide.shapes.add_textbox(Inches(0.5), Inches(2.2), Inches(12.333), Inches(1))
    add_text(tb.text_frame.paragraphs[0], section_title, 40, True, C['text'])
    return slide

def add_content_slide(prs, title, items, top=1.0, height=5.8):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(slide, C['dark'])
    
    # Title with accent
    tb = slide.shapes.add_textbox(Inches(0.5), Inches(0.25), Inches(12.333), Inches(0.6))
    add_text(tb.text_frame.paragraphs[0], title, 28, True, C['text'])
    
    # Accent line under title
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.5), Inches(0.85), Inches(1.5), Inches(0.03))
    line.fill.solid()
    line.fill.fore_color.rgb = C['primary']
    line.line.fill.background()
    
    # Content
    cb = slide.shapes.add_textbox(Inches(0.5), Inches(top), Inches(12.333), Inches(height))
    tf = cb.text_frame
    tf.word_wrap = True
    
    for i, item in enumerate(items):
        p = tf.add_paragraph() if i > 0 else tf.paragraphs[0]
        
        if item.startswith("##"):
            add_text(p, item[2:].strip(), 18, True, C['primary'], spacing_before=14, spacing_after=4)
        elif item.startswith("•"):
            add_text(p, "▸ " + item[1:].strip(), 14, False, C['text'], spacing_before=5, spacing_after=2)
        elif item.startswith("  -"):
            add_text(p, "  " + item.strip(), 12, False, C['muted'], spacing_before=2, spacing_after=1)
        elif item.startswith("> "):
            add_text(p, "「 " + item[2:].strip() + " 」", 12, False, C['primary'], spacing_before=3, spacing_after=3)
        elif item == "":
            add_text(p, "", 6, False, C['text'], spacing_before=4, spacing_after=4)
        else:
            add_text(p, item, 14, False, C['text'], spacing_before=5, spacing_after=2)
    
    return slide

def add_image_slide(prs, title, caption=""):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(slide, C['dark'])
    
    # Title
    tb = slide.shapes.add_textbox(Inches(0.5), Inches(0.25), Inches(12.333), Inches(0.6))
    add_text(tb.text_frame.paragraphs[0], title, 28, True, C['text'])
    
    # Line
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.5), Inches(0.85), Inches(1.5), Inches(0.03))
    line.fill.solid()
    line.fill.fore_color.rgb = C['primary']
    line.line.fill.background()
    
    # Placeholder
    ph = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(1.2), Inches(12.1), Inches(5.6))
    ph.fill.solid()
    ph.fill.fore_color.rgb = C['surface']
    ph.line.color.rgb = C['border']
    ph.line.width = Pt(1.5)
    
    tf = ph.text_frame
    tf.word_wrap = True
    add_text(tf.paragraphs[0], "[ CAPTURA DE PANTALLA ]", 24, True, C['muted'], align=PP_ALIGN.CENTER, spacing_before=20)
    p2 = tf.add_paragraph()
    add_text(p2, caption, 12, False, C['muted'], align=PP_ALIGN.CENTER)
    return slide

def main():
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H
    
    # 1: PORTADA
    add_title_slide(prs, "StockPulse CIPSA", "Manual Técnico del Sistema de Reportes de Stock")
    
    # 2: INDICE
    add_content_slide(prs, "Contenido", [
        "## Arquitectura del Sistema",
        "• Frontend PWA (Lit Web Components)",
        "• Backend API (FastAPI + Render)",
        "• Flujo de datos y capas de caché",
        "",
        "## Categorías de Negocio",
        "• VINIBALL, VINIFAN, REPRESENTADAS",
        "• Mapeo automático por línea",
        "",
        "## Estados de Stock",
        "• OK, BAJO, AGOTADO",
        "• Cálculo por cajas (bx) y unidades",
        "",
        "## Funcionalidades",
        "• Dashboard en tiempo real",
        "• Búsqueda fuzzy con Fuse.js",
        "• Reportes XLSX exportables",
        "• Alertas de stock crítico",
        "",
        "## Operación",
        "• Descarga desde appweb.cipsa.com.pe",
        "• Enriquecimiento con catálogo maestro",
        "• Ventana horaria: Lun-Sáb 07:00-22:59"
    ])
    
    # 3: SECCIÓN - Arquitectura
    add_section_slide(prs, "Arquitectura del Sistema")
    
    # 4: COMPONENTES
    add_content_slide(prs, "Componentes Principales", [
        "## Frontend — GitHub Pages",
        "• g360-stock-reporter-lit (Lit 3 PWA)",
        "• Service Worker para respaldo offline",
        "• Cache 3 capas: memoria → session → local",
        "",
        "## Backend — Render",
        "• g360-stock-api (FastAPI + Python)",
        "• Fuente: appweb.cipsa.com.pe:8054",
        "• Enriquecimiento automático con catálogo",
        "• TTL cache: 15 minutos",
        "",
        "## Catálogo Maestro",
        "• g360-master-data (JSON alojado en GitHub)",
        "• Campos: SKU, descripción, un_bx, peso, líneas",
        "• Auto-carga al iniciar el servicio"
    ])
    
    # 5: DIAGRAMA
    add_image_slide(prs, "Diagrama de Flujo de Datos", "Captura del diagrama de arquitectura")
    
    # 6: FUENTES
    add_content_slide(prs, "Fuentes de Datos (appweb)", [
        "## Appweb 1 — General",
        "• Almacenes: VES, 40, 118, 121, 122, 129",
        "• Stock de venta principal",
        "",
        "## Appweb 2 — Sucursales",
        "• Almacenes: S1, S2, S3, S5, S6, S9, S11, S14, S17",
        "• Datos consolidados regionales",
        "",
        "## Clasificación de Almacenes",
        "• Venta: VES, 40, 121, 122, 129 → cuentan para stock comercial",
        "• Mktd: 118, S* → no cuentan para venta (solo info)"
    ])
    
    # 7: SECCIÓN - Categorías
    add_section_slide(prs, "Categorías de Negocio")
    
    # 8: LINEAS
    add_content_slide(prs, "Mapeo Línea → Categoría", [
        "## Reglas de Asignación Automática",
        "• VINIBALL → líneas: 01, MA, 14, AD",
        "• VINIFAN → líneas: 02, 09, 11, 72-79, CE, CF",
        "• INDUMENTARIA → líneas: 57, 52",
        "• REPRESENTADAS → línea: 85",
        "• PUBLICIDAD → líneas: 80, 81",
        "",
        "## Proceso de Normalización",
        "• Entrada: '0179 - ACCESORIOS' del reporte appweb",
        "• Normalizado: '79 - ACCESORIOS' (se elimina prefijo '01')",
        "• Código '79' → categoría asignada: VINIFAN",
        "• SKUs sin línea válida → categoría 'OTROS'"
    ])
    
    # 9: SECCIÓN - Estados
    add_section_slide(prs, "Estados de Stock")
    
    # 10: CALCULO
    add_content_slide(prs, "Cálculo de Estado", [
        "## Fórmula Principal",
        "• bx = Math.floor(stock_disponible / un_bx)",
        "> Donde: stock_disponible = suma de 'disponible' en almacenes de venta",
        "",
        "## Definición de Estados",
        "• OK → bx >= 10 (10 o más cajas completas)",
        "• BAJO → 1 <= bx < 10 (1 a 9 cajas)",
        "• AGOTADO → bx == 0 (sin cajas completas)",
        "",
        "## Casos Particulares",
        "• un_bx <= 1: SKU vendido por unidad, muestra 'N u'",
        "• Stock solo en mktd (ej. 118): AGOTADO en venta",
        "• Inspección (121): opcional incluir en reportes"
    ])
    
    # 11: DASHBOARD
    add_image_slide(prs, "Dashboard Principal", "Captura del panel de estado y KPIs")
    
    # 12: SECCIÓN - Búsqueda
    add_section_slide(prs, "Búsqueda Avanzada")
    
    # 13: FUSE
    add_content_slide(prs, "Motor de Búsqueda (Fuse.js)", [
        "## Campos Indexados con Pesos",
        "• SKU (peso: 2.0) — coincidencia exacta prioritaria",
        "• Nombre corto (peso: 1.5) — nombre abreviado",
        "• Descripción completa (peso: 1.0)",
        "• Keywords (peso: 0.6) — atributos: color, tipo, marca",
        "• EAN13 (peso: 0.8) — código de barras",
        "• Línea (peso: 0.5) — ACCESORIOS, PELOTAS, etc.",
        "• Categoría (peso: 0.5) — VINIFAN, VINIBALL, etc.",
        "",
        "## Configuración",
        "• Threshold: 0.3 (tolerante a errores de tipeo)",
        "• Mínimo: 2 caracteres para iniciar búsqueda"
    ])
    
    # 14: VOZ
    add_content_slide(prs, "Búsqueda por Voz", [
        "## Características Técnicas",
        "• Web Speech API (SpeechRecognition)",
        "• Idioma: es-PE (Español Perú)",
        "• Interim results para feedback en tiempo real",
        "",
        "## Normalización Inteligente",
        "• Convierte números hablados a dígitos:",
        "> 'cero uno uno cero uno nueve' → '011019'",
        "• Elimina ruido: sku, codigo, busca, artículos",
        "• Quita tildes y puntuación",
        "• Detecta si es código (todo dígitos) vs nombre",
        "",
        "## Ejemplos de Uso",
        "• 'buscar tijera vinifan pastel' → busca por nombre",
        "• 'sku cero uno uno cero uno nueve' → busca SKU directo"
    ])
    
    # 15: SECCIÓN - Reportes
    add_section_slide(prs, "Reportes Exportables")
    
    # 16: TIPOS
    add_content_slide(prs, "Tipos de Reporte XLSX", [
        "## Reporte Completo (Pulso)",
        "• Hoja Resumen: KPIs, totales por categoría y línea",
        "• Hojas por línea: datos detallados agrupados",
        "• Hoja Sin Catálogo: SKUs sin estado de línea",
        "• Opciones: incluir inspección (121), incluir secundarios",
        "",
        "## Reporte de Estado",
        "• ConStock: SKUs con bx >= 10",
        "• BajoStock: SKUs con 1 <= bx < 10",
        "• SinStock: SKUs con bx = 0 (agotados)",
        "• SinCatalogo: SKUs fuera del catálogo maestro",
        "",
        "## Columnas del Reporte",
        "SKU | Nombre | Línea | Categoría | Cajas | Disponible venta | Estado"
    ])
    
    # 17: ALERTAS
    add_content_slide(prs, "Sistema de Alertas", [
        "## Tipos de Alerta",
        "• Crítico (rojo): bx = 0, SKU completamente agotado",
        "• Advertencia (amarillo): 1 <= bx < 10, stock bajo",
        "",
        "## Criterios de Generación",
        "• Solo SKUs con estado_linea definido (catálogo)",
        "• Ordenados: críticos primero, luego por bx ascendente",
        "• Contador en badge de navegación",
        "",
        "## Panel de Alertas",
        "• Filtros: Todos, Sin Stock, Bajo Stock",
        "• Lista expandible con detalle por SKU",
        "• Acceso rápido desde navegación principal"
    ])
    
    # 18: SECCIÓN - Seguridad
    add_section_slide(prs, "Seguridad y Acceso")
    
    # 19: AUTH
    add_content_slide(prs, "Modelo de Autenticación", [
        "## Dos Niveles de Clave",
        "• S1_API_KEY: Administrativa (upload, catálogo, resumen)",
        "• S1_READ_API_KEY: Lectura para frontend estático",
        "",
        "## Endpoints y Permisos",
        "• GET /api/v1/stock → requiere READ_KEY",
        "• GET /api/v1/health → requiere READ_KEY",
        "• POST /api/v1/catalog/upload → requiere ADMIN_KEY",
        "• GET /api/v1/resumen → requiere ADMIN_KEY",
        "",
        "## Controles Operativos",
        "• CORS restringido a github.io + localhost",
        "• Rate limit: 60 requests/minute por IP",
        "• La clave de lectura puede estar en el frontend (pública)"
    ])
    
    # 20: SECCIÓN - Despliegue
    add_section_slide(prs, "Despliegue y Operación")
    
    # 21: INFRA
    add_content_slide(prs, "Infraestructura", [
        "## Frontend — GitHub Pages",
        "• Deploy automático desde branch main",
        "• Build: Vite + Lit Web Components",
        "• URL: https://carloscus.github.io/g360-stock-reporter/",
        "",
        "## Backend — Render",
        "• Servicio gratuito con auto-scaling",
        "• URL: https://g360-stock-api.onrender.com",
        "• Keep-alive cada 5 min para mantener activo",
        "",
        "## Ventana Operativa",
        "• Lunes a Sábado, 07:00 - 22:59 (hora Lima)",
        "• Domingo y madrugada: no regenera reporte",
        "• Cache sirve últimos datos válidos"
    ])
    
    # 22: INSTALACION
    add_content_slide(prs, "Instalación y Desarrollo Local", [
        "## Frontend",
        "• npm install && npm run dev (puerto 3000)",
        "• npm run build → genera dist/",
        "",
        "## Backend",
        "• cd g360-stock-api && pip install -r requirements.txt",
        "• uvicorn app.main:app --reload --port 8000",
        "",
        "## Variables de Entorno (.env)",
        "• S1_SOURCE1_URL, S1_SOURCE2_URL (appweb)",
        "• S1_CACHE_TTL_SEGUNDOS (default: 900)",
        "• S1_API_KEY, S1_READ_API_KEY (separar claves)",
        "• S1_CORS_ORIGINS"
    ])
    
    # 23: SECCIÓN - Troubleshooting
    add_section_slide(prs, "Troubleshooting")
    
    # 24: PROBLEMAS
    add_content_slide(prs, "Problemas Comunes y Soluciones", [
        "## Cache Stale (datos viejos)",
        "• Síntoma: datos no se actualizan aunque cambió el API",
        "• Causa: localStorage TTL de 7 días",
        "• Solución: Forzar refresh en UI o limpiar storage",
        "",
        "## Categoría OTROS (esperado VINIFAN/VINIBALL)",
        "• Síntoma: SKU aparece en categoría genérica",
        "• Causa: código de línea no mapeado en CATEGORIAS",
        "• Solución: Agregar código al dict de categorías en constants.py",
        "",
        "## Stock 0 con existencias en almacén",
        "• Síntoma: SKU con stock en 118 muestra 0 disponible",
        "• Causa: 118 es tipo 'mktd', no cuenta para venta",
        "• Solución: Verificar tipo de almacén en el backend",
        "",
        "## API 403 Forbidden",
        "• Verificar X-API-Key en header (no query string)",
        "• Confirmar que la key coincide con S1_READ_API_KEY"
    ])
    
    # 25: FUTURO
    add_content_slide(prs, "Mejoras Futuras Planeadas", [
        "• Integración con ERP para rotación de SKUs",
        "• Alertas push y notificaciones en tiempo real",
        "• Reportes filtrados por almacén específico",
        "• Gráficos de tendencia histórica de stock",
        "• Módulo de reposición automática sugerida",
        "• App nativa móvil (React Native / Flutter)",
        "• Dashboard ejecutivo con KPIs avanzados"
    ], top=1.1, height=5.5)
    
    # 26: CIERRE
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(slide, C['dark'])
    
    # Center accent
    add_accent_line(slide, Inches(3.5), 2.0)
    
    # Title
    tb = slide.shapes.add_textbox(Inches(0.5), Inches(2.2), Inches(12.333), Inches(1.0))
    add_text(tb.text_frame.paragraphs[0], "StockPulse CIPSA", 44, True, C['text'], align=PP_ALIGN.CENTER)
    
    # Subtitle
    sb = slide.shapes.add_textbox(Inches(0.5), Inches(3.5), Inches(12.333), Inches(0.6))
    add_text(sb.text_frame.paragraphs[0], "Inteligencia de Stock en Tiempo Real", 20, False, C['muted'], align=PP_ALIGN.CENTER)
    
    # Contact
    cb = slide.shapes.add_textbox(Inches(0.5), Inches(5.5), Inches(12.333), Inches(0.5))
    add_text(cb.text_frame.paragraphs[0], "¿Consultas? Contactar al equipo G360", 14, False, C['primary'], align=PP_ALIGN.CENTER)
    
    # Footer
    fb = slide.shapes.add_textbox(Inches(0.5), Inches(6.8), Inches(12.333), Inches(0.4))
    add_text(fb.text_frame.paragraphs[0], "g360-stock-reporter-lit · GitHub", 10, False, C['muted'], align=PP_ALIGN.RIGHT)
    
    # Save
    output_path = os.path.join(os.path.dirname(__file__), "StockPulse_Manual_Tecnico.pptx")
    prs.save(output_path)
    print(f"[OK] Manual técnico generado: {len(prs.slides)} slides")

if __name__ == "__main__":
    main()
