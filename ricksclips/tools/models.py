#!/usr/bin/env python3
"""models.py - low-poly hero props as GLB files, built in code (no image-to-3D).

  python3 models.py <out_dir>    writes oxford_tower.glb and aztec_pyramid.glb

Flat-shaded meshes (every triangle has its own normals), one flat colour per
part, +y up, feet on y = 0, front facing +z. The stage scales each model to the
"height" given in short.json. Pure Python + numpy: a minimal glTF 2.0 writer.
"""
import json, math, os, struct, sys
import numpy as np


# ------------------------------------------------------------------ geometry
def tri_mesh(tris):
    """tris: list of 3 xyz points; returns positions and flat normals (float32)."""
    p = np.array(tris, np.float32).reshape(-1, 3, 3)
    n = np.cross(p[:, 1] - p[:, 0], p[:, 2] - p[:, 0])
    n /= np.linalg.norm(n, axis=1, keepdims=True) + 1e-9
    return p.reshape(-1, 3), np.repeat(n, 3, axis=0).astype(np.float32)


def quad(a, b, c, d): return [(a, b, c), (a, c, d)]


def box(cx, y0, cz, w, h, d):
    x0, x1, y1, z0, z1 = cx - w / 2, cx + w / 2, y0 + h, cz - d / 2, cz + d / 2
    v = lambda x, y, z: (x, y, z)
    t = []
    t += quad(v(x0, y0, z1), v(x1, y0, z1), v(x1, y1, z1), v(x0, y1, z1))   # front +z
    t += quad(v(x1, y0, z0), v(x0, y0, z0), v(x0, y1, z0), v(x1, y1, z0))   # back
    t += quad(v(x1, y0, z1), v(x1, y0, z0), v(x1, y1, z0), v(x1, y1, z1))   # right
    t += quad(v(x0, y0, z0), v(x0, y0, z1), v(x0, y1, z1), v(x0, y1, z0))   # left
    t += quad(v(x0, y1, z1), v(x1, y1, z1), v(x1, y1, z0), v(x0, y1, z0))   # top
    t += quad(v(x0, y0, z0), v(x1, y0, z0), v(x1, y0, z1), v(x0, y0, z1))   # bottom
    return t


def prism(cx, y0, cz, r, h, n=8, r_top=None, rot=0.0):
    """n-sided column (r_top=0 makes a cone / pyramid)."""
    rt = r if r_top is None else r_top
    a = [rot + 2 * math.pi * i / n for i in range(n)]
    lo = [(cx + r * math.sin(t), y0, cz + r * math.cos(t)) for t in a]
    hi = [(cx + rt * math.sin(t), y0 + h, cz + rt * math.cos(t)) for t in a]
    tris = []
    for i in range(n):
        j = (i + 1) % n
        if rt > 1e-6: tris += quad(lo[i], lo[j], hi[j], hi[i])
        else: tris.append((lo[i], lo[j], hi[i]))
        tris.append(((cx, y0, cz), lo[j], lo[i]))
        if rt > 1e-6: tris.append(((cx, y0 + h, cz), hi[i], hi[j]))
    return tris


def ramp(cx, y0, cz_front, w, h, depth):
    """Stair ramp rising from the front (z = cz_front) back by `depth`."""
    x0, x1, zf, zb, y1 = cx - w / 2, cx + w / 2, cz_front, cz_front - depth, y0 + h
    t = []
    t += quad((x0, y0, zf), (x1, y0, zf), (x1, y1, zb), (x0, y1, zb))        # slope
    t.append(((x1, y0, zf), (x1, y0, zb), (x1, y1, zb)))                     # sides
    t.append(((x0, y0, zb), (x0, y0, zf), (x0, y1, zb)))
    return t


def disc_xy(cx, cy, z, r, n=20):
    """Flat disc facing +z."""
    a = [2 * math.pi * i / n for i in range(n)]
    return [((cx, cy, z), (cx + r * math.cos(a[i]), cy + r * math.sin(a[i]), z), (cx + r * math.cos(a[(i + 1) % n]), cy + r * math.sin(a[(i + 1) % n]), z)) for i in range(n)]


# ------------------------------------------------------------------ glTF writer
def write_glb(path, parts):
    """parts: list of (tris, rgb 0-255)."""
    bins, views, accs, meshes, mats, nodes, matidx = bytearray(), [], [], [], [], [], {}
    for tris, rgb in parts:
        if rgb not in matidx:
            matidx[rgb] = len(mats)
            c = [(v / 255) ** 2.2 for v in rgb]
            mats.append({"pbrMetallicRoughness": {"baseColorFactor": c + [1.0], "metallicFactor": 0.0, "roughnessFactor": 0.95}, "doubleSided": True})
        pos, nor = tri_mesh(tris)
        ids = []
        for arr, typ in ((pos, "VEC3"), (nor, "VEC3")):
            while len(bins) % 4: bins.append(0)
            off = len(bins); bins += arr.tobytes()
            views.append({"buffer": 0, "byteOffset": off, "byteLength": arr.nbytes, "target": 34962})
            acc = {"bufferView": len(views) - 1, "componentType": 5126, "count": len(arr), "type": typ}
            if arr is pos: acc["min"] = pos.min(0).tolist(); acc["max"] = pos.max(0).tolist()
            accs.append(acc); ids.append(len(accs) - 1)
        meshes.append({"primitives": [{"attributes": {"POSITION": ids[0], "NORMAL": ids[1]}, "material": matidx[rgb]}]})
        nodes.append({"mesh": len(meshes) - 1})
    while len(bins) % 4: bins.append(0)
    gl = {"asset": {"version": "2.0", "generator": "ricksclips models.py"}, "scene": 0,
          "scenes": [{"nodes": list(range(len(nodes)))}], "nodes": nodes, "meshes": meshes,
          "materials": mats, "accessors": accs, "bufferViews": views, "buffers": [{"byteLength": len(bins)}]}
    js = json.dumps(gl, separators=(",", ":")).encode()
    js += b" " * ((4 - len(js) % 4) % 4)
    with open(path, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(bins)))
        f.write(struct.pack("<II", len(js), 0x4E4F534A)); f.write(js)
        f.write(struct.pack("<II", len(bins), 0x004E4942)); f.write(bytes(bins))


