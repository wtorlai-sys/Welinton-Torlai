#!/usr/bin/env python3
"""character.py - draw the channel's doodle characters in code (no image generator).

  python3 character.py <out_dir>        writes source.png (full body cutout) and
                                        emotions.png (3x2 sheet of heads), both
                                        with a transparent background

Style: big round off-white head about as wide as the torso, grey cel shadow on
one side, tiny dot eyes, thick brows, thick even plum-black outline (#271925),
bean torso in flat clothing, thin stick arms with dot hands, stick legs.
The character here is the Oxford scholar: black gown, white bands, mortarboard.
"""
import math, os, sys
from PIL import Image, ImageDraw, ImageChops

INK = (39, 25, 37, 255)          # #271925, never pure black
SKIN = (243, 239, 228, 255)
SKIN_SH = (186, 184, 190, 255)
GOWN = (52, 48, 74, 255)
GOWN_SH = (36, 33, 54, 255)
BAND = (246, 244, 238, 255)
HAT = (44, 40, 60, 255)
HAT_TOP = (64, 60, 86, 255)
TASSEL = (222, 170, 64, 255)
MOUTH = (120, 36, 48, 255)
TONGUE = (226, 110, 110, 255)
SWEAT = (140, 196, 240, 255)
SS = 2                            # supersampling
LW = 12                           # outline width at 1x


def P(*v): return [x * SS for x in v]


def layer(size): return Image.new("RGBA", size, (0, 0, 0, 0))


def circle(d, cx, cy, r, **kw): d.ellipse(P(cx - r, cy - r, cx + r, cy + r), **kw)


def stroke(d, pts, w=LW, fill=INK):
    pts = [(x * SS, y * SS) for x, y in pts]
    d.line(pts, fill=fill, width=w * SS, joint="curve")
    for x, y in (pts[0], pts[-1]): d.ellipse([x - w * SS / 2, y - w * SS / 2, x + w * SS / 2, y + w * SS / 2], fill=fill)


def arc_pts(cx, cy, rx, ry, a0, a1, n=24):
    return [(cx + rx * math.cos(math.radians(a0 + (a1 - a0) * i / n)), cy + ry * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]


def bezier(p0, p1, p2, n=24):
    return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]) for t in (i / n for i in range(n + 1))]


def shaded_disc(img, cx, cy, r, base, shade, outline=True):
    """Filled circle with a cel shadow crescent on the left and an ink outline."""
    m = layer(img.size); md = ImageDraw.Draw(m); circle(md, cx, cy, r, fill=(255, 255, 255, 255))
    c = layer(img.size); cd = ImageDraw.Draw(c)
    circle(cd, cx, cy, r, fill=shade)
    circle(cd, cx + r * 0.16, cy - r * 0.06, r * 0.93, fill=base)
    c.putalpha(ImageChops.multiply(c.getchannel("A"), m.getchannel("A")))
    img.alpha_composite(c)
    if outline: circle(ImageDraw.Draw(img), cx, cy, r, outline=INK, width=LW * SS)


