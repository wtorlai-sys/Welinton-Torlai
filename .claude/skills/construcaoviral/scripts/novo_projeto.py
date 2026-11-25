#!/usr/bin/env python3
"""Cria viral-video-engine/projects/<slug>/ com os modelos das 6 entregas e estado.json.
Uso: novo_projeto.py <slug> "<Título>" """
import sys, os, json
import datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _comum import PROJ, TEMPLATES
if len(sys.argv) < 3:
    sys.exit(__doc__)
slug, titulo = sys.argv[1], sys.argv[2]
d = PROJ / slug
if d.exists():
    sys.exit(f"Já existe: {d}")
(d / "03-narracao").mkdir(parents=True)
for t in sorted(TEMPLATES.glob("*.md")):
    (d / t.name).write_text(t.read_text(encoding="utf-8").replace("{{TITULO}}", titulo), encoding="utf-8")
estado = {"slug": slug, "titulo": titulo, "criado_em": datetime.date.today().isoformat(),
          "ideia_escolhida": False, "roteiro_auditado": False, "audio_gerado": False,
          "audio_aprovado": False, "storyboard_pronto": False, "producao_pronta": False, "auditoria_final": False}
(d / "estado.json").write_text(json.dumps(estado, ensure_ascii=False, indent=1))
print(f"Criado {d}")
for f in sorted(d.rglob("*")):
    print("  ", f.relative_to(d))
