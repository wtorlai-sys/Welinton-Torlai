"""Capas A/B de "A chuva da vovó" no padrão das capas de animação Roblox:
balão de fala branco com contorno preto (palavra-chave em vermelho) ou "EU" amarelo + seta vermelha.
uso: python3 scripts/chuva_capas.py <arteA.png> <arteB.png> <fonte.ttf>
"""
import sys
from PIL import Image, ImageDraw, ImageFont, ImageEnhance

arteA, arteB, FONT = sys.argv[1:4]
W, H = 1920, 1080
RED = (230, 40, 40)


def base(p):
    im = Image.open(p).convert('RGB')
    r = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
    x, y = (im.width - W) // 2, (im.height - H) // 2
    im = im.crop((x, y, x + W, y + H))
    im = ImageEnhance.Color(im).enhance(1.12)
    return ImageEnhance.Contrast(im).enhance(1.06)


def bubble(im, cx, cy, parts, size, tail, base_at=0.0):
    """parts: [(texto, cor)] numa linha. tail: (x, y) ponta do rabinho."""
    d = ImageDraw.Draw(im)
    f = ImageFont.truetype(FONT, size)
    tw = sum(d.textlength(t, font=f) for t, _ in parts)
    pad_x, pad_y = size * 0.45, size * 0.32
    bw, bh = tw + 2 * pad_x, size * 1.05 + 2 * pad_y
    x0, y0 = cx - bw / 2, cy - bh / 2
    # rabinho
    bx = cx + bw * base_at
    tri = [(bx - bw * 0.09, y0 + bh - 4), (bx + bw * 0.09, y0 + bh - 4), tail]
    d.polygon(tri, fill='white', outline='black')
    d.line([tri[0], tail, tri[1]], fill='black', width=12)
    d.rounded_rectangle([x0, y0, x0 + bw, y0 + bh], radius=bh * 0.32, fill='white', outline='black', width=12)
    d.polygon([(tri[0][0] + 8, y0 + bh - 10), (tri[1][0] - 8, y0 + bh - 10), (tail[0], tail[1] - 22)], fill='white')
    x = x0 + pad_x
    for t, c in parts:
        d.text((x, y0 + pad_y - size * 0.08), t, font=f, fill=c)
        x += d.textlength(t, font=f)


def outlined(im, xy, text, size, fill, stroke=18):
    d = ImageDraw.Draw(im)
    f = ImageFont.truetype(FONT, size)
    d.text(xy, text, font=f, fill=fill, stroke_width=stroke, stroke_fill='black')


def arrow(im, pts, width=34):
    """Seta vermelha grossa com contorno preto ao longo de pts (o último ponto é a ponta)."""
    import math
    d = ImageDraw.Draw(im)
    (x1, y1), (x2, y2) = pts[-2], pts[-1]
    a = math.atan2(y2 - y1, x2 - x1)
    L = width * 2.6
    head = [(x2, y2), (x2 - L * math.cos(a - 0.5), y2 - L * math.sin(a - 0.5)), (x2 - L * math.cos(a + 0.5), y2 - L * math.sin(a + 0.5))]
    body_end = (x2 - L * 0.8 * math.cos(a), y2 - L * 0.8 * math.sin(a))
    line = pts[:-1] + [body_end]
    d.line(line, fill='black', width=width + 20, joint='curve')
    d.polygon(head, fill='black', outline='black', width=12)
    d.line(line, fill=RED, width=width, joint='curve')
    shrink = [(x2 - 10 * math.cos(a), y2 - 10 * math.sin(a))] + head[1:]
    cx = sum(p[0] for p in head) / 3
    cy = sum(p[1] for p in head) / 3
    d.polygon([(cx + (p[0] - cx) * 0.78, cy + (p[1] - cy) * 0.78) for p in head], fill=RED)


# A — balão saindo do menino: "SÓ EM MIM?!"
a = base(arteA)
bubble(a, 1180, 130, [('SÓ EM ', 'black'), ('MIM?!', RED)], 124, (800, 300), base_at=-0.3)
a.save('out/capa_A.jpg', quality=93)

# B — "EU" amarelo + seta vermelha apontando para o menino da nuvem
b = base(arteB)
outlined(b, (90, 70), 'EU', 300, (255, 214, 10), stroke=22)
arrow(b, [(600, 210), (900, 140), (1200, 170), (1410, 290)])
b.save('out/capa_B.jpg', quality=93)
print('ok out/capa_A.jpg out/capa_B.jpg')
