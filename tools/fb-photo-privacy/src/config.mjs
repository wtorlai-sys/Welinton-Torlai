// Configuração central: URLs, textos da interface (PT-BR / PT-PT / EN) e limites de ritmo.
// Se o Facebook mudar um rótulo, ajuste AQUI — o resto do código usa só estes padrões.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const PATHS = {
  root: ROOT,
  profileDir: path.join(ROOT, '.fb-profile'), // perfil do navegador (a sessão fica só aqui, gerida pelo próprio Chromium)
  dataDir: path.join(ROOT, 'data'),
  state: path.join(ROOT, 'data', 'state.json'),
  reportMd: path.join(ROOT, 'data', 'relatorio.md'),
  reportJson: path.join(ROOT, 'data', 'relatorio.json'),
  screenshots: path.join(ROOT, 'data', 'screenshots'),
  log: path.join(ROOT, 'data', 'execucao.log'),
};

export const FB = {
  home: 'https://www.facebook.com/',
  me: 'https://www.facebook.com/me',
  // As abas de fotos do perfil. "/me/..." redireciona para o seu perfil.
  photosBy: 'https://www.facebook.com/me/photos_by',
  photosOf: 'https://www.facebook.com/me/photos_of',
  albums: 'https://www.facebook.com/me/photos_albums',
  photoUrl: (fbid) => `https://www.facebook.com/photo/?fbid=${fbid}`,
  albumUrl: (id) => `https://www.facebook.com/media/set/?set=a.${id}`,
};

// Ritmo: devagar de propósito, para respeitar os limites do Facebook.
export const PACE = {
  minDelayMs: 4000,
  maxDelayMs: 9000,
  pauseEvery: 20, // a cada N alterações...
  pauseMs: 90_000, // ...pausa longa
  maxChangesPerSession: 120, // teto por execução (pode ser alterado com --max)
  settleMs: 2500, // espera após navegar (o Facebook renderiza em etapas)
  scrollIdleRounds: 4, // rodadas de rolagem sem itens novos antes de parar
  maxScrollRounds: 400,
};

// ---- Textos da interface -------------------------------------------------

// Rótulo do ícone de público (aria-label / title) ao lado da data da publicação.
export const AUDIENCE_LABEL_RX =
  /^(compartilhad[oa] com|partilhad[oa] com|shared with|público|publico|public|amigos|friends|somente eu|apenas eu|só eu|only me|personalizado|custom)\b/i;

export const AUDIENCE_DIALOG_RX =
  /(selecionar público|selecionar publico|selecionar audiência|editar público|editar publico|editar privacidade|select audience|edit audience|edit privacy|quem pode ver|who can see)/i;

export const ONLY_ME_RX = /^\s*(somente eu|apenas eu|só eu|so eu|only me)\s*$/i;
export const ONLY_ME_LOOSE_RX = /(somente eu|apenas eu|só eu|only me)/i;

export const DONE_BUTTON_RX = /^\s*(concluído|concluido|concluir|done|salvar|guardar|save)\s*$/i;
export const SAVE_BUTTON_RX = /^\s*(salvar|guardar|save|publicar alterações|save changes|concluído|concluido|done)\s*$/i;

// Menu "..." de uma publicação/foto
export const POST_MENU_BUTTON_RX =
  /^(ações para esta publicação|acoes para esta publicacao|ações para esta foto|actions for this post|mais opções|mais opcoes|more options|opções|options)/i;

// Itens de menu que PODEMOS clicar (lista branca).
export const EDIT_AUDIENCE_MENUITEM_RX =
  /(editar público|editar publico|editar privacidade|editar audiência|edit audience|edit privacy|editar quem pode ver|edit who can see)/i;
export const EDIT_ALBUM_MENUITEM_RX = /^(editar álbum|editar album|edit album|editar)$/i;

