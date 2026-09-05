"""
StockPulse CIPSA - Manual Técnico v3
Con correcciones de layout para evitar desbordamientos
"""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
import os

# Colores corporativos G360/CIPSA
COLOR_PRIMARY = RGBColor(0x00, 0xD0, 0x84)
COLOR_DARK = RGBColor(0x0F, 0x17, 0x2A)
COLOR_TEXT = RGBColor(0xF0, 0xF4, 0xF8)
COLOR_MUTED = RGBColor(0x94, 0xA3, 0xB8)
COLOR_ACCENT = RGBColor(0x0E, 0x74, 0x90)

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)

def add_text_to_para(paragraph, text, size_pt, bold=False, color=None, alignment=None):
    paragraph.text = text
    for run in paragraph.runs:
        run.font.size = Pt(size_pt)
        run.font.bold = bold
        if color:
            run.font.color.rgb = color
    if alignment:
        paragraph.alignment = alignment

def set_slide_bg(slide, color):
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, SLIDE_W, SLIDE_H)
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
    
    logo = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.4), Inches(0.3), Inches(1.8), Inches(0.5))
    logo.fill.solid()
    logo.fill.fore_color.rgb = COLOR_PRIMARY
    logo.line.fill.background()
    add_text_to_para(logo.text_frame.paragraphs[0], "G360", 18, True, RGBColor(0xFF, 0xFF, 0xFF))
    
    tb = slide.shapes.add_textbox(Inches(0.4), Inches(2.6), Inches(12.5), Inches(1.0))
    add_text_to_para(tb.text_frame.paragraphs[0], title, 40, True, COLOR_TEXT)
    
    if subtitle:
        sb = slide.shapes.add_textbox(Inches(0.4), Inches(3.8), Inches(12.5), Inches(0.6))
        add_text_to_para(sb.text_frame.paragraphs[0], subtitle, 20, False, COLOR_MUTED)
    
    fb = slide.shapes.add_textbox(Inches(0.4), Inches(6.9), Inches(12.5), Inches(0.3))
    add_text_to_para(fb.text_frame.paragraphs[0], "CIPSA - Intelligence Division", 12, False, COLOR_MUTED, PP_ALIGN.RIGHT)
    return slide

def add_section_slide(prs, section_title):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, COLOR_DARK)
    
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.4), Inches(2.8), Inches(1.8), Inches(0.05))
    line.fill.solid()
    line.fill.fore_color.rgb = COLOR_PRIMARY
    line.line.fill.background()
    
    tb = slide.shapes.add_textbox(Inches(0.4), Inches(2.4), Inches(12.5), Inches(0.8))
    add_text_to_para(tb.text_frame.paragraphs[0], section_title, 36, True, COLOR_TEXT)
    return slide

def add_content_slide(prs, title, items, content_top=1.1, content_height=5.5):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, COLOR_DARK)
    
    tb = slide.shapes.add_textbox(Inches(0.4), Inches(0.25), Inches(12.5), Inches(0.6))
    add_text_to_para(tb.text_frame.paragraphs[0], title, 26, True, COLOR_TEXT)
    
    cb = slide.shapes.add_textbox(Inches(0.4), Inches(content_top), Inches(12.5), Inches(content_height))
    tf = cb.text_frame
    tf.word_wrap = True
    
    for i, item in enumerate(items):
        p = tf.add_paragraph() if i > 0 else tf.paragraphs[0]
        
        if item.startswith("##"):
            add_text_to_para(p, item[2:].strip(), 18, True, COLOR_PRIMARY)
            p.space_before = Pt(12)
        elif item.startswith("•"):
            add_text_to_para(p, "  " + item[1:].strip(), 14, False, COLOR_TEXT)
            p.space_before = Pt(4)
        elif item.startswith("  -"):
            add_text_to_para(p, "    " + item.strip(), 12, False, COLOR_MUTED)
            p.space_before = Pt(2)
        elif item.startswith("> "):
            add_text_to_para(p, item[2:].strip(), 12, False, RGBColor(0x00, 0xD0, 0x84))
            p.space_before = Pt(2)
        else:
            add_text_to_para(p, item, 14, False, COLOR_TEXT)
            p.space_before = Pt(4)
    
    return slide

