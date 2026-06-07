"""
Borogodó Brandbook Generator
Generates a professional brand book PDF using reportlab.
"""

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import math

# ─── Brand Colors ───────────────────────────────────────────────────────────
ROXO   = HexColor("#7C3AED")   # primary
CORAL  = HexColor("#E85840")   # accent
MEL    = HexColor("#F0B464")   # warm
TEAL   = HexColor("#0EA5A0")   # teal
CREME  = HexColor("#FAF8F4")   # background
DARK   = HexColor("#1A0A2E")   # deep purple-black for text
ROXO_L = HexColor("#EDE9FF")   # light purple tint
CORAL_L = HexColor("#FFF0ED")  # light coral tint
MEL_L  = HexColor("#FEF3DC")   # light mel tint
TEAL_L = HexColor("#E0F5F5")   # light teal tint
GREY   = HexColor("#6B6B7B")   # secondary text
GREY_L = HexColor("#9999A8")   # tertiary text

W, H = A4  # 595 x 842 pt


def draw_sparkle(c, cx, cy, size, alpha=1.0):
    """Draw the 4-pointed sparkle logo mark."""
    # Gradient simulation: draw 3 overlapping paths with decreasing opacity
    colors = [
        HexColor("#F0B464"),
        HexColor("#EC6C50"),
        HexColor("#E85840"),
        HexColor("#C23828"),
    ]
    # We'll draw the sparkle as a filled path with a coral-mel blend
    # Using a radial fill approximation with layered shapes
    c.saveState()

    # Draw shadow/glow first
    glow_color = HexColor("#F0B464")
    c.setFillColor(glow_color)
    c.setFillAlpha(0.12)
    glow_scale = 1.35
    path = c.beginPath()
    gs = size * glow_scale
    path.moveTo(cx, cy + gs)
    # N → E control point, then E
    cp_ne = gs * 0.707 * 0.35
    path.curveTo(cx + cp_ne, cy + gs - cp_ne, cx + gs - cp_ne, cy + cp_ne, cx + gs, cy)
    # E → S
    path.curveTo(cx + gs - cp_ne, cy - cp_ne, cx + cp_ne, cy - gs + cp_ne, cx, cy - gs)
    # S → W
    path.curveTo(cx - cp_ne, cy - gs + cp_ne, cx - gs + cp_ne, cy - cp_ne, cx - gs, cy)
    # W → N
    path.curveTo(cx - gs + cp_ne, cy + cp_ne, cx - cp_ne, cy + gs - cp_ne, cx, cy + gs)
    path.close()
    c.drawPath(path, fill=1, stroke=0)

    # Draw top half (mel → coral)
    c.setFillColor(HexColor("#F0B464"))
    c.setFillAlpha(1.0)
    path = c.beginPath()
    cp = size * 0.707 * 0.35
    # Draw the full sparkle from top, going clockwise
    path.moveTo(cx, cy + size)
    path.curveTo(cx + cp, cy + size - cp, cx + size - cp, cy + cp, cx + size, cy)
    path.curveTo(cx + size - cp, cy - cp, cx + cp, cy - size + cp, cx, cy - size)
    path.curveTo(cx - cp, cy - size + cp, cx - size + cp, cy - cp, cx - size, cy)
    path.curveTo(cx - size + cp, cy + cp, cx - cp, cy + size - cp, cx, cy + size)
    path.close()
    c.drawPath(path, fill=1, stroke=0)

    # Draw bottom half overlay (coral → deep red)
    c.setFillColor(HexColor("#E85840"))
    c.setFillAlpha(0.7)
    path = c.beginPath()
    path.moveTo(cx - size, cy)
    path.curveTo(cx - size + cp, cy - cp, cx - cp, cy - size + cp, cx, cy - size)
    path.curveTo(cx + cp, cy - size + cp, cx + size - cp, cy - cp, cx + size, cy)
    path.lineTo(cx, cy)
    path.close()
    c.drawPath(path, fill=1, stroke=0)

    c.restoreState()


def page_bg(c, color):
    c.setFillColor(color)
    c.rect(0, 0, W, H, fill=1, stroke=0)


def divider(c, y, color=ROXO_L, width=None, x=None, thickness=1):
    x = x or 60
    w = width or (W - 120)
    c.setStrokeColor(color)
    c.setLineWidth(thickness)
    c.line(x, y, x + w, y)


def tag_chip(c, x, y, text, bg, fg=white, font_size=8):
    """Draw a small rounded chip/tag."""
    c.saveState()
    padding_h, padding_v = 8, 4
    text_width = c.stringWidth(text, "Helvetica-Bold", font_size)
    chip_w = text_width + padding_h * 2
    chip_h = font_size + padding_v * 2
    c.setFillColor(bg)
    c.roundRect(x, y, chip_w, chip_h, radius=chip_h/2, fill=1, stroke=0)
    c.setFillColor(fg)
    c.setFont("Helvetica-Bold", font_size)
    c.drawString(x + padding_h, y + padding_v + 1, text)
    c.restoreState()
    return chip_w


def color_swatch(c, x, y, w, h, hex_color, name, description, code):
    """Draw a color swatch card."""
    color = HexColor(hex_color)

    # Determine if light or dark background
    r = int(hex_color[1:3], 16) / 255
    g = int(hex_color[3:5], 16) / 255
    b = int(hex_color[5:7], 16) / 255
    luminance = 0.299 * r + 0.587 * g + 0.114 * b
    text_color = white if luminance < 0.55 else DARK

    # Main color block
    c.setFillColor(color)
    c.roundRect(x, y + h * 0.38, w, h * 0.62, radius=8, fill=1, stroke=0)

    # Name on color block
    c.setFillColor(text_color)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(x + 10, y + h * 0.38 + h * 0.62 - 22, name)

    # HEX code on color block
    c.setFont("Helvetica", 8)
    c.drawString(x + 10, y + h * 0.38 + 10, code)

    # Description below
    c.setFillColor(DARK)
    c.setFont("Helvetica", 8)
    # Word wrap
    words = description.split()
    line = ""
    line_y = y + h * 0.38 - 14
    for word in words:
        test = line + (" " if line else "") + word
        if c.stringWidth(test, "Helvetica", 8) < w - 4:
            line = test
        else:
            c.drawString(x + 2, line_y, line)
            line_y -= 12
            line = word
    if line:
        c.drawString(x + 2, line_y, line)


