// shots/01_party.js — s002..s014: the party, the doorbell, the clown arrives and lines the kids up.
import { E, V, S, registerShot, mood, layer, blurLayer, veil, ease, prog, key, clamp, lerp, shake, talkAmount, wordTime, seg, circle, ring, rr, glow, alpha, shade, mix, rng, text, FONTS, linGrad } from '/engine/core.js';
import { POSES, posesAt, breathe, walkPose } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { yard, yardBlur, Y, RIM } from '../sets/yard.js';
import { fig, face2, giftBox, partyTable, arm } from '../sets/props.js';
import { EU, BILL, WALLACE, CLOWN, PAI, KIDS, RED } from '../cast.js';

const T0 = (info, w, fb) => (wordTime(w, info.shot.start - 0.1) ?? info.shot.start + fb) - info.shot.start;   // word time local to shot
export const LINE = [BILL, EU, KIDS[0], WALLACE, KIDS[1], KIDS[2]];                                         // kids line order (left -> right)
export function confetti(g, t, t0, o = {}) {
  const r = rng(o.seed || 7), cols = ['#d64a33', '#f2c21a', '#3fb950', '#8a5ad6', '#f29ac0', '#ffffff'];
  for (let i = 0; i < (o.count || 70); i++) { const k = t - t0; if (k < 0) return; const a = -Math.PI / 2 + (r() - 0.5) * 2.4, sp = 500 + r() * 700;
    const x = (o.x ?? E.W / 2) + Math.cos(a) * sp * Math.min(k, 0.6) + Math.sin(k * 3 + i) * 20, y = (o.y ?? E.H * 0.4) + Math.sin(a) * sp * Math.min(k, 0.6) + Math.max(0, k - 0.6) * 160;
    g.save(); g.translate(x, y); g.rotate(k * 6 + i); g.fillStyle = cols[i % 6]; g.fillRect(-7, -4, 14, 8); g.restore(); }
}

// s002 — "Estava prestes a abrir o maior presente…"  kid + giant gift
registerShot('s002', { draw(g, t, info) {
  const L = Y(), cam = { z: 1.55 + 0.08 * ease.inOut(t / info.dur), x: L.GIFTX - L.CX - 70, y: 170 };
  const { GY, M } = yard(g, t, cam); const rim = RIM(M), tr = T0(info, 'abrir', 1);
  layer(g, cam, 1, (g) => {
    fig(g, { x: L.GIFTX - 330, y: GY - 30, s: 1.25, facing: 1, outfit: BILL, pose: breathe(posesAt(t, [[0, 'stand'], [1.4, 'cheer']]), t, 1, 2), expr: 'happy', rim });
    giftBox(g, L.GIFTX + 40, GY, 1.05);
    fig(g, { x: L.GIFTX - 170, y: GY, s: 1.55, facing: 1, outfit: EU, pose: breathe(posesAt(t, [[0, 'stand'], [tr, 'reach']]), t), expr: t > tr ? 'joy' : 'happy', look: [0.5, -0.4], rim, blink: (t % 3.1) > 3.0 });
  });
  FX.dust(g, t, { count: 40, color: '#ffe9b0', a: 0.4 }); FX.lensStreak(g, E.W * 0.75, E.H * 0.3, E.W * 1.2, '#ffe0b0', 0.15);
} });

