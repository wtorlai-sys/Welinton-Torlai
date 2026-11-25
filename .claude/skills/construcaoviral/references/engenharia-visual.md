# Engenharia visual — 3D low-poly com mascote 3D (decisão do usuário)

## Mundo
- Low-poly estilizado, flat/soft shading, materiais foscos, cores saturadas e claras. Sem texturas realistas;
  tijolo/telha/terra com padrão simples ou cor chapada + bordas.
- Cenário-base reaproveitável: bairro de casinhas com telhado vermelho/laranja, árvores de copa poligonal, gramado
  verde vivo, rua cinza com faixas, montanhas suaves e skyline cinza ao fundo (neblina leve), céu azul com nuvens
  poligonais brancas.
- Luz: sol suave lateral, sombras macias, ambiente claro. Chuva = céu cinza + traços brancos. Noite/frio = cena
  inteira azulada. Calor = cena rosada/alaranjada. Final pode ir para luz de entardecer (roxo/rosa).
- Continuidade: o **mesmo** objeto evolui no mesmo lugar do começo ao fim (máx. 2 locações extras para exemplos).

## Mascote 3D
- Boneco "bloquinho" de proporções cartunescas: cabeça grande, camiseta amarela, bermuda azul, tênis azul, cabelo
  escuro; olhos simples; capacete amarelo de obra quando vira construtor (marca o início do "Então você").
- Funções: escala (fica ao lado da peça para dar tamanho), agente (aponta, empurra, cava, toca), reação (comemora,
  enjoa — rosto verde, sua, leva susto), alívio cômico (close de reação 1–2× por vídeo).
- Acessórios por situação: guarda-chuva na chuva, balde na goteira, mochila ao chegar no prédio.
- Fim: comemora com confete; no CTA aparece grande no canto inferior direito acenando.

## Relação áudio → imagem (por ordem de frequência desejada)
1. **Literal no verbo** (~70%): o que a frase diz acontece no instante da palavra (empilhar → andares caem).
2. **Diagrama sobreposto**: setas de força, fluxo (pontinhos amarelos do peso descendo), cotas.
3. **Corte/raio-X**: solo em corte, objeto translúcido mostrando o interior, macro de material.
4. **Consequência exagerada**: tomba, desaba, racha, afunda, encharca — física cartunesca, legível.
5. **Piada visual**: reação do mascote, objeto-vítima, detalhe absurdo.
Não usar imagem "ilustrativa" genérica, B-roll, foto real ou contradição visual.

## Repertório de planos
- Abertura: plano médio do mascote ao lado do objeto inicial (casa, terreno).
- Geral/aéreo para escala e para colapsos.
- Médio interior para forças (viga, parede).
- Corte transversal para o que fica enterrado ou escondido.
- Macro para material (brita, manta, fresta).
- Close de reação do mascote (curto).
- Plano final aberto do objeto pronto (+ confete).

## Câmera
Plano-sequência virtual: dolly, grua, órbita, descida para o subsolo, subida para o topo. Transições por movimento
ou transformação no lugar (o objeto muda diante da câmera, "puf" de poeira). Cortes secos só em: montagem da lista
de acabamento e entrada/saída de close interior. Mudança visual relevante a cada 2–3 s.

## Falhas e tempo
- Toda falha importante é mostrada. Depois dela, **◀◀ rebobinar** (scanlines brancas horizontais + ícone ◀◀ branco
  no terço superior, ~1 s, imagem voltando) para o estado anterior antes da solução.
- **▶▶ timelapse** (ícone amarelo no canto superior direito) quando o "você" constrói algo demorado.
- Objeto-vítima (opcional, recomendado): sofre em todas as falhas e mantém os danos até o fim.

## Paleta de sinalização (consistente com as referências)
| Cor | Significado |
|---|---|
| Vermelho | força que causa problema, peso, calor, puxão, erro |
| Azul | água, vento, frio, compressão/aperto |
| Verde | reação que segura, solução funcionando |
| Amarelo | termo técnico revelado, cotas, destaque de peça |
| Cinza/branco | rótulo neutro de objeto |
Nota: o vermelho de sinalização é parte do formato; no repositório, `PALETTE.accent` continua sendo o vermelho do
elemento-foco — use-o para as setas/etiquetas de problema.