def persona_card(c, x, y, w, h, name, role, pain, gain, accent_color):
    """Draw a persona card."""
    c.saveState()

    # Card background
    c.setFillColor(white)
    c.roundRect(x, y, w, h, radius=10, fill=1, stroke=0)

    # Accent top bar
    c.setFillColor(accent_color)
    c.roundRect(x, y + h - 18, w, 18, radius=10, fill=1, stroke=0)
    c.setFillColor(accent_color)
    c.rect(x, y + h - 18, w, 10, fill=1, stroke=0)

    # Name
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(x + 12, y + h - 13, name)

    # Role chip
    c.setFillColor(accent_color)
    c.setFillAlpha(0.12)
    c.roundRect(x + 8, y + h - 40, w - 16, 18, radius=4, fill=1, stroke=0)
    c.setFillAlpha(1.0)
    c.setFillColor(accent_color)
    c.setFont("Helvetica", 9)
    c.drawString(x + 12, y + h - 36, role)

    # Pain label
    c.setFillColor(CORAL)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(x + 8, y + h - 60, "DOR")

    c.setFillColor(DARK)
    c.setFont("Helvetica", 8)
    # Word wrap pain
    words = pain.split()
    line = ""
    line_y = y + h - 73
    for word in words:
        test = line + (" " if line else "") + word
        if c.stringWidth(test, "Helvetica", 8) < w - 20:
            line = test
        else:
            c.drawString(x + 8, line_y, line)
            line_y -= 11
            line = word
    if line:
        c.drawString(x + 8, line_y, line)

    # Gain label
    line_y -= 16
    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(x + 8, line_y, "GANHO")

    line_y -= 13
    c.setFillColor(DARK)
    c.setFont("Helvetica", 8)
    words = gain.split()
    line = ""
    for word in words:
        test = line + (" " if line else "") + word
        if c.stringWidth(test, "Helvetica", 8) < w - 20:
            line = test
        else:
            c.drawString(x + 8, line_y, line)
            line_y -= 11
            line = word
    if line:
        c.drawString(x + 8, line_y, line)

    c.restoreState()


def draw_page_number(c, n, total, bg_is_dark=False):
    color = white if bg_is_dark else GREY_L
    c.setFillColor(color)
    c.setFont("Helvetica", 8)
    c.drawCentredString(W / 2, 22, f"{n}  /  {total}")


def draw_section_label(c, text, y=H - 48, x=60, color=GREY):
    c.setFillColor(color)
    c.setFont("Helvetica", 8)
    c.drawString(x, y, text.upper())


def draw_header_bar(c, text, x=60, y=H - 42):
    c.setFillColor(GREY_L)
    c.setFont("Helvetica", 7.5)
    c.drawString(x, y, "BOROGODÓ — BRANDBOOK 2026")
    c.setFillColor(GREY_L)
    c.drawRightString(W - 60, y, text.upper())
    c.setStrokeColor(ROXO_L)
    c.setLineWidth(0.5)
    c.line(60, y - 6, W - 60, y - 6)


# ════════════════════════════════════════════════════════════════════════════
# PAGE BUILDERS
# ════════════════════════════════════════════════════════════════════════════

def page_cover(c):
    """Page 1 — Cover"""
    # Deep background gradient simulation (roxo jambo)
    c.setFillColor(DARK)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # Decorative accent circles (background texture)
    c.saveState()
    c.setFillColor(ROXO)
    c.setFillAlpha(0.25)
    c.circle(W * 0.85, H * 0.8, 160, fill=1, stroke=0)
    c.setFillAlpha(0.12)
    c.circle(W * 0.1, H * 0.15, 100, fill=1, stroke=0)
    c.setFillColor(MEL)
    c.setFillAlpha(0.08)
    c.circle(W * 0.5, H * 0.5, 220, fill=1, stroke=0)
    c.restoreState()

    # Top bar
    c.setFillColor(white)
    c.setFillAlpha(0.06)
    c.rect(0, H - 56, W, 56, fill=1, stroke=0)
    c.setFillAlpha(1.0)

    # Top label
    c.setFillColor(white)
    c.setFillAlpha(0.4)
    c.setFont("Helvetica", 8)
    c.drawString(60, H - 32, "BRANDBOOK   ·   2026")
    c.setFillAlpha(1.0)

    # Large sparkle
    draw_sparkle(c, cx=W / 2, cy=H * 0.58, size=58)

    # Brand name — large display
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 64)
    title = "Borogodó"
    tw = c.stringWidth(title, "Helvetica-Bold", 64)
    c.drawCentredString(W / 2, H * 0.38, title)

    # Accent underline
    c.setStrokeColor(CORAL)
    c.setLineWidth(3)
    c.line(W / 2 - tw / 2, H * 0.38 - 8, W / 2 + tw / 2, H * 0.38 - 8)

    # Tagline
    c.setFillColor(white)
    c.setFillAlpha(0.75)
    c.setFont("Helvetica", 16)
    c.drawCentredString(W / 2, H * 0.31, "Descubra o seu valor. Mostre ao mundo.")
    c.setFillAlpha(1.0)

    # Bottom bar with concept
    c.setFillColor(ROXO)
    c.setFillAlpha(0.5)
    c.rect(0, 0, W, 80, fill=1, stroke=0)
    c.setFillAlpha(1.0)

    c.setFillColor(white)
    c.setFillAlpha(0.5)
    c.setFont("Helvetica", 10)
    c.drawCentredString(W / 2, 52, "aquele quê  ·  o charme indefinível  ·  inteligência de carreira")
    c.setFillAlpha(0.3)
    c.setFont("Helvetica", 8)
    c.drawCentredString(W / 2, 32, "borogodo.io")
    c.setFillAlpha(1.0)

    draw_page_number(c, 1, 12, bg_is_dark=True)