// s003 — "…quando a campainha tocou."  doorbell insert
registerShot('s003', { draw(g, t, info) {
  yardBlur(g, t, { x: -V(700, 520), y: -260, z: 2.0, veil: 0.45 });
  const M = mood('golden'), tb = T0(info, 'tocou', 1), on = t > tb, cx = E.W / 2, cy = E.H * 0.42, z = 1 + 0.06 * t;
  g.save(); g.translate(cx, cy); g.scale(z, z);
  rr(g, -120, -190, 240, 380, 30); g.fillStyle = '#1b1416'; g.fill(); rr(g, -104, -174, 208, 348, 24); g.fillStyle = shade(M.wall, -0.2); g.fill();
  rr(g, -60, 40, 120, 40, 10); g.fillStyle = '#e8dcc0'; g.fill(); text(g, '12', 0, 61, { size: 30, color: '#2a2024', font: FONTS.ui, weight: 900 });
  const press = on ? ease.out(prog(t, tb, tb + 0.12)) * (1 - prog(t, tb + 0.25, tb + 0.5)) : 0;
  circle(g, 0, -60, 70, '#120e10'); circle(g, 0, -60 + press * 4, 52, on ? M.practical : '#c9b48a'); if (on) glow(g, 0, -60, 200, M.practical, 0.7);
  ring(g, 0, -60, 52, 5, 'rgba(0,0,0,.4)'); g.restore();
  if (on) FX.rings(g, cx, cy - 60 * z, t - tb, { count: 3, r0: 80, r1: 460, speed: 1.3, color: '#fff3d0', a: 0.55 });
  if (on) UI.readout(g, { value: 'DING-DONG', x: cx, y: E.H * 0.66, align: 'center', a: ease.out(prog(t, tb, tb + 0.2)) * (1 - prog(t, info.dur - 0.25, info.dur)) });
  FX.dust(g, t, { count: 30 });
} });

// s004 — "Meu pai entrou para atender."  dad walks into the back door
registerShot('s004', { draw(g, t, info) {
  const L = Y(), op = key(t, [[0, 0], [0.4, 0.75], [1.25, 0.75], [1.55, 0]]);
  const cam = { z: 1.3, x: L.DOORX - L.CX + V(260, 170) + 30 * t, y: 120 };
  const { GY, M } = yard(g, t, cam, { door: op }); const rim = RIM(M);
  layer(g, cam, 1, (g) => {
    const x = lerp(L.DOORX + 420, L.DOORX + 10, ease.inOut(prog(t, 0, 1.15))), inside = prog(t, 0.95, 1.25);
    fig(g, { x, y: GY - 14, s: 1.5, facing: -1, outfit: PAI, pose: walkPose(t * Math.PI * 2 * 0.9), expr: 'neutral', rim, alpha: 1 - inside });
    fig(g, { x: L.DOORX + V(620, 420), y: GY + 10, s: 1.6, facing: -1, outfit: EU, pose: breathe(POSES.relaxed, t), expr: 'neutral', look: [-0.8, 0], rim });
  });
  FX.dust(g, t, { count: 30 });
} });

// s005 — "E foi exatamente nesse momento que…"  three kids, heads turn toward the wall
registerShot('s005', { draw(g, t, info) {
  const L = Y(), cam = { z: 1.5 + 0.1 * ease.inOut(t / info.dur), x: 0, y: 180 };
  const { GY, M } = yard(g, t, cam); const rim = RIM(M), turn = prog(t, 0.6, 1.0);
  layer(g, cam, 1, (g) => {
    [[BILL, -230, 'happy'], [EU, 0, 'happy'], [WALLACE, 230, 'smile']].forEach(([o, dx, ex], i) =>
      fig(g, { x: L.CX + dx, y: GY + 10, s: 1.55, facing: i === 2 ? -1 : 1, outfit: o, pose: breathe(POSES.stand, t, 1, i), expr: t > 1.2 + i * 0.15 ? 'surprised' : ex, look: [lerp(0, 0.6, turn) * (i === 2 ? -1 : 1), lerp(0.2, -0.9, turn)], rim, blink: (t % (3 + i * 0.3)) > 2.9 + i * 0.3 }));
  });
  FX.dust(g, t, { count: 40, color: '#ffe9b0', a: 0.35 });
} });

