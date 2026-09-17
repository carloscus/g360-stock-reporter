"""
StockPulse CIPSA - Manual Técnico v8 (Diseño Mejorado + Screenshots)
- Transparencias y opacidades
- Paleta colores corporativos (asiento verde CIPSA)
- 10 slides concisos
- Elementos visuales mejorados
- Soporte para screenshots en assets/screenshots/
- Contenido: jerarquía VES/129/40/121/122, búsqueda multi-término, PWA
"""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
import os

# ==========================================
# PALETA CORPORATIVA CIPSA / ASIENTO
# ==========================================
C = {
    # Verde asiento principal
    'primary': RGBColor(0x00, 0xD0, 0x84),
    'primary_dark': RGBColor(0x00, 0xA8, 0x6B),
    'primary_light': RGBColor(0x33, 0xE6, 0xAA),
    
    # Fondos oscuros con transparencia
    'dark': RGBColor(0x0F, 0x17, 0x2A),
    'surface': RGBColor(0x1E, 0x29, 0x3B),
    'surface_light': RGBColor(0x2D, 0x37, 0x48),
    
    # Textos
    'text': RGBColor(0xF0, 0xF4, 0xF8),
    'text_secondary': RGBColor(0xBD, 0xC3, 0xCB),
    'muted': RGBColor(0x94, 0xA3, 0xB8),
    
    # Acentos
    'accent': RGBColor(0x0E, 0x74, 0x90),
    'accent_light': RGBColor(0x22, 0xB8, 0xDE),
    
    # Estado colores
    'ok': RGBColor(0x00, 0xD0, 0x84),
    'warning': RGBColor(0xF5, 0x9E, 0x0B),
    'danger': RGBColor(0xEF, 0x44, 0x44),
    
    # Bordes sutiles
    'border': RGBColor(0x33, 0x41, 0x55),
    'border_light': RGBColor(0x47, 0x55, 0x69),
}

W, H = Inches(13.333), Inches(7.5)

# Path to screenshots directory
SCREENSHOTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'screenshots')

def set_bg(slide, color, alpha=None):
    """Fondo con posible transparencia"""
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, W, H)
    bg.fill.solid()
    bg.fill.fore_color.rgb = color
    bg.line.fill.background()
    if alpha is not None:
        # Set transparency (0-65535 in OXML)
        bg.fill.fore_color.brightness = alpha
    spTree = slide.shapes._spTree
    sp = bg._element
    spTree.remove(sp)
    spTree.insert(2, sp)

def add_text(p, text, size_pt, bold=False, color=None, align=None):
    """Agregar texto formateado"""
    p.text = text
    for run in p.runs:
        run.font.size = Pt(size_pt)
        run.font.bold = bold
        if color:
            run.font.color.rgb = color
        run.font.name = 'Segoe UI'
    if align:
        p.alignment = align

def add_para(tf, text, size_pt=14, bold=False, color=None, level=0):
    """Agregar párrafo con formato"""
    p = tf.add_paragraph() if tf.paragraphs[0].text else tf.paragraphs[0]
    add_text(p, text, size_pt, bold, color)
    p.level = level
    return p