def page_concept(c):
    """Page 2 — Conceito e Propósito"""
    page_bg(c, CREME)
    draw_header_bar(c, "Conceito")

    # Large decorative number
    c.setFillColor(ROXO)
    c.setFillAlpha(0.06)
    c.setFont("Helvetica-Bold", 160)
    c.drawString(W - 200, 80, "01")
    c.setFillAlpha(1.0)

    # Section label
    draw_section_label(c, "01  —  Conceito & Propósito", y=H - 70)

    # Main heading
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 36)
    c.drawString(60, H - 110, "O que é o")
    c.setFillColor(ROXO)
    c.setFont("Helvetica-Bold", 36)
    c.drawString(60, H - 150, "Borogodó")

    # Sparkle inline
    draw_sparkle(c, cx=242, cy=H - 135, size=14)

    divider(c, H - 168, color=ROXO_L)

    # Etymology box
    c.setFillColor(ROXO)
    c.setFillAlpha(0.06)
    c.roundRect(60, H - 250, W - 120, 70, radius=8, fill=1, stroke=0)
    c.setFillAlpha(1.0)

    c.setFillColor(ROXO)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(76, H - 192, "borogodó  /bo.ro.go.ˈdɔ/  substantivo masculino")
    c.setFillColor(DARK)
    c.setFont("Helvetica", 10)
    c.drawString(76, H - 210, '"Aquele charme indefinível, aquele quê que alguém tem e não sabe explicar."')
    c.setFillColor(GREY)
    c.setFont("Helvetica", 9)
    c.drawString(76, H - 228, "Brasileiro, coloquial — usado quando a palavra certa não existe.")

    # Body text
    c.setFillColor(DARK)
    c.setFont("Helvetica", 11)

    lines = [
        "A maioria dos profissionais não consegue enxergar nem comunicar o",
        "próprio valor. Sabem o que entregaram, mas não conseguem traduzir isso",
        "em clareza de carreira ou presença profissional.",
        "",
        "O Borogodó resolve isso — revela o seu borogodó profissional.",
        "Onde você brilha. O que te diferencia. O que você nem sabia nomear.",
    ]

    y = H - 290
    for line in lines:
        c.drawString(60, y, line)
        y -= 17

    # Three pillars
    pillar_y = y - 30
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(60, pillar_y, "Os três pilares")

    pillars = [
        (ROXO, "Espelho", "Revela onde você manda bem\ne onde pode crescer, com\nevidência real do que fez."),
        (CORAL, "Mapa de Carreira", "Histórico profissional visual,\nclustering de skills, padrões\nde trajetória."),
        (TEAL, "Geração de Conteúdo", "Transforma o histórico em post,\nbio ou resumo que soa como\nvocê — não como IA."),
    ]

    card_w = (W - 140) / 3
    card_h = 110
    cx = 60
    for (color, title, desc) in pillars:
        # Card bg
        c.setFillColor(color)
        c.setFillAlpha(0.08)
        c.roundRect(cx, pillar_y - card_h - 20, card_w - 8, card_h, radius=8, fill=1, stroke=0)
        c.setFillAlpha(1.0)

        # Top accent line
        c.setFillColor(color)
        c.rect(cx, pillar_y - 24, card_w - 8, 4, fill=1, stroke=0)

        # Title
        c.setFillColor(color)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(cx + 10, pillar_y - 44, title)

        # Description
        c.setFillColor(DARK)
        c.setFont("Helvetica", 9)
        dy = pillar_y - 58
        for dl in desc.split("\n"):
            c.drawString(cx + 10, dy, dl)
            dy -= 13

        cx += card_w + 6

    # Bottom quote
    c.setFillColor(ROXO)
    c.setFillAlpha(0.08)
    c.roundRect(60, 60, W - 120, 42, radius=6, fill=1, stroke=0)
    c.setFillAlpha(1.0)
    c.setFillColor(ROXO)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(W / 2, 88, '"Você entrega mais do que sabe.')
    c.setFont("Helvetica", 9)
    c.drawCentredString(W / 2, 76, 'O Borogodó te mostra o quê."')

    draw_page_number(c, 2, 12)


def page_logo(c):
    """Page 3 — Logo & Símbolo"""
    page_bg(c, CREME)
    draw_header_bar(c, "Logo & Símbolo")

    c.setFillColor(DARK)
    c.setFillAlpha(0.04)
    c.setFont("Helvetica-Bold", 160)
    c.drawString(W - 200, 80, "02")
    c.setFillAlpha(1.0)

    draw_section_label(c, "02  —  Logo & Símbolo", y=H - 70)

    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 32)
    c.drawString(60, H - 108, "Marca Gráfica")
    divider(c, H - 122, color=ROXO_L)

    # Main logo showcase — large
    # Background showcase box
    c.setFillColor(white)
    c.roundRect(60, H - 310, W - 120, 170, radius=12, fill=1, stroke=0)

    # Sparkle large centered
    draw_sparkle(c, cx=W / 2 - 70, cy=H - 225, size=44)

    # Wordmark next to sparkle
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 42)
    c.drawString(W / 2 - 18, H - 240, "Borogodó")

    # Accent under wordmark
    wm_w = c.stringWidth("Borogodó", "Helvetica-Bold", 42)
    c.setStrokeColor(CORAL)
    c.setLineWidth(2.5)
    c.line(W / 2 - 18, H - 248, W / 2 - 18 + wm_w, H - 248)

    # Caption
    c.setFillColor(GREY)
    c.setFont("Helvetica", 8)
    c.drawCentredString(W / 2, H - 300, "Assinatura principal — símbolo + wordmark")

    # Variations row
    var_y = H - 380
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(60, var_y + 16, "Variações de uso")

    # Variant 1 — Symbol only, light bg
    c.setFillColor(white)
    c.roundRect(60, var_y - 80, 110, 80, radius=8, fill=1, stroke=0)
    draw_sparkle(c, cx=115, cy=var_y - 40, size=26)
    c.setFillColor(GREY)
    c.setFont("Helvetica", 7.5)
    c.drawCentredString(115, var_y - 72, "Símbolo — fundo claro")

    # Variant 2 — Symbol only, dark bg
    c.setFillColor(DARK)
    c.roundRect(185, var_y - 80, 110, 80, radius=8, fill=1, stroke=0)
    draw_sparkle(c, cx=240, cy=var_y - 40, size=26)
    c.setFillColor(GREY)
    c.setFont("Helvetica", 7.5)
    c.drawCentredString(240, var_y - 72, "Símbolo — fundo escuro")

    # Variant 3 — Wordmark only
    c.setFillColor(ROXO_L)
    c.roundRect(310, var_y - 80, 160, 80, radius=8, fill=1, stroke=0)
    c.setFillColor(ROXO)
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(390, var_y - 40, "Borogodó")
    c.setFillColor(GREY)
    c.setFont("Helvetica", 7.5)
    c.drawCentredString(390, var_y - 72, "Wordmark — fundo roxo claro")

    # Favicon section
    fav_y = var_y - 120
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(60, fav_y + 16, "Favicon & App Icon")

    # 32x32 favicon
    c.setFillColor(CREME)
    c.roundRect(60, fav_y - 40, 32, 32, radius=4, fill=1, stroke=0)
    draw_sparkle(c, cx=76, cy=fav_y - 24, size=12)
    c.setFillColor(GREY)
    c.setFont("Helvetica", 7.5)
    c.drawCentredString(76, fav_y - 50, "32×32 px")

    # 48x48
    c.setFillColor(DARK)
    c.roundRect(110, fav_y - 54, 48, 48, radius=6, fill=1, stroke=0)
    draw_sparkle(c, cx=134, cy=fav_y - 30, size=18)
    c.setFillColor(GREY)
    c.setFont("Helvetica", 7.5)
    c.drawCentredString(134, fav_y - 64, "48×48 px")

    # 180x180 app icon
    c.setFillColor(ROXO)
    c.roundRect(176, fav_y - 96, 80, 80, radius=14, fill=1, stroke=0)
    draw_sparkle(c, cx=216, cy=fav_y - 56, size=30)
    c.setFillColor(GREY)
    c.setFont("Helvetica", 7.5)
    c.drawCentredString(216, fav_y - 106, "180×180 px (App Icon)")

    # Concept note
    c.setFillColor(MEL_L)
    c.roundRect(60, 60, W - 120, 60, radius=8, fill=1, stroke=0)
    c.setFillColor(MEL)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(76, 104, "CONCEITO DO SÍMBOLO")
    c.setFillColor(DARK)
    c.setFont("Helvetica", 9)
    c.drawString(76, 90, "Faísca de 4 pontas — o lampejo de revelação. O acento do ó estilizado em forma de faísca.")
    c.drawString(76, 78, "Gradiente mel → coral → vermelho: aquecimento, a descoberta que vai se acendendo.")

    draw_page_number(c, 3, 12)


