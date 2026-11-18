"""Monta o Short "A garota popular" (9:16, 1080x1920, 30 fps).

Cenas = imagens 3D geradas no Customuse (workflow "A garota popular"), uma por trecho da narração.
Cada cena vira 1-3 planos com câmera sempre em movimento (push-in, plano fechado no rosto, pan),
cortes sincronizados com o índice de palavra da narração. Legenda do canal (1 palavra, minúscula,
branca com contorno preto, ~70% da altura). Tudo determinístico.

uso: python3 scripts/garota_popular/montar.py [--preview] [--stills]
"""
import argparse, json, math, os, re, subprocess, wave
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
EP = ROOT / "public" / "garota"
OUT = ROOT / "out" / "garota"
W, H, FPS = 1080, 1920, 30
AUDIO = EP / "narracao.mp3"

ap = argparse.ArgumentParser()
ap.add_argument("--preview", action="store_true", help="540x960, rápido")
ap.add_argument("--stills", action="store_true", help="só um frame do meio de cada plano")
ap.add_argument("--video", default="", help="vídeo animado mudo (render do Remotion): só aplica legenda + trilha/efeitos")
o = ap.parse_args()
OUT.mkdir(parents=True, exist_ok=True)

words = json.load(open(EP / "words.json", encoding="utf-8"))
scenes = json.load(open(EP / "cenas.json", encoding="utf-8"))
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(AUDIO)],
                           capture_output=True, text=True).stdout)
END = dur + 0.4
NF = int(round(END * FPS))

# ------------------------------------------------------------------ planos
# Enquadramentos por cena, relativos ao ponto de foco (fx, fy) da imagem:
# 0 = aberto com push-in lento; 1 = fechado no foco; 2 = médio com pan lateral passando pelo foco.
def framing(kind, fx, fy):
    if kind == 0:
        return dict(z0=1.0, z1=1.08, cx=(0.5, 0.5 + (fx - 0.5) * 0.3), cy=(0.5, 0.5 + (fy - 0.5) * 0.3))
    if kind == 1:
        return dict(z0=1.42, z1=1.52, cx=(fx, fx), cy=(fy + 0.01, fy))
    return dict(z0=1.22, z1=1.26, cx=(fx - 0.06, fx + 0.06), cy=(fy, fy))


shots = []
for i, sc in enumerate(scenes):
    t0 = 0.0 if i == 0 else words[sc["w"]]["start"] - 0.05
    t1 = END if i + 1 == len(scenes) else words[scenes[i + 1]["w"]]["start"] - 0.05
    f0, f1 = round(t0 * FPS), round(t1 * FPS)
    n = max(1, math.ceil((f1 - f0) / FPS / 1.3))
    cuts = [f0 + round((f1 - f0) * k / n) for k in range(n + 1)]
    fx, fy = sc.get("foco", (0.5, 0.45))
    for k in range(n):
        kind = (k + sc.get("ofs", 0)) % 3
        shots.append(dict(img=sc["id"], a=cuts[k], b=cuts[k + 1], punch=(k == 0 and sc.get("punch", False)), **framing(kind, fx, fy)))
shots[0].update(z0=1.35, z1=1.0, crash=True)  # crash zoom nos primeiros segundos

cache = {}


def src(name):
    if name not in cache:
        im = Image.open(EP / "img" / f"{name}.png").convert("RGB")
        # cobre 2x a saída (folga para zoom sem perder nitidez)
        s = max(2 * W / im.width, 2 * H / im.height)
        im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        cache.clear()
        cache[name] = im
    return cache[name]


def ease(x):
    return x * x * (3 - 2 * x)


def frame_of(f, ow, oh):
    sh = next(s for s in shots if s["a"] <= f < s["b"]) if f < shots[-1]["b"] else shots[-1]
    u = (f - sh["a"]) / max(1, sh["b"] - sh["a"] - 1)
    if sh.get("crash"):
        z = 1.0 + 0.35 * (1 - ease(min(1, (f - sh["a"]) / 12))) + 0.06 * u
    else:
        z = sh["z0"] + (sh["z1"] - sh["z0"]) * ease(u)
    cx = sh["cx"][0] + (sh["cx"][1] - sh["cx"][0]) * ease(u)
    cy = sh["cy"][0] + (sh["cy"][1] - sh["cy"][0]) * ease(u)
    dx = dy = 0.0
    if sh["punch"]:  # susto: zoom-soco + tremida curta (8 frames)
        k = f - sh["a"]
        z *= 1 + 0.12 * max(0, 1 - k / 6)
        if k < 8:
            amp = 0.012 * (1 - k / 8)
            dx, dy = amp * math.sin(k * 2.9), amp * math.cos(k * 3.7)
    im = src(sh["img"])
    iw, ih = im.size
    # janela 9:16 dentro da imagem
    bw = min(iw, ih * W / H) / z
    bh = bw * H / W
    x0 = min(max(cx * iw - bw / 2 + dx * iw, 0), iw - bw)
    y0 = min(max(cy * ih - bh / 2 + dy * ih, 0), ih - bh)
    return im.transform((ow, oh), Image.EXTENT, (x0, y0, x0 + bw, y0 + bh), Image.BICUBIC)


