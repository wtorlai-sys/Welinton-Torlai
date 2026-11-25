#!/usr/bin/env python3
"""Acelera a narração do usuário até o ritmo do formato, sem mudar o tom da voz.

Uso: ajustar_ritmo.py <slug> [--alvo-ppm 200] [--pausa-max 0.25]

1. Lê 03-narracao/narracao-original.<ext> (nunca é alterado; se não existir, renomeia narracao.<ext> para ele).
2. Encurta silêncios internos mais longos que --pausa-max (detecção por energia, não por transcrição, para
   não cortar sílabas), mantendo --pausa-max de respiro com fade curto nas emendas.
3. Calcula o fator de velocidade que leva as palavras/min ao --alvo-ppm e aplica time-stretch com rubberband
   (preserva tom e formantes; cai para atempo se rubberband não existir).
4. Grava 03-narracao/narracao.mp3 e ajuste.json. Depois rode transcrever_audio.py (novos tempos) e medir_audio.py.
"""
import sys, os, json, subprocess, tempfile
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _comum import proj

if len(sys.argv) < 2:
    sys.exit(__doc__)
slug = sys.argv[1]
arg = lambda k, d: float(sys.argv[sys.argv.index(k) + 1]) if k in sys.argv else d
alvo, pmax = arg("--alvo-ppm", 200.0), arg("--pausa-max", 0.25)
d = proj(slug) / "03-narracao"
orig = next((p for p in d.glob("narracao-original.*")), None)
if orig is None:
    cur = next((d / f"narracao{e}" for e in (".mp3", ".wav", ".m4a") if (d / f"narracao{e}").exists()), None)
    if cur is None:
        sys.exit("Nenhum áudio do usuário no projeto.")
    orig = d / f"narracao-original{cur.suffix}"; cur.rename(orig)
ts = json.loads((d / "timestamps.json").read_text())["words"]
n_pal = len(ts)

SR = 44100
tmp = tempfile.mkdtemp()
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(orig), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                     capture_output=True, check=True).stdout
x = np.frombuffer(raw, np.float32).copy()
dur0 = len(x) / SR

# --- detecção de silêncio por energia (janelas de 10 ms) ---
hop = SR // 100
rms = np.sqrt(np.convolve(x ** 2, np.ones(hop) / hop, mode="same")[::hop] + 1e-12)
db = 20 * np.log10(rms + 1e-9)
limiar = np.percentile(db, 95) - 35           # 35 dB abaixo da fala forte
sil = db < limiar
cortes, k = [], 0
while k < len(sil):
    if sil[k]:
        j = k
        while j < len(sil) and sil[j]:
            j += 1
        a, b = k * hop, j * hop
        if a > 0 and b < len(x) and (b - a) / SR > pmax:      # só silêncios internos
            cortes.append((a, b))
        k = j
    else:
        k += 1
fade = int(0.01 * SR)
partes, pos, removido = [], 0, 0.0
for a, b in cortes:
    manter = int(pmax * SR)
    meio_a, meio_b = a + manter // 2, b - manter // 2
    seg = x[pos:meio_a].copy()
    seg[-fade:] *= np.linspace(1, 0, fade)
    partes.append(seg)
    nxt = x[meio_b:meio_b + fade].copy()
    x[meio_b:meio_b + fade] = nxt * np.linspace(0, 1, fade)
    removido += (meio_b - meio_a) / SR
    pos = meio_b
partes.append(x[pos:])
y = np.concatenate(partes)
dur1 = len(y) / SR

fala = ts[-1]["end"] - ts[0]["start"]
fala_pos = fala - removido
fator = max(1.0, (n_pal / fala_pos * 60 and alvo / (n_pal / fala_pos * 60)))
wav_in, wav_out = os.path.join(tmp, "in.wav"), os.path.join(tmp, "out.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", wav_in],
               input=y.astype(np.float32).tobytes(), check=True)
filtros = subprocess.run(["ffmpeg", "-hide_banner", "-filters"], capture_output=True, text=True).stdout
af = f"rubberband=tempo={fator:.4f}:pitch=1:formant=preserved:transients=crisp:detector=compound" \
    if " rubberband " in filtros else f"atempo={fator:.4f}"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav_in, "-af", af, "-c:a", "libmp3lame", "-b:a", "192k",
                str(d / "narracao.mp3")], check=True)
for p in d.glob("narracao.*"):
    if p.suffix != ".mp3" and p.suffix != ".txt":
        p.unlink()
dur2 = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                             str(d / "narracao.mp3")], capture_output=True, text=True).stdout)
info = {"original": orig.name, "duracao_original_s": round(dur0, 2), "silencios_encurtados": len(cortes),
        "tempo_removido_s": round(removido, 2), "duracao_apos_pausas_s": round(dur1, 2),
        "fator_velocidade": round(fator, 4), "filtro": af.split("=")[0], "duracao_final_s": round(dur2, 2),
        "ppm_estimado": round(n_pal / (fala_pos / fator) * 60), "alvo_ppm": alvo, "pausa_max_s": pmax}
(d / "ajuste.json").write_text(json.dumps(info, ensure_ascii=False, indent=1))
print(json.dumps(info, ensure_ascii=False, indent=1))
print(f"\nPróximo: transcrever_audio.py {slug} {d/'narracao.mp3'}  (novos tempos)  e  medir_audio.py {slug}")