# ------------------------------------------------------------------ models
STONE, STONE_D, DARK, ROOF, GOLD = (222, 188, 128), (196, 160, 104), (58, 44, 60), (92, 98, 120), (226, 176, 70)


def oxford_tower():
    p = []
    W, H = 4.0, 9.0
    p.append((box(0, 0, 0, W, H, W), STONE))
    p.append((box(0, 0, 0, W + 0.5, 0.5, W + 0.5), STONE_D))                   # plinth
    p.append((box(0, H - 0.3, 0, W + 0.4, 0.35, W + 0.4), STONE_D))            # cornice
    for i in range(5):                                                          # battlements, all four sides
        x = -W / 2 + 0.2 + i * (W - 0.4) / 4
        for (bx, bz) in ((x, W / 2), (x, -W / 2), (W / 2, x), (-W / 2, x)):
            p.append((box(bx, H, bz, 0.42, 0.55, 0.42), STONE))
    for sx in (-1, 1):                                                          # octagonal corner turrets
        for sz in (-1, 1):
            cx, cz = sx * W / 2, sz * W / 2
            p.append((prism(cx, 0, cz, 0.55, H + 1.0, 8, rot=math.pi / 8), STONE_D))
            p.append((prism(cx, H + 1.0, cz, 0.62, 1.4, 8, 0.0, rot=math.pi / 8), ROOF))
            p.append((prism(cx, H + 2.4, cz, 0.06, 0.4, 6), GOLD))
    # gate arch on the front: dark doorway with a pointed top, and windows
    z = W / 2 + 0.01
    p.append((box(0, 0, z, 1.5, 2.4, 0.06), DARK))
    p.append(([((-0.75, 2.4, z + 0.03), (0.75, 2.4, z + 0.03), (0, 3.3, z + 0.03))], DARK))
    for wy in (4.6, 6.8):
        for wx in (-0.9, 0.9):
            p.append((box(wx, wy, z, 0.55, 1.1, 0.06), DARK))
            p.append(([((wx - 0.275, wy + 1.1, z + 0.03), (wx + 0.275, wy + 1.1, z + 0.03), (wx, wy + 1.45, z + 0.03))], DARK))
    p.append((box(0, 3.7, z, 0.9, 0.12, 0.06), STONE_D))
    p.append((disc_xy(0, 5.9, z + 0.04, 0.5), (246, 240, 226)))           # clock face above the gate
    p.append((box(0, 5.9, z + 0.06, 0.06, 0.4, 0.02), DARK))
    return p


ADOBE, ADOBE_D, STAIR, BLUE, RED, WHITE = (208, 160, 112), (178, 132, 92), (232, 214, 186), (70, 130, 190), (184, 62, 54), (238, 230, 214)


def aztec_pyramid():
    p = []
    tiers = [(14.0, 1.6), (11.6, 1.6), (9.2, 1.6), (6.8, 1.6)]
    y = 0.0
    for i, (w, h) in enumerate(tiers):
        p.append((box(0, y, -0.4 * i, w, h, w * 0.9), ADOBE if i % 2 == 0 else ADOBE_D))
        y += h
    top = y
    # double staircase up the front, with a dividing ridge
    front = 14.0 * 0.9 / 2
    # the stairs stand proud of the stepped faces: start well in front, end at the top terrace
    run = front + 2.6 - 0.6
    p.append((ramp(-1.3, 0, front + 2.6, 2.2, top, run) + box(-1.3, 0, front + 2.6 - run / 2, 2.2, 0.02, run), STAIR))
    p.append((ramp(1.3, 0, front + 2.6, 2.2, top, run), STAIR))
    p.append((ramp(0, 0, front + 2.75, 0.45, top + 0.25, run + 0.1), ADOBE_D))
    # twin shrines on top: blue (rain) and red (war)
    for sx, col in ((-1.6, BLUE), (1.6, RED)):
        p.append((box(sx, top, -1.6, 2.6, 2.2, 2.6), WHITE))
        p.append((box(sx, top, -0.3, 1.0, 1.5, 0.06), (60, 40, 50)))
        p.append((box(sx, top + 2.2, -1.6, 2.9, 0.5, 2.9), col))
        p.append((prism(sx, top + 2.7, -1.6, 1.6, 1.0, 4, 0.5, rot=math.pi / 4), col))
    return p


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "models"
    os.makedirs(out, exist_ok=True)
    write_glb(os.path.join(out, "oxford_tower.glb"), oxford_tower())
    write_glb(os.path.join(out, "aztec_pyramid.glb"), aztec_pyramid())
    print("wrote oxford_tower.glb, aztec_pyramid.glb")
