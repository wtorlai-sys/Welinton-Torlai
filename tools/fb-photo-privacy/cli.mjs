#!/usr/bin/env node
// Uso: node cli.mjs <login|map|scan|test-one|test-album|run|run-albums|report> [--max N] [--fbid ID] [--album ID]
import { openBrowser, ensureLoggedIn, ask, goto } from './src/browser.mjs';
import { loadState, saveState, log, upsertPhoto } from './src/state.mjs';
import { mapEverything } from './src/map.mjs';
import { readAudience, setPhotoOnlyMe, setAlbumOnlyMe } from './src/audience.mjs';
import { writeReport } from './src/report.mjs';
import { PlatformBlockError, SafetyError, humanDelay, sleep, screenshot } from './src/safety.mjs';
import { PACE, PATHS, AUDIENCE_PT } from './src/config.mjs';

const [cmd, ...rest] = process.argv.slice(2);
const arg = (name) => { const i = rest.indexOf(`--${name}`); return i >= 0 ? rest[i + 1] : undefined; };
const maxChanges = Number(arg('max') || PACE.maxChangesPerSession);

const EXCEPTION_CODES = new Set(['not_editable', 'audience_not_found', 'must_be_public', 'only_me_unavailable']);

function applyPhotoResult(state, p, r) {
  const patch = { attempts: (p.attempts || 0) + 1, lastTriedAt: new Date().toISOString(), before: p.before || r.before || null, after: r.after || null };
  if (r.code === 'changed_verified') Object.assign(patch, { status: 'changed_verified', reason: null, reasonText: null });
  else if (r.code === 'already_only_me') Object.assign(patch, { status: 'already_only_me', before: 'only_me', reason: null });
  else if (r.code === 'album_governed') Object.assign(patch, { status: 'album_governed', reason: 'album_governed', reasonText: r.reason });
  else if (EXCEPTION_CODES.has(r.code)) {
    let reason = r.code;
    if (p.categories.includes('current_profile_photo')) reason = 'current_profile_photo';
    else if (p.categories.includes('current_cover_photo')) reason = 'current_cover_photo';
    else if (r.code === 'not_editable' && p.categories.includes('tagged_by_others')) reason = 'tagged_by_others';
    Object.assign(patch, { status: 'exception', reason, reasonText: r.reason });
  } else Object.assign(patch, { status: 'failed', reason: r.code, reasonText: r.reason });
  return upsertPhoto(state, p.fbid, patch);
}

function preclassify(state, p) {
  // A foto de perfil/capa ATUAL o Facebook exige pública: registrar sem tentar.
  if (p.categories.includes('current_profile_photo')) return upsertPhoto(state, p.fbid, { status: 'exception', reason: 'current_profile_photo' });
  if (p.categories.includes('current_cover_photo')) return upsertPhoto(state, p.fbid, { status: 'exception', reason: 'current_cover_photo' });
  return null;
}

function printResult(r) {
  console.log(`   código: ${r.code}`);
  if (r.before !== undefined) console.log(`   antes:  ${AUDIENCE_PT[r.before] || r.before}`);
  if (r.after !== undefined) console.log(`   depois: ${AUDIENCE_PT[r.after] || r.after} ${r.code === 'changed_verified' ? '(verificado após recarregar)' : ''}`);
  if (r.reason) console.log(`   motivo: ${r.reason}`);
  if (r.menuItems?.length) console.log(`   itens do menu vistos: ${r.menuItems.join(' | ')}`);
}

async function withBrowser(fn, { interactive = true } = {}) {
  const state = loadState();
  const { context, page } = await openBrowser();
  try {
    await ensureLoggedIn(page, { interactive });
    await fn(page, state);
  } catch (e) {
    if (e instanceof PlatformBlockError) {
      log(`⛔ PARADA: ${e.message}`);
      state.events.push({ at: new Date().toISOString(), type: 'platform_block', message: e.message });
      await screenshot(page, `bloqueio-${Date.now()}`);
      console.log('\nResolva a verificação manualmente no navegador (se for o caso) e rode o comando de novo mais tarde.');
      console.log('O progresso foi salvo; nada será repetido.');
    } else throw e;
  } finally {
    saveState(state);
    writeReport(state);
    await context.close();
  }
}

