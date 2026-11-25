"""Sintetiza SFX + trilha do episódio "Parabéns! Você construiu uma piscina" (Construção Viral).

Tudo gerado por código (sem samples de terceiros), determinístico (seed fixa).
Cues = tempos reais da narração (viral-video-engine/projects/piscina/05-producao.md, cue sheet).
Saídas (44,1 kHz estéreo): out/construcaoviral/piscina_sfx.wav e out/construcaoviral/piscina_musica.wav
Uso: python3 scripts/construcaoviral_piscina_audio.py   (requer numpy)
"""
import wave
from pathlib import Path

import numpy as np

SR = 44100
DUR = 163.2
N = int(DUR * SR)
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


# ------------------------------------------------------------- mixagem dos cues
sfx = np.zeros((2, N))


def put(at, x, g=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N:
        return
    x = x[: N - i] * g
    sfx[0, i : i + len(x)] += x * (1 - max(0, pan))
    sfx[1, i : i + len(x)] += x * (1 + min(0, pan))


def amb(a, b, x_fn, g):
    d = b - a
    x = x_fn(d)
    t = t_axis(d)[: len(x)]
    fade = np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.8)
    put(a, x * fade, g)


for i in range(9):
    put(0.3 + i * 0.17, scoop(), 0.5)
amb(1.9, 2.5, lambda d: bandpass(noise(d), 1500, 7000), 0.12)
put(2.95, plop(), 0.5)
put(3.6, rumble(1.6, 45), 0.9)
put(4.4, splash(0.8), 0.4)
for r in [5.2, 26.8, 56.26, 70.0, 125.4, 140.9]:
    put(r, rewind(0.9 if r not in (56.26, 70.0, 125.4) else 0.8), 0.45)
put(10.3, rumble(1.0, 55), 0.5)
put(11.55, whoosh(0.6), 0.4)
put(17.0, thud(0.6, 45), 0.8)
put(18.8, whoosh(0.5), 0.4)
put(19.5, bandpass(noise(0.6), 300, 2500) * env(0.6, 0.05, 0.2), 0.3)
put(24.6, rip(0.35), 0.6)
put(24.8, splash(0.9), 0.35)
put(25.3, bandpass(noise(1.0), 600, 3000) * env(1.0, 0.01, 0.6), 0.2)
for i in range(8):
    put(27.6 + i * 0.28, clank(), 0.25, pan=(i % 2) * 0.4 - 0.2)
amb(29.9, 32.0, lambda d: lowpass(noise(d), 500), 0.35)
put(29.9, whoosh(0.6), 0.35)
for tdg in [40.7, 52.6, 59.8, 75.5, 83.8, 93.1, 108.6, 121.0, 131.4, 150.3]:
    put(tdg, ding(), 0.55)
for i in range(6):
    put(43.5 + i * 0.4, drip(), 0.35)
put(49.3, boing(), 0.45)
put(55.88, rip(0.4), 0.6)
for i in range(16):
    put(57.1 + i * 0.12, click(), 0.6, pan=((i * 7) % 5) / 5 - 0.4)
amb(66.0, 69.6, lambda d: bandpass(noise(d), 300, 1200), 0.15)
amb(70.9, 75.9, motor, 0.35)
put(76.5, plop(), 0.25)
amb(79.6, 82.4, suction, 0.3)
put(85.9, splash(0.8), 0.45)
amb(86.0, 100.6, lambda d: lowpass(noise(d), 350), 0.12)  # ambiente subaquático
amb(90.2, 92.4, suction, 0.25)
put(96.2, click(), 0.6)
put(96.5, click(), 0.6)
put(98.6, suction(1.4), 0.45)
put(104.0, bandpass(noise(1.2), 2000, 8000) * env(1.2, 0.05, 0.4), 0.25)
put(110.0, boing(), 0.35)
put(117.6, zap_up(0.3), 0.2)
amb(118.0, 121.6, motor, 0.25)
amb(121.8, 125.3, sizzle, 0.4)
put(123.0, boing(), 0.3)
put(124.5, whoosh(0.4), 0.4)
put(124.85, thud(0.35, 60), 0.7)
for i in range(10):
    put(126.4 + i * 0.17, thud(0.12, 140), 0.3)
put(133.0, suction(1.2), 0.2)
put(134.8, rumble(2.5, 38), 0.6)
amb(135.0, 148.5, lambda d: bandpass(noise(d), 2500, 10000), 0.2)  # chuva
put(136.2, rise(2.6, 35, 80), 0.6)
put(139.0, rumble(1.9, 40), 1.0)
put(139.2, rip(0.6), 0.4)
put(144.25, click(), 0.8)
amb(144.4, 146.7, lambda d: bandpass(noise(d), 300, 2500), 0.25)
put(147.6, thud(0.4, 50), 0.6)
put(151.74, clank(), 0.5)
put(152.62, zap_up(0.45), 0.5)
put(154.4, splash(0.6), 0.4)
put(155.7, splash(1.0), 0.6)
put(156.58, fanfarra(), 0.55)
for i in range(12):
    put(156.6 + i * 0.09, click(), 0.4, pan=((i * 3) % 7) / 7 - 0.5)

# ------------------------------------------------------------- trilha (pluck pentatônico, ~115 BPM)
BPM = 115
beat = 60 / BPM
mus = np.zeros((2, N))


def pluck(f, d=0.5):
    t = t_axis(d)
    x = sum(np.sin(2 * np.pi * f * h * t) / h ** 1.6 for h in (1, 2, 3, 4))
    return x * env(d, 0.003, 0.16)


escala = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25]
prog = [130.81, 110.0, 174.61, 196.0]  # C, Am, F, G (graves)
mel = mulberry = np.random.default_rng(5)
padrao = [0, 2, 4, 2, 5, 4, 2, 3, 0, 2, 4, 5, 7, 5, 4, 2]
nb = int(DUR / beat * 2)
for i in range(nb):
    at = i * beat / 2
    if i % 2 == 0 or mel.random() < 0.55:
        f = escala[padrao[i % 16]]
        x = pluck(f, 0.45) * 0.22
        j = int(at * SR)
        if j + len(x) < N:
            mus[0, j : j + len(x)] += x * 0.9
            mus[1, j : j + len(x)] += x * 1.0
    if i % 8 == 0:
        fb = prog[(i // 8) % 4]
        d = beat * 3.5
        t = t_axis(d)
        b = (np.sin(2 * np.pi * fb * t) + 0.3 * np.sin(2 * np.pi * fb * 2 * t)) * env(d, 0.01, d * 0.5) * 0.25
        j = int(at * SR)
        if j + len(b) < N:
            mus[:, j : j + len(b)] += b
    if i % 2 == 1:
        h = bandpass(rng.standard_normal(int(0.05 * SR)), 6000, 14000) * env(0.05, 0.001, 0.015) * 0.05
        j = int(at * SR)
        if j + len(h) < N:
            mus[:, j : j + len(h)] += h
# respiro no estrondo da piscina saindo do chão
t = np.arange(N) / SR
mus *= 1 - 0.85 * (np.clip((t - 138.9) / 0.15, 0, 1) * np.clip((140.6 - t) / 0.3, 0, 1))
mus[:, : int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))
mus[:, -int(2 * SR) :] *= np.linspace(1, 0, int(2 * SR))


def save(path, x):
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.89
    pcm = (np.clip(x.T, -1, 1) * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print("ok", path)


save(OUT / "piscina_sfx.wav", sfx)
save(OUT / "piscina_musica.wav", mus)
