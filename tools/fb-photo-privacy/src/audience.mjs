// Leitura e alteração do público ("quem pode ver") de fotos e álbuns, só pela interface.
// Estratégia: localizar por aria-label/texto/role (nunca por coordenadas), marcar o
// elemento encontrado com data-fbpp e clicar via safeClick (lista branca + bloqueio de
// ações perigosas). Depois de salvar, recarrega a página e confere o público de novo.
import {
  AUDIENCE_LABEL_RX, AUDIENCE_DIALOG_RX, ONLY_ME_RX, ONLY_ME_LOOSE_RX, DONE_BUTTON_RX,
  SAVE_BUTTON_RX, POST_MENU_BUTTON_RX, EDIT_AUDIENCE_MENUITEM_RX, EDIT_ALBUM_MENUITEM_RX,
  ALBUM_GOVERNED_RX, MUST_BE_PUBLIC_RX, parseAudience, PACE,
} from './config.mjs';
import { safeClick, assertNotBlocked, sleep, SafetyError } from './safety.mjs';

const MORE_OPTIONS_RX = /^\s*(ver todos|ver tudo|see all|mais…|mais\.\.\.|mais|more…|more\.\.\.|more|mais opções|more options)\s*$/i;

/** Resultado padronizado de uma operação. */
const result = (ok, code, extra = {}) => ({ ok, code, ...extra });

async function clearMarks(page) {
  await page.evaluate(() => document.querySelectorAll('[data-fbpp]').forEach((e) => e.removeAttribute('data-fbpp')));
}

/**
 * Encontra o ícone de público da publicação aberta. Marca-o com data-fbpp="aud"
 * e o botão clicável com data-fbpp="aud-btn". Retorna { label, audience, clickable } ou null.
 */
export async function readAudience(page, { scope = null } = {}) {
  await clearMarks(page);
  const found = await page.evaluate(
    ({ rxSrc, scopeSel }) => {
      const rx = new RegExp(rxSrc, 'i');
      const strong = /^(compartilhad[oa] com|partilhad[oa] com|shared with)/i;
      const root = (scopeSel && document.querySelector(scopeSel)) || document;
      const excluded = (el) => el.closest('[role="navigation"], [role="banner"], [role="complementary"] [role="navigation"]');
      const labelOf = (el) => (el.getAttribute('aria-label') || el.getAttribute('title') || '').trim();
      const all = [...root.querySelectorAll('[aria-label], [title]')].filter((el) => !excluded(el));
      // 1º: rótulos explícitos "Compartilhado com: X"; 2º: ícones com o nome do público (não-links)
      let el = all.find((e) => strong.test(labelOf(e)));
      if (!el) el = all.find((e) => rx.test(labelOf(e)) && !e.closest('a[href]') && labelOf(e).length < 60);
      if (!el) return null;
      el.setAttribute('data-fbpp', 'aud');
      const btn = el.closest('[role="button"], button');
      if (btn && !btn.closest('a[href]')) btn.setAttribute('data-fbpp', btn === el ? 'aud' : 'aud-btn');
      return { label: labelOf(el), clickable: !!btn };
    },
    { rxSrc: AUDIENCE_LABEL_RX.source, scopeSel: scope },
  );
  if (!found) return null;
  return { ...found, audience: parseAudience(found.label) };
}

function audienceButton(page) {
  return page.locator('[data-fbpp="aud-btn"], [role="button"][data-fbpp="aud"], button[data-fbpp="aud"]').first();
}

/** Espera um diálogo de público (ou um diálogo informativo de restrição). */
async function waitAudienceDialog(page, timeout = 8000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    await assertNotBlocked(page);
    const info = await page.evaluate(
      ({ dlgSrc, onlySrc, albSrc, pubSrc }) => {
        const dialogs = [...document.querySelectorAll('[role="dialog"]')].filter((d) => d.offsetParent !== null || d.getClientRects().length);
        for (let i = dialogs.length - 1; i >= 0; i--) {
          const d = dialogs[i];
          const txt = d.innerText || '';
          if (new RegExp(albSrc, 'i').test(txt)) return { kind: 'album_governed', text: txt.slice(0, 300) };
          if (new RegExp(dlgSrc, 'i').test(txt) || new RegExp(onlySrc, 'i').test(txt)) {
            document.querySelectorAll('[data-fbpp="dlg"]').forEach((e) => e.removeAttribute('data-fbpp'));
            d.setAttribute('data-fbpp', 'dlg');
            const mustPublic = new RegExp(pubSrc, 'i').test(txt) && !new RegExp(onlySrc, 'i').test(txt);
            return { kind: mustPublic ? 'must_be_public' : 'audience', text: txt.slice(0, 300) };
          }
        }
        return null;
      },
      { dlgSrc: AUDIENCE_DIALOG_RX.source, onlySrc: ONLY_ME_LOOSE_RX.source, albSrc: ALBUM_GOVERNED_RX.source, pubSrc: MUST_BE_PUBLIC_RX.source },
    );
    if (info) return info;
    await sleep(300);
  }
  return null;
}

