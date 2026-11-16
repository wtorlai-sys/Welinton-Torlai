#!/usr/bin/env python3
"""Trilha eletrônica/tech gerada por código (kick, clap, hi-hat, baixo, pad, arpejo).

Uso:
  python3 ferramentas/scripts/musica.py <slug> --duracao 104.36 --bpm 124 \
      [--quebras 55.95:60.36] [--filtro 48.71:50.34] [--fim 103.7] [--semente 7]

- quebras a:b  música cai com tape stop em a, silêncio, volta em b (tempo forte em b)
- filtro a:b   em a o som fecha (passa-baixa, sem bateria); em b volta cheio (tempo forte em b)
- fim t        a última seção ajusta o andamento (±3%) para um tempo forte cair em t,
               onde entra o fecho (acorde final + prato) que soa até o fim
Saída: public/<slug>/musica.wav (estéreo 48 kHz). Determinístico.
"""
import argparse
import sys
import wave
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sintese as S  # noqa: E402

SR = S.SR
ROOT = Path(__file__).resolve().parents[2]

# Lá menor: Am F C G (um acorde por compasso), em semitons a partir de A2 (110 Hz)
PROG = [[0, 3, 7], [-4, 0, 3], [3, 7, 10], [-2, 2, 5]]


def hz(semi, base=110.0):
    return base * 2 ** (semi / 12)


def saw(f, d, detune=0.0, seed=0):
    t = S.t_axis(d)
    ph = (f * (1 + detune) * t + (seed % 97) / 97) % 1.0
    return 2 * ph - 1


def one_pole_lp(x, fc):
    """Passa-baixa de 1 polo com corte variável (fc: escalar ou array)."""
    fc = np.broadcast_to(np.asarray(fc, dtype=float), x.shape)
    a = 1 - np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


class Pista:
    def __init__(self, dur):
        self.n = int(dur * SR) + SR
        self.L = np.zeros(self.n)
        self.R = np.zeros(self.n)

    def add(self, x, at, g=1.0, pan=0.0):
        i = int(round(at * SR))
        if i >= self.n:
            return
        m = min(len(x), self.n - i)
        self.L[i:i + m] += x[:m] * g * min(1, 1 - pan)
        self.R[i:i + m] += x[:m] * g * min(1, 1 + pan)


# ------------------------------------------------------------------ instrumentos
def kick():
    d = 0.32
    x = S.sweep(160, 44, d) * S.env(d, 0.001, d, 5)
    r = np.random.default_rng(1)
    x[: int(0.004 * SR)] += S.bandpass(r.standard_normal(int(0.004 * SR)), 2000, 8000) * 0.3
    return np.tanh(x * 1.8)


def clap(seed):
    r = S.rng_de(seed)
    d = 0.22
    n = S.bandpass(r.standard_normal(int(d * SR)), 900, 6000)
    e = np.zeros(len(n))
    for k, at in enumerate((0.0, 0.011, 0.022)):
        i = int(at * SR)
        e[i:] = np.maximum(e[i:], S.env(d - at, 0.0005, d, 9)[: len(e) - i])
    return S.norm(n * e)


def hat(seed, aberto=False):
    r = S.rng_de(seed)
    d = 0.16 if aberto else 0.045
    return S.norm(S.bandpass(r.standard_normal(int(d * SR)), 7000, 16000) * S.env(d, 0.0005, d, 4 if aberto else 8))


_BAIXO = {}


def baixo(semi, d):
    key = (semi, round(d, 4))
    if key in _BAIXO:
        return _BAIXO[key]
    f = hz(semi - 12)
    x = saw(f, d) + 0.5 * saw(f, d, 0.006)
    x = one_pole_lp(x, 380.0)
    _BAIXO[key] = x * S.env(d, 0.004, d, 1.6)
    return _BAIXO[key]


def pad(acorde, d, seed):
    out = np.zeros(int(d * SR))
    for k, s in enumerate(acorde):
        f = hz(s + 12)
        for v, dt in enumerate((-0.004, 0.0, 0.005)):
            out += saw(f, d, dt, seed + k * 7 + v)
    out = S.bandpass(out, 120, 1600)
    t = S.t_axis(d)
    return out * np.minimum(1, t / 0.25) * np.minimum(1, (d - t) / 0.2)


def pluck(semi, d=0.22):
    f = hz(semi + 24)
    t = S.t_axis(d)
    x = np.sign(np.sin(2 * np.pi * f * t)) * 0.4 + saw(f, d, 0.003)
    x = one_pole_lp(x, 2600.0)
    return x * S.env(d, 0.002, d, 6)


def prato(seed, d=2.5):
    r = S.rng_de(seed)
    return S.norm(S.bandpass(r.standard_normal(int(d * SR)), 4000, 15000) * S.env(d, 0.002, d, 3))


