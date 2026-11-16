# Identidade visual — perfil "canal"

Origem: briefing do vídeo de monetização (16/11/2026). Perfil inicial, sem referências medidas ainda. Tendência, não regra.

**Aprovado por Welinton em 16/11/2026** (vídeo final de monetização, v01): este é o padrão de todo vídeo novo para o YouTube. Referência viva: `episodios/2026-11-16_monetizacao/` (plano, pranchas, vídeo final) e o código em `src/episodes/2026-11-16_monetizacao/`.

## Formato
- Horizontal 16:9, 1920×1080, 30 fps, YouTube formato longo (decidido em 16/11/2026)
- Área segura: nada importante nos 9% de baixo (barra do player) nem, nos últimos 20 s, no quarto inferior direito (cartões finais)

## Cores
- Fundo: azul-marinho quase preto, degradê `#0A1124` → `#04060C`, com brilhos radiais suaves de cor
- Dinheiro, lucro, crescimento: verde `#22E07A` (escuro `#0B8F4B`)
- YouTube: vermelho `#E63B2E` — só em elementos do YouTube (botão de play, ícone de Shorts) ou no foco da piada
- Apoio: ciano `#38D6FF` (dados, interface), dourado `#FFC83D` (moedas, destaque de palavra), roxo `#9B6CFF` (brilho de fundo)
- Texto: branco `#F4F7FF`; secundário `#8C9AC0`

## Fontes
- Destaques, números e legendas: Montserrat Black (900)
- Interface (rótulos, painéis): Montserrat 600–800
- Arquivos em `public/fonts/`

## Material
- Painéis de vidro escuro: degradê azul translúcido, borda fina na cor do assunto, brilho externo suave, sombra longa
- Grade de "chão" em perspectiva andando (parallax) + grade de pontos de HUD + partículas e símbolos ($, R$, ▲, %) flutuando bem fracos
- 3D (React Three Fiber) só em impactos: moedas douradas metálicas, botão de play
- Ícones vetoriais desenhados no código (SVG), traço arredondado ou preenchidos

## Logotipo e marcas
- YouTube: botão de play vermelho genérico desenhado no código; interfaces inspiradas no YouTube Studio, nunca cópia (chamar de "Painel do canal", não "YouTube Studio")

## Nunca usar
- Imagem de banco genérica no lugar de animação
- Estatística inventada; comparação sem dado oficial sem o selo "* comparação ilustrativa"
- Vermelho espalhado fora dos elementos do YouTube
- Emoji (o Chromium do render não tem fonte de emoji): usar ícones SVG
