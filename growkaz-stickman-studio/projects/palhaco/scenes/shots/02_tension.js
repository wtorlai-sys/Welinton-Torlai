// shots/02_tension.js — s015..s035: men in blue, the gloves, the window arrest, the photos, the garage.
import { E, V, S, registerShot, mood, layer, blurLayer, veil, ease, prog, key, clamp, lerp, shake, talkAmount, wordTime, seg, circle, ring, rr, glow, alpha, shade, mix, text, FONTS, linGrad } from '/engine/core.js';
import { POSES, posesAt, breathe, walkPose } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { yard, yardBlur, Y, RIM } from '../sets/yard.js';
import { windowSet, garage } from '../sets/rooms.js';
import { fig, face2, gloves, wires, photo, arm } from '../sets/props.js';
import { kidLine } from './01_party.js';
import { EU, BILL, WALLACE, CLOWN, PAIW, COP, KIDS, RED } from '../cast.js';

const T0 = (info, w, fb) => (wordTime(w, info.shot.start - 0.1) ?? info.shot.start + fb) - info.shot.start;
export const handAt = (o, which = 'hF') => { const p = o.pose, s = o.s * (o.outfit?.kid ? 0.72 : 1), f = o.facing ?? 1; return [o.x + p[which][0] * f * s, o.y + p[which][1] * s]; };
const heart = (g, t, a = 0.5) => { const b = Math.max(0, Math.sin(t * 2 * Math.PI * 1.6)) ** 6; veil(g, '#7a0a10', a * 0.35 * b, 'source-over'); return b; };
export const wireContent = (t, o = {}) => (g, w, h) => {
  g.fillStyle = linGrad(g, 0, 0, 0, h, ['#3a3630', '#22201c']); g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.04)'; for (let i = 0; i < 8; i++) g.fillRect(0, i * h / 8, w, 2);
  wires(g, w * 0.06, h * 0.7, w * 0.94, h * 0.3, t, { w: w * 0.035, ...o });
};

// s015 — "Mas então, vi alguns homens de uniforme azul entrando na minha casa."
registerShot('s015', { draw(g, t, info) {
  const L = Y(), cam = { z: 1.15 + 0.12 * ease.inOut(t / info.dur), x: L.DOORX - L.CX - V(330, 300), y: -60 };
  const tm = T0(info, 'homens', 1.2);
  const { GY, M } = yard(g, t, cam, { inside: (g, x, y, w, h, i) => {
    for (let k = 0; k < 2; k++) { const u = (t - tm - k * 0.45 - i * 0.9) / 1.6; if (u < -0.2 || u > 1.2) continue;
      fig(g, { x: lerp(x + w + 60, x - 60, u), y: y + h + 150, s: 1.2, facing: -1, outfit: COP, pose: walkPose(t * Math.PI * 2 * 0.9 + k), expr: 'determined', rim: { color: '#9fd0ff', dir: [-1, -0.3] } }); }
  } });
  blurLayer(g, 10, (g) => fig(g, { x: L.DOORX + V(560, 380), y: GY + 280, s: 2.6, facing: -1, outfit: EU, pose: POSES.stand, expr: 'worried', rim: RIM(M) }), cam, 1.5);
  veil(g, '#08121a', 0.18 * prog(t, 1, 3.5));
  FX.dust(g, t, { count: 30 });
} });

// s016 — "Meu coração disparou."
registerShot('s016', { draw(g, t, info) {
  yardBlur(g, t, { x: -300, y: -200, z: 1.6, veil: 0.5 });
  const M = mood('golden'), b = Math.max(0, Math.sin(t * 2 * Math.PI * 1.6)) ** 6, r = V(300, 330) * (1 + 0.06 * t + 0.02 * b);
  face2(g, E.W / 2, E.H * V(0.58, 0.5), r, { outfit: EU, expr: 'scared', rimColor: M.rim, rimSide: 1, look: [-0.4, 0] });
  FX.rings(g, E.W / 2, E.H * V(0.58, 0.5), t, { count: 2, r0: r * 1.15, r1: r * 1.9, speed: 1.6, color: '#ff8a7a', a: 0.4 });
  heart(g, t);
} });

