# Parabéns! Você construiu um elevador — ENTREGA 5: Produção

Caminho: **A) código — Remotion + React Three Fiber** (kit `src/construcaoviral/`).

| Peça | Arquivo |
|---|---|
| Linha do tempo (cabine, contrapeso, freios, portas, câmera, rebobinares) | `src/construcaoviral/episodios/elevador/linha.ts` |
| Cena 3D (prédio em corte, poço, cabine, máquina, limitador, amortecedores) | `src/construcaoviral/episodios/elevador/Cena.tsx` |
| Composição + agenda de etiquetas/rótulos/setas/cotas | `src/construcaoviral/episodios/elevador/Video.tsx` (composição `Elevador`) |
| Novo no kit | `src/construcaoviral/kit/Geom.tsx` (Bloco, Barra entre 2 pontos, Mola helicoidal) |
| SFX + trilha | `scripts/construcaoviral_elevador_audio.py` (usa `scripts/construcaoviral_sfx_lib.py`) |
| Mixagem | `scripts/construcaoviral_mixar.sh elevador` |

## Organização
- Prédio sempre em corte (estilo casa de bonecas) → não precisa de transição de corte; a câmera percorre o poço.
- A posição da cabine é uma função do tempo (`cabineY`); o contrapeso é o espelho dela na polia (`31,2 − y`);
  a câmera "segue" a cabine gerando keyframes a partir da mesma função (subidas e quedas sempre enquadradas).
- Legendas: 1 palavra por vez a ~66% da altura; 70% no close do freio; 24% no fundo do poço; desvio automático
  dos rótulos. Palavras amarelas: queda doze andares, contrapeso, guias, cabos de tração, freio da máquina, freio
  de segurança, limitador de velocidade, amortecedores, intertravamento, elevador.
- Música: pluck leve 112 BPM com ducking; corta no estrondo do gancho; na piada "música que ninguém pediu"
  a trilha some e entra uma "música de elevador" (bossa sintética) por 2 s.
- Master −14 LUFS, voz ~14 dB acima do fundo. Render com `--concurrency=1` + `checar_frames.py`.

## Prompts (caminho B, se quiser gerar fora): usar o bloco de estilo da piscina (`projects/piscina/05-producao.md`)
trocando o cenário por: `cutaway view of a 12-story building with the front removed, elevator shaft, open-front
elevator car, counterweight, steel guide rails, machine room on the roof`.
