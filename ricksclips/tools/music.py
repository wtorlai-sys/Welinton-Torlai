#!/usr/bin/env python3
"""music.py - a light, curious instrumental bed for a Short, synthesised in code.

  python3 music.py <out.mp3> <seconds> [--pivot S]

Plucked strings (Karplus-Strong) on a I-vi-IV-V progression at 104 bpm, a soft
bass, a light shaker. From --pivot (the "Você vê…" moment) the harmony turns
to minor and the plucks get sparser, matching the light going blue. Fades out
at the end. Deterministic (fixed seed). Needs ffmpeg for the mp3.
"""
import subprocess, sys, tempfile, wave
import numpy as np

SR = 44100
BPM = 104
BEAT = 60 / BPM
rng = np.random.default_rng(5)


def midi(n): return 440.0 * 2 ** ((n - 69) / 12)


def pluck(freq, dur, bright=0.6):
    n = int(dur * SR); period = max(2, int(SR / freq))
    buf = rng.uniform(-1, 1, period)
    out = np.empty(n)
    for i in range(n):
        out[i] = buf[i % period]
        buf[i % period] = 0.5 * (buf[i % period] + buf[(i + 1) % period]) * (0.990 + 0.009 * bright)
    env = np.minimum(1, np.arange(n) / (0.004 * SR))
    return out * env


def bass(freq, dur):
    t = np.arange(int(dur * SR)) / SR
    return (np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(4 * np.pi * freq * t)) * np.exp(-t * 3.0) * np.minimum(1, t / 0.01)


def shaker(dur):
    n = int(dur * SR); t = np.arange(n) / SR
    x = rng.normal(0, 1, n); x = np.diff(x, prepend=0)          # bright noise
    return x * np.exp(-t * 40)


def add(mix, sig, at, gain):
    i = int(at * SR); j = min(len(mix), i + len(sig))
    if i < len(mix): mix[i:j] += sig[: j - i] * gain


def main(out, seconds, pivot):
    mix = np.zeros(int((seconds + 1) * SR))
    major = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]]      # C Am F G
    minor = [[57, 60, 64], [53, 57, 60], [52, 55, 59], [52, 56, 59]]      # Am F Em E
    t, bar = 0.0, 0
    while t < seconds:
        dark = pivot is not None and t >= pivot
        chord = (minor if dark else major)[bar % 4]
        add(mix, bass(midi(chord[0] - 24), BEAT * 2), t, 0.35)
        add(mix, bass(midi(chord[0] - 24 + (7 if not dark else 0)), BEAT * 2), t + BEAT * 2, 0.3)
        pattern = [0, 1, 2, 1, 0, 2, 1, 2] if not dark else [0, None, 2, None, 1, None, 2, None]
        for k, idx in enumerate(pattern):
            at = t + k * BEAT / 2
            if idx is not None and at < seconds:
                add(mix, pluck(midi(chord[idx] + 12), 1.2, 0.7 if not dark else 0.3), at, 0.22)
            if not dark and at < seconds: add(mix, shaker(0.08), at + BEAT / 4, 0.05)
        t += BEAT * 4; bar += 1
    mix = mix[: int(seconds * SR)]
    fade = int(1.2 * SR); mix[-fade:] *= np.linspace(1, 0, fade)
    mix[: int(0.05 * SR)] *= np.linspace(0, 1, int(0.05 * SR))
    mix /= np.abs(mix).max() + 1e-9; mix *= 0.8
    st = np.stack([mix, np.roll(mix, int(0.012 * SR)) * 0.95], 1)          # a little width
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f: path = f.name
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype(np.int16).tobytes())
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", path, "-b:a", "192k", out], check=True)


if __name__ == "__main__":
    a = sys.argv[1:]
    piv = float(a[a.index("--pivot") + 1]) if "--pivot" in a else None
    main(a[0], float(a[1]), piv)