// s006 — "…um palhaço desconhecido pulou o muro da nossa casa."  the clown vaults over the wall
registerShot('s006', { draw(g, t, info) {
  const L = Y(), cam = { z: 1.12 - 0.04 * ease.inOut(t / info.dur), x: 120, y: -40 };
  const { GY, M } = yard(g, t, cam); const rim = RIM(M), wallTop = L.WALLY - V(300, 330), tj = T0(info, 'pulou', 1.4);
  const x0 = L.CX + 260, x1 = L.CX + 40;
  layer(g, cam, 0.8, (g) => {                       // at the wall's depth so he sits on it exactly
    let x, y, p, rot = 0;
    if (t < tj - 0.6) { const up = ease.out(prog(t, 0.1, tj - 0.7)); x = x0; y = wallTop + lerp(200, 40, up); p = POSES.reach; }
    else if (t < tj) { x = x0; y = wallTop; p = posesAt(t - (tj - 0.6), [[0, 'crouch'], [0.35, 'ready']], 0.25); }
    else { const k = prog(t, tj, tj + 0.75); x = lerp(x0, x1, ease.out(k)); y = lerp(wallTop, GY - 60, k * k) - Math.sin(k * Math.PI) * 120; p = k < 1 ? POSES.jump : posesAt(t - tj - 0.75, [[0, 'crouch'], [0.3, 'cheer']], 0.3); }
    g.save(); if (t < tj - 0.6) { g.beginPath(); g.rect(-E.W, -E.H, E.W * 3, wallTop + E.H - 4); g.clip(); }
    fig(g, { x, y, s: 1.35, facing: -1, outfit: CLOWN, pose: p, rot, expr: t > tj + 0.9 ? 'joy' : 'happy', rim, shadow: t > tj + 0.75 });
    g.restore();
    if (t > tj + 0.75 && t < tj + 1.5) FX.rings(g, x1, GY - 60, t - tj - 0.75, { count: 2, r0: 20, r1: 160, speed: 2, color: '#fff3d0', a: 0.5 });
  });
  blurLayer(g, 10, (g) => { [[L.CX - 360, BILL], [L.CX - 120, EU], [L.CX + 380, WALLACE]].forEach(([x, o], i) => fig(g, { x, y: GY + 300, s: 2.6, facing: i === 2 ? -1 : 1, outfit: o, pose: POSES.stand, expr: 'shocked', rim })); }, cam, 1.6);
  FX.dust(g, t, { count: 40 });
} });

// s007 — "Ele gritou com uma voz toda engraçada."  clown shouts, arms up
registerShot('s007', { draw(g, t, info) {
  const L = Y(), cam = { z: 1.45 + 0.07 * ease.inOut(t / info.dur), x: 80, y: 160, r: 0.012 * Math.sin(t * 2) };
  const { GY, M } = yard(g, t, cam); const rim = RIM(M);
  layer(g, cam, 1, (g) => {
    const p = breathe(posesAt(t, [[0, 'wave'], [0.3, 'cheer']]), t * 3, 2);
    fig(g, { x: L.CX + 120, y: GY, s: 1.75, facing: -1, outfit: CLOWN, pose: p, expr: 'joy', talk: 0.4 + 0.6 * Math.abs(Math.sin(t * 9)), rim });
    const [hx, hy] = [L.CX + 115, GY - 380]; FX.rings(g, hx, hy, t, { count: 3, r0: 70, r1: 240, speed: 1.6, color: '#fff3d0', a: 0.45 });
  });
  blurLayer(g, 8, (g) => fig(g, { x: L.CX - 330, y: GY + 260, s: 2.7, facing: 1, outfit: EU, pose: POSES.handsOnHead, expr: 'surprised', rim }), cam, 1.5);
  FX.dust(g, t, { count: 40 });
} });

// s008 — "Seu pai me contratou para animar a festa."  clown giant face
registerShot('s008', { draw(g, t, info) {
  yardBlur(g, t, { x: 200, y: -260, z: 1.6 });
  const M = mood('golden'), r = V(300, 320) * (1 + 0.04 * t), talk = talkAmount(info.globalT, 18.38, 20.3);
  face2(g, E.W / 2, E.H * V(0.58, 0.5), r, { outfit: CLOWN, expr: 'joy', talk, rimColor: M.rim, rimSide: 1, blink: (t % 2.7) > 2.6, tilt: 0.05 * Math.sin(t * 1.5) });
  if (talk > 0) FX.rings(g, E.W / 2, E.H * V(0.58, 0.5), t, { count: 3, r0: r * 1.25, r1: r * 1.7, color: '#fff3e0', a: 0.3 });
  FX.dust(g, t, { count: 30 });
} });