def page_colors(c):
    """Page 4 — Paleta de Cores"""
    page_bg(c, CREME)
    draw_header_bar(c, "Paleta de Cores")

    c.setFillColor(DARK)
    c.setFillAlpha(0.04)
    c.setFont("Helvetica-Bold", 160)
    c.drawString(W - 200, 80, "03")
    c.setFillAlpha(1.0)

    draw_section_label(c, "03  —  Paleta de Cores", y=H - 70)

    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 32)
    c.drawString(60, H - 108, "Cores da marca")
    divider(c, H - 122, color=ROXO_L)

    colors_data = [
        ("#7C3AED", "Roxo-jambo", "PRIMÁRIA", "O charme, a profundidade, a inteligência."),
        ("#E85840", "Coral-faísca", "ACENTO", "A energia, o instante de descoberta."),
        ("#F0B464", "Mel", "QUENTE", "O calor, a recompensa, o dourado."),
        ("#0EA5A0", "Verde-água", "TEAL", "A clareza, o crescimento, o frescor."),
        ("#FAF8F4", "Creme", "FUNDO", "O espaço, a leveza, o respiro."),
    ]

    swatch_w = (W - 140) / 5
    swatch_h = 200
    sx = 60
    for (hex_c, name, role, desc) in colors_data:
        color_swatch(c, sx, H - 360, swatch_w - 6, swatch_h, hex_c, name, desc, hex_c)

        # Role chip above
        role_color = HexColor(hex_c)
        c.setFillColor(role_color)
        c.setFillAlpha(0.15)
        role_w = c.stringWidth(role, "Helvetica-Bold", 7) + 14
        c.roundRect(sx, H - 172, role_w, 14, radius=3, fill=1, stroke=0)
        c.setFillAlpha(1.0)
        c.setFillColor(role_color)
        c.setFont("Helvetica-Bold", 7)
        c.drawString(sx + 7, H - 168, role)

        sx += swatch_w + 2

    # Color usage rules
    rules_y = H - 420
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(60, rules_y, "Regras de uso")

    rules = [
        (ROXO, "Roxo-jambo", "Elementos primários, CTAs principais, headings de destaque"),
        (CORAL, "Coral-faísca", "Acentos, destaques, estados ativos, iconografia"),
        (MEL, "Mel", "Badges, highlights de insight, elementos de recompensa"),
        (TEAL, "Verde-água", "Sucesso, progresso, mapa de carreira"),
        (DARK, "Creme", "Background de página, fundo de cards leves"),
    ]

    ry = rules_y - 20
    for (color, name, usage) in rules:
        c.setFillColor(color)
        c.rect(60, ry, 8, 8, fill=1, stroke=0)
        c.setFillColor(DARK)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(76, ry, name)
        c.setFont("Helvetica", 9)
        c.setFillColor(GREY)
        c.drawString(76 + c.stringWidth(name, "Helvetica-Bold", 9) + 8, ry, f"— {usage}")
        ry -= 16

    # Proibido box
    c.setFillColor(CORAL)
    c.setFillAlpha(0.07)
    c.roundRect(60, 55, W - 120, 55, radius=8, fill=1, stroke=0)
    c.setFillAlpha(1.0)
    c.setFillColor(CORAL)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(76, 95, "PROIBIDO")
    c.setFillColor(DARK)
    c.setFont("Helvetica", 9)
    c.drawString(76, 82, "Gradiente roxo-azul genérico  ·  Paleta verde-amarelo / tucano  ·  Fundo escuro com texto neon")
    c.drawString(76, 70, "Qualquer combinação que remeta a SaaS genérico de 2022")

    draw_page_number(c, 4, 12)


def page_typography(c):
    """Page 5 — Tipografia"""
    page_bg(c, CREME)
    draw_header_bar(c, "Tipografia")

    c.setFillColor(DARK)
    c.setFillAlpha(0.04)
    c.setFont("Helvetica-Bold", 160)
    c.drawString(W - 200, 80, "04")
    c.setFillAlpha(1.0)

    draw_section_label(c, "04  —  Tipografia", y=H - 70)

    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 32)
    c.drawString(60, H - 108, "Sistema tipográfico")
    divider(c, H - 122, color=ROXO_L)

    # Fraunces section
    c.setFillColor(ROXO)
    c.setFillAlpha(0.08)
    c.roundRect(60, H - 330, W - 120, 190, radius=10, fill=1, stroke=0)
    c.setFillAlpha(1.0)

    c.setFillColor(ROXO)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(76, H - 148, "FRAUNCES  —  DISPLAY / TÍTULOS")

    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 44)
    c.drawString(76, H - 202, "Borogodó")

    c.setFont("Helvetica-Bold", 28)
    c.setFillColor(ROXO)
    c.drawString(76, H - 238, "Descubra o seu valor.")

    c.setFont("Helvetica", 18)
    c.setFillColor(DARK)
    c.setFillAlpha(0.7)
    c.drawString(76, H - 266, "O charme que você tem e nem sabia nomear.")
    c.setFillAlpha(1.0)

    c.setFillColor(GREY)
    c.setFont("Helvetica", 8)
    c.drawString(76, H - 290, "Serif display com personalidade • Itálicos deliberados • Variação de peso para ênfase")
    c.drawString(76, H - 302, "Uso: Headings H1–H3, hero sections, pull quotes, display text")

    # Geist section
    c.setFillColor(TEAL)
    c.setFillAlpha(0.07)
    c.roundRect(60, H - 510, W - 120, 165, radius=10, fill=1, stroke=0)
    c.setFillAlpha(1.0)

    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(76, H - 342, "GEIST SANS  —  CORPO / INTERFACE")

    c.setFillColor(DARK)
    c.setFont("Helvetica", 14)
    c.drawString(76, H - 365, "Texto de corpo, labels, navegação e interface.")

    c.setFont("Helvetica", 11)
    c.setFillColor(GREY)
    c.drawString(76, H - 385, "Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz")

    c.setFont("Helvetica", 10)
    c.drawString(76, H - 403, "0 1 2 3 4 5 6 7 8 9  —  ! @ # $ % & * ( )")

    c.setFillColor(DARK)
    c.setFont("Helvetica", 9)
    c.setFillColor(GREY)
    c.drawString(76, H - 426, "Moderna, legível, neutra • Excelente em telas pequenas")
    c.drawString(76, H - 438, "Uso: body, captions, labels, botões, navegação")

    # Type scale
    scale_y = H - 540
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(60, scale_y + 14, "Escala tipográfica recomendada")

    scale = [
        ("Display", "56–72px", "Helvetica-Bold", 14, "Hero headlines"),
        ("H1", "40px", "Helvetica-Bold", 12, "Títulos de seção"),
        ("H2", "28px", "Helvetica-Bold", 11, "Sub-seções"),
        ("H3", "20px", "Helvetica-Bold", 10, "Cards, labels"),
        ("Body", "16px", "Helvetica", 10, "Corpo do texto"),
        ("Caption", "12px", "Helvetica", 9, "Legendas, metadata"),
    ]

    sy = scale_y - 4
    for (name, size, font, render_size, usage) in scale:
        c.setFillColor(ROXO_L)
        c.roundRect(60, sy - 14, 55, 16, radius=3, fill=1, stroke=0)
        c.setFillColor(ROXO)
        c.setFont("Helvetica-Bold", 7.5)
        c.drawString(64, sy - 10, name)

        c.setFillColor(GREY)
        c.setFont("Helvetica", 8)
        c.drawString(122, sy - 10, size)

        c.setFillColor(DARK)
        c.setFont(font, render_size)
        c.drawString(175, sy - 10, "Borogodó — " + usage)

        sy -= 22

    # Rule
    c.setFillColor(CORAL)
    c.setFillAlpha(0.09)
    c.roundRect(60, 55, W - 120, 42, radius=6, fill=1, stroke=0)
    c.setFillAlpha(1.0)
    c.setFillColor(CORAL)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(76, 88, "REGRA FUNDAMENTAL")
    c.setFillColor(DARK)
    c.setFont("Helvetica", 9)
    c.drawString(76, 76, "O uso de UMA ÚNICA fonte em todo o produto é PROIBIDO. Fraunces dá personalidade; Geist ancora a clareza.")

    draw_page_number(c, 5, 12)


