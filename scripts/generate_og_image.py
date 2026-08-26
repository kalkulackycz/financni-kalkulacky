# Skript pro vygenerování OG obrázku webu Finanční Mapa (1200x630, JPG).
# Barvy a styl odpovídají css/style.css (tmavý gradient #0f172a -> #1e1b4b,
# indigový akcent #818cf8/#c7d2fe). Spuštění: python scripts/generate_og_image.py
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import os

W, H = 1200, 630
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "images", "og-image.jpg")

# --- pozadí: diagonální gradient #0f172a -> #1e1b4b ---
img = Image.new("RGB", (W, H))
top = (15, 23, 42)      # #0f172a
bot = (30, 27, 75)      # #1e1b4b
px = img.load()
for y in range(H):
    for x in range(W):
        t = (x / W * 0.5) + (y / H * 0.5)
        px[x, y] = tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3))

draw = ImageDraw.Draw(img, "RGBA")

# --- jemná indigová záře vpravo dole (odpovídá stínům/akcentům menu) ---
glow = Image.new("L", (W, H), 0)
gd = ImageDraw.Draw(glow)
gd.ellipse([W - 500, H - 420, W + 260, H + 220], fill=60)
gd.ellipse([-260, -300, 300, 200], fill=35)
glow = glow.filter(ImageFilter.GaussianBlur(120))
indigo = Image.new("RGB", (W, H), (129, 140, 248))  # #818cf8
img = Image.composite(indigo, img, glow.point(lambda v: min(v, 90)))
draw = ImageDraw.Draw(img, "RGBA")

# --- fonty: Segoe UI (font webu) ---
def load(name, size):
    path = os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts", name)
    return ImageFont.truetype(path, size)

try:
    f_bold = load("segoeuib.ttf", 118)
    f_light = load("segoeuil.ttf", 44)
    f_small = load("segoeuisl.ttf", 30)
except OSError:
    f_bold = load("arialbd.ttf", 118)
    f_light = load("arial.ttf", 44)
    f_small = load("ariali.ttf", 30)

title = "Finanční Mapa"
subtitle = "Finanční kalkulačky, kurzy měn a praktické tipy"
brand = "financnimapa.cz"

# svislé centrované složení
tw = draw.textlength(title, font=f_bold)
sw = draw.textlength(subtitle, font=f_light)
bw = draw.textlength(brand, font=f_small)
block_h = 118 + 40 + 44 + 70 + 30
ty = (H - block_h) // 2

# akcentová linka nad titulkem (#818cf8)
line_w = 160
draw.rounded_rectangle([(W - line_w) // 2, ty - 36, (W + line_w) // 2, ty - 26],
                       radius=5, fill=(129, 140, 248, 255))

draw.text(((W - tw) / 2, ty), title, font=f_bold, fill=(238, 242, 255, 255))   # #eef2ff
draw.text(((W - sw) / 2, ty + 158), subtitle, font=f_light, fill=(199, 210, 254, 255))  # #c7d2fe
draw.text(((W - bw) / 2, ty + 248), brand, font=f_small, fill=(148, 163, 184, 220))

os.makedirs(os.path.dirname(OUT), exist_ok=True)
img.save(OUT, "JPEG", quality=85)
print("OK:", OUT, img.size)