def slide_title(prs, title, subtitle=""):
    """Slide de portada con elementos visuales"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(slide, C['dark'])
    
    # Accent bar lateral
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(0.12), Inches(7.5))
    bar.fill.solid()
    bar.fill.fore_color.rgb = C['primary']
    bar.line.fill.background()
    
    # Top accent line
    top_line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.12), Inches(0), Inches(13.2), Inches(0.08))
    top_line.fill.solid()
    top_line.fill.fore_color.rgb = C['primary']
    top_line.line.fill.background()
    
    # Logo area
    logo_bg = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.5), Inches(0.5), Inches(1.8), Inches(0.6))
    logo_bg.fill.solid()
    logo_bg.fill.fore_color.rgb = C['primary']
    logo_bg.line.fill.background()
    txt = logo_bg.text_frame.paragraphs[0]
    add_text(txt, "G360", 22, True, C['dark'])
    logo_bg.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER
    
    # Main title
    tb = slide.shapes.add_textbox(Inches(0.5), Inches(2.5), Inches(12.333), Inches(1.2))
    add_text(tb.text_frame.paragraphs[0], title, 52, True, C['text'])
    
    # Subtitle
    if subtitle:
        sb = slide.shapes.add_textbox(Inches(0.5), Inches(3.9), Inches(12.333), Inches(0.8))
        add_text(sb.text_frame.paragraphs[0], subtitle, 24, False, C['muted'])
    
    # Decorative bottom bars
    bar1 = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.5), Inches(6.5), Inches(3), Inches(0.06))
    bar1.fill.solid()
    bar1.fill.fore_color.rgb = C['primary']
    bar1.line.fill.background()
    
    bar2 = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(3.7), Inches(6.5), Inches(1.5), Inches(0.06))
    bar2.fill.solid()
    bar2.fill.fore_color.rgb = C['accent']
    bar2.line.fill.background()
    
    # Footer
    fb = slide.shapes.add_textbox(Inches(0.5), Inches(6.9), Inches(12.333), Inches(0.4))
    add_text(fb.text_frame.paragraphs[0], "CIPSA · Intelligence Division", 12, False, C['muted'], PP_ALIGN.RIGHT)
    return slide

def section_slide(prs, title, number=""):
    """Slide separador de sección"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(slide, C['dark'])
    
    # Large number watermark
    if number:
        num_box = slide.shapes.add_textbox(Inches(9), Inches(1.5), Inches(4), Inches(4))
        add_text(num_box.text_frame.paragraphs[0], number, 120, True, C['primary'])
        num_box.text_frame.paragraphs[0].alignment = PP_ALIGN.RIGHT
    
    # Accent line
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.5), Inches(3.2), Inches(2.5), Inches(0.08))
    line.fill.solid()
    line.fill.fore_color.rgb = C['primary']
    line.line.fill.background()
    
    # Title
    tb = slide.shapes.add_textbox(Inches(0.5), Inches(2.5), Inches(12.333), Inches(1))
    add_text(tb.text_frame.paragraphs[0], title, 44, True, C['text'])
    return slide