/** Marca, dentro do diálogo de público, a opção "Somente eu" (data-fbpp="onlyme"). */
async function markOnlyMe(page) {
  return page.evaluate(({ src }) => {
    const rx = new RegExp(src, 'i');
    const dlg = document.querySelector('[data-fbpp="dlg"]');
    if (!dlg) return false;
    const clickableSel = '[role="radio"], [role="option"], [role="menuitemradio"], [role="menuitem"], [role="button"], [role="listitem"], label, button';
    for (const el of dlg.querySelectorAll('*')) {
      const first = (el.innerText || '').split('\n').map((s) => s.trim()).filter(Boolean)[0] || '';
      if (!rx.test(first)) continue;
      const target = el.closest(clickableSel) || el;
      if (!dlg.contains(target)) continue;
      // Evita marcar o diálogo inteiro ou um contêiner que englobe outras opções
      const lines = (target.innerText || '').split('\n').filter((s) => s.trim());
      if (lines.length > 3) continue;
      target.setAttribute('data-fbpp', 'onlyme');
      return true;
    }
    return false;
  }, { src: ONLY_ME_RX.source });
}

async function clickInDialogByText(page, rx, what) {
  const marked = await page.evaluate(({ src }) => {
    const rx = new RegExp(src, 'i');
    const dlg = document.querySelector('[data-fbpp="dlg"]');
    if (!dlg) return false;
    const els = [...dlg.querySelectorAll('[role="button"], button')];
    const el = els.find((e) => rx.test((e.getAttribute('aria-label') || '').trim()) || rx.test((e.innerText || '').trim()));
    if (!el || el.getAttribute('aria-disabled') === 'true' || el.disabled) return false;
    el.setAttribute('data-fbpp', 'dlgbtn');
    return true;
  }, { src: rx.source });
  if (!marked) return false;
  await safeClick(page.locator('[data-fbpp="dlgbtn"]').first(), { expect: rx, what });
  await page.evaluate(() => document.querySelector('[data-fbpp="dlgbtn"]')?.removeAttribute('data-fbpp'));
  return true;
}

async function dialogClosed(page, timeout = 8000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const open = await page.locator('[data-fbpp="dlg"]').count();
    if (!open) return true;
    const visible = await page.locator('[data-fbpp="dlg"]').first().isVisible().catch(() => false);
    if (!visible) return true;
    await sleep(300);
  }
  return false;
}

async function escapeAll(page) {
  for (let i = 0; i < 3; i++) { await page.keyboard.press('Escape').catch(() => {}); await sleep(250); }
}

/** No diálogo aberto: escolhe "Somente eu" e confirma. Não salva nada além disso. */
async function chooseOnlyMeInDialog(page) {
  let ok = await markOnlyMe(page);
  if (!ok) {
    // Algumas versões escondem a opção atrás de "Ver todos"/"Mais..."
    const opened = await clickInDialogByText(page, MORE_OPTIONS_RX, 'botão "ver mais opções"').catch(() => false);
    if (opened) { await sleep(800); ok = await markOnlyMe(page); }
  }
  if (!ok) return result(false, 'only_me_unavailable', { reason: 'A opção "Somente eu" não aparece no seletor de público desta foto.' });
  await safeClick(page.locator('[data-fbpp="onlyme"]').first(), { expect: ONLY_ME_LOOSE_RX, what: 'opção "Somente eu"' });
  await sleep(700);
  // Botão "Concluído/Salvar" do seletor (algumas versões aplicam sem botão)
  if (!(await dialogClosed(page, 1200))) {
    await clickInDialogByText(page, DONE_BUTTON_RX, 'botão "Concluído/Salvar"');
  }
  if (!(await dialogClosed(page, 8000))) {
    return result(false, 'dialog_stuck', { reason: 'O seletor de público não fechou após confirmar.' });
  }
  return result(true, 'selected');
}

