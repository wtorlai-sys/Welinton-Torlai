# F6 — Aprendizado e evolução

## Novos vídeos de referência
1. Preserve o original (não editar/mover). Rode:
   `python3 -I .claude/skills/construcaoviral/scripts/analisar_video.py <video.mp4> <nome-curto>`
   → `viral-video-engine/analysis/dados/<nome>/` (ficha, transcrição com tempos, contact sheets).
2. Revise a transcrição (Whisper erra termos técnicos). Abra todas as contact sheets.
3. Escreva `viral-video-engine/analysis/<nome>.md` no molde de `video-01-arranha-ceu.md`: números do roteiro,
   frase a frase, arquitetura, audiovisual, edição, mapa temporal, hipóteses de queda.
4. Compare com a matriz de `viral-video-engine/analysis/comparacao-geral.md`: para cada padrão P1–P20
   (`padroes-e-exemplos.md`) marque confirma / contradiz / não se aplica. Liste padrões novos.
5. Decida se é o **mesmo formato** (variante) ou **outro formato**. Outro formato = documentar à parte; não misturar.

## Regras de atualização
- Um padrão muda de classe só com evidência: ISOLADO → ESPECÍFICO com 2 exemplos; ESPECÍFICO → RECORRENTE quando
  aparece na maioria dos exemplos do formato (mínimo 3).
- **Um exemplo não derruba padrão consolidado.** Contradições ficam registradas como exceção até se repetirem.
- Toda mudança em `references/` entra no histórico com data, evidência e o que mudou.
- Nunca apague hipóteses antigas: marque como validada/refutada.

## Histórico
`viral-video-engine/conhecimento/historico-de-descobertas.md` — uma entrada por mudança:
`AAAA-MM-DD · fonte (vídeos/métricas) · descoberta · classe/confiança · arquivos alterados`.

## Métricas de vídeos publicados
Registrar em `viral-video-engine/conhecimento/metricas/desempenho.csv` (uma linha por vídeo por data de coleta).
Colunas: `data_coleta, slug, plataforma, data_publicacao, dias_no_ar, duracao_s, visualizacoes, retencao_media_pct,
duracao_media_assistida_s, taxa_conclusao_pct, curtidas, comentarios, compartilhamentos, salvamentos, ctr_pct,
seguidores_ganhos, variante_gancho, n_ciclos, tem_rebobinar, tem_objeto_vitima, cta, observacoes`.
- As colunas de variante (gancho, ciclos, ◀◀, objeto-vítima, CTA) permitem comparar abordagens.
- Se o usuário tiver o gráfico de retenção, transcreva os pontos de queda (segundo, %) em
  `conhecimento/metricas/<slug>-retencao.csv` e compare com o storyboard: qual batida estava no ar em cada queda.
- Compare só vídeos com tempo no ar parecido. Com poucos vídeos, descreva, não conclua: "o vídeo com ◀◀ teve
  retenção maior" é observação, não causa.
- Quando um padrão do formato for consistentemente associado a melhor desempenho em ≥ 3 comparações, promova-o a
  regra no `FORMATO_IDENTIFICADO.md` e registre no histórico.