def page_voice(c):
    """Page 6 — Tom de Voz"""
    page_bg(c, CREME)
    draw_header_bar(c, "Tom de Voz")

    c.setFillColor(DARK)
    c.setFillAlpha(0.04)
    c.setFont("Helvetica-Bold", 160)
    c.drawString(W - 200, 80, "05")
    c.setFillAlpha(1.0)

    draw_section_label(c, "05  —  Tom de Voz & Copywriting", y=H - 70)

    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 32)
    c.drawString(60, H - 108, "Como falamos")
    divider(c, H - 122, color=ROXO_L)

    # Personality traits
    traits = [
        (ROXO, "Brasileiro de verdade", "Não é tradução de produto gringo. Idioma, jeito, humor e referências genuínas."),
        (CORAL, "Espirituoso e caloroso", "Com molho. Humor sutil quando cabe. Nunca corporativo, nunca seco."),
        (TEAL, "Direto, sem rodeios", "Como conversa entre amigos, não como pitch de consultor caro."),
        (MEL, "Encorajador, não bajulador", "Insight honesto. Mostra lacunas com cuidado — isso também é parte do valor."),
    ]

    ty = H - 180
    for (color, trait, desc) in traits:
        c.setFillColor(color)
        c.setFillAlpha(0.10)
        c.roundRect(60, ty - 44, W - 120, 44, radius=6, fill=1, stroke=0)
        c.setFillAlpha(1.0)
        c.setFillColor(color)
        c.rect(60, ty - 44, 4, 44, fill=1, stroke=0)
        c.setFillColor(DARK)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(74, ty - 18, trait)
        c.setFillColor(GREY)
        c.setFont("Helvetica", 9)
        c.drawString(74, ty - 32, desc)
        ty -= 56

    # Copy examples
    copy_y = ty - 20
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(60, copy_y + 14, "Exemplos de copy")

    examples = [
        ('"Você entrega mais do que sabe. O Borogodó te mostra o quê."', ROXO),
        ('"Seu histórico tem pepitas. A gente ajuda você a garimpá-las."', MEL),
        ('"Aquele quê que te faz bom no que você faz? Tá aqui."', CORAL),
        ('"Não é currículo. É o mapa do que você realmente faz."', TEAL),
    ]

    ey = copy_y - 4
    for (text, color) in examples:
        c.setFillColor(color)
        c.setFillAlpha(0.08)
        c.roundRect(60, ey - 24, W - 120, 26, radius=5, fill=1, stroke=0)
        c.setFillAlpha(1.0)
        c.setFillColor(color)
        c.rect(60, ey - 24, 3, 26, fill=1, stroke=0)
        c.setFillColor(DARK)
        c.setFont("Helvetica", 10)
        c.drawString(72, ey - 14, text)
        ey -= 34

    # Não/Sim
    ns_y = ey - 24
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(60, ns_y + 14, "Nunca assim  ×  Sempre assim")

    col_w = (W - 136) / 2

    # Nunca
    c.setFillColor(CORAL)
    c.setFillAlpha(0.08)
    c.roundRect(60, ns_y - 90, col_w, 90, radius=6, fill=1, stroke=0)
    c.setFillAlpha(1.0)
    c.setFillColor(CORAL)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(72, ns_y - 16, "NUNCA")
    c.setFillColor(DARK)
    c.setFont("Helvetica", 8.5)
    nunca = [
        '"Potencialize sua jornada profissional"',
        '"Solução inovadora de gestão de carreira"',
        '"Unlock your career potential"',
        '"AI-powered career intelligence"',
    ]
    ny = ns_y - 30
    for n in nunca:
        c.drawString(72, ny, n)
        ny -= 14

    # Sempre
    c.setFillColor(TEAL)
    c.setFillAlpha(0.08)
    c.roundRect(72 + col_w, ns_y - 90, col_w, 90, radius=6, fill=1, stroke=0)
    c.setFillAlpha(1.0)
    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(84 + col_w, ns_y - 16, "SEMPRE")
    c.setFillColor(DARK)
    c.setFont("Helvetica", 8.5)
    sempre = [
        '"Você manda bem em mais do que imagina"',
        '"Garimpando as pepitas do seu trampo"',
        '"Seu borogodó profissional, revelado"',
        '"O que você entregou, em português claro"',
    ]
    sy_t = ns_y - 30
    for s in sempre:
        c.drawString(84 + col_w, sy_t, s)
        sy_t -= 14

    draw_page_number(c, 6, 12)


