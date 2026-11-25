# Engenharia de roteiro — como escrever cada frase

## 1. Método de construção (antes de escrever qualquer frase)
1. **Inventário de peças reais** do objeto (pesquise se tiver web; senão use conhecimento técnico e marque dúvidas).
   Para cada peça: nome técnico, nome popular, **qual falha ela evita**, como mostrar em 3D.
2. **Grafo de dependência**: a peça B só faz sentido depois que A existe? (estacas só importam depois que o prédio
   pesa muito; dreno só depois que existem barbacãs que entopem). Ordene.
3. **Atalho ingênuo**: o que um leigo faria para obter o objeto sem nada disso? Esse é o gancho.
4. **Escada**: do atalho até o objeto pronto, uma falha por degrau. Corte peças que não geram falha visível ou que
   exigem explicação longa (viram itens do acabamento).
5. **Âncoras de cotidiano**: para quais peças existe um "é por isso que…" observável na rua/em casa?
6. **Números**: 2–4, verificados, cada um traduzível em imagem (cota, comparação com o mascote).
7. **Humor**: 1–3 pontos naturais (consequência exagerada, obviedade, item absurdo no acabamento).

## 2. Regras de frase
| Regra | Por quê | Medido nas referências |
|---|---|---|
| 2ª pessoa, presente, "você" como agente | o espectador vira construtor; cada decisão é dele | 100% dos ciclos |
| 10–14 palavras por frase (média) | cabe numa respiração de narração rápida | 10,9–14,1 |
| Frase-termo isolada, 3–5 palavras | é a recompensa; precisa de destaque sonoro e visual | 25 de 25 termos |
| Um verbo físico por ideia | vira animação literal | "esmagar", "afunda", "tomba", "pinga" |
| Personificar forças | física vira intenção, fácil de imaginar | "a terra empurra o dia inteiro" |
| Número sempre traduzido | número solto não vira imagem | "30% — sobe 30 cm a cada metro" |
| Nada de jargão antes do nome | explicação com jargão quebra o "aha" | "aperto/puxão" antes de "concreto armado" |
| Sem perguntas ao público | a narração afirma; a curiosidade vem dos "Mas" | 1 pergunta em 3 vídeos |
| Sem datas, história, autoridade | o formato é mecânico, não histórico | 0 ocorrências |

## 3. Banco de conectores (o "tecido" do formato)
- Abrir solução: **Então você** … / Então, [lugar], você … / Por isso você …
- Nomear: **Esse é o** … / **Essa é a** … / **Esses são os** … / **Essas são as** …
- Ponte: **É por isso que** … / Por isso, …
- Novo problema: **Mas** … / Só que … / Mas, quanto mais [X], mais [Y] … / E aí [falha] de novo.
- Consequência: … até [falha]. / … e um dia [falha].
- Tempo: "o dia inteiro", "todo dia", "em poucos meses", "dias depois da chuva".
- Diminutivo coloquial pontual: rachadurinha, devagarinho, folguinha, ripinhas (1–3 por vídeo, nunca no termo).

## 4. Anatomia do gancho — 3 variações para testar
| Tipo | Molde | Quando usar |
|---|---|---|
| Contraste-desastre (preferido) | Se você [atalho], você não vai ter [X], vai ter [desastre]. | sempre que houver desastre visual forte |
| Consequência em cadeia | Se você [atalho], [consequência 1]. [consequência 2 concreta e doméstica]. | quando o desastre é pequeno (goteira) |
| Desejo + absurdo | Se você quer [X] e [atalho], você vai ter [X]… [por 3 segundos / até a 1ª chuva]. | humor; testar como alternativa |

## 5. Como escrever o "Porquê"
- 1 princípio ("quem segura a casa são paredes dimensionadas para uma casa") + 1 mecanismo ("cada andar pesa nos de
  baixo") + 1 número-choque ou repetição visual ("na primeira chuva forte, ela escorrega e soterra o carro inteiro").
- Não antecipe nenhuma solução no Porquê.

## 6. Fechamento
- Acabamento em lista com o item engraçado por último.
- "Agora é só…" retomando o desejo do gancho.
- "Parabéns! Você construiu um(a) X!" — literal, com o artigo certo.
- CTA binário com papéis do tema.

## 7. Escrever para ser falado
- Leia em voz alta mentalmente: se precisa de duas respirações, divida.
- Vírgula = micro-pausa; ponto = respiração curta. É o único controle de ritmo (não usar tags).
- Evite siglas e símbolos (o `preparar_narracao.py` converte números/unidades, mas revise).
- Evite cacofonias e sequências de "que… que…".
- Palavras técnicas com pronúncia ambígua (ex.: "rufo", "barbacã"): anote para conferir na escuta.

## 8. Anti-padrões (reprovam na auditoria)
"Você sabia que…", "Neste vídeo…", "Fica até o final", introdução do canal no começo, explicação com dois conceitos
numa frase, termo antes da função, problema sem relação com a solução anterior, frase > 22 palavras, informação
inventada, roteiro abaixo de 6 ciclos ou acima de 600 palavras, copiar frases das referências.
