# Parabéns! Você construiu uma piscina — ENTREGA 5: Produção

Base temporal: `03-narracao/narracao.mp3` (163,11 s). Cenas e tempos: `04-storyboard.md` (#1–#51).
Formato de saída: 1080x1920, 30 fps → **4.894 frames**. Render final: `viral-video-engine/output/piscina.mp4`.

## Organização das cenas
| Ato | Cenas | Tempo | Locação | Função |
|---|---|---|---|---|
| Gancho + Porquê | 1–7 | 0,0–18,7 | quintal / corte do solo | lamaçal, 45 toneladas |
| Estrutura | 8–14 | 18,8–41,2 | quintal → obra → corte | lona falha → concreto armado |
| Vedação | 15–21 | 41,4–64,9 | macro / dentro da caixa | impermeabilização → revestimento |
| Água limpa | 22–36 | 65,7–114,2 | piscina / raio-X / subaquático | filtro, skimmer, ralo, cloro |
| Entorno | 37–41 | 114,2–131,8 | lateral / borda | casa de máquinas, borda atérmica |
| Re-gancho final | 42–47 | 132,6–151,1 | piscina / corte | piscina sai do chão → válvula |
| Fecho | 48–51 | 151,4–163,1 | montagem / quintal ao entardecer | acabamento, pulo, Parabéns, CTA |

Locações: 1 quintal fixo (a piscina nasce, cresce e termina no mesmo lugar) + vistas em corte/raio-X/subaquático do
mesmo objeto. Sem segunda locação.

## Caminho de produção
**A) Código — Remotion + React Three Fiber (recomendado)**, conforme `references/producao.md`:
- `src/construcaoviral/` reutilizável: `Mascote3D`, `MundoLowPoly` (quintal + casa), `Etiquetas` (pílula, rótulo
  amarelo, setas, cotas, ✓/✗, balão), `Rebobinar`, `Timelapse`, `Confete`, `CTAFinal`, `CorteTransversal`
  (seção do solo com camadas).
- `src/construcaoviral/episodios/piscina/`: uma `<Sequence>` por ato; tempos de evento em segundos copiados das
  âncoras do storyboard e convertidos com `Math.round(t * 30)`.
- Legendas: `Captions` existente lendo `projects/piscina/03-narracao/timestamps.json` (copiar para `public/timestamps/`).
- Determinismo: partículas (terra, confete, folhas, chuva) com seed; nada de `Math.random()`/`Date.now()`/`delta`.
- QC: stills em 4,0 · 17,0 · 24,6 · 40,7 · 52,6 · 69,3 · 83,8 · 93,1 · 99,6 · 108,6 · 121,0 · 131,4 · 140,2 · 150,3 · 157,4 · 161,0 s.

**B) Geradores externos** (se preferir IA): prompts abaixo. Textos, setas e legendas sempre na edição, nunca na imagem.

## Prompts de imagens (caminho B)
Bloco de estilo — **prefixar em todos**:
`low-poly 3D render, flat shading, bright saturated colors, soft sunlight with soft shadows, stylized suburban backyard with green lawn, single-story house with red roof, low-poly trees, simple blocky cartoon mascot (big head, yellow t-shirt, blue shorts, blue sneakers{HAT}), clean composition, vertical 9:16, no text, no letters`
`{HAT}` = `, yellow construction hard hat` a partir da cena 8 até a 48.

