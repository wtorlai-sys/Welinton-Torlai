# Pipeline de produção

## Passo a passo
1. **Narração** (o usuário manda o MP3 do ElevenLabs). Copiar para `public/<ep>/narracao.mp3`.
2. **Timestamps por palavra** com faster-whisper (modelo `medium`, `language="pt"`).
   O PyAV do ambiente quebra no `open()` — converter antes para PCM e passar o array:
   ```bash
   ffmpeg -i narracao.mp3 -ar 16000 -ac 1 -f f32le a.raw
   # python: a = np.fromfile('a.raw', np.float32); model.transcribe(a, language='pt', word_timestamps=True)
   ```
   Salvar `public/<ep>/words.json` e gerar `src/episodes/<ep>/words.ts` (import síncrono).
3. **Personagens no Customuse** (só os que faltam): `nanoBanana2Edit` 1K com a imagem do Max como
   referência de estilo ("same blocky avatar 3D render style… NEW original character"), fundo cinza, A-pose.
   Depois recriar em `cast.ts` (cores de pele, roupa, cabelo, olhos).
4. **Recortes para textura 3D** das imagens do Customuse (desenhos, telas, placas) em `public/<ep>/tex/`
   — pré-carregar todas com `preloadTextures()` antes do 1º frame (senão saem pretas).
5. **Roteiro de planos** em `Video.tsx`: cada plano começa num índice de palavra `w(i)`, tem luz, foco,
   1–2 câmeras e uma `Scene` com personagens animados pelo tempo `T`.
6. **QC por stills** (um frame do meio de cada plano), montar contact sheet e olhar TODOS:
   ```bash
   node scripts/render-stills.mjs <Composição> <frames...>
   ```
   Conferir: câmera não tapada por cabeça/cabelo, rosto não cortado, ninguém preto/esverdeado,
   texturas aparecendo, figurante não passando na frente da câmera, legenda livre.
7. **Render mudo** (em segundo plano):
   ```bash
   npx remotion render <Composição> out/<ep>/anim_mudo.mp4 --muted
   ```
8. **Legenda + trilha + efeitos + loudness**:
   ```bash
   python3 scripts/garota_popular/montar.py --video out/<ep>/anim_mudo.mp4
   ```
   (para outro episódio: copiar o script e trocar `EP`, `cenas.json` e os cues de efeito.)
9. **QA final**: 1080x1920, H.264, duração = narração + 0,4 s, -14 LUFS, sem silêncio; contact sheet.
10. **Capa**: frame mais expressivo + título de 2–4 palavras em português (branco, contorno preto).
11. Commit + push no branch da sessão; enviar o MP4 ao usuário.

## Custos e tempos (referência)
| Item | Valor |
| --- | --- |
| Customuse imagem `nanoBanana2Edit` 1K | 11 créditos (2K = 16) |
| Customuse vídeo (Kling/Seedance) | bem mais caro — só se o usuário tiver créditos |
| Render 3D em CPU (swangle, 4 núcleos) | ~23 frames/min → ~2,5 h para 1:56 |
| Still de QC | ~6 s cada |

## Lições aprendidas
- **"Vídeo de foto" foi rejeitado.** Imagens paradas com Ken Burns não servem; o usuário quer animação.
- Lotes grandes no Customuse (30 nós) travaram em "generating" sem cobrar: relançar com
  `customuse_run_nodes` em **lotes de ~6**.
- O filtro de conteúdo barrou "the most popular girl… 14 years old… skirt, knee socks": descrever
  personagem jovem de forma neutra (moletom, jeans, "cheerful classmate").
- Câmera perto demais no 9:16 é o erro nº 1 — sempre passar pelo `fixDist`.
- Noite sem luz de preenchimento = bonecos pretos. Externa com rebatimento verde = pele oliva.
- Over-the-shoulder: câmera alta e bem de lado; conferir a linha câmera→alvo contra os outros bonecos.
- Pose de punho/mão na frente do rosto em close tapa a expressão — erguer o braço para o lado.
