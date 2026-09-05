"""
StockPulse CIPSA - Manual Técnico
Generación de presentación PPTX con estructura completa
"""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import nsmap
import os

# Colores corporativos G360/CIPSA
COLOR_PRIMARY = RGBColor(0x00, 0xD0, 0x84)    # Verde accent
COLOR_DARK = RGBColor(0x0F, 0x17, 0x2A)        # Fondo oscuro
COLOR_TEXT = RGBColor(0xF0, 0xF4, 0xF8)        # Texto claro
COLOR_MUTED = RGBColor(0x94, 0xA3, 0xB8)       # Texto secundario
COLOR_ACCENT = RGBColor(0x0E, 0x74, 0x90)      # Azul secundario

def set_slide_bg_color(slide, color):
    """Establecer fondo oscuro para slides"""
    background = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5)
    )
    background.fill.solid()
    background.fill.fore_color.rgb = color
    background.line.fill.background()
    # Mover al fondo
    spTree = slide.shapes._spTree
    sp = background._element
    spTree.remove(sp)
    spTree.insert(2, sp)

def add_title_slide(prs, title, subtitle=""):
    """Slide de título con fondo corporativo"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])  # Blank layout
    
    # Fondo oscuro
    set_slide_bg_color(slide, COLOR_DARK)
    
    # Logo/Brand area
    logo_box = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, Inches(0.5), Inches(0.5), Inches(2), Inches(0.5)
    )
    logo_box.fill.solid()
    logo_box.fill.fore_color.rgb = COLOR_PRIMARY
    logo_box.line.fill.background()
    
    tf = logo_box.text_frame
    tf.text = "G360"
    tf.paragraphs[0].font.size = Pt(18)
    tf.paragraphs[0].font.bold = True
    tf.paragraphs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    
    # Título principal
    title_box = slide.shapes.add_textbox(Inches(0.5), Inches(2.5), Inches(12.333), Inches(1.5))
    tf = title_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = title
    p.font.size = Pt(44)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT
    
    # Subtítulo
    if subtitle:
        sub_box = slide.shapes.add_textbox(Inches(0.5), Inches(4.2), Inches(12.333), Inches(1))
        tf = sub_box.text_frame
        p = tf.paragraphs[0]
        p.text = subtitle
        p.font.size = Pt(24)
        p.font.color.rgb = COLOR_MUTED
    
    # Footer
    footer = slide.shapes.add_textbox(Inches(0.5), Inches(6.8), Inches(12.333), Inches(0.4))
    tf = footer.text_frame
    p = tf.paragraphs[0]
    p.text = "CIPSA · Intelligence Division"
    p.font.size = Pt(14)
    p.font.color.rgb = COLOR_MUTED
    p.alignment = PP_ALIGN.RIGHT
    
    return slide

def add_section_slide(prs, section_title):
    """Slide separador de sección"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg_color(slide, COLOR_DARK)
    
    # Línea accent
    line = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, Inches(0.5), Inches(3.2), Inches(2), Inches(0.08)
    )
    line.fill.solid()
    line.fill.fore_color.rgb = COLOR_PRIMARY
    line.line.fill.background()
    
    # Título
    title_box = slide.shapes.add_textbox(Inches(0.5), Inches(2.8), Inches(12), Inches(1))
    tf = title_box.text_frame
    p = tf.paragraphs[0]
    p.text = section_title
    p.font.size = Pt(40)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT
    
    return slide

