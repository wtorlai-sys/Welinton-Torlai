---
name: edit-render
description: "Renderiza o vídeo final em 1920×1080 com as cenas, legendas e o áudio mixado, confere a qualidade (duração, sincronia, volume, frames) e entrega em FINAL/ como nova versão. Use em /edit-render, após a edit-sfx."
---

# edit-render

Monta e exporta o MP4 final e confere antes de entregar. É o **ponto de revisão ④** (vídeo final).

- **Lê:** composição `src/episodes/<slug>/Video.tsx`, `public/<slug>/mix.m4a`, estado
- **Escreve:** `episodios/<slug>/FINAL/<slug>_vNN.mp4` (nunca sobrescreve), `_CLAUDE/revisao/qc_vNN.png`, bloco `entregas` no estado
- **Próximo passo:** fim do fluxo (ou revisões)

Se a `sfx` não estiver `concluido`, pare.

## Passo a passo
1. Status. Próxima versão = maior `_vNN` existente + 1.
2. `npm run typecheck`.
3. **Render do vídeo mudo** em segundo plano: `npx remotion render <Comp> out/<slug>_mudo.mp4 --muted` (H.264 CRF 17, yuv420p, `remotion.config.ts`). Sem GPU, cenas 3D são o gargalo; se passar de ~30 min, renderize por partes (`--frames=a-b`) e junte com `ffmpeg -f concat -c copy`.
4. **Juntar o áudio:** `ffmpeg -i mudo.mp4 -i mix.m4a -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -ar 48000 -movflags +faststart FINAL/<slug>_vNN.mp4`.
5. **Conferir (QC), tudo antes de entregar:**
   - ffprobe: 1920×1080, 30 fps, nº de frames = `ceil(duração da narração × 30)`, duração do áudio = do vídeo (±1 frame);
   - loudness integrada ≈ -14 LUFS, pico ≤ -1,5 dBTP;
   - prancha de 12 quadros espaçados (`ffmpeg -vf "fps=…,scale=480:-1,tile=4x3"`) aberta e olhada: nenhum quadro preto/vazio, legenda presente, nada cortado;
   - sincronia: 3 gatilhos conferidos (quadro no tempo da palavra mostra o elemento).
6. Entregar: enviar o MP4 a Welinton (SendUserFile) + 3–4 linhas (duração, versão, o que mudou). Arquivo > 90 MB não vai para o git; o resto sim (commit + push). Etapa `aguardando_aprovacao`.

## Revisão
Welinton cita o tempo ou a cena ("1:12 legenda cobre o número", "c09 mais rápida"). Agrupe vários pedidos antes de renderizar de novo; cada rodada = nova versão. Correção de cena volta para a edit-motion-render; de som, para a edit-sfx (só o trecho citado). Anote aprendizados.

## Aprovação
`concluido` no estado, dizer quantos aprendizados ficaram no caderno e sugerir `/editar aprendizados` quando juntar alguns.

## Regras comuns
Antes de começar, leia `.claude/skills/editar/regras-comuns.md` (uma vez por sessão).