| # | Prompt da imagem (após o bloco de estilo) | Prompt de animação (imagem → vídeo, 3–5 s, sem cortes) |
|---|---|---|
| 1 | mascot digging a rectangular hole in the backyard lawn with a shovel, dirt chunks flying | fast time-lapse digging, hole grows, slow push-in |
| 2 | mascot filling the hole with a garden hose, inflatable unicorn float tossed in, mascot cheering | water level rising, float lands with a splash, camera pulls back |
| 3 | muddy collapsed hole, earth walls caved in, unicorn float sinking in mud, mascot stuck knee-deep | water drains into soil, walls slump inward, short camera shake |
| 4 | cross-section of the ground under the water-filled hole, blue water seeping into brown soil | camera descends below ground into cross-section, water spreads into soil |
| 5 | cross-section, soil around the hole darkened and soaked, side walls sliding inward | soaked soil darkens, walls slide in |
| 6 | top-down view of a rectangular pool outline in the lawn filled with translucent blue water | aerial, water fills the outline |
| 7 | huge translucent block of water sitting in the ground next to the tiny mascot for scale | slow low-angle orbit |
| 8 | mascot wearing hard hat unrolling a blue tarp over the hole | tarp drops and settles into the hole |
| 9 | cross-section: loose soil behind blue tarp, small pebble poking through the tarp, water jet leaking | soil slides, pebble pierces tarp, water spurts, float deflates |
| 10 | empty clean pit with steel rebar grid on floor and walls | rebar bars pop in sequence, crane-down camera |
| 11 | pit filled with grey concrete forming a single-piece box (floor and walls) | concrete pours and fills, settles |
| 12 | cross-section of concrete pool box full of water | water pressure pushes outward (walls flex slightly) |
| 13 | cross-section of empty concrete box with soil around it | soil pressure pushes inward |
| 14 | cross-section, steel bars inside the concrete wall glowing yellow | push-in on the wall, bars light up |
| 15 | macro of grey concrete surface with tiny pores and hairline cracks, water droplets passing through | droplets slowly seep through |
| 16 | inside the concrete box, mascot rolling a flexible blue-grey waterproof coating on the walls | coating spreads, wall flexes and coating stretches without tearing |
| 17 | inside the box fully coated with the waterproof layer | gentle orbit |
| 18 | close-up of mascot scrubbing the soft coating with a brush, coating tearing | brush strokes, tear opens |
| 19 | small light-blue ceramic tiles covering pool floor and walls | waves of tiles snap in place, time-lapse |
| 20 | aerial view of the finished tiled empty pool | slow aerial drift |
| 21 | cross-section showing three layers: concrete, waterproof coating, tiles; mascot scrubbing tiles | layers slide apart and back, mascot scrubs happily |
| 22 | full pool with leaves and dust, water turning green, unicorn float green and dirty | time-lapse day/night cycles, water turns green |
| 23 | x-ray view: pump next to pool pulling water through a pipe into a translucent sand filter tank, clean water returning | flow travels along pipe, particles trapped in sand |
| 24 | translucent sand filter tank close-up | push-in |
| 25 | single leaf floating on pool surface | leaf drifts and spins |
| 26 | rectangular skimmer opening in pool wall at waterline, leaves sucked in, cross-section of basket | leaves flow into opening, basket fills |
| 27 | skimmer opening close-up | small orbit |
| 28 | underwater view, dirt particles sinking to pool floor | camera dives underwater |
| 29 | underwater, drain at deepest point of pool floor with gentle swirl | swirl pulls particles into drain |
| 30 | underwater drain close-up | push-in |
| 31 | underwater, two floor drains side by side with domed covers | second drain appears, covers click on |
| 32 | underwater, a test-dummy wig's hair strand pulled toward a single uncovered drain, no person | hair strand pulled by suction (safe, symbolic) |
| 33 | magnified water droplet with cartoon bacteria and green algae | microscope-style zoom |
| 34 | mascot at pool edge pouring chlorine granules, colorful pH scale nearby | granules dissolve, organisms vanish, needle moves to middle |
| 35 | chlorine bucket close-up | push-in |
| 36 | mascot climbing out of the pool rubbing red irritated eyes (cartoon, comedic) | reaction, rubs eyes |
| 37 | side cross-section: small pump house next to the pool, pump below the water line, pipe full of water | lateral tracking, water line dashes appear |
| 38 | small pump house exterior | orbit |
| 39 | dark stone pool edge under strong sun with heat shimmer, mascot hopping, then slipping | hop on hot stone, then slip on wet stone |
| 40 | light-colored rough stone coping around the pool, cross-section showing outward slope with rain running to the lawn | stones snap in, rain runs off outward |
| 41 | mascot barefoot smiling on light stone edge | gentle push-in |
| 42 | empty pool, mascot inside with broom, sky turning dark grey, heavy rain | clouds roll in, rain starts |
| 43 | cross-section: groundwater rising around the empty concrete pool, pushing it up | water table rises, upward pressure |
| 44 | empty pool lifting and tilting out of the lawn like a boat, unicorn float flying, mascot clinging to the edge | pool pops up, camera shake |
| 45 | cross-section, small valve in the pool floor opening, groundwater flowing in | valve opens, water enters |
| 46 | cross-section, pool partially filled, heavy, settled in the ground | settle, stillness |
| 47 | valve close-up | push-in |
| 48 | (3 frames) ladder mounted on pool edge · underwater pool light turning on blue · clean unicorn float dropping into water | one action per frame, hard cuts |
| 49 | mascot taking off hard hat and jumping into the pool | jump and splash |
| 50 | finished pool at golden hour, pool light on, confetti | crane up to wide shot |
| 51 | wide static shot of finished backyard pool at dusk, empty space at top for text | static |

