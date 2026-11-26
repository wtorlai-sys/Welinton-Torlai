"""Construção Viral — biblioteca de síntese de SFX e trilha (sem samples de terceiros, determinística).

Tudo gerado por código (sem samples de terceiros), determinístico (seed fixa).
Uso: from construcaoviral_sfx_lib import *  →  Mix(dur) / put / amb / musica(dur) / save.
Cada episódio tem seu script de cues (ex.: scripts/construcaoviral_elevador_audio.py).
"""
import wave
from pathlib import Path

import numpy as np

SR = 44100
OUT = Path(__file__).resolve().parent.parent / "out" / "construcaoviral"
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(23)


def t_axis(d):
    return np.arange(int(d * SR)) / SR


def lowpass(x, fc):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / np.sqrt(1 + (f / fc) ** 4), len(x))


def bandpass(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    g = 1 / np.sqrt(1 + (f / hi) ** 4) * (1 / np.sqrt(1 + (lo / np.maximum(f, 1)) ** 4))
    return np.fft.irfft(X * g, len(x))


def noise(d):
    return rng.standard_normal(int(d * SR))


def env(d, a=0.005, r=0.2):
    t = t_axis(d)
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / max(r, 1e-4))


def norm(x, peak=1.0):
    m = np.max(np.abs(x)) + 1e-9
    return x / m * peak


# ------------------------------------------------------------- sons básicos
def thud(d=0.25, f=70):
    t = t_axis(d)
    return norm(np.sin(2 * np.pi * f * t * (1 - t * 0.8)) * env(d, 0.002, 0.08) + lowpass(noise(d), 400) * env(d, 0.002, 0.05) * 0.6)


def scoop():
    return norm(lowpass(noise(0.18), 900) * env(0.18, 0.005, 0.05)) * 0.7 + thud(0.18, 90) * 0.4


def splash(d=0.7):
    t = t_axis(d)
    return norm(bandpass(noise(d), 500, 6000) * env(d, 0.005, 0.18) + np.sin(2 * np.pi * (500 - 300 * t) * t) * env(d, 0.002, 0.06) * 0.5)


def plop():
    t = t_axis(0.18)
    return norm(np.sin(2 * np.pi * (900 - 2500 * t) * t) * env(0.18, 0.002, 0.05))


def rumble(d=1.6, f=50):
    t = t_axis(d)
    n = lowpass(noise(d), 300) * (np.minimum(1, t / 0.08) * np.exp(-t / (d * 0.45)))
    return norm(n + np.sin(2 * np.pi * f * t) * np.exp(-t / (d * 0.4)) * 0.5)


def rewind(d=0.9):
    t = t_axis(d)
    f = 2400 - 1800 * (t / d)
    saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
    flutter = 0.6 + 0.4 * np.sin(2 * np.pi * 28 * t)
    return norm(lowpass(saw, 3500) * flutter * np.minimum(1, t / 0.03) * np.minimum(1, (d - t) / 0.08) * 0.6 + bandpass(noise(d), 2000, 8000) * 0.15)


def whoosh(d=0.6):
    t = t_axis(d)
    x = bandpass(noise(d), 300, 3000) * np.sin(np.pi * t / d) ** 2
    return norm(x)


def clank():
    d = 0.6
    t = t_axis(d)
    x = sum(np.sin(2 * np.pi * f * t) * np.exp(-t / dd) for f, dd in [(523, 0.25), (1187, 0.12), (1871, 0.08), (2903, 0.05)])
    return norm(x * env(d, 0.001, 0.3))


def ding():
    d = 0.9
    t = t_axis(d)
    x = np.sin(2 * np.pi * 1318.5 * t) + 0.5 * np.sin(2 * np.pi * 1975.5 * t) + 0.25 * np.sin(2 * np.pi * 2637 * t)
    return norm(x * env(d, 0.002, 0.28)) * 0.6


def drip():
    t = t_axis(0.12)
    return norm(np.sin(2 * np.pi * (1600 - 6000 * t) * t) * env(0.12, 0.001, 0.03))


def boing():
    d = 0.5
    t = t_axis(d)
    f = 220 + 120 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 5)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, 0.003, 0.2))


def rip(d=0.4):
    t = t_axis(d)
    am = (np.sin(2 * np.pi * 60 * t) > 0).astype(float) * 0.6 + 0.4
    return norm(bandpass(noise(d), 800, 7000) * am * env(d, 0.003, 0.15))


def click():
    return norm(bandpass(noise(0.03), 2000, 9000) * env(0.03, 0.0005, 0.008)) * 0.5


def motor(d=3.0):
    t = t_axis(d)
    saw = 2 * ((110 * t) % 1) - 1
    return norm(lowpass(saw, 700) * np.minimum(1, t / 0.3) * np.minimum(1, (d - t) / 0.3)) * 0.5


def sizzle(d=1.2):
    t = t_axis(d)
    return norm(bandpass(noise(d), 4000, 12000) * np.minimum(1, t / 0.1) * np.minimum(1, (d - t) / 0.3)) * 0.5


def rise(d=2.5, f0=40, f1=90):
    t = t_axis(d)
    f = f0 + (f1 - f0) * t / d
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / 0.4) * np.minimum(1, (d - t) / 0.2) + lowpass(noise(d), 200) * 0.3)


