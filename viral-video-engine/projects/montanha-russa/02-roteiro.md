# Parabéns! Você construiu uma montanha-russa — ENTREGA 2: Roteiro

## Estrutura narrativa
| Bloco | Peça / problema |
|---|---|
| Gancho | carrinho solto → voa na 1ª curva |
| Porquê | 30 m → mais de 80 km/h; na curva tudo quer seguir reto |
| Ciclo 1 | voa → **rodas inferiores** |
| Ciclo 2 | corpo jogado pro lado → **curva inclinada** |
| Ciclo 3 | precisa subir → **subida de corrente** |
| Ciclo 4 | corrente arrebenta → **trava antirretorno** + é por isso (clac-clac) |
| Ciclo 5 | loop redondo esmaga → **loop em gota** + é por isso (nenhum loop é redondo) |
| Ciclo 6 | de cabeça pra baixo, quem segura? → **trava de segurança** |
| Ciclo 7 | chega rápido demais → **freio magnético** |
| Ciclo 8 | dois carrinhos no trilho → **blocos** + é por isso (para do nada) |
| Acabamento / Uso / Parabéns / CTA | |

## Roteiro completo
<!-- NARRACAO:INICIO -->
# GANCHO
Se você colocar um carrinho num trilho e soltar lá do alto, você não vai ter uma montanha-russa, vai ter um carrinho voando na primeira curva.

# PORQUÊ
Porque, descendo de trinta metros, ele passa de oitenta quilômetros por hora. E na curva, tudo que está rápido quer seguir reto.

# CICLO 1 — rodas inferiores
Então você coloca rodas também embaixo do trilho, além das de cima e das do lado.
O trilho fica abraçado, e o carrinho não sai nem de cabeça pra baixo.
Essas são as rodas inferiores.

# CICLO 2 — curva inclinada
Mas, na curva, o corpo de quem está dentro é jogado pro lado com força.
Então você deita o trilho pra dentro da curva, como numa pista de corrida.
Agora a força empurra você contra o banco, e não pra fora.
Essa é a curva inclinada.

# CICLO 3 — subida de corrente
Mas, pra descer, o carrinho primeiro precisa subir.
Então você coloca uma corrente no meio do trilho, puxada por um motor, que arrasta o carrinho até o topo.
Essa é a subida de corrente.

# CICLO 4 — trava antirretorno
Mas, se a corrente arrebentar, o carrinho volta de ré lá de cima.
Então você põe ao lado da corrente uma escadinha de dentes. Embaixo do carrinho, uma garra vai pulando de dente em dente.
Se ele tentar voltar, a garra trava.
Essa é a trava antirretorno.
É por isso que a subida da montanha-russa faz clac, clac, clac.

# CICLO 5 — loop em gota
Mas agora você quer dar uma volta de cabeça pra baixo.
Num loop redondo, o carrinho precisa entrar tão rápido que, lá embaixo, seu corpo fica seis vezes mais pesado.
Então você estica o loop pra cima, em forma de gota.
Embaixo, a curva é aberta e suave. Em cima, é fechada, e o carrinho passa devagar sem cair.
Esse é o loop em gota.
É por isso que nenhum loop de montanha-russa é redondo.

# CICLO 6 — trava de segurança
Mas, de cabeça pra baixo, quem segura você no banco?
Então você desce uma barra sobre os ombros, que trava sozinha e só abre na estação.
Essa é a trava de segurança.

# CICLO 7 — freio magnético
Mas, no fim do percurso, o carrinho ainda chega rápido demais.
Então você põe ímãs fortes no trilho e uma lâmina de metal embaixo do carrinho.
Quando a lâmina passa entre os ímãs, ela freia sem encostar em nada, e funciona até sem energia.
Esse é o freio magnético.

# CICLO 8 — blocos
Mas, enquanto um carrinho termina a volta, outro já saiu da estação. Se um alcançar o outro, eles batem.
Então você divide o trilho em trechos, e cada trecho só aceita um carrinho por vez.
Se o da frente não liberou, o de trás fica preso num freio esperando.
Esses são os blocos.
É por isso que, às vezes, o carrinho para do nada antes da estação.

