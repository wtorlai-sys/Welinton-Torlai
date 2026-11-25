#!/usr/bin/env python3
"""Cruza cada frase do roteiro com o tempo real em que ela é falada (base do storyboard).

Uso: marcar_tempos.py <slug>
Lê 03-narracao/narracao.txt (texto falado) e 03-narracao/timestamps.json (tempo por palavra do áudio real).
Grava 03-narracao/frases.json e imprime uma tabela: nº, início, fim, duração, frase, e as palavras-âncora
(verbos de ação/termos) com o instante exato, para cronometrar eventos visuais e legendas.
Alinhamento por sequência de palavras normalizadas (tolera erros da transcrição, números escritos de outro jeito).
"""
import sys, os, re, json, difflib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _comum import proj

slug = sys.argv[1] if len(sys.argv) > 1 else sys.exit(__doc__)
d = proj(slug) / "03-narracao"
texto = (d / "narracao.txt").read_text(encoding="utf-8").strip()
words = json.loads((d / "timestamps.json").read_text())["words"]
norm = lambda t: re.sub(r"[^\wà-úç]+", "", t.lower())

frases = [f.strip() for f in re.split(r"(?<=[.!?])\s+", texto) if f.strip()]
sw, owner = [], []
for i, f in enumerate(frases):
    for t in f.split():
        sw.append(norm(t)); owner.append(i)
aw = [norm(w["text"]) for w in words]
m = {}
for a, b, n in difflib.SequenceMatcher(None, sw, aw, autojunk=False).get_matching_blocks():
    for k in range(n):
        m[a + k] = b + k

out = []
for i, f in enumerate(frases):
    idx = [m[k] for k in range(len(sw)) if owner[k] == i and k in m]
    if not idx:
        out.append({"n": i + 1, "frase": f, "inicio": None, "fim": None}); continue
    ini, fim = words[min(idx)]["start"], words[max(idx)]["end"]
    out.append({"n": i + 1, "frase": f, "inicio": round(ini, 2), "fim": round(fim, 2),
                "palavras": [{"t": words[j]["text"], "s": words[j]["start"]} for j in sorted(idx)]})
# preenche frases sem âncora com o intervalo entre vizinhas
for i, o in enumerate(out):
    if o["inicio"] is None:
        o["inicio"] = out[i - 1]["fim"] if i else 0.0
        o["fim"] = next((x["inicio"] for x in out[i + 1:] if x["inicio"] is not None), words[-1]["end"])
(d / "frases.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
for o in out:
    print(f"{o['n']:3} {o['inicio']:7.2f}–{o['fim']:7.2f} ({o['fim']-o['inicio']:4.1f}s)  {o['frase']}")