async function findPostMenuButton(page) {
  return page.evaluate(({ src }) => {
    const rx = new RegExp(src, 'i');
    const els = [...document.querySelectorAll('[role="button"][aria-label], button[aria-label]')]
      .filter((e) => !e.closest('[role="navigation"], [role="banner"], [role="article"] [role="article"]'));
    const el = els.find((e) => rx.test(e.getAttribute('aria-label').trim()));
    if (!el) return false;
    el.setAttribute('data-fbpp', 'menubtn');
    return true;
  }, { src: POST_MENU_BUTTON_RX.source });
}

/** Abre o menu "..." e clica no item que corresponde a `itemRx` (lista branca). */
async function openMenuItem(page, itemRx, what) {
  if (!(await findPostMenuButton(page))) return { ok: false, items: [] };
  await safeClick(page.locator('[data-fbpp="menubtn"]').first(), { expect: POST_MENU_BUTTON_RX, what: 'menu de opções' });
  await sleep(900);
  const items = await page.evaluate(({ src }) => {
    const rx = new RegExp(src, 'i');
    const list = [...document.querySelectorAll('[role="menuitem"], [role="menu"] [role="button"]')];
    const texts = list.map((e) => (e.innerText || e.getAttribute('aria-label') || '').split('\n')[0].trim()).filter(Boolean);
    const el = list.find((e) => rx.test((e.innerText || e.getAttribute('aria-label') || '').split('\n')[0].trim()));
    if (el) el.setAttribute('data-fbpp', 'menuitem');
    return { found: !!el, texts };
  }, { src: itemRx.source });
  if (!items.found) { await escapeAll(page); return { ok: false, items: items.texts }; }
  await safeClick(page.locator('[data-fbpp="menuitem"]').first(), { expect: itemRx, what });
  return { ok: true, items: items.texts };
}

/**
 * Coloca UMA foto em "Somente eu" e verifica recarregando a página.
 * Nunca apaga, arquiva, desmarca ou altera nada além do público.
 */
export async function setPhotoOnlyMe(page, url, { reload } = {}) {
  const nav = reload || (async () => { await page.goto(url, { waitUntil: 'domcontentloaded' }); await sleep(PACE.settleMs); await assertNotBlocked(page); });
  await nav();
  const before = await readAudience(page);
  if (before?.audience === 'only_me') return result(true, 'already_only_me', { before: before.audience, after: before.audience });

  // 1) Ícone de público clicável (só existe quando a publicação é sua e editável)
  let dlg = null;
  if (before?.clickable) {
    await safeClick(audienceButton(page), { what: 'ícone de público' });
    dlg = await waitAudienceDialog(page);
  }
  // 2) Alternativa: menu "..." > "Editar público"
  let menuItems = [];
  if (!dlg) {
    await escapeAll(page);
    const m = await openMenuItem(page, EDIT_AUDIENCE_MENUITEM_RX, 'item "Editar público"');
    menuItems = m.items;
    if (m.ok) dlg = await waitAudienceDialog(page);
  }
  if (!dlg) {
    await escapeAll(page);
    return result(false, before ? 'not_editable' : 'audience_not_found', {
      before: before?.audience || null,
      reason: before
        ? 'Não há opção de editar o público: provavelmente a foto foi publicada por outra pessoa, você só foi marcado(a), ou o público é controlado pelo álbum.'
        : 'Não foi possível localizar o indicador de público nesta página.',
      menuItems,
    });
  }
  if (dlg.kind === 'album_governed') {
    await escapeAll(page);
    return result(false, 'album_governed', { before: before?.audience || null, reason: 'O público desta foto é definido pelo álbum; altere o álbum.' });
  }
  if (dlg.kind === 'must_be_public') {
    await escapeAll(page);
    return result(false, 'must_be_public', { before: before?.audience || null, reason: 'O Facebook exige que esta foto (perfil/capa atual) seja pública.' });
  }

  const sel = await chooseOnlyMeInDialog(page);
  if (!sel.ok) { await escapeAll(page); return { ...sel, before: before?.audience || null }; }

  // 3) Verificação real: recarrega e lê de novo
  await sleep(1500);
  await nav();
  const after = await readAudience(page);
  if (after?.audience === 'only_me') {
    return result(true, 'changed_verified', { before: before?.audience || null, after: 'only_me' });
  }
  return result(false, 'not_verified', {
    before: before?.audience || null,
    after: after?.audience || null,
    reason: `Após salvar e recarregar, o público aparece como "${after?.label || 'não encontrado'}". Não considerado privado.`,
  });
}