// s017 — "Senhor palhaço, o que está acontecendo lá dentro?"  small kid looks up at the clown
registerShot('s017', { draw(g, t, info) {
  const L = Y(), cam = { z: 1.55 + 0.05 * t / info.dur, x: 20, y: 90 }, { GY, M } = yard(g, t, cam); const rim = RIM(M);
  layer(g, cam, 1, (g) => {
    fig(g, { x: L.CX + 170, y: GY, s: 1.85, facing: -1, outfit: CLOWN, pose: breathe(POSES.relaxed, t), expr: 'smile', look: [0.3, 0.6], rim });
    fig(g, { x: L.CX - 150, y: GY + 20, s: 1.75, facing: 1, outfit: EU, pose: breathe(posesAt(t, [[0, 'stand'], [1.2, 'talk']]), t), expr: 'worried', look: [0.5, -0.9], talk: talkAmount(info.globalT, 40.7, 43.2), rim });
  });
  FX.dust(g, t, { count: 30 });
} });

// s018 — "Apontei para casa,"
registerShot('s018', { draw(g, t, info) {
  const L = Y(), cam = { z: 1.4, x: -V(200, 160) - 40 * t, y: 120 }, { GY, M } = yard(g, t, cam); const rim = RIM(M);
  layer(g, cam, 1, (g) => {
    fig(g, { x: L.CX + 40, y: GY + 20, s: 1.7, facing: -1, outfit: EU, pose: breathe(posesAt(t, [[0, 'stand'], [0.15, 'point']]), t), expr: 'worried', rim });
    fig(g, { x: L.CX + 330, y: GY, s: 1.8, facing: -1, outfit: CLOWN, pose: breathe(POSES.relaxed, t), expr: 'neutral', rim });
  });
  FX.dust(g, t, { count: 30 });
} });

// s019 — "…tirou um par de luvas pretas e grossas do bolso."  pocket insert
registerShot('s019', { draw(g, t, info) {
  const M = mood('golden'), tl = T0(info, 'luvas', 1.9), k = ease.inOut(prog(t, tl - 1.0, tl + 0.4)), z = 1 + 0.05 * t;
  g.save(); g.translate(E.W / 2, E.H / 2); g.scale(z, z); g.translate(-E.W / 2, -E.H / 2);
  g.fillStyle = linGrad(g, 0, 0, E.W, E.H, [shade(CLOWN.color, -0.2), shade(CLOWN.color, -0.55)]); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
  g.fillStyle = alpha(M.rim, 0.25); g.fillRect(E.W * 0.82, -E.H, 30, E.H * 3);
  for (let i = 0; i < 3; i++) circle(g, E.W * 0.2, E.H * (0.15 + i * 0.12), 16, '#f2c21a');
  const px = E.W * 0.5, py = E.H * 0.62; rr(g, px - 230, py, 460, 26, 12); g.fillStyle = '#1a1022'; g.fill();
  g.save(); g.beginPath(); g.rect(-E.W, -E.H, E.W * 3, py + E.H + 13); g.clip();
  const gy = lerp(py + 200, py - 260, k); gloves(g, px - 20, gy, V(1.7, 1.6), -0.15);
  g.restore();
  g.fillStyle = shade(CLOWN.color, -0.35); g.fillRect(-E.W, py + 13, E.W * 3, E.H);
  arm(g, [E.W + 300, gy + 300], [px + 130, gy + 40], V(1.3, 1.2), CLOWN.color, CLOWN.gloves, { closed: true, rim: M.rim });
  g.restore();
  if (t > tl) UI.callout(g, t, { at: [px - 40, gy - 60], to: [px - V(260, 240), gy - V(280, 300)], str: 'LUVAS PRETAS', start: tl });
  FX.dust(g, t, { count: 20 });
} });

// s020 — "Então perguntou com uma voz muito mais séria."
registerShot('s020', { draw(g, t, info) {
  yardBlur(g, t, { x: 220, y: -240, z: 1.6, veil: lerp(0.35, 0.65, prog(t, 0, info.dur)) });
  const M = mood('golden'), r = V(300, 330) * (1 + 0.07 * ease.inOut(t / info.dur)), ts = T0(info, 'séria', 2.5);
  face2(g, E.W / 2, E.H * V(0.58, 0.5), r, { outfit: CLOWN, expr: t < 0.8 ? 'smile' : t < ts ? 'neutral' : 'determined', rimColor: M.rim, rimSide: 1, blink: (t % 2.9) > 2.8 });
  FX.dust(g, t, { count: 20 });
} });