def face(img, cx, cy, r, expr):
    d = ImageDraw.Draw(img)
    ex, ey, er = r * 0.36, cy - r * 0.02, r * 0.08
    L, R = cx - ex + r * 0.08, cx + ex + r * 0.08          # face turned a touch to the right
    bw = 13

    def brows(lt, rt, lift=0.0):
        # lt/rt: tilt of each brow in units of r (positive = inner end lower)
        for x, s, t in ((L, -1, lt), (R, 1, rt)):
            y = ey - r * (0.26 + lift)
            stroke(d, bezier((x - s * r * 0.15, y - t * r * 0.0), (x, y - r * 0.07), (x + s * r * 0.15, y + t * r * 0.0)), bw)
            if t: stroke(d, [(x - s * r * 0.16 * 0 + s * 0, y)], 1)

    def tilted_brow(x, inner_low, lift=0.0, s=1):
        y = ey - r * (0.27 + lift)
        a = (x - s * r * 0.15, y + (inner_low * r if s < 0 else 0))
        b = (x + s * r * 0.15, y + (inner_low * r if s > 0 else 0))
        inner, outer = (b, a) if s < 0 else (a, b)
        # inner end is the one nearer the nose
        if x < cx: inner, outer = (x + r * 0.15, y + inner_low * r), (x - r * 0.15, y - inner_low * r * 0.3)
        else: inner, outer = (x - r * 0.15, y + inner_low * r), (x + r * 0.15, y - inner_low * r * 0.3)
        mid = ((inner[0] + outer[0]) / 2, (inner[1] + outer[1]) / 2 - r * 0.05)
        stroke(d, bezier(outer, mid, inner), bw)

    def dot_eyes(rr=er):
        for x in (L, R): circle(d, x, ey, rr, fill=INK)

    def big_eyes():
        for x in (L, R):
            circle(d, x, ey, r * 0.17, fill=(255, 255, 255, 255), outline=INK, width=8 * SS)
            circle(d, x + r * 0.02, ey + r * 0.01, r * 0.06, fill=INK)

    my = cy + r * 0.38
    mx = cx + r * 0.08
    if expr == "neutral":
        dot_eyes(); tilted_brow(L, 0.02); tilted_brow(R, -0.03, lift=0.03)
        stroke(d, bezier((mx - r * 0.18, my), (mx, my + r * 0.06), (mx + r * 0.19, my - r * 0.04)), 9)
    elif expr == "happy":
        for x in (L, R): stroke(d, arc_pts(x, ey + r * 0.03, r * 0.1, r * 0.08, 200, 340), 10)
        tilted_brow(L, -0.04, lift=0.06); tilted_brow(R, -0.04, lift=0.06)
        top, bot = my - r * 0.08, my + r * 0.2
        pts = [(mx - r * 0.3, top)] + bezier((mx - r * 0.3, top), (mx, bot + r * 0.12), (mx + r * 0.3, top))[1:]
        d.polygon([(x * SS, y * SS) for x, y in pts], fill=(255, 255, 255, 255), outline=INK)
        stroke(d, pts + [pts[0]], 9)
        stroke(d, [(mx - r * 0.27, top + r * 0.07), (mx + r * 0.27, top + r * 0.07)], 6)
    elif expr == "nervous":
        dot_eyes(er * 1.1); tilted_brow(L, -0.09, lift=0.04); tilted_brow(R, -0.09, lift=0.04)
        pts = [(mx - r * 0.26 + i * r * 0.52 / 12, my + (r * 0.045 if i % 2 else -r * 0.045)) for i in range(13)]
        stroke(d, pts, 8)
        sx, sy = cx - r * 0.68, cy - r * 0.32
        d.polygon(P(sx, sy - r * 0.2, sx - r * 0.08, sy, sx + r * 0.08, sy), fill=SWEAT)
        circle(d, sx, sy + r * 0.02, r * 0.085, fill=SWEAT, outline=INK, width=5 * SS)
        d.polygon(P(sx, sy - r * 0.2, sx - r * 0.075, sy + r * 0.01, sx + r * 0.075, sy + r * 0.01), fill=SWEAT)
        stroke(d, [(sx - r * 0.085, sy + r * 0.01), (sx, sy - r * 0.21), (sx + r * 0.085, sy + r * 0.01)], 5)
    elif expr == "shocked":
        big_eyes(); tilted_brow(L, -0.03, lift=0.12); tilted_brow(R, -0.03, lift=0.12)
        circle(d, mx, my + r * 0.06, r * 0.15, fill=MOUTH, outline=INK, width=8 * SS)
        d.ellipse(P(mx - r * 0.08, my + r * 0.1, mx + r * 0.08, my + r * 0.19), fill=TONGUE)
    elif expr == "shouting":
        dot_eyes(er * 1.15); tilted_brow(L, 0.12, lift=-0.02); tilted_brow(R, 0.12, lift=-0.02)
        box = P(mx - r * 0.26, my - r * 0.12, mx + r * 0.26, my + r * 0.26)
        d.chord(box, 0, 360, fill=MOUTH, outline=INK, width=8 * SS)
        d.chord(P(mx - r * 0.16, my + r * 0.08, mx + r * 0.16, my + r * 0.26), 180, 360, fill=TONGUE)
        d.chord(P(mx - r * 0.2, my - r * 0.11, mx + r * 0.2, my - r * 0.01), 0, 180, fill=(255, 255, 255, 255))
        d.ellipse(box, outline=INK, width=8 * SS)
    elif expr == "confused":
        dot_eyes(); tilted_brow(L, 0.05, lift=-0.02); tilted_brow(R, -0.06, lift=0.1)
        pts = [(mx - r * 0.2 + i * r * 0.4 / 16, my + r * 0.045 * math.sin(i * 0.9)) for i in range(17)]
        stroke(d, pts, 8)
    else:
        raise SystemExit("unknown expression " + expr)


def head(img, cx, cy, r, expr):
    shaded_disc(img, cx, cy, r, SKIN, SKIN_SH)
    face(img, cx, cy, r, expr)
    hat(img, cx, cy, r)


