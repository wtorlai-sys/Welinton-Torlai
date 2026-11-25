# Viral Video Engine

Sistema de engenharia reversa de vídeos virais → formato → skill de produção (`construcao-viral`).

## Status das etapas
| Etapa | Situação | Arquivos |
|---|---|---|
| A — Inventário | ✅ concluída | `analysis/00-inventario.md`, `analysis/metodologia.md` |
| B — Engenharia reversa individual | ✅ concluída | `analysis/video-01-arranha-ceu.md`, `video-02-muro-de-arrimo.md`, `video-03-telhado.md` |
| C — Comparação | ✅ concluída | `analysis/comparacao-geral.md` |
| D — Formato | ✅ concluída (aguardando revisão do usuário) | `FORMATO_IDENTIFICADO.md` |
| E — Skill | ⏸ aguardando aprovação das descobertas | — |
| F — ElevenLabs | ⏸ | — |
| G — Teste com tema novo | ⏸ | — |
| H — Validação dos pontos de aprovação | ⏸ | — |

## Dados de apoio
- `analysis/dados/*.transcricao.txt` — transcrição com timestamps (Whisper medium + correções).
- `analysis/dados/metricas-movimento.json` — ritmo visual medido.
- `analysis/dados/contact-sheets/` — 1 frame por segundo de cada vídeo (+ 3 fps nos 10 s iniciais).

Os vídeos originais não estão no repositório (preservados fora dele, intactos).
