# Montagem do fluxo de edição

Fase atual: 4 (plano do fluxo) · Atualizado em 16/11/2026

## Ambiente
- Sistema: Linux (contêiner na nuvem, sem GPU) · Python 3.13 · FFmpeg 6.1 · Node.js 22 · Git 2.43
- Já disponível: Remotion 4 + React Three Fiber (projeto Welinton-Torlai), faster-whisper (medium + large-v3), Chromium/Playwright
- Atenção: o contêiner é apagado depois de um tempo; skills e ferramentas ficam no repositório (commit no branch)

## Decisões
- Revisão: vídeo pronto (MP4), sem programa de edição
- Tipo e formato: vídeo narrado (voz + motion graphics, sem apresentador), horizontal 16:9, 1920×1080, 30 fps, YouTube formato longo
- Duração: a da narração, inteira (ex.: teste de monetização = 1:44); média ~1,5 min
- Pastas: cada vídeo em `episodios/AAAA-MM-DD_nome/` (`audio/` original intocado, `_CLAUDE/` estado+caderno, `FINAL/` versões _v01…); ferramentas em `Welinton-Torlai/ferramentas/`; skills em `Welinton-Torlai/.claude/skills/`
- Transcrição: narração chega em MP3 sem timestamps → faster-whisper medium (tempo por palavra) + large-v3 (texto/números); divergência em número = texto do large-v3, tempo do medium, listado para conferir. Timestamps do ElevenLabs, se vierem, têm prioridade
- Notas faladas: não se aplica (narração pronta)
- Cortes: não se aplica (narração usada inteira); preparar confere duração e silêncios
- Animação: densa o vídeo todo (algo novo a cada 1,5–3 s, sincronizado à fala), gancho mais rápido; tela cheia de motion graphics + 3D nos impactos; Remotion + React Three Fiber; legendas em blocos de 2–3 palavras com destaque; nada de estatística inventada, comparações sem dado oficial marcadas "ilustrativa", interface inspirada no YouTube sem copiar
- Câmera: virtual; push-in lento constante, punch nas revelações, tremida 6–10 frames nos impactos, parallax, câmera casada com as animações, calma nos momentos de suspense; feita junto com o motion-render
- Som: SFX gerados por código + pasta opcional `ferramentas/sons/<categoria>/` (prioridade quando existir); música gerada por código (faixa enviada pela pessoa substitui); voz é a referência, música com ducking, normalização -14 LUFS
- Revisões: 1) plano das cenas no chat 2) prancha de stills 3) prévia do gancho com som 4) vídeo final em FINAL/ com versão nova
- Correções: pelo chat, citando tempo ou nº da cena
- Nomes: prefixo `edit-`; skill mestra `/editar`

## Perfil
- canal (`ferramentas/perfis/canal/`): perfil inicial a partir do briefing — identidade, estilo-motion, estilo-camera, estilo-som, catálogo. Falta: referências medidas (opcional, depois)

## Fluxo aprovado
- (fase 4)

## Skills escritas
- [ ] regras comuns
- [ ] skill mestra /editar

## Próximo passo
Fase 4: aprovar a lista de etapas do fluxo.
