---
name: edit-preparar
description: "Transforma a narração em algo que o Claude lê: mede o áudio, transcreve com tempo por palavra (faster-whisper medium + large-v3), confere números, mapeia pausas e gera a transcrição por frase e as legendas em blocos. Use em /edit-preparar, após a edit-iniciar."
---

# edit-preparar

Entrega a base de tempo do vídeo inteiro. Não planeja cenas.

- **Lê:** `episodios/<slug>/audio/`, `_CLAUDE/briefing.md`
- **Escreve:** `public/<slug>/narracao.mp3` (cópia para o Remotion), `public/<slug>/palavras.json` (por palavra), `public/<slug>/legendas.json` (blocos), `_CLAUDE/frases.md` (uma frase por linha, com tempo e pausas), bloco `transcricao` no estado
- **Próximo passo:** `/edit-motion-mapa`

Se a `iniciar` não estiver `concluido`, pare e sugira terminá-la.

## Ofício
- **Medir o áudio** (ffprobe): duração exata, taxa, canais. A duração do vídeo = a da narração (`ceil(segundos × 30)` frames). Avise se passar da meta de ~1,5 min, mas não corte nada sem pedido.
- **Transcrição em duas leituras** (faster-whisper, CPU int8, `language="pt"`, `word_timestamps=True`, sem contexto inicial):
  - **medium** → os tempos de cada palavra (bateram com os ataques de energia do áudio a ±0,03 s);
  - **large-v3** → o texto, principalmente números e valores (o medium errou "entre 10 e 50 reais" → "R$ 10,50" e "mil e cinco mil" → "R$ 1,00 e R$ 5,00").
  - Divergência em número/valor: texto do large-v3, tempo do medium; **liste esses trechos para Welinton conferir**.
  - O faster-whisper não abre o MP3 direto nesta máquina (erro do `av`): converta antes com ffmpeg para PCM float32 16 kHz mono e passe o array.
- **Conferir o tempo:** detecte os ataques de fala depois de silêncios (energia RMS, janela 10 ms, limiar ~38 dB abaixo do pico) e compare com o início das frases; desvio > 0,15 s = alerta.
- **Conferir o que foi engolido:** trecho com energia e sem palavra → retranscrever só aquele trecho.
- **Briefing/roteiro** servem só para conferir a grafia. Nunca trocar o que foi falado.
- **Pausas:** mapear silêncios > 0,3 s (anotados em `frases.md`; viram respiros e trocas de cena no plano).
- **Legendas em blocos:** junta "R" "$" "5" ",00" → "R$ 5"; "mil visualizações" → "1.000 visualizações"; número + "mil"/"milhão" juntos; blocos de até 3 palavras, quebrando em pontuação ou pausa > 0,28 s; faixa "R$ x e R$ y" fica num bloco só; não termina bloco em palavra fraca (no, e, de, do, o, um…); bloco de 1 palavra fraca gruda no seguinte.

## Scripts
| Script | O que faz |
|---|---|
| `ferramentas/scripts/transcrever.py <audio> <saida> --modelo medium\|large-v3` | PCM 16 kHz via ffmpeg + faster-whisper; JSON `{segments, words}` |
| `ferramentas/scripts/conferir_transcricao.py` | compara medium × large-v3 (números), ataques de energia × frases, trechos engolidos |
| `ferramentas/scripts/legendas.py <palavras.json> <legendas.json> [--fix fixes.json]` | gera os blocos (generalizar `scripts/legendas_monetizacao.py`, que já funciona) |
| `ferramentas/scripts/frases.py` | `frases.md`: `mm:ss.ff  texto  [pausa 0,42 s]` |

Escreva o que faltar na primeira vez, teste no vídeo atual e reaproveite.

## Passo a passo
1. Status (`estado.py <pasta> status`).
2. Medir, transcrever (medium e large-v3 em segundo plano), conferir, corrigir números com um `fixes.json` por vídeo.
3. Gerar `palavras.json`, `legendas.json`, `frases.md`; gravar o bloco `transcricao` (caminhos, duração, frames, alertas).
4. **Resumo no chat:** duração, nº de frases, números conferidos (lista curta "ouvi X, escrevi Y"), alertas. Etapa `aguardando_aprovacao`.

## Revisão e aprovação
Welinton corrige uma palavra/número citando o tempo → ajustar no `fixes.json`, regenerar. Aprovado: `concluido`, commit, sugerir `/clear` + `/editar`.

## Regras comuns
Antes de começar, leia `.claude/skills/editar/regras-comuns.md` (uma vez por sessão).