## Instruções de edição e transições
- **Câmera contínua**: no caminho A, um único rig de câmera interpolado entre as posições do storyboard; no B, encadear
  clipes por movimento (o fim de um clipe tem o mesmo enquadramento do início do próximo) ou por "puf"/◀◀.
- **◀◀ Rebobinar** (5,2 · 26,8 · 56,3 · 70,0 · 125,4 · 140,9 s): 0,8–1,0 s, imagem rodando ao contrário 3x, scanlines
  brancas horizontais, ícone ◀◀ branco no terço superior.
- **▶▶ Timelapse** (1 · 19 · 22 · 40): ícone amarelo no canto superior direito, imagem acelerada.
- **Cortes secos** só na cena 48 (montagem do acabamento).
- **Shake** de 6–10 frames em 4,58 · 24,62 · 139–140 s.
- **Clima**: chuva 132,6–147 s (céu cinza); entardecer a partir de 156,6 s.

## Legendas e palavras destacadas
- 1 palavra por vez, sincronizada por `timestamps.json`; branca, Montserrat ExtraBold/Black, contorno escuro + sombra,
  Title Case, centrada, ~64% da altura; subir para ~30% nas cenas marcadas ↑30% (4, 5, 9, 12, 15, 28, 37, 43).
- **Amarelo** (palavra da legenda): Lamaçal · Armado · Impermeabilização · Revestimento · Filtro · Skimmer ·
  Ralo/Fundo · Cloro · Máquinas · Atérmica · Hidrostática · Piscina (em "Você construiu uma piscina!").
- Rótulos amarelos inclinados presos à peça (texto completo): CONCRETO ARMADO · IMPERMEABILIZAÇÃO · REVESTIMENTO ·
  FILTRO · SKIMMER · RALO DE FUNDO · CLORO · CASA DE MÁQUINAS · BORDA ATÉRMICA · VÁLVULA HIDROSTÁTICA.
- Na transcrição a palavra "atérmica" pode estar como "térmica": **corrigir o texto da legenda no JSON** antes do render.

