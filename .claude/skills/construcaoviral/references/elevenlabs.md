# F4 — Narração (texto para colar no ElevenLabs)

**Decisão do usuário (2026-11-25):** a única coisa que o sistema faz com o ElevenLabs é **entregar o roteiro
narrado pronto para copiar e colar**. O usuário gera o áudio no site/app dele. Não há integração por API: não chame
a API, não peça chave, não escolha voz nem configure modelo por ele.

## Fluxo
1. **Pré-condição**: `estado.json` com `roteiro_auditado: true` (auditoria F3 feita).
2. Rode `scripts/preparar_narracao.py <slug>`. Ele grava `03-narracao/narracao.txt` e imprime o texto.
3. Revise o texto antes de entregar:
   - só o que é falado: sem títulos de bloco, timestamps, notas de cena, markdown ou comentários;
   - números e unidades por extenso ("trinta por cento", "quarenta e cinco toneladas"), com concordância certa;
   - **sem** `[PAUSA]`, `[SUSPENSE]` ou outras tags: o modelo lê colchetes em voz alta;
   - ritmo só por pontuação: vírgula = micro-pausa, ponto = respiração curta;
   - **bloco único, sem quebras de parágrafo**: no ElevenLabs cada parágrafo vira uma pausa longa, e o formato
     quase não tem pausas (referências: ≤ 10 pausas > 0,35 s em ~150 s, 193–213 palavras/min);
   - grafia que soe certa quando falada (siglas por extenso; termos estrangeiros como "skimmer" sinalizados para
     o usuário conferir na escuta).
4. **Entregue na conversa** o texto inteiro dentro de um bloco de código (para copiar com um clique), mais uma
   linha com: nº de caracteres, nº de palavras, duração estimada a ~200 palavras/min, e as palavras de pronúncia
   duvidosa. Preencha `03-narracao.md`. `estado.py <slug> narracao_entregue true`.
5. **PARE.** Não comece storyboard nem produção. O próximo passo é do usuário: gerar o áudio e, se quiser seguir
   para a produção, mandar o arquivo.

## Quando o usuário mandar o áudio
1. `scripts/transcrever_audio.py <slug> <arquivo>` → copia o áudio para o projeto, gera `timestamps.json`
   (tempo por palavra, base de toda a produção) e lista divergências entre o roteiro e o que foi falado.
2. `scripts/medir_audio.py <slug>` → duração real, palavras/min, pausas, loudness, comparado às referências.
3. Mostre o resultado (incluindo divergências e se o ritmo ficou muito lento ou rápido) e pergunte se aprova.
   Se estiver fora do formato (< 193 palavras/min, > 165 s ou > 10 pausas longas), ofereça: regerar no ElevenLabs
   mais rápido, ou `scripts/ajustar_ritmo.py <slug>` (guarda o original, encurta pausas > 0,25 s por energia,
   acelera com rubberband sem mudar o tom até ~200 ppm). Depois do ajuste, rode de novo `transcrever_audio.py`
   com o novo arquivo e `medir_audio.py`. Ajuste não corrige pronúncia: isso só regerando.
4. Só após o "aprovado" explícito: `estado.py <slug> audio_aprovado true` → F5.

Nunca diga que existe áudio se o arquivo não foi enviado pelo usuário.
