#!/usr/bin/env python3
"""textures.py - hand-painted comic textures, seamless (tileable), made in code.

  python3 textures.py <out_dir>   writes cobble.png, sandstone.png, slate.png,
                                  adobe.png (1024x1024, tile edge to edge)

Each surface is a staggered grid of rounded pieces drawn on a wrap-around
canvas (so the edges meet), with a per-piece colour shift, a soft painted
highlight on the top-left and shade on the bottom-right, brush noise, and thin
plum lines in the joints. Deterministic: every random draw uses a fixed seed.
"""
import os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

N = 1024
JOINT = (74, 44, 62)


def noise(seed, scale, n=N):
    """Smooth tileable value noise in [0, 1]."""
    rng = np.random.default_rng(seed)
    g = rng.random((scale, scale))
    x = np.linspace(0, scale, n, endpoint=False)
    i0 = np.floor(x).astype(int); f = x - i0; f = f * f * (3 - 2 * f)
    i1 = (i0 + 1) % scale
    a = g[i0][:, i0] * (1 - f)[None, :] + g[i0][:, i1] * f[None, :]
    b = g[i1][:, i0] * (1 - f)[None, :] + g[i1][:, i1] * f[None, :]
    return a * (1 - f)[:, None] + b * f[:, None]


def paint(pieces, base, spread, joint_w, radius, seed, out, warm=0.0):
    """pieces: list of (x0, y0, x1, y1) in tile space (may cross the edge)."""
    rng = np.random.default_rng(seed)
    col = Image.new("RGB", (N, N), JOINT)
    hl = Image.new("L", (N, N), 0)
    sh = Image.new("L", (N, N), 0)
    dc, dh, ds = ImageDraw.Draw(col), ImageDraw.Draw(hl), ImageDraw.Draw(sh)
    for (x0, y0, x1, y1) in pieces:
        v = rng.normal(0, 1, 3) * spread * 0.3 + rng.normal(0, 1) * spread * 1.5
        c = tuple(int(np.clip(base[k] + v[k], 0, 255)) for k in range(3))
        g = joint_w / 2
        w, h = x1 - x0, y1 - y0
        for ox in (-N, 0, N):
            for oy in (-N, 0, N):
                box = [x0 + ox + g, y0 + oy + g, x1 + ox - g, y1 + oy - g]
                if box[2] < 0 or box[0] > N or box[3] < 0 or box[1] > N: continue
                dc.rounded_rectangle(box, radius, fill=c)
                dh.rounded_rectangle([box[0] + w * 0.08, box[1] + h * 0.1, box[0] + w * 0.6, box[1] + h * 0.45], radius * 0.8, fill=255)
                ds.rounded_rectangle([box[0] + w * 0.3, box[1] + h * 0.6, box[2] - 1, box[3] - 1], radius * 0.8, fill=255)
    a = np.asarray(col).astype(np.float32)
    joint = (np.abs(a - np.array(JOINT)).sum(axis=2) < 4)
    hlb = np.asarray(hl.filter(ImageFilter.GaussianBlur(10))).astype(np.float32) / 255
    shb = np.asarray(sh.filter(ImageFilter.GaussianBlur(12))).astype(np.float32) / 255
    a = a * (1 + 0.18 * hlb[..., None]) * (1 - 0.2 * shb[..., None])
    brush = noise(seed + 1, 24) * 0.6 + noise(seed + 2, 64) * 0.4
    a *= (0.9 + 0.2 * brush)[..., None]
    a[..., 0] += warm * 12; a[..., 2] -= warm * 8
    a[joint] = JOINT
    img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    img = img.filter(ImageFilter.GaussianBlur(0.8))
    img.save(out)


def staggered(rows, cols, jitter, seed, shift=0.5):
    rng = np.random.default_rng(seed)
    ph = N / rows; pieces = []
    for r in range(rows):
        off = (r % 2) * shift * N / cols
        # widths that sum to N, a little uneven
        w = rng.uniform(1 - jitter, 1 + jitter, cols); w = w / w.sum() * N
        x = off
        for c in range(cols):
            pieces.append((x, r * ph, x + w[c], (r + 1) * ph)); x += w[c]
    return pieces


def main(out):
    os.makedirs(out, exist_ok=True)
    paint(staggered(14, 10, 0.25, 11), (176, 160, 146), 9, 9, 22, 1, os.path.join(out, "cobble.png"), warm=0.4)
    paint(staggered(9, 5, 0.18, 12), (214, 178, 120), 8, 7, 6, 2, os.path.join(out, "sandstone.png"), warm=0.6)
    paint(staggered(16, 12, 0.1, 13), (86, 92, 112), 6, 6, 4, 3, os.path.join(out, "slate.png"))
    paint(staggered(10, 6, 0.3, 14), (196, 150, 108), 10, 8, 10, 4, os.path.join(out, "adobe.png"), warm=0.8)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "textures")