// s021 — "Vocês seis, já viram seus pais usando luvas como essas?"  clown holds the gloves up, kids in the foreground
registerShot('s021', { draw(g, t, info) {
  const L = Y(), cam = { z: 1.45 + 0.06 * ease.inOut(t / info.dur), x: 120, y: 150 }, { GY, M } = yard(g, t, cam); const rim = RIM(M);
  layer(g, cam, 1, (g) => {
    const o = { x: L.CX + 180, y: GY, s: 1.8, facing: -1, outfit: CLOWN, pose: breathe(posesAt(t, [[0, 'holdFront'], [0.8, { ...POSES.point, hF: [52, -196], eF: [30, -180] }]]), t), expr: 'determined', talk: talkAmount(info.globalT, 51.8, 55.0), rim };
    fig(g, o); const [hx, hy] = handAt(o); gloves(g, hx - 10, hy - 40, 0.55, 0.2);
    if (t > 0.9) glow(g, hx, hy - 50, 120, M.rim, 0.15);
  });
  blurLayer(g, 9, (g) => kidLine(g, t, GY + 330, rim, { s: 2.0, x0: L.CX - 900, step: 260, y: GY + 330, expr: () => 'worried' }), cam, 1.5);
  FX.dust(g, t, { count: 30 });
} });

// s022 — "Eu, Bill e Wallace levantamos a mão."  three hands, name tags
registerShot('s022', { draw(g, t, info) {
  const L = Y(), cam = { z: 1.6 + 0.05 * ease.inOut(t / info.dur), x: 0, y: 190 }, { GY, M } = yard(g, t, cam); const rim = RIM(M);
  const ts = [T0(info, 'eu', 0.1), T0(info, 'bill', 0.8), T0(info, 'wallace', 1.2)];
  layer(g, cam, 1, (g) => {
    [[EU, -220, 'EU'], [BILL, 0, 'BILL'], [WALLACE, 220, 'WALLACE']].forEach(([o, dx, nm], i) => {
      const f = { x: L.CX + dx, y: GY + 20, s: 1.6, facing: i === 2 ? -1 : 1, outfit: o, pose: breathe(posesAt(t, [[0, 'stand'], [ts[i], 'pointUp']], 0.25), t, 1, i), expr: i === 2 ? 'nervous' : 'worried', rim };
      fig(g, f);
    });
  });
  const z = cam.z, sx = (x) => E.W / 2 + (x - E.W / 2) * z, sy = (y) => E.H / 2 + (y - E.H / 2 - cam.y) * z;
  [[-220, 'EU'], [0, 'BILL'], [220, 'WALLACE']].forEach(([dx, nm], i) => { const a = ease.outBack(prog(t, ts[i], ts[i] + 0.3)); if (a <= 0) return;
    text(g, nm, sx(L.CX + dx), sy(GY - 330) - 40 * a, { size: V(40, 46) * a, color: [RED, '#3fb950', '#f2c21a'][i], font: FONTS.ui, weight: 900, stroke: 8, strokeColor: 'rgba(0,0,0,.8)' }); });
  FX.dust(g, t, { count: 30 });
} });

// s023 — "O palhaço chamou nós três para perto dele."
registerShot('s023', { draw(g, t, info) {
  const L = Y(), cam = { z: 1.35, x: 80 + 40 * ease.inOut(t / info.dur), y: 110 }, { GY, M } = yard(g, t, cam); const rim = RIM(M);
  layer(g, cam, 1, (g) => {
    fig(g, { x: L.CX + 300, y: GY, s: 1.7, facing: -1, outfit: CLOWN, pose: breathe(posesAt(t, [[0, 'relaxed'], [0.3, 'wave'], [0.7, { ...POSES.wave, hF: [44, -200] }], [1.1, 'wave']]), t), expr: 'neutral', rim });
    [EU, BILL, WALLACE].forEach((o, i) => { const k = ease.inOut(prog(t, 0.8 + i * 0.12, 2.3 + i * 0.12)), x = lerp(L.CX - 380 + i * 150, L.CX - 40 + i * 120, k);
      fig(g, { x, y: GY + 40, s: 1.4, facing: 1, outfit: o, pose: k > 0 && k < 1 ? walkPose(t * Math.PI * 2 + i) : breathe(POSES.stand, t, 1, i), expr: 'worried', rim }); });
  });
  FX.dust(g, t, { count: 30 });
} });

