# Etapas G e H — teste da skill `construcaoviral` (2026-11-25)

Tema novo: **piscina** (`projects/piscina/`). Execução seguindo o `SKILL.md` ao pé da letra.

| Função | Resultado | Evidência |
|---|---|---|
| F1 ideias | 8 temas pontuados, top 3 com ângulos; piscina 33/35 | `projects/ideias-2026-11-25.md` |
| Conceito | ✔ | `projects/piscina/01-conceito.md` |
| F2 roteiro | ✔ 11 ciclos, 10 termos, 3 "é por isso que", verificação técnica | `projects/piscina/02-roteiro.md` |
| F3 auditoria | ✔ **pegou um defeito real**: 1ª versão com 602 palavras (~180 s) > teto; enxugada para 542 (~163 s) sem perder peças; 3 ganchos comparados | seção Auditoria do roteiro |
| F4 narração | ✅ texto narrado em bloco único entregue para colar no ElevenLabs (1ª tentativa via API falhou por chave inválida; depois o usuário decidiu não usar API) | `projects/piscina/03-narracao/narracao.txt`, `03-narracao.md` |
| F5 produção | não iniciada (correto: sem áudio aprovado) | `estado.json` |

## Validação dos pontos de controle (H)
| Teste | Esperado | Resultado |
|---|---|---|
| Marcar storyboard sem áudio aprovado | bloquear | ✔ "Bloqueado: produção só depois do áudio aprovado." |
| Aprovar áudio inexistente | bloquear | ✔ "Não há áudio gerado para aprovar." |
| Gerar TTS sem roteiro auditado | bloquear | ✔ "Bloqueado: o roteiro ainda não passou pela auditoria" |
| Gerar TTS sem `--confirmar` | só simular | ✔ "Simulação: nada enviado" |
| Erro da API | não salvar, mostrar erro | ✔ HTTP 400 exibido, nada salvo |
| Medir áudio inexistente | recusar | ✔ |
| Conversão alinhamento → palavras | formato do `src/lib/timestamps.ts` | ✔ (teste sintético) |
| `medir_audio.py` com áudio real | medir | ✔ (áudio existente do repo, depois removido) |
| `analisar_video.py` em referência | reproduzir medições manuais | ✔ 1 corte seco, pico visual 2,18 s, ~215 ppm, 1ª palavra 0,0 s (V2) |

## Pendências
- Usuário gera o áudio da piscina no ElevenLabs → (se quiser produção) envia o arquivo → `transcrever_audio.py` → **aprovação**.
- Conferir na escuta a pronúncia de "skimmer".
- Após a 1ª publicação, registrar métricas em `metricas/desempenho.csv`.

## Revisão 2026-11-25 (decisão do usuário)
Integração por API com o ElevenLabs removida (`elevenlabs.py` apagado). F4 agora entrega só o texto para copiar e colar, em bloco único. Adicionado `transcrever_audio.py` para registrar o áudio que o usuário gerar (testado com áudio do repo: tempos por palavra + divergências roteiro × áudio).
