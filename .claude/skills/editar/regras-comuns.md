# Regras comuns das skills edit-*

Lidas uma vez por sessão por todas as skills de edição. Mudou uma regra geral? Mude aqui, não em cada skill.

Repositório: `Welinton-Torlai/` (raiz). Ferramentas: `ferramentas/` (scripts em `ferramentas/scripts/`, Python do sistema `python3`).
Perfil: `ferramentas/perfis/<nome>/` (padrão: `canal`). O nome do perfil vem do estado do vídeo.
Montagem do fluxo e decisões: `ferramentas/montagem.md`.

## 0. Onde fica cada coisa (um vídeo = um "slug", ex.: `2026-11-16_monetizacao`)
| O quê | Onde |
|---|---|
| Estado, briefing, caderno, planos | `episodios/<slug>/_CLAUDE/` (`projeto.json`, `briefing.md`, `aprendizados.md`, `plano-cenas.md`) |
| Narração original (nunca alterada) | `episodios/<slug>/audio/` |
| Entregas finais | `episodios/<slug>/FINAL/<slug>_v01.mp4`, `_v02`… |
| Prévias e stills de revisão | `episodios/<slug>/_CLAUDE/revisao/` |
| Mídia que o Remotion lê | `public/<slug>/` (cópia da narração, timestamps, legendas, sfx, música) |
| Código do vídeo | `src/episodes/<slug>/` (composição `Video.tsx`, cenas em `scenes/`, kit compartilhado em `src/episodes/monetizacao/kit.tsx` até virar `src/kit/`) |

## 1. Conversa e segurança
- Falar com Welinton em português, de forma curta. Sempre com a sugestão já dita ("Sugiro X porque Y. Prefere outra coisa?").
- Nunca mover, renomear ou apagar arquivos do projeto nem a narração original.
- Nunca sobrescrever um arquivo já entregue: versão nova (`_v02`, `_v03`).
- Apagar, quando precisar, é mover para `episodios/<slug>/_CLAUDE/lixeira/` e deixar Welinton apagar.
- O contêiner da nuvem é apagado depois de um tempo: ao fechar cada etapa, commit e push no branch de trabalho (MP4 grandes > 90 MB não vão para o git; avisar e manter só no disco/entregar pelo chat).

## 2. Formato e regras técnicas (firmes)
- Horizontal 16:9, 1920×1080, 30 fps, H.264 CRF 17, yuv420p, AAC 48 kHz. Duração = a narração inteira.
- Tudo determinístico: nada de `Math.random()` sem seed, `Date.now()`, `delta` de `useFrame`. Tudo calculado de `useCurrentFrame()`.
- Área segura: nada importante nos 9% de baixo (barra do player); nos últimos 20 s, livre o quarto inferior direito (cartões finais).
- Este fluxo segue o perfil `ferramentas/perfis/<nome>/`, **não** o `STYLE_GUIDE.md` (esse é da série vertical "E se…?").

## 3. Conteúdo (firmes)
- Não inventar estatística, valor ou fato que não esteja na narração ou no briefing.
- Comparação sem dado oficial leva o selo "* comparação ilustrativa".
- Interfaces inspiradas em plataformas (YouTube etc.) são ilustrativas: nunca copiar a interface oficial nem usar o nome do produto como título ("Painel do canal", não "YouTube Studio").
- Sem imagem de banco no lugar de animação. Sem emoji (o Chromium do render não tem a fonte): ícones SVG.

## 4. Estado do vídeo sem ler inteiro
Ler e mudar sempre pelo script `ferramentas/scripts/estado.py` (escrito na primeira vez que a `edit-iniciar` rodar):
- `estado.py <pasta> status` mostra onde o vídeo está;
- `estado.py <pasta> <bloco>` resume um bloco (`--json` para o bloco inteiro);
- `--set <caminho> <valor>`, `--etapa <etapa>=<status>`;
- `--pendencia <etapa> "<texto>"` anota, `--resolver <id>` resolve.
Status: `pendente`, `em_andamento`, `aguardando_aprovacao`, `concluido`, `nao_precisa`. Ids estáveis (`c01` cena, `sfx12` som, `p03` pendência).

## 5. Caderno de aprendizados (`_CLAUDE/aprendizados.md`)
Anotar na hora, durante a revisão de qualquer etapa, toda correção, elogio ou preferência que vale para outros vídeos:
- "números maiores", "esse whoosh ficou ótimo": **anota**;
- "tira essa frase da cena 4": **não anota** (só deste vídeo);
- na dúvida, anota com "(talvez só deste vídeo)".
Formato: `- [ ] <etapa> · <o que foi pedido, com contexto> · <dd/mm>`. Aplicado: `- [x] … → <onde entrou>`; só daquele vídeo: `- [-] …`. Nunca apagar linhas. Anotar não é mudar (seção 7).

## 6. Trechos, ponto salvo e fechar uma etapa
- O plano das cenas olha o vídeo inteiro. Render e som podem ir por trecho ("o gancho", "até 0:50"). Um item pertence ao trecho em que começa.
- **Ponto salvo:** trecho ou etapa terminado, revisões aplicadas, entrega gerada. Só aí sugerir `/clear` e `/editar`.
- **Pendência:** pedido não aplicado é anotado na hora (`estado.py --pendencia`) e aparece no status.
- **Fechar a etapa:** marcar `concluido`, dizer quantos aprendizados ficaram anotados, commit + push, sugerir `/clear` e `/editar`.
- Nada de encadear etapas sozinho: Welinton aprova uma e diz "sim" para a próxima.
- Se algo aprovado mudar depois (ex.: a narração foi trocada depois do plano), avisar o que precisa ser refeito.

## 7. Aplicar os aprendizados (quando Welinton pedir: `/editar aprendizados`)
1. Ler as linhas `- [ ]` dos cadernos dos vídeos.
2. Propor onde cada uma entra: gosto → perfil (`identidade.md`, `estilo-*.md`, `catalogo.md`); ofício (vale para qualquer vídeo) → skill da etapa; o que vale para todas → este arquivo.
3. Welinton filtra. Gravar só o aprovado, mostrando antes o texto das mudanças maiores. Marcar cada linha. Commit.
