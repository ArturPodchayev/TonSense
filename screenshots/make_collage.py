from PIL import Image, ImageDraw, ImageFont
import os

CANVAS = 1200
BG = (10, 15, 30)
PAD = 28
GAP = 20
CORNER = 14
GLOW = (26, 143, 255, 72)
BLUE = (26, 143, 255)
GRAY = (136, 153, 170)
WHITE = (255, 255, 255)

HEADER_H = 110   # logo row + gap + tagline + padding
FOOTER_H = 44
LABEL_AREA = 38  # reserved at bottom of each cell for label text
IMG_SCALE = 0.80 # screenshot fills 80% of cell width → padding on sides

base = "c:/Projects/tonsense/screenshots"
logo_path = "c:/Projects/tonsense/public/logo.png"

items = [
    ("tl", f"{base}/dashboard.PNG",  "📊 Dashboard"),
    ("tr", f"{base}/ai agent.png",   "🤖 AI Agent"),
    ("bl", f"{base}/DCA.png",        "📅 DCA Calculator"),
    ("br", f"{base}/results.jpg",    "⏱ What If"),
]

grid_top    = PAD + HEADER_H + 14
grid_bottom = CANVAS - PAD - FOOTER_H - 14
grid_left   = PAD
grid_right  = CANVAS - PAD

grid_w = grid_right - grid_left
grid_h = grid_bottom - grid_top
cell_w = (grid_w - GAP) // 2
cell_h = (grid_h - GAP) // 2

positions = {
    "tl": (grid_left,            grid_top),
    "tr": (grid_left + cell_w + GAP, grid_top),
    "bl": (grid_left,            grid_top + cell_h + GAP),
    "br": (grid_left + cell_w + GAP, grid_top + cell_h + GAP),
}

canvas = Image.new("RGBA", (CANVAS, CANVAS), (*BG, 255))

def rounded_mask(size, radius):
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, size[0]-1, size[1]-1], radius=radius, fill=255
    )
    return mask

def fit_contain(img, max_w, max_h):
    """Resize to fit within max_w x max_h, preserving aspect ratio."""
    ratio = min(max_w / img.width, max_h / img.height)
    return img.resize((int(img.width * ratio), int(img.height * ratio)), Image.LANCZOS)

# ── Screenshots ──────────────────────────────────────────────────────────────
for key, path, _ in items:
    x, y = positions[key]
    img = Image.open(path).convert("RGBA")

    img_area_h = cell_h - LABEL_AREA - 16   # vertical space for screenshot
    max_w = int(cell_w * IMG_SCALE)
    max_h = int(img_area_h * IMG_SCALE)
    img = fit_contain(img, max_w, max_h)

    # Center horizontally, vertically within the image area
    off_x = x + (cell_w - img.width) // 2
    off_y = y + 8 + (img_area_h - img.height) // 2

    # Rounded mask for the screenshot itself
    mask = rounded_mask((img.width, img.height), CORNER - 2)
    canvas.paste(img, (off_x, off_y), mask)

# ── Glow borders on cells ────────────────────────────────────────────────────
glow_layer = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow_layer)
for key, _, _ in items:
    x, y = positions[key]
    gd.rounded_rectangle(
        [x, y, x + cell_w - 1, y + cell_h - 1],
        radius=CORNER, outline=GLOW, width=2
    )
canvas = Image.alpha_composite(canvas, glow_layer)
draw = ImageDraw.Draw(canvas)

# ── Fonts ────────────────────────────────────────────────────────────────────
def try_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()

FONTS = [
    "C:/Windows/Fonts/segoeuib.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
]
FONTS_REG = [
    "C:/Windows/Fonts/segoeui.ttf",
    "C:/Windows/Fonts/arial.ttf",
]
EMOJI_FONTS = [
    "C:/Windows/Fonts/seguiemj.ttf",
    "C:/Windows/Fonts/seguisym.ttf",
]

def first_font(paths, size):
    for p in paths:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

