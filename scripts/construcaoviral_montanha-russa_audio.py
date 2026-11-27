"""SFX + trilha do episódio "Parabéns! Você construiu uma montanha-russa" (Construção Viral).
Cues = tempos reais da narração aprovada. Saídas: out/construcaoviral/montanha-russa_sfx.wav e _musica.wav
Uso: python3 scripts/construcaoviral_montanha-russa_audio.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from construcaoviral_sfx_lib import *  # noqa: F401,F403

DUR = 148.8
m = Mix(DUR)
put, amb = m.put, m.amb


def rolar(d):
    """Ronco de rodas no trilho (ruído grave modulado)."""
    t = t_axis(d)
    return norm(lowpass(noise(d), 500) * (0.7 + 0.3 * np.sin(2 * np.pi * 11 * t)))


def vento(d):
    t = t_axis(d)
    return norm(bandpass(noise(d), 300, 4000) * np.minimum(1, t / 0.5))


def clac_som():
    return norm(bandpass(noise(0.07), 1500, 7000) * env(0.07, 0.0005, 0.02) + thud(0.07, 300) * 0.6)


def zumbido(d):
    t = t_axis(d)
    f = 220 - 120 * t / d
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / 0.2) * np.minimum(1, (d - t) / 0.3) + bandpass(noise(d), 1000, 5000) * 0.2)


def grito(d=1.4):
    t = t_axis(d)
    f = 600 + 200 * np.sin(2 * np.pi * 5 * t)
    saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
    return norm(bandpass(saw, 500, 3500) * env(d, 0.05, d * 0.6)) * 0.6


# gancho: descida, voo, splash
amb(2.75, 5.75, lambda d: rolar(d) * 0.6 + vento(d) * 0.4, 0.5)
put(5.8, whoosh(0.9), 0.6)
put(5.9, grito(1.2), 0.25)
put(6.6, splash(1.2), 0.9)
for r, d in [(7.4, 0.8), (51.8, 0.7), (119.0, 0.7)]:
    put(r, rewind(d), 0.45)
amb(8.3, 11.6, lambda d: rolar(d) * 0.6 + vento(d) * 0.4, 0.45)
put(12.9, whoosh(0.6), 0.3)
for td in [23.4, 37.2, 47.7, 61.6, 85.8, 97.9, 112.6, 128.5]:
    put(td, ding(), 0.55)
for tx in [16.06, 17.66, 18.34]:
    put(tx, click(), 0.6)
amb(18.9, 21.2, rolar, 0.3)
amb(24.6, 28.4, rolar, 0.45)
put(27.1, whoosh(0.5), 0.35)
for i in range(5):
    put(29.2 + i * 0.6, creak(0.5), 0.2)
amb(32.8, 35.9, rolar, 0.45)
# corrente
amb(41.1, 42.4, lambda d: bandpass(noise(d), 800, 3000), 0.15)
amb(42.6, 49.2, motor, 0.35)
for i in range(int((49.2 - 42.8) / 0.32)):
    put(42.8 + i * 0.32, clac_som(), 0.18)
put(49.22, snap(), 0.9)
for i in range(6):
    put(49.3 + i * 0.07, click(), 0.4)
amb(49.6, 51.8, lambda d: rolar(d) * 0.6 + vento(d) * 0.4, 0.5)
# dentes / garra / clac
for i in range(6):
    put(53.4 + i * 0.18, clank(), 0.18)
amb(52.4, 58.8, motor, 0.2)
for tc in [56.98, 57.66, 58.02, 64.96, 65.54, 65.94]:
    put(tc, clac_som(), 0.9)
put(58.9, snap(), 0.7)
put(60.32, clac_som(), 1.0)
put(60.32, thud(0.3, 90), 0.6)
amb(63.0, 66.5, motor, 0.2)
# loop
amb(69.4, 72.5, lambda d: rolar(d) * 0.6 + vento(d) * 0.4, 0.55)
put(72.8, thud(0.4, 50), 0.6)
put(73.0, boing(), 0.35)
for i in range(6):
    put(75.7 + i * 0.4, creak(0.4), 0.18)
amb(79.7, 84.6, lambda d: rolar(d) * 0.6 + vento(d) * 0.4, 0.5)
# trava
put(90.0, boing(), 0.3)
put(93.1, whoosh(0.4), 0.3)
put(94.38, clac_som(), 0.9)
# freio magnético
amb(98.6, 101.7, lambda d: rolar(d) * 0.6 + vento(d) * 0.4, 0.5)
put(103.6, zap_up(0.4), 0.35)
put(105.0, zap_up(0.3), 0.3)
amb(106.3, 111.3, zumbido, 0.4)
# blocos
amb(113.2, 117.2, rolar, 0.3)
amb(117.4, 118.7, lambda d: rolar(d) * 0.6 + vento(d) * 0.4, 0.5)
put(118.74, rumble(0.9, 50), 0.9)
put(124.0, screech(0.5), 0.35)
put(129.4, ding2(), 0.5)
amb(129.5, 132.2, rolar, 0.25)
# acabamento
put(133.08, zap_up(0.2), 0.5)
put(133.1, click(), 0.8)
amb(134.3, 136.0, lambda d: bandpass(noise(d), 300, 3000), 0.12)
put(136.42, grito(1.6), 0.6)
# uso + parabéns
amb(138.4, 141.0, lambda d: rolar(d) * 0.6 + vento(d) * 0.4, 0.5)
put(138.9, grito(1.8), 0.35)
put(140.9, fanfarra(), 0.55)

mus = musica(DUR, bpm=124, seed=11)
t = np.arange(int(DUR * SR)) / SR
mus *= 1 - 0.85 * (np.clip((t - 6.4) / 0.1, 0, 1) * np.clip((7.2 - t) / 0.2, 0, 1))
mus *= 1 - 0.8 * (np.clip((t - 118.6) / 0.1, 0, 1) * np.clip((119.4 - t) / 0.2, 0, 1))

OUT = Path(__file__).resolve().parent.parent / "out" / "construcaoviral"
save(OUT / "montanha-russa_sfx.wav", m.x)
save(OUT / "montanha-russa_musica.wav", mus)