# ------------------------------------------------------------------ legenda (estilo do canal)
def ts(t):
    cs = int(round(max(t, 0) * 100))
    return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"


def captions(path, scale):
    y = 1350
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Word,Montserrat Black,100,&H00FFFFFF,&H00FFFFFF,&H00000000,&H78000000,-1,0,0,0,100,100,0,0,1,7,3,5,20,20,20,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lag = 1.3 / 30
    # junta "-feira" na palavra anterior
    ws = []
    for w in words:
        if w["word"].startswith("-") and ws:
            ws[-1] = dict(ws[-1], word=ws[-1]["word"] + w["word"], end=w["end"])
        else:
            ws.append(dict(w))
    lines = []
    for i, w in enumerate(ws):
        txt = re.sub(r"[^\w'\-]", "", w["word"]).strip("-")
        if not txt:
            continue
        txt = txt.lower()
        s = 0.0 if i == 0 else w["start"] + lag
        e = (ws[i + 1]["start"] + lag) if i + 1 < len(ws) else w["end"] + 0.5
        pop = r"{\fscx80\fscy80\t(0,100,\fscx100\fscy100)}"
        lines.append(f"Dialogue: 0,{ts(s)},{ts(e)},Word,,0,0,0,,{{\\pos(540,{y})}}{pop}{txt}")
    open(path, "w", encoding="utf-8").write(head + "\n".join(lines) + "\n")


# ------------------------------------------------------------------ som (trilha + efeitos sintetizados)
SR = 44100