def add_content_slide(prs, title, content_items, notes=""):
    """Slide de contenido con lista de items"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg_color(slide, COLOR_DARK)
    
    # Título
    title_box = slide.shapes.add_textbox(Inches(0.5), Inches(0.4), Inches(12.333), Inches(0.8))
    tf = title_box.text_frame
    p = tf.paragraphs[0]
    p.text = title
    p.font.size = Pt(32)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT
    
    # Content area
    content_box = slide.shapes.add_textbox(Inches(0.5), Inches(1.4), Inches(12.333), Inches(5.5))
    tf = content_box.text_frame
    tf.word_wrap = True
    
    for i, item in enumerate(content_items):
        if i == 0:
            p = tf.paragraphs[0]
        else:
            p = tf.add_paragraph()
        
        # Check if it's a bullet or header
        if item.startswith("##"):
            p.text = item[2:].strip()
            p.font.size = Pt(24)
            p.font.bold = True
            p.font.color.rgb = COLOR_PRIMARY
            p.space_before = Pt(20)
        elif item.startswith("•"):
            p.text = item[1:].strip()
            p.font.size = Pt(18)
            p.font.color.rgb = COLOR_TEXT
            p.level = 0
            p.space_before = Pt(8)
        elif item.startswith("  -"):
            p.text = item.strip()
            p.font.size = Pt(16)
            p.font.color.rgb = COLOR_MUTED
            p.level = 1
            p.space_before = Pt(4)
        else:
            p.text = item
            p.font.size = Pt(18)
            p.font.color.rgb = COLOR_TEXT
            p.space_before = Pt(8)
    
    return slide

def add_image_placeholder_slide(prs, title, caption=""):
    """Slide con placeholder para imagen/screenshot"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg_color(slide, COLOR_DARK)
    
    # Título
    title_box = slide.shapes.add_textbox(Inches(0.5), Inches(0.4), Inches(12.333), Inches(0.8))
    tf = title_box.text_frame
    p = tf.paragraphs[0]
    p.text = title
    p.font.size = Pt(32)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT
    
    # Placeholder box
    placeholder = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, Inches(1), Inches(1.5), Inches(11.333), Inches(5)
    )
    placeholder.fill.solid()
    placeholder.fill.fore_color.rgb = RGBColor(0x1E, 0x29, 0x3B)
    placeholder.line.color.rgb = COLOR_PRIMARY
    placeholder.line.width = Pt(2)
    
    # Text overlay
    tf = placeholder.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "[CAPTURA DE PANTALLA]"
    p.font.size = Pt(28)
    p.font.bold = True
    p.font.color.rgb = COLOR_MUTED
    p.alignment = PP_ALIGN.CENTER
    
    p2 = tf.add_paragraph()
    p2.text = caption
    p2.font.size = Pt(14)
    p2.font.color.rgb = COLOR_MUTED
    p2.alignment = PP_ALIGN.CENTER
    
    return slide

