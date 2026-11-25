# Viral Video Engine

Sistema de engenharia reversa (instruções em `CLAUDE.md`) de vídeos virais → formato → skill de produção (`construcaoviral`).

## Status das etapas
| Etapa | Situação | Arquivos |
|---|---|---|
| A — Inventário | ✅ concluída | `analysis/00-inventario.md`, `analysis/metodologia.md` |
| B — Engenharia reversa individual | ✅ concluída | `analysis/video-01-arranha-ceu.md`, `video-02-muro-de-arrimo.md`, `video-03-telhado.md` |
| C — Comparação | ✅ concluída | `analysis/comparacao-geral.md` |
| D — Formato | ✅ concluída | `FORMATO_IDENTIFICADO.md` (link para a skill) |
| E — Skill | ✅ `construcaoviral` | `.claude/skills/construcaoviral/` (link em `skills/`) |
| F — ElevenLabs | ⚠ integração pronta; chave salva é inválida (não começa com `sk_`) | `scripts/elevenlabs.py`, `references/elevenlabs.md` |
| G — Teste com tema novo | ✅ até a F4 (piscina); áudio bloqueado pela chave | `projects/piscina/`, `conhecimento/teste-da-skill-2026-11-25.md` |
| H — Validação dos pontos de aprovação | ✅ 9/9 testes | `conhecimento/teste-da-skill-2026-11-25.md` |

## Dados de apoio
- `analysis/dados/*.transcricao.txt` — transcrição com timestamps (Whisper medium + correções).
- `analysis/dados/metricas-movimento.json` — ritmo visual medido.
- `analysis/dados/contact-sheets/` — 1 frame por segundo de cada vídeo (+ 3 fps nos 10 s iniciais).

Os vídeos originais não estão no repositório (preservados fora dele, intactos).