// O público desta foto é definido pelo álbum
export const ALBUM_GOVERNED_RX =
  /(determinad[oa] pelo álbum|definid[oa] pelo álbum|público do álbum|privacidade do álbum|audience (is|was) (set|determined) by the album|album'?s (audience|privacy)|part of an album|faz parte de um álbum|faz parte do álbum)/i;

// Foto de perfil/capa atual precisa ser pública
export const MUST_BE_PUBLIC_RX =
  /(foto do perfil atual|foto de perfil atual|foto da capa atual|current profile picture|current cover photo|sempre (é|são) públic|always public|são públicas|is public)/i;

// ---- Segurança -----------------------------------------------------------

// Qualquer clique cujo texto/aria-label case com isto é BLOQUEADO.
export const DANGER_RX =
  /(excluir|apagar|deletar|delete|remov|arquivar|archive|lixeira|trash|desmarcar|untag|marcação|tag\b|denunciar|report|bloquear|block|ocultar|hide|desativar|deactivate|transferir|move to|mover para|desfazer amizade|unfriend|sair do grupo|leave)/i;

// Sinais de bloqueio, verificação de segurança ou sessão perdida -> PARAR tudo.
export const BLOCK_URL_RX = /(\/checkpoint\b|\/captcha|\/login\b|login\.php|\/two_step_verification|\/recover)/i;
export const BLOCK_TEXT_RX =
  /(bloqueado temporariamente|temporarily blocked|você está indo rápido demais|you('|’)re going too fast|recurso bloqueado|feature (temporarily )?blocked|confirme sua identidade|confirm your identity|verificação de segurança|security check|digite os caracteres|enter the characters|não é um robô|not a robot|limitamos a frequência|we limit how often)/i;

export const LOGGED_OUT_RX = /(entrar no facebook|log in to facebook|esqueceu a senha|forgot password|criar nova conta|create new account)/i;

// ---- Classificação de álbuns -----------------------------------------------

export const ALBUM_CATEGORIES = [
  { key: 'profile_pictures', label: 'Fotos do perfil (antigas)', rx: /(fotos do perfil|fotos de perfil|profile pictures|profile photos)/i, special: true },
  { key: 'cover_photos', label: 'Fotos da capa (antigas)', rx: /(fotos da capa|fotos de capa|cover photos)/i, special: true },
  { key: 'timeline_photos', label: 'Publicações com fotos (linha do tempo)', rx: /(fotos da linha do tempo|fotos da cronologia|timeline photos)/i, special: true },
  { key: 'mobile_uploads', label: 'Uploads do celular', rx: /(uploads do celular|uploads de celular|carregamentos do telemóvel|mobile uploads)/i, special: true },
  { key: 'featured', label: 'Destaques', rx: /(destaques|featured)/i, special: true },
  { key: 'other_special', label: 'Outros álbuns automáticos', rx: /(fotos do instagram|instagram photos|sem título|untitled|fotos de bate-papo|videos|vídeos|avatar)/i, special: true },
];

export function categorizeAlbum(name) {
  for (const c of ALBUM_CATEGORIES) if (c.rx.test(name || '')) return c;
  return { key: 'user_album', label: 'Álbum criado por você', special: false };
}

export function parseAudience(label) {
  const s = (label || '').toLowerCase();
  if (!s) return 'unknown';
  if (/(somente eu|apenas eu|só eu|so eu|only me)/.test(s)) return 'only_me';
  if (/(amigos de amigos|friends of friends)/.test(s)) return 'friends_of_friends';
  if (/(amigos, exceto|amigos exceto|friends except)/.test(s)) return 'friends_except';
  if (/(amigos específicos|amigos especificos|specific friends)/.test(s)) return 'specific_friends';
  if (/(personalizado|custom)/.test(s)) return 'custom';
  if (/(público|publico|public)/.test(s)) return 'public';
  if (/(amigos|friends)/.test(s)) return 'friends';
  return 'unknown';
}

export const AUDIENCE_PT = {
  only_me: 'Somente eu',
  public: 'Público',
  friends: 'Amigos',
  friends_of_friends: 'Amigos de amigos',
  friends_except: 'Amigos, exceto…',
  specific_friends: 'Amigos específicos',
  custom: 'Personalizado',
  unknown: 'Não identificado',
};
