// Autoteste OFFLINE: roda a lógica de alteração contra páginas falsas que imitam a
// interface do Facebook (não acessa o Facebook). Valida fluxo, verificação e travas.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { setPhotoOnlyMe, setAlbumOnlyMe, readAudience } from '../src/audience.mjs';
import { safeClick, assertNotBlocked, SafetyError, PlatformBlockError } from '../src/safety.mjs';

const page = (o) => `<!doctype html><html><head><meta charset="utf-8"></head><body>
<div role="banner"><a href="/friends" aria-label="Amigos">Amigos</a></div>
<div role="navigation"><a href="/x" aria-label="Público">Público</a></div>
<main id="main"></main>
<script>
const O = ${JSON.stringify(o)};
const K = 'aud:' + O.id;
const get = () => localStorage.getItem(K) || O.initial;
const NAMES = { public: 'Público', friends: 'Amigos', only_me: 'Somente eu' };
function el(h){ const d=document.createElement('div'); d.innerHTML=h.trim(); return d.firstChild; }
function closeDlg(){ document.querySelectorAll('[role=dialog],[role=menu]').forEach(e=>e.remove()); }
function openAudience(onSave){
  closeDlg();
  if (O.albumGoverned) { document.body.append(el('<div role="dialog"><p>O público desta foto é determinado pelo álbum.</p><div role="button">OK</div></div>')); return; }
  const d = el('<div role="dialog"><h2>Selecionar público</h2>' +
    ['public','friends','only_me'].map(k=>'<div role="radio" data-k="'+k+'" aria-checked="'+(get()===k)+'"><span>'+NAMES[k]+'</span><br><small>descrição</small></div>').join('') +
    '<div role="button" id="done">Concluído</div></div>');
  let pick = get();
  d.querySelectorAll('[role=radio]').forEach(r=>r.onclick=()=>{ pick=r.dataset.k; });
  d.querySelector('#done').onclick=()=>{ if(!O.brokenSave) onSave(pick); closeDlg(); };
  document.body.append(d);
}
function render(){
  const m = document.getElementById('main'); m.innerHTML='';
  if (O.kind==='photo'){
    const label = 'Compartilhado com: ' + NAMES[get()];
    m.append(el(O.ownPost ? '<span role="button" aria-label="'+label+'"><i>🌐</i></span>' : '<span aria-label="'+label+'"><i>🌐</i></span>'));
    const mb = el('<div role="button" aria-label="Ações para esta publicação">...</div>');
    mb.onclick=()=>{ closeDlg(); const menu=el('<div role="menu"></div>');
      for (const t of O.menu){ const it=el('<div role="menuitem">'+t+'</div>'); it.onclick=()=>{ if(t==='Excluir foto') window.DELETED=true; if(t==='Editar público') openAudience(v=>localStorage.setItem(K,v)); }; menu.append(it); }
      document.body.append(menu); };
    m.append(mb);
    if (O.ownPost) m.querySelector('[role=button]').onclick=()=>openAudience(v=>localStorage.setItem(K,v));
  } else {
    m.append(el('<h1>Viagem 2014</h1>'));
    m.append(el('<span aria-label="Compartilhado com: '+NAMES[get()]+'"></span>'));
    const ed=el('<div role="button">Editar</div>');
    ed.onclick=()=>{ let pending=get(); const form=el('<div><div role="button" id="aud">'+NAMES[pending]+'</div><div role="button" id="del">Excluir álbum</div><div role="button" id="save">Salvar</div></div>');
      form.querySelector('#aud').onclick=()=>openAudience(v=>{pending=v; form.querySelector('#aud').textContent=NAMES[v];});
      form.querySelector('#del').onclick=()=>{window.DELETED=true;};
      form.querySelector('#save').onclick=()=>{ localStorage.setItem(K,pending); render(); };
      m.append(form); };
    m.append(ed);
  }
  if (O.blocked) document.body.append(el('<div role="dialog">Você está bloqueado temporariamente</div>'));
}
render();
</script></body></html>`;

