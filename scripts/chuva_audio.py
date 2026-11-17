"""Trilha + efeitos do episódio "A chuva da vovó" (89 s). Tudo sintetizado (numpy), determinístico.

Saídas: public/audio/chuva-musica.wav e public/audio/chuva-sfx.wav (estéreo 44,1 kHz).
A mixagem final com a narração (ducking + loudness) é feita por scripts/chuva_mix.sh.

Música (nunca para — regra do canal):
  0–35 s    piano leve e brincalhão (cidade, gags)
  35–39 s   "nossa música": valsa de caixinha de música (flashback)
  39–54 s   piano lento e saudoso
  54–80.3 s a valsa volta cheia (rádio tocando, dança na chuva)
  80.3–82.7 só um pad suave ("a música acabou")
  82.7–fim  reprise curta da valsa, sumindo
"""
import wave
from pathlib import Path

import numpy as np

SR = 44100
DUR = 89.4
N = int(DUR * SR)
ROOT = Path(__file__).resolve().parent.parent
rng = np.random.default_rng(7)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def env_adsr(n, a=0.005, d=0.3, s=0.35, r=0.4, length=None):
    length = length or n / SR
    t = np.arange(n) / SR
    e = np.where(t < a, t / a, s + (1 - s) * np.exp(-(t - a) / d))
    rel = np.clip((t - length + r) / r, 0, 1)
    return e * (1 - rel)


def piano(freq, dur, vel=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for k, amp in enumerate([1, 0.45, 0.22, 0.12, 0.06], start=1):
        x += amp * np.sin(2 * np.pi * freq * k * t * (1 + 0.0004 * k * k)) * np.exp(-t * (1.6 + k * 0.9))
    x *= np.minimum(1, t / 0.004)
    x *= np.clip((dur - t) / 0.08, 0, 1)
    return x * vel


def musicbox(freq, dur, vel=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 4.0 * t) * np.exp(-t * 9) + 0.2 * np.sin(2 * np.pi * freq * 2 * t)
    return x * np.exp(-t * 2.6) * np.minimum(1, t / 0.002) * np.clip((dur - t) / 0.05, 0, 1) * vel


def pad(freqs, dur, vel=0.12):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * t + i) + 0.3 * np.sin(2 * np.pi * f * 2.003 * t) for i, f in enumerate(freqs))
    e = np.minimum(1, t / 0.8) * np.clip((dur - t) / 0.8, 0, 1)
    return x * e * vel / len(freqs)


L = np.zeros(N)
R = np.zeros(N)


def put(x, t0, pan=0.0, gain=1.0):
    i = int(t0 * SR)
    if i >= N:
        return
    x = x[: N - i] * gain
    L[i : i + len(x)] += x * (1 - pan) * 0.5 ** 0.5 * 1.2
    R[i : i + len(x)] += x * (1 + pan) * 0.5 ** 0.5 * 1.2


# Acordes (C maior): C, G/B, Am, F | C, F, G, C
PROG = [[48, 55, 64], [47, 55, 62], [45, 52, 60], [41, 53, 57], [48, 55, 64], [41, 53, 60], [43, 50, 59], [48, 55, 64]]