// window arrest (s024, s025)
function arrest(g, t, floorY, IN, wx, ww, o) {
  const rim = { color: IN.rim, dir: [-0.8, -0.5] }, cuff = o.cuff, tr = o.tremble ? shake(t, 7, 9) : [0, 0];
  const bad = { x: wx + ww * 0.5 + tr[0], y: floorY, s: o.s, facing: 1, outfit: PAIW, pose: cuff > 0 ? { ...POSES.sad, hF: [-22, -112], hB: [-18, -110], eF: [-10, -130], eB: [-8, -132] } : POSES.stand, expr: 'angry', rim };
  fig(g, { x: wx + ww * 0.5 - 150 * o.s, y: floorY, s: o.s, facing: 1, outfit: COP, pose: { ...POSES.reach, hF: [120, -118] }, expr: 'determined', rim });
  fig(g, bad);
  fig(g, { x: wx + ww * 0.5 + 150 * o.s, y: floorY, s: o.s, facing: -1, outfit: COP, pose: POSES.crossArms, expr: 'determined', rim });
  if (cuff > 0) { const hx = bad.x - 20 * o.s, hy = floorY - 111 * o.s; ring(g, hx - 6 * o.s, hy, 9 * o.s, 3.5 * o.s, '#d8dde6'); ring(g, hx + 8 * o.s, hy, 9 * o.s, 3.5 * o.s, '#d8dde6'); if (cuff < 1) FX.sparkle(g, hx, hy - 6, 50 * o.s * (1 - cuff), '#ffffff'); }
}
registerShot('s024', { draw(g, t, info) {
  const cam = { z: 1.05 + 0.08 * ease.inOut(t / info.dur), x: 0, y: 0 }, ta = T0(info, 'algemas', 2.7);
  windowSet(g, t, cam, (g, floorY, IN, wx, ww) => arrest(g, t, floorY, IN, wx, ww, { s: V(1.6, 1.4), cuff: t > ta ? prog(t, ta, ta + 0.6) : 0 }));
  blurLayer(g, 10, (g) => { fig(g, { x: E.W * 0.2, y: E.H + 120, s: 3.2, facing: 1, outfit: EU, pose: POSES.stand, expr: 'scared', rim: RIM(mood('golden')) }); }, null);
  FX.dust(g, t, { count: 25 });
} });
registerShot('s025', { draw(g, t, info) {
  const cam = { z: 1.5 + 0.08 * t, x: 0, y: -40 };
  windowSet(g, t, cam, (g, floorY, IN, wx, ww) => arrest(g, t, floorY, IN, wx, ww, { s: V(1.6, 1.4), cuff: 1, tremble: true }));
  FX.dust(g, t, { count: 20 });
} });

// s026 — "A gente está em apuros?"
registerShot('s026', { draw(g, t, info) {
  yardBlur(g, t, { x: -100, y: -200, z: 1.6, veil: 0.5 });
  const M = mood('golden'), r = V(300, 330) * (1 + 0.05 * t);
  face2(g, E.W / 2 + V(60, 0), E.H * V(0.58, 0.5), r, { outfit: EU, expr: 'worried', talk: talkAmount(info.globalT, 66.2, 67.4), rimColor: M.rim, rimSide: 1, look: [0.5, -0.5] });
} });

// s027 — "Perguntei, quase sem conseguir falar."  low two-shot, the clown towering
registerShot('s027', { draw(g, t, info) {
  const L = Y(), cam = { z: 1.5, x: 60 - 30 * t / info.dur, y: 60, r: -0.02 }, { GY, M } = yard(g, t, cam); const rim = RIM(M);
  layer(g, cam, 1, (g) => {
    fig(g, { x: L.CX + 200, y: GY + 60, s: 2.1, facing: -1, outfit: CLOWN, pose: breathe(POSES.crossArms, t), expr: 'neutral', look: [0.2, 0.7], rim });
    fig(g, { x: L.CX - 170, y: GY + 60, s: 1.6, facing: 1, outfit: EU, pose: breathe(POSES.sad, t * 1.6, 1.5), expr: 'nervous', look: [0.6, -0.8], rim });
  });
  FX.dust(g, t, { count: 25 });
} });

