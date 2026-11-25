# Metodologia da investigação (Fase 1–5)

Data da análise: 2026-11-25. Material: 3 vídeos MP4 enviados pelo usuário (baixados via "snapinsta",
ou seja, origem Instagram Reels). Arquivos originais preservados intactos em `/root/.claude/uploads/...`;
toda análise foi feita em cópias.

## Ferramentas e o que cada uma mediu

| Medição | Ferramenta | Precisão |
|---|---|---|
| Duração, resolução, fps, codecs | `ffprobe` | exata |
| Transcrição com tempo por palavra | Whisper `medium` (faster-whisper, CPU, int8) | boa; erros pontuais corrigidos à mão (lista abaixo). Tempos de palavra ±0,1–0,2 s |
| Velocidade de fala, nº de frases, pausas | script sobre os tempos do Whisper | estimativa (depende da segmentação do Whisper) |
| Cortes secos | `ffmpeg select=gt(scene,0.25)` e `0.08` | exata para cortes secos; **não** detecta transições por movimento de câmera |
| Ritmo visual | diferença média entre frames a 10 fps (64x36 px, cinza) | métrica relativa, útil só para comparar os 3 vídeos |
| Observação visual | contact sheets 1 frame/s (todos os segundos dos 3 vídeos) + 3 frames/s nos 10 s iniciais + frames em resolução cheia | inspeção visual; timestamps ±0,5 s |
| Loudness | `ffmpeg ebur128` | exata |
| Voz × fundo | Demucs `htdemucs` (2 stems) + espectrogramas | separação boa; **interpretação do fundo (música vs. SFX) é hipótese** |

## Correções manuais na transcrição
- "colunas em tér" → "colunas em pé" (V1)
- "intermeabilização" → "impermeabilização" (V1)
- "entocam" → "entopem" (V2)
- "em poçada" → "empoçada" (V3)
- Palavras de CTA colocadas entre aspas.

## O que NÃO estava disponível
- Métricas de desempenho (views, retenção, duração média, compartilhamentos, comentários). Nenhum dado foi
  informado. **Todas as afirmações sobre retenção são hipóteses de análise narrativa/audiovisual.**
- Legenda/descrição do post, hashtags, data de publicação, perfil exato (aparece a marca "Desmontando o Mundo"
  no final dos 3 vídeos).
- Projeto de edição, trilha original, voz usada (provável voz sintética/clonada — hipótese, não verificável).

## Convenção de classificação usada nos documentos
- **OBSERVADO**: visto/ouvido/medido diretamente.
- **ESTIMATIVA**: medido com método aproximado (indicado).
- **HIPÓTESE**: interpretação de mecanismo ainda não validada por dados de desempenho.
