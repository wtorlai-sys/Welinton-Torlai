# STYLE GUIDE — Shorts "E se…?"

> Regra de ouro: **toda cena, componente e render deste repositório segue este guia.**
> Personagens **2D** desenhados (cabeça creme redonda, corpo em cápsula colorida, braços e pernas
> de traço preto, contorno grosso) dentro de cenários **3D** iluminados (sol, janelas, lâmpadas).
> Stack: Remotion + React Three Fiber (`@remotion/three`), narração ElevenLabs/MiniMax.

---

## 1. Formato
- 1080x1920, 30 fps, 9:16. Render final em H.264 com CRF 16-18 (sem artefatos de compressão).
- Nunca usar interpolação de frames. Cada frame é renderizado de forma determinística pelo Remotion (sem `Math.random` sem seed, sem `Date.now`; tudo dirigido por `useCurrentFrame()`).
- Área segura: nada importante nos 12% de baixo e 8% de cima (UI do Shorts/TikTok) nem nos 10% da direita (botões).

## 2. Personagem — DESENHO 2D dentro do cenário 3D
> O personagem é **2D** (traço vetorial chapado, como desenho animado). O cenário e os objetos são **3D**.
> Referência visual: desenho 2D com contorno grosso composto num set 3D iluminado (luz, sombra, profundidade).

- Construído em SVG (`src/components/Character2D.tsx`) e convertido em geometria vetorial dentro da cena:
  nítido em qualquer zoom, sem textura pixelada, determinístico.
