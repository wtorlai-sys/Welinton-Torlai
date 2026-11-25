#!/usr/bin/env python3
"""Mede a narração gerada e compara com as referências do formato.

Uso: medir_audio.py <slug>
Lê 03-narracao/narracao.(mp3|wav|m4a) (+ timestamps.json se existir) e grava 03-narracao/medicao.json.
Referências medidas: 193–213 palavras/min, 1ª palavra em 0,0 s, ≤ 10 pausas > 0,35 s, duração 140–165 s.
"""
import sys, os, json, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _comum import proj

slug = sys.argv[1] if len(sys.argv) > 1 else sys.exit(__doc__)
d = proj(slug) / "03-narracao"
mp3 = next((d / f"narracao{e}" for e in (".mp3", ".wav", ".m4a") if (d / f"narracao{e}").exists()), d / "narracao.mp3")
if not mp3.exists():
    sys.exit(f"Não existe {mp3}: nenhum áudio foi gerado.")
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(mp3)],
                           capture_output=True, text=True).stdout.strip())
lufs = subprocess.run(["ffmpeg", "-v", "info", "-i", str(mp3), "-af", "ebur128", "-f", "null", "-"],
                      capture_output=True, text=True).stderr
integ = [l.strip() for l in lufs.splitlines() if l.strip().startswith("I:")]
m = {"duracao_s": round(dur, 2), "loudness": integ[-1] if integ else None}
ts = d / "timestamps.json"
if ts.exists():
    w = json.loads(ts.read_text())["words"]
    fala = w[-1]["end"] - w[0]["start"]
    gaps = [(round(w[k + 1]["start"] - w[k]["end"], 2), w[k]["text"]) for k in range(len(w) - 1)]
    m.update({"palavras": len(w), "palavras_por_minuto": round(len(w) / fala * 60),
              "primeira_palavra_s": w[0]["start"], "silencio_final_s": round(dur - w[-1]["end"], 2),
              "pausas_acima_0_35s": [g for g in gaps if g[0] > 0.35]})
m["referencia"] = {"ppm": "193–213", "primeira_palavra_s": 0.0, "pausas_acima_0_35s": "≤ 10", "duracao_s": "140–165"}
(d / "medicao.json").write_text(json.dumps(m, ensure_ascii=False, indent=1))
print(json.dumps(m, ensure_ascii=False, indent=1))
