// shots.js — "O tempo não espera" (sem narração; a história é contada só com imagem, texto curto e sons).
import { E, V, registerShot, mood, layer, blurLayer, veil, ease, prog, key, clamp, lerp, shake, rng, seg, circle, ring, rr, poly, glow, alpha, shade, mix, linGrad, text, FONTS, S } from '/engine/core.js';
import { EXPR, drawFigure, POSES, posesAt, breathe, walkPose, bigFace, headPos, soccerBall } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { bedroom, park, dining, table, street, bench, ground } from '../sets/sets.js';
import { LEO, LEO_OLD, LEO_KID, PAI, LIA, NINA, NINA_ADULT, PHONE } from '../cast.js';

EXPR.absorbed = { eyes: 'dot', brows: null, mouth: 'smallFlat', look: [0.3, 0.9] };   // vidrado na tela
EXPR.lost = { eyes: 'dot', brows: null, mouth: 'frown' };   // tristeza sem sobrancelha (no close as 'worried' parecem bravas)
const rim = (M, dir = [0.5, -1]) => ({ color: M.rim, dir, w: 5 });
const PH = { type: 'phone', glow: PHONE };
const blinkOf = (t, p) => (t % p) > p - 0.1;
// brilho do celular no rosto (luz-chave fria vinda de baixo)
function phoneGlow(g, o) { const [hx, hy] = headPos(o); glow(g, hx + 20 * (o.facing ?? 1) * (o.s ?? 1), hy + 50 * (o.s ?? 1), 170 * (o.s ?? 1), PHONE, 0.5); }
// selo de idade no canto (o tempo passando)
function age(g, t, n, from = n) { const v = Math.round(lerp(from, n, ease.inOut(prog(t, 0.2, 1.4)))); UI.badge(g, { str: `${v} ANOS`, a: ease.out(prog(t, 0, 0.3)), x: E.W - 90, y: 190 }); }

// ---- diálogos escritos (balão com texto digitado, cauda apontando para quem fala) ----
// cam: a mesma câmera do layer de profundidade 1; (wx, wy) = cabeça de quem fala no mundo
const toScreen = (cam, x, y) => { const z = cam.z ?? 1; return [(x - E.W / 2 - (cam.x || 0)) * z + E.W / 2, (y - E.H / 2 - (cam.y || 0)) * z + E.H / 2]; };
function say(g, t, o) {
  const { str, at = 0, out = 99, x, y, side = 0, size = 46, dark = false } = o;
  const k = ease.outBack(prog(t, at, at + 0.25)), fade = 1 - prog(t, out, out + 0.25);
  if (k <= 0 || fade <= 0) return;
  const n = Math.ceil(str.length * clamp((t - at) / Math.max(0.3, str.length * 0.035)));   // efeito de digitação
  const lines = str.split('\n'); g.save(); g.font = `900 ${size}px "${FONTS.ui}"`;
  const w = Math.max(...lines.map(l => g.measureText(l).width)) + size * 1.2, h = lines.length * size * 1.18 + size * 0.8;
  const bx = clamp(x + side * w * 0.3, w / 2 + 30, E.W - w / 2 - 30), by = y - h / 2 - 40;
  g.globalAlpha *= fade; g.translate(x, y); g.scale(k, k); g.translate(-x, -y);
  const bg = dark ? '#16202e' : '#f6f2ea', fg = dark ? '#e8f0ff' : '#14161c';
  g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 24;
  rr(g, bx - w / 2, by - h / 2, w, h, Math.min(40, h / 2)); g.fillStyle = bg; g.fill(); g.shadowBlur = 0;
  poly(g, [[clamp(x, bx - w / 2 + 40, bx + w / 2 - 40) - 22, by + h / 2 - 2], [x, y - 6], [clamp(x, bx - w / 2 + 40, bx + w / 2 - 40) + 22, by + h / 2 - 2]], bg);
  let left = n; lines.forEach((l, i) => { const vis = l.slice(0, Math.max(0, left)); left -= l.length + 1;
    text(g, vis, bx - g.measureText(l).width / 2 * 0 , by - h / 2 + size * 0.4 + size * 1.18 * (i + 0.5), { size, color: fg, font: FONTS.ui, weight: 900 }); });
  g.restore();
}
const headOf = (o) => headPos(o);
const sitPhone = () => ({ ...POSES.sit, eF: [18, -116], hF: [26, -140], head: [10, -174] });   // sentado, cabeça baixa no celular
const standPhone = () => ({ ...POSES.phone, head: [10, -200] });

