---
name: editar
description: "Ponto de entrada da edição de vídeos de Welinton (motion graphics narrados, 16:9 para YouTube): mostra onde o vídeo está (etapas, pendências, alertas, aprendizados anotados) e abre a skill da etapa certa. Também aplica os aprendizados (/editar aprendizados). Use em /editar, ao começar um vídeo novo a partir de uma narração, ao retomar um vídeo, depois de um /clear, ou quando Welinton perguntar em que pé está o vídeo."
---

# editar

Fluxo: edit-iniciar → edit-preparar → edit-motion-mapa → edit-motion-render → edit-sfx → edit-render

Antes de tudo, leia `regras-comuns.md` (nesta pasta), uma vez por sessão.

## /editar
1. **Qual vídeo:** liste `episodios/*/_CLAUDE/projeto.json`. Nenhum, ou Welinton mandou uma narração nova: ofereça a `edit-iniciar`. Mais de um em andamento: pergunte qual (sugira o mais recente).
2. **Status:** rode `python3 ferramentas/scripts/estado.py episodios/<slug> status` e mostre curto: etapas, o que já foi feito por trecho, pendências, alertas e quantos aprendizados estão anotados.
3. **Próximo passo:** diga qual é e pergunte se segue. Com o "sim", leia a skill da etapa (`.claude/skills/edit-<etapa>/SKILL.md`) e siga.
   - Etapa aguardando revisão: o próximo passo é continuar essa mesma etapa, nunca pular.
   - Alerta de algo desatualizado: mostre primeiro e espere a decisão.
   - Welinton pediu outra etapa ou um trecho ("sim, só o gancho"): abra essa etapa e passe o trecho.
4. **Uma etapa por vez.** Não encadear etapas sozinho e não dar `/clear` (isso é sempre de Welinton).
5. **Modelo:** lembre, numa linha, o sugerido para a etapa: iniciar → leve; preparar → intermediário; motion-mapa, motion-render → o mais capaz, esforço alto; sfx, render → o mais capaz, esforço médio.

## Os 4 pontos de revisão de Welinton
1. Plano das cenas (no chat) — fim da edit-motion-mapa
2. Prancha de stills — fim da edit-motion-render
3. Prévia do gancho com som — fim da edit-sfx
4. Vídeo final em `FINAL/` — fim da edit-render

## /editar aprendizados
Siga a seção 7 das regras comuns.

## Regras
- Não editar vídeo nem rodar scripts de etapa: isso é das skills de cada etapa.
- Nunca mover, renomear ou apagar arquivos do projeto.
