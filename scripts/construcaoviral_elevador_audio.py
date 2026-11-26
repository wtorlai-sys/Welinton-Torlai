"""SFX + trilha do episódio "Parabéns! Você construiu um elevador" (Construção Viral).
Cues = tempos reais da narração aprovada. Saídas: out/construcaoviral/elevador_sfx.wav e elevador_musica.wav
Uso: python3 scripts/construcaoviral_elevador_audio.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from construcaoviral_sfx_lib import *  # noqa: F401,F403

DUR = 146.7
m = Mix(DUR)
put, amb = m.put, m.amb

# gancho: caixa subindo na corda, corda arrebenta, queda
for i in range(10):
    put(0.6 + i * 0.38, creak(0.35), 0.18)
put(5.55, snap(), 0.8)
put(5.6, whoosh(1.0), 0.5)
put(6.6, rumble(1.4, 45), 1.0)
put(6.62, thud(0.5, 55), 0.8)
for r, d in [(6.9, 0.8), (53.4, 0.7), (106.0, 0.7), (121.15, 0.75)]:
    put(r, rewind(d), 0.45)
put(7.9, creak(0.8), 0.4)
put(8.66, rip(0.4), 0.4)
put(9.36, snap(), 0.8)
put(10.3, whoosh(0.4), 0.3)
put(12.8, thud(0.5, 45), 0.7)
# cabo de aço + motor
put(13.6, clank(), 0.35)
amb(14.0, 17.4, motor, 0.35)
amb(17.6, 23.9, lambda d: motor(d) * 1.0, 0.6)
put(21.1, boing(), 0.35)
put(24.6, clank(), 0.4)
amb(27.9, 31.8, motor, 0.25)
for td in [39.18, 50.68, 62.48, 76.1, 91.3, 102.44, 112.96, 128.76]:
    put(td, ding(), 0.55)
# balanço e batidas
for at in [41.8, 42.6, 43.2]:
    put(at, thud(0.3, 90), 0.6)
put(45.0, zap_up(0.4), 0.25)
amb(45.0, 48.6, lambda d: bandpass(noise(d), 1500, 5000), 0.08)
# cabo arrebenta
put(51.74, snap(), 0.9)
put(52.0, whoosh(1.2), 0.5)
put(53.3, rumble(1.0, 45), 0.9)
for i in range(5):
    put(56.3 + i * 0.25, clank(), 0.25)
amb(58.0, 62.0, motor, 0.25)
# falta de luz
put(63.4, thud(0.3, 70), 0.5)
amb(63.4, 65.3, lambda d: lowpass(noise(d), 200), 0.15)
# freio: tambor girando, molas
put(68.0, boing(), 0.3)
put(70.3, zap_up(0.4), 0.4)
amb(70.9, 74.2, motor, 0.3)
put(72.9, thud(0.25, 120), 0.6)
put(73.0, screech(0.5), 0.25)
# queda e garras
amb(81.9, 88.4, lambda d: whoosh(d), 0.5)
put(88.4, screech(1.2), 0.7)
put(88.42, thud(0.4, 60), 0.7)
# limitador
amb(94.4, 99.5, lambda d: bandpass(noise(d), 800, 2500) * 0.5, 0.15)
put(99.5, snap(), 0.7)
put(100.56, clank(), 0.4)
put(101.0, screech(0.8), 0.5)
# fundo do poço
amb(104.3, 105.7, whoosh, 0.4)
put(105.74, rumble(1.0, 40), 1.0)
for i in range(4):
    put(107.2 + i * 0.3, thud(0.2, 80), 0.3)
put(110.0, boing(), 0.5)
put(111.1, boing(), 0.4)
# porta
put(117.4, bandpass(noise(0.6), 400, 2500) * env(0.6, 0.05, 0.25), 0.3)
put(120.6, whoosh(0.4), 0.4)
put(121.7, bandpass(noise(0.5), 400, 2500) * env(0.5, 0.05, 0.25), 0.3)
put(122.96, click(), 0.8)
amb(122.2, 124.6, motor, 0.25)
put(124.74, ding2(), 0.6)
put(124.8, bandpass(noise(0.6), 400, 2500) * env(0.6, 0.05, 0.25), 0.3)
put(126.9, boing(), 0.25)
# montagem: espelho, alarme, música
put(133.6, zap_up(0.3), 0.3)
put(134.8, click(), 0.6)
put(134.9, bandpass(noise(0.4), 2500, 4000) * env(0.4, 0.01, 0.2), 0.2)
amb(137.6, 139.3, motor, 0.3)
put(139.3, ding2(), 0.6)
put(139.36, fanfarra(), 0.55)

mus = musica(DUR, bpm=112, seed=9)
# trilha "de elevador" (bossa leve) só na piada da música: 135.5–137.3
lift = musica(2.2, bpm=96, seed=2, escala=(349.23, 440.0, 523.25, 587.33, 659.25, 698.46, 783.99, 880.0), prog=(174.61, 146.83, 196.0, 130.81), vol=0.5)
m.put(135.45, lift[0], 0.9)
t = np.arange(int(DUR * SR)) / SR
mus *= 1 - 0.9 * (np.clip((t - 135.3) / 0.15, 0, 1) * np.clip((137.4 - t) / 0.2, 0, 1))
mus *= 1 - 0.85 * (np.clip((t - 6.5) / 0.1, 0, 1) * np.clip((7.0 - t) / 0.2, 0, 1))

OUT = Path(__file__).resolve().parent.parent / "out" / "construcaoviral"
save(OUT / "elevador_sfx.wav", m.x)
save(OUT / "elevador_musica.wav", mus)