def build_audio(path):
    n = int(END * SR)
    t = np.arange(n) / SR
    rng = np.random.default_rng(7)
    mus = np.zeros(n)
    bpm = 92
    beat = 60 / bpm
    # progressão leve e brincalhona (C - Am - F - G), 2 compassos por acorde
    prog = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]]
    hz = lambda m: 440 * 2 ** ((m - 69) / 12)
    bar = 4 * beat
    nb = int(END / bar) + 1
    for b in range(nb):
        ch = prog[(b // 2) % 4]
        t0 = b * bar
        i0 = int(t0 * SR)
        L = min(n - i0, int(bar * SR))
        if L <= 0:
            break
        tt = np.arange(L) / SR
        env = np.minimum(1, tt / 0.3) * np.minimum(1, (bar - tt) / 0.3)
        for m in ch:  # pad
            mus[i0:i0 + L] += 0.05 * env * (np.sin(2 * np.pi * hz(m) * tt) + 0.3 * np.sin(2 * np.pi * hz(m) * 2 * tt))
        mus[i0:i0 + L] += 0.07 * env * np.sin(2 * np.pi * hz(ch[0] - 12) * tt)  # baixo
        for k in range(8):  # pluck em colcheias (arpejo)
            m = ch[[0, 1, 2, 1, 0, 2, 1, 2][k]] + 12
            j0 = i0 + int(k * beat / 2 * SR)
            Lp = min(n - j0, int(0.45 * SR))
            if Lp <= 0:
                continue
            tp = np.arange(Lp) / SR
            mus[j0:j0 + Lp] += 0.045 * np.exp(-tp * 9) * np.sin(2 * np.pi * hz(m) * tp)
    # fade in/out
    mus *= np.minimum(1, t / 0.5) * np.minimum(1, (END - t) / 1.5)

    fx = np.zeros(n)

    def at(word_i, d=0.0):
        return words[word_i]["start"] + d

    def put(sig, sec, g=1.0):
        i0 = int(sec * SR)
        L = min(len(sig), n - i0)
        if L > 0:
            fx[i0:i0 + L] += g * sig[:L]

    def pop(f=900):
        tp = np.arange(int(0.12 * SR)) / SR
        return np.exp(-tp * 40) * np.sin(2 * np.pi * (f + 1400 * np.exp(-tp * 30)) * tp)

    def noise_burst(d, lo, hi, decay):
        x = rng.standard_normal(int(d * SR))
        X = np.fft.rfft(x)
        fr = np.fft.rfftfreq(len(x), 1 / SR)
        X[(fr < lo) | (fr > hi)] = 0
        x = np.fft.irfft(X, len(x))
        tp = np.arange(len(x)) / SR
        return x / (np.abs(x).max() + 1e-9) * np.exp(-tp * decay)

    def ding():
        tp = np.arange(int(1.0 * SR)) / SR
        return np.exp(-tp * 4) * (np.sin(2 * np.pi * 1318 * tp) + 0.5 * np.sin(2 * np.pi * 1976 * tp))

    def typing(d):
        out = np.zeros(int(d * SR))
        k = 0.0
        while k < d - 0.05:
            c = noise_burst(0.03, 2000, 7000, 160)
            i0 = int(k * SR)
            out[i0:i0 + len(c)] += 0.5 * c[: len(out) - i0]
            k += 0.07 + 0.08 * rng.random()
        return out

    put(typing(1.6), at(26), 0.25)                        # criei uma conta
    put(noise_burst(1.4, 1500, 6000, 1.5), at(31), 0.06)  # lápis no papel
    for k in range(3):                                    # três corações
        put(pop(900 + 250 * k), at(117) + 0.18 * k, 0.35)
    put(noise_burst(0.5, 300, 4000, 7), at(135), 0.5)     # engasguei (cuspe de suco)
    put(typing(1.2), at(154), 0.22)                       # fingir ser dono da conta
    put(pop(500), at(186), 0.3)                           # batata
    for k in range(4):                                    # "você é perfeito" corações
        put(pop(1100 + 150 * k), at(192) + 0.12 * k, 0.25)
    put(noise_burst(0.8, 100, 900, 4), at(197), 0.25)     # indignado (bufada)
    put(noise_burst(0.3, 3000, 9000, 10), at(271), 0.2)   # dezenas de desenhos (swish)
    put(ding(), at(324), 0.35)                            # FINALMENTE!

    st = np.stack([mus * 0.3 + fx, mus * 0.3 + fx])
    st = np.clip(st, -1, 1)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(SR)
        wf.writeframes((st.T * 32767).astype("<i2").tobytes())


# ------------------------------------------------------------------ render
if o.stills:
    d = OUT / "stills"; d.mkdir(exist_ok=True)
    for k, sh in enumerate(shots):
        frame_of((sh["a"] + sh["b"]) // 2, 540, 960).save(d / f"{k:02d}_{sh['img']}.jpg", quality=85)
    print(len(shots), "planos;", f"{len(shots) / (END / 60):.1f} cortes/min")
    raise SystemExit

ow, oh = (540, 960) if o.preview else (W, H)
ass = OUT / "legendas.ass"; captions(ass, 1)
bed = OUT / "trilha_fx.wav"; build_audio(bed)
mix = OUT / "mix.m4a"
# trilha abaixa sob a voz (sidechain) e tudo a -14 LUFS
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(AUDIO), "-i", str(bed), "-filter_complex",
                "[0:a]aformat=sample_rates=44100:channel_layouts=stereo,asplit=2[v][sc];"
                "[1:a][sc]sidechaincompress=threshold=0.05:ratio=3:attack=30:release=400[bd];"
                "[v][bd]amix=inputs=2:normalize=0:duration=longest,loudnorm=I=-14:TP=-1.5:LRA=11",
                "-c:a", "aac", "-b:a", "256k", str(mix)], check=True)

if o.video:
    out = OUT / "A_garota_popular_animado.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(Path(o.video).resolve()), "-i", str(mix), "-vf",
                    f"ass={ass.name}:fontsdir={os.path.expanduser('~/.fonts')}", "-map", "0:v", "-map", "1:a", "-c:v", "libx264",
                    "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-c:a", "copy", "-shortest", "-movflags", "+faststart",
                    str(out)], check=True, cwd=OUT)
    print("pronto:", out)
    raise SystemExit

name = "preview.mp4" if o.preview else "A_garota_popular.mp4"
vf = f"ass={ass.name}:fontsdir={os.path.expanduser('~/.fonts')}" + (",scale=540:960" if o.preview else "")
if o.preview:
    vf = f"scale=1080:1920,ass={ass.name}:fontsdir={os.path.expanduser('~/.fonts')},scale=540:960"
p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{ow}x{oh}", "-r", str(FPS),
                      "-i", "-", "-i", str(mix), "-vf", vf, "-c:v", "libx264", "-preset", "medium" if o.preview else "slow",
                      "-crf", "23" if o.preview else "17", "-pix_fmt", "yuv420p", "-c:a", "copy", "-shortest",
                      "-movflags", "+faststart", name], stdin=subprocess.PIPE, cwd=OUT)
for f in range(NF):
    p.stdin.write(frame_of(f, ow, oh).tobytes())
    if f % 300 == 0:
        print(f"{f}/{NF}", flush=True)
p.stdin.close(); p.wait()
print("pronto:", OUT / name, f"{len(shots)} planos, {len(shots) / (END / 60):.1f} cortes/min")