def add_image_placeholder_slide(prs, title, caption=""):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, COLOR_DARK)
    
    tb = slide.shapes.add_textbox(Inches(0.4), Inches(0.25), Inches(12.5), Inches(0.6))
    add_text_to_para(tb.text_frame.paragraphs[0], title, 26, True, COLOR_TEXT)
    
    ph = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.6), Inches(1.1), Inches(12.1), Inches(5.5))
    ph.fill.solid()
    ph.fill.fore_color.rgb = RGBColor(0x1E, 0x29, 0x3B)
    ph.line.color.rgb = COLOR_PRIMARY
    ph.line.width = Pt(2)
    
    tf = ph.text_frame
    tf.word_wrap = True
    add_text_to_para(tf.paragraphs[0], "[CAPTURA DE PANTALLA]", 22, True, COLOR_MUTED, PP_ALIGN.CENTER)
    p2 = tf.add_paragraph()
    add_text_to_para(p2, caption, 12, False, COLOR_MUTED, PP_ALIGN.CENTER)
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
    ], content_top=1.0, content_height=5.8)
    
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
        "• Campos: SKU, descripción, un_bx, peso, líneas",
        "• Auto-carga desde GitHub en cada reinicio"
    ], content_top=1.0, content_height=5.8)
    
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
        "• venta: VES, 40, 121, 122, 129",
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
        "• Código extraído del reporte appweb",
        "• Normalización: '0179' → '79'",
        "• Código '79' → categoría VINIFAN",
        "• SKUs sin línea → 'OTROS'"
    ])
    
    # 9: ESTADOS
    add_section_slide(prs, "Estados de Stock")
    
    # 10: CALCULO
    add_content_slide(prs, "Cálculo de Estado", [
        "## Fórmula de Cajas (bx)",
        "• bx = Math.floor(stock_disponible / un_bx)",
        "• stock_disponible = suma de 'disponible' en venta",
        "• un_bx = unidades por caja (catálogo maestro)",
        "",
        "## Estados",
        "• OK → bx >= 10 (10+ cajas completas)",
        "• BAJO → 1 <= bx < 10 (1-9 cajas)",
        "• AGOTADO → bx == 0 (sin cajas completas)",
        "",
        "## Casos Especiales",
        "• un_bx <= 1: se muestra en unidades",
        "• Stock solo mktd: aparece como AGOTADO",
        "• Inspección (121): opcional en reportes"
    ])
    
    # 11: DASHBOARD
    add_image_placeholder_slide(prs, "Dashboard Principal", "Captura del panel de estado")
    
    # 12: BUSQUEDA
    add_section_slide(prs, "Búsqueda Avanzada")
    
    # 13: FUSE
    add_content_slide(prs, "Motor de Búsqueda (Fuse.js)", [
        "## Campos Indexados",
        "• SKU (peso: 2.0) - coincidencia exacta",
        "• Nombre corto (peso: 1.5)",
        "• Descripción completa (peso: 1.0)",
        "• Keywords (peso: 0.6) - atributos color/tipo",
        "• EAN13 (peso: 0.8) - código de barras",
        "• Línea (peso: 0.5) - ACCESORIOS, PELOTAS",
        "• Categoría (peso: 0.5) - VINIFAN, VINIBALL",
        "",
        "## Configuración",
        "• Threshold: 0.3 (tolerante a typos)",
        "• Mínimo 2 caracteres para buscar"
    ])
    
    # 14: VOZ
    add_content_slide(prs, "Búsqueda por Voz", [
        "## Características",
        "• Web Speech API (SpeechRecognition)",
        "• Idioma: es-PE (Español Perú)",
        "",
        "## Normalización",
        "• Números hablados → dígitos",
        "> 'cero uno uno' → '011'",
        "• Elimina ruido: sku, codigo, busca",
        "• Quita tildes y puntuación",
        "",
        "## Ejemplos",
        "• 'tijera vinifan pastel' → búsqueda fuzzy",
        "• 'sku cero uno uno' → busca '011...'"
    ])
    
    # 15: REPORTES
    add_section_slide(prs, "Reportes Exportables")
    
    # 16: TIPOS
    add_content_slide(prs, "Tipos de Reporte", [
        "## Reporte Completo (Pulso)",
        "• Hoja Resumen: KPIs por categoría y línea",
        "• Hojas por línea: datos detallados",
        "• Hoja Sin Catálogo: SKUs sin estado",
        "• Opciones: incluir inspección, secundarios",
        "",
        "## Reporte de Estado",
        "• ConStock: bx >= 10",
        "• BajoStock: 1 <= bx < 10",
        "• SinStock: bx = 0",
        "",
        "## Columnas",
        "SKU · Nombre · Línea · Categoría · Cajas · Disp. venta · Estado"
    ])
    
    # 17: ALERTAS
    add_content_slide(prs, "Sistema de Alertas", [
        "## Tipos",
        "• Crítico (rojo): bx = 0, SKU agotado",
        "• Advertencia (amarillo): 1 <= bx < 10",
        "",
        "## Ordenamiento",
        "• Prioridad: críticos primero",
        "• Luego: bx ascendente",
        "• Solo SKUs con estado_linea definido",
        "",
        "## UI",
        "• Badge con contador en navegación",
        "• Panel con filtros: Todos, Sin Stock, Bajo Stock"
    ])
    
    # 18: SEGURIDAD
    add_section_slide(prs, "Seguridad y Acceso")
    
    # 19: AUTH
    add_content_slide(prs, "Autenticación", [
        "## Claves",
        "• S1_API_KEY: Administrativa",
        "• S1_READ_API_KEY: Lectura frontend",
        "",
        "## Endpoints",
        "• GET /stock → S1_READ_API_KEY",
        "• GET /health → S1_READ_API_KEY",
        "• POST /catalog/upload → S1_API_KEY",
        "",
        "## CORS",
        "• Producción: github.io",
        "• Desarrollo: localhost:3000/:5173",
        "• Rate limit: 60 req/min por IP"
    ])
    
    # 20: DESPLIEGUE
    add_section_slide(prs, "Despliegue y Operación")
    
    # 21: INFRA
    add_content_slide(prs, "Infraestructura", [
        "## Frontend",
        "• GitHub Pages (deploy automático)",
        "• Build: Vite + Lit",
        "• URL: carloscus.github.io/g360-stock-reporter",
        "",
        "## Backend",
        "• Render (gratuito)",
        "• URL: g360-stock-api.onrender.com",
        "• Keep-alive cada 15 min",
        "",
        "## Horario",
        "• Lun-Sáb 07:00-22:59 Lima",
        "• Dom/madrugada: datos estáticos"
    ])
    
    # 22: INSTALACION
    add_content_slide(prs, "Instalación y Desarrollo", [
        "## Frontend",
        "• npm install",
        "• npm run dev → localhost:3000",
        "• npm run build → dist/",
        "",
        "## Backend",
        "• pip install -r requirements.txt",
        "• uvicorn app.main:app --reload",
        "",
        "## Variables (.env)",
        "• S1_SOURCE1_URL, S1_SOURCE2_URL",
        "• S1_API_KEY, S1_READ_API_KEY",
        "• S1_CORS_ORIGINS"
    ])
    
    # 23: TROUBLESHOOTING
    add_section_slide(prs, "Troubleshooting")
    
    # 24: PROBLEMAS
    add_content_slide(prs, "Problemas Comunes", [
        "## Cache Stale",
        "• Datos viejos no se actualizan",
        "• Solución: Forzar refresh o limpiar cache",
        "",
        "## Categoría OTROS",
        "• Línea no mapeada en CATEGORIAS",
        "• Solución: Agregar código al mapeo",
        "",
        "## Stock 0 Incorrecto",
        "• SKU solo tiene stock mktd (118)",
        "• Solución: Verificar almacenes de venta",
        "",
        "## API No Responde",
        "• Verificar S1_API_KEY en Render",
        "• Check logs si servicio está awake"
    ])
    
    # 25: FUTURO
    add_content_slide(prs, "Mejoras Futuras Planeadas", [
        "• Integración ERP para rotación de SKUs",
        "• Alertas push en tiempo real",
        "• Reportes por almacén específico",
        "• Gráficos de tendencia histórica",
        "• Módulo de reposición automática",
        "• App nativa móvil (RN/Flutter)",
        "• Dashboard ejecutivo con KPIs avanzados"
    ], content_top=1.2, content_height=5.5)
    
    # 26: CIERRE
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, COLOR_DARK)
    
    tb = slide.shapes.add_textbox(Inches(0.4), Inches(2.4), Inches(12.5), Inches(1.0))
    add_text_to_para(tb.text_frame.paragraphs[0], "StockPulse CIPSA", 40, True, COLOR_TEXT, PP_ALIGN.CENTER)
    
    sb = slide.shapes.add_textbox(Inches(0.4), Inches(3.6), Inches(12.5), Inches(0.6))
    add_text_to_para(sb.text_frame.paragraphs[0], "Inteligencia de Stock en Tiempo Real", 20, False, COLOR_MUTED, PP_ALIGN.CENTER)
    
    cb = slide.shapes.add_textbox(Inches(0.4), Inches(5.5), Inches(12.5), Inches(0.4))
    add_text_to_para(cb.text_frame.paragraphs[0], "¿Consultas? Contactar al equipo G360", 14, False, COLOR_PRIMARY, PP_ALIGN.CENTER)
    
    output_path = os.path.join(os.path.dirname(__file__), "StockPulse_Manual_Tecnico.pptx")
    prs.save(output_path)
    print(f"[OK] Slides generados: {len(prs.slides)}")

if __name__ == "__main__":
    main()