// s028 — "O palhaço apenas respondeu."  clown kneels to the kids' level
registerShot('s028', { draw(g, t, info) {
  const L = Y(), cam = { z: 1.5 + 0.06 * t / info.dur, x: 80, y: 170 }, { GY, M } = yard(g, t, cam); const rim = RIM(M);
  layer(g, cam, 1, (g) => {
    fig(g, { x: L.CX + 180, y: GY, s: 1.8, facing: -1, outfit: CLOWN, pose: posesAt(t, [[0, 'stand'], [0.3, 'kneel']], 0.5), expr: 'neutral', rim });
    [EU, BILL, WALLACE].forEach((o, i) => fig(g, { x: L.CX - 70 - i * 150, y: GY + 20, s: 1.5, facing: 1, outfit: o, pose: breathe(POSES.stand, t, 1, i), expr: 'worried', rim }));
  });
  FX.dust(g, t, { count: 25 });
} });

// s029 — "Vamos descobrir."
registerShot('s029', { draw(g, t, info) {
  yardBlur(g, t, { x: 200, y: -200, z: 1.7, veil: 0.6 });
  const M = mood('golden'), r = V(320, 350) * (1 + 0.08 * ease.out(t / info.dur));
  face2(g, E.W / 2, E.H * V(0.58, 0.5), r, { outfit: CLOWN, expr: 'determined', talk: talkAmount(info.globalT, 71.95, 72.9), rimColor: M.rim, rimSide: 1 });
} });

// three photos fanned in a hand
function photoFan(g, x, y, s, t) { [-0.35, 0, 0.35].forEach((a, i) => photo(g, x + Math.sin(a) * 30 * s, y - 20 * s, 110 * s, a, wireContent(t))); }

// s030 — "Em seguida, ele mostrou algumas fotos."
registerShot('s030', { draw(g, t, info) {
  const L = Y(), cam = { z: 1.6, x: 60, y: 200 }, { GY, M } = yard(g, t, cam); const rim = RIM(M), tf = T0(info, 'fotos', 1.8);
  layer(g, cam, 1, (g) => {
    const o = { x: L.CX + 220, y: GY, s: 1.8, facing: -1, outfit: CLOWN, pose: posesAt(t, [[0, 'kneel'], [0.7, { ...POSES.kneel, eF: [30, -116], hF: [62, -128] }]]), expr: 'neutral', rim };
    fig(g, o); if (t > 0.7) { const [hx, hy] = handAt(o); const k = ease.outBack(prog(t, 0.8, 1.3)); g.save(); g.translate(hx, hy); g.scale(k, k); photoFan(g, 0, 0, 0.9, t); g.restore(); }
    [EU, BILL, WALLACE].forEach((o2, i) => fig(g, { x: L.CX - 90 - i * 140, y: GY + 20, s: 1.45, facing: 1, outfit: o2, pose: breathe(POSES.stand, t, 1, i), expr: t > tf ? 'surprised' : 'worried', look: [0.7, 0.3], rim }));
  });
  FX.dust(g, t, { count: 25 });
} });

// s031 — the photo: red + blue wires, black tape
registerShot('s031', { draw(g, t, info) {
  yardBlur(g, t, { x: 0, y: -100, z: 2.2, veil: 0.55 });
  const z = 1 + 0.06 * t, W = V(900, 900), cx = E.W / 2, cy = E.H * 0.42;
  g.save(); g.translate(cx, cy); g.scale(z, z); photo(g, 0, 0, W, -0.04, wireContent(t)); g.restore();
  const tv = T0(info, 'vermelhos', 0.5), ta = T0(info, 'azuis', 1.3), tt = T0(info, 'fita', 3.8);
  UI.callout(g, t, { at: [cx - 200, cy + 40], to: [cx - V(260, 280), cy - V(330, 420)], str: 'VERMELHO', start: tv, color: '#ff8a7a' });
  UI.callout(g, t, { at: [cx + 120, cy - 40], to: [cx + V(220, 160), cy - V(380, 520)], str: 'AZUL', start: ta, color: '#8ab8ff' });
  UI.callout(g, t, { at: [cx + 40, cy + 10], to: [cx + V(60, 40), cy + V(400, 470)], str: 'FITA ISOLANTE', start: tt });
} });