## Pílulas, setas e cotas
| Tempo | Elemento |
|---|---|
| 5,4–11,4 | 🔵 ÁGUA · ⚪ TERRA ENCHARCADA · setas azuis |
| 11,8–18,7 | cotas 8 m / 4 m · "45.000 L" amarelo · 🔴 45 TONELADAS + setas vermelhas |
| 18,8–20,7 | ⚪ LONA |
| 26,8–32,5 | ⚪ AÇO |
| 32,7–39,4 | 🔵 CHEIA (setas pra fora) · 🔴 VAZIA (setas pra dentro) · setas verdes ao segurar |
| 41,4–51,6 | 🔵 POROS · ⚪ CAMADA ELÁSTICA · setas ↔ |
| 53,7–56,3 | ✗ + balão "RASGOU!" |
| 60,8–64,9 | ⚪ AZULEJO / IMPERMEABILIZAÇÃO / CONCRETO · ✓ |
| 65,7–69,8 | 🔴 POUCOS DIAS |
| 70,0–74,6 | ⚪ AREIA · setas azuis de fluxo |
| 77,2–85,9 | ⚪ CESTO · ⚪ "COADEIRA" |
| 88,1–100,6 | setas azuis pro ralo · ⚪ 2 RALOS ✓ · 🔴 SUCÇÃO ✗ |
| 100,7–114,2 | 🔴 BACTÉRIA · 🔴 ALGA · ⚪ pH (régua) · 🔴 OLHO ARDENDO |
| 114,2–119,8 | linha 🔵 NÍVEL DA ÁGUA |
| 121,7–125,3 | 🔴 QUENTE |
| 136,2–146,8 | 🔵 ÁGUA DO CHÃO · setas azuis pra cima → pra dentro · ✓ |

## Efeitos sonoros (cue sheet, tempos reais)
| Tempo (s) | SFX | Nível |
|---|---|---|
| 0,3–1,8 | pás de terra aceleradas | médio |
| 2,0 / 3,0 | mangueira / plop da boia | baixo |
| 3,6–5,0 | desmoronamento + "glub" de lama | **alto** |
| 5,2 | rebobinar (fita) | médio |
| 10,3 | deslizamento de terra grave | médio |
| 17,0 | impacto grave de peso | médio |
| 18,8 / 19,5 | puf / lona | baixo |
| 24,6–26,0 | rasgo + jato d'água + boia murchando | alto |
| 26,8 | rebobinar | médio |
| 29,6 / 30,5 | clank de barras / concreto despejando | médio |
| 40,7 · 52,6 · 59,8 · 75,5 · 83,8 · 93,1 · 108,6 · 121,0 · 131,4 · 150,3 | "ding" do termo (mesmo som sempre) | baixo |
| 44,5 | gotejar | baixo |
| 49,3 | "boing" elástico | baixo |
| 55,9 | rasgo | médio |
| 56,3 / 57,5 | rebobinar / cliques de azulejo em sequência | médio |
| 66–69 | vento + folhas | baixo |
| 70,0 / 71 | rebobinar / motor de bomba | médio/baixo |
| 85,9 | mergulho (filtro passa-baixa até 100 s) | médio |
| 99,6 | sucção forte curta | médio |
| 104,5 | pó dissolvendo | baixo |
| 110 | "ai!" (efeito, sem voz) | baixo |
| 118 | motor ligando | baixo |
| 123,0 / 124,5 | "tsss" / escorregão + tombo | médio |
| 125,4 | rebobinar | médio |
| 135,0–147 | trovão + chuva contínua | médio→baixo |
| 136–139 | pressão grave crescendo | médio |
| 139,1–140,9 | estrondo de solo rachando | **alto** |
| 140,9 / 146,5 | rebobinar / "clac" da válvula + água entrando | médio |
| 151,7 · 152,6 · 154,4 | clank · "vum" · plop | médio |
| 155,7 | splash do pulo | médio |
| 156,6 | fanfarra curta + confete | médio |
Reaproveitar `scripts/gerar_sfx.py` (síntese por cue) e listar estes tempos como cues.

## Música
Trilha leve e positiva (pluck/marimba, ~110–120 BPM), contínua do 0 ao fim, **−18 a −22 dB abaixo da voz** com
ducking (sidechain) na voz. Sem música mais alta nos picos: os impactos ficam por conta dos SFX. Pode parar 0,3 s
no estrondo de 139 s e voltar. Sem trilha com letra.

## Mixagem e master
`scripts/mixar.sh` (ducking + loudness): voz 12–15 dB acima do fundo; master integrado **−14 LUFS**, true peak
≤ −1 dBTP. A voz entregue está em −24,7 LUFS: normalizar antes da mix.
