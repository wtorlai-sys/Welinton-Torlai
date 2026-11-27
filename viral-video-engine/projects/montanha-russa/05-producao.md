# Parabéns! Você construiu uma montanha-russa — ENTREGA 5: Produção

Caminho A (código). Composição `MontanhaRussa`.

| Peça | Arquivo |
|---|---|
| **Novo no kit**: trilho 3D (curva, "para cima" por transporte paralelo, inclinação por ponto, malha com trilhos/coluna/dormentes/pilares, física de gravidade) | `src/construcaoviral/kit/Trilho.tsx` |
| Novas poses do mascote: `sentado`, `sentado-bracos`, `sentado-susto`, `grita` | `src/construcaoviral/kit/Mascote3D.tsx` |
| Fundo sem nuvens (`nuvens={false}`) quando elas atrapalham | `src/construcaoviral/kit/Mundo.tsx` |
| Linha do tempo, percursos e câmera | `src/construcaoviral/episodios/montanha-russa/linha.ts` |
| Cena 3D | `src/construcaoviral/episodios/montanha-russa/Cena.tsx` |
| Composição + etiquetas | `src/construcaoviral/episodios/montanha-russa/Video.tsx` |
| SFX + trilha | `scripts/construcaoviral_montanha-russa_audio.py` |
| Mixagem | `scripts/construcaoviral_mixar.sh montanha-russa` |

Decisões: a câmera segue o carrinho por função (sem trepidação); closes usam `mira` (câmera presa ao carrinho mirando
uma peça dele); curvas largas usam `olha` (câmera fixa mirando o carrinho, porque no vertical a curva não cabe).
"CLAC!" na tela no instante de cada "clac" falado. Música 124 BPM com corte no splash e na batida.
