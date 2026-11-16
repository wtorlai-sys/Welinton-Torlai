---
name: edit-sfx
description: "Cria o som do vídeo: efeitos sonoros gerados por código (ou da pasta ferramentas/sons) alinhados às batidas das cenas, música eletrônica gerada por código e a mixagem com a voz (ducking, -14 LUFS); renderiza a prévia do gancho com som. Use em /edit-sfx, após a edit-motion-render."
---

# edit-sfx

O som entra por último, sobre as cenas travadas. Decide **onde** entra som, **qual** e **como se empilha**, gera a música e mixa. É o **ponto de revisão ③** (prévia do gancho com som).

- **Lê:** bloco `render` (eventos) e `cenas` (batidas) do estado, `public/<slug>/palavras.json`, perfil `estilo-som.md`, `ferramentas/sons/` (se existir)
- **Escreve:** `ferramentas/scripts/sfx_<slug>.json` → `public/<slug>/sfx.wav`, `public/<slug>/musica.wav`, `public/<slug>/mix.m4a`; bloco `sfx` no estado (ids `sfx01`…); prévia `_CLAUDE/revisao/previa_gancho_vNN.mp4`
- **Próximo passo:** `/edit-render`

Se a `motion_render` não estiver `concluido`, pare.

## Ofício
1. **O som segue o que se vê.** Evento visível pede som; o que não aparece, não.
2. **Um protagonista por momento**, no máximo 3 camadas (principal, grave só nos momentos fortes, apoio/doce agudo curto).
3. **Antecipação e resolução:** riser termina no evento e corta seco; ~0,5 s de respiro antes do maior impacto.
4. **Escalada:** o maior impacto do vídeo vai no ápice (ex.: a revelação do valor máximo); nada maior no resto.
5. **Sincronia:** transiente do impacto no frame do evento; **pico** do whoosh no frame da troca/chegada; pop, clique e ding começam no evento; tique de contador durante toda a contagem, acelerando junto.
6. **Material:** dinheiro → moedas/caixa registradora; interface → blips digitais; notificação → ding; virada/suspense → glitch, drone grave, batida de coração.
7. **Variação:** o mesmo som não se repete igual em ~20 s (variar tom, filtro, duração por seed).
8. **Música (gerada por código):** eletrônica/tech ~120–125 BPM (kick, hi-hat, baixo, pad, arpejo), começa no frame 0, **cai/corta (tape stop) na virada de suspense** e volta na cena seguinte; final com fecho, sem cortar no meio do compasso se possível. Faixa enviada por Welinton substitui.
9. **Níveis:** voz é a referência; música ~-18 a -22 dB abaixo, com ducking pela voz (sidechain); SFX ~-8 a -12 dB abaixo da voz; master `loudnorm I=-14:TP=-1.5:LRA=11`.

## Scripts
| Script | O que faz |
|---|---|
| `ferramentas/scripts/sintese.py` | biblioteca de sons por código (numpy, seed fixa): whoosh, pop, tique, blip, ding, moeda, caixa registradora, impacto+sub, riser, glitch, tape stop, coração; base em `scripts/gerar_sfx.py` (já funciona) |
| `ferramentas/scripts/sfx.py <cues.json>` | coloca cada som pelo pico/início no tempo do evento, sem repetir igual; gera `sfx.wav` |
| `ferramentas/scripts/musica.py <slug> --bpm 124 --quebras t1,t2` | trilha por código com as quebras → `musica.wav` |
| `ferramentas/scripts/mixar.py` | voz + música (ducking) + sfx → `mix.m4a` a -14 LUFS (base: `scripts/mixar.sh`) |

## Passo a passo
1. Status. Liste os eventos (do bloco `render`) com a palavra dita no instante.
2. Escreva o rascunho de cues (`sfxNN`: evento, camada, som, alinhamento pico|início, ganho).
3. Gere sfx, música e mix; meça a loudness (`ffmpeg -af ebur128`) e confira que a voz domina.
4. Renderize a **prévia do gancho** (primeiros ~10 s) com o mix: `npx remotion render <Comp> <saida> --frames=0-299` com o áudio do mix. Envie a Welinton com a lista curta dos sons. Etapa `aguardando_aprovacao`.

## Revisão
Por número ou tempo: "sfx12 mais baixo" (−3 dB), "sfx05 tira", "troca o sfx07", "sfx03 um frame antes", "música mais baixa". Ajustar, nova versão. Anotar aprendizados (níveis preferidos vão para `estilo-som.md` na aplicação). Aprovado: `concluido`, commit, `/clear` + `/editar`.

## Regras comuns
Antes de começar, leia `.claude/skills/editar/regras-comuns.md` (uma vez por sessão).
