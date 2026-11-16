---
name: edit-motion-render
description: "Constrói no Remotion as cenas aprovadas no plano (motion graphics, 3D, câmera virtual e legendas) e gera a prancha de stills para revisão. Use em /edit-motion-render, após a edit-motion-mapa; aceita trecho (\"só o gancho\", \"c05 a c09\")."
---

# edit-motion-render

Constrói cada cena aprovada em código e confere em stills. É a etapa mais longa. A câmera virtual é feita aqui, junto com as cenas. É o **ponto de revisão ②** (prancha de stills).

- **Lê:** bloco `cenas` do estado / `plano-cenas.md`, `public/<slug>/palavras.json`, perfil (`identidade.md`, `estilo-motion.md`, `estilo-camera.md`), `ferramentas/guias/oficio-motion.md`
- **Escreve:** `src/episodes/<slug>/` (`Video.tsx`, `scenes/*.tsx`), composição registrada em `src/Root.tsx` (id em PascalCase do slug), stills em `_CLAUDE/revisao/`, bloco `render` no estado (cena → arquivo, versão, eventos para o som)
- **Próximo passo:** `/edit-sfx`

Se a `motion_mapa` não estiver `concluido`, pare.

## Ofício (detalhes em `ferramentas/guias/oficio-motion.md`; o perfil manda quando contrariar)
- **Kit compartilhado** (reaproveitar, não recriar): `src/episodes/monetizacao/kit.tsx` — `useT`, `k/eo/eb/env`, `count`, `fmt/brl`, `At`, `Enter`, `Bg`, `Cam`, `Panel`, `Label`, `Big`, `Pill`, `Icon`, `PlayLogo`, `Coin`, `Bill`, `LineChart`, `Bars`, `Shock`, `Burst`, `Flash`, `SpeedLines`, `Toast`, `Progress`, `Illustrative`, `MoneyRain`, `CoinBurst`; 3D em `three.tsx` (`Coins3D`, `Play3D`); legendas em `Legendas.tsx`. Peça nova útil vai para o kit. (Quando houver um 2º vídeo, mover o kit para `src/kit/`.)
- **Tempo:** cenas usam o tempo global `T = frame/30` (segundos da narração); gatilhos entram no tempo exato da palavra.
- **Entradas** ~10–13 f (`expo.out`, herói com overshoot), saídas ~8 f, cascata de 2–4 f entre irmãos; contadores `expo.out`; nada linear exceto deriva de câmera e progresso.
- **Câmera:** push-in contínuo + punch nas revelações + tremida 6–10 f (`Cam hits`); aproximação e deriva em paralelo (sem "engasgar"); chegada na direção da saída anterior.
- **Movimento sempre:** fundo andando, painéis respirando, nada parado por mais de ~1 s; o último frame do vídeo ainda se move.
- **3D** (React Three Fiber via `ThreeCanvas`) só nos impactos: é a parte cara do render (swangle, sem GPU).
- **Legibilidade:** números 160–300 px; texto de interface ≥ 24 px; nada sob a legenda; área segura.
- **Determinismo:** `hash1`/`mulberry32` com seed; nunca `Math.random`/`Date.now`.
- Fonte: Montserrat Black + Montserrat UI 600–800 (`ensureEpisodeFonts`).

## Scripts
| Comando | Uso |
|---|---|
| `npm run typecheck` | sempre antes de renderizar |
| `node scripts/render-stills.mjs <Composicao> <frames…>` | stills de QC (≈3 s cada) em `out/stills/` |
| `ffmpeg … xstack` | prancha 2×N em 960×540 por quadro → `_CLAUDE/revisao/prancha_vNN.png` |

## Passo a passo
1. Status. Trecho pedido? Construa só as cenas que **começam** nele.
2. Construa cena a cena; `typecheck`.
3. **Stills:** 2 por cena (o momento do gatilho principal e ~0,3 s depois do herói). Abra **cada imagem** e confira: texto legível e não cortado, legenda sem cobrir nada, nada fora da área segura, vermelho só no YouTube, sem elemento sobreposto por engano, sem frame vazio. Corrija antes de mostrar.
4. Monte a prancha, envie a Welinton (SendUserFile, `display: render`) com uma linha por cena. Grave o bloco `render` com os eventos (id, t, tipo: whoosh/pop/impacto/contador/moeda/notificação/glitch/riser, força). Etapa `aguardando_aprovacao`.

## Revisão
- Por número ou tempo: "c04 números maiores", "0:47 entra atrasado". Ajustar só o citado, nova prancha `_vNN`.
- **Feedback geral** ("básico", "sem vida") = refazer a cena com nova direção dita numa frase, não retocar.
- Padrão que funcionou vira item do `catalogo.md` (proponha na aprovação). Anote aprendizados.
- Aprovado: `concluido`, commit, `/clear` + `/editar`.

## Regras comuns
Antes de começar, leia `.claude/skills/editar/regras-comuns.md` (uma vez por sessão).