def page_personas(c):
    """Page 7 — Personas"""
    page_bg(c, CREME)
    draw_header_bar(c, "Personas")

    c.setFillColor(DARK)
    c.setFillAlpha(0.04)
    c.setFont("Helvetica-Bold", 160)
    c.drawString(W - 200, 80, "06")
    c.setFillAlpha(1.0)

    draw_section_label(c, "06  —  Personas", y=H - 70)

    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 32)
    c.drawString(60, H - 108, "Para quem fazemos")
    divider(c, H - 122, color=ROXO_L)

    c.setFillColor(GREY)
    c.setFont("Helvetica", 10)
    c.drawString(60, H - 145, "Quatro perfis de white-collar brasileiro que não conseguem enxergar nem comunicar o próprio valor.")

    # Persona cards
    personas = [
        (
            "Ana",
            "Product Manager, 6 anos, AI-native",
            "Esquece o que entregou. Trava para se posicionar. Medo de soar como IA.",
            "Presença consistente. Banco de histórias para entrevista. Clareza para pleitear senioridade.",
            ROXO,
        ),
        (
            "Bruno",
            "Executivo de vendas",
            "Não documenta as próprias vitórias. Na entrevista não lembra dos números.",
            "Histórico de conquistas com números. Clareza das forças. Presença que atrai oportunidade.",
            CORAL,
        ),
        (
            "Clara",
            "Analista financeira",
            "Trabalho operacional invisível. Não sabe articular impacto. Publica nada.",
            "Enxergar o próprio impacto. Ganhar confiança e visibilidade para a próxima vaga.",
            MEL,
        ),
        (
            "Rafael",
            "Sênior tech, 7+ anos",
            "Nunca conseguiu enxergar o próprio mapa profissional. Não sabe se é generalista ou especialista.",
            "O mapa de carreira visual revela o perfil de especialização e clareza de identidade profissional.",
            TEAL,
        ),
    ]

    card_w = (W - 140) / 2
    card_h = 190
    px = 60
    py = H - 210
    for i, (name, role, pain, gain, color) in enumerate(personas):
        persona_card(c, px, py - card_h, card_w - 8, card_h, name, role, pain, gain, color)
        if i == 1:
            px = 60
            py -= card_h + 16
        else:
            px += card_w + 8

    # North star
    c.setFillColor(ROXO)
    c.setFillAlpha(0.08)
    c.roundRect(60, 55, W - 120, 52, radius=8, fill=1, stroke=0)
    c.setFillAlpha(1.0)
    draw_sparkle(c, cx=80, cy=82, size=10)
    c.setFillColor(ROXO)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(98, 92, "NORTH STAR METRIC")
    c.setFillColor(DARK)
    c.setFont("Helvetica", 9)
    c.drawString(98, 79, "Ações de valor por usuário ativo/mês: consultar insight do espelho OU publicar conteúdo gerado.")
    c.drawString(98, 67, "Se a pessoa usa e volta, estamos revelando o borogodó profissional dela.")

    draw_page_number(c, 7, 12)


def page_visual_language(c):
    """Page 8 — Linguagem Visual"""
    page_bg(c, CREME)
    draw_header_bar(c, "Linguagem Visual")

    c.setFillColor(DARK)
    c.setFillAlpha(0.04)
    c.setFont("Helvetica-Bold", 160)
    c.drawString(W - 200, 80, "07")
    c.setFillAlpha(1.0)

    draw_section_label(c, "07  —  Linguagem Visual", y=H - 70)

    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 32)
    c.drawString(60, H - 108, "Como desenhamos")
    divider(c, H - 122, color=ROXO_L)

    principles = [
        (ROXO, "Grid assimétrico e orgânico",
         "Sem simetria rígida. Composições que respiram. Elementos ligeiramente\ndeslocados criam tensão visual positiva e sensação de vida."),
        (CORAL, "Cantos arredondados",
         "Produto: border-radius generoso (8–16px). Mockups: ligeiramente\narredondados. Nunca sharp/angular ao extremo."),
        (TEAL, "Ritmo cromático por scroll",
         "Cada seção muda de temperatura cromática ao rolar. Creme → roxo claro\n→ coral claro → teal claro. Nunca uma única cor de ponta a ponta."),
        (MEL, "Espaço como elemento",
         "Whitespace é design, não ausência. Margens generosas. Hierarquia\ncriada por espaço, não só por tamanho ou peso."),
    ]

    py = H - 180
    for (color, title, desc) in principles:
        c.setFillColor(color)
        c.setFillAlpha(0.10)
        c.roundRect(60, py - 58, W - 120, 58, radius=8, fill=1, stroke=0)
        c.setFillAlpha(1.0)
        c.setFillColor(color)
        c.roundRect(60, py - 58, 4, 58, radius=0, fill=1, stroke=0)
        c.setFillColor(DARK)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(74, py - 22, title)
        c.setFillColor(GREY)
        c.setFont("Helvetica", 9)
        dy = py - 36
        for dl in desc.split("\n"):
            c.drawString(74, dy, dl)
            dy -= 13
        py -= 72

    # Do/Don't
    dd_y = py - 20
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(60, dd_y + 14, "Estética — Tech-forward, humanamente sensível")

    c.setFillColor(TEAL)
    c.setFillAlpha(0.08)
    c.roundRect(60, dd_y - 80, (W - 136) / 2, 80, radius=6, fill=1, stroke=0)
    c.setFillAlpha(1.0)
    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(72, dd_y - 18, "INSPIRA")
    c.setFillColor(DARK)
    c.setFont("Helvetica", 8.5)
    inspira = ["Linear, Notion", "Stripe, Vercel", "Framer, Arc Browser", "Maritaca AI"]
    iy = dd_y - 32
    for ins in inspira:
        c.drawString(72, iy, "• " + ins)
        iy -= 13

    c.setFillColor(CORAL)
    c.setFillAlpha(0.08)
    col_w = (W - 136) / 2
    c.roundRect(72 + col_w, dd_y - 80, col_w, 80, radius=6, fill=1, stroke=0)
    c.setFillAlpha(1.0)
    c.setFillColor(CORAL)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(84 + col_w, dd_y - 18, "EVITA")
    c.setFillColor(DARK)
    c.setFont("Helvetica", 8.5)
    evita = ["HubSpot, Salesforce", "Templates Webflow genéricos", "AI SaaS de 2022", "Verde-amarelo / tucano"]
    ey = dd_y - 32
    for ev in evita:
        c.drawString(84 + col_w, ey, "• " + ev)
        ey -= 13

    draw_page_number(c, 8, 12)