// s01 — quarto, 23:59. "SÓ MAIS 5 MINUTOS…"
registerShot('s01', { draw(g, t, info) {
  const cam = { z: 1.25 + 0.08 * ease.inOut(t / info.dur), x: -60, y: 60 };
  const { GY, CX, M } = bedroom(g, t, cam);
  layer(g, cam, 1, (g) => {
    const o = { x: CX - 120, y: GY + 14, s: 1.5,   // quadril no colchão (topo em GY-96), pés no chão
    facing: 1, outfit: LEO, pose: breathe(sitPhone(), t), expr: 'absorbed', look: [0.3, 0.8], rim: rim(M, [1, -0.6]), prop: PH, shadow: false, blink: blinkOf(t, 3.1) };
    drawFigure(g, o); phoneGlow(g, o);
  });
  FX.dust(g, t, { count: 30, color: M.rim, a: 0.25 });
  UI.bigLine(g, t, { str: 'SÓ MAIS 5 MINUTOS…', dur: info.dur, y: E.H * 0.2, size: 70, color: S().ui.cream });
} });

// s02 — close: rosto iluminado só pela tela
registerShot('s02', { draw(g, t, info) {
  blurLayer(g, 14, (g) => bedroom(g, t, { z: 1.5, x: -150, y: -100 })); veil(g, '#05060c', 0.45);
  const r = 320 * (1 + 0.05 * t), cx = E.W / 2, cy = E.H * 0.5;
  bigFace(g, cx, cy, r, { outfit: LEO, expr: 'absorbed', look: [0.1, 0.9], rimColor: PHONE, rimSide: 1, blink: blinkOf(t, 2.4) });
  glow(g, cx + 40, cy + r * 1.2, r * 1.4, PHONE, 0.35);
} });

// s03 — insert da tela: feed infinito + notificações
registerShot('s03', { draw(g, t, info) {
  const M = mood('night');
  blurLayer(g, 18, (g) => bedroom(g, t, { z: 2, x: -200, y: 0 })); veil(g, '#05060c', 0.5);
  const w = 560, h = 1000, x = E.W / 2 - w / 2, y = E.H * 0.45 - h / 2 + 10 * Math.sin(t * 2);
  // mão segurando
  seg(g, [[x + 40, y + h + 200], [x + 60, y + h - 60]], 110, S().ink); seg(g, [[x + w + 10, y + h * 0.55], [x + w - 30, y + h * 0.6]], 50, S().ink);
  FX.screen(g, { x, y, w, h, bg: '#0e1622', glowC: PHONE, a: 0.3 }, (g, x, y, w, h) => {
    const off = (t * 900) % 330, cols = ['#d64a33', '#3a6ea5', '#8a5ad6', '#3fb950', '#f2c21a'];
    for (let i = -1; i < 5; i++) { const cy = y + 20 + i * 330 - off + 330, k = (i + Math.floor(t * 900 / 330)) % 5;
      rr(g, x + 24, cy, w - 48, 300, 18); g.fillStyle = '#18243a'; g.fill();
      rr(g, x + 40, cy + 16, w - 80, 190, 12); g.fillStyle = shade(cols[(k + 5) % 5], -0.25); g.fill();
      circle(g, x + 70, cy + 245, 22, cols[(k + 7) % 5]); g.fillStyle = '#4a5a78'; g.fillRect(x + 105, cy + 232, 220, 12); g.fillRect(x + 105, cy + 252, 150, 10); }
  });
  const n = Math.min(99, Math.floor(t * 40));
  for (const [k, at, lbl] of [[0, 0.4, 'NOVA CURTIDA'], [1, 1.1, '12 MENSAGENS'], [2, 1.8, 'AO VIVO AGORA']]) {
    const p = ease.outBack(prog(t, at, at + 0.25)); if (p <= 0) continue;
    g.save(); g.translate(E.W / 2, y + 120 + k * 120); g.scale(p, p);
    rr(g, -240, -42, 480, 84, 42); g.fillStyle = 'rgba(240,244,255,.95)'; g.fill(); circle(g, -190, 0, 24, '#d64a33');
    text(g, lbl, 20, 2, { size: 36, color: '#1a2030', font: FONTS.ui, weight: 900 }); g.restore();
  }
  UI.badge(g, { str: `+${n}`, x: E.W - 110, y: 190, color: S().ui.accent, size: 64 });
} });

