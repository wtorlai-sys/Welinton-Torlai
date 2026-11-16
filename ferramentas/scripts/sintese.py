"""Biblioteca de sons gerados por código (numpy), determinística por seed.

Cada gerador recebe `seed` (variação de tom/filtro/duração) e devolve um array mono
float em -1..1 a 48 kHz. Base: scripts/gerar_sfx.py.

Sons: whoosh, pop, tique, blip, ding, moeda, moedas, caixa, impacto, sub, riser,
glitch, tape_stop, coracao, drone, clique, rasgo.
"""
import numpy as np

SR = 48000


# ------------------------------------------------------------------ utilitários
def t_axis(d):
    return np.arange(int(d * SR)) / SR


def rng_de(seed):
    return np.random.default_rng(int(seed) & 0xFFFFFFFF)


def bandpass(x, lo, hi, soft=0.15):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    g = np.ones_like(f)
    if lo > 0:
        g *= 1 / (1 + np.exp(np.clip(-(f - lo) / (lo * soft + 1), -60, 60)))
    if hi < SR / 2:
        g *= 1 / (1 + np.exp(np.clip((f - hi) / (hi * soft + 1), -60, 60)))
    return np.fft.irfft(X * g, len(x))


def env(d, a=0.005, r=None, shape=3.0):
    t = t_axis(d)
    e = np.minimum(1, t / max(a, 1e-4))
    r = r if r is not None else d
    return e * np.exp(-shape * np.maximum(0, t - a) / r)


def norm(x, peak=1.0):
    return x / (np.max(np.abs(x)) + 1e-9) * peak


def sweep(f0, f1, d, curve='exp'):
    t = t_axis(d)
    f = f0 * (f1 / f0) ** (t / d) if curve == 'exp' else f0 + (f1 - f0) * t / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def tone(freqs, d, decay=2.0, a=0.002, harm=(1.0, 0.5, 0.25)):
    t = t_axis(d)
    out = np.zeros_like(t)
    for f in freqs:
        for k, h in enumerate(harm):
            out += h * np.sin(2 * np.pi * f * (k + 1) * t) * np.exp(-decay * (k + 1) * t)
    return out * np.minimum(1, t / a)


def fade(x, a=0.002, r=0.01):
    n = len(x)
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return x * e


# ------------------------------------------------------------------ sons
def whoosh(d=0.55, forca=1.0, seed=0):
    """Ar passando: pico no meio-fim (ver `pico` em sfx.py)."""
    r = rng_de(seed)
    d = d * (0.9 + 0.2 * r.random())
    t = t_axis(d)
    n = r.standard_normal(len(t))
    lo, hi = 250 + 200 * r.random(), 2500 + 2500 * r.random() * forca
    x = bandpass(n, lo, hi)
    # varredura de filtro: segundo passe mais agudo, cresce até o pico
    x2 = bandpass(n, hi * 0.6, hi * 2.2) * (t / d) ** 2
    p = 0.62 + 0.1 * r.random()
    e = np.where(t < p * d, (t / (p * d)) ** 2.2, np.exp(-6 * (t - p * d) / d))
    tom = sweep(180 * (1 + r.random()), 90, d) * 0.25 * forca
    return norm((x + 0.5 * x2 + tom) * e)


def pop(forca=1.0, seed=0):
    r = rng_de(seed)
    d = 0.11
    f0 = (520 + 260 * r.random()) * (1.0 if forca < 1 else 0.85)
    body = sweep(f0 * 2.2, f0, d) * env(d, 0.001, d, 9)
    click = bandpass(r.standard_normal(int(0.012 * SR)), 2000, 9000) * env(0.012, 0.0005, 0.012, 5)
    out = body.copy()
    out[: len(click)] += click * 0.35
    return norm(fade(out))


def tique(seed=0, f=None):
    r = rng_de(seed)
    f = f or 2400 + 900 * r.random()
    d = 0.03
    x = np.sin(2 * np.pi * f * t_axis(d)) * env(d, 0.0005, d, 10)
    x += bandpass(r.standard_normal(len(x)), 3000, 10000) * env(d, 0.0003, d, 14) * 0.5
    return norm(x)