def page_antipatterns(c):
    """Page 9 — Anti-padrões"""
    page_bg(c, DARK)
    draw_header_bar(c, "Anti-Padrões")

    c.setFillColor(white)
    c.setFillAlpha(0.04)
    c.setFont("Helvetica-Bold", 160)
    c.drawString(W - 200, 80, "08")
    c.setFillAlpha(1.0)

    c.setFillColor(white)
    c.setFillAlpha(0.3)
    c.setFont("Helvetica", 8)
    c.drawString(60, H - 32, "BOROGODÓ — BRANDBOOK 2026")
    c.drawRightString(W - 60, H - 32, "ANTI-PADRÕES")
    c.setFillAlpha(1.0)

    c.setFillColor(white)
    c.setFillAlpha(0.2)
    c.setLineWidth(0.5)
    c.setStrokeColor(white)
    c.line(60, H - 38, W - 60, H - 38)
    c.setFillAlpha(1.0)

    c.setFillColor(CORAL)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(60, H - 70, "08  —  ANTI-PADRÕES")

    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 32)
    c.drawString(60, H - 108, "O que nunca fazer")

    c.setStrokeColor(white)
    c.setStrokeAlpha(0.15)
    c.setLineWidth(1)
    c.line(60, H - 118, W - 60, H - 118)
    c.setStrokeAlpha(1.0)

    antipatterns = [
        (
            "Gradiente roxo-azul genérico",
            "O gradiente #7C3AED → #2563EB é o uniforme do SaaS de 2022. Qualquer pessoa que ver vai pensar que o produto é mais um.",
            "Use o gradiente mel → coral → vermelho do símbolo. Ou cores sólidas da paleta. Nunca o roxo-azul.",
        ),
        (
            "Inter como única fonte",
            "Inter + fundo escuro + card branco = template. Sem personalidade, sem identidade, sem borogodó.",
            "Sempre Fraunces nos títulos. Geist Sans no corpo. A combinação é parte da identidade.",
        ),
        (
            "Cards dentro de cards",
            "Nested cards criam peso visual e hierarquia confusa. Cada camada a mais aumenta a carga cognitiva.",
            "Hierarquia por espaço, cor e tipografia. Não por containers sobrepostos.",
        ),
        (
            "Fundo escuro com texto neon",
            "Combinação associada a crypto, gaming, hacking — não com carreira e descoberta pessoal.",
            "Fundo creme como padrão. Fundo escuro apenas para momentos de impacto e destaque com texto branco.",
        ),
        (
            "Copy corporativo / tradução de gringo",
            '"Potencialize sua jornada profissional" ou "Unlock your career potential" em português torto.',
            "Escreva como brasileiro fala. Se soar como consultora de RH ou como tradução automática, refaça.",
        ),
    ]

    ay = H - 160
    for (title, problem, solution) in antipatterns:
        c.setFillColor(CORAL)
        c.setFillAlpha(0.12)
        c.roundRect(60, ay - 68, W - 120, 68, radius=6, fill=1, stroke=0)
        c.setFillAlpha(1.0)

        # X mark
        c.setFillColor(CORAL)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(70, ay - 26, "×")

        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(86, ay - 24, title)

        c.setFillColor(white)
        c.setFillAlpha(0.5)
        c.setFont("Helvetica", 8.5)
        c.drawString(86, ay - 38, problem[:90] + ("..." if len(problem) > 90 else ""))
        c.setFillAlpha(1.0)

        c.setFillColor(TEAL)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(86, ay - 54, "Em vez disso: ")
        c.setFillColor(white)
        c.setFillAlpha(0.7)
        c.setFont("Helvetica", 8)
        c.drawString(86 + c.stringWidth("Em vez disso: ", "Helvetica-Bold", 8), ay - 54,
                     solution[:80] + ("..." if len(solution) > 80 else ""))
        c.setFillAlpha(1.0)

        ay -= 80

    draw_page_number(c, 9, 12, bg_is_dark=True)


def page_motion(c):
    """Page 10 — Motion & Microinterações"""
    page_bg(c, CREME)
    draw_header_bar(c, "Motion & Microinterações")

    c.setFillColor(DARK)
    c.setFillAlpha(0.04)
    c.setFont("Helvetica-Bold", 160)
    c.drawString(W - 200, 80, "09")
    c.setFillAlpha(1.0)

    draw_section_label(c, "09  —  Motion & Microinterações", y=H - 70)

    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 32)
    c.drawString(60, H - 108, "Como movemos")
    divider(c, H - 122, color=ROXO_L)

    motion = [
        (ROXO, "CSS transitions — microinterações",
         "Hovers, focus, estados ativos, toggles. NUNCA JavaScript para isso.\n"
         "transition: all 150ms ease-out como padrão."),
        (CORAL, "Framer Motion — entradas e transições",
         "Reservado para animações de entrada em tela e transições complexas\n"
         "que CSS não alcança. Não bloqueia a main thread."),
        (TEAL, "Sem animações que distraem",
         "Cada animação tem propósito: confirmar ação, revelar informação,\n"
         "direcionar atenção. Animação decorativa é ruído."),
        (MEL, "Mobile-first em motion",
         "Testar em dispositivo de médio desempenho. Se a animação trava,\n"
         "ela não vai ao ar. Reduzir para baixas especificações."),
    ]

    my = H - 180
    for (color, title, desc) in motion:
        c.setFillColor(color)
        c.setFillAlpha(0.10)
        c.roundRect(60, my - 58, W - 120, 58, radius=8, fill=1, stroke=0)
        c.setFillAlpha(1.0)
        c.setFillColor(color)
        c.roundRect(60, my - 58, 4, 58, radius=0, fill=1, stroke=0)
        c.setFillColor(DARK)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(74, my - 22, title)
        c.setFillColor(GREY)
        c.setFont("Helvetica", 9)
        dy = my - 36
        for dl in desc.split("\n"):
            c.drawString(74, dy, dl)
            dy -= 13
        my -= 72

    # Timing reference
    timing_y = my - 24
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(60, timing_y + 14, "Referência de timing")

    timings = [
        ("100ms", "Feedback imediato (hover, press)", TEAL),
        ("150ms", "Microinterações padrão (CSS default)", TEAL),
        ("250ms", "Transições de estado (expand, collapse)", ROXO),
        ("400ms", "Entrada de elementos (Framer Motion)", ROXO),
        ("600ms", "Transições de página ou seção", CORAL),
    ]

    ty2 = timing_y - 4
    for (time, usage, color) in timings:
        c.setFillColor(color)
        c.setFillAlpha(0.12)
        c.roundRect(60, ty2 - 18, 52, 18, radius=4, fill=1, stroke=0)
        c.setFillAlpha(1.0)
        c.setFillColor(color)
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(86, ty2 - 11, time)
        c.setFillColor(DARK)
        c.setFont("Helvetica", 9)
        c.drawString(120, ty2 - 11, usage)
        ty2 -= 24

    # Accessibility note
    c.setFillColor(MEL_L)
    c.roundRect(60, 55, W - 120, 48, radius=8, fill=1, stroke=0)
    c.setFillColor(MEL)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(76, 92, "ACESSIBILIDADE EM MOTION")
    c.setFillColor(DARK)
    c.setFont("Helvetica", 9)
    c.drawString(76, 80, "Sempre respeitar prefers-reduced-motion. Desativar ou simplificar animações quando o sistema requisitar.")
    c.drawString(76, 68, "Animação nunca deve ser o único vetor de informação ou confirmação de ação.")

    draw_page_number(c, 10, 12)


