#!/usr/bin/env python3
"""Lê ou altera o estado (pontos de controle) de um projeto.
Uso: estado.py <slug>                 mostra (campos: roteiro_auditado, narracao_entregue, audio_gerado, audio_aprovado, ...)
     estado.py <slug> <campo> true|false
'audio_aprovado' só deve ser marcado depois que o USUÁRIO aprovar o áudio na conversa."""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _comum import ler_estado, salvar_estado
if len(sys.argv) < 2:
    sys.exit(__doc__)
st = ler_estado(sys.argv[1])
if len(sys.argv) == 4:
    campo, val = sys.argv[2], sys.argv[3].lower() == "true"
    if campo == "audio_aprovado" and val and not st.get("audio_gerado"):
        sys.exit("Não há áudio gerado para aprovar.")
    if campo in ("storyboard_pronto", "producao_pronta") and val and not st.get("audio_aprovado"):
        sys.exit("Bloqueado: produção só depois do áudio aprovado.")
    st[campo] = val
    salvar_estado(sys.argv[1], st)
print(json.dumps(st, ensure_ascii=False, indent=1))