- O plano do desenho fica sempre virado para a câmera (billboard vertical). Deitado = desenho girado/deitado na cama.
- Cabeça: círculo **creme** (#F6EEDD) com contorno preto grosso; leve meia-lua de sombra no lado oposto à luz.
- Corpo: cápsula/oval na cor da roupa, cor chapada + meia-lua de sombra no lado oposto à luz (2 tons).
- Braços e pernas: traços pretos (#1A1414) com cotovelo/joelho; mãos e pés pequenos.
- Contorno preto grosso em TUDO (cabeça, corpo, chapéu, roupa).
- Rosto expressivo desenhado: pupilas, sobrancelhas grossas, boca com dentes quando for o caso, bigode/cabelo.
  Expressões: neutro, deboche, feliz, susto, bravo, dormindo, sinistro.
- Identidade por chapéu/cabelo/roupa + detalhes de figurino (gravata, cinto, distintivo, botões, colete).
  Elenco recorrente com visual fixo em `src/characters.ts`.
- Integração com a luz da cena: `tint` (cor da luz ambiente da cena) multiplica o desenho e `light` define de
  que lado vem a luz (a sombra do desenho vai para o outro lado). Noite = tint azulado; abajur = lado quente.
- SEMPRE sombra no chão (elipse suave sob os pés) — nunca flutuando. Projeta sombra do sol/lâmpada no cenário
  via "sombra-proxy" (silhueta invisível virada para a luz).

## 3. Cores
- Paleta base: verde grama saturado, azul céu, campo dourado/bege, asfalto cinza-azulado.
- Vermelho (#E63B2E aprox.) é cor de DESTAQUE: só onde está a piada/foco (placa, boné, veículo-chave). Não espalhar vermelho no cenário.
- Roupas em cores complementares ao vermelho/verde (turquesa, amarelo, azul).
- Leve color grade final: contraste +, saturação +10%, sombras levemente azuis, luzes quentes.

## 4. Luz
- `DirectionalLight` forte e quente (sol), lateral/baixo para gerar sombras longas. Sombras suaves (PCFSoft, shadow map 2048+), bias ajustado sem acne.
- Fill: HDRI de céu (environment) + `HemisphereLight` azul/verde.
- `fog` com cor do horizonte para profundidade atmosférica no fundo.
- Cenas de noite/entardecer: fundo dessaturado azulado + objetos emissivos (lâmpadas) com Bloom (postprocessing), faíscas como partículas.

## 5. Cenário
- Materiais `MeshStandardMaterial` (semi-realista) — contraste proposital com o personagem toon.
- Árvores: copa low-poly sólida em massas (sem cartões de folha planos que tremem/aliasing). Tronco com textura de casca.
- Grama: instanced mesh de lâminas perto da câmera, textura simples no fundo.
- Texturas sem repetição visível: usar variação (noise de escala grande, ou triplanar com 2 escalas). Proibido padrão de tiling evidente.
- Objetos de cenário que CONTAM A PIADA sozinhos (placas, contadores "Days since last…", setas, letreiros). Toda cena precisa de pelo menos 1 elemento-gag.
- Texto de placas: alto contraste, fonte grossa, legível em 0,5 s no celular. Nunca texto lavado/estourado pelo bloom.

## 6. Câmera
- Altura padrão 1-1,5 m (nível do personagem), lente grande-angular (FOV 50-60 vertical).
- Usar linhas guia (estrada, cerca) apontando para o ponto de fuga/assunto.
- Assunto na coluna central (formato vertical).
- Repertório de planos: aberto de estabelecimento, aéreo/drone simétrico para revelar escala ou ironia, médio do personagem, close de reação, contraplano.
- Movimentos suaves com easing (push-in lento, órbita leve). Shake de câmera curto (6-10 frames) em impactos.
- Corte a cada 1,5-3 s.

## 7. Ação e impacto
- Batidas/impactos com: deformação visível, detritos, vidro, poeira/fumaça, faíscas, shake de câmera e SFX sincronizado.
- Antecipação → ação → reação (personagem reage com expressão depois do impacto).

## 8. Legendas
- Palavra por vez, sincronizada com os timestamps da narração (JSON word-level do ElevenLabs).
- Fonte heavy arredondada (ex.: "Montserrat Black" ou "Luckiest Guy"), branca, contorno preto 8-10 px + sombra.
- Posição padrão ~65% da altura, MAS com prop por cena (`captionY`) para desviar do ponto focal. A legenda NUNCA cobre a ação principal (carro batendo, rosto, placa).
- Pop-in de escala 0.8→1.0 em 3 frames.

## 9. Roteiro/estrutura
- Primeiro frame já tem ação + primeira palavra da legenda (vira a thumbnail).
- Estrutura: gancho (0-2 s) → ironia/contexto → escalada → virada/punchline.
- Personagem principal reage com cara impassível/deboche ao caos.
- Ensina 1 fato real (ciência/psicologia) embrulhado em humor.

---

## 10. VALORES DE REFERÊNCIA
Padrão para todo vídeo. Mude só o necessário para o clima do tema (ex.: noite, chuva, deserto).

### Cores
- Céu: #6FA8DC (topo) → #DCE9F5 (horizonte)
- Vegetação: #5DA130 / #8CC63F | Terra/campo: #D9B86C | Asfalto/chão urbano: #4A4F5A
- Destaque da piada: #E63B2E (só 1 ponto por cena)
- Roupas: #2BA59B, #F2C230, #3A6FD8, #E8E8E8
- Personagem (2D): cabeça creme #F6EEDD, membros e contorno #1A1414
- Noite: fundo #2B3550, emissivos #FFD27A

### Luz e sombras
- Sol: luz direcional quente #FFF1D6, intensidade ~3, elevação 25–40°, vindo de 45° lateral
- Preenchimento: hemisfério céu #BFD9FF / chão #6B8E4E, intensidade ~0.6
- Sombras: shadow map 2048–4096, PCFSoft, raio suave 2–4, bias -0.0005
- Sombra de contato sob personagens: opacidade 0.5, blur 2.5
- Névoa: cor do horizonte, começa a ~30 m, some a ~200 m
- Noite: sol a 10%, ambiente azulado, bloom intensidade 1.2, threshold 0.8

### Câmera
- Altura padrão: 1,2 m | FOV vertical 55°
- Estabelecimento: 3–4 m de altura, assunto a 10–15 m
- Aéreo de revelação: 40–80 m, olhando para baixo a 60–90°, simétrico
- Médio: 1,2 m de altura, personagem a 3–4 m
- Close de reação: 1,0 m, rosto ocupando 40% do quadro, FOV 40°
- Movimentos: push-in de 5–10% em 2 s com easing; órbita até 15°
- Tremida no impacto: 6–10 frames, amplitude 0.05–0.1

### Personagem (2D)
- Altura total 1,0 m (a cabeça é 35% disso)
- Contorno: ~2,2 cm num personagem de 1 m (≈ 6% do diâmetro da cabeça) — traço grosso de desenho animado
- 2 tons por cor (base + meia-lua de sombra no lado oposto à luz)

### Legenda
- Fonte 90–110 px, contorno 8–10 px preto, sombra 4 px
- Altura padrão: 65% da tela (subir para 30% se a ação estiver embaixo)

### Notas de implementação destes valores
- **PCFSoft**: o three.js r187 (versão do projeto) removeu o `PCFSoftShadowMap` — ele cai para
  `PCFShadowMap`, que agora já faz filtragem suave controlada por `shadow.radius`. Usar PCF + raio 2–4.
- **Bloom threshold 0.8**: vale sobre a imagem já em faixa 0–1. Para a cabeça branca, placas e
  legendas não estourarem, o bloom é seletivo (só objetos emissivos), nunca global.
- **Personagem 2D (nov/2026)**: substitui o personagem 3D (esfera/cápsula/inverted hull). O componente 3D antigo
  (`Character.tsx`) fica só como legado; cenas novas usam `Character2D`.
- **Close com FOV 40°**: exceção consciente ao FOV 50–60 da §6 — só no close de reação.

---

## Checklist de aprovação (rodar em TODO still/render antes de entregar)
- [ ] Personagem tem sombra de contato e não flutua
- [ ] Personagem é desenho 2D com contorno preto grosso, integrado à luz da cena (tint/sombra)
- [ ] Nenhuma textura com repetição visível
- [ ] Árvore sem cartões de folha/aliasing
- [ ] Texto da placa legível
- [ ] Legenda não cobre a ação
- [ ] Vermelho só no ponto de foco
- [ ] Nada importante fora da área segura

---

## Como as regras estão implementadas (onde mexer)

| Regra | Implementação |
|---|---|
| Formato 1080x1920 / 30 fps | `src/style/constants.ts` (`VIDEO`), `src/Root.tsx` |
| CRF 16-18, H.264 | `remotion.config.ts` (`setCrf(17)`, `setCodec('h264')`) |
| Determinismo | `src/style/random.ts` (`mulberry32`, `seeded`) — nunca `Math.random`/`Date.now` |
| Área segura | `SAFE` em `src/style/constants.ts` + `<SafeAreaGuides/>` para QC |
| Materiais toon / outline / cabeça / cenário | `src/style/materials.ts` |
| Personagem (2D) | `src/components/Character2D.tsx`; elenco fixo em `src/characters.ts` |
| Paleta e vermelho de destaque | `PALETTE` em `src/style/constants.ts` (`PALETTE.accent` é o ÚNICO vermelho) |
| Luz dia / entardecer-noite + bloom + color grade | `src/components/Lighting.tsx` |
| Legendas | `src/components/Captions.tsx` + `src/lib/timestamps.ts` |
| Câmera | `src/components/CameraRig.tsx` |
| Cenário | `src/components/scenery/` |

### Regras técnicas derivadas
- Valores animados são calculados no corpo do componente a partir de `useCurrentFrame()`
  (nunca em `useFrame` com `delta`). Uniforms de shader recebem `frame / fps`.
- Tone mapping = só o "ombro" do Khronos PBR Neutral (comprime acima de 0.8), dentro do
  color grade. O Neutral completo subtrai 0.04 das cores escuras e deixa o asfalto azul-marinho.
  A cabeça usa branco "HDR" (`HEAD_WHITE`) para sair branca depois da compressão.
- Bloom SELETIVO: só o que estiver dentro de `<Glow>` (lâmpadas, faróis, faíscas) brilha.
  Cabeça, placas e legendas nunca estouram.
- As cores da §10 são cores de TELA. Se uma superfície não bater com a referência no still,
  ajuste `ALBEDO_GAIN` em `materials.ts` (calibrado medindo pixels), não a paleta.
- Placas usam `CanvasTexture` com a fonte Montserrat Black carregada antes do desenho
  (`src/style/fonts.ts`), `anisotropy` alto e mipmaps.
- Texturas de cenário são procedurais em coordenadas de mundo (noise em 2 escalas),
  então não existe tile para repetir.
- Árvores: copas são icosaedros sólidos `flatShading`, nunca planos com alpha.