// s04 — praça: o pai chega com a bola e chama; Léo (12 anos) no banco, no celular: "AGORA NÃO DÁ, PAI…"
registerShot('s04', { draw(g, t, info) {
  const cam = { z: 1.2 + 0.05 * ease.inOut(t / info.dur), x: -60 + 20 * ease.inOut(t / info.dur), y: 40 };
  const { GY, CX, M } = park(g, t, cam);
  let leoH, paiH;
  layer(g, cam, 1, (g) => {
    const lo = { x: CX - 260, y: GY - 92 + 72, s: 1.0, facing: 1, outfit: LEO_KID, pose: breathe(t > 1.7 && t < 2.6 ? { ...sitPhone(), head: [12, -178] } : sitPhone(), t), expr: t > 1.7 && t < 2.6 ? 'nervous' : 'absorbed', rim: rim(M), prop: PH, shadow: false };
    drawFigure(g, lo); phoneGlow(g, lo); leoH = headOf(lo);
    const arrive = ease.out(prog(t, 0, 0.7)), px = lerp(CX + 360, CX + 60, arrive);
    const pose = t < 0.7 ? walkPose(t * 6) : breathe(posesAt(t, [[0.7, POSES.stand], [0.9, { ...POSES.holdFront }], [2.8, POSES.sad]]), t, 1, 5);
    const po = { x: px, y: GY + 20, s: 1.1, facing: -1, outfit: PAI, pose, expr: t < 2.7 ? 'happy' : 'sad', rim: rim(M), blink: blinkOf(t, 2.9) };
    drawFigure(g, po); paiH = headOf(po);
    if (t < 2.8) soccerBall(g, px - 34, GY + 20 - 160 + (t < 0.7 ? Math.abs(Math.sin(t * 9)) * -30 : 0), 20, t * 3);
    else soccerBall(g, px - 60 - (t - 2.8) * 60, GY + 6, 20, -(t - 2.8) * 3);
  });
  const lp = toScreen(cam, ...leoH), pp = toScreen(cam, ...paiH);
  say(g, t, { str: 'BORA JOGAR BOLA,\nFILHO?', at: 0.6, out: 1.65, x: pp[0], y: pp[1] - 90, side: 0.3 });
  say(g, t, { str: 'AGORA NÃO DÁ, PAI…', at: 1.95, out: 3.9, x: lp[0], y: lp[1] - 80, side: 0.4, dark: true });
  FX.dust(g, t, { count: 40, color: M.key, a: 0.3 });
  age(g, t, 12);
} });

