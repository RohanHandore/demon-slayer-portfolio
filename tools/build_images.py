#!/usr/bin/env python3
"""Generate the on-brand image assets for rohanhandore.com.

Outputs (all written into assets/):
  images/profile.webp     560x560  hero portrait
  images/profile-280.webp 280x280  1x hero portrait
  images/og-image.png     1200x630 social card
  icons/logo-small.png    96x96    nav mark (2x of 48)
  icons/favicon-32.png    32x32
  icons/apple-touch-icon.png 180x180
Fonts are the self-hosted subset TTFs converted from assets/fonts/*.woff2.
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_IMG = os.path.join(ROOT, "assets", "images")
OUT_ICO = os.path.join(ROOT, "assets", "icons")

PAPER = (246, 244, 239)
INK = (20, 18, 15)
MUTED = (110, 104, 96)
ACCENT = (217, 72, 28)

GROTESK = "/tmp/space-grotesk-latin-var.ttf"
INTER = "/tmp/inter-latin-var.ttf"
MONO = "/tmp/jetbrains-mono-latin-var.ttf"

# The web fonts ship as woff2; Pillow needs a TTF. Unpack them on first run.
_FF = {GROTESK: "space-grotesk-latin-var", INTER: "inter-latin-var", MONO: "jetbrains-mono-latin-var"}


def ensure_ttf():
    missing = {t: n for t, n in _FF.items() if not os.path.exists(t)}
    if not missing:
        return
    try:
        from fontTools.ttLib import TTFont
    except ImportError:
        raise SystemExit("run via: uv run --with fonttools --with brotli python tools/build_images.py")
    for target, stem in missing.items():
        font_obj = TTFont(os.path.join(ROOT, "assets", "fonts", stem + ".woff2"))
        font_obj.flavor = None
        font_obj.save(target)


def font(path, size, weight_axis):
    ensure_ttf()
    f = ImageFont.truetype(path, size)
    try:
        f.set_variation_by_axes([weight_axis])
    except Exception as exc:  # pragma: no cover - depends on FreeType build
        print("  variation axis not applied:", exc)
    return f


# ---------------------------------------------------------------- profile
def make_profile():
    src = Image.open(os.path.join(OUT_IMG, "profile.jpg")).convert("RGB")
    w, h = src.size
    side = min(w, h)
    left = (w - side) // 2
    # bias the crop slightly above centre so the face is not cut
    top = max(0, int((h - side) * 0.35))
    src = src.crop((left, top, left + side, top + side))
    for size, name in ((560, "profile.webp"), (280, "profile-280.webp")):
        img = src.resize((size, size), Image.Resampling.LANCZOS)
        path = os.path.join(OUT_IMG, name)
        img.save(path, "WEBP", quality=82, method=6)
        print(f"  {name:22} {os.path.getsize(path)/1024:6.1f} KB  {size}x{size}")


# ---------------------------------------------------------------- mark
def draw_mark(size):
    """Accent rounded square with a white RH monogram."""
    scale = 4
    S = size * scale
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r = int(S * 0.22)
    d.rounded_rectangle([0, 0, S - 1, S - 1], radius=r, fill=ACCENT)
    f = font(GROTESK, int(S * 0.56), 700)
    text = "RH"
    box = d.textbbox((0, 0), text, font=f)
    tw, th = box[2] - box[0], box[3] - box[1]
    d.text(((S - tw) / 2 - box[0], (S - th) / 2 - box[1] - int(S * 0.02)), text, font=f, fill=(255, 255, 255))
    return img.resize((size, size), Image.Resampling.LANCZOS)


def make_marks():
    for size, name in ((96, "logo-small.png"), (180, "apple-touch-icon.png"), (32, "favicon-32.png")):
        img = draw_mark(size)
        path = os.path.join(OUT_ICO, name)
        if name == "favicon-32.png":
            img.convert("RGB").save(path, "PNG", optimize=True)
        else:
            img.save(path, "PNG", optimize=True)
        print(f"  {name:22} {os.path.getsize(path)/1024:6.1f} KB  {size}x{size}")


# ---------------------------------------------------------------- og card
def make_og():
    W, H = 1200, 630
    M = 80
    img = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(img)

    mono_s = font(MONO, 20, 400)
    mono_b = font(MONO, 21, 500)
    role_f = font(INTER, 33, 400)
    mono_foot = font(MONO, 19, 400)

    # monogram, right side
    mark_side = 176
    mx = W - M - mark_side
    my = 150
    img.paste(draw_mark(mark_side).convert("RGB"), (mx, my),
              draw_mark(mark_side).split()[3])

    text_w = mx - M - 64

    # name, auto-fitted to the text column
    size = 104
    box = None
    while size > 40:
        name_f = font(GROTESK, size, 700)
        box = d.textbbox((0, 0), "Rohan Handore", font=name_f)
        if box[2] - box[0] <= text_w:
            break
        size -= 2
    name_left = box[0]

    d.text((M, 76), "ROHANHANDORE.COM", font=mono_s, fill=MUTED)
    d.text((M - name_left, 176), "Rohan Handore", font=name_f, fill=INK)

    # accent rule under the name
    d.rectangle([M, 322, M + 132, 328], fill=ACCENT)

    d.text((M, 366), "Application support engineer in a tier-1 payments", font=role_f, fill=(58, 54, 49))
    d.text((M, 408), "estate. I fix production, then automate it away.", font=role_f, fill=(58, 54, 49))

    # footer meta, hairline above
    d.line([(M, H - 138), (W - M, H - 138)], fill=(224, 219, 210), width=1)
    d.text((M, H - 106), "PYTHON  /  BASH  /  SQL  /  AWS  /  KIBANA", font=mono_b, fill=(88, 82, 74))
    d.text((M, H - 72), "DUBLIN, IRELAND   /   OPEN TO SOFTWARE ROLES   /   STAMP 1G TO 2027",
           font=mono_foot, fill=(122, 116, 108))

    path = os.path.join(OUT_IMG, "og-image.jpg")
    img.save(path, "JPEG", quality=88, optimize=True, progressive=True, subsampling=1)
    print(f"  og-image.jpg           {os.path.getsize(path)/1024:6.1f} KB  {W}x{H}  (name {size}px)")


if __name__ == "__main__":
    make_marks()
    make_og()
