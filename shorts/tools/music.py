# Trilha minimalista em pizzicato (síntese Karplus-Strong), determinística. Maior até o pivô, menor depois.
import sys, numpy as np, subprocess
out, dur, pivot = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
SR = 44100; rng = np.random.default_rng(7); N = int((dur + 2) * SR); mix = np.zeros((N, 2))
def pluck(f, length=0.5, bright=0.5):
    n = int(SR * length); p = max(2, int(SR / f)); buf = rng.uniform(-1, 1, p); y = np.zeros(n)
    k = 0.5 + 0.49 * bright
    for i in range(n):
        y[i] = buf[i % p]; buf[i % p] = k * buf[i % p] + (1 - k) * buf[(i + 1) % p]
        buf[i % p] *= 0.996
    env = np.exp(-np.linspace(0, 1, n) * 7); att = np.minimum(1, np.arange(n) / (SR * 0.004))
    return y * env * att
cache = {}
def note(t, midi, vel=0.5, pan=0.0, length=0.45, bright=0.5):
    key = (midi, length, bright)
    if key not in cache: cache[key] = pluck(440 * 2 ** ((midi - 69) / 12), length, bright)
    s = cache[key] * vel; i = int(t * SR); j = min(N, i + len(s))
    mix[i:j, 0] += s[:j - i] * (1 - pan) * 0.7; mix[i:j, 1] += s[:j - i] * (1 + pan) * 0.7
def tick(t, vel=0.15):
    n = int(SR * 0.04); s = rng.uniform(-1, 1, n) * np.exp(-np.linspace(0, 1, n) * 30) * vel; i = int(t * SR); mix[i:i + n] += s[:, None] * 0.5
BPM = 132; b = 60 / BPM
# progressões (graus em MIDI): maior saltitante / menor furtiva
major = [[48, 55, 64, 67], [53, 60, 65, 69], [55, 62, 67, 71], [48, 55, 64, 72]]   # C F G C
minor = [[45, 52, 60, 64], [41, 48, 57, 60], [44, 52, 59, 62], [45, 52, 57, 64]]   # Am F E Am
mel_maj = [72, None, 76, 79, None, 76, 74, None, 72, None, 74, 76, 79, None, 81, None]
mel_min = [69, None, 72, None, 71, None, 68, None, 69, 72, None, 76, 75, None, 71, None]
t = 0.0; bar = 0
while t < dur:
    minor_part = t >= pivot
    prog = minor if minor_part else major; ch = prog[bar % 4]; mel = mel_min if minor_part else mel_maj
    for s in range(8):                       # colcheias
        tt = t + s * b / 2
        if tt >= dur: break
        if s % 4 == 0: note(tt, ch[0] - 12, 0.75, -0.2, 0.6, 0.35)     # baixo
        if s % 4 == 2: note(tt, ch[1] - 12, 0.5, -0.2, 0.5, 0.35)
        if s in (1, 3, 5, 7): note(tt, ch[2 + (s // 2) % 2], 0.32, 0.3, 0.3, 0.55)  # acompanhamento off-beat
        m = mel[(bar % 2) * 8 + s]
        if m and (bar % 4) != 3: note(tt, m, 0.42, 0.1, 0.35, 0.7)
        if s % 2 == 1 and not minor_part: tick(tt, 0.08)
    t += 4 * b; bar += 1
# final: acorde pizz
note(dur - 0.6, 45, 0.7, 0, 0.9, 0.4); note(dur - 0.6, 57, 0.5, 0.2, 0.9, 0.5); note(dur - 0.6, 64, 0.4, -0.2, 0.9, 0.6)
mix = mix[:int(dur * SR)]; fade = int(1.0 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
mix /= np.abs(mix).max() * 1.12
pcm = (mix * 32767).astype(np.int16).tobytes()
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-', '-af', 'aecho=0.8:0.5:60|110:0.18|0.1,loudnorm=I=-20:TP=-2', '-b:a', '192k', out], input=pcm, check=True)
print('music ok')