// s05 — OTS: Léo (no banco) desfocado em 1º plano; o pai desiste e vai embora sozinho com a bola
registerShot('s05', { draw(g, t, info) {
  const cam = { z: 1.25, x: 120 + 30 * ease.inOut(t / info.dur), y: -40 };
  const { GY, CX, M } = park(g, t, cam, { bench: false });
  layer(g, cam, 1, (g) => {
    const leave = ease.inOut(prog(t, 0.6, info.dur)), x = CX + 200 + leave * 420;
    drawFigure(g, { x, y: GY + 20, s: 1.15, facing: 1, outfit: PAI, pose: t < 0.6 ? breathe(POSES.sad, t) : walkPose(t * 4.5), expr: 'sad', rim: rim(M) });
    soccerBall(g, x + 40, GY + 20 - 110, 18, 0);
  });
  // 1º plano desfocado: o banco + Léo sentado nele, olhando o celular
  blurLayer(g, 12, (g) => {
    const by = E.H * 1.02; g.save(); g.translate(E.W * 0.12, by); g.scale(2.6, 2.6); bench(g, 0, 0, mood('golden')); g.restore();
    drawFigure(g, { x: E.W * 0.12, y: by - 92 * 2.6 + 72 * 2.6, s: 2.6 * 0.72, facing: 1, outfit: LEO_KID, pose: sitPhone(), expr: 'absorbed', shadow: false });
  });
  glow(g, E.W * 0.26, E.H * 0.7, 200, PHONE, 0.35);
  FX.dust(g, t, { count: 40, color: mood('golden').key, a: 0.3 });
} });

// s06 — jantar de aniversário: Lia e Nina comemoram, Léo no celular
registerShot('s06', { draw(g, t, info) {
  const cam = { z: 1.15 + 0.05 * ease.inOut(t / info.dur), x: -20, y: 40 };
  const { GY, CX, M } = dining(g, t, cam);
  let liaH, leoH;
  layer(g, cam, 1, (g) => {
    liaH = headOf({ x: CX + 210, y: GY, s: 1.05, facing: -1, outfit: LIA, pose: POSES.sit });
    drawFigure(g, { x: CX + 210, y: GY, s: 1.05, facing: -1, outfit: LIA, pose: breathe(posesAt(t, [[0, POSES.sit], [0.8, POSES.cheer], [1.8, POSES.sit]]), t, 1, 2), expr: 'joy', rim: rim(M, [-0.5, -1]), blink: blinkOf(t, 3.3) });
    drawFigure(g, { x: CX + 20, y: GY, s: 1.0, facing: -1, outfit: NINA, pose: breathe(POSES.cheer, t, 1, 3), expr: 'joy', rim: rim(M, [0, -1]) });
    for (const [cx2, f] of [[CX - 230, 1], [CX + 210, -1]]) { g.save(); g.translate(cx2, 0); g.scale(f, 1); FX.chair(g, -18, GY, 1.05, shade(M.dark, -0.2)); g.restore(); }
    const lo = { x: CX - 230, y: GY, s: 1.05, facing: 1, outfit: LEO, pose: breathe(sitPhone(), t), expr: 'absorbed', look: [0.3, 0.8], rim: rim(M, [0.5, -1]), prop: PH };
    drawFigure(g, lo); leoH = headOf(lo);
    const top = table(g, CX, GY, M, 640); phoneGlow(g, lo);
    // bolo com velas
    rr(g, CX - 70, top - 90, 140, 90, 10); g.fillStyle = '#f2e6d8'; g.fill(); g.fillStyle = '#c86a8a'; g.fillRect(CX - 70, top - 60, 140, 14);
    for (const dx of [-36, 0, 36]) { seg(g, [[CX + dx, top - 90], [CX + dx, top - 120]], 6, '#9fd8ff'); const fl = 1 + 0.15 * Math.sin(t * 20 + dx); circle(g, CX + dx, top - 130, 7 * fl, '#ffe08a'); glow(g, CX + dx, top - 130, 50, M.practical, 0.7); }
    text(g, '8', CX, top - 40, { size: 40, color: '#5a2a3a', font: FONTS.ui, weight: 900 });
  });
  const a1 = toScreen(cam, ...liaH), a2 = toScreen(cam, ...leoH);
  say(g, t, { str: 'AMOR, VEM CANTAR\nPARABÉNS!', at: 0.3, out: 1.9, x: a1[0], y: a1[1] - 70, side: -0.3 });
  say(g, t, { str: 'JÁ VOU… SÓ UM\nMINUTINHO.', at: 1.8, out: 3.5, x: a2[0], y: a2[1] - 70, side: 0.3, dark: true });
  FX.dust(g, t, { count: 30, color: M.practical, a: 0.3 });
  age(g, t, 34, 12);
} });

