"""
StockPulse CIPSA - Manual Técnico v2
Generación de presentación PPTX con fuentes explícitas y diseño consistente
"""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
import os

# Colores corporativos G360/CIPSA
COLOR_PRIMARY = RGBColor(0x00, 0xD0, 0x84)    # Verde accent
COLOR_DARK = RGBColor(0x0F, 0x17, 0x2A)        # Fondo oscuro
COLOR_TEXT = RGBColor(0xF0, 0xF4, 0xF8)        # Texto claro
COLOR_MUTED = RGBColor(0x94, 0xA3, 0xB8)       # Texto secundario
COLOR_ACCENT = RGBColor(0x0E, 0x74, 0x90)      # Azul secundario

def add_text_to_para(paragraph, text, size_pt, bold=False, color=None, alignment=None):
    """Helper para agregar texto con formato explícito"""
    paragraph.text = text
    for run in paragraph.runs:
        run.font.size = Pt(size_pt)
        run.font.bold = bold
        if color:
            run.font.color.rgb = color
    if alignment:
        paragraph.alignment = alignment

def set_slide_bg(slide, color):
    """Fondo oscuro para slides"""
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg.fill.solid()
    bg.fill.fore_color.rgb = color
    bg.line.fill.background()
    spTree = slide.shapes._spTree
    sp = bg._element
    spTree.remove(sp)
    spTree.insert(2, sp)

def add_title_slide(prs, title, subtitle=""):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, COLOR_DARK)
    
    # Logo box
    logo = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.5), Inches(0.5), Inches(2), Inches(0.6))
    logo.fill.solid()
    logo.fill.fore_color.rgb = COLOR_PRIMARY
    logo.line.fill.background()
    tf = logo.text_frame
    add_text_to_para(tf.paragraphs[0], "G360", 20, True, RGBColor(0xFF, 0xFF, 0xFF))
    
    # Title
    tb = slide.shapes.add_textbox(Inches(0.5), Inches(2.8), Inches(12.333), Inches(1.2))
    add_text_to_para(tb.text_frame.paragraphs[0], title, 44, True, COLOR_TEXT)
    
    # Subtitle
    if subtitle:
        sb = slide.shapes.add_textbox(Inches(0.5), Inches(4.2), Inches(12.333), Inches(0.8))
        add_text_to_para(sb.text_frame.paragraphs[0], subtitle, 22, False, COLOR_MUTED)
    
    # Footer
    fb = slide.shapes.add_textbox(Inches(0.5), Inches(6.8), Inches(12.333), Inches(0.4))
    add_text_to_para(fb.text_frame.paragraphs[0], "CIPSA - Intelligence Division", 14, False, COLOR_MUTED, PP_ALIGN.RIGHT)
    return slide

def add_section_slide(prs, section_title):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, COLOR_DARK)
    
    # Accent line
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.5), Inches(3.0), Inches(2), Inches(0.06))
    line.fill.solid()
    line.fill.fore_color.rgb = COLOR_PRIMARY
    line.line.fill.background()
    
    # Title
    tb = slide.shapes.add_textbox(Inches(0.5), Inches(2.6), Inches(12), Inches(1))
    add_text_to_para(tb.text_frame.paragraphs[0], section_title, 40, True, COLOR_TEXT)
    return slide

def add_content_slide(prs, title, items):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, COLOR_DARK)
    
    # Title
    tb = slide.shapes.add_textbox(Inches(0.5), Inches(0.3), Inches(12.333), Inches(0.7))
    add_text_to_para(tb.text_frame.paragraphs[0], title, 28, True, COLOR_TEXT)
    
    # Content
    cb = slide.shapes.add_textbox(Inches(0.5), Inches(1.2), Inches(12.333), Inches(5.8))
    tf = cb.text_frame
    tf.word_wrap = True
    
    for i, item in enumerate(items):
        p = tf.add_paragraph() if i > 0 else tf.paragraphs[0]
        
        if item.startswith("##"):
            add_text_to_para(p, item[2:].strip(), 20, True, COLOR_PRIMARY)
            p.space_before = Pt(16)
        elif item.startswith("•"):
            add_text_to_para(p, "  " + item[1:].strip(), 16, False, COLOR_TEXT)
            p.space_before = Pt(6)
        elif item.startswith("  -"):
            add_text_to_para(p, "    " + item.strip(), 14, False, COLOR_MUTED)
            p.space_before = Pt(3)
        elif item.startswith("> "):
            add_text_to_para(p, item[2:].strip(), 14, False, RGBColor(0x00, 0xD0, 0x84))
            p.space_before = Pt(4)
        else:
            add_text_to_para(p, item, 16, False, COLOR_TEXT)
            p.space_before = Pt(6)
    
    return slide

