# F4 — Narração no ElevenLabs

## Recursos verificados neste ambiente (2026-11-25)
| Recurso | Situação |
|---|---|
| MCP do ElevenLabs | **não existe** neste ambiente |
| API REST `api.elevenlabs.io` | acessível via proxy; credencial salva como *network secret* do ambiente (cabeçalho `xi-api-key`, injetado pelo proxy — nenhum script lê ou guarda a chave) |
| Credencial | salva, mas na 1ª verificação a API respondeu `invalid_api_key_prefix` ("API key must start with 'sk_'") → **precisa ser corrigida pelo usuário** nas configurações do ambiente (Network secrets) |
| Documentação web (`elevenlabs.io/docs`) | bloqueada pela rede; os parâmetros abaixo vêm do conhecimento da API e são **conferidos ao vivo** por `elevenlabs.py modelos` |
| Script | `scripts/elevenlabs.py` (status, modelos, vozes, custo, gerar) |

Fora deste ambiente: exporte `ELEVENLABS_API_KEY` (nunca commitar).

## Fluxo obrigatório
1. **Pré-condição**: `estado.json` com `roteiro_auditado: true`. O script bloqueia sem isso.
2. **Preparar texto**: `preparar_narracao.py <slug>` → `03-narracao/narracao.txt`.
   - Remove notas, rótulos, markdown; converte números e unidades por extenso; concordância feminina básica.
   - Revise o arquivo: siglas, nomes próprios, termos técnicos (ex.: "barbacã", "rufo"), "pra" (manter coloquial).
   - Sem `[PAUSA]`, `[SUSPENSE]` etc.: o modelo padrão lê colchetes em voz alta. Ritmo = pontuação.
   - (Só se usar `eleven_v3`, que interpreta *audio tags*, considerar tags — e testar antes.)
3. **Custos e cota**: `elevenlabs.py status` + `elevenlabs.py custo <slug>`. Informe ao usuário: caracteres do texto,
   cota restante, multiplicador do modelo (de `modelos`). Um roteiro do formato tem ~2.800–3.400 caracteres.
4. **Voz**: `elevenlabs.py vozes --filtro portuguese` (ou sem filtro). Critério das referências: voz masculina PT-BR,
   energética, dicção limpa, sem sotaque caricato. Se ainda não houver voz padrão em
   `viral-video-engine/conhecimento/voz-padrao.json`, proponha 2–3 e peça ao usuário para escolher
   (ou gere uma amostra curta de 1 frase de cada, que custa poucos caracteres).
5. **Modelo e parâmetros** (ponto de partida; ajuste após medir):
   | Parâmetro | Valor inicial | Motivo |
   |---|---|---|
   | `model_id` | `eleven_multilingual_v2` | melhor estabilidade em PT-BR para texto longo (confirmar em `modelos`) |
   | `stability` | 0,45 | entonação viva sem variar demais entre frases |
   | `similarity_boost` | 0,80 | fidelidade à voz |
   | `style` | 0,20 | um pouco de energia; acima disso aumenta instabilidade |
   | `use_speaker_boost` | true | presença |
   | `speed` | 1,10 | referências faladas a 193–213 palavras/min; ajuste depois de medir |
   | `seed` | fixo (opcional) | reprodutibilidade em regravações |
6. **Gerar**: `elevenlabs.py gerar <slug> --voz <id> --confirmar` → `narracao.mp3`, `timestamps.json`
   (formato `{words:[{text,start,end,type}]}`, o mesmo de `src/lib/timestamps.ts`), `config.json`.
   Sem `--confirmar` ele só simula. Se a API retornar erro, nada é salvo e o erro é mostrado — relate o erro exato.
7. **Medir**: `medir_audio.py <slug>` → duração, palavras/min, 1ª palavra, pausas, loudness.
   Se ficar < 185 ppm ou > 225 ppm, proponha ajustar `speed` (faixa aceita pela API: aprox. 0,7–1,2).
8. **Entregar e PARAR**: preencha `03-narracao.md` (voz, modelo, parâmetros, caracteres, duração real, ppm, arquivo)
   e pergunte ao usuário se aprova. Não comece storyboard/produção. Só após o "aprovado" explícito:
   `estado.py <slug> audio_aprovado true`.

## Regravação de trechos
Se só uma frase saiu ruim, prefira corrigir o texto (pontuação, grafia fonética) e regerar o áudio inteiro com o
mesmo `seed`, para manter timbre e ritmo contínuos. Emendas exigem nova medição de timestamps.

## Sem acesso à API
Entregue `03-narracao/narracao.txt` + voz/modelo/parâmetros recomendados para geração manual no site, e peça ao
usuário para colocar o mp3 em `03-narracao/narracao.mp3`. Então rode a transcrição com tempos
(`analisar_video.py` funciona com áudio também via ffmpeg) para obter `timestamps.json`.
Nunca afirme que o áudio foi gerado sem o arquivo existir.