# ------------------------------------------------------------------ seções
def secao(dur, bpm, semente, entrada_suave=0, bateria=True, fecho_em=None):
    """Renderiza uma seção começando num tempo forte. entrada_suave = nº de compassos sem kick."""
    p = Pista(dur + 3)
    beat = 60 / bpm
    bar = 4 * beat
    K = kick()
    nbar = int(np.ceil(dur / bar)) + 1
    plucks = {}
    for b in range(nbar):
        t0 = b * bar
        if t0 >= dur:
            break
        if fecho_em is not None and t0 >= fecho_em - 1e-3:
            break
        ac = PROG[b % 4]
        p.add(pad(ac, bar, semente + b), t0, 0.06, 0.0)
        for q in range(4):
            tb = t0 + q * beat
            if tb >= dur:
                break
            cheio = bateria and b >= entrada_suave
            if cheio:
                p.add(K, tb, 0.9)
                if q in (1, 3):
                    p.add(clap(semente * 31 + b * 4 + q), tb, 0.35, 0.05)
            # baixo nos contratempos de colcheia
            p.add(baixo(ac[0], beat / 2 * 0.95), tb + beat / 2, 0.5 if cheio else 0.3)
            # hi-hats
            for s in range(4):
                th = tb + s * beat / 4
                if bateria and (s == 2 or (cheio and s % 2 == 1)):
                    p.add(hat(semente * 7 + b * 16 + q * 4 + s, aberto=(s == 2 and q == 3)), th,
                          0.22 if s == 2 else 0.08, 0.25 if s % 2 else -0.15)
            # arpejo em semicolcheias
            for s in range(4):
                idx = (q * 4 + s) % 6
                notas = ac + [ac[0] + 12, ac[1] + 12, ac[2] + 12]
                semi = notas[[0, 1, 2, 3, 2, 1][idx]]
                if semi not in plucks:
                    plucks[semi] = pluck(semi)
                ta = tb + s * beat / 4
                g = 0.09 if b >= entrada_suave else 0.06
                p.add(plucks[semi], ta, g, -0.3 if s % 2 else 0.3)
                p.add(plucks[semi], ta + beat * 0.75, g * 0.35, 0.3 if s % 2 else -0.3)  # eco
    if fecho_em is not None:
        ac = PROG[0]
        p.add(K, fecho_em, 1.0)
        p.add(prato(semente + 999), fecho_em, 0.3)
        d = dur - fecho_em + 1.0
        p.add(pad(ac, d, semente + 500) * np.exp(-1.2 * S.t_axis(d)), fecho_em, 0.1)
        p.add(baixo(ac[0], min(d, 1.5)), fecho_em, 0.6)
        p.add(pluck(ac[0], 1.2), fecho_em, 0.12)
        p.add(pluck(ac[2] + 12, 1.2), fecho_em + 0.02, 0.08)
    m = int(dur * SR)
    return np.stack([p.L[:m], p.R[:m]])


def gerar(a):
    dur = a.duracao
    out = np.zeros((2, int((dur + 0.5) * SR)))

    def put(x, at):
        i = int(round(at * SR))
        m = min(x.shape[1], out.shape[1] - i)
        out[:, i:i + m] += x[:, :m]

    cortes = []  # (inicio, fim_corte_ou_None, tipo)
    marcas = [0.0]
    filtro = tuple(map(float, a.filtro.split(':'))) if a.filtro else None
    quebra = tuple(map(float, a.quebras.split(':'))) if a.quebras else None
    if filtro:
        marcas.append(filtro[1])
    if quebra:
        marcas.append(quebra[1])
    marcas = sorted(set(marcas))
    for k, ini in enumerate(marcas):
        fim_sec = marcas[k + 1] if k + 1 < len(marcas) else dur
        ultima = k + 1 == len(marcas)
        # seção que termina na quebra: para no tape stop
        if quebra and ini < quebra[0] < fim_sec:
            fim_sec = quebra[0]
            ts = 0.6
        else:
            ts = 0.0
        bpm = a.bpm
        fecho = None
        if ultima and a.fim:
            bar = 240 / a.bpm
            nb = round((a.fim - ini) / bar)
            bpm = 240 / ((a.fim - ini) / nb)
            fecho = a.fim - ini
        entrada = 2 if (quebra and abs(ini - quebra[1]) < 1e-6) else 0
        x = secao(fim_sec - ini + ts, bpm, a.semente + k * 13, entrada_suave=entrada, fecho_em=fecho)
        if ts:
            x = np.stack([S.tape_stop(x[c], ts) for c in range(2)])
        if filtro and ini < filtro[0] < fim_sec:
            # do filtro[0] até o fim da seção: fecha o passa-baixa e tira a bateria (re-render sem bateria)
            i0 = int((filtro[0] - ini) * SR)
            sem = secao(fim_sec - ini, bpm, a.semente + k * 13, bateria=False)
            seg = sem[:, i0:]
            nseg = seg.shape[1]
            fc = 4000 * (250 / 4000) ** (np.linspace(0, 1, nseg) ** 0.6)
            seg = np.stack([one_pole_lp(seg[c], fc) for c in range(2)]) * 1.4
            xf = 0.03
            nf = int(xf * SR)
            w = np.ones(nseg)
            w[:nf] = np.linspace(0, 1, nf)
            x[:, i0:i0 + nseg] = x[:, i0:i0 + nseg] * (1 - w) + seg * w
        put(x, ini)
    # fecha a quebra: silêncio até a volta (o tape stop já desceu a zero)
    if quebra:
        i0, i1 = int((quebra[0] + 0.6) * SR), int(quebra[1] * SR)
        out[:, i0:i1] = 0
    # fade final suave
    nf = int(0.4 * SR)
    iend = int(dur * SR)
    out[:, iend - nf:iend] *= np.linspace(1, 0, nf)
    out[:, iend:] = 0
    return out[:, :iend]


def gravar(path, x):
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.89
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x.T * 32767).astype(np.int16).tobytes())


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('slug')
    ap.add_argument('--duracao', type=float, required=True)
    ap.add_argument('--bpm', type=float, default=124)
    ap.add_argument('--quebras', default='')
    ap.add_argument('--filtro', default='')
    ap.add_argument('--fim', type=float, default=None)
    ap.add_argument('--semente', type=int, default=7)
    a = ap.parse_args()
    dest = ROOT / 'public' / a.slug / 'musica.wav'
    gravar(dest, gerar(a))
    print('ok', dest)