def zap_up(d=0.4):
    t = t_axis(d)
    return norm(np.sin(2 * np.pi * np.cumsum(300 + 1500 * t / d) / SR) * env(d, 0.01, 0.25)) * 0.6


def fanfarra():
    d = 1.6
    out = np.zeros(int(d * SR))
    for i, f in enumerate([523.25, 659.25, 783.99, 1046.5]):
        st = int(i * 0.11 * SR)
        dd = d - i * 0.11
        t = t_axis(dd)
        sq = np.sign(np.sin(2 * np.pi * f * t)) * 0.3 + np.sin(2 * np.pi * f * t)
        out[st : st + len(t)] += lowpass(sq, 4000) * env(dd, 0.005, 0.5)
    return norm(out)


def suction(d=1.2):
    t = t_axis(d)
    a = lowpass(noise(d), 300)
    b = lowpass(noise(d), 1200)
    mixk = t / d
    return norm((a * (1 - mixk) + b * mixk) * np.minimum(1, t / 0.2) * np.minimum(1, (d - t) / 0.15))




class Mix:
    def __init__(self, dur):
        self.dur = dur
        self.N = int(dur * SR)
        self.x = np.zeros((2, self.N))

    def put(self, at, x, g=1.0, pan=0.0):
        i = int(at * SR)
        if i >= self.N:
            return
        x = x[: self.N - i] * g
        self.x[0, i : i + len(x)] += x * (1 - max(0, pan))
        self.x[1, i : i + len(x)] += x * (1 + min(0, pan))

    def amb(self, a, b, x_fn, g):
        d = b - a
        x = x_fn(d)
        t = t_axis(d)[: len(x)]
        fade = np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.8)
        self.put(a, x * fade, g)


def suction(d=1.2):
    t = t_axis(d)
    a = lowpass(noise(d), 300)
    b = lowpass(noise(d), 1200)
    mk = t / d
    return norm((a * (1 - mk) + b * mk) * np.minimum(1, t / 0.2) * np.minimum(1, (d - t) / 0.15))


def creak(d=0.8):
    t = t_axis(d)
    f = 180 + 60 * np.sin(2 * np.pi * 3 * t)
    saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
    return norm(bandpass(saw, 300, 3000) * env(d, 0.05, 0.3) * (0.6 + 0.4 * np.sin(2 * np.pi * 23 * t)))


def snap():
    return norm(bandpass(noise(0.12), 1500, 9000) * env(0.12, 0.0005, 0.03) + thud(0.12, 220) * 0.4)


def screech(d=1.0):
    t = t_axis(d)
    x = sum(np.sin(2 * np.pi * f * t + 3 * np.sin(2 * np.pi * 7 * t)) for f in (2300, 3100, 4200))
    return norm(x * env(d, 0.01, d * 0.5) + bandpass(noise(d), 3000, 10000) * env(d, 0.01, 0.3) * 0.5)


def ding2():
    d = 1.0
    t = t_axis(d)
    x = np.sin(2 * np.pi * 880 * t) * env(d, 0.002, 0.35) + np.concatenate([np.zeros(int(0.22 * SR)), np.sin(2 * np.pi * 659.25 * t_axis(d - 0.22)) * env(d - 0.22, 0.002, 0.35)])
    return norm(x[: int(d * SR)]) * 0.7


def musica(dur, bpm=115, seed=5, escala=(261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25), prog=(130.81, 110.0, 174.61, 196.0), vol=0.22):
    """Trilha leve de pluck pentatônico + baixo + chimbal (contínua)."""
    rr = np.random.default_rng(seed)
    N = int(dur * SR)
    mus = np.zeros((2, N))
    beat = 60 / bpm
    padrao = [0, 2, 4, 2, 5, 4, 2, 3, 0, 2, 4, 5, 7, 5, 4, 2]

    def pluck(f, d=0.45):
        t = t_axis(d)
        return sum(np.sin(2 * np.pi * f * h * t) / h ** 1.6 for h in (1, 2, 3, 4)) * env(d, 0.003, 0.16)

    for i in range(int(dur / beat * 2)):
        at = i * beat / 2
        j = int(at * SR)
        if i % 2 == 0 or rr.random() < 0.55:
            x = pluck(escala[padrao[i % 16]]) * vol
            if j + len(x) < N:
                mus[0, j : j + len(x)] += x * 0.9
                mus[1, j : j + len(x)] += x
        if i % 8 == 0:
            fb = prog[(i // 8) % 4]
            d = beat * 3.5
            t = t_axis(d)
            b = (np.sin(2 * np.pi * fb * t) + 0.3 * np.sin(2 * np.pi * fb * 2 * t)) * env(d, 0.01, d * 0.5) * 0.25
            if j + len(b) < N:
                mus[:, j : j + len(b)] += b
        if i % 2 == 1:
            h = bandpass(rr.standard_normal(int(0.05 * SR)), 6000, 14000) * env(0.05, 0.001, 0.015) * 0.05
            if j + len(h) < N:
                mus[:, j : j + len(h)] += h
    mus[:, : int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))
    mus[:, -int(2 * SR) :] *= np.linspace(1, 0, int(2 * SR))
    return mus


def save(path, x):
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.89
    pcm = (np.clip(x.T, -1, 1) * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print("ok", path)