def page_checklist(c):
    """Page 11 — Design Checklist"""
    page_bg(c, CREME)
    draw_header_bar(c, "Checklist de Design")

    c.setFillColor(DARK)
    c.setFillAlpha(0.04)
    c.setFont("Helvetica-Bold", 160)
    c.drawString(W - 200, 80, "10")
    c.setFillAlpha(1.0)

    draw_section_label(c, "10  —  Checklist de Design", y=H - 70)

    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 32)
    c.drawString(60, H - 108, "Antes de publicar")
    divider(c, H - 122, color=ROXO_L)

    c.setFillColor(GREY)
    c.setFont("Helvetica", 10)
    c.drawString(60, H - 148, "Use este checklist antes de abrir qualquer PR de frontend.")

    checks_col1 = [
        (ROXO, "Identidade"),
        ("", "  Fontes: Fraunces nos títulos, Geist no corpo"),
        ("", "  Cores: apenas tokens do sistema (globals.css)"),
        ("", "  Sem hex codes hardcoded nos componentes"),
        ("", "  Tom de voz brasileiro, sem corpo corporativo"),
        ("", "  Símbolo/logo em resolução correta"),
        (TEAL, "Tipografia"),
        ("", "  Hierarquia h1 → h2 → h3 sem pular nível"),
        ("", "  Contraste WCAG AA em todos os textos"),
        ("", "  Tamanhos adequados ao viewport mobile"),
        ("", "  Itálicos e pesos usados com propósito"),
        (CORAL, "Layout"),
        ("", "  Mobile-first: base unprefixed, md:/lg: expansão"),
        ("", "  Touch targets >= 48×48px"),
        ("", "  Whitespace como elemento, não ausência"),
        ("", "  Sem cards dentro de cards"),
        ("", "  Grid assimétrico, sem simetria rígida"),
    ]

    checks_col2 = [
        (MEL, "Cores & Contraste"),
        ("", "  Paleta: roxo, coral, mel, teal, creme"),
        ("", "  Sem gradiente roxo-azul"),
        ("", "  Sem neon em fundo escuro"),
        ("", "  Ritmo cromático entre seções"),
        (ROXO, "Motion"),
        ("", "  Microinterações: CSS transitions"),
        ("", "  Entradas complexas: Framer Motion"),
        ("", "  prefers-reduced-motion respeitado"),
        ("", "  Sem animação que bloqueie main thread"),
        (TEAL, "Acessibilidade"),
        ("", "  Todos os interativos com aria-label"),
        ("", "  Focus indicator visível"),
        ("", "  Imagens com alt text"),
        ("", "  Testado em 375px viewport"),
        (CORAL, "Qualidade"),
        ("", "  Sem console.log ou debug"),
        ("", "  Sem strings hardcoded (usar i18n)"),
    ]

    def draw_checks(checks, x, start_y):
        cy = start_y
        for (color, text) in checks:
            if color:  # Section header
                c.setFillColor(HexColor(color) if isinstance(color, str) and color.startswith("#") else color)
                c.setFont("Helvetica-Bold", 9)
                c.drawString(x, cy, text)
                cy -= 14
            else:  # Check item
                # Checkbox
                c.setFillColor(ROXO_L)
                c.roundRect(x, cy - 2, 9, 9, radius=2, fill=1, stroke=0)
                c.setFillColor(DARK)
                c.setFont("Helvetica", 8.5)
                c.drawString(x + 13, cy, text)
                cy -= 13
        return cy

    draw_checks(checks_col1, 60, H - 172)
    draw_checks(checks_col2, W / 2 + 10, H - 172)

    # Process reminder
    c.setFillColor(ROXO)
    c.setFillAlpha(0.08)
    c.roundRect(60, 55, W - 120, 52, radius=8, fill=1, stroke=0)
    c.setFillAlpha(1.0)
    draw_sparkle(c, cx=80, cy=82, size=10)
    c.setFillColor(ROXO)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(98, 95, "PROCESSO OBRIGATÓRIO")
    c.setFillColor(DARK)
    c.setFont("Helvetica", 8.5)
    c.drawString(98, 82, "/impeccable shape  →  planejar UX antes de codar")
    c.drawString(98, 70, "/impeccable audit  →  checar design antes do PR")

    draw_page_number(c, 11, 12)


def page_closing(c):
    """Page 12 — Closing"""
    page_bg(c, DARK)

    # Decorative elements
    c.saveState()
    c.setFillColor(ROXO)
    c.setFillAlpha(0.3)
    c.circle(W * 0.9, H * 0.1, 120, fill=1, stroke=0)
    c.setFillColor(CORAL)
    c.setFillAlpha(0.15)
    c.circle(W * 0.1, H * 0.85, 90, fill=1, stroke=0)
    c.setFillColor(MEL)
    c.setFillAlpha(0.08)
    c.circle(W * 0.5, H * 0.5, 280, fill=1, stroke=0)
    c.restoreState()

    # Large sparkle
    draw_sparkle(c, cx=W / 2, cy=H / 2 + 60, size=52)

    # Main message
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 42)
    c.drawCentredString(W / 2, H / 2 - 10, "Borogodó")

    c.setFillColor(white)
    c.setFillAlpha(0.6)
    c.setFont("Helvetica", 14)
    c.drawCentredString(W / 2, H / 2 - 38, "aquele quê que te faz único no que você faz")
    c.setFillAlpha(1.0)

    # Divider
    c.setStrokeColor(CORAL)
    c.setLineWidth(1.5)
    c.line(W / 2 - 80, H / 2 - 58, W / 2 + 80, H / 2 - 58)

    c.setFillColor(white)
    c.setFillAlpha(0.4)
    c.setFont("Helvetica", 10)
    c.drawCentredString(W / 2, H / 2 - 76, "borogodo.io")
    c.setFillAlpha(1.0)

    # Footer
    c.setFillColor(white)
    c.setFillAlpha(0.25)
    c.setFont("Helvetica", 8)
    c.drawCentredString(W / 2, 45, "feito com")
    c.setFillAlpha(1.0)
    draw_sparkle(c, cx=W / 2 + 40, cy=50, size=8)
    c.setFillColor(white)
    c.setFillAlpha(0.6)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(W / 2 + 52, 45, "borogodó")
    c.setFillAlpha(1.0)

    # Version
    c.setFillColor(white)
    c.setFillAlpha(0.2)
    c.setFont("Helvetica", 7.5)
    c.drawCentredString(W / 2, 30, "Brandbook v1.0  ·  Junho 2026  ·  Uso interno")
    c.setFillAlpha(1.0)

    draw_page_number(c, 12, 12, bg_is_dark=True)


def generate():
    output_path = "/Users/ohanatais/Documents/borogodo/docs/borogodo-brandbook.pdf"
    c = canvas.Canvas(output_path, pagesize=A4)
    c.setTitle("Borogodó — Brandbook 2026")
    c.setAuthor("Borogodó")
    c.setSubject("Brand Identity Guide")

    pages = [
        page_cover,
        page_concept,
        page_logo,
        page_colors,
        page_typography,
        page_voice,
        page_personas,
        page_visual_language,
        page_antipatterns,
        page_motion,
        page_checklist,
        page_closing,
    ]

    for i, page_fn in enumerate(pages):
        page_fn(c)
        c.showPage()

    c.save()
    print(f"Brandbook gerado: {output_path}")


if __name__ == "__main__":
    generate()
