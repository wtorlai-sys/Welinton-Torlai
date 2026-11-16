#!/usr/bin/env python3
"""chalkboard.py - a painted chalkboard card with chalk writing, for a "plane" prop.

  python3 chalkboard.py <out.png> "LINE 1" ["LINE 2" ...]

Dark green slate with a wooden frame, chalk-white text with a rough, dusty
edge, a few smudges. Deterministic. Use it as {"type": "plane", "image": ...}.
"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1200, 800
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def main(out, lines):
    rng = np.random.default_rng(3)
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, W, H], 26, fill=(124, 82, 48, 255), outline=(39, 25, 37, 255), width=14)
    d.rectangle([48, 48, W - 48, H - 48], fill=(46, 82, 66, 255), outline=(39, 25, 37, 255), width=8)
    # smudges
    sm = Image.new("RGBA", (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(sm)
    for _ in range(9):
        x, y, r = rng.uniform(100, W - 100), rng.uniform(100, H - 100), rng.uniform(60, 160)
        sd.ellipse([x - r, y - r * 0.5, x + r, y + r * 0.5], fill=(220, 236, 226, 22))
    img.alpha_composite(sm.filter(ImageFilter.GaussianBlur(30)))
    # chalk text: draw, then break it up with noise so it reads as chalk
    tx = Image.new("L", (W, H), 0); td = ImageDraw.Draw(tx)
    sizes = [190 if i == 0 else 110 for i in range(len(lines))]
    total = sum(s * 1.15 for s in sizes); y = (H - total) / 2
    for line, s in zip(lines, sizes):
        f = ImageFont.truetype(FONT, s)
        w = td.textlength(line, font=f)
        td.text(((W - w) / 2, y), line, font=f, fill=255); y += s * 1.15
    m = np.asarray(tx).astype(np.float32) / 255
    grain = rng.uniform(0.55, 1.0, m.shape)
    a = (m * grain * 235).astype(np.uint8)
    chalk = Image.new("RGBA", (W, H), (244, 246, 238, 0)); chalk.putalpha(Image.fromarray(a).filter(ImageFilter.GaussianBlur(0.8)))
    img.alpha_composite(chalk)
    # chalk tray
    d.rectangle([W * 0.2, H - 62, W * 0.8, H - 40], fill=(98, 64, 38, 255), outline=(39, 25, 37, 255), width=5)
    d.rounded_rectangle([W * 0.6, H - 78, W * 0.66, H - 62], 6, fill=(240, 240, 232, 255))
    img.save(out)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2:])