// s009 — "Vamos brincar de um jogo!"  jump + confetti
registerShot('s009', { draw(g, t, info) {
  const L = Y(), cam = { z: 1.35, x: 60 - 30 * t, y: 120 }, { GY, M } = yard(g, t, cam); const rim = RIM(M);
  const hop = Math.max(0, Math.sin(prog(t, 0.25, 0.85) * Math.PI)) * 90;
  layer(g, cam, 1, (g) => {
    fig(g, { x: L.CX + 60, y: GY - hop, s: 1.7, facing: -1, outfit: CLOWN, pose: hop > 5 ? POSES.jump : breathe(POSES.cheer, t), expr: 'joy', talk: talkAmount(info.globalT, 20.7, 21.9), rim, shadow: hop < 5 });
    [[L.CX - 330, BILL], [L.CX - 170, EU], [L.CX + 330, WALLACE]].forEach(([x, o], i) => fig(g, { x, y: GY + 40, s: 1.4, facing: i === 2 ? -1 : 1, outfit: o, pose: breathe(t > 0.6 ? POSES.cheer : POSES.stand, t, 1, i), expr: t > 0.6 ? 'joy' : 'surprised', rim }));
  });
  confetti(g, t, 0.45, { x: E.W / 2, y: E.H * 0.38 });
  FX.dust(g, t, { count: 30 });
} });

// s010 — "Ele segurou meu pulso"  the grip insert
registerShot('s010', { draw(g, t, info) {
  yardBlur(g, t, { x: 0, y: -60, z: 2.2, veil: 0.4 });
  const M = mood('golden'), tg = T0(info, 'pulso', 0.8), k = ease.out(prog(t, 0.1, tg)), s = V(1.4, 1.25);
  const wrist = [E.W * 0.44, E.H * 0.5 + Math.sin(t * 2) * 6];
  const [sx, sy] = t > tg ? shake(t, 8 * (1 - prog(t, tg, tg + 0.4)), 30) : [0, 0];
  g.save(); g.translate(sx, sy);
  arm(g, [-300, E.H * 0.85], [wrist[0] + 80, wrist[1] - 20], s * 0.8, RED, '#0e0b12', { rim: M.rim });
  const from = [E.W + 400, E.H * 0.25], to = [lerp(E.W + 60, wrist[0], k), lerp(E.H * 0.3, wrist[1], k)];
  arm(g, from, to, s, CLOWN.color, CLOWN.gloves, { closed: t > tg - 0.05, rim: M.rim });
  g.restore();
  if (t > tg) FX.rings(g, wrist[0], wrist[1], t - tg, { count: 2, r0: 60, r1: 300, speed: 1.6, color: '#fff3e0', a: 0.45 * (1 - prog(t, tg, tg + 1)) });
  FX.dust(g, t, { count: 25 });
} });

// line of kids against the wall (used by s011, s014, s021)
export function kidLine(g, t, GY, rim, o = {}) {
  const { s = 1.3, x0 = E.W / 2 - V(450, 375), step = V(180, 150), y = GY - 40, raise = [], expr = [], walkIn = null, look = null } = o;
  LINE.forEach((of, i) => {
    let x = x0 + i * step, p = breathe(POSES.stand, t, 1, i * 1.7), facing = 1;
    if (walkIn) { const start = x + (i % 2 ? 260 : -260) + i * 30, k = prog(t, walkIn[0] + i * 0.12, walkIn[1] + i * 0.12); x = lerp(start, x, ease.inOut(k)); if (k > 0 && k < 1) { p = walkPose(t * Math.PI * 2 * 1.1 + i, {}); facing = i % 2 ? -1 : 1; } }
    if (raise[i] != null && t > raise[i]) p = posesAt(t - raise[i], [[0, p], [0.01, 'pointUp']], 0.25);
    fig(g, { x, y, s, facing, outfit: of, pose: p, expr: (typeof expr === 'function' ? expr(i) : expr[i]) || 'neutral', look: look?.(i), rim, blink: (t % (2.8 + i * 0.37)) > 2.7 + i * 0.37 });
  });
}