const SCEN = {
  public_own: { kind: 'photo', id: 1, initial: 'public', ownPost: true, menu: ['Excluir foto', 'Editar público'] },
  already: { kind: 'photo', id: 2, initial: 'only_me', ownPost: true, menu: [] },
  others: { kind: 'photo', id: 3, initial: 'public', ownPost: false, menu: ['Denunciar foto', 'Excluir foto'] },
  governed: { kind: 'photo', id: 4, initial: 'friends', ownPost: true, albumGoverned: true, menu: [] },
  menu_fallback: { kind: 'photo', id: 5, initial: 'friends', ownPost: false, menu: ['Excluir foto', 'Editar público'] },
  broken: { kind: 'photo', id: 6, initial: 'public', ownPost: true, brokenSave: true, menu: [] },
  album: { kind: 'album', id: 7, initial: 'friends' },
  blocked: { kind: 'photo', id: 8, initial: 'public', ownPost: true, blocked: true, menu: [] },
};

const browser = await chromium.launch();
const ctx = await browser.newContext();
await ctx.route('https://mock.local/**', (route) => {
  const name = new URL(route.request().url()).pathname.slice(1);
  route.fulfill({ contentType: 'text/html', body: page(SCEN[name]) });
});
const p = await ctx.newPage();
p.setDefaultTimeout(5000);
const go = (n) => async () => { await p.goto(`https://mock.local/${n}`); await p.waitForTimeout(150); await assertNotBlocked(p); };
const results = [];
async function check(name, fn) {
  try { await fn(); results.push(['OK  ', name]); } catch (e) { results.push(['FAIL', name + ' — ' + e.message]); }
}

await check('ignora "Amigos"/"Público" da barra de navegação', async () => {
  await go('public_own')(); const a = await readAudience(p); assert.equal(a.audience, 'public'); assert.equal(a.clickable, true);
});
await check('foto própria pública -> Somente eu, verificado após recarregar', async () => {
  const r = await setPhotoOnlyMe(p, null, { reload: go('public_own') });
  assert.equal(r.code, 'changed_verified'); assert.equal(r.before, 'public'); assert.equal(r.after, 'only_me');
  assert.notEqual(await p.evaluate(() => window.DELETED), true);
});
await check('já estava Somente eu -> não mexe', async () => {
  const r = await setPhotoOnlyMe(p, null, { reload: go('already') }); assert.equal(r.code, 'already_only_me');
});
await check('foto de outra pessoa -> exceção not_editable, sem clicar em Excluir/Denunciar', async () => {
  const r = await setPhotoOnlyMe(p, null, { reload: go('others') });
  assert.equal(r.code, 'not_editable'); assert.notEqual(await p.evaluate(() => window.DELETED), true);
});
await check('público definido pelo álbum -> album_governed', async () => {
  const r = await setPhotoOnlyMe(p, null, { reload: go('governed') }); assert.equal(r.code, 'album_governed');
});
await check('alternativa pelo menu "..." > Editar público', async () => {
  const r = await setPhotoOnlyMe(p, null, { reload: go('menu_fallback') });
  assert.equal(r.code, 'changed_verified'); assert.notEqual(await p.evaluate(() => window.DELETED), true);
});
await check('salvamento que não pega -> not_verified (não declara privado)', async () => {
  const r = await setPhotoOnlyMe(p, null, { reload: go('broken') }); assert.equal(r.code, 'not_verified');
});
await check('álbum: Editar > público > Somente eu > Salvar, verificado; não toca "Excluir álbum"', async () => {
  const r = await setAlbumOnlyMe(p, null, { reload: go('album') });
  assert.equal(r.code, 'changed_verified'); assert.notEqual(await p.evaluate(() => window.DELETED), true);
});
await check('safeClick recusa "Excluir"', async () => {
  await go('public_own')();
  await p.click('[aria-label="Ações para esta publicação"]');
  await assert.rejects(safeClick(p.locator('[role=menuitem]', { hasText: 'Excluir foto' })), SafetyError);
  assert.notEqual(await p.evaluate(() => window.DELETED), true);
});
await check('aviso de bloqueio -> PlatformBlockError (para tudo)', async () => {
  await assert.rejects(setPhotoOnlyMe(p, null, { reload: go('blocked') }), PlatformBlockError);
});

await browser.close();
for (const [s, n] of results) console.log(s, n);
const failed = results.filter((r) => r[0] === 'FAIL').length;
console.log(failed ? `\n${failed} falha(s)` : '\nTodos os cenários passaram.');
process.exit(failed ? 1 : 0);
