---
name: edit-iniciar
description: "Abre um vídeo novo a partir de uma narração: cria a pasta do episódio, guarda a narração original intocada, cria o estado do vídeo e organiza o briefing de Welinton. Use em /edit-iniciar, quando chegar uma narração nova, ou chamada pela /editar."
---

# edit-iniciar

Abre o projeto e organiza o briefing. Não transcreve nem analisa o áudio (isso é da edit-preparar).

- **Lê:** a narração enviada (upload ou caminho), o briefing de Welinton
- **Escreve:** `episodios/<slug>/` (`audio/`, `_CLAUDE/`, `FINAL/`), `_CLAUDE/projeto.json`, `_CLAUDE/briefing.md`, `_CLAUDE/aprendizados.md` (vazio)
- **Próximo passo:** `/edit-preparar`

## Passo a passo
1. **Slug:** `AAAA-MM-DD_<tema-curto>` (sem acento, sem espaço). Sugira e confirme numa linha.
2. **Vídeo já iniciado** (o `projeto.json` existe): não sobrescreva nada; mostre o status e pergunte se é só para atualizar o briefing.
3. **Narração:** copie (nunca mova) para `episodios/<slug>/audio/` com o nome original. Se Welinton mandar o mesmo arquivo de novo, compare por hash e avise que é idêntico. Uma narração diferente de um vídeo já aprovado = alerta (as etapas depois dela precisam ser refeitas).
4. **Estado:** crie o `projeto.json` pelo `ferramentas/scripts/estado.py <pasta> init --perfil canal` (escreva o script na primeira vez: subcomandos `init`, `status`, `<bloco>`, `--json`, `--set`, `--etapa`, `--pendencia`, `--resolver`; teste antes de usar).
   Etapas: `iniciar, preparar, motion_mapa, motion_render, sfx, render` — `iniciar` já `concluido` ao final.
5. **Perfil:** com um perfil só, use `canal`; com mais de um, pergunte de quem é o vídeo.
6. **Briefing:** peça numa mensagem curta: "Me conta, do jeito que vier, sobre o que é esse vídeo e qualquer direcionamento que você já tenha." Se Welinton já mandou um briefing (com cenas, por exemplo), use esse.
   - Organize sem inventar: preserve as palavras e a intenção dele; nada de acrescentar tom, público ou ideia.
   - Seções: sobre o vídeo, direcionamentos gerais, cenas pedidas (com a fala de cada uma), observações por etapa (motion, câmera, legendas, som). Omita as vazias.
   - **Conflitos:** pedido que contraria o perfil ou as regras comuns (ex.: outro formato, estatística sem fonte) é apontado antes, com a sugestão.
   - Salve e mostre um resumo curto. Pergunte só se algo estiver ambíguo.
7. Feche: diga o que vem (transcrição) e sugira `/clear` + `/editar` (ou siga se Welinton disser "sim").

## Regras comuns
Antes de começar, leia `.claude/skills/editar/regras-comuns.md` (uma vez por sessão).