def add_image_placeholder_slide(prs, title, caption=""):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, COLOR_DARK)
    
    tb = slide.shapes.add_textbox(Inches(0.5), Inches(0.3), Inches(12.333), Inches(0.7))
    add_text_to_para(tb.text_frame.paragraphs[0], title, 28, True, COLOR_TEXT)
    
    # Placeholder
    ph = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.3), Inches(11.733), Inches(5.2))
    ph.fill.solid()
    ph.fill.fore_color.rgb = RGBColor(0x1E, 0x29, 0x3B)
    ph.line.color.rgb = COLOR_PRIMARY
    ph.line.width = Pt(2)
    
    tf = ph.text_frame
    tf.word_wrap = True
    add_text_to_para(tf.paragraphs[0], "[CAPTURA DE PANTALLA]", 24, True, COLOR_MUTED, PP_ALIGN.CENTER)
    p2 = tf.add_paragraph()
    add_text_to_para(p2, caption, 14, False, COLOR_MUTED, PP_ALIGN.CENTER)
    return slide

def main():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    
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
        "• Mapeo por línea de producto",
        "",
        "## Estados de Stock",
        "• OK, BAJO, AGOTADO",
        "• Cálculo por cajas (bx) y unidades",
        "",
        "## Funcionalidades Principales",
        "• Dashboard y panel de estado",
        "• Búsqueda avanzada con Fuse.js",
        "• Reportes XLSX exportables",
        "• Alertas de stock crítico",
        "",
        "## Flujo de Operaciones",
        "• Descarga desde appweb",
        "• Enriquecimiento con catálogo maestro",
        "• Generación de reportes"
    ])
    
    # 3: ARQUITECTURA
    add_section_slide(prs, "Arquitectura del Sistema")
    
    # 4: COMPONENTES
    add_content_slide(prs, "Componentes Principales", [
        "## Frontend (GitHub Pages)",
        "• g360-stock-reporter-lit (Lit 3 PWA)",
        "• Service Worker para offline/respaldo",
        "• Cache de 3 capas: memoria → sessionStorage → localStorage",
        "",
        "## Backend (Render)",
        "• g360-stock-api (FastAPI + Python)",
        "• Fuente: appweb.cipsa.com.pe:8054",
        "• Enriquecimiento con catálogo maestro",
        "• TTL de caché: 15 minutos",
        "",
        "## Catálogo Maestro",
        "• g360-master-data (JSON)",
        "• Campos: SKU, descripción, un_bx, peso, líneas, categorías",
        "• Auto-carga desde GitHub en cada reinicio"
    ])
    
    # 5: DIAGRAMA
    add_image_placeholder_slide(prs, "Diagrama de Flujo de Datos", "Captura del diagrama arquitectura")
    
    # 6: FUENTES
    add_content_slide(prs, "Fuentes de Datos (appweb)", [
        "## Appweb 1 - General",
        "• Almacenes: VES, 40, 118, 121, 122, 129",
        "• Fuente principal de stock de venta",
        "",
        "## Appweb 2 - Sucursales",
        "• Almacenes: S1, S2, S3, S5, S6, S9, S11, S14, S17",
        "• Datos consolidados de sucursales",
        "",
        "## Tipo de Almacén",
        "• venta: VES, 40, 121 (inspección), 122, 129",
        "• mktd: 118, S* (sucursales)",
        "• Solo almacenes tipo 'venta' cuentan para el stock comercial"
    ])
    
    # 7: CATEGORÍAS
    add_section_slide(prs, "Categorías de Negocio")
    
    # 8: LINEAS Y CATEGORIAS
    add_content_slide(prs, "Lineas y Categorías", [
        "## Mapeo Automático por Código de Línea",
        "• VINIBALL → líneas: 01, MA, 14, AD",
        "• VINIFAN → líneas: 02, 09, 11, 72-79, CE, CF",
        "• INDUMENTARIA → líneas: 57, 52",
        "• REPRESENTADAS → línea: 85",
        "• PUBLICIDAD → líneas: 80, 81",
        "",
        "## Reglas de Asignación",
        "• El código de línea se extrae del reporte appweb",
        "• Normalización: '0179 - ACCESORIOS' → '79 - ACCESORIOS'",
        "• Código '79' → categoría VINIFAN",
        "• SKUs sin línea asignada → 'OTROS'"
    ])
    
    # 9: ESTADOS
    add_section_slide(prs, "Estados de Stock")
    
    # 10: CALCULO
    add_content_slide(prs, "Cálculo de Estado", [
        "## Fórmula de Cajas (bx)",
        "• bx = Math.floor(stock_disponible / un_bx)",
        "• stock_disponible = suma de 'disponible' en almacenes tipo 'venta'",
        "• un_bx = unidades por caja (del catálogo maestro)",
        "",
        "## Estados",
        "• OK → bx >= 10 (10 o más cajas completas)",
        "• BAJO → 1 <= bx < 10 (1 a 9 cajas)",
        "• AGOTADO → bx == 0 (sin cajas completas)",
        "",
        "## Casos Especiales",
        "• SKUs vendidos por unidad (un_bx <= 1): se muestra en unidades",
        "• Stock solo en mktd (ej. 118): aparece como AGOTADO en venta",
        "• Inspección (121): opcional incluir/excluir en reportes"
    ])
    
    # 11: DASHBOARD
    add_image_placeholder_slide(prs, "Dashboard Principal", "Captura del panel de estado")
    
    # 12: BUSQUEDA
    add_section_slide(prs, "Búsqueda Avanzada")
    
    # 13: FUSE
    add_content_slide(prs, "Motor de Búsqueda (Fuse.js)", [
        "## Campos Indexados",
        "• SKU (peso: 2.0) - coincidencia exacta prioritaria",
        "• Nombre corto (peso: 1.5) - nombre abreviado del producto",
        "• Descripción completa (peso: 1.0)",
        "• Keywords (peso: 0.6) - atributos: color, tipo, marca",
        "• EAN13 (peso: 0.8) - código de barras",
        "• Línea (peso: 0.5) - ej: ACCESORIOS, PELOTAS",
        "• Categoría (peso: 0.5) - VINIBALL, VINIFAN, etc.",
        "",
        "## Normalización",
        "• Ignora ubicación del término",
        "• Threshold: 0.3 (tolerancia alta para typo-tolerant)",
        "• Mínimo 2 caracteres para iniciar búsqueda"
    ])
    
    # 14: VOZ
    add_content_slide(prs, "Búsqueda por Voz", [
        "## Características",
        "• Web Speech API (SpeechRecognition)",
        "• Idioma: es-PE (Español Perú)",
        "• Interim results para feedback en tiempo real",
        "",
        "## Normalización de Voz",
        "• Convierte números hablados a dígitos:",
        "> 'cero uno uno cero uno nueve' → '011019'",
        "• Elimina ruido: 'sku', 'codigo', 'busca', artículos",
        "• Quita tildes y puntuación",
        "• Si todo son dígitos → SKU/EAN directo",
        "• Si es texto → búsqueda fuzzy por palabras",
        "",
        "## Ejemplos",
        "• 'buscar tijera vinifan' → busca 'tijera vinifan'",
        "• 'sku cero uno uno cero uno nueve' → busca '011019'"
    ])
    
    # 15: REPORTES
    add_section_slide(prs, "Reportes Exportables")
    
    # 16: TIPOS
    add_content_slide(prs, "Tipos de Reporte", [
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
        "SKU · Nombre · Línea · Categoría · Cajas · Disponible venta · Estado"
    ])
    
    # 17: ALERTAS
    add_content_slide(prs, "Sistema de Alertas", [
        "## Tipos de Alerta",
        "• Crítico (rojo): bx = 0, SKU agotado",
        "• Advertencia (amarillo): 1 <= bx < 10, stock bajo",
        "",
        "## Ordenamiento",
        "• Primero críticos, luego advertencias",
        "• Dentro de cada tipo: ordenado por bx ascendente",
        "• Solo SKUs con estado_linea definido (catálogo)",
        "",
        "## Notificación",
        "• Badge en navegación con contador de alertas críticas",
        "• Panel dedicado con filtros: Todos, Sin Stock, Bajo Stock"
    ])
    
    # 18: SEGURIDAD
    add_section_slide(prs, "Seguridad y Acceso")
    
    # 19: AUTH
    add_content_slide(prs, "Autenticación", [
        "## Claves de Acceso",
        "• S1_API_KEY: Administrativa (upload, catalogo, resumen)",
        "• S1_READ_API_KEY: Lectura para frontend estático",
        "",
        "## Endpoints Protegidos",
        "• GET /api/v1/stock → requiere S1_READ_API_KEY",
        "• GET /api/v1/health → requiere S1_READ_API_KEY",
        "• POST /api/v1/catalog/upload → requiere S1_API_KEY",
        "• GET /api/v1/resumen → requiere S1_API_KEY",
        "",
        "## CORS",
        "• Permitido: https://carloscus.github.io",
        "• Desarrollo: http://localhost:3000, :5173",
        "• Rate limit: 60 requests/minute por IP"
    ])
    
    # 20: DESPLIEGUE
    add_section_slide(prs, "Despliegue y Operación")
    
    # 21: INFRA
    add_content_slide(prs, "Infraestructura", [
        "## Frontend",
        "• GitHub Pages (deploy automático desde main)",
        "• Build: Vite + Lit",
        "• URL: https://carloscus.github.io/g360-stock-reporter/",
        "",
        "## Backend",
        "• Render (servicio gratuito)",
        "• URL: https://g360-stock-api.onrender.com",
        "• Variables de entorno: S1_API_KEY, S1_READ_API_KEY",
        "• Auto-restart si falla (keep-alive cada 15 min)",
        "",
        "## Ventana Operativa",
        "• Lunes a Sábado, 07:00 - 22:59 (hora Lima)",
        "• Domingo y madrugada: no se regenera reporte",
        "• Cache sirve datos del último ciclo válido"
    ])
    
    # 22: INSTALACION
    add_content_slide(prs, "Instalación y Desarrollo", [
        "## Frontend",
        "• npm install",
        "• npm run dev (puerto 3000)",
        "• npm run build (genera dist/)",
        "",
        "## Backend",
        "• cd g360-stock-api",
        "• pip install -r requirements.txt",
        "• uvicorn app.main:app --reload --port 8000",
        "",
        "## Variables de Entorno (.env)",
        "• S1_SOURCE1_URL, S1_SOURCE2_URL (appweb)",
        "• S1_CACHE_TTL_SEGUNDOS (default: 900)",
        "• S1_API_KEY, S1_READ_API_KEY",
        "• S1_CORS_ORIGINS"
    ])
    
    # 23: TROUBLESHOOTING
    add_section_slide(prs, "Troubleshooting")
    
    # 24: PROBLEMAS
    add_content_slide(prs, "Problemas Comunes", [
        "## Cache Stale",
        "• Problema: datos viejos, no se actualizan",
        "• Solución: Forzar refresh en UI o limpiar localStorage",
        "",
        "## SKUs Sin Categoría",
        "• Problema: categoria muestra 'OTROS'",
        "• Causa: línea no mapeada en CATEGORIAS dict",
        "• Solución: Agregar código de línea al mapeo",
        "",
        "## Stock 0 Incorrecto",
        "• Problema: SKU con stock en 118 muestra 0",
        "• Causa: 118 es tipo mktd, no cuenta para venta",
        "• Solución: Verificar si el SKU tiene almacenes de venta",
        "",
        "## API No Responde",
        "• Verificar que S1_API_KEY esté configurada en Render",
        "• Check logs de Render si el servicio está awake"
    ])
    
    # 25: FUTURO
    add_content_slide(prs, "Mejoras Futuras Planeadas", [
        "• Integración con ERP para rotación de SKUs",
        "• Alertas push/notificaciones en tiempo real",
        "• Reportes por almacén específico",
        "• Gráficos de tendencia histórica",
        "• Módulo de reposición automática",
        "• App nativa móvil (React Native/Flutter)",
        "• Dashboard ejecutivo con KPIs avanzados"
    ])
    
    # 26: CIERRE
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, COLOR_DARK)
    
    tb = slide.shapes.add_textbox(Inches(0.5), Inches(2.5), Inches(12.333), Inches(1.2))
    add_text_to_para(tb.text_frame.paragraphs[0], "StockPulse CIPSA", 44, True, COLOR_TEXT, PP_ALIGN.CENTER)
    
    sb = slide.shapes.add_textbox(Inches(0.5), Inches(4.0), Inches(12.333), Inches(0.8))
    add_text_to_para(sb.text_frame.paragraphs[0], "Inteligencia de Stock en Tiempo Real", 22, False, COLOR_MUTED, PP_ALIGN.CENTER)
    
    cb = slide.shapes.add_textbox(Inches(0.5), Inches(5.8), Inches(12.333), Inches(0.5))
    add_text_to_para(cb.text_frame.paragraphs[0], "¿Consultas? Contactar al equipo G360", 16, False, COLOR_PRIMARY, PP_ALIGN.CENTER)
    
    # Save
    output_path = os.path.join(os.path.dirname(__file__), "StockPulse_Manual_Tecnico.pptx")
    prs.save(output_path)
    print(f"[OK] Presentacion guardada: {output_path}")
    print(f"Slides generados: {len(prs.slides)}")

if __name__ == "__main__":
    main()
