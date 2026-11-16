// shots.js — "O tempo não espera" (sem narração; a história é contada só com imagem, texto curto e sons).
import { E, V, registerShot, mood, layer, blurLayer, veil, ease, prog, key, clamp, lerp, shake, rng, seg, circle, ring, rr, poly, glow, alpha, shade, mix, linGrad, text, FONTS, S } from '/engine/core.js';
import { EXPR, drawFigure, POSES, posesAt, breathe, walkPose, bigFace, headPos, soccerBall } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { bedroom, park, dining, table, street, bench, ground } from '../sets/sets.js';
import { LEO, LEO_OLD, BETO, LIA, NINA, NINA_ADULT, PHONE } from '../cast.js';

EXPR.lost = { eyes: 'dot', brows: null, mouth: 'frown' };   // tristeza sem sobrancelha (no close as 'worried' parecem bravas)
const rim = (M, dir = [0.5, -1]) => ({ color: M.rim, dir, w: 5 });
const PH = { type: 'phone', glow: PHONE };
const blinkOf = (t, p) => (t % p) > p - 0.1;
// brilho do celular no rosto (luz-chave fria vinda de baixo)
function phoneGlow(g, o) { const [hx, hy] = headPos(o); glow(g, hx + 20 * (o.facing ?? 1) * (o.s ?? 1), hy + 50 * (o.s ?? 1), 170 * (o.s ?? 1), PHONE, 0.5); }
// selo de idade no canto (o tempo passando)
function age(g, t, n, from = n) { const v = Math.round(lerp(from, n, ease.inOut(prog(t, 0.2, 1.4)))); UI.badge(g, { str: `${v} ANOS`, a: ease.out(prog(t, 0, 0.3)), x: E.W - 90, y: 190 }); }
const sitPhone = () => ({ ...POSES.sit, eF: [18, -116], hF: [26, -140], head: [10, -174] });   // sentado, cabeça baixa no celular
const standPhone = () => ({ ...POSES.phone, head: [10, -200] });

// s01 — quarto, 23:59. "SÓ MAIS 5 MINUTOS…"
registerShot('s01', { draw(g, t, info) {
  const cam = { z: 1.25 + 0.08 * ease.inOut(t / info.dur), x: -60, y: 60 };
  const { GY, CX, M } = bedroom(g, t, cam);
  layer(g, cam, 1, (g) => {
    const o = { x: CX - 120, y: GY - 70, s: 1.5, facing: 1, outfit: LEO, pose: breathe(sitPhone(), t), expr: 'sleepy', look: [0.3, 0.8], rim: rim(M, [1, -0.6]), prop: PH, shadow: false, blink: blinkOf(t, 3.1) };
    drawFigure(g, o); phoneGlow(g, o);
  });
  FX.dust(g, t, { count: 30, color: M.rim, a: 0.25 });
  UI.bigLine(g, t, { str: 'SÓ MAIS 5 MINUTOS…', dur: info.dur, y: E.H * 0.2, size: 70, color: S().ui.cream });
} });