def content_slide(prs, title, items, has_number=False, section_num=""):
    """Slide de contenido con diseño mejorado"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(slide, C['dark'])
    
    # Left accent bar
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(0.12), Inches(7.5))
    bar.fill.solid()
    bar.fill.fore_color.rgb = C['primary']
    bar.line.fill.background()
    
    # Section number badge
    if has_number and section_num:
        num_bg = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(0.3), Inches(0.3), Inches(0.6), Inches(0.6))
        num_bg.fill.solid()
        num_bg.fill.fore_color.rgb = C['primary']
        num_bg.line.fill.background()
        num_txt = num_bg.text_frame.paragraphs[0]
        add_text(num_txt, section_num, 18, True, C['dark'])
        num_txt.alignment = PP_ALIGN.CENTER
    
    # Title
    tb = slide.shapes.add_textbox(Inches(0.5), Inches(0.3), Inches(12.333), Inches(0.6))
    add_text(tb.text_frame.paragraphs[0], title, 28, True, C['text'])
    
    # Accent line under title
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.5), Inches(0.9), Inches(2), Inches(0.04))
    line.fill.solid()
    line.fill.fore_color.rgb = C['primary']
    line.line.fill.background()
    
    # Content box with subtle background
    content_bg = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.5), Inches(1.2), Inches(12.333), Inches(5.8))
    content_bg.fill.solid()
    content_bg.fill.fore_color.rgb = C['surface']
    content_bg.line.color.rgb = C['border']
    content_bg.line.width = Pt(1)
    
    # Content textbox inside the box
    inner_box = slide.shapes.add_textbox(Inches(0.7), Inches(1.4), Inches(11.9), Inches(5.4))
    tf = inner_box.text_frame
    tf.word_wrap = True
    
    for i, item in enumerate(items):
        p = tf.add_paragraph() if i > 0 else tf.paragraphs[0]
        
        if item.startswith("##"):
            add_text(p, "▌ " + item[2:].strip(), 18, True, C['primary'])
            p.space_before = Pt(14)
        elif item.startswith("•"):
            add_text(p, "  ▸ " + item[1:].strip(), 14, False, C['text'])
            p.space_before = Pt(5)
        elif item.startswith("  -"):
            add_text(p, "    " + item.strip(), 12, False, C['muted'])
            p.space_before = Pt(2)
        elif item.startswith("> "):
            add_text(p, "    「 " + item[2:].strip() + " 」", 12, False, C['primary'])
            p.space_before = Pt(4)
        elif item == "":
            add_text(p, "", 8)
        else:
            add_text(p, "  " + item, 14, False, C['text'])
            p.space_before = Pt(5)
    
    return slide

def image_slide(prs, title, caption="", screenshot_file=None, screenshot_label=""):
    """Slide con imagen opcional o placeholder"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(slide, C['dark'])
    
    # Left accent bar
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(0.12), Inches(7.5))
    bar.fill.solid()
    bar.fill.fore_color.rgb = C['primary']
    bar.line.fill.background()
    
    # Title
    tb = slide.shapes.add_textbox(Inches(0.5), Inches(0.3), Inches(12.333), Inches(0.6))
    add_text(tb.text_frame.paragraphs[0], title, 28, True, C['text'])
    
    # Accent line
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.5), Inches(0.9), Inches(2), Inches(0.04))
    line.fill.solid()
    line.fill.fore_color.rgb = C['primary']
    line.line.fill.background()
    
    # Try to insert screenshot if file exists
    img_inserted = False
    if screenshot_file:
        from pathlib import Path
        ruta = Path(SCREENSHOTS_DIR) / screenshot_file
        if ruta.exists():
            try:
                from PIL import Image
                iw, ih = Image.open(ruta).size
                ir = iw / ih
                
                # Frame dimensions for image
                frame_x, frame_y = 0.6, 1.2
                frame_w, frame_h = 12.1, 5.8
                fr = frame_w / frame_h
                
                # Calculate fit (contain mode)
                if ir > fr:
                    dw, dh = frame_w, frame_w / ir
                else:
                    dh, dw = frame_h, frame_h * ir
                dx = frame_x + (frame_w - dw) / 2
                dy = frame_y + (frame_h - dh) / 2
                
                # Add frame
                ph = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(frame_x), Inches(frame_y), Inches(frame_w), Inches(frame_h))
                ph.fill.solid()
                ph.fill.fore_color.rgb = C['surface']
                ph.line.color.rgb = C['primary']
                ph.line.width = Pt(2)
                
                # Add image inside frame
                slide.shapes.add_picture(str(ruta), Inches(dx), Inches(dy), Inches(dw), Inches(dh))
                img_inserted = True
            except ImportError:
                pass  # Pillow not installed, fall back to placeholder
    
    # Fallback placeholder if no image or Pillow not available
    if not img_inserted:
        ph = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(1.2), Inches(12.1), Inches(5.8))
        ph.fill.solid()
        ph.fill.fore_color.rgb = C['surface']
        ph.line.color.rgb = C['border']
        ph.line.dash_style = 4  # Dashed border for placeholder
        
        tf = ph.text_frame
        tf.word_wrap = True
        
        # Icon placeholder
        icon_box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(5.0), Inches(2.8), Inches(3.0), Inches(1.5))
        icon_box.fill.solid()
        icon_box.fill.fore_color.rgb = C['surface_light']
        icon_box.line.color.rgb = C['border']
        icon_txt = icon_box.text_frame.paragraphs[0]
        add_text(icon_txt, "📷", 32, False, C['muted'])
        icon_txt.alignment = PP_ALIGN.CENTER
        
        # Instruction text
        txt_box = slide.shapes.add_textbox(Inches(0.6), Inches(4.5), Inches(12.1), Inches(1.2))
        add_text(txt_box.text_frame.paragraphs[0], screenshot_label or "Captura de pantalla", 16, True, C['text'], PP_ALIGN.CENTER)
        p2 = txt_box.text_frame.add_paragraph()
        add_text(p2, f"Agregar '{screenshot_file}' en assets/screenshots/", 12, False, C['muted'], PP_ALIGN.CENTER)
    
    return slide

