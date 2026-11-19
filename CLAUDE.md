# CLAUDE.md

Projeto de shorts verticais **"E se…?"** em Remotion + React Three Fiber (`@remotion/three`).

## Regra obrigatória
**Antes de criar ou alterar qualquer cena, componente, material, câmera, legenda ou render,
leia e siga [`STYLE_GUIDE.md`](./STYLE_GUIDE.md).** Ele é a fonte da verdade do visual.
Se um pedido conflitar com o guia, aponte o conflito antes de implementar.

- Reaproveite os blocos existentes (`src/style/materials.ts`, `src/components/*`,
  `src/characters.ts`) em vez de criar materiais/personagens novos do zero.
- **Personagem é 2D** (`src/components/Character2D.tsx`) dentro de cenário 3D. Não usar o `Character.tsx` (3D, legado).
- Personagens recorrentes só mudam de roupa editando `src/characters.ts`.
- Vermelho só via `PALETTE.accent` e só no elemento-foco da piada.
- Tudo determinístico: sem `Math.random()` sem seed, sem `Date.now()`, sem `delta` de `useFrame`.
- Toda cena tem pelo menos 1 elemento-gag e `captionY` escolhido para não cobrir a ação.

## Comandos
```bash
npm install
npm run studio                       # Remotion Studio
npm run stills                       # renderiza stills de QC (out/stills/)
npx remotion render TestScene out/test.mp4   # H.264, CRF 17 (remotion.config.ts)
npm run typecheck
```

## Ao terminar qualquer cena
Renderize stills, abra cada imagem e passe pelo **Checklist de aprovação** do STYLE_GUIDE.md.
Corrija o que falhar antes de entregar.

## Vídeos estilo Roblox (bonecos 3D de blocos)
Para qualquer vídeo nesse formato, leia antes a pasta [`ROBLOX VÍDEO/`](./ROBLOX%20VÍDEO/README.md):
estrutura do roteiro, estilo visual, pipeline e lições aprendidas. Tem que ser **animação** (nunca
"vídeo de foto"); personagens vêm do Customuse.