// s02 — close: rosto iluminado só pela tela
registerShot('s02', { draw(g, t, info) {
  blurLayer(g, 14, (g) => bedroom(g, t, { z: 1.5, x: -150, y: -100 })); veil(g, '#05060c', 0.45);
  const r = 320 * (1 + 0.05 * t), cx = E.W / 2, cy = E.H * 0.5;
  bigFace(g, cx, cy, r, { outfit: LEO, expr: 'sleepy', look: [0.1, 0.9], rimColor: PHONE, rimSide: 1, blink: blinkOf(t, 2.4) });
  glow(g, cx + 40, cy + r * 1.2, r * 1.4, PHONE, 0.35);
  for (let i = 0; i < 4; i++) { const y = cy - r * 0.15 + ((t * 260 + i * 70) % 280) - 140; g.fillStyle = alpha(PHONE, 0.18); g.fillRect(cx - r * 0.55, y, r * 1.1, 4); }  // reflexo do feed rolando
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

// s04 — praça: amigos jogando bola, Beto chama; Léo no banco, no celular
registerShot('s04', { draw(g, t, info) {
  const cam = { z: 1.05 + 0.05 * ease.inOut(t / info.dur), x: 20 * ease.inOut(t / info.dur), y: 0 };
  const { GY, CX, M } = park(g, t, cam);
  layer(g, cam, 1, (g) => {
    const lo = { x: CX - 260, y: GY - 92 + 72, s: 1.0, facing: 1, outfit: LEO, pose: breathe(sitPhone(), t), expr: 'sleepy', look: [0.3, 0.8], rim: rim(M), prop: PH, shadow: false };
    drawFigure(g, lo);
    // bola quicando entre dois amigos ao fundo
    const bx = CX + 120 + Math.sin(t * 2.4) * 120, by = GY - 20 - Math.abs(Math.sin(t * 4.8)) * 160;
    drawFigure(g, { x: CX + 330, y: GY - 10, s: 0.8, facing: -1, outfit: { top: 'tshirt', color: '#3a6ea5' }, pose: breathe(POSES.ready, t), expr: 'happy', rim: rim(M) });
    soccerBall(g, bx, by, 16, t * 6);
    const call = t > 1.0;
    drawFigure(g, { x: CX + 90, y: GY + 40, s: 1.05, facing: -1, outfit: BETO, pose: call ? breathe(posesAt(t, [[1.0, POSES.stand], [1.2, POSES.wave]]), t) : walkPose(t * 6, { run: true }), expr: 'joy', rim: rim(M), blink: blinkOf(t, 2.9) });
    if (call) FX.rings(g, CX + 70, GY - 180, t, { count: 2, r0: 30, r1: 110, color: '#fff3e0', a: 0.5 });
    if (call) UI.bubble(g, CX + 30, GY - 300, { w: 170, h: 80, str: 'VEM!' });
  });
  FX.dust(g, t, { count: 40, color: M.key, a: 0.3 });
  age(g, t, 18);
} });

// s05 — OTS: ombro do Léo desfocado em 1º plano; Beto desiste e vai embora
registerShot('s05', { draw(g, t, info) {
  const cam = { z: 1.25, x: 120 + 30 * ease.inOut(t / info.dur), y: -40 };
  const { GY, CX, M } = park(g, t, cam, { bench: false });
  layer(g, cam, 1, (g) => {
    const leave = ease.inOut(prog(t, 1.2, info.dur));
    const pose = t < 1.2 ? breathe(posesAt(t, [[0, POSES.wave], [0.5, POSES.sad]]), t) : walkPose(t * 5.6);
    drawFigure(g, { x: CX + 200 + leave * 380, y: GY + 20, s: 1.15, facing: t < 1.2 ? -1 : 1, outfit: BETO, pose, expr: t < 0.5 ? 'happy' : 'sad', rim: rim(M) });
  });
  blurLayer(g, 12, (g) => { drawFigure(g, { x: E.W * 0.12, y: E.H * 1.02, s: 3.0, facing: 1, outfit: LEO, pose: sitPhone(), expr: 'neutral', look: [0.3, 0.8], shadow: false }); });
  glow(g, E.W * 0.28, E.H * 0.62, 200, PHONE, 0.35);
  FX.dust(g, t, { count: 40, color: mood('golden').key, a: 0.3 });
} });

// s06 — jantar de aniversário: Lia e Nina comemoram, Léo no celular
registerShot('s06', { draw(g, t, info) {
  const cam = { z: 1.15 + 0.05 * ease.inOut(t / info.dur), x: -20, y: 40 };
  const { GY, CX, M } = dining(g, t, cam);
  layer(g, cam, 1, (g) => {
    drawFigure(g, { x: CX + 210, y: GY, s: 1.05, facing: -1, outfit: LIA, pose: breathe(posesAt(t, [[0, POSES.sit], [0.8, POSES.cheer], [1.8, POSES.sit]]), t, 1, 2), expr: 'joy', rim: rim(M, [-0.5, -1]), blink: blinkOf(t, 3.3) });
    drawFigure(g, { x: CX + 20, y: GY, s: 1.0, facing: -1, outfit: NINA, pose: breathe(POSES.cheer, t, 1, 3), expr: 'joy', rim: rim(M, [0, -1]) });
    for (const [cx2, f] of [[CX - 230, 1], [CX + 210, -1]]) { g.save(); g.translate(cx2, 0); g.scale(f, 1); FX.chair(g, -18, GY, 1.05, shade(M.dark, -0.2)); g.restore(); }
    const lo = { x: CX - 230, y: GY, s: 1.05, facing: 1, outfit: LEO, pose: breathe(sitPhone(), t), expr: 'sleepy', look: [0.3, 0.8], rim: rim(M, [0.5, -1]), prop: PH };
    drawFigure(g, lo);
    const top = table(g, CX, GY, M, 640); phoneGlow(g, lo);
    // bolo com velas
    rr(g, CX - 70, top - 90, 140, 90, 10); g.fillStyle = '#f2e6d8'; g.fill(); g.fillStyle = '#c86a8a'; g.fillRect(CX - 70, top - 60, 140, 14);
    for (const dx of [-36, 0, 36]) { seg(g, [[CX + dx, top - 90], [CX + dx, top - 120]], 6, '#9fd8ff'); const fl = 1 + 0.15 * Math.sin(t * 20 + dx); circle(g, CX + dx, top - 130, 7 * fl, '#ffe08a'); glow(g, CX + dx, top - 130, 50, M.practical, 0.7); }
    text(g, '8', CX, top - 40, { size: 40, color: '#5a2a3a', font: FONTS.ui, weight: 900 });
  });
  FX.dust(g, t, { count: 30, color: M.practical, a: 0.3 });
  age(g, t, 34, 18);
} });

// s07 — Nina mostra um desenho; ele não olha; ela abaixa o papel
registerShot('s07', { draw(g, t, info) {
  const cam = { z: 1.55, x: -110, y: 60 };
  const { GY, CX, M } = dining(g, t, cam);
  layer(g, cam, 1, (g) => {
    const lower = t > 1.7;
    const show = { ...POSES.holdFront, hF: [30, -175], eF: [22, -150] };
    drawFigure(g, { x: CX - 20, y: GY, s: 1.0, facing: -1, outfit: NINA, pose: breathe(lower ? posesAt(t, [[1.7, show], [2.1, POSES.sad]]) : show, t, 1, 3), expr: t < 0.9 ? 'happy' : t < 1.7 ? 'worried' : 'sad', rim: rim(M, [0, -1]), prop: lower ? null : 'paper' });
    { g.save(); g.translate(CX - 270, 0); FX.chair(g, -18, GY, 1.05, shade(M.dark, -0.2)); g.restore(); }
    const lo = { x: CX - 270, y: GY, s: 1.05, facing: 1, outfit: LEO, pose: breathe(sitPhone(), t), expr: 'sleepy', look: [0.3, 0.8], rim: rim(M), prop: PH };
    drawFigure(g, lo); phoneGlow(g, lo);
    if (!lower) { // desenho em destaque: família de palito com um sol
      const px = CX - 170, py = GY - 330; rr(g, px - 70, py - 55, 140, 110, 6); g.fillStyle = '#f6eedd'; g.fill();
      circle(g, px + 40, py - 25, 14, '#f2c21a');
      for (const [dx, h, c] of [[-40, 60, '#d64a33'], [-10, 50, '#8a5ad6'], [18, 34, '#f2c21a']]) { circle(g, px + dx, py + 30 - h, 8, '#1a1420'); seg(g, [[px + dx, py + 38 - h], [px + dx, py + 40]], 4, c); }
    }
  });
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
  layer(g, cam, 1, (g) => {
    if (t < 2.7) {
      const leave = ease.in(prog(t, 1.6, 2.7));
      const wav = { ...POSES.wave }; const pose = breathe(t < 1.6 ? wav : walkPose(t * 5), t, 1, 4);
      drawFigure(g, { x: CX + 300 + leave * 60, y: GY, s: 1.1, facing: -1, outfit: NINA_ADULT, pose, expr: 'sad', rim: rim(M, [1, -0.3]), alpha: 1 - prog(t, 2.3, 2.7) });
      rr(g, CX + 360 + leave * 60, GY - 110, 80, 110, 10); g.fillStyle = shade('#f2c21a', -0.5); g.fill();
    }
    // poltrona
    rr(g, CX - 400, GY - 190, 260, 190, 30); g.fillStyle = shade(M.dark, 0.05); g.fill(); rr(g, CX - 420, GY - 120, 300, 120, 24); g.fill();
    const lo = { x: CX - 270, y: GY - 40, s: 1.0, facing: 1, outfit: LEO_OLD, pose: breathe(sitPhone(), t), expr: 'sleepy', look: [0.3, 0.8], rim: rim(M), prop: PH, shadow: false };
    drawFigure(g, lo); phoneGlow(g, lo);
  });
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
  bigFace(g, cx, cy, r, { outfit: { ...LEO_OLD, face: null }, expr: t < 0.8 ? 'sleepy' : 'lost', look: [lerp(0.1, -0.5, up), lerp(0.9, -0.3, up)], rimColor: M.rim, rimSide: -1, blink: blinkOf(t, 2.2) });
  if (t > 2.0) { const k = ease.in(prog(t, 2.0, 3.2)); circle(g, cx - r * 0.38, cy + r * 0.05 + k * r * 0.5, 9, alpha('#bcd8ff', 0.9 * (1 - prog(t, 3.0, 3.2)))); }   // uma lágrima
} });

// s13 — final: o banco vazio da praça ao entardecer + mensagem
registerShot('s13', { draw(g, t, info) {
  const cam = { z: 1.0 + 0.06 * ease.inOut(t / info.dur), x: -60, y: 0 };
  const { GY, CX, M } = park(g, t, cam);
  layer(g, cam, 1, (g) => { const r = rng(4); rr(g, CX - 220, GY - 112, 26, 46, 4); g.fillStyle = S().ink; g.fill(); g.fillStyle = '#20242c'; g.fillRect(CX - 216, GY - 108, 18, 38); });   // o celular esquecido no banco, apagado
  FX.dust(g, t, { count: 40, color: M.key, a: 0.3 });
  veil(g, '#000', 0.25 * prog(t, 0.6, 1.5));
  UI.bigLine(g, t, { str: 'O TEMPO NÃO ESPERA.', dur: info.dur + 0.6, y: E.H * 0.24, size: 80 });
  const a = ease.out(prog(t, 1.6, 2.3));
  if (a > 0) text(g, 'LARGUE O CELULAR. VIVA.', E.W / 2, E.H * 0.32, { size: 50, color: S().ui.cream, alpha: a, font: FONTS.ui, weight: 900, spacing: 2 });
} });