/** Altera o público de um ÁLBUM criado por você para "Somente eu" e verifica. */
export async function setAlbumOnlyMe(page, url, { reload } = {}) {
  const nav = reload || (async () => { await page.goto(url, { waitUntil: 'domcontentloaded' }); await sleep(PACE.settleMs); await assertNotBlocked(page); });
  await nav();
  const before = await readAudience(page);
  if (before?.audience === 'only_me') return result(true, 'already_only_me', { before: 'only_me', after: 'only_me' });

  // Às vezes o ícone de público do álbum já abre o seletor
  let dlg = null;
  if (before?.clickable) {
    await safeClick(audienceButton(page), { what: 'ícone de público do álbum' });
    dlg = await waitAudienceDialog(page, 4000);
  }
  let needsSave = false;
  if (!dlg) {
    await escapeAll(page);
    // Entrar no modo de edição: botão "Editar" ou menu "..." > "Editar álbum"
    const editBtn = await page.evaluate(({ src }) => {
      const rx = new RegExp(src, 'i');
      const el = [...document.querySelectorAll('[role="button"], button, a[role="link"]')]
        .filter((e) => !e.closest('[role="navigation"], [role="banner"]'))
        .find((e) => rx.test((e.getAttribute('aria-label') || '').trim()) || rx.test((e.innerText || '').trim()));
      if (el) el.setAttribute('data-fbpp', 'editalbum');
      return !!el;
    }, { src: EDIT_ALBUM_MENUITEM_RX.source });
    let entered = false;
    if (editBtn) { await safeClick(page.locator('[data-fbpp="editalbum"]').first(), { expect: EDIT_ALBUM_MENUITEM_RX, what: 'botão "Editar álbum"' }); entered = true; }
    else entered = (await openMenuItem(page, EDIT_ALBUM_MENUITEM_RX, 'item "Editar álbum"')).ok;
    if (!entered) return result(false, 'album_no_edit_option', { before: before?.audience || null, reason: 'O álbum não oferece opção de edição (álbuns automáticos ou de terceiros).' });
    await sleep(2000);
    await assertNotBlocked(page);
    // Seletor de público dentro da edição
    const sel = await page.evaluate(({ src }) => {
      const rx = new RegExp(src, 'i');
      const el = [...document.querySelectorAll('[role="button"], button, [role="combobox"]')]
        .filter((e) => !e.closest('[role="navigation"], [role="banner"]'))
        .find((e) => rx.test((e.getAttribute('aria-label') || '') + ' ' + (e.innerText || '').split('\n')[0]));
      if (el) el.setAttribute('data-fbpp', 'albumaud');
      return !!el;
    }, { src: '(editar privacidade|edit privacy|selecionar público|select audience|^\\s*(público|amigos|public|friends|somente eu|only me|personalizado|custom|amigos de amigos|friends of friends)\\s*$|compartilhad[oa] com|shared with)' });
    if (!sel) { await escapeAll(page); return result(false, 'album_no_privacy_option', { before: before?.audience || null, reason: 'A edição do álbum não mostra seletor de público.' }); }
    await safeClick(page.locator('[data-fbpp="albumaud"]').first(), { what: 'seletor de público do álbum' });
    dlg = await waitAudienceDialog(page);
    needsSave = true;
  }
  if (!dlg || dlg.kind !== 'audience') { await escapeAll(page); return result(false, 'album_no_privacy_option', { before: before?.audience || null, reason: 'O seletor de público do álbum não abriu.' }); }

  const chosen = await chooseOnlyMeInDialog(page);
  if (!chosen.ok) { await escapeAll(page); return { ...chosen, before: before?.audience || null }; }

  if (needsSave) {
    const saved = await page.evaluate(({ src }) => {
      const rx = new RegExp(src, 'i');
      const el = [...document.querySelectorAll('[role="button"], button')]
        .filter((e) => !e.closest('[role="navigation"], [role="banner"]'))
        .find((e) => rx.test((e.getAttribute('aria-label') || '').trim()) || rx.test((e.innerText || '').trim()));
      if (el) el.setAttribute('data-fbpp', 'albumsave');
      return !!el;
    }, { src: SAVE_BUTTON_RX.source });
    if (!saved) return result(false, 'album_save_not_found', { before: before?.audience || null, reason: 'Botão "Salvar" do álbum não encontrado; nada foi salvo.' });
    await safeClick(page.locator('[data-fbpp="albumsave"]').first(), { expect: SAVE_BUTTON_RX, what: 'botão "Salvar" do álbum' });
    await sleep(3000);
  }
  await nav();
  const after = await readAudience(page);
  if (after?.audience === 'only_me') return result(true, 'changed_verified', { before: before?.audience || null, after: 'only_me' });
  return result(false, 'not_verified', { before: before?.audience || null, after: after?.audience || null, reason: `Após salvar, o álbum aparece como "${after?.label || 'não encontrado'}".` });
}

export { SafetyError };