def add_diagram_slide(prs, title, diagram_text):
    """Slide para diagrama ASCII/架构图"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg_color(slide, COLOR_DARK)
    
    # Título
    title_box = slide.shapes.add_textbox(Inches(0.5), Inches(0.4), Inches(12.333), Inches(0.8))
    tf = title_box.text_frame
    p = tf.paragraphs[0]
    p.text = title
    p.font.size = Pt(32)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT
    
    # Diagram text
    diagram_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.4), Inches(11.733), Inches(5.5))
    tf = diagram_box.text_frame
    tf.word_wrap = True
    
    for line in diagram_text.split('\n'):
        p = tf.add_paragraph() if tf.paragraphs[0].text else tf.paragraphs[0]
        p.text = line
        p.font.size = Pt(14)
        p.font.color.rgb = COLOR_TEXT
        p.font.name = 'Consolas'
    
    return slide

def main():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    
    # ===== SLIDE 1: PORTADA =====
    add_title_slide(prs, "StockPulse CIPSA", "Manual Técnico del Sistema de Reportes de Stock")
    
    # ===== SLIDE 2: ÍNDICE =====
    add_content_slide(prs, "Contenido", [
        "## Arquitectura del Sistema",
        "• Frontend PWA (Lit Web Components)",
        "• Backend API (FastAPI + Render)",
        "• Flujo de datos y capas de caché",
        "",
        "## Categorias de Negocio",
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
    
    # ===== SLIDE 3: ARQUITECTURA =====
    add_section_slide(prs, "Arquitectura del Sistema")
    
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
    
    # ===== SLIDE 4: DIAGRAMA FLUJO =====
    add_image_placeholder_slide(prs, "Diagrama de Flujo de Datos", "Captura del diagrama arquitectura")
    
    # ===== SLIDE 5: FUENTES DE DATOS =====
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
    
    # ===== SLIDE 6: CATEGORÍAS =====
    add_section_slide(prs, "Categorías de Negocio")
    
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
    
    # ===== SLIDE 7: ESTADOS DE STOCK =====
    add_section_slide(prs, "Estados de Stock")
    
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
    
    # ===== SLIDE 8: DASHBOARD =====
    add_image_placeholder_slide(prs, "Dashboard Principal", "Captura del panel de estado")
    
    # ===== SLIDE 9: BÚSQUEDA =====
    add_section_slide(prs, "Búsqueda Avanzada")
    
    add_content_slide(prs, "Motor de Búsqueda (Fuse.js)", [
        "## Campers Indexados",
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
    
    # ===== SLIDE 10: BÚSQUEDA POR VOZ =====
    add_content_slide(prs, "Búsqueda por Voz", [
        "## Características",
        "• Web Speech API ( SpeechRecognition )",
        "• Idioma: es-PE (Español Perú)",
        "• Interim results para feedback en tiempo real",
        "",
        "## Normalización de Voz",
        "• Convierte números hablados a dígitos:",
        "  'cero uno uno cero uno nueve' → '011019'",
        "• Elimina ruido: 'sku', 'codigo', 'busca', artículos",
        "• Quita tildes y puntuación",
        "• Si todo son dígitos → SKU/EAN directo",
        "• Si es texto → búsqueda fuzzy por palabras",
        "",
        "## Ejemplos",
        "• 'buscar tijera vinifan' → busca 'tijera vinifan'",
        "• 'sku cero uno uno cero uno nueve' → busca '011019'"
    ])
    
    # ===== SLIDE 11: REPORTES XLSX =====
    add_section_slide(prs, "Reportes Exportables")
    
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
    
    # ===== SLIDE 12: ALERTAS =====
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
    
    # ===== SLIDE 13: SEGURIDAD =====
    add_section_slide(prs, "Seguridad y Acceso")
    
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
    
    # ===== SLIDE 14: DESPLEGUE =====
    add_section_slide(prs, "Despliegue y Operación")
    
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
    
    # ===== SLIDE 15: INSTALACIÓN =====
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
    
    # ===== SLIDE 16: TROUBLESHOOTING =====
    add_section_slide(prs, "Troubleshooting")
    
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
    
    # ===== SLIDE 17: PRÓXIMAS MEJORAS =====
    add_content_slide(prs, "Mejoras Futuras Planeadas", [
        "• Integración con ERP para rotación de SKUs",
        "• Alertas push/notificaciones en tiempo real",
        "• Reportes por almacén específico",
        "• Gráficos de tendencia histórica",
        "• Módulo de reposición automática",
        "• App nativa móvil (React Native/Flutter)",
        "• Dashboard ejecutivo con KPIs avanzados"
    ])
    
    # ===== SLIDE 18: CIERRE =====
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg_color(slide, COLOR_DARK)
    
    # Título central
    title_box = slide.shapes.add_textbox(Inches(0.5), Inches(2.5), Inches(12.333), Inches(1.5))
    tf = title_box.text_frame
    p = tf.paragraphs[0]
    p.text = "StockPulse CIPSA"
    p.font.size = Pt(48)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT
    p.alignment = PP_ALIGN.CENTER
    
    # Subtítulo
    sub_box = slide.shapes.add_textbox(Inches(0.5), Inches(4.2), Inches(12.333), Inches(1))
    tf = sub_box.text_frame
    p = tf.paragraphs[0]
    p.text = "Inteligencia de Stock en Tiempo Real"
    p.font.size = Pt(24)
    p.font.color.rgb = COLOR_MUTED
    p.alignment = PP_ALIGN.CENTER
    
    # Contacto
    contact_box = slide.shapes.add_textbox(Inches(0.5), Inches(6), Inches(12.333), Inches(0.5))
    tf = contact_box.text_frame
    p = tf.paragraphs[0]
    p.text = "¿Consultas? Contactar al equipo G360"
    p.font.size = Pt(16)
    p.font.color.rgb = COLOR_PRIMARY
    p.alignment = PP_ALIGN.CENTER
    
    # Guardar
    output_path = os.path.join(os.path.dirname(__file__), "StockPulse_Manual_Tecnico.pptx")
    prs.save(output_path)
    print(f"[OK] Presentación guardada: {output_path}")
    print(f"Slides generados: {len(prs.slides)}")

if __name__ == "__main__":
    main()