def blip(seed=0, notas=2, sobe=True):
    r = rng_de(seed)
    base = 880 * 2 ** (r.integers(0, 5) / 12)
    out = []
    for k in range(notas):
        f = base * 2 ** ((k * 7 if sobe else -k * 5) / 12)
        d = 0.06
        x = np.sign(np.sin(2 * np.pi * f * t_axis(d))) * 0.35 + np.sin(2 * np.pi * f * t_axis(d))
        out.append(x * env(d, 0.001, d, 5))
    return norm(fade(np.concatenate(out)))


def ding(seed=0, f=None, d=0.9, duplo=False):
    r = rng_de(seed)
    f = f or 1318.5 * 2 ** (r.integers(-2, 3) / 12)
    x = tone([f, f * 1.0015], d, decay=3.0, harm=(1, 0.3, 0.12, 0.05))
    if duplo:
        y = tone([f * 1.335], d, decay=3.0, harm=(1, 0.3, 0.1))
        i = int(0.09 * SR)
        x[i:] += y[: len(x) - i] * 0.9
    return norm(x)


def moeda(seed=0):
    r = rng_de(seed)
    d = 0.45
    f = 2500 + 1500 * r.random()
    parc = [1.0, 2.76, 5.4, 8.93]
    t = t_axis(d)
    x = sum(np.sin(2 * np.pi * f * p * t * (1 + 0.0005 * k)) * np.exp(-(6 + 5 * k) * t) / (k + 1)
            for k, p in enumerate(parc))
    return norm(x * np.minimum(1, t / 0.0008))


def moedas(d=1.2, n=12, seed=0):
    """Cascata de moedas caindo (densidade cai com o tempo)."""
    r = rng_de(seed)
    out = np.zeros(int((d + 0.5) * SR))
    for k in range(n):
        at = d * (k / n) ** 1.4 + 0.02 * r.random()
        c = moeda(seed * 101 + k) * (0.55 + 0.45 * r.random()) * (1 - 0.5 * k / n)
        i = int(at * SR)
        out[i:i + len(c)] += c[: len(out) - i]
    return norm(out)


def caixa(seed=0):
    """Caixa registradora: clique mecânico + gaveta + sino."""
    r = rng_de(seed)
    out = np.zeros(int(1.3 * SR))
    for k, at in enumerate((0.0, 0.05, 0.1)):
        c = bandpass(r.standard_normal(int(0.03 * SR)), 800, 6000) * env(0.03, 0.0005, 0.03, 8)
        i = int(at * SR)
        out[i:i + len(c)] += c * 0.6
    g = bandpass(r.standard_normal(int(0.25 * SR)), 150, 1500) * env(0.25, 0.01, 0.25, 4)
    i = int(0.16 * SR)
    out[i:i + len(g)] += g * 0.5
    s = tone([2093.0, 2637.0], 1.0, decay=2.0, harm=(1, 0.4, 0.15))
    i = int(0.18 * SR)
    out[i:i + len(s)] += s[: len(out) - i] * 0.8
    return norm(out)


def sub(f0=90, f1=38, d=0.9, seed=0):
    r = rng_de(seed)
    d = d * (0.9 + 0.2 * r.random())
    x = sweep(f0, f1, d) * env(d, 0.003, d, 3.5)
    return norm(np.tanh(x * 1.6))


def impacto(forca=1.0, seed=0):
    """Batida com transiente (estalo) + corpo; o grave fica na camada `sub`."""
    r = rng_de(seed)
    d = 0.35 + 0.35 * forca
    t = t_axis(d)
    corpo = sweep(220 * (0.9 + 0.2 * r.random()), 60, d) * env(d, 0.001, d, 6)
    ruido = bandpass(r.standard_normal(len(t)), 300, 5000 + 3000 * forca) * env(d, 0.0005, d, 12)
    cauda = bandpass(r.standard_normal(len(t)), 2000, 9000) * env(d, 0.02, d, 4) * 0.15 * forca
    return norm(np.tanh((corpo + ruido * 0.8 + cauda) * 1.5))


