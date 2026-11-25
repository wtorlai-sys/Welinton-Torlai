# F5 — Direção e produção (só com `audio_aprovado: true`)

## 1. Ler a narração real
- `03-narracao/medicao.json` (duração, ppm) e `03-narracao/timestamps.json` (tempo de cada palavra).
- `scripts/marcar_tempos.py <slug>` → `03-narracao/frases.json`: início/fim real de cada frase e de cada palavra.
- Marque no roteiro os instantes de: cada verbo de ação, cada termo ("Esse é o…"), cada "Mas", cada número.
  Esses instantes são as âncoras de corte/evento. Use os tempos reais, nunca estimativas por contagem de palavras.

## 2. Divisão em cenas (storyboard — ENTREGA 4)
- 1 cena por batida narrativa (ação, nome, ponte, problema). Cenas de 1,5–5 s; câmera contínua entre elas.
- Para cada linha: tempo real início–fim, trecho exato do áudio, cena, o que se vê, movimento de câmera,
  gráficos (pílulas, rótulo, setas, cotas), SFX.
- Regra: **toda cena tem um motivo no áudio**. Se um trecho não tem imagem óbvia, ele está mal escrito ou precisa de
  diagrama — não de enchimento.
- Marque os re-ganchos (desastres no meio) e os ◀◀ / ▶▶.

## 3. Caminhos de produção
### A) Código — Remotion + React Three Fiber neste repositório (preferido)
Por quê: as referências são animação 3D renderizada; código dá controle exato de tempo (frame a frame pelos
timestamps), determinismo e reaproveitamento do mundo entre vídeos.
- Composição 1080x1920, 30 fps, H.264 CRF 16–18 (`remotion.config.ts`).
- Determinismo: tudo derivado de `useCurrentFrame()`; sem `Math.random()` sem seed, sem `Date.now()`, sem `delta`.
- Reaproveitar: `src/components/CameraRig.tsx`, `Lighting.tsx`, `LightFX.tsx`, `Captions.tsx` (legenda 1 palavra a
  partir do `timestamps.json`), `src/lib/timestamps.ts`, `src/style/materials.ts`, `scripts/gerar_sfx.py`,
  `scripts/mixar.sh`, `scripts/render-stills.mjs`.
- **Exceção registrada**: neste formato o personagem é o **mascote 3D low-poly** (não `Character2D`). Criar
  `src/construcaoviral/` com: `Mascote3D.tsx` (bloquinho: cabeça, tronco amarelo, bermuda azul, membros
  articulados, capacete opcional, poses: neutro, aponta, comemora, enjoado, sua, susto), `MundoLowPoly.tsx`
  (bairro-base), `Etiquetas.tsx` (pílula, rótulo amarelo, setas, cotas, ícones), `Rebobinar.tsx` (◀◀ scanlines),
  `Timelapse.tsx` (▶▶), `Confete.tsx`, `CTAFinal.tsx`. Reutilizar entre episódios.
- Low-poly: `flatShading: true`, geometrias simples (box, cylinder, icosahedron baixo), poucas cores por material.
- Colapsos: animações por keyframes determinísticos (rotação/queda com easing + partículas de poeira com seed).
- QC: renderizar stills nos instantes-chave (gancho, cada termo, cada desastre, final) e abrir cada imagem.

### B) Geradores externos (imagem + animação)
Quando o usuário preferir IA generativa. Para cada cena entregue:
- **Prompt de imagem** (inglês funciona melhor na maioria dos geradores): estilo fixo +
  conteúdo da cena + enquadramento + iluminação + o que NÃO deve aparecer. Bloco de estilo fixo:
  `low-poly 3D render, flat shading, bright saturated colors, soft sunlight, soft shadows, stylized suburban
  neighborhood, red-roof houses, low-poly trees, simple blocky cartoon mascot with yellow t-shirt and blue shorts,
  clean, no text, vertical 9:16`.
- **Prompt de animação** (imagem → vídeo): movimento de câmera + ação física, 3–5 s, sem cortes.
- Consistência: mesma seed/referência de personagem; manter o objeto no mesmo lugar.
- Textos, legendas, setas e etiquetas são aplicados na edição, nunca gerados na imagem.

## 4. Edição (ENTREGA 5)
Documente em `05-producao.md`: organização das cenas, transições (movimento contínuo; ◀◀ após falha; ▶▶ em
construção), legendas (posição por cena para não cobrir a ação), palavras destacadas (termos + palavra do
desastre), pílulas/setas/cotas com tempo de entrada/saída, cue sheet de SFX com tempos reais, música (estilo,
volume, ducking), master −14 LUFS. Siga `edicao-e-retencao.md`.

## 5. Encerramento
Auditoria final (`auditoria.md` → `06-auditoria.md`), stills conferidos, `estado.py <slug> producao_pronta true` e
`auditoria_final true`. Render final em `viral-video-engine/output/<slug>.mp4`.
