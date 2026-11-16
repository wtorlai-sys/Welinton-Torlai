#!/usr/bin/env python3
"""Monta a faixa de efeitos (sfx.wav) a partir de um arquivo de cues.

Uso: python3 ferramentas/scripts/sfx.py ferramentas/scripts/sfx_<slug>.json

Cues (JSON):
{"slug": "...", "duracao": 104.36,
 "cues": [{"id": "sfx01", "evento": "e01", "t": 0.0, "som": "impacto",
           "args": {"forca": 0.8}, "alinhar": "pico|inicio|fim",
           "ganho_db": -3, "pan": 0.0, "camada": "principal|grave|apoio"}]}

- alinhar=pico: o ponto mais alto do som cai em t (whoosh, impacto)
- alinhar=inicio: o som começa em t (pop, clique, ding, moeda)
- alinhar=fim: o som termina em t e corta seco (riser)
- som "contador": tiques de t até args.ate, acelerando (args.de, args.para = intervalos em s)
Cada cue recebe seed própria a partir do id, então nenhum som se repete igual.
"""
import json
import sys
import wave
import zlib
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sintese as S  # noqa: E402

SR = S.SR
ROOT = Path(__file__).resolve().parents[2]


def seed_de(cid):
    return zlib.crc32(cid.encode())


def pico(x):
    e = np.abs(x)
    w = max(1, int(0.005 * SR))
    e = np.convolve(e, np.ones(w) / w, mode='same')
    return int(np.argmax(e))


def contador(t, ate, seed, de=0.09, para=0.05, curva=1.0, tom=None):
    """Tiques de t até ate; intervalo vai de `de` a `para` (acelerando)."""
    out, pos = [], t
    k = 0
    while pos < ate - 0.005:
        u = ((pos - t) / max(ate - t, 1e-3)) ** curva
        f = (tom or 2600) * (1 + 0.25 * u)
        out.append((pos, S.tique(seed + k, f=f) * (0.75 + 0.25 * u)))
        pos += de + (para - de) * u
        k += 1
    return out


def montar(cfg):
    n = int((cfg['duracao'] + 1.0) * SR)
    mix = np.zeros((2, n))
    for c in cfg['cues']:
        if c.get('off'):
            continue
        args = dict(c.get('args', {}))
        sd = seed_de(c['id'])
        g = 10 ** (c.get('ganho_db', 0) / 20)
        pan = c.get('pan', 0.0)
        if c['som'] == 'contador':
            ate = args.pop('ate')
            pecas = contador(c['t'], ate, sd, **args)
        else:
            fn = S.SONS[c['som']]
            if 'seed' in fn.__code__.co_varnames:
                args['seed'] = sd
            x = fn(**args)
            al = c.get('alinhar', 'inicio')
            off = pico(x) if al == 'pico' else (len(x) if al == 'fim' else 0)
            pecas = [(c['t'] - off / SR, x)]
        for at, x in pecas:
            i = int(round(at * SR))
            if i < 0:
                x, i = x[-i:], 0
            m = max(0, min(len(x), n - i))
            l, r = x[:m] * min(1, 1 - pan), x[:m] * min(1, 1 + pan)
            mix[0, i:i + m] += l * g
            mix[1, i:i + m] += r * g
    return mix


def gravar(path, mix):
    peak = np.max(np.abs(mix))
    if peak > 0.95:
        mix = mix / peak * 0.95
    out = (np.clip(mix.T, -1, 1) * 32767).astype(np.int16)
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(out.tobytes())


if __name__ == '__main__':
    cfg = json.loads(Path(sys.argv[1]).read_text())
    mix = montar(cfg)
    dest = ROOT / 'public' / cfg['slug'] / 'sfx.wav'
    gravar(dest, mix)
    print('ok', dest, len([c for c in cfg['cues'] if not c.get('off')]), 'cues')