// s07 — Nina mostra um desenho; ele não olha; ela abaixa o papel
registerShot('s07', { draw(g, t, info) {
  const cam = { z: 1.55, x: -110, y: 60 };
  const { GY, CX, M } = dining(g, t, cam);
  let ninaH, leoH;
  layer(g, cam, 1, (g) => {
    const lower = t > 1.7;
    ninaH = headOf({ x: CX - 20, y: GY, s: 1.0, facing: -1, outfit: NINA, pose: POSES.holdFront });
    const show = { ...POSES.holdFront, hF: [30, -175], eF: [22, -150] };
    drawFigure(g, { x: CX - 20, y: GY, s: 1.0, facing: -1, outfit: NINA, pose: breathe(lower ? posesAt(t, [[1.7, show], [2.1, POSES.sad]]) : show, t, 1, 3), expr: t < 0.9 ? 'happy' : t < 1.7 ? 'worried' : 'sad', rim: rim(M, [0, -1]), prop: lower ? null : 'paper' });
    { g.save(); g.translate(CX - 270, 0); FX.chair(g, -18, GY, 1.05, shade(M.dark, -0.2)); g.restore(); }
    const lo = { x: CX - 270, y: GY, s: 1.05, facing: 1, outfit: LEO, pose: breathe(sitPhone(), t), expr: 'absorbed', look: [0.3, 0.8], rim: rim(M), prop: PH };
    drawFigure(g, lo); phoneGlow(g, lo); leoH = headOf(lo);
    if (!lower) { // desenho em destaque: família de palito com um sol
      const px = CX - 170, py = GY - 330; rr(g, px - 70, py - 55, 140, 110, 6); g.fillStyle = '#f6eedd'; g.fill();
      circle(g, px + 40, py - 25, 14, '#f2c21a');
      for (const [dx, h, c] of [[-40, 60, '#d64a33'], [-10, 50, '#8a5ad6'], [18, 34, '#f2c21a']]) { circle(g, px + dx, py + 30 - h, 8, '#1a1420'); seg(g, [[px + dx, py + 38 - h], [px + dx, py + 40]], 4, c); }
    }
  });
  const n = toScreen(cam, ...ninaH), l = toScreen(cam, ...leoH);
  say(g, t, { str: 'PAI, OLHA MEU\nDESENHO!', at: 0.15, out: 1.4, x: n[0], y: n[1] - 250, side: 0.2, size: 42 });
  say(g, t, { str: 'AGORA NÃO DÁ,\nFILHA…', at: 1.3, out: 2.9, x: l[0], y: l[1] - 70, side: 0.3, size: 42, dark: true });
  FX.dust(g, t, { count: 25, color: M.practical, a: 0.3 });
} });

// s08 — o tempo dispara: relógio girando, anos passando
registerShot('s08', { draw(g, t, info) {
  const M = mood('void'); g.fillStyle = linGrad(g, 0, 0, 0, E.H, M.sky); g.fillRect(0, 0, E.W, E.H);
  const sp = 1 + t * t * 900;
  FX.speedLines(g, t, { cx: E.W / 2, cy: E.H * 0.45, count: 70, a: 0.3 });
  FX.clock(g, E.W / 2, E.H * 0.45, 260 * (1 + 0.05 * t), 3600 * 9 + t * 3600 * 6 * sp / 40, { face: '#e8ecf5', speed: 1 });
  glow(g, E.W / 2, E.H * 0.45, 600, M.rim, 0.15);
  const yr = Math.round(lerp(2026, 2056, ease.in(prog(t, 0, info.dur))));
  text(g, String(yr), E.W / 2, E.H * 0.72, { size: 120, color: S().ui.gold, glow: 30, glowColor: alpha(S().ui.gold, 0.6), font: FONTS.ui, weight: 900 });
  age(g, t, 64, 34);
} });

