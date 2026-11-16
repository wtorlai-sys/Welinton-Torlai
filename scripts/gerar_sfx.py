"""Sintetiza a trilha de efeitos sonoros (SFX + ambiente) do episódio "Dormir no mesmo lugar".

Tudo é gerado por código (sem samples de terceiros) e é determinístico (seed fixa).
Os tempos dos cues seguem os planos de src/episodes/dormir/Video.tsx (em segundos).
Saída: public/audio/dormir-sfx.wav (estéreo 44,1 kHz). A narração é mixada por cima
no passo final (scripts/mixar.sh), com os efeitos ~10 dB abaixo da voz.

Uso: python3 scripts/gerar_sfx.py   (requer só numpy)
"""
import wave
from pathlib import Path

import numpy as np

SR = 44100
DUR = 82.36 + 0.5
N = int(DUR * SR)
ROOT = Path(__file__).resolve().parent.parent
rng = np.random.default_rng(11)
mix = np.zeros((2, N))


# ------------------------------------------------------------------ utilitários
def t_axis(d):
    return np.arange(int(d * SR)) / SR


def bandpass(x, lo, hi, soft=0.15):
    """Filtro passa-faixa por FFT com bordas suaves."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    g = np.ones_like(f)
    if lo > 0:
        g *= 1 / (1 + np.exp(np.clip(-(f - lo) / (lo * soft + 1), -60, 60)))
    if hi < SR / 2:
        g *= 1 / (1 + np.exp(np.clip((f - hi) / (hi * soft + 1), -60, 60)))
    return np.fft.irfft(X * g, len(x))


def noise(d):
    return rng.standard_normal(int(d * SR))


def env(d, a=0.005, r=None, shape=3.0):
    """Envelope ataque linear + decaimento exponencial."""
    t = t_axis(d)
    e = np.minimum(1, t / max(a, 1e-4))
    r = r if r is not None else d
    return e * np.exp(-shape * np.maximum(0, t - a) / r)


def bell(d, a=0.3):
    t = t_axis(d)
    return np.sin(np.pi * np.clip(t / d, 0, 1)) ** a


def sweep(f0, f1, d, wave='sine'):
    t = t_axis(d)
    f = f0 * (f1 / f0) ** (t / d)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) if wave == 'sine' else np.sign(np.sin(ph)) * 0.6


def tone(freqs, d, decay=2.0, a=0.003, harm=(1.0, 0.5, 0.25)):
    t = t_axis(d)
    out = np.zeros_like(t)
    for f in freqs:
        for k, h in enumerate(harm):
            out += h * np.sin(2 * np.pi * f * (k + 1) * t) * np.exp(-decay * (k + 1) * t)
    return out * env(d, a, d, 0.5)


def norm(x, peak=1.0):
    m = np.max(np.abs(x)) + 1e-9
    return x / m * peak


def place(x, at, gain=0.5, pan=0.0):
    """Coloca um som (mono ou estéreo) na trilha no instante `at` (s)."""
    i = int(at * SR)
    if x.ndim == 1:
        l, r = x * (1 - max(0, pan)), x * (1 + min(0, pan))
    else:
        l, r = x
    n = max(0, min(len(l), N - i))
    mix[0, i:i + n] += l[:n] * gain
    mix[1, i:i + n] += r[:n] * gain


# ------------------------------------------------------------------ instrumentos
def whoosh(d=0.6, lo=300, hi=3500):
    return norm(bandpass(noise(d), lo, hi) * bell(d, 1.6))


def dun(root=55.0, d=1.6):
    """Impacto grave de revelação (piano + boom)."""
    boom = np.sin(2 * np.pi * np.cumsum(np.linspace(root * 2, root, int(d * SR))) / SR) * env(d, 0.004, d, 4)
    chord = tone([root * 4, root * 4 * 1.189, root * 4 * 1.498], d, decay=1.6)
    return norm(boom * 1.2 + chord * 0.7)


def sinister(d=2.2):
    """Cluster dissonante (segunda menor) com tremolo — tensão."""
    t = t_axis(d)
    x = sum(np.sin(2 * np.pi * f * t) for f in (233.1, 246.9, 311.1, 329.6))
    x *= 0.6 + 0.4 * np.sin(2 * np.pi * 6 * t)
    return norm(x * env(d, 0.25, d, 2.2) + bandpass(noise(d), 2000, 6000) * env(d, 0.3, d, 3) * 0.15)


def drone(d=4.0, f=55.0):
    t = t_axis(d)
    x = np.sin(2 * np.pi * f * t) + 0.8 * np.sin(2 * np.pi * (f * 1.06) * t) + 0.3 * np.sin(2 * np.pi * f * 2 * t)
    x += bandpass(noise(d), 80, 400) * 0.6
    fade = np.minimum(1, t / 1.0) * np.minimum(1, (d - t) / 1.0)
    return norm(x * fade)


def clack():
    c = bandpass(noise(0.05), 1500, 9000) * env(0.05, 0.001, 0.05, 6)
    w = tone([880], 0.12, decay=30, harm=(1, 0.3))
    return norm(np.concatenate([c, np.zeros(int(0.07 * SR))]) + w)


def ding(f=1318.5, d=1.2):
    return norm(tone([f], d, decay=2.2, harm=(1, 0.35, 0.12)))


def scratch():
    a = sweep(900, 180, 0.35) * env(0.35, 0.005, 0.35, 1.0)
    n = bandpass(noise(0.35), 400, 4000) * env(0.35, 0.002, 0.35, 2) * 0.5
    b = sweep(220, 700, 0.18) * env(0.18, 0.003, 0.18, 1.5)
    return norm(np.concatenate([a + n, b]))


def step(heavy=1.0):
    d = 0.09
    thump = np.sin(2 * np.pi * 75 * t_axis(d)) * env(d, 0.002, d, 7)
    tap = bandpass(noise(d), 200, 2500) * env(d, 0.001, d, 9) * 0.6
    return norm(thump * heavy + tap)


def stomp():
    d = 0.4
    return norm(np.sin(2 * np.pi * np.cumsum(np.linspace(110, 45, int(d * SR))) / SR) * env(d, 0.002, d, 5) + bandpass(noise(d), 100, 1200) * env(d, 0.001, d, 9) * 0.5)


def scrape(d=1.8):
    t = t_axis(d)
    jit = np.abs(bandpass(noise(d), 4, 30))
    jit = jit / (jit.max() + 1e-9)
    x = bandpass(noise(d), 180, 1100) * (0.4 + 0.8 * jit)
    return norm(x * np.minimum(1, t / 0.1) * np.minimum(1, (d - t) / 0.15))


def gulp():
    return norm(sweep(420, 160, 0.16) * env(0.16, 0.004, 0.16, 2.5))


def slide_down(d=0.8):
    t = t_axis(d)
    f = 1600 * (300 / 1600) ** (t / d) * (1 + 0.03 * np.sin(2 * np.pi * 7 * t))
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, 0.02, d, 0.8))


def harp(up=True, d=0.9):
    notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568.0]
    if not up:
        notes = notes[::-1]
    out = np.zeros(int(d * SR) + int(0.8 * SR))
    for k, f in enumerate(notes):
        p = tone([f], 0.8, decay=4.0, harm=(1, 0.2))
        i = int(k * d / len(notes) * SR)
        out[i:i + len(p)] += p
    return norm(out)


def music_box(d=2.4):
    notes = [(1046.5, 0.0), (987.8, 0.45), (1046.5, 0.9), (830.6, 1.35), (783.99, 1.8)]
    out = np.zeros(int(d * SR))
    for f, at in notes:
        p = tone([f, f * 1.003], 0.9, decay=3.0, harm=(1, 0.1, 0.4))
        i = int(at * SR)
        out[i:i + len(p)] += p[: len(out) - i]
    return norm(out)


def crickets(d):
    out = np.zeros(int(d * SR))
    t = 0.0
    while t < d - 0.3:
        burst = np.sin(2 * np.pi * 4600 * t_axis(0.02)) * env(0.02, 0.002, 0.02, 3)
        for k in range(3):
            i = int((t + k * 0.035) * SR)
            out[i:i + len(burst)] += burst
        t += 0.55 + rng.random() * 0.5
    return norm(out) * np.minimum(1, t_axis(d) / 0.5) * np.minimum(1, (d - t_axis(d)) / 0.5)


def birds(d):
    out = np.zeros(int(d * SR))
    t = 0.2
    while t < d - 0.3:
        f0 = 2400 + rng.random() * 1600
        c = sweep(f0, f0 * (1.3 + rng.random() * 0.4), 0.07) * env(0.07, 0.005, 0.07, 2)
        for k in range(1 + int(rng.random() * 3)):
            i = int((t + k * 0.09) * SR)
            out[i:i + len(c)] += c
        t += 0.4 + rng.random() * 0.8
    return norm(out) * np.minimum(1, t_axis(d) / 0.4) * np.minimum(1, (d - t_axis(d)) / 0.4)


def room_tone(d, lo=60, hi=500):
    t = t_axis(d)
    return norm(bandpass(noise(d), lo, hi)) * np.minimum(1, t / 0.4) * np.minimum(1, (d - t) / 0.4)


def click():
    return norm(bandpass(noise(0.015), 2000, 9000) * env(0.015, 0.0005, 0.015, 6))


# ------------------------------------------------------------------ cues (s) — ver Video.tsx
# Ambientes
place(crickets(13.1), 0.0, 0.05)
place(room_tone(13.1, 50, 300), 0.0, 0.05)
place(birds(5.3), 13.1, 0.06)
place(birds(3.6), 18.4, 0.08)
place(room_tone(4.3, 200, 2000), 18.4, 0.03)
place(birds(11.6), 22.0, 0.04)
place(crickets(1.4), 34.3, 0.05)
place(room_tone(17.3, 80, 600), 35.7, 0.03)
place(crickets(12.4), 70.0, 0.05)

# Gancho
place(drone(3.6, 49.0), 0.0, 0.35)
place(whoosh(0.8, 200, 2500), 0.0, 0.35)
place(sinister(2.0), 1.75, 0.3)
place(dun(49.0, 1.8), 1.8, 0.45)
place(sinister(2.2), 5.6, 0.25)
place(dun(46.0, 1.4), 6.2, 0.4)
place(whoosh(0.5), 7.45, 0.2)

# Placa vira 1 → 2
place(clack(), 11.72, 0.5)
place(dun(55.0, 1.2), 11.75, 0.3)

# Manhã, aéreo, susto
place(harp(True, 0.8), 13.1, 0.22)
place(dun(52.0, 1.6), 14.95, 0.5)
place(scratch(), 16.95, 0.45)

# Clone vai trabalhar (passos)
for k in range(9):
    place(step(0.7), 18.5 + k * 0.43, 0.22, pan=0.3)
place(whoosh(0.5), 21.9, 0.25)
place(ding(880, 0.8), 22.05, 0.2)

# Nina
place(whoosh(0.4), 25.2, 0.15)
place(stomp(), 28.75, 0.55)

# Mãe arrasta a cama + contador
place(scrape(1.8), 29.25, 0.45)
place(ding(1318.5, 1.0), 31.95, 0.4)
place(whoosh(0.45), 32.95, 0.2)
place(dun(58.0, 1.0), 33.05, 0.3)
place(drone(1.5, 46.0), 34.3, 0.3)

# Cozinha: goles, choque, duas Ninas
for k in range(3):
    place(gulp(), 37.6 + k * 0.32, 0.35)
place(dun(52.0, 1.4), 40.3, 0.45)
place(scratch(), 41.72, 0.35)
place(dun(49.0, 1.8), 41.75, 0.5)

# Ideia do pai
place(ding(1568.0, 1.2), 46.0, 0.45)
place(ding(2093.0, 0.9), 46.08, 0.2)

# Pai fica branco + lembrança + alívio
place(slide_down(0.8), 53.0, 0.4)
place(harp(True, 0.9), 53.9, 0.25)
place(harp(False, 0.9), 56.6, 0.18)
place(ding(1046.5, 1.0), 57.0, 0.25)
place(ding(1318.5, 1.0), 57.12, 0.2)

# Nina falsa
place(music_box(2.4), 61.9, 0.3)
place(drone(4.2, 46.0), 62.9, 0.3)
place(sinister(2.4), 64.6, 0.2)

# Corrida e sumiço
place(whoosh(0.5, 400, 5000), 67.25, 0.4)
for k in range(12):
    place(step(0.5), 67.35 + k * 0.2, 0.18 * (1 - k / 14), pan=0.4)
place(whoosh(0.9, 300, 3000), 68.6, 0.2)

# Final: abajur apaga
place(click(), 81.4, 0.5)

# ------------------------------------------------------------------ saída
peak = np.max(np.abs(mix))
mix = mix / peak * 0.89 if peak > 0.89 else mix
out = (mix.T * 32767).astype(np.int16)
path = ROOT / 'public/audio/dormir-sfx.wav'
with wave.open(str(path), 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(out.tobytes())
print('ok', path, f'{DUR:.1f}s')