def hat(img, cx, cy, r):
    d = ImageDraw.Draw(img)
    # skull cap hugging the top of the head
    capy = cy - r * 0.62
    pts = arc_pts(cx, cy, r * 1.0, r * 1.0, 205, 335)
    poly = [(cx - r * 0.86, capy + r * 0.08)] + [p for p in pts if p[1] <= capy + r * 0.08] + [(cx + r * 0.86, capy + r * 0.08)]
    band = [(cx - r * 0.88, capy + r * 0.1), (cx + r * 0.88, capy + r * 0.1), (cx + r * 0.84, capy - r * 0.12), (cx - r * 0.84, capy - r * 0.12)]
    d.polygon([(x * SS, y * SS) for x, y in band], fill=HAT)
    stroke(d, band + [band[0]], 10)
    # the flat square board, seen slightly from below/front: a wide flat diamond
    by = capy - r * 0.2
    board = [(cx - r * 1.12, by), (cx + r * 0.02, by - r * 0.22), (cx + r * 1.12, by), (cx - r * 0.02, by + r * 0.2)]
    d.polygon([(x * SS, y * SS) for x, y in board], fill=HAT_TOP)
    stroke(d, board + [board[0]], 10)
    circle(d, cx, by - r * 0.01, r * 0.06, fill=TASSEL, outline=INK, width=6 * SS)
    # tassel cord and tassel hanging off the right corner
    stroke(d, bezier((cx, by - r * 0.01), (cx + r * 0.5, by - r * 0.05), (cx + r * 0.7, by + r * 0.08)), 7, TASSEL)
    stroke(d, [(cx + r * 0.7, by + r * 0.08), (cx + r * 0.72, by + r * 0.4)], 7, TASSEL)
    tb = [(cx + r * 0.65, by + r * 0.36), (cx + r * 0.79, by + r * 0.36), (cx + r * 0.82, by + r * 0.56), (cx + r * 0.62, by + r * 0.56)]
    d.polygon([(x * SS, y * SS) for x, y in tb], fill=TASSEL)
    stroke(d, tb + [tb[0]], 6)


def body(img, cx, top):
    """Bean torso in a black academic gown with white bands; returns shoulder and hip points."""
    w, h = 420, 500
    x0, y0 = cx - w / 2, top
    m = layer(img.size); md = ImageDraw.Draw(m)
    md.ellipse(P(x0, y0, x0 + w, y0 + h), fill=(255, 255, 255, 255))
    c = layer(img.size); cd = ImageDraw.Draw(c)
    cd.rectangle(P(x0 - 10, y0 - 10, x0 + w + 10, y0 + h + 10), fill=GOWN_SH)
    cd.ellipse(P(x0 + w * 0.12, y0 - h * 0.04, x0 + w * 1.05, y0 + h * 0.96), fill=GOWN)
    # front opening of the gown and the shirt underneath
    cd.polygon(P(cx - 40, y0, cx + 40, y0, cx + 26, y0 + h, cx - 26, y0 + h), fill=(232, 228, 220, 255))
    cd.line(P(cx - 40, y0, cx - 26, y0 + h), fill=INK, width=6 * SS)
    cd.line(P(cx + 40, y0, cx + 26, y0 + h), fill=INK, width=6 * SS)
    for i in range(3): cd.ellipse(P(cx - 7, y0 + 170 + i * 80, cx + 7, y0 + 184 + i * 80), fill=INK)
    c.putalpha(ImageChops.multiply(c.getchannel("A"), m.getchannel("A")))
    img.alpha_composite(c)
    d = ImageDraw.Draw(img)
    # white preaching bands under the chin
    for s in (-1, 1):
        b = [(cx + s * 4, y0 + 20), (cx + s * 30, y0 + 20), (cx + s * 26, y0 + 120), (cx + s * 4, y0 + 120)]
        d.polygon([(x * SS, y * SS) for x, y in b], fill=BAND)
        stroke(d, b + [b[0]], 6)
    d.ellipse(P(x0, y0, x0 + w, y0 + h), outline=INK, width=LW * SS)
    return (x0 + 62, y0 + 95), (x0 + w - 62, y0 + 95), (cx - 62, y0 + h - 8), (cx + 62, y0 + h - 8)


def character(out):
    W, H = 900, 1340
    img = layer((W * SS, H * SS)); d = ImageDraw.Draw(img)
    cx, hr = 450, 215
    head_cy = 360
    sL, sR, hL, hR = body(img, cx, head_cy + hr - 30)
    # legs (behind nothing, drawn first would be hidden by the body outline anyway)
    for (x, y), s in ((hL, -1), (hR, 1)):
        foot = (x + s * 8, 1290)
        stroke(d, [(x, y), foot], 13)
        stroke(d, [foot, (foot[0] + s * 46, foot[1] + 6)], 13)
    # arms: hang slightly away from the torso, small dot hands
    for (x, y), s in ((sL, -1), (sR, 1)):
        pts = bezier((x, y), (x + s * 120, y + 150), (x + s * 92, y + 330))
        stroke(d, pts, 13)
        circle(d, pts[-1][0], pts[-1][1] + 8, 23, fill=INK)
    head(img, cx, head_cy, hr, "neutral")
    img = img.resize((W, H), Image.LANCZOS)
    img.save(os.path.join(out, "source.png"))


def sheet(out):
    names = ["happy", "nervous", "shocked", "shouting", "confused", "neutral"]
    cw, ch, r = 700, 720, 215
    img = layer((cw * 3 * SS, ch * 2 * SS))
    for i, n in enumerate(names):
        cx, cy = cw * (i % 3) + cw / 2, ch * (i // 3) + ch / 2 + 40
        head(img, cx, cy, r, n)
    img = img.resize((cw * 3, ch * 2), Image.LANCZOS)
    img.save(os.path.join(out, "emotions.png"))
    return names


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "."
    os.makedirs(out, exist_ok=True)
    character(out)
    print("faces:", ",".join(sheet(out)))