# ACABAMENTO
Coloque uma câmera pra foto na descida, uma fila de duas horas e alguém gritando antes de sair do lugar.

# USO + PARABÉNS
Agora é só levantar os braços na primeira descida.
Parabéns! Você construiu uma montanha-russa!

# CTA
Se você já sabia, comente "engenheiro". Se não sabia, comente "passageiro".
<!-- NARRACAO:FIM -->

## Verificação técnica
| Afirmação | Verdadeira? | Raciocínio |
|---|---|---|
| De 30 m, passa de 80 km/h | ✔ | v = √(2·9,8·30) ≈ 24 m/s ≈ 87 km/h sem atrito; com perdas, > 80 km/h |
| Rodas em cima, do lado e embaixo do trilho (upstop) | ✔ | configuração padrão de montanhas-russas de aço |
| Curva inclinada (sobrelevação) direciona a força para o banco | ✔ | |
| Subida por corrente movida a motor | ✔ | lift hill |
| Trava antirretorno: cremalheira + lingueta; produz o clac-clac | ✔ | anti-rollback |
| Loop redondo mínimo: 6 g no ponto mais baixo | ✔ | v² no topo = gR → no fundo v² = 5gR → 5g + 1g = 6g |
| Loop em gota (clotoide): raio grande embaixo, pequeno em cima | ✔ | por isso loops modernos não são circulares |
| Barra de ombro que trava e só abre na estação | ✔ | travas com redundância, liberadas na estação |
| Freio magnético por correntes parasitas, sem contato, funciona sem energia | ✔ | ímãs permanentes; não depende de eletricidade |
| Trilho dividido em blocos; só um trem por bloco; o de trás para no freio | ✔ | sistema de blocos (block brakes) |
| Carrinho às vezes para antes da estação | ✔ | parada no freio de bloco esperando a estação liberar |

## Auditoria (F3)

### Métricas
| Métrica | Valor | Alvo |
|---|---|---|
| Palavras | ~494 ✔ | 470–560 |
| Duração estimada | ~148 s ✔ | 140–165 s |
| Média palavras/frase | ~11 ✔ | 10–14 |
| Frases > 22 palavras | 1 (gancho, molde com 3 pausas) — a da trava foi dividida | 0 |
| Termos | 8 ✔ | 6–13 |
| Perguntas | 2 → **1** (só a objeção "quem segura você no banco?") | ≤ 1 |

### Três ganchos
| # | Gancho | Ident. | Desastre | Clareza | Visual | Total |
|---|---|---|---|---|---|---|
| A | Se você colocar um carrinho num trilho e soltar lá do alto, você não vai ter uma montanha-russa, vai ter um carrinho voando na primeira curva. | 5 | 5 | 5 | 5 | **20** |
| B | Se você quer uma montanha-russa e solta um carrinho de supermercado ladeira abaixo, você vai ter emoção… por três segundos. | 4 | 3 | 4 | 4 | 15 |
| C | Montanha-russa parece simples: subir e descer. Se você fizer só isso, o carrinho sai voando na primeira curva. | 3 | 4 | 4 | 4 | 15 |

**Escolhido: A** — molde de contraste completo, desastre visual imediato e específico (carrinho voando na curva).

### Checklist
- [x] "Se você…" no 0 s · desastre concreto · 8 ciclos encadeados (voa → rodas; jogado → inclinação; subir → corrente; arrebenta → trava; loop redondo → gota; de cabeça pra baixo → trava; rápido → freio; dois carrinhos → blocos)
- [x] termo depois da função (8) · 3 "é por isso que" · números traduzidos (30 m → 80 km/h; 6 vezes mais pesado)
- [x] humor (fila de duas horas, alguém gritando antes de sair) · acabamento + uso + "Parabéns! Você construiu uma montanha-russa!" · CTA binário (engenheiro × passageiro)
- [x] nenhuma frase das referências; fatos conferidos (tabela acima)

### Qualidade
- Maior "aha" esperado: clac-clac (ciclo 4) e loop em gota (ciclo 5) — ficam no meio do vídeo, ajudando a segurar o trecho central (hipótese).
- Pronúncias a conferir: "antirretorno", "clac, clac, clac".
