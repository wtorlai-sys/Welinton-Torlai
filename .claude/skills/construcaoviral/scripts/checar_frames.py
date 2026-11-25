#!/usr/bin/env python3
"""QC automático do vídeo renderizado: acha frames corrompidos (cena capturada em mosaico/repetida),
falha intermitente do render por software (swangle) com --concurrency > 1.

Uso: python3 checar_frames.py <video.mp4>
Sai com código 1 se houver frames ruins e lista os índices. Correção: renderizar com --concurrency=1.
"""
import subprocess, sys
import numpy as np

if len(sys.argv) < 2:
    sys.exit(__doc__)
W, H = 54, 96
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", sys.argv[1], "-vf", f"scale={W}:{H},format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
f = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(float)


def periodico(fr):
    v = min(np.abs(fr[: H - p] - fr[p:]).mean() for p in range(10, 40))
    h = min(np.abs(fr[:, : W - p] - fr[:, p:]).mean() for p in range(8, 30))
    return min(v, h) < 2.0


ruins = [i for i, fr in enumerate(f) if periodico(fr)]
print(f"{len(f)} frames verificados; corrompidos: {len(ruins)}")
if ruins:
    print("frames:", ruins[:100], "..." if len(ruins) > 100 else "")
    sys.exit(1)
print("OK: nenhum frame em mosaico.")
