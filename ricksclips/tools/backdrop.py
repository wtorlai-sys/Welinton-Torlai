#!/usr/bin/env python3
"""backdrop.py - the flat painted sky + far distance, made in code (21:9, wraps horizontally).

  python3 backdrop.py <out.png> [oxford|aztec]

Soft vertical sky gradient, a few painted clouds, and along the bottom a hazy
skyline (Oxford: sandstone towers, spires and a dome among trees; aztec: lake,
volcanoes and low adobe blocks). The left and right edges meet so the stage can
wrap it around the world. Deterministic.
"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 2048, 868


def wrap_draw(draw_fn, img):
    """Draw at x, x-W and x+W so shapes crossing an edge reappear on the other side."""
    for ox in (-W, 0, W): draw_fn(ImageDraw.Draw(img), ox)


def sky(top, horizon):
    t = np.linspace(0, 1, H)[:, None, None] ** 1.3
    a = np.array(top)[None, None] * (1 - t) + np.array(horizon)[None, None] * t
    return Image.fromarray(np.repeat(a, W, axis=1).astype(np.uint8)).convert("RGBA")


def clouds(img, seed, color=(236, 244, 250, 235)):
    rng = np.random.default_rng(seed)
    lay = Image.new("RGBA", img.size, color[:3] + (0,))
    for _ in range(5):
        cx, cy, s = rng.uniform(0, W), rng.uniform(90, 420), rng.uniform(0.45, 0.9)
        def f(d, ox):
            d.rounded_rectangle([cx + ox - 190 * s, cy - 18 * s, cx + ox + 200 * s, cy + 26 * s], 26 * s, fill=color)
            for dx, dy, r in ((-90, -20, 62), (0, -55, 92), (95, -25, 66), (160, 0, 40), (-150, 2, 40)):
                d.ellipse([cx + ox + (dx - r) * s, cy + (dy - r) * s, cx + ox + (dx + r) * s, cy + (dy + r) * s], fill=color)
        wrap_draw(f, lay)
    lay = lay.filter(ImageFilter.GaussianBlur(3))
    img.alpha_composite(lay)


def oxford(img):
    rng = np.random.default_rng(7)
    base = 868
    far = Image.new("RGBA", img.size, (0, 0, 0, 0))
    near = Image.new("RGBA", img.size, (0, 0, 0, 0))
    stone_far, stone = (196, 186, 170, 255), (226, 196, 140, 255)
    roof, win = (150, 140, 150, 255), (150, 120, 96, 255)
    tree, tree2 = (120, 160, 108, 255), (98, 142, 92, 255)
    x = 0
    while x < W:                                              # far ridge of grey-blue towers
        w = rng.uniform(80, 150); h = rng.uniform(90, 170)
        def f(d, ox, x=x, w=w, h=h):
            d.rectangle([x + ox, base - 120 - h, x + ox + w, base], fill=stone_far)
            d.polygon([(x + ox + w * 0.3, base - 120 - h), (x + ox + w * 0.5, base - 200 - h), (x + ox + w * 0.7, base - 120 - h)], fill=stone_far)
        wrap_draw(f, far); x += w + rng.uniform(40, 120)
    x = 20
    i = 0
    while x < W - 60:                                          # nearer sandstone colleges, spires and a dome
        kind = ["hall", "spire", "hall", "tower", "dome", "hall", "spire"][i % 7]; i += 1
        w = {"hall": rng.uniform(170, 240), "spire": 70, "tower": 90, "dome": 170}[kind]
        def f(d, ox, x=x, w=w, kind=kind):
            X = x + ox
            if kind == "hall":
                top = base - 150
                d.rectangle([X, top, X + w, base], fill=stone)
                d.polygon([(X - 8, top), (X + w / 2, top - 46), (X + w + 8, top)], fill=roof)
                for k in range(int(w // 34)):
                    wx = X + 16 + k * 34
                    d.rounded_rectangle([wx, top + 26, wx + 14, top + 60], 7, fill=win)
                    d.rounded_rectangle([wx, top + 84, wx + 14, top + 118], 7, fill=win)
            elif kind == "spire":
                d.rectangle([X + 10, base - 260, X + w - 10, base], fill=stone)
                d.polygon([(X + 6, base - 260), (X + w / 2, base - 430), (X + w - 6, base - 260)], fill=stone)
                d.rounded_rectangle([X + w / 2 - 7, base - 230, X + w / 2 + 7, base - 190], 7, fill=win)
            elif kind == "tower":
                d.rectangle([X, base - 300, X + w, base], fill=stone)
                for k in range(4): d.rectangle([X + k * w / 4 + 2, base - 322, X + k * w / 4 + w / 8 + 2, base - 300], fill=stone)
                d.rounded_rectangle([X + w / 2 - 9, base - 270, X + w / 2 + 9, base - 220], 9, fill=win)
            else:
                d.rectangle([X, base - 170, X + w, base], fill=stone)
                d.ellipse([X + 15, base - 290, X + w - 15, base - 110], fill=(212, 188, 150, 255))
                d.rectangle([X + w / 2 - 6, base - 320, X + w / 2 + 6, base - 285], fill=stone)
        wrap_draw(f, near)
        if rng.random() < 0.7:                                 # a round tree between buildings
            tx, r = x + w + 10, rng.uniform(38, 56)
            def g(d, ox, tx=tx, r=r):
                d.rectangle([tx + ox - 4, base - 70, tx + ox + 4, base], fill=(110, 90, 80, 255))
                for dx, dy, k in ((0, -90, 1), (-r * 0.5, -70, 0.7), (r * 0.5, -72, 0.75)):
                    d.ellipse([tx + ox + dx - r * k, base + dy - r * k, tx + ox + dx + r * k, base + dy + r * k], fill=tree if k == 1 else tree2)
            wrap_draw(g, near)
        x += w + rng.uniform(30, 90)
    sky_line = Image.new("RGBA", img.size, (205, 222, 236, 0))
    sky_line.alpha_composite(far.filter(ImageFilter.GaussianBlur(2)))
    hz = far.getchannel("A").point(lambda v: 110 if v else 0)
    haze = Image.new("RGBA", img.size, (205, 222, 236, 0)); haze.putalpha(hz)
    sky_line.alpha_composite(haze)
    sky_line.alpha_composite(near.filter(ImageFilter.GaussianBlur(1.2)))
    sky_line = sky_line.resize(  # keep the skyline low, about a fifth of the painting
        (W, int(H * 0.52)), Image.LANCZOS)
    img.alpha_composite(sky_line, (0, H - sky_line.height))
    fade = np.zeros((H, W, 4), np.uint8); fade[..., :3] = (214, 228, 236)
    fade[..., 3] = (np.clip((np.arange(H) - (H - 120)) / 120, 0, 1) * 150).astype(np.uint8)[:, None]
    img.alpha_composite(Image.fromarray(fade))


def aztec(img):
    base = 868
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    for vx, vh, vw, col in ((420, 330, 520, (150, 160, 190, 255)), (1500, 280, 460, (140, 150, 186, 255))):
        def f(d, ox, vx=vx, vh=vh, vw=vw, col=col):
            d.polygon([(vx + ox - vw, base - 90), (vx + ox - 40, base - 90 - vh), (vx + ox + 40, base - 90 - vh), (vx + ox + vw, base - 90)], fill=col)
            d.polygon([(vx + ox - 60, base - 70 - vh), (vx + ox - 40, base - 90 - vh), (vx + ox + 40, base - 90 - vh), (vx + ox + 60, base - 70 - vh)], fill=(240, 244, 250, 255))
        wrap_draw(f, lay)
    def lake(d, ox): d.rectangle([ox, base - 95, ox + W, base], fill=(120, 170, 196, 255))
    wrap_draw(lake, lay)
    rng = np.random.default_rng(9); x = 0
    while x < W:
        w = rng.uniform(60, 130)
        def g(d, ox, x=x, w=w):
            d.rectangle([x + ox, base - 70, x + ox + w, base - 20], fill=(206, 160, 116, 255))
        wrap_draw(g, lay); x += w + rng.uniform(20, 80)
    img.alpha_composite(lay.filter(ImageFilter.GaussianBlur(1.5)))


if __name__ == "__main__":
    out, kind = sys.argv[1], (sys.argv[2] if len(sys.argv) > 2 else "oxford")
    img = sky((112, 164, 222), (238, 214, 186))
    clouds(img, 3)
    (oxford if kind == "oxford" else aztec)(img)
    # gentle brush texture over everything
    n = np.random.default_rng(1).normal(0, 1.6, (H // 6, W // 6))
    n = np.asarray(Image.fromarray(((n + 20) * 4).clip(0, 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)).astype(np.float32) / 4 - 20
    a = np.asarray(img.convert("RGB")).astype(np.float32) + n[..., None]
    Image.fromarray(a.clip(0, 255).astype(np.uint8)).save(out)