// s09 — porta: Nina adulta sai com a mala e acena; Léo velho na poltrona, no celular
registerShot('s09', { draw(g, t, info) {
  const cam = { z: 1.1 + 0.04 * ease.inOut(t / info.dur), x: 40, y: 20 };
  const door = clamp(1 - prog(t, 2.6, 3.3)) * 0.9 + 0.0001;
  const { GY, CX, M } = dining(g, t, cam, { door, lampX: CX0() - 200 });
  let ninaH = [0, 0], leoH;
  layer(g, cam, 1, (g) => {
    if (t < 2.7) {
      const leave = ease.in(prog(t, 1.6, 2.7));
      const wav = { ...POSES.wave }; const pose = breathe(t < 1.6 ? wav : walkPose(t * 5), t, 1, 4);
      ninaH = headOf({ x: CX + 300, y: GY, s: 1.1, facing: -1, outfit: NINA_ADULT, pose: POSES.wave });
      drawFigure(g, { x: CX + 300 + leave * 60, y: GY, s: 1.1, facing: -1, outfit: NINA_ADULT, pose, expr: 'sad', rim: rim(M, [1, -0.3]), alpha: 1 - prog(t, 2.3, 2.7) });
      rr(g, CX + 360 + leave * 60, GY - 110, 80, 110, 10); g.fillStyle = shade('#f2c21a', -0.5); g.fill();
    }
    // poltrona
    rr(g, CX - 400, GY - 190, 260, 190, 30); g.fillStyle = shade(M.dark, 0.05); g.fill(); rr(g, CX - 420, GY - 120, 300, 120, 24); g.fill();
    const lo = { x: CX - 270, y: GY - 40, s: 1.0, facing: 1, outfit: LEO_OLD, pose: breathe(sitPhone(), t), expr: 'absorbed', look: [0.3, 0.8], rim: rim(M), prop: PH, shadow: false };
    drawFigure(g, lo); phoneGlow(g, lo); leoH = headOf(lo);
  });
  const n = toScreen(cam, ...ninaH), l = toScreen(cam, ...leoH);
  say(g, t, { str: 'TCHAU, PAI. VOU\nSENTIR SAUDADE.', at: 0.15, out: 1.6, x: n[0], y: n[1] - 60, side: -0.4, size: 42 });
  say(g, t, { str: 'UHUM… TCHAU.', at: 1.5, out: 2.9, x: l[0], y: l[1] - 70, side: 0.4, size: 42, dark: true });
  FX.dust(g, t, { count: 30, color: M.practical, a: 0.25 });
  age(g, t, 64);
} });
const CX0 = () => E.W / 2;

// s10 — rua, chuva: Léo velho caminha sozinho, a única luz é a tela
registerShot('s10', { draw(g, t, info) {
  const cam = { z: 1.1, x: -60 + 60 * ease.inOut(t / info.dur), y: 0 };
  const { GY, CX, M } = street(g, t, cam);
  layer(g, cam, 1, (g) => {
    const x = CX - 300 + t * 70;
    const wp = walkPose(t * 3.2); const pose = { ...wp, head: [wp.head[0] + 10, wp.head[1] + 10], hF: [26, -150], eF: [18, -126] };
    const o = { x, y: GY + 30, s: 1.1, facing: 1, outfit: LEO_OLD, pose, expr: 'sad', look: [0.3, 0.8], rim: rim(M, [1, -0.5]), prop: PH };
    drawFigure(g, o); phoneGlow(g, o);
  });
  FX.rain(g, t, { count: 260, a: 0.35 });
  FX.fog(g, ground() - 200, 300, M.fog, 0.25);
} });

