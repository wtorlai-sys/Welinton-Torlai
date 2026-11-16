---
name: edit-motion-mapa
description: "Planeja as cenas de motion graphics do vídeo inteiro (o que aparece, em qual palavra, transição e intenção da câmera virtual), sem animar nada, e grava o plano aprovado. Use em /edit-motion-mapa, após a edit-preparar."
---

# edit-motion-mapa

A etapa que mais decide a qualidade. **Não anima nada**: propõe no chat, ajusta com Welinton e grava o plano. Mudar aqui é barato; depois do render custa uma rodada inteira. É o **ponto de revisão ①**.

- **Lê:** `_CLAUDE/frases.md`, `_CLAUDE/briefing.md`, perfil (`identidade.md`, `estilo-motion.md`, `estilo-camera.md`, `catalogo.md`), `ferramentas/guias/oficio-motion.md`
- **Escreve:** `_CLAUDE/plano-cenas.md` (legível) e bloco `cenas` no estado (ids `c01`, `c02`…)
- **Próximo passo:** `/edit-motion-render`

Se a `preparar` não estiver `concluido`, pare.

## Ofício
- **O conteúdo decide a animação.** Para cada ideia, a forma visual que explica melhor *aquela* fala (contador, faixa de valores, comparação, cadeado abrindo…). O catálogo é repertório, nunca obrigação. Se o briefing descreve a cena, ele manda; complete só o que faltar.
- **Uma protagonista por vez.** Em cada momento, um elemento chama a atenção.
- **Sincronia na palavra:** toda entrada importante tem uma palavra-gatilho com o tempo exato (de `palavras.json`), nunca um intervalo fixo.
- **Ritmo (perfil):** algo novo a cada 1,5–3 s; cena de 2–8 s (acima de ~10 s, dividir em sub-momentos ou cenas); gancho mais denso, quase palavra a palavra; viradas de suspense desaceleram de propósito.
- **Escalada:** cada cena de número um pouco mais intensa que a anterior; o ápice (a maior revelação) ganha preparação (escurece, contador acelera, slot girando) antes do impacto.
- **Trocas de cena variadas** (whip, zoom-through, drop, inclinação 3D, flash, glitch só na virada); nunca a mesma duas vezes seguidas; cortes nas pausas > 0,3 s.
- **Câmera em palavras:** push-in, punch, tremida, chegada na direção da saída anterior.
- **Legendas:** onde ficam em cada cena (padrão: terço de baixo, y≈915) e onde precisam sair do caminho.
- **Conteúdo:** nada inventado; comparação sem dado oficial = selo ilustrativo; interface inspirada, nunca copiada.
- **Batidas viram som:** anote os momentos fortes de cada cena (são os eventos da edit-sfx).
- **Assets:** tudo é desenhado no código. Se uma cena pedir logo/print/foto específica, peça a Welinton em vez de improvisar.

## Passo a passo
1. Defina o **fim do gancho**, o corpo e o **começo do fechamento/CTA**; confirme numa linha.
2. Planeje **o gancho primeiro e com mais detalhe**, depois o resto.
3. Antes de mostrar, releia: o conceito nasce desta fala ou serviria para qualquer vídeo? Estou repetindo a mesma fórmula (todo slam, toda entrada igual)?
4. Mostre o plano numerado, uma linha por cena: `c07 · 0:48–0:55 · 1 milhão · contador até 1.000.000 com anel; "milhão" 0:50.3 slam; "mil" 0:53.4 R$ 1.000; "cinco mil" 0:54.1 R$ 5.000 + moedas 3D · câmera: aproxima lento, punch no slam · transição: zoom-through`.
5. Grave `plano-cenas.md` e o bloco `cenas` (id, início, fim, gatilhos [{palavra, t, o que acontece}], transição de entrada, câmera, captionY, batidas). Etapa `aguardando_aprovacao`.

## Revisão e aprovação
Welinton aprova, ajusta ou risca por número ("c04 mais simples", "c09 troca a ideia"). Ao gravar de novo, preserve o status do que já foi aprovado. Aprovado: `concluido`, commit, `/clear` + `/editar`.

## Regras comuns
Antes de começar, leia `.claude/skills/editar/regras-comuns.md` (uma vez por sessão).