// s011 — "…e colocou todas as crianças em fila perto do muro."
registerShot('s011', { draw(g, t, info) {
  const L = Y(), cam = { z: 1.18 + 0.05 * ease.inOut(t / info.dur), x: -40 + 50 * ease.inOut(t / info.dur), y: 40 };
  const { GY, M } = yard(g, t, cam); const rim = RIM(M);
  layer(g, cam, 0.9, (g) => kidLine(g, t, GY, rim, { walkIn: [0.2, 1.6], expr: () => 'surprised' }));
  layer(g, cam, 1, (g) => { const x = lerp(L.CX - 300, L.CX + 250, ease.inOut(prog(t, 0.3, 2.6))), walking = t > 0.3 && t < 2.6;
    fig(g, { x, y: GY + 90, s: 1.4, facing: 1, outfit: CLOWN, pose: walking ? walkPose(t * Math.PI * 2 * 0.9) : breathe(POSES.explain, t), expr: 'smile', rim }); });
  FX.dust(g, t, { count: 40 });
} });

// s012 — "Calma, ninguém vai se machucar."  calming hands, kids blurred foreground left
const calm = { ...POSES.explain, hF: [52, -140], hB: [40, -138] };
registerShot('s012', { draw(g, t, info) {
  const L = Y(), cam = { z: 1.5 + 0.06 * ease.inOut(t / info.dur), x: 140, y: 170 }, { GY, M } = yard(g, t, cam); const rim = RIM(M);
  layer(g, cam, 1, (g) => fig(g, { x: L.CX + 200, y: GY, s: 1.75, facing: -1, outfit: CLOWN, pose: breathe(posesAt(t, [[0, 'stand'], [0.2, calm]]), t * 1.6, 1.5), expr: 'smile', talk: talkAmount(info.globalT, 26.8, 28.5), rim }));
  blurLayer(g, 9, (g) => [[L.CX - 260, EU], [L.CX - 60, KIDS[0]]].forEach(([x, o], i) => fig(g, { x, y: GY + 250, s: 2.6, facing: 1, outfit: o, pose: POSES.stand, expr: 'worried', rim })), cam, 1.5);
  FX.dust(g, t, { count: 30 });
} });

// s013 — "Só levantem a mão se os seus pais estão nesta festa."
registerShot('s013', { draw(g, t, info) {
  const L = Y(), cam = { z: 1.45, x: 120 - 40 * ease.inOut(t / info.dur), y: 150 }, { GY, M } = yard(g, t, cam); const rim = RIM(M);
  layer(g, cam, 1, (g) => fig(g, { x: L.CX + 170, y: GY, s: 1.75, facing: -1, outfit: CLOWN, pose: breathe(posesAt(t, [[0, calm], [0.6, 'pointUp']]), t, 1), expr: 'happy', talk: talkAmount(info.globalT, 28.7, 31.6), rim }));
  blurLayer(g, 9, (g) => [[L.CX - 330, BILL], [L.CX - 120, EU]].forEach(([x, o]) => fig(g, { x, y: GY + 260, s: 2.6, facing: 1, outfit: o, pose: POSES.stand, expr: 'neutral', rim })), cam, 1.5);
  FX.dust(g, t, { count: 30 });
} });

// s014 — "Eu levantei a mão, assim como outras cinco crianças."  counter 1 -> 6
registerShot('s014', { draw(g, t, info) {
  const cam = { z: 1.35 + 0.05 * ease.inOut(t / info.dur), x: 0, y: 110 }, { GY, M } = yard(g, t, cam); const rim = RIM(M);
  const te = T0(info, 'levantei', 0.3), tc = T0(info, 'cinco', 1.9);
  const raise = [tc - 0.2, te, tc, tc + 0.15, tc + 0.3, tc + 0.45];
  layer(g, cam, 1, (g) => kidLine(g, t, GY, rim, { s: 1.35, raise, expr: (i) => (t > raise[i] ? (i === 1 ? 'determined' : 'smile') : 'neutral') }));
  const n = raise.filter(r => t > r).length;
  if (n) UI.badge(g, { str: `${n} / 6`, x: E.W / 2 + V(0, 130), y: E.H * V(0.16, 0.2), size: V(70, 84), a: ease.out(prog(t, te, te + 0.2)) });
  FX.dust(g, t, { count: 35 });
} });
