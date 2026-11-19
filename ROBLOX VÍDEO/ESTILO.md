# Estilo visual — animação 3D de bonecos de blocos

> Exceção consciente ao STYLE_GUIDE.md (que pede personagem 2D): neste formato o usuário pediu
> personagens 3D de blocos vindos do Customuse. O resto do STYLE_GUIDE (determinismo, área segura,
> legenda sem cobrir a ação, luz e bloom seletivo) continua valendo.

## Personagens (`src/components/BlockyAvatar.tsx` + `src/episodes/garota/cast.ts`)
Boneco de blocos ~1,05 m: cabeça cúbica arredondada, tronco, braços e pernas que giram no ombro e no
quadril (sem cotovelo/joelho), sapatos com sola, sombra de contato. Rosto é textura desenhada em canvas
(olhos grandes com brilho, sobrancelhas grossas, boca) — troca por frame.

| Personagem | Visual fixo (do Customuse) |
| --- | --- |
| **Max** (narrador) | moletom vermelho com capuz e bolso, gola branca, calça cargo grafite, tênis vermelho/branco, cabelo castanho bagunçado em blocos, olhos castanhos |
| **Irmão** (mais velho, mais alto) | jaqueta college verde com mangas brancas, camiseta cinza, jeans claro, tênis branco, topete castanho |
| **Garota popular** | moletom lilás com capuz, jeans claro, tênis rosa, cabelo loiro longo ondulado em blocos, presilha de coração rosa, olhos verde-água com cílios, bochechas rosadas |
| Figurantes | `extra(i)` em `cast.ts`: cores/cabelos variados, determinísticos |

- **Expressões:** neutro, feliz, convencido, susto, bravo (rosto avermelhado), nervoso, apaixonado
  (olhos ^^ + blush), riso, vazio (olhos de ponto), determinado, piscando, curioso, envergonhado, chocado.
- **Boca falando:** `talkFrom(WORDS, T, início, fim)` — só nas falas dos personagens, sincronizada às palavras.
- **Piscada:** `blinkAt(T, seed)` a cada ~3 s.
- **Poses prontas** (`Video.tsx`, objeto `P`): apontar pra si, coçar a cabeça, facepalm, digitar,
  desenhar, segurar celular, celular no peito (apaixonada), esfregar as mãos (tramando), mão na cintura,
  joinha, punho erguido, rir (corpo sacudindo), assentir, segurar papel, levantar placa, andar (`walk`),
  sentado (`sit`), de bruços chutando o ar (`prone`).
- **Acessórios:** `holdR`/`holdL` (objeto na mão), `headWear` (ex.: óculos escuros do irmão "tramando").

## Cenários (`src/episodes/garota/sets.tsx`)
Corredor da escola (armários coloridos, mural, luminárias, alunos), quarto do narrador à noite
(notebook, luminária, cama, lua), quarto rosa dela (luzinhas, pelúcias), cantina (mesas, bandejas,
alunos sentados), sala (sofá, mesa), pátio (prédio de tijolos, árvores de blocos, bancos, cesta).
Objetos-gag: celular com telas (chat, 3 corações chegando, perfil anônimo, galeria), notebook, caderno,
estrela azul desenhada aos poucos, corações flutuando, bolhas de notificação, vapor de raiva, gota de
suor, jato de suco, "carregando" sobre a cabeça, placa, óculos escuros.

## Câmera
- Sempre em movimento: push-in (padrão), órbita leve, truck lateral, pull-out; zoom-soco com
  easeOut + tremida de 9 frames nos sustos.
- **Regra do 9:16:** a largura útil é ~56% da altura — plano de rosto precisa da câmera ~1,7x mais
  longe que no 16:9. `fixDist()` em `Video.tsx` corrige sozinho; planos de detalhe usam `insert: true`.
- Gramática: aberto de estabelecimento → médio → close de reação; over-the-shoulder alto e de lado
  (senão a cabeça do personagem da frente tapa tudo); inserts de tela/papel; contra-plongée na decisão.
- ~47 planos em 1:56, 1–2 câmeras por plano (~28 cortes/min); trocar de ângulo a cada 1,5–3 s.

## Luz
- Interiores e pátio com `interior` ligado (fill quente; o rebatimento verde padrão deixa a pele/cabelo oliva).
- **Noite:** sempre luz de preenchimento perto da câmera + ambiente azulado, senão os bonecos ficam pretos.
- Celular na mão à noite: pointLight azulada no rosto.
- Final no pôr do sol: luz direcional laranja baixa.

## Legenda e som
- Legenda do canal: 1 palavra por vez, minúscula, Montserrat Black branca com contorno preto,
  pop-in, a ~70% da altura (y=1350), queimada via ASS depois do render.
- Trilha contínua leve (pad + arpejo, C–Am–F–G, 92 bpm) ~12 dB abaixo da voz, com ducking.
- Efeitos discretos sincronizados por palavra: digitação, lápis, "pop" dos corações, cuspe de suco,
  bufada de raiva, swish, "ding" na placa. Mix final -14 LUFS.