font_title  = first_font(FONTS, 38)
font_tag    = first_font(FONTS_REG, 17)
font_label  = first_font(FONTS_REG, 16)
font_emoji  = first_font(EMOJI_FONTS, 18)
font_footer = first_font(FONTS, 20)

# ── Labels under each screenshot ─────────────────────────────────────────────
for key, _, label in items:
    x, y = positions[key]
    lx_center = x + cell_w // 2
    ly = y + cell_h - LABEL_AREA + 6

    # Split emoji from text and draw separately to handle font differences
    emoji_char = label[0]  # e.g. "📊"
    text_part  = label[1:].strip()  # e.g. "Dashboard"

    # Measure both parts
    e_bb = draw.textbbox((0, 0), emoji_char, font=font_emoji)
    t_bb = draw.textbbox((0, 0), text_part,  font=font_label)
    e_w = e_bb[2] - e_bb[0]
    t_w = t_bb[2] - t_bb[0]
    spacing = 6
    total_w = e_w + spacing + t_w

    ex = lx_center - total_w // 2
    tx = ex + e_w + spacing
    draw.text((ex, ly), emoji_char, font=font_emoji, fill=WHITE, embedded_color=True)
    draw.text((tx, ly), text_part,  font=font_label, fill=WHITE)

# ── Header ───────────────────────────────────────────────────────────────────
logo = Image.open(logo_path).convert("RGBA")
LOGO_H = 50
logo_w = int(logo.width * LOGO_H / logo.height)
logo = logo.resize((logo_w, LOGO_H), Image.LANCZOS)
logo_mask = rounded_mask((logo_w, LOGO_H), 10)
logo_rounded = Image.new("RGBA", (logo_w, LOGO_H), (0, 0, 0, 0))
logo_rounded.paste(logo, (0, 0), logo_mask)
logo = logo_rounded

# Measure title text
ton_bb   = draw.textbbox((0, 0), "Ton",   font=font_title)
sense_bb = draw.textbbox((0, 0), "Sense", font=font_title)
ton_w    = ton_bb[2]   - ton_bb[0]
sense_w  = sense_bb[2] - sense_bb[0]
title_w  = ton_w + sense_w
title_h  = ton_bb[3]   - ton_bb[1]

block_w  = logo_w + 14 + title_w
block_x  = (CANVAS - block_w) // 2
logo_row_y = PAD + 14
logo_y   = logo_row_y + (LOGO_H - LOGO_H) // 2  # same line
title_y  = logo_row_y + (LOGO_H - title_h) // 2

canvas.paste(logo, (block_x, logo_y), logo)
tx = block_x + logo_w + 14
draw.text((tx,          title_y), "Ton",   font=font_title, fill=WHITE)
draw.text((tx + ton_w,  title_y), "Sense", font=font_title, fill=BLUE)

# Tagline
tagline = "AI-powered DeFi dashboard for TON"
tg_bb = draw.textbbox((0, 0), tagline, font=font_tag)
tg_w  = tg_bb[2] - tg_bb[0]
tg_x  = (CANVAS - tg_w) // 2
tg_y  = logo_row_y + LOGO_H + 10
draw.text((tg_x, tg_y), tagline, font=font_tag, fill=GRAY)

# ── Footer ───────────────────────────────────────────────────────────────────
footer = "tonsense.app"
fb = draw.textbbox((0, 0), footer, font=font_footer)
fw, fh = fb[2] - fb[0], fb[3] - fb[1]
fx = (CANVAS - fw) // 2
fy = CANVAS - PAD - FOOTER_H + (FOOTER_H - fh) // 2
draw.text((fx, fy), footer, font=font_footer, fill=BLUE)

# ── Save ─────────────────────────────────────────────────────────────────────
out = f"{base}/linkedin_post.png"
canvas.convert("RGB").save(out, "PNG", optimize=True)
print(f"Saved {CANVAS}x{CANVAS} → {out}")
print(f"cell: {cell_w}x{cell_h}, img max: {int(cell_w*IMG_SCALE)}x{int((cell_h-LABEL_AREA-16)*IMG_SCALE)}")