// s11 — a bateria acaba: 1% → tela preta (insert)
registerShot('s11', { draw(g, t, info) {
  blurLayer(g, 16, (g) => street(g, t, { z: 1.8, x: 100, y: -100 })); veil(g, '#03040a', 0.55);
  FX.rain(g, t, { count: 120, a: 0.2 });
  const w = 520, h = 940, x = E.W / 2 - w / 2, y = E.H * 0.44 - h / 2, off = t > 1.6;
  seg(g, [[x + 40, y + h + 200], [x + 60, y + h - 60]], 110, S().ink);
  FX.screen(g, { x, y, w, h, bg: off ? '#020203' : '#0e1622', glowC: PHONE, a: off ? 0 : 0.3 }, (g, x, y, w, h) => {
    if (off) { const k = 1 - prog(t, 1.6, 1.75); g.fillStyle = alpha('#ffffff', k * 0.9); g.fillRect(x, y + h / 2 - 2, w * k, 4); return; }
    const bl = Math.floor(t * 4) % 2 === 0;
    rr(g, x + w / 2 - 90, y + h / 2 - 45, 170, 90, 12); g.strokeStyle = '#d8e4f4'; g.lineWidth = 8; g.stroke(); g.fillStyle = '#d8e4f4'; g.fillRect(x + w / 2 + 80, y + h / 2 - 18, 14, 36);
    if (bl) { g.fillStyle = S().ui.accent; g.fillRect(x + w / 2 - 80, y + h / 2 - 35, 18, 70); }
    text(g, '1%', x + w / 2, y + h / 2 + 110, { size: 72, color: S().ui.accent, font: FONTS.ui, weight: 900 });
  });
  if (off) glow(g, E.W / 2, E.H * 0.44, 300, '#ffffff', 0.15 * (1 - prog(t, 1.6, 2.2)));
} });

// s12 — close do Léo velho: finalmente levanta os olhos… e não há ninguém
registerShot('s12', { draw(g, t, info) {
  const M = mood('storm');
  blurLayer(g, 14, (g) => street(g, t, { z: 1.6, x: -200, y: -150 })); veil(g, '#03040a', 0.35);
  FX.rain(g, t, { count: 150, a: 0.25 });
  const r = 330 * (1 + 0.06 * t), cx = E.W / 2, cy = E.H * 0.52;
  const up = ease.inOut(prog(t, 0.5, 1.5));
  bigFace(g, cx, cy, r, { outfit: { ...LEO_OLD, face: null }, expr: t < 0.8 ? 'absorbed' : 'lost', look: [lerp(0.1, -0.5, up), lerp(0.9, -0.3, up)], rimColor: M.rim, rimSide: -1, blink: blinkOf(t, 2.2) });
  if (t > 2.0) { const k = ease.in(prog(t, 2.0, 3.2)); circle(g, cx - r * 0.38, cy + r * 0.05 + k * r * 0.5, 9, alpha('#bcd8ff', 0.9 * (1 - prog(t, 3.0, 3.2)))); }   // uma lágrima
  say(g, t, { str: 'CADÊ TODO MUNDO?', at: 1.5, out: 3.4, x: cx + r * 0.3, y: cy - r * 1.05, side: 0, dark: true });
} });

// s13 — final: o banco vazio da praça ao entardecer + mensagem
registerShot('s13', { draw(g, t, info) {
  const cam = { z: 1.0 + 0.06 * ease.inOut(t / info.dur), x: -60, y: 0 };
  const { GY, CX, M } = park(g, t, cam);
  layer(g, cam, 1, (g) => { const r = rng(4); rr(g, CX - 220, GY - 112, 26, 46, 4); g.fillStyle = S().ink; g.fill(); g.fillStyle = '#20242c'; g.fillRect(CX - 216, GY - 108, 18, 38); });   // o celular esquecido no banco, apagado
  FX.dust(g, t, { count: 40, color: M.key, a: 0.3 });
  veil(g, '#000', 0.25 * prog(t, 0.6, 1.5));
  UI.bigLine(g, t, { str: 'O TEMPO NÃO ESPERA.', dur: info.dur + 0.6, y: E.H * 0.24, size: 80 });
} });

