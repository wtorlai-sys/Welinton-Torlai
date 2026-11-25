---
name: construcaoviral
description: >
  Construção Viral — motor de vídeos verticais (Reels/Shorts/TikTok, 2:20–2:45, PT-BR) no formato
  "Você Construiu": o espectador constrói em 2ª pessoa algo real do zero (prédio, muro, telhado, piscina…),
  cada atalho ingênuo gera uma falha física mostrada em 3D low-poly, cada falha é resolvida por uma peça real
  que só ganha nome depois da função, e fecha com "Parabéns! Você construiu um X!". Formato extraído por
  engenharia reversa de vídeos virais reais (viral-video-engine/analysis). Use esta skill sempre que o usuário
  pedir ideias de vídeo, roteiro, gancho, revisão de roteiro, narração/voz no ElevenLabs, storyboard, cenas,
  prompts de imagem/animação, edição, legendas, SFX, auditoria ou análise de novos vídeos de referência para
  este canal/formato — mesmo que ele não diga "construção viral", fale só "faz um vídeo daquele jeito",
  "próximo vídeo", "como se constrói X", "vídeo de engenharia", "passa no ElevenLabs" ou mande métricas de um
  vídeo publicado.
---

# Construção Viral

Sistema de produção do formato **"Você Construiu"**. O conhecimento vem de engenharia reversa de 3 vídeos reais
(arranha-céu, muro de arrimo, telhado). Evidência em `viral-video-engine/analysis/`; regras operacionais em
`references/`. A skill gera conteúdo **original** com a mesma lógica — nunca copia frases ou temas das referências.

Caminhos (relativos à raiz do repositório):
- Skill: `.claude/skills/construcaoviral/` (também acessível em `viral-video-engine/skills/construcaoviral`)
- Projetos: `viral-video-engine/projects/<slug>/`
- Conhecimento acumulado: `viral-video-engine/conhecimento/`
- Análises de referência: `viral-video-engine/analysis/`

## Decisões fixas do usuário (2026-11-25)
- Nome da skill: construcaoviral ("Construção Viral").
- Visual: **3D low-poly com mascote 3D**, como nas referências. Neste formato isso substitui a regra de
  personagem 2D do `STYLE_GUIDE.md` (que vale para a série "E se…?"). As demais regras técnicas do repositório
  (determinismo, 1080x1920/30 fps, área segura, vermelho só no foco) continuam valendo quando a produção for em código.

## Roteador — o que o usuário pediu → o que ler e fazer

| Pedido | Função | Ler antes |
|---|---|---|
| ideias, temas, "o que gravar" | F1 Descoberta | `references/descoberta-de-ideias.md`, `references/FORMATO_IDENTIFICADO.md` §8 |
| roteiro, gancho, "desenvolve a ideia X" | F2 Roteiro | `references/estrutura-narrativa.md`, `references/engenharia-de-roteiro.md`, `references/padroes-e-exemplos.md` |
| revisar/melhorar roteiro | F3 Auditoria | `references/auditoria.md` |
| narração, voz, ElevenLabs, áudio | F4 Narração | `references/elevenlabs.md` |
| storyboard, cenas, prompts, edição, legenda, SFX, música, render | F5 Produção | `references/engenharia-visual.md`, `references/edicao-e-retencao.md`, `references/producao.md` |
| novos vídeos de referência ou métricas | F6 Aprendizado | `references/aprendizado.md` |

Leia só o que a função pede. `FORMATO_IDENTIFICADO.md` é o resumo de tudo; os outros detalham.

## Fluxo de produção e pontos de controle

```
F1 ideias ──(usuário escolhe)──► F2 roteiro ──► F3 auditoria ──► F4 narração ElevenLabs
                                                                     │
                                                    ⛔ PARE: usuário aprova o áudio
                                                                     │
                                                                     ▼
                                              F5 storyboard + produção ──► auditoria final
```

O áudio é a base temporal de tudo (cada cena, legenda e SFX é cronometrada pela narração real). Por isso:

1. **Não avance para F5 sem aprovação explícita do áudio.** Confira `projects/<slug>/estado.json`:
   F5 só começa com `"audio_aprovado": true`, e só o usuário pode pedir para marcar isso
   (`python3 scripts/estado.py <slug> audio_aprovado true` depois que ele aprovar na conversa).
2. **Não envie texto ao ElevenLabs antes da auditoria F3** (`"roteiro_auditado": true`).
3. Antes de gastar créditos, rode `scripts/elevenlabs.py status` e informe o custo estimado em caracteres.
4. **Nunca diga que o áudio foi gerado** sem o arquivo existir e o script ter retornado sucesso.
5. Ao terminar F4: entregue caminho do áudio, duração real, palavras/min, voz e configurações — e pare.