async function scan(page, state) {
  const todo = Object.values(state.photos).filter((p) => !p.before && p.status === 'pending');
  log(`Leitura do público atual (sem alterar nada): ${todo.length} fotos pendentes.`);
  let n = 0;
  for (const p of todo.slice(0, Number(arg('max') || todo.length))) {
    await goto(page, p.url);
    const a = await readAudience(page);
    upsertPhoto(state, p.fbid, { before: a?.audience || 'unknown', editableHint: !!a?.clickable });
    if (a?.audience === 'only_me') upsertPhoto(state, p.fbid, { status: 'already_only_me' });
    if (++n % 10 === 0) { saveState(state); log(`  ${n}/${todo.length}`); }
    await sleep(1500 + Math.floor(Math.random() * 2000));
  }
}

function pickTestPhoto(state) {
  const fbid = arg('fbid');
  if (fbid) return state.photos[fbid] || upsertPhoto(state, fbid, { url: `https://www.facebook.com/photo/?fbid=${fbid}`, sources: ['manual'] });
  const c = Object.values(state.photos).filter((p) => p.status === 'pending' && p.uploadedByMe &&
    !p.categories.some((k) => ['current_profile_photo', 'current_cover_photo', 'tagged_by_others'].includes(k)));
  return c.find((p) => p.before === 'public') || c.find((p) => p.before && p.before !== 'only_me') || c[0];
}

async function testOne(page, state) {
  const p = pickTestPhoto(state);
  if (!p) { console.log('Nenhuma foto candidata. Rode "npm run map" antes, ou use --fbid ID.'); return; }
  console.log(`\n🧪 TESTE COM UMA FOTO: ${p.url}`);
  const r = await setPhotoOnlyMe(page, p.url);
  applyPhotoResult(state, p, r);
  const shot = await screenshot(page, `teste-${p.fbid}`);
  state.testOne = { fbid: p.fbid, url: p.url, ok: r.code === 'changed_verified' || r.code === 'already_only_me', code: r.code, before: r.before, after: r.after, at: new Date().toISOString() };
  saveState(state);
  printResult(r);
  if (shot) console.log(`   captura: ${shot}`);
  if (!state.testOne.ok) { console.log('\n❌ O teste NÃO confirmou a alteração. Não prossiga em massa; veja o README (seção "Se algo falhar").'); return; }
  console.log('\n✅ Teste verificado. Confira a foto no navegador, se quiser.');
  const a = await ask('Autoriza aplicar em massa às demais fotos? Digite SIM para autorizar: ');
  state.approvedBulk = a.toUpperCase() === 'SIM';
  console.log(state.approvedBulk ? 'Autorização registrada. Rode: npm run run' : 'Sem autorização. Nada mais será alterado.');
}

async function processQueue(page, state, items, handler, label) {
  let changes = 0, consecutiveErrors = 0;
  for (const it of items) {
    if (changes >= maxChanges) { log(`Teto de ${maxChanges} alterações nesta sessão atingido. Rode de novo depois para continuar.`); break; }
    try {
      const changed = await handler(it);
      consecutiveErrors = 0;
      if (changed) {
        changes++;
        if (changes % PACE.pauseEvery === 0) { log(`Pausa longa (${PACE.pauseMs / 1000}s) para respeitar limites.`); await sleep(PACE.pauseMs); }
      }
    } catch (e) {
      if (e instanceof PlatformBlockError) throw e;
      consecutiveErrors++;
      const safety = e instanceof SafetyError;
      log(`${safety ? '🛑 Segurança' : '⚠ Erro'} em ${label} ${it.fbid || it.id}: ${e.message}`);
      await screenshot(page, `erro-${it.fbid || it.id}`);
      await page.keyboard.press('Escape').catch(() => {});
      if (it.fbid) upsertPhoto(state, it.fbid, { status: 'failed', reason: safety ? 'safety_stop' : 'error', reasonText: e.message, attempts: (it.attempts || 0) + 1 });
      else state.albums[it.id] = { ...state.albums[it.id], status: 'failed', reason: safety ? 'safety_stop' : 'error', reasonText: e.message };
      if (consecutiveErrors >= 3) { log('3 falhas seguidas: a interface pode ter mudado. Parando por segurança.'); break; }
    }
    saveState(state);
    await humanDelay();
  }
  return changes;
}