def main():
    prs = Presentation()
    prs.slide_width, prs.slide_height = W, H
    
    # 1: PORTADA
    slide_title(prs, "StockPulse CIPSA", "Manual Técnico — Reportes de Stock en Tiempo Real")
    
    # 2: ARQUITECTURA
    content_slide(prs, "Arquitectura del Sistema", [
        "## Frontend PWA",
        "• Lit 3 Web Components, deploy en GitHub Pages",
        "• Cache 3 capas: memoria → sessionStorage → localStorage",
        "",
        "## Backend API",
        "• FastAPI en Render, fuente: appweb.cipsa.com.pe",
        "• Enriquecimiento automático con catálogo maestro",
        "• TTL cache: 15 minutos",
        "",
        "## Catálogo Maestro",
        "• JSON en GitHub (g360-master-data)",
        "• Campos: SKU, descripción, un_bx, peso, líneas"
    ], has_number=True, section_num="01")
    
    # 3: FLUJO DE DATOS (diagrama + screenshot opcional)
    image_slide(prs, "Flujo de Datos", "Captura del dashboard mostrando KPIs y estado de stock",
                screenshot_file="dashboard.png", screenshot_label="Vista del Dashboard")
    
    # 4: CATEGORÍAS
    content_slide(prs, "Categorías de Negocio", [
        "## Mapeo Automático por Línea",
        "• VINIBALL → líneas: 01, MA, 14, AD",
        "• VINIFAN → líneas: 02, 09, 11, 72-79",
        "• REPRESENTADAS → línea: 85",
        "• PUBLICIDAD → líneas: 80, 81",
        "",
        "## Normalización",
        "> Entrada: '0179 - ACCESORIOS' → Código: '79' → VINIFAN",
        "",
        "## Estados de Stock (bx sobre disponible VES)",
        "• OK → bx >= 10 cajas | BAJO → 1-9 bx | AGOTADO → bx = 0"
    ], has_number=True, section_num="02")
    
    # 5: FUNCIONALIDADES
    content_slide(prs, "Funcionalidades Principales", [
        "## Dashboard y Estado",
        "• KPIs y lista expandible por categoría (estados sobre VES)",
        "• Buscador interno con auto-expand de coincidencias",
        "",
        "## Búsqueda Avanzada",
        "• Multi-término AND sin tildes + voz + link ?q=SKU",
        "• SKU, EAN, línea, categoría, keywords",
        "",
        "## Jerarquía de Almacenes (lotes no se suman)",
        "• VES venta · 129 secundario · 40 traslado (≥10 bx)",
        "• 121 inspección/QC · 122 exportación (informativo)",
        "• Badges + leyenda de colores por lote",
        "",
        "## Reportes XLSX",
        "• 'Disponible VES'; columnas 129/40/121 + hoja 122",
        "• Descarga directa 122; solicitante recordado en equipo"
    ], has_number=True, section_num="03")
    
    # 6: ALERTAS
    content_slide(prs, "Sistema de Alertas", [
        "## Tipos de Alerta",
        "• Crítico (rojo): SKU agotado (bx = 0)",
        "• Advertencia (amarillo): Stock bajo (1-9 cajas)",
        "",
        "## Criterios",
        "• Solo SKUs con estado_linea definido (catálogo)",
        "• Ordenados por prioridad y cantidad de cajas",
        "",
        "## Visualización",
        "• Badge con contador en navegación",
        "• Panel dedicado con filtros por tipo"
    ], has_number=True, section_num="04")
    
    # 7: SEGURIDAD
    content_slide(prs, "Seguridad y Acceso", [
        "## Modelo de Autenticación",
        "• S1_API_KEY: Administrativa (upload, catálogo)",
        "• S1_READ_API_KEY: Lectura para frontend",
        "",
        "## Endpoints Protegidos",
        "• GET /stock, /health → requiere READ_KEY",
        "• POST /catalog/upload → requiere ADMIN_KEY",
        "",
        "## Controles Operativos",
        "• CORS: github.io + localhost",
        "• Rate limit: 60 req/min por IP"
    ], has_number=True, section_num="05")
    
    # 8: DESPLIEGUE
    content_slide(prs, "Despliegue y Operación", [
        "## Infraestructura",
        "• Frontend: GitHub Pages (auto-deploy desde main)",
        "• Backend: Render (gratuito, keep-alive cada 5 min)",
        "",
        "## Desarrollo Local",
        "• Frontend: npm run dev (localhost:3000)",
        "• Backend: uvicorn app.main:app --reload",
        "",
        "## Ventana Operativa",
        "• Lun-Sáb 07:00-22:59 hora Lima",
        "• Dom/madrugada: datos estáticos del último ciclo"
    ], has_number=True, section_num="06")
    
    # 9: TROUBLESHOOTING
    content_slide(prs, "Troubleshooting Común", [
        "## Cache Stale",
        "• Síntoma: datos no se actualizan",
        "• Solución: Forzar refresh o limpiar localStorage",
        "",
        "## Categoría OTROS",
        "• Causa: código de línea no mapeado",
        "• Solución: Agregar a CATEGORIAS en constants.py",
        "",
        "## Disponible 0 con existencias",
        "• Causa: stock solo en lotes no-VES (mktd, 121, 40, 129, 122)",
        "• Solución: ver chips por almacén en el buscador o columnas del XLSX"
    ], has_number=True, section_num="07")
    
    # 10: CIERRE
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(slide, C['dark'])
    
    # Center accent
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(4.67), Inches(3.0), Inches(4), Inches(0.06))
    line.fill.solid()
    line.fill.fore_color.rgb = C['primary']
    line.line.fill.background()
    
    # Left decorative
    left_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(0.12), Inches(7.5))
    left_bar.fill.solid()
    left_bar.fill.fore_color.rgb = C['primary']
    left_bar.line.fill.background()
    
    # Right decorative
    right_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(13.21), Inches(0), Inches(0.12), Inches(7.5))
    right_bar.fill.solid()
    right_bar.fill.fore_color.rgb = C['primary']
    right_bar.line.fill.background()
    
    # Title
    tb = slide.shapes.add_textbox(Inches(0.5), Inches(2.0), Inches(12.333), Inches(1.0))
    add_text(tb.text_frame.paragraphs[0], "StockPulse CIPSA", 48, True, C['text'], PP_ALIGN.CENTER)
    
    # Subtitle
    sb = slide.shapes.add_textbox(Inches(0.5), Inches(3.3), Inches(12.333), Inches(0.6))
    add_text(sb.text_frame.paragraphs[0], "Inteligencia de Stock en Tiempo Real", 22, False, C['muted'], PP_ALIGN.CENTER)
    
    # Contact
    cb = slide.shapes.add_textbox(Inches(0.5), Inches(5.0), Inches(12.333), Inches(0.5))
    add_text(cb.text_frame.paragraphs[0], "¿Consultas? Contactar al equipo G360", 16, False, C['primary'], PP_ALIGN.CENTER)
    
    # Footer
    fb = slide.shapes.add_textbox(Inches(0.5), Inches(6.8), Inches(12.333), Inches(0.4))
    add_text(fb.text_frame.paragraphs[0], "g360-stock-reporter-lit · GitHub", 10, False, C['muted'], PP_ALIGN.RIGHT)
    
    # Save
    output_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(output_dir, "StockPulse_Manual_Tecnico.pptx")
    prs.save(output_path)
    print(f"[OK] Manual generado: {len(prs.slides)} slides")
    print(f"[OK] Guardado en: {output_path}")

if __name__ == "__main__":
    main()
