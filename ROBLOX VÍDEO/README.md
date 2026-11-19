# ROBLOX VÍDEO — memória do formato

Formato de Short vertical **animado em 3D com bonecos de blocos** (estilo avatar de jogo), narrado em
1ª pessoa, criado no episódio **"A garota popular"** (nov/2026). Use esta pasta como ponto de partida
de todo vídeo novo nesse estilo.

| Arquivo | O que tem |
| --- | --- |
| [`ROTEIRO.md`](./ROTEIRO.md) | Estrutura do roteiro (blocos, tempos, ritmo, frases-modelo) + template para preencher |
| [`ESTILO.md`](./ESTILO.md) | Estilo visual: personagens, expressões, poses, cenários, câmera, luz, legenda, som |
| [`PIPELINE.md`](./PIPELINE.md) | Passo a passo de produção, comandos, custos, tempo de render e lições aprendidas |

## Regras de ouro (o que o usuário pediu)
1. **Tem que ser ANIMAÇÃO.** Nada de "vídeo de foto" (imagem parada com zoom/corte). Personagens se
   mexem: andam, gesticulam, mudam de expressão, piscam, mexem a boca.
2. **Personagens são os do Customuse** (o Max já existe lá). O que precisar criar (cabelo, roupa,
   personagem novo) é feito no Customuse, em 3D, e depois recriado como boneco de blocos no código.
3. **Sem créditos? Reaproveite.** Narração, legenda, trilha/efeitos e recortes das imagens do Customuse
   (desenhos, telas, placas) viram texturas dentro do 3D. Animação por código não gasta crédito.
4. Tudo em **português do Brasil**, 9:16, 1080x1920, 30 fps.

## Episódio de referência
- Narração: `public/garota/narracao.mp3` (ElevenLabs, voz "Jonas – Dynamic Lively Friendly"), 1:56.
- Código: `src/episodes/garota/` (`Video.tsx`, `sets.tsx`, `cast.ts`) + `src/components/BlockyAvatar.tsx`.
- Montagem final (legenda + som): `scripts/garota_popular/montar.py --video <render mudo>`.
- Customuse: workflow "A garota popular" — https://customuse.com/workflow/bbb49a02-b803-4b99-bb35-93d62d7b7479
  (Max base: workflow "Max — base").