def riser(d=1.0, seed=0, f0=200, f1=1600):
    """Sobe até o fim e corta seco (alinhar pelo FIM no evento)."""
    r = rng_de(seed)
    t = t_axis(d)
    n = r.standard_normal(len(t))
    tom = sweep(f0, f1, d) + 0.5 * sweep(f0 * 1.5, f1 * 1.5, d)
    ar = bandpass(n, 800, 9000) * (t / d) ** 1.5
    e = (t / d) ** 2.0
    x = (tom * 0.6 + ar) * e
    x[-int(0.004 * SR):] *= np.linspace(1, 0, int(0.004 * SR))
    return norm(x)


def glitch(d=0.6, seed=0):
    r = rng_de(seed)
    out = np.zeros(int(d * SR))
    i = 0
    while i < len(out):
        n = int(SR * (0.015 + 0.05 * r.random()))
        kind = r.integers(0, 3)
        tt = np.arange(n) / SR
        if kind == 0:
            seg = np.sign(np.sin(2 * np.pi * (200 + 2000 * r.random()) * tt))
        elif kind == 1:
            seg = bandpass(r.standard_normal(n), 1000, 8000)
        else:
            seg = np.round(np.sin(2 * np.pi * (60 + 300 * r.random()) * tt) * 3) / 3
        seg = norm(seg) * (0.4 + 0.6 * r.random())
        out[i:i + n] = seg[: len(out) - i]
        i += n + int(SR * 0.01 * r.random())
    return norm(out * env(d, 0.001, d, 1.5))


def tape_stop(x, d=0.6):
    """Aplica 'fita parando' no fim de um sinal mono (tom e velocidade caem a zero)."""
    n = int(d * SR)
    n = min(n, len(x))
    cauda = x[-n:]
    vel = np.linspace(1, 0, n) ** 1.3
    pos = np.cumsum(vel)
    pos = np.clip(pos, 0, n - 1)
    y = np.interp(pos, np.arange(n), cauda) * np.linspace(1, 0, n) ** 0.5
    return np.concatenate([x[:-n], y])


def coracao(seed=0):
    d = 0.7
    out = np.zeros(int(d * SR))
    for at, g in ((0.0, 1.0), (0.22, 0.7)):
        b = sweep(70, 45, 0.18) * env(0.18, 0.004, 0.18, 6) * g
        i = int(at * SR)
        out[i:i + len(b)] += b
    return norm(out)


def drone(d=2.0, f=55.0, seed=0):
    r = rng_de(seed)
    t = t_axis(d)
    x = np.sin(2 * np.pi * f * t) + 0.7 * np.sin(2 * np.pi * f * 1.012 * t) + 0.3 * np.sin(2 * np.pi * f * 2 * t)
    x += bandpass(r.standard_normal(len(t)), 60, 300) * 0.4
    e = np.minimum(1, t / (0.4 * d)) * np.minimum(1, (d - t) / (0.3 * d))
    return norm(x * e)


def clique(seed=0):
    r = rng_de(seed)
    a = bandpass(r.standard_normal(int(0.012 * SR)), 1500, 8000) * env(0.012, 0.0003, 0.012, 7)
    b = bandpass(r.standard_normal(int(0.012 * SR)), 1000, 6000) * env(0.012, 0.0003, 0.012, 7) * 0.6
    gap = np.zeros(int(0.035 * SR))
    return norm(np.concatenate([a, gap, b]))


def rasgo(d=0.35, seed=0):
    r = rng_de(seed)
    t = t_axis(d)
    jit = np.abs(bandpass(r.standard_normal(len(t)), 20, 120))
    x = bandpass(r.standard_normal(len(t)), 1500, 9000) * (0.3 + jit / (jit.max() + 1e-9))
    return norm(x * env(d, 0.01, d, 3))


SONS = {
    'whoosh': whoosh, 'pop': pop, 'tique': tique, 'blip': blip, 'ding': ding,
    'moeda': moeda, 'moedas': moedas, 'caixa': caixa, 'impacto': impacto, 'sub': sub,
    'riser': riser, 'glitch': glitch, 'coracao': coracao, 'drone': drone,
    'clique': clique, 'rasgo': rasgo,
}