async function run(page, state) {
  if (!state.testOne?.ok || !state.approvedBulk) {
    console.log('Bloqueado: primeiro rode "npm run test-one" e autorize digitando SIM.');
    return;
  }
  const queue = Object.values(state.photos).filter((p) =>
    (p.status === 'pending' || (p.status === 'failed' && p.reason !== 'safety_stop' && (p.attempts || 0) < 2)) && p.before !== 'only_me');
  for (const p of queue) preclassify(state, p);
  const todo = queue.filter((p) => state.photos[p.fbid].status === 'pending' || state.photos[p.fbid].status === 'failed');
  log(`Execução em massa: ${todo.length} fotos na fila (teto ${maxChanges} alterações).`);
  const n = await processQueue(page, state, todo, async (p) => {
    const r = await setPhotoOnlyMe(page, p.url);
    const rec = applyPhotoResult(state, state.photos[p.fbid], r);
    log(`  ${p.fbid}: ${r.code}${r.reason ? ' — ' + r.reason : ''}`);
    return rec.status === 'changed_verified';
  }, 'foto');
  log(`Concluído: ${n} fotos alteradas e verificadas nesta sessão.`);
}

function editableAlbums(state) {
  return Object.values(state.albums).filter((a) => !a.special);
}

async function testAlbum(page, state) {
  const id = arg('album') || editableAlbums(state).find((a) => a.status === 'pending')?.id;
  if (!id) { console.log('Nenhum álbum criado por você pendente.'); return; }
  const a = state.albums[id] || { id, url: `https://www.facebook.com/media/set/?set=a.${id}`, name: id };
  console.log(`\n🧪 TESTE COM UM ÁLBUM: ${a.name} — ${a.url}`);
  const r = await setAlbumOnlyMe(page, a.url);
  state.albums[id] = { ...a, status: r.ok ? r.code : (r.code.startsWith('album_no') ? 'exception' : 'failed'), before: r.before, after: r.after || null, reason: r.ok ? null : r.code };
  state.testAlbum = { id, ok: r.ok, code: r.code, at: new Date().toISOString() };
  await screenshot(page, `teste-album-${id}`);
  printResult(r);
  if (!r.ok) { console.log('\n❌ Teste do álbum não confirmado. Não prossiga com álbuns.'); return; }
  const ans = await ask('Autoriza aplicar aos demais álbuns criados por você? Digite SIM: ');
  state.approvedAlbums = ans.toUpperCase() === 'SIM';
}

async function runAlbums(page, state) {
  if (!state.testAlbum?.ok || !state.approvedAlbums) { console.log('Bloqueado: rode "npm run test-album" e autorize com SIM.'); return; }
  const todo = editableAlbums(state).filter((a) => a.status === 'pending' || (a.status === 'failed' && a.reason !== 'safety_stop'));
  for (const a of Object.values(state.albums).filter((x) => x.special && x.status === 'pending')) {
    state.albums[a.id] = { ...a, status: 'exception', reason: 'album_no_privacy_option', reasonText: 'Álbum automático: o público é definido foto a foto (tratado em "npm run run").' };
  }
  log(`Álbuns criados por você na fila: ${todo.length}.`);
  await processQueue(page, state, todo, async (a) => {
    const r = await setAlbumOnlyMe(page, a.url);
    state.albums[a.id] = { ...a, status: r.ok ? r.code : (r.code.startsWith('album_no') ? 'exception' : 'failed'), before: r.before, after: r.after || null, reason: r.ok ? null : r.code, reasonText: r.reason || null };
    log(`  ${a.name}: ${r.code}`);
    return r.code === 'changed_verified';
  }, 'álbum');
}

const COMMANDS = {
  login: async () => withBrowser(async () => log('Sessão ativa. Pode fechar; as próximas execuções reutilizam este perfil local.')),
  map: async () => withBrowser(async (page, state) => { await mapEverything(page, state); }),
  scan: async () => withBrowser(scan),
  'test-one': async () => withBrowser(testOne),
  'test-album': async () => withBrowser(testAlbum),
  run: async () => withBrowser(run),
  'run-albums': async () => withBrowser(runAlbums),
  report: async () => { const r = writeReport(loadState()); console.log(JSON.stringify(r.totais, null, 2)); console.log(`\nRelatório: ${PATHS.reportMd}`); },
};

if (!COMMANDS[cmd]) {
  console.log('Comandos: login | map | scan | test-one [--fbid ID] | test-album [--album ID] | run [--max N] | run-albums | report');
  process.exit(1);
}
await COMMANDS[cmd]();
if (cmd !== 'report') console.log(`\nRelatório atualizado: ${PATHS.reportMd}`);