// s032 — "Vocês reconhecem isso?"  OTS: clown shows the photo toward us
registerShot('s032', { draw(g, t, info) {
  const L = Y(), cam = { z: 1.6, x: 140, y: 180 }, { GY, M } = yard(g, t, cam); const rim = RIM(M);
  layer(g, cam, 1, (g) => {
    const o = { x: L.CX + 230, y: GY, s: 1.8, facing: -1, outfit: CLOWN, pose: { ...POSES.kneel, eF: [30, -120], hF: [58, -150] }, expr: 'determined', talk: talkAmount(info.globalT, 80.7, 81.9), rim };
    fig(g, o); const [hx, hy] = handAt(o); photo(g, hx + 30, hy - 10, 150, -0.1 + 0.03 * Math.sin(t * 2), wireContent(t));
  });
  blurLayer(g, 10, (g) => [[L.CX - 220, WALLACE], [L.CX - 420, EU]].forEach(([x, o]) => fig(g, { x, y: GY + 270, s: 2.6, facing: 1, outfit: o, pose: POSES.stand, expr: 'worried', rim })), cam, 1.5);
  FX.dust(g, t, { count: 25 });
} });

// s033 — "Eu e Bill balançamos a cabeça, mas Wallace começou a tremer."
registerShot('s033', { draw(g, t, info) {
  const L = Y(), cam = { z: 1.6 + 0.05 * t / info.dur, x: 0, y: 190 }, { GY, M } = yard(g, t, cam); const rim = RIM(M), tw = T0(info, 'wallace', 2.2);
  layer(g, cam, 1, (g) => {
    [[EU, -220], [BILL, 0], [WALLACE, 220]].forEach(([o, dx], i) => {
      const shakeHead = i < 2 && t > 0.6 && t < 2.2, tr = i === 2 && t > tw ? shake(t, 6, 10, 4) : [0, 0];
      fig(g, { x: L.CX + dx + tr[0], y: GY + 20, s: 1.6, facing: shakeHead ? (Math.sin(t * 14) > 0 ? 1 : -1) : (i === 2 ? -1 : 1), outfit: o, pose: breathe(i === 2 && t > tw ? POSES.sad : POSES.stand, t, 1, i), expr: i === 2 ? (t > tw ? 'scared' : 'worried') : 'confused', rim });
    });
  });
  FX.dust(g, t, { count: 25 });
} });

// s034 — "Eu já vi esses fios…"  Wallace giant face
registerShot('s034', { draw(g, t, info) {
  yardBlur(g, t, { x: 100, y: -200, z: 1.6, veil: 0.55 });
  const M = mood('golden'), r = V(300, 330) * (1 + 0.05 * t), tr = shake(t, 4, 10, 2);
  face2(g, E.W / 2 + tr[0], E.H * V(0.58, 0.5) + tr[1], r, { outfit: WALLACE, expr: 'scared', talk: talkAmount(info.globalT, 85.6, 89.5), rimColor: M.rim, rimSide: -1 });
} });

// s035 — "…na garagem do meu pai, mas não sei o que são."  flashback garage
registerShot('s035', { draw(g, t, info) {
  const cam = { z: 1.15 + 0.1 * ease.inOut(t / info.dur), x: 20, y: 40 };
  const { BY, CX } = garage(g, t, cam);
  layer(g, cam, 0.9, (g) => { wires(g, CX - 330, BY - 30, CX + 100, BY - 40, t, { w: 13 }); gloves(g, CX + 260, BY - 60, 0.5, 0.6); });
  g.save(); g.globalCompositeOperation = 'color'; g.fillStyle = 'rgba(120,100,80,.35)'; g.fillRect(0, 0, E.W, E.H); g.restore();
  FX.dust(g, t, { count: 40, color: '#ffe0b0', a: 0.4 });
  veil(g, '#000', 0.25 * (1 - prog(t, 0, 0.4)));
} });
