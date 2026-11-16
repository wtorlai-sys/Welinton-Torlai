# Texturas "pintadas à mão" e fundo ilustrado, gerados de forma procedural e determinística (seed fixa).
import sys, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter
out = sys.argv[1]; rng = np.random.default_rng(1902)
INK = (39, 25, 37)
def hexc(h): h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
def noise(n, scale, octaves=4, seed=0):
    r = np.random.default_rng(seed); acc = np.zeros((n, n), np.float32); a = 1; tot = 0
    for o in range(octaves):
        s = max(2, int(n / scale * 2 ** o)); g = r.random((s, s)).astype(np.float32)
        g = np.tile(g, (2, 2)); g = cv2.resize(g, (2 * n, 2 * n), interpolation=cv2.INTER_CUBIC)[:n, :n]
        acc += a * g; tot += a; a *= 0.5
    acc /= tot; return (acc - acc.min()) / (np.ptp(acc) + 1e-6)
def strokes(img, n, cols, size=(18, 60), alpha=0.18, seed=0):
    r = np.random.default_rng(seed); W, H = img.size; lay = Image.new('RGBA', img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    for _ in range(n):
        x, y = r.random() * W, r.random() * H; L = r.uniform(*size); a = r.uniform(-0.5, 0.5); c = cols[r.integers(len(cols))]
        for dx in (-W, 0, W):
            for dy in (-H, 0, H):
                d.line([(x + dx, y + dy), (x + dx + L * np.cos(a), y + dy + L * np.sin(a))], fill=c + (int(255 * alpha),), width=int(r.uniform(5, 12)))
    img.alpha_composite(lay.filter(ImageFilter.GaussianBlur(1.2)))
def base(n, c1, c2, scale=3, seed=0):
    t = noise(n, scale, seed=seed)[..., None]; a, b = np.array(hexc(c1), np.float32), np.array(hexc(c2), np.float32)
    return Image.fromarray((a * (1 - t) + b * t).astype(np.uint8)).convert('RGBA')
def save(img, name): img.convert('RGB').save(f'{out}/textures/{name}', quality=92); print(name)
N = 1024
# chão: paralelepípedo/terra batida de rua colonial
img = base(N, '#b98a62', '#d8b088', 2, 1); d = ImageDraw.Draw(img)
r = np.random.default_rng(3); rows = 8
for j in range(rows):
    y0 = j * N / rows; off = (j % 2) * N / 16
    for i in range(9):
        x0 = (i * N / 8 + off) % N; w = N / 8 - 10; h = N / rows - 10
        sh = r.uniform(-12, 12); c = tuple(int(v + sh) for v in hexc('#c99c72'))
        for dx in (-N, 0):
            box = [x0 + dx + 5, y0 + 5, x0 + dx + w, y0 + h]
            d.rounded_rectangle(box, radius=26, fill=c + (255,), outline=INK + (255,), width=6)
            d.arc([box[0] + 10, box[1] + 8, box[2] - 10, box[3] - 8], 200, 290, fill=(240, 214, 176, 255), width=6)
strokes(img, 900, [hexc('#8e5f45'), hexc('#e9c9a0'), hexc('#7a5a6e')], (10, 40), 0.15, 2)
save(img, 'chao.jpg')
# parede: reboco amarelo-ocre colonial francês
img = base(N, '#d9a85a', '#ecc77f', 2.5, 4)
strokes(img, 1400, [hexc('#c28a45'), hexc('#f3d9a0'), hexc('#b77d55')], (30, 90), 0.16, 5)
d = ImageDraw.Draw(img)
for k in range(5):  # rachaduras e manchas
    x, y = r.uniform(0, N), r.uniform(0, N); pts = [(x, y)]
    for _ in range(6): x += r.uniform(-30, 30); y += r.uniform(10, 40); pts.append((x, y))
    d.line(pts, fill=INK + (150,), width=3)
for k in range(6):
    x, y = r.uniform(0, N), r.uniform(0, N); d.ellipse([x, y, x + 140, y + 60], fill=(150, 110, 90, 40))
save(img.filter(ImageFilter.SMOOTH), 'parede.jpg')
# telhado: telhas de barro (terracota)
img = base(N, '#a8513a', '#c86a46', 2, 7); d = ImageDraw.Draw(img); rows = 10
for j in range(rows):
    y = j * N / rows
    for i in range(13):
        x = i * N / 12 + (j % 2) * N / 24
        for dx in (-N, 0, N):
            d.chord([x + dx - 4, y - N / rows * 0.6, x + dx + N / 12 + 4, y + N / rows], 0, 180, fill=(196, 98, 66, 255), outline=INK + (255,), width=5)
            d.arc([x + dx + 10, y - 10, x + dx + N / 12 - 10, y + N / rows - 18], 20, 80, fill=(232, 150, 108, 255), width=5)
strokes(img, 600, [hexc('#7e3a2c'), hexc('#e39a72')], (10, 40), 0.15, 8)
save(img, 'telhado.jpg')
# tijolo do esgoto
img = base(N, '#6b5a6e', '#8a7a86', 2, 9); d = ImageDraw.Draw(img); rows = 12
for j in range(rows):
    y = j * N / rows; off = (j % 2) * N / 12
    for i in range(7):
        x = i * N / 6 + off; sh = r.uniform(-14, 14); c = tuple(int(v + sh) for v in hexc('#9a6f5e'))
        for dx in (-N, 0):
            d.rectangle([x + dx + 4, y + 4, x + dx + N / 6 - 4, y + N / rows - 4], fill=c + (255,), outline=INK + (255,), width=5)
strokes(img, 900, [hexc('#5a7a5e'), hexc('#4a3a4e'), hexc('#c09080')], (10, 40), 0.18, 10)
save(img, 'tijolo.jpg')
# água do esgoto
img = base(N, '#3f5a50', '#6a8a6a', 2, 11); strokes(img, 1200, [hexc('#9ab89a'), hexc('#2e4038')], (40, 120), 0.2, 12); save(img, 'agua.jpg')
# madeira
img = base(N, '#8a5a3a', '#b07a4e', 1.5, 13); d = ImageDraw.Draw(img)
for i in range(8): d.line([(0, i * N / 8), (N, i * N / 8)], fill=INK + (255,), width=6)
strokes(img, 900, [hexc('#6a4028'), hexc('#c8925e')], (60, 200), 0.2, 14); save(img, 'madeira.jpg')

# ---------- fundo 21:9: céu + Hanói distante ----------
W, H = 3360, 1440
y = np.linspace(0, 1, H)[:, None, None]
top, hor = np.array(hexc('#5f86d8'), np.float32), np.array(hexc('#f2c08f'), np.float32)
sky = top * (1 - y ** 1.3) + hor * (y ** 1.3); bg = Image.fromarray(np.broadcast_to(sky, (H, W, 3)).astype(np.uint8)).convert('RGBA')
d = ImageDraw.Draw(bg)
for k in range(9):  # nuvens pintadas
    cx, cy = r.uniform(0, W), r.uniform(120, 560); s = r.uniform(0.7, 1.4)
    for j in range(6):
        ox, oy, rr = r.uniform(-160, 160) * s, r.uniform(-30, 30) * s, r.uniform(60, 110) * s
        d.ellipse([cx + ox - rr, cy + oy - rr * 0.7, cx + ox + rr, cy + oy + rr * 0.7], fill=(255, 244, 232, 235))
    d.ellipse([cx - 200 * s, cy + 10 * s, cx + 200 * s, cy + 60 * s], fill=(236, 210, 214, 200))
def skyline(base_y, col, seed, hmin, hmax, pag=False):
    rr = np.random.default_rng(seed); x = 0
    while x < W:
        w = rr.uniform(90, 220); h = rr.uniform(hmin, hmax)
        d.rectangle([x, base_y - h, x + w, H], fill=col)
        if rr.random() < 0.5: d.polygon([(x - 12, base_y - h), (x + w / 2, base_y - h - 60), (x + w + 12, base_y - h)], fill=col)
        if pag and rr.random() < 0.18:  # pagode de telhados curvos
            px = x + w / 2
            for t in range(4):
                yy = base_y - h - 40 - t * 70; ww = 120 - t * 22
                d.polygon([(px - ww - 30, yy + 12), (px - ww, yy), (px + ww, yy), (px + ww + 30, yy + 12), (px + ww, yy + 30), (px - ww, yy + 30)], fill=col)
                d.rectangle([px - ww * 0.7, yy + 30, px + ww * 0.7, yy + 70], fill=col)
        if rr.random() < 0.35:  # árvores
            tx = x + rr.uniform(0, w); tr = rr.uniform(40, 80); d.ellipse([tx - tr, base_y - h * 0.6 - tr, tx + tr, base_y - h * 0.6 + tr], fill=col)
        x += w + rr.uniform(-20, 30)
skyline(1050, (176, 160, 196, 255), 21, 120, 300, True)
skyline(1130, (140, 120, 160, 255), 22, 80, 220, True)
d.rectangle([0, 1130, W, H], fill=(120, 104, 130, 255))
bg = bg.filter(ImageFilter.GaussianBlur(1.5))
bg.convert('RGB').save(f'{out}/bg/hanoi.jpg', quality=92); print('bg')
