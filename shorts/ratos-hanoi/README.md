# Os ratos de Hanói (1902): Short de 60 s, estilo @ricksclips3000

Montado com a skill `ricksclips-short-style` (palco three.js em `shorts/stage`). Todos os assets foram gerados em código, sem Higgsfield:

| Etapa | Ferramenta | Saída |
|---|---|---|
| Personagem + 6 expressões (SVG → PNG sem fundo) | `shorts/tools/make_puppets.mjs` | `puppets/hero`, `puppets/rato*` |
| Camadas + rig (pescoço, ombros, quadris) | `shorts/tools/rig_puppets.py` | `rig.json`, `preview.png`, `emotions.png` |
| Texturas pintadas + fundo 21:9 | `shorts/tools/paint.py` | `textures/`, `bg/hanoi.jpg` |
| Modelos 3D (GLB) | `shorts/tools/make_models.mjs` + `models.js` | `models/esgoto, balcao, gaiola, poste.glb` |
| Trilha pizzicato (Karplus-Strong) | `shorts/tools/music.py` | `audio/music.mp3` |
| Cena / planos / luz | `shorts/tools/build_short.py` | `short.json` |

A narração está na velocidade natural da gravação (93,7 s). `build_short.py . <fator>` permite acelerar se for necessário.
As marcações de palavras vêm do faster-whisper (`audio/words.json`).

```bash
cd shorts/stage && npm install three@0.187.0
cd ../ratos-hanoi
python3 ../tools/build_short.py .
node ../stage/render.mjs short.json out.mp4 --stills   # checagem quadro a quadro
node ../stage/render.mjs short.json out.mp4            # render final 1080x1920
```

Personagem secundário (funcionário francês) e o palco vêm do pacote da skill.
Este short usa as regras da skill (contorno #271925, legenda a 70%, câmera que desliza), não o `STYLE_GUIDE.md` do Remotion.
