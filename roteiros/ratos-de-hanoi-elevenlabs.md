# Os ratos de Hanói: narração para ElevenLabs

**Modelo:** Eleven v3 (as tags de emoção entre colchetes só funcionam no v3)
**Idioma:** Português (Brasil). Use uma voz nativa pt-BR, energética.
**Configurações:** Stability = Creative (ou Natural se sair exagerado) · Speed 1.1 · Speaker boost ligado
**Alvo:** cerca de 58 s. Se passar de 62 s, aumente o Speed para 1.15.

Cole no ElevenLabs só o bloco abaixo, sem os comentários. Ele não pode ter `#` nem os rótulos de cena.

```
[excited] Em mil novecentos e dois, Hanói pagou pra matar ratos... [sarcastic] e acabou com MAIS ratos do que nunca.

[curious] Os franceses tinham acabado de construir dezenove quilômetros de esgoto moderno debaixo da cidade. [whispers] Novo... escuro... quentinho. [mischievously] Perfeito... pra ratos.

[nervous] Com medo da peste, o governo mandou caçadores vietnamitas descerem nos túneis. [excited] Numa única semana de abril, eles trouxeram quase OITO MIL ratos mortos! [sighs] Não bastou.

[happy] Então veio a ideia genial: qualquer pessoa ganharia um centavo por rato. [sarcastic] E, pra não ter que contar cadáver... bastava entregar o rabo.

[excited] A cidade inteira virou caçadora! Entre abril e junho, foram entregues centenas de milhares de rabos.

[curious] Até que os fiscais começaram a notar uma coisa estranha... [surprised] ratos vivos, andando pela rua... SEM RABO!

[dramatically] Você vê... um rato morto paga um centavo uma vez só. [mischievously] Mas um rato vivo, sem rabo, continua fazendo filhotes. E cada filhote nasce com um rabo NOVINHO.

[fast] Então os caçadores cortavam o rabo e soltavam o rato de volta no esgoto. [laughs] Depois surgiram criações de ratos nos arredores da cidade, só por causa dos rabos!

[annoyed] O governo cancelou a recompensa... e os ratos continuaram lá.

[serious] Em mil novecentos e seis, a peste chegou a Hanói e matou pelo menos duzentas e sessenta e três pessoas.

[curious] E o esgoto que virou o paraíso dos ratos? [sarcastic] Tinha sido construído justamente... pra deixar a cidade mais limpa.
```

## Mapa de emoções, do áudio para a animação
O rosto do personagem em cada trecho, usando as 6 expressões da folha.

| Trecho falado | Tom da voz | Rosto do personagem | Luz |
|---|---|---|---|
| "Em mil novecentos e dois…" | empolgado → irônico | feliz → confuso | dia, quente |
| "Os franceses tinham acabado…" / "Perfeito… pra ratos" | curioso → sussurro malicioso | neutro → feliz | dia |
| "Com medo da peste…" / "OITO MIL" / "Não bastou" | tenso → empolgado → suspiro | nervoso → chocado → neutro | dia |
| "Então veio a ideia genial…" / "bastava entregar o rabo" | alegre → irônico | feliz | dia |
| "A cidade inteira virou caçadora!" | empolgado | gritando | dia |
| "Até que os fiscais…" / "SEM RABO!" | curioso → surpreso | confuso → chocado | dia (fim da luz quente) |
| **"Você vê…"** | dramático, pausado | neutro | **vira azul profundo** |
| "Mas um rato vivo…" / "NOVINHO" | malicioso | nervoso | noite |
| "Então os caçadores cortavam…" / "criações de ratos" | rápido → risada | chocado → gritando | noite |
| "O governo cancelou…" | irritado | nervoso | noite |
| "Em mil novecentos e seis, a peste…" | sério | chocado | noite |
| "E o esgoto…" / "mais limpa." | curioso → irônico | confuso → neutro | noite |

## Dicas
- Gere 3 ou 4 versões e escolha a que tiver a melhor entrega no "Você vê…" e no "SEM RABO!".
- Se uma tag for lida em voz alta, apague só essa tag. A emoção do texto (reticências e MAIÚSCULAS) já guia a voz.
- Os anos e números estão escritos por extenso de propósito, para a voz não ler "um nove zero dois".
- Exporte em MP3 44,1 kHz e salve como `audio/voice.mp3`. O texto sem tags continua em `roteiros/ratos-de-hanoi.txt` e serve para marcar o tempo das palavras.
