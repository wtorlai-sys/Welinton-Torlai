# Edição e retenção

## Sistema de edição (o que cada recurso faz)
| Recurso | Tipo | Especificação | Regra de uso |
|---|---|---|---|
| Legenda 1 palavra | funcional | branca, sans extra-bold arredondada (Montserrat ExtraBold/Black — já no repo), contorno + sombra escuros, Title Case, centro horizontal, ~62–66% da altura | toda palavra falada, sincronizada pelo `timestamps.json`; mude a posição vertical se cobrir a ação |
| Palavra amarela | narrativa | mesma legenda em amarelo | só o termo revelado e a palavra do desastre do gancho |
| Pílula | funcional | fundo branco, caixa alta pequena, ponto + contorno na cor do significado | ao citar uma força/objeto pela 1ª vez; some quando o assunto muda |
| Rótulo do termo | narrativa/impacto | caixa alta amarela, inclinada (~-5°), contorno escuro, presa ao objeto + realce amarelo translúcido na peça | exatamente no "Esse é o X" |
| Setas | funcional | vermelho/azul/verde conforme paleta; animam crescendo | explicar forças |
| Cotas | funcional | linha com terminais + número amarelo | todo número dito |
| Ícones/balões | impacto | ✓ ✗, "RACHOU!", onomatopeias, relógio | 1 por evento, curto |
| ◀◀ / ▶▶ | narrativa | ver `engenharia-visual.md` | após falha / em construção demorada |
| Confete | impacto | multicolorido | só no "Parabéns!" |
| CTA final | funcional | texto empilhado no topo: linha pequena branca ("SABIA? COMENTE") + palavra-chave grande amarela entre aspas; pílula escura com o nome do canal; mascote grande entrando | últimos 4–5 s |

## Áudio
- Voz no centro, 12–15 dB acima de tudo; master integrado −14 LUFS, LRA ~2 LU (medido nas referências).
- SFX sincronizados a eventos visuais: desabamento/estrondo, "puf" de transformação, batidas de construção,
  rangido de flexão, trinca, gotas, chuva, vento, rebobinar (fita), avanço rápido, pop de etiqueta (suave),
  confete/fanfarra curta. Um SFX por evento; não sonorizar cada etiqueta.
- Música: leve, positiva, tipo pluck/marimba, em volume baixo com ducking sob a voz (HIPÓTESE das referências —
  pode ser testada).
- Silêncio: praticamente nenhum. Respiro curto (~0,5 s) só depois do desastre do gancho.
- Repositório: `scripts/gerar_sfx.py` (SFX sintetizados por cue) e `scripts/mixar.sh` (ducking + −14 LUFS) podem ser
  reaproveitados.

## Funcional × estético × narrativo × impacto
- Funcional (legenda, pílulas, setas, cotas): compreensão. Sempre.
- Narrativo (termo amarelo, ◀◀, ▶▶): marca a estrutura (recompensa, falha, avanço).
- Impacto (colapso + estrondo, ✗, confete): picos de atenção — 1 a cada 15–25 s, não mais.
- Estético (luz, cor da cena): clima (chuva, calor, noite) a serviço da explicação.
Não adicionar efeitos "para dar ritmo": o ritmo vem da câmera contínua e dos eventos físicos.

## Retenção — hipóteses de trabalho (validar com métricas reais)
| Momento | Risco | Contramedida do formato |
|---|---|---|
| 0–3 s | rolagem | ação absurda + objeto familiar + narração no frame 0 |
| 5–8 s | lacuna sem pagamento | desastre visual + "Porque" imediato |
| ciclos 3–5 (meio) | monotonia | re-gancho: novo desastre, objeto-vítima, troca de escala (subsolo/topo), piada |
| ciclos de explicação abstrata | confusão | corte/raio-X + setas coloridas + número traduzido |
| final | saída antes do CTA | "Agora é só…" + "Parabéns!" + confete antes do pedido |
Sem dados da plataforma, nunca afirme que houve queda ou pico em um segundo específico.
