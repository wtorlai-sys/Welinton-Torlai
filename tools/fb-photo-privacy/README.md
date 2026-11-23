# Privacidade das fotos do Facebook → "Somente eu"

Automação **local** em Playwright que abre um navegador **visível** no seu computador,
espera você fazer login manualmente e, pela própria interface do Facebook, muda o público
das suas fotos e álbuns para **Somente eu**, verificando cada alteração.

> ⚠️ Rode no **seu computador**, não em servidor/nuvem: o login é manual, numa janela que
> você vê. Automação de navegador pode ir contra os Termos do Facebook mesmo em uso pessoal;
> por isso o ritmo é lento, há teto por sessão e qualquer verificação/bloqueio faz o script parar.

## O que o script faz e o que NUNCA faz

| Faz | Nunca faz |
|---|---|
| Abre o Facebook e espera você logar e apertar ENTER | Pedir, ler ou gravar senha, cookies ou tokens |
| Lê o público de cada foto/álbum (mapeamento só leitura) | Apagar fotos, excluir álbuns, arquivar, mover para lixeira |
| Clica só em: ícone de público, menu "…", "Editar público", "Editar álbum", "Somente eu", "Concluído/Salvar" | Desmarcar você de fotos, alterar dados pessoais ou outras configurações |
| Recarrega a página e confere se ficou "Somente eu" | Declarar uma foto privada sem conferir depois |
| Para tudo diante de CAPTCHA, checkpoint, "bloqueado temporariamente" ou logout | Tentar contornar verificações de segurança |

Toda ação passa por `safeClick`, que **recusa** qualquer elemento cujo texto contenha
"excluir", "apagar", "arquivar", "lixeira", "remover", "desmarcar", "marcação", "ocultar",
"denunciar", "bloquear" etc. (lista em `src/config.mjs → DANGER_RX`).

## Instalação (uma vez)

Requer Node.js 18+.

```bash
cd tools/fb-photo-privacy
npm install
npx playwright install chromium
npm run selftest        # teste offline contra páginas falsas — não acessa o Facebook
```

## Passo a passo

```bash
npm run login       # 1. abre o navegador; você loga; aperta ENTER no terminal
npm run map         # 2. mapeia fotos e álbuns (só leitura) -> data/relatorio.md
npm run scan        # 3. (opcional, lento) lê o público atual de cada foto, sem alterar
npm run test-one    # 4. altera UMA foto, verifica e pede autorização (digite SIM)
npm run run         # 5. aplica em massa (só depois do SIM); retoma de onde parou
npm run test-album  # 6. testa UM álbum criado por você e pede autorização
npm run run-albums  # 7. aplica aos demais álbuns criados por você
npm run report      # 8. relatório final -> data/relatorio.md e data/relatorio.json
```

Opções: `npm run test-one -- --fbid 123456` (escolher a foto), `npm run run -- --max 50`
(teto de alterações nesta sessão; padrão 120), `npm run test-album -- --album 987`.

O progresso fica em `data/state.json`: o que já foi alterado/verificado não é repetido.
Se o Facebook pedir verificação ou limitar ações, o script salva, para e você roda de novo
mais tarde.

## O que é mapeado

- **Suas fotos** (`/photos_by`) — fotos publicadas por você
- **Fotos suas** (`/photos_of`) — fotos em que você foi marcado(a)
- **Álbuns** (`/photos_albums`) e as fotos de cada um, classificados em: fotos do perfil
  antigas, fotos da capa antigas, fotos da linha do tempo (publicações com foto), uploads do
  celular, álbuns criados por você, outros automáticos
- Foto de perfil e capa **atuais** (identificadas para não serem tocadas)

## Exceções registradas (intervenção manual)

| Caso | Por quê |
|---|---|
| Foto de perfil/capa **atual** | O Facebook exige que sejam públicas |
| Fotos de outras pessoas / em que você foi marcado | Só o autor controla o público |
| Foto com público definido pelo álbum | Tratada via `run-albums` (álbum alterado cobre a foto) |
| Álbuns automáticos (Perfil, Capa, Linha do tempo, Celular) | Não têm público de álbum; cada foto é alterada individualmente em `run` |
| "Somente eu" indisponível, restrições do Facebook | Registrado com o motivo |
| Alteração não confirmada após recarregar | Fica como falha, **não** conta como privada |

Importante: alterar o público de um álbum **não** é tratado como se mudasse as publicações
com fotos — cada foto continua sendo verificada individualmente.

## Complemento manual útil

Em *Configurações → Privacidade → Limitar quem pode ver publicações antigas* o Facebook
muda de uma vez publicações antigas públicas para **Amigos** (não "Somente eu"). Pode ser
um primeiro passo seguro; depois esta automação leva as fotos a "Somente eu".

## Se algo falhar

- A interface do Facebook muda com frequência. Os textos/rótulos procurados ficam todos em
  `src/config.mjs` (PT-BR, PT-PT e EN). Capturas de tela de cada falha vão para `data/screenshots/`.
- 3 falhas seguidas interrompem a execução (sinal de que a interface mudou).
- Para "esquecer" a sessão, apague a pasta `.fb-profile/`. Para recomeçar o mapeamento, apague `data/`.
- `.fb-profile/` e `data/` contêm dados pessoais e estão no `.gitignore` — não envie para o Git.