## Começar um projeto

```bash
python3 .claude/skills/construcaoviral/scripts/novo_projeto.py <slug> "<Título>"
```
Cria `viral-video-engine/projects/<slug>/` com os modelos das 6 entregas e `estado.json`.

## F1 — Descoberta de ideias
Siga `references/descoberta-de-ideias.md`. Resumo:
- Gere 8–12 temas de **objetos físicos que o espectador conhece**, cada um com: atalho ingênuo do gancho,
  desastre visual, cadeia de 6–13 peças reais (com nomes), 1–3 "é por isso que".
- Pontue 0–5: gancho, potencial narrativo, curiosidade, potencial visual, originalidade, facilidade de produção,
  adequação ao formato. Ordene. Descarte temas que não fecham ≥ 6 peças verdadeiras.
- Se tiver acesso à web, pesquise para confirmar fatos e ver o que já existe; **não invente tendências, números
  ou estatísticas** — sem fonte, escreva "não verificado".
- Termine pedindo ao usuário que escolha.

## F2 — Roteiro
Use `templates/02-roteiro.md`. Ordem fixa: GANCHO → PORQUÊ → CICLOS → ACABAMENTO → USO → PARABÉNS → CTA.
Método de construção (detalhes em `references/engenharia-de-roteiro.md`):
1. Liste as peças reais do objeto e **a falha que cada uma evita**.
2. Ordene por dependência: cada solução permite avançar e o avanço revela o próximo problema ("Mas…").
3. Escolha o atalho ingênuo do gancho (o que um leigo faria) e o desastre mais visual possível.
4. Escreva cada ciclo: "Então você [ação]" → função em palavras comuns → "Esse é o [TERMO]." → (é por isso que…) → "Mas [problema novo]".
5. Meta: 470–560 palavras, frases de 10–14 palavras, 2–4 números traduzidos em imagem, 1–3 toques de humor.
6. Confira cada afirmação técnica. O formato depende de ser verdade; marque qualquer dúvida para o usuário.

## F3 — Auditoria do roteiro
Rode `python3 scripts/preparar_narracao.py <slug>` para as métricas e siga `references/auditoria.md`:
3 versões de gancho com escolha justificada, checklist de fidelidade ao formato, ritmo, clareza, precisão
técnica. Não corte informação importante só para encurtar. Salve em `02-roteiro.md` (seção Auditoria) e marque
`roteiro_auditado`.

## F4 — Narração no ElevenLabs
Siga `references/elevenlabs.md`. Resumo:
1. `scripts/elevenlabs.py status` (credencial e cota) e `vozes` (vozes da conta). Se falhar por credencial,
   explique o erro exato, entregue `03-narracao/narracao.txt` pronto para uso manual e pare.
2. `preparar_narracao.py` gera o texto limpo (sem marcações, números por extenso, sem `[PAUSA]`).
3. Gere com `scripts/elevenlabs.py gerar <slug> --voz <id> --confirmar` (salva mp3 + timestamps por palavra).
4. Meça (`scripts/medir_audio.py <slug>`), registre em `03-narracao/config.json`, mostre ao usuário. **PARE.**

## F5 — Produção (só com áudio aprovado)
Siga `references/producao.md`: storyboard cronometrado pelos timestamps reais (`04-storyboard.md`), depois
`05-producao.md` com prompts/código, edição, legendas, palavras destacadas, SFX, música, transições.
Cada cena nasce de um trecho do áudio; nenhuma imagem "de enchimento". Termine com a auditoria final
(`06-auditoria.md`, checklist em `references/auditoria.md`).

## F6 — Aprendizado
Novos vídeos de referência: `scripts/analisar_video.py <video.mp4> <nome>` gera transcrição, contact sheets e
métricas; analise como em `viral-video-engine/analysis/` e compare com o formato. Métricas de vídeos publicados:
registre em `viral-video-engine/conhecimento/metricas/desempenho.csv`. Atualize as referências só com evidência
suficiente e sempre registre em `viral-video-engine/conhecimento/historico-de-descobertas.md`
(regras em `references/aprendizado.md`). Um único exemplo não derruba um padrão consolidado.

## Honestidade
- Separe sempre OBSERVADO / ESTIMATIVA / HIPÓTESE. Sem dados de retenção, pontos de queda são hipóteses.
- Correlação não é causalidade: "os 3 vídeos fazem X" não prova que X causa viralização.
- Nunca exponha chaves. A chave do ElevenLabs é injetada pelo proxy do ambiente; os scripts não precisam dela.
