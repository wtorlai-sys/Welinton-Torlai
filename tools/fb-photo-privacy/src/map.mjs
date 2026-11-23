// Mapeamento SOMENTE LEITURA: percorre as abas de fotos e os álbuns e registra cada foto.
import { FB, PACE, categorizeAlbum } from './config.mjs';
import { goto } from './browser.mjs';
import { sleep, assertNotBlocked } from './safety.mjs';
import { upsertPhoto, saveState, log } from './state.mjs';

const PHOTO_HREF_RX = /(?:[?&]fbid=(\d+))|(?:\/photos\/[^/]+\/(\d+))|(?:\/photo\.php\?.*fbid=(\d+))/;
const ALBUM_HREF_RX = /\/media\/set\/\?set=a\.(\d+)|\/album\.php\?.*id=(\d+)|[?&]set=a\.(\d+)/;

function photoIdFromHref(href) {
  const m = href && href.match(PHOTO_HREF_RX);
  return m ? m[1] || m[2] || m[3] : null;
}

async function collectHrefs(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('a[href]')]
      .filter((a) => !a.closest('[role="navigation"], [role="banner"]'))
      .map((a) => ({ href: a.href, text: (a.innerText || a.getAttribute('aria-label') || '').trim().slice(0, 120) })),
  );
}

/** Rola até o fim da grade, coletando links. Para quando não aparecem itens novos. */
async function scrollCollect(page, pick) {
  const seen = new Map();
  let idle = 0;
  for (let round = 0; round < PACE.maxScrollRounds && idle < PACE.scrollIdleRounds; round++) {
    const before = seen.size;
    for (const l of await collectHrefs(page)) {
      const v = pick(l);
      if (v && !seen.has(v.id)) seen.set(v.id, v);
    }
    idle = seen.size === before ? idle + 1 : 0;
    await page.mouse.wheel(0, 2500);
    await sleep(1200 + (idle ? 800 : 0));
    if (round % 10 === 0) await assertNotBlocked(page);
  }
  return [...seen.values()];
}

/** Identifica a foto de perfil e de capa ATUAIS (o Facebook exige que fiquem públicas). */
async function detectCurrentProfileAndCover(page) {
  await goto(page, FB.me);
  const profileUrl = page.url().split('#')[0];
  const ids = await page.evaluate(() => {
    const out = { profile: null, cover: null };
    for (const a of document.querySelectorAll('a[href]')) {
      const label = ((a.getAttribute('aria-label') || '') + ' ' + (a.querySelector('[aria-label]')?.getAttribute('aria-label') || '')).toLowerCase();
      const m = a.href.match(/[?&]fbid=(\d+)/) || a.href.match(/\/photos\/[^/]+\/(\d+)/);
      if (!m) continue;
      if (!out.cover && /(capa|cover)/.test(label)) out.cover = m[1];
      else if (!out.profile && /(perfil|profile)/.test(label)) out.profile = m[1];
    }
    return out;
  });
  return { profileUrl, currentProfilePhotoId: ids.profile, currentCoverPhotoId: ids.cover };
}

export async function mapEverything(page, state) {
  log('Mapeamento (somente leitura) iniciado.');
  state.me = { ...(state.me || {}), ...(await detectCurrentProfileAndCover(page)) };
  log(`Perfil: ${state.me.profileUrl} | foto de perfil atual: ${state.me.currentProfilePhotoId || '?'} | capa atual: ${state.me.currentCoverPhotoId || '?'}`);
  saveState(state);

  // 1) "Suas fotos" — fotos que você publicou
  await goto(page, FB.photosBy);
  const mine = await scrollCollect(page, (l) => { const id = photoIdFromHref(l.href); return id ? { id, href: l.href } : null; });
  for (const p of mine) upsertPhoto(state, p.id, { url: FB.photoUrl(p.id), sources: ['photos_by'], uploadedByMe: true });
  log(`"Suas fotos": ${mine.length} fotos.`);
  saveState(state);

  // 2) "Fotos suas" — fotos em que você foi marcado(a)
  await goto(page, FB.photosOf);
  const tagged = await scrollCollect(page, (l) => { const id = photoIdFromHref(l.href); return id ? { id, href: l.href } : null; });
  for (const p of tagged) upsertPhoto(state, p.id, { url: FB.photoUrl(p.id), sources: ['photos_of'] });
  log(`"Fotos suas" (marcações): ${tagged.length} fotos.`);
  saveState(state);

  // 3) Álbuns
  await goto(page, FB.albums);
  const albums = await scrollCollect(page, (l) => {
    const m = l.href.match(ALBUM_HREF_RX);
    const id = m && (m[1] || m[2] || m[3]);
    return id ? { id, name: l.text.split('\n')[0] || '' } : null;
  });
  log(`Álbuns encontrados: ${albums.length}.`);
  for (const a of albums) {
    await goto(page, FB.albumUrl(a.id));
    const name = a.name || (await page.locator('h1, h2').first().innerText().catch(() => '')) || `Álbum ${a.id}`;
    const cat = categorizeAlbum(name);
    const photos = await scrollCollect(page, (l) => { const id = photoIdFromHref(l.href); return id ? { id } : null; });
    state.albums[a.id] = {
      ...(state.albums[a.id] || { status: 'pending', before: null, after: null, reason: null }),
      id: a.id, name, url: FB.albumUrl(a.id), category: cat.key, categoryLabel: cat.label,
      special: cat.special, photoCount: photos.length,
    };
    for (const p of photos) upsertPhoto(state, p.id, { url: FB.photoUrl(p.id), sources: ['album'], categories: [cat.key], albumIds: [a.id] });
    log(`  • ${name} [${cat.label}]: ${photos.length} fotos`);
    saveState(state);
  }

  // Categorias derivadas
  for (const p of Object.values(state.photos)) {
    const cats = new Set(p.categories);
    if (p.sources.includes('photos_of') && !p.uploadedByMe) cats.add('tagged_by_others');
    if (p.sources.includes('photos_by')) cats.add('uploaded_by_me');
    if (p.fbid === state.me.currentProfilePhotoId) cats.add('current_profile_photo');
    if (p.fbid === state.me.currentCoverPhotoId) cats.add('current_cover_photo');
    p.categories = [...cats];
  }
  state.mappedAt = new Date().toISOString();
  saveState(state);
  log(`Mapeamento concluído: ${Object.keys(state.photos).length} fotos únicas, ${Object.keys(state.albums).length} álbuns.`);
}