# --- 0–35 s: piano brincalhão (staccato, 100 bpm, arpejo) ---
beat = 60 / 100
t = 0.0
i = 0
while t < 35.0:
    ch = PROG[(i // 4) % len(PROG)]
    step = i % 4
    put(piano(midi(ch[0] - 12), 0.5, 0.28), t, -0.2)
    for k, off in enumerate([0, 0.5]):
        note = ch[(step + k) % 3] + 12
        put(piano(midi(note), 0.3, 0.16), t + off * beat, 0.25)
    if step in (1, 3):
        put(piano(midi(ch[2] + 24), 0.25, 0.07), t + 0.75 * beat, 0.4)
    t += beat
    i += 1

# --- tema da valsa ("nossa música"), 3/4, 84 bpm ---
WALTZ_MEL = [(76, 1), (74, 0.5), (72, 0.5), (74, 1), (76, 2), (77, 1), (79, 2),
             (76, 1), (72, 2), (74, 1), (72, 0.5), (71, 0.5), (72, 1), (69, 2), (72, 1), (74, 3),
             (76, 1), (74, 0.5), (72, 0.5), (74, 1), (79, 2), (77, 1), (76, 2),
             (74, 1), (72, 1), (71, 1), (72, 3), (67, 3)]
WALTZ_CH = [[48, 55, 64], [48, 55, 64], [41, 53, 57], [43, 50, 59], [45, 52, 60], [41, 53, 57], [43, 50, 59], [48, 55, 64]]


def waltz(t0, t1, voice='piano', vel=1.0):
    b = 60 / 84
    bar = 0
    t = t0
    while t < t1:
        ch = WALTZ_CH[bar % len(WALTZ_CH)]
        if voice == 'piano':
            put(piano(midi(ch[0] - 12), 1.2, 0.3 * vel), t, -0.25)
            for k in (1, 2):
                put(piano(midi(ch[1]), 0.5, 0.12 * vel) + piano(midi(ch[2]), 0.5, 0.12 * vel), t + k * b, 0.15)
        else:
            put(musicbox(midi(ch[0]), 1.0, 0.12 * vel), t, -0.2)
        bar += 1
        t += 3 * b
    t = t0
    j = 0
    while t < t1:
        n, d = WALTZ_MEL[j % len(WALTZ_MEL)]
        if voice == 'piano':
            put(piano(midi(n), d * b + 0.4, 0.26 * vel), t, 0.1)
        else:
            put(musicbox(midi(n + 12), d * b + 0.5, 0.22 * vel), t, 0.1)
        t += d * b
        j += 1


waltz(35.0, 39.0, 'box', 1.0)
# --- 39–54: piano lento e saudoso (Am F C G, 60 bpm) ---
SAD = [[45, 52, 60, 64], [41, 48, 57, 60], [48, 55, 60, 64], [43, 50, 55, 59]]
t = 39.0
i = 0
while t < 54.0:
    ch = SAD[i % 4]
    put(piano(midi(ch[0] - 12), 2.4, 0.26), t, -0.2)
    for k, n in enumerate(ch[1:]):
        put(piano(midi(n + 12), 1.6, 0.1), t + 0.5 + k * 0.45, 0.25)
    put(pad([midi(x) for x in ch[1:]], 3.2, 0.05), t, 0)
    t += 2.6
    i += 1
# --- 54.3–80.3: valsa cheia (piano + caixinha por cima) + pad ---
waltz(54.4, 80.3, 'piano', 1.0)
waltz(64.4, 80.3, 'box', 0.55)
put(pad([midi(60), midi(64), midi(67)], 26, 0.035), 54.4)
# --- 80.3–82.7: pad suave ---
put(pad([midi(57), midi(60), midi(64)], 3.0, 0.06), 80.2)
# --- 82.7–fim: reprise ---
waltz(82.7, 89.4, 'box', 0.9)
put(pad([midi(48), midi(55), midi(64)], 6.8, 0.05), 82.6)

music = np.stack([L, R])
fade = np.clip((DUR - np.arange(N) / SR) / 1.4, 0, 1)
music *= fade
music /= np.max(np.abs(music)) + 1e-9
music *= 0.9

# ------------------------------------------------------------------ SFX
SL = np.zeros(N)
SRr = np.zeros(N)


def sput(x, t0, pan=0.0, gain=1.0):
    i = int(t0 * SR)
    if i >= N:
        return
    x = x[: N - i] * gain
    SL[i : i + len(x)] += x * (1 - pan) * 0.7
    SRr[i : i + len(x)] += x * (1 + pan) * 0.7


def bandpass(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    g = 1 / (1 + np.exp(-(f - lo) / (lo * 0.2 + 1))) * 1 / (1 + np.exp((f - hi) / (hi * 0.2 + 1)))
    return np.fft.irfft(X * g, len(x))


def rain(dur, heavy=0.6):
    n = int(dur * SR)
    x = bandpass(rng.standard_normal(n), 900, 9000) * 0.18 * heavy
    # gotinhas
    for _ in range(int(dur * 70 * heavy)):
        i = rng.integers(0, max(1, n - 2000))
        k = np.arange(1200)
        f = 2500 + rng.random() * 3500
        x[i : i + 1200] += np.sin(2 * np.pi * f * k / SR) * np.exp(-k / 120) * 0.12 * rng.random()
    e = np.minimum(1, np.arange(n) / (0.15 * SR)) * np.clip((n - np.arange(n)) / (0.25 * SR), 0, 1)
    return x * e


def thunder(dur=2.4, gain=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = bandpass(rng.standard_normal(n), 30, 400) * (np.exp(-t * 1.6) * (0.6 + 0.4 * np.sin(t * 9) ** 2))
    crack = bandpass(rng.standard_normal(n), 1500, 7000) * np.exp(-t * 18) * 0.5
    return (x * 1.6 + crack) * gain * np.minimum(1, t / 0.01)


def plip(gain=0.6):
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    f = 1400 * np.exp(-t * 6) + 700
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 22) * gain


def click(gain=0.5):
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    return bandpass(rng.standard_normal(n), 1500, 6000) * np.exp(-t * 120) * gain


def hiss(dur, gain=0.03):
    n = int(dur * SR)
    return bandpass(rng.standard_normal(n), 3000, 10000) * gain * np.minimum(1, np.arange(n) / (0.1 * SR))


def sizzle(dur, gain=0.12):
    n = int(dur * SR)
    t = np.arange(n) / SR
    am = 0.5 + 0.5 * np.abs(np.sin(t * 23)) * (rng.random(n) > 0.3)
    return bandpass(rng.standard_normal(n), 3000, 12000) * am * gain


def birds(dur, gain=0.05):
    n = int(dur * SR)
    x = np.zeros(n)
    for _ in range(int(dur * 1.2)):
        i = rng.integers(0, max(1, n - 8000))
        k = np.arange(5000)
        f = 3000 + 1200 * np.sin(k / 400 + rng.random() * 6)
        x[i : i + 5000] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * k / 5000) ** 2 * gain
    return x


# ambiente de dia na cidade (passarinhos)
sput(birds(35), 0, 0.3)
# chuva por plano (início, fim, intensidade)
for a, b, h in [(0, 7.96, 0.4), (15.48, 17.2, 0.5), (17.2, 21.04, 0.4), (23.0, 24.26, 0.5), (35.08, 39.04, 1.0), (64.55, 66.88, 0.8), (66.88, 68.56, 0.6), (71.98, 82.2, 0.75), (86.1, 89.4, 0.6)]:
    sput(rain(b - a, h), a, gain=0.5)  # chuva bem baixa: nunca passa da voz
sput(thunder(2.6, 0.16), 0.6)
sput(thunder(2.4, 0.12), 3.9, -0.2)
sput(thunder(2.0, 0.08), 64.6, 0.1)
sput(plip(0.7), 61.5)
sput(plip(0.6), 63.3, 0.3)
sput(sizzle(1.6), 49.4, -0.2)
sput(click(0.6), 54.7)
sput(hiss(25.6, 0.012), 54.75, 0.0)
sput(click(0.6), 80.6)

sfx = np.stack([SL, SRr])
sfx *= 2.6  # sem normalizar pelo pico: a chuva fica baixa de verdade


def save(x, name):
    x = np.clip(x, -1, 1)
    pcm = (x.T * 32767).astype(np.int16)
    with wave.open(str(ROOT / 'public' / 'audio' / name), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print('ok', name)


save(music, 'chuva-musica.wav')
save(sfx, 'chuva-sfx.wav')