// s14 — LIÇÃO DE MORAL: volta para a praça; desta vez o Léo (12 anos) larga o celular e vai jogar com o pai
registerShot('s14', { draw(g, t, info) {
  const cam = { z: 1.15 + 0.06 * ease.inOut(t / info.dur), x: -20, y: 40 };
  const { GY, CX, M } = park(g, t, cam);
  let leoH, paiH;
  const up = t > 0.9, run = ease.inOut(prog(t, 1.6, 2.6));
  layer(g, cam, 1, (g) => {
    // o celular fica no banco, virado para baixo
    rr(g, CX - 230, GY - 104, 44, 14, 4); g.fillStyle = S().ink; g.fill();
    const lx = lerp(CX - 260, CX - 10, run), kick = t > 2.8;
    const lpose = !up ? breathe(sitPhone(), t) : t < 1.6 ? breathe(POSES.stand, t) : t < 2.6 ? walkPose(t * 9, { run: true }) : breathe(kick ? POSES.cheer : POSES.ready, t);
    const lo = { x: lx, y: up ? GY + 20 : GY - 20, s: 1.0, facing: 1, outfit: LEO_KID, pose: lpose, expr: up ? 'joy' : 'absorbed', rim: rim(M), shadow: up };
    if (!up) lo.prop = PH;
    drawFigure(g, lo); leoH = headOf(lo);
    const po = { x: CX + 250, y: GY + 20, s: 1.1, facing: -1, outfit: PAI, pose: breathe(t < 2.6 ? POSES.holdFront : POSES.cheer, t, 1, 5), expr: t < 1.0 ? 'sad' : 'joy', rim: rim(M), blink: blinkOf(t, 2.9) };
    drawFigure(g, po); paiH = headOf(po);
    // a bola: com o pai → chutada de um para o outro
    const bt = t - 2.6, bx = bt < 0 ? CX + 215 : CX + 30 + Math.sin(bt * 2.2) * 200, by = bt < 0 ? GY - 150 : GY + 20 - Math.abs(Math.sin(bt * 4.4)) * 180;
    soccerBall(g, bx, by, 20, t * 5);
  });
  const l = toScreen(cam, ...leoH), p = toScreen(cam, ...paiH);
  say(g, t, { str: 'PAI, ESPERA!\nAGORA DÁ!', at: 0.9, out: 2.5, x: l[0], y: l[1] - 70, side: 0.3 });
  FX.dust(g, t, { count: 50, color: M.key, a: 0.35 });
  FX.lensStreak(g, E.W / 2, E.H * 0.3, E.W * 1.2, M.key, 0.2);
  // a moral
  const a1 = ease.out(prog(t, 2.9, 3.5)), a2 = ease.out(prog(t, 3.7, 4.3));
  if (a1 > 0) { veil(g, '#000', 0.25 * a1); text(g, 'QUEM TE AMA NÃO VAI', E.W / 2, E.H * 0.14, { size: 58, color: S().ui.cream, alpha: a1, font: FONTS.ui, weight: 900, stroke: 10, strokeColor: 'rgba(0,0,0,.6)' });
    text(g, 'ESTAR AÍ PARA SEMPRE.', E.W / 2, E.H * 0.14 + 72, { size: 58, color: S().ui.cream, alpha: a1, font: FONTS.ui, weight: 900, stroke: 10, strokeColor: 'rgba(0,0,0,.6)' }); }
  if (a2 > 0) { text(g, 'LARGUE O CELULAR.', E.W / 2, E.H * 0.78, { size: 76, color: S().ui.gold, alpha: a2, glow: 24, glowColor: alpha(S().ui.gold, 0.6), stroke: 12, strokeColor: 'rgba(0,0,0,.6)' });
    text(g, 'VIVA AGORA.', E.W / 2, E.H * 0.78 + 92, { size: 76, color: S().ui.gold, alpha: a2, glow: 24, glowColor: alpha(S().ui.gold, 0.6), stroke: 12, strokeColor: 'rgba(0,0,0,.6)' }); }
} });
