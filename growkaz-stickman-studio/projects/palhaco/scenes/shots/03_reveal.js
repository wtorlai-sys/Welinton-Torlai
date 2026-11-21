// shots/03_reveal.js — s036..s060: the warning, the squad, the bomb, the countdown, the cut wire, the aftermath.
import { E, V, S, registerShot, mood, layer, blurLayer, veil, ease, prog, key, clamp, lerp, shake, talkAmount, wordTime, seg, circle, ring, rr, glow, alpha, shade, mix, text, FONTS, linGrad, radGrad, backdrop } from '/engine/core.js';
import { POSES, posesAt, breathe, walkPose } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { yard, yardBlur, Y, RIM } from '../sets/yard.js';
import { fig, face2, gloves, wires, pliers, arm, giftBox } from '../sets/props.js';
import { handAt } from './02_tension.js';
import { EU, BILL, WALLACE, CLOWN, PAIW, COP, SQUAD, KIDS, RED, BLUE, GIFT } from '../cast.js';

const T0 = (info, w, fb) => (wordTime(w, info.shot.start - 0.1) ?? info.shot.start + fb) - info.shot.start;
const cuffed = { ...POSES.sad, hF: [-22, -112], hB: [-18, -110], eF: [-10, -130], eB: [-8, -132] };
const cuffs = (g, o) => { const s = o.s, hx = o.x - 20 * s * (o.facing ?? 1), hy = o.y - 111 * s; ring(g, hx - 6 * s, hy, 9 * s, 3.5 * s, '#d8dde6'); ring(g, hx + 8 * s, hy, 9 * s, 3.5 * s, '#d8dde6'); };

// top-down open gift box with the bomb inside. o: { digits, lit, cutBlue, zoom }
export function bombTop(g, cx, cy, s, t, o = {}) {
  const W = 620 * s, H = 620 * s;
  g.fillStyle = shade(GIFT, -0.15); g.fillRect(cx - W / 2 - 30 * s, cy - H / 2 - 30 * s, W + 60 * s, H + 60 * s);
  g.fillStyle = RED; g.fillRect(cx - 22 * s, cy - H / 2 - 30 * s, 44 * s, 30 * s); g.fillRect(cx - 22 * s, cy + H / 2, 44 * s, 30 * s);
  g.fillStyle = radGrad(g, cx, cy, 0, W * 0.75, ['#2a2224', '#0c0809']); g.fillRect(cx - W / 2, cy - H / 2, W, H);
  for (let i = 0; i < 3; i++) { const y = cy - 150 * s + i * 120 * s; rr(g, cx - 250 * s, y - 50 * s, 500 * s, 100 * s, 50 * s); g.fillStyle = linGrad(g, 0, y - 50 * s, 0, y + 50 * s, ['#5a5f68', '#3a3e46', '#22252b']); g.fill(); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(cx - 230 * s, y - 34 * s, 460 * s, 8 * s); }
  for (const dx of [-150, 150]) { g.fillStyle = '#141216'; g.fillRect(cx + dx * s - 32 * s, cy - 220 * s, 64 * s, 400 * s); g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(cx + dx * s - 32 * s, cy - 220 * s, 64 * s, 8 * s); }
  // timer
  const tx = cx - 110 * s, ty = cy - 280 * s; rr(g, tx, ty, 220 * s, 110 * s, 14 * s); g.fillStyle = '#101014'; g.fill(); rr(g, tx + 16 * s, ty + 16 * s, 188 * s, 78 * s, 8 * s); g.fillStyle = '#1e0606'; g.fill();
  if (o.lit) { glow(g, cx, ty + 55 * s, 200 * s, '#ff2a1a', 0.45 * o.lit); text(g, o.digits || '00:10', cx, ty + 58 * s, { size: 62 * s, color: '#ff4a32', font: FONTS.ui, weight: 900, glow: 20, glowColor: 'rgba(255,40,20,.9)', alpha: o.lit }); }
  wires(g, tx + 30 * s, ty + 110 * s, cx - 200 * s, cy + 120 * s, t, { w: 11 * s, cutBlue: o.cutBlue || 0, tape: [0.5] });
  wires(g, tx + 190 * s, ty + 110 * s, cx + 210 * s, cy + 150 * s, t, { w: 11 * s, tape: [0.45] });
}

// s036 — "O sorriso do palhaço desapareceu na mesma hora."
registerShot('s036', { draw(g, t, info) {
  const td = T0(info, 'desapareceu', 1.2);
  yardBlur(g, t, { x: 200, y: -220, z: 1.6, veil: lerp(0.4, 0.65, prog(t, td, td + 0.5)) });
  const M = mood('golden'), r = V(310, 340) * (1 + 0.05 * t + 0.04 * ease.out(prog(t, td, td + 0.3)));
  face2(g, E.W / 2, E.H * V(0.58, 0.5), r, { outfit: CLOWN, expr: t < td ? 'happy' : 'determined', rimColor: M.rim, rimSide: 1 });
} });

// s037 — "Ele puxou Wallace para o lado e olhou diretamente para mim."
registerShot('s037', { draw(g, t, info) {
  const L = Y(), cam = { z: 1.5 + 0.06 * ease.inOut(t / info.dur), x: 120, y: 170 }, { GY, M } = yard(g, t, cam); const rim = RIM(M), tl = T0(info, 'olhou', 1.8);
  layer(g, cam, 1, (g) => {
    const k = ease.inOut(prog(t, 0.2, 1.2));
    fig(g, { x: lerp(L.CX + 60, L.CX + 400, k), y: GY - 20, s: 1.5, facing: 1, outfit: WALLACE, pose: k > 0 && k < 1 ? walkPose(t * 9) : breathe(POSES.sad, t), expr: 'scared', rim });
    fig(g, { x: L.CX + 190, y: GY, s: 1.8, facing: t < tl ? 1 : -1, outfit: CLOWN, pose: breathe(posesAt(t, [[0, 'reach'], [1.2, 'stand']]), t), expr: 'determined', look: t > tl ? [-1, 0.2] : [0.5, 0.3], rim });
  });
  blurLayer(g, 10, (g) => fig(g, { x: L.CX - 330, y: GY + 270, s: 2.6, facing: 1, outfit: EU, pose: POSES.stand, expr: 'worried', rim }), cam, 1.5);
  FX.dust(g, t, { count: 25 });
} });

// s038 — "Não abra o seu presente de aniversário."
registerShot('s038', { draw(g, t, info) {
  const L = Y(); yardBlur(g, t, { x: L.GIFTX - L.CX + 120, y: -100, z: 1.5, veil: 0.5 });
  blurLayer(g, 12, (g) => giftBox(g, E.W * 0.78, E.H * 0.86, 2.4));
  const M = mood('golden'), r = V(320, 350) * (1 + 0.07 * ease.inOut(t / info.dur));
  face2(g, E.W * V(0.42, 0.45), E.H * V(0.56, 0.48), r, { outfit: CLOWN, expr: 'angry', talk: talkAmount(info.globalT, 96.45, 98.6), rimColor: M.rim, rimSide: 1, look: [-0.3, 0] });
} });

// s039 — "Antes que eu pudesse perguntar qualquer coisa,"
registerShot('s039', { draw(g, t, info) {
  yardBlur(g, t, { x: -200, y: -200, z: 1.6, veil: 0.5 });
  const M = mood('golden'), r = V(300, 330) * (1 + 0.04 * t);
  face2(g, E.W / 2, E.H * V(0.58, 0.5), r, { outfit: EU, expr: t < 0.8 ? 'confused' : 'worried', rimColor: M.rim, rimSide: 1, look: [0.5, -0.3] });
} });

// s040 — "a porta dos fundos se abriu com tudo."
registerShot('s040', { draw(g, t, info) {
  const L = Y(), tb = T0(info, 'abriu', 1.2), op = ease.out(prog(t, tb, tb + 0.15)), sh = shake(t, 14 * (1 - prog(t, tb, tb + 0.7)) * (t > tb ? 1 : 0), 25);
  const cam = { z: 1.25 + 0.05 * t, x: L.DOORX - L.CX + V(260, 200) + sh[0], y: 80 + sh[1] };
  const { GY, M } = yard(g, t, cam, { door: op });
  blurLayer(g, 10, (g) => [[L.DOORX + V(560, 400), EU], [L.DOORX + V(760, 560), BILL]].forEach(([x, o]) => fig(g, { x, y: GY + 270, s: 2.4, facing: -1, outfit: o, pose: t > tb + 0.1 ? POSES.handsOnHead : POSES.stand, expr: t > tb ? 'shocked' : 'worried', rim: RIM(M) })), cam, 1.5);
  if (t > tb) veil(g, '#fff6da', 0.35 * (1 - prog(t, tb, tb + 0.4)), 'lighter');
  FX.dust(g, t, { count: 40 });
} });

// s041 — "Os homens de uniforme saíram, usando equipamentos de proteção e"
registerShot('s041', { draw(g, t, info) {
  const L = Y(), cam = { z: 1.25, x: L.DOORX - L.CX + V(330, 280) + 40 * t, y: 70 }, { GY, M } = yard(g, t, cam, { door: 1 }); const rim = RIM(M);
  layer(g, cam, 1, (g) => { for (let i = 0; i < 3; i++) { const k = prog(t, i * 0.45, i * 0.45 + 2.6), x = lerp(L.DOORX, L.DOORX + 560 - i * 170, ease.out(k));
    if (t < i * 0.45) continue; fig(g, { x, y: GY + i * 12, s: 1.5, facing: 1, outfit: SQUAD, pose: k < 1 ? walkPose(t * Math.PI * 2 * 0.9 + i) : breathe(POSES.stand, t, 1, i), expr: 'determined', rim, alpha: clamp((t - i * 0.45) / 0.25) }); } });
  FX.dust(g, t, { count: 30 });
} });

// s042 — "carregando alicates."
registerShot('s042', { draw(g, t, info) {
  yardBlur(g, t, { x: -200, y: -120, z: 2, veil: 0.5 });
  const M = mood('golden'), hx = lerp(E.W * 0.3, E.W * 0.55, ease.out(t / info.dur)), hy = E.H * 0.5 + Math.sin(t * 7) * 8;
  arm(g, [-300, E.H * 0.6], [hx, hy], V(1.3, 1.2), COP.color, '#121216', { closed: true, rim: M.rim });
  pliers(g, hx + 40, hy - 20, V(2.2, 2), -0.5, 0.15);
  const tg = 0.5; FX.sparkle(g, hx + 180, hy - 120, 70 * (1 - Math.abs(prog(t, tg, tg + 0.5) * 2 - 1)), '#ffffff');
} });

// s043 — "Eles estavam levando o pai de Wallace algemado, diretamente até o meu presente."
registerShot('s043', { draw(g, t, info) {
  const L = Y(), cam = { z: 1.15, x: lerp(-V(240, 260), V(150, 160), ease.inOut(t / info.dur)), y: 40 }, { GY, M } = yard(g, t, cam, { door: 1 }); const rim = RIM(M);
  layer(g, cam, 1, (g) => {
    giftBox(g, L.GIFTX + 40, GY, 0.9);
    const k = ease.inOut(prog(t, 0, info.dur - 0.3)), bx = lerp(L.DOORX + 120, L.GIFTX - 220, k), walking = k < 0.98;
    fig(g, { x: bx - 150, y: GY + 10, s: 1.3, facing: 1, outfit: SQUAD, pose: walking ? walkPose(t * 5.6) : POSES.stand, expr: 'determined', rim });
    const bad = { x: bx, y: GY + 10, s: 1.3, facing: 1, outfit: PAIW, pose: walking ? { ...walkPose(t * 5.6 + 1), hF: cuffed.hF, eF: cuffed.eF, hB: cuffed.hB, eB: cuffed.eB } : cuffed, expr: 'angry', rim };
    fig(g, bad); cuffs(g, bad);
    fig(g, { x: bx + 120, y: GY + 18, s: 1.3, facing: 1, outfit: SQUAD, pose: walking ? walkPose(t * 5.6 + 2) : POSES.stand, expr: 'determined', rim });
  });
  FX.dust(g, t, { count: 30 });
} });

// s044 — "…um par de luvas pretas saindo do bolso dele."
registerShot('s044', { draw(g, t, info) {
  const M = mood('golden'), tl = T0(info, 'luvas', 2.6), z = 1 + 0.12 * ease.inOut(t / info.dur);
  g.save(); g.translate(E.W / 2, E.H / 2); g.scale(z, z); g.translate(-E.W / 2, -E.H / 2);
  g.fillStyle = linGrad(g, 0, 0, E.W, E.H, ['#3a3540', '#16141a']); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
  g.fillStyle = alpha(M.rim, 0.25); g.fillRect(E.W * 0.85, -E.H, 26, E.H * 3);
  g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 4; g.beginPath(); g.moveTo(E.W * 0.2, -E.H); g.lineTo(E.W * 0.28, E.H * 2); g.stroke();
  const px = E.W * 0.52, py = E.H * 0.5;
  g.save(); g.beginPath(); g.rect(-E.W, -E.H, E.W * 3, py + E.H); g.clip(); gloves(g, px, py - 40, V(1.3, 1.25), 0.35); g.restore();
  g.fillStyle = '#26222c'; rr(g, px - 230, py - 6, 460, 300, 20); g.fill(); g.fillStyle = '#121016'; g.fillRect(px - 230, py - 6, 460, 14);
  for (let i = 0; i < 8; i++) circle(g, px - 210 + i * 60, py + 30, 3, 'rgba(255,255,255,.2)');
  g.restore();
  if (t > tl) { FX.rings(g, px, py - 120, t - tl, { count: 2, r0: 120, r1: 380, speed: 1, color: '#ffffff', a: 0.3 }); }
  UI.callout(g, t, { at: [px, py - 140], to: [px - V(300, 250), py - V(380, 460)], str: 'LUVAS PRETAS', start: tl });
  FX.dust(g, t, { count: 20 });
} });

// s045 — "O que está acontecendo?"
registerShot('s045', { draw(g, t, info) {
  yardBlur(g, t, { x: -100, y: -200, z: 1.6, veil: 0.55 });
  const M = mood('golden'), r = V(310, 340) * (1 + 0.06 * t), sh = shake(t, 5, 8);
  face2(g, E.W / 2 + sh[0], E.H * V(0.58, 0.5) + sh[1], r, { outfit: EU, expr: 'shocked', talk: talkAmount(info.globalT, 117.9, 119.4), rimColor: M.rim, rimSide: 1 });
  FX.rings(g, E.W / 2, E.H * V(0.58, 0.5), t, { count: 3, r0: r * 1.15, r1: r * 1.7, color: '#fff3e0', a: 0.3 });
} });

// s046 — "Mas um dos homens já estava abrindo a caixa."
registerShot('s046', { draw(g, t, info) {
  const L = Y(), cam = { z: 1.6 + 0.1 * ease.inOut(t / info.dur), x: L.GIFTX - L.CX - 60, y: 200 }, { GY, M } = yard(g, t, cam); const rim = RIM(M), ta = T0(info, 'abrindo', 1.7);
  layer(g, cam, 1, (g) => {
    const lid = ease.inOut(prog(t, ta - 0.2, ta + 0.8));
    fig(g, { x: L.GIFTX - 200, y: GY, s: 1.6, facing: 1, outfit: SQUAD, pose: posesAt(t, [[0, 'kneel'], [ta - 0.4, { ...POSES.kneel, eF: [40, -150], hF: [70, -186], eB: [30, -148], hB: [64, -180] }]], 0.4), expr: 'determined', rim });
    giftBox(g, L.GIFTX + 40, GY, 1.0, { lid, inside: lid > 0.1 });
    if (lid > 0.2) glow(g, L.GIFTX + 40, GY - 200, 180, '#ff3a20', 0.25 * lid * (0.6 + 0.4 * Math.sin(t * 8)));
  });
  veil(g, '#000', 0.15 * prog(t, 1, info.dur));
  FX.dust(g, t, { count: 30 });
} });

// s047 — "E lá dentro havia uma bomba,"  top-down reveal
registerShot('s047', { draw(g, t, info) {
  const z = 0.95 + 0.25 * ease.inOut(t / info.dur), cam = { r: 0.03 * Math.sin(t * 0.7) };
  g.fillStyle = shade(mood('golden').grass, -0.55); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
  g.save(); g.translate(E.W / 2, E.H * 0.45); g.rotate(cam.r); g.scale(z, z); bombTop(g, 0, 0, V(1.1, 1.3), t, { lit: 0 }); g.restore();
  FX.dust(g, t, { count: 30, a: 0.3 });
  const tb = T0(info, 'bomba', 1.5); if (t > tb) UI.bigLine(g, t - tb, { str: 'BOMBA', dur: info.dur - tb + 0.3, y: E.H * 0.14, color: '#ff6f61', size: V(120, 130) });
} });

// s048 — "com fios vermelhos e azuis enrolados e presos com fita isolante preta."
registerShot('s048', { draw(g, t, info) {
  const z = 1 + 0.06 * t; g.fillStyle = radGrad(g, E.W / 2, E.H * 0.45, 0, E.H, ['#2a2224', '#080506']); g.fillRect(0, 0, E.W, E.H);
  g.save(); g.translate(E.W / 2, E.H * 0.45); g.scale(z, z); g.translate(-E.W / 2, -E.H * 0.45);
  for (let i = 0; i < 2; i++) { const y = E.H * (0.3 + i * 0.32); rr(g, -100, y - 110, E.W + 200, 220, 110); g.fillStyle = linGrad(g, 0, y - 110, 0, y + 110, ['#5a5f68', '#3a3e46', '#1a1c20']); g.fill(); }
  wires(g, -60, E.H * 0.62, E.W + 60, E.H * 0.3, t, { w: V(30, 34), tape: [0.28, 0.7] }); g.restore();
  const cx = E.W / 2, cy = E.H * 0.45, tv = T0(info, 'vermelhos', 0.5), ta = T0(info, 'azuis', 1.2), tt = T0(info, 'fita', 3.3);
  UI.callout(g, t, { at: [cx - 260, cy + 80], to: [cx - V(300, 300), cy - V(330, 420)], str: 'VERMELHO', start: tv, color: '#ff8a7a' });
  UI.callout(g, t, { at: [cx + 220, cy - 90], to: [cx + V(220, 140), cy - V(400, 560)], str: 'AZUL', start: ta, color: '#8ab8ff' });
  UI.callout(g, t, { at: [cx + V(380, 190), cy - V(110, 70)], to: [cx + V(80, 40), cy + V(380, 460)], str: 'FITA ISOLANTE', start: tt });
} });

// s049 — "De repente, o cronômetro começou a funcionar."
function timerPanel(g, t, digits, lit, zoom = 1, cut = 0) {
  g.fillStyle = radGrad(g, E.W / 2, E.H * 0.45, 0, E.H * 0.9, ['#241a1c', '#050304']); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
  g.save(); g.translate(E.W / 2, E.H * 0.42); g.scale(zoom, zoom);
  rr(g, -440, -200, 880, 400, 40); g.fillStyle = '#101014'; g.fill(); rr(g, -400, -160, 800, 320, 24); g.fillStyle = '#1e0606'; g.fill();
  text(g, '88:88', 0, 10, { size: 260, color: 'rgba(255,60,40,.07)', font: FONTS.ui, weight: 900 });
  if (lit) { glow(g, 0, 0, 700, '#ff2a1a', 0.35 * lit); text(g, digits, 0, 10, { size: 260, color: '#ff4a32', font: FONTS.ui, weight: 900, glow: 40, glowColor: 'rgba(255,40,20,.9)', alpha: lit }); }
  for (const [x, c] of [[-300, RED], [300, BLUE]]) seg(g, [[x, 200], [x + (x < 0 ? -60 : 60), 600]], 26, c);
  g.restore();
}
registerShot('s049', { draw(g, t, info) {
  const tc = T0(info, 'começou', 1.5), lit = t > tc ? (prog(t, tc, tc + 0.1) * (t < tc + 0.5 ? (Math.sin(t * 60) > 0 ? 1 : 0.3) : 1)) : 0;
  timerPanel(g, t, '00:10', lit, 0.85 + 0.12 * ease.inOut(t / info.dur));
  FX.dust(g, t, { count: 20, a: 0.25 });
} });

// s050 — "Dez, nove, oito."  giant countdown synced to the words
registerShot('s050', { draw(g, t, info) {
  const g0 = info.shot.start, ts = [['dez', 0.12, '10'], ['nove', 0.72, '09'], ['oito', 1.58, '08']].map(([w, fb, d]) => [(wordTime(w, g0 - 0.1) ?? g0 + fb) - g0, d]);
  let cur = ts[0], k = 0; ts.forEach((x, i) => { if (t >= x[0]) { cur = x; k = i; } });
  const pop = 1 + 0.12 * (1 - ease.out(prog(t, cur[0], cur[0] + 0.25)));
  timerPanel(g, t, '00:' + cur[1], 1, (0.95 + 0.06 * t) * pop);
  veil(g, '#ff1a0a', 0.12 * (1 - prog(t, cur[0], cur[0] + 0.35)), 'lighter');
} });

// s051 — "Eu comecei a gritar,"
registerShot('s051', { draw(g, t, info) {
  yardBlur(g, t, { x: 0, y: -200, z: 1.6, veil: 0.6 });
  const M = mood('golden'), r = V(330, 360) * (1 + 0.1 * t), sh = shake(t, 12, 10);
  face2(g, E.W / 2 + sh[0], E.H * V(0.58, 0.5) + sh[1], r, { outfit: EU, expr: 'shocked', talk: 0.8 + 0.2 * Math.sin(t * 30), rimColor: M.rim, rimSide: 1 });
  FX.speedLines(g, t, { cx: E.W / 2, cy: E.H * 0.5, count: 50, a: 0.25, inner: r * 1.3 });
  veil(g, '#ff1a0a', 0.1, 'lighter');
} });

// s052 — "…mas um dos homens cortou imediatamente o fio azul."  FREEZE + the cut
registerShot('s052', { draw(g, t, info) {
  const tc = T0(info, 'azul', 2.5), cut = t > tc, z = 1.25 + 0.06 * t, rot = -0.02 + 0.01 * t;
  g.fillStyle = shade(mood('golden').grass, -0.6); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
  g.save(); g.translate(E.W / 2, E.H * 0.45); g.rotate(rot); g.scale(z, z);
  bombTop(g, 0, 0, V(1.1, 1.3), cut ? t : tc, { lit: 1, digits: '00:07', cutBlue: cut ? ease.out(prog(t, tc, tc + 0.3)) : 0 });
  g.restore();
  const s = V(1.1, 1.3) * z, bx = E.W / 2 + (-110 + 30 + (-200 + 30) * 0) * 0, tgt = [E.W / 2 - V(150, 170) * z, E.H * 0.45 + V(-30, -20) * z];
  const k = ease.inOut(prog(t, 0.2, tc)), px = lerp(E.W + 200, tgt[0] + 60, k), py = lerp(E.H * 0.1, tgt[1] - 40, k);
  arm(g, [E.W + 500, -300], [px + 160, py - 130], V(1.1, 1.1), COP.color, '#121216', { closed: true });
  pliers(g, px, py, V(1.6, 1.8), 2.4, cut ? 0 : 0.45);
  if (cut) { FX.rings(g, tgt[0], tgt[1], t - tc, { count: 3, r0: 30, r1: 420, speed: 1.5, color: '#bfe0ff', a: 0.6 * (1 - prog(t, tc, tc + 0.8)) }); }
  FX.drops(g, t, { count: 45, color: '#d8e8ff', rMax: 9, drift: 2 });
  FX.sparkle(g, tgt[0], tgt[1], cut ? 90 * (1 - prog(t, tc, tc + 0.5)) : 0, '#ffffff');
  g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = 'rgba(80,120,255,.4)'; g.fillRect(0, 0, E.W, E.H); g.restore();
  UI.badge(g, { str: '00:07', color: '#ff6f61', a: ease.out(prog(t, 0.3, 0.7)) });
} });

// s053 — "O barulho parou."  frozen timer
registerShot('s053', { draw(g, t, info) {
  timerPanel(g, t, '00:07', 0.55 + 0.1 * Math.cos(t * 2), 0.9 + 0.05 * t);
  veil(g, '#0a0e1a', 0.25);
  FX.dust(g, t, { count: 20, a: 0.25 });
} });

// s054 / s055 — the squad man turns to the narrator, then points at Wallace's dad
function squadTalk(g, t, info, pointing) {
  const L = Y(), cam = { z: 1.5 + 0.05 * t / info.dur, x: 60, y: 170 }, { GY, M } = yard(g, t, cam, { door: 1 }); const rim = RIM(M);
  layer(g, cam, 1, (g) => {
    if (pointing) { const bad = { x: L.CX + 420, y: GY - 10, s: 1.5, facing: -1, outfit: PAIW, pose: cuffed, expr: 'angry', rim }; fig(g, bad); cuffs(g, bad); }
    fig(g, { x: L.CX + 120, y: GY, s: 1.8, facing: pointing ? 1 : -1, outfit: { ...SQUAD, extra: null, head: 'none' }, pose: breathe(pointing ? posesAt(t, [[0, 'stand'], [0.3, 'point']]) : POSES.stand, t), expr: 'determined', talk: pointing ? talkAmount(info.globalT, 141.2, 143.8) : 0, look: pointing ? [0.6, 0] : [-1, 0.6], rim });
    fig(g, { x: L.CX - 230, y: GY + 30, s: 1.5, facing: 1, outfit: EU, pose: breathe(POSES.sad, t), expr: 'scared', look: [0.6, -0.6], rim });
  });
  FX.dust(g, t, { count: 25 });
}
registerShot('s054', { draw(g, t, info) { squadTalk(g, t, info, false); } });
registerShot('s055', { draw(g, t, info) { squadTalk(g, t, info, true); } });

// s056 — "Essa casa inteira estava prestes a explodir."  blueprint blast radius
registerShot('s056', { draw(g, t, info) {
  UI.blueprint(g); const c = UI.bpStroke(), red = S().ui.accent === '#c6ff3d' ? '#ff6f61' : '#ff6f61', te = T0(info, 'explodir', 2.1);
  const cx = E.W / 2, cy = E.H * 0.45, z = 1 + 0.04 * t;
  g.save(); g.translate(cx, cy); g.scale(z, z);
  g.strokeStyle = c; g.lineWidth = 5; g.strokeRect(-420, -520, 520, 420); seg(g, [[-420, -310], [100, -310]], 3, alpha(c, 0.6)); seg(g, [[-160, -520], [-160, -100]], 3, alpha(c, 0.6));
  g.strokeRect(-420, -100, 840, 520); text(g, 'CASA', -160, -560, { size: 40, color: c, font: FONTS.ui, weight: 900, spacing: 3 }); text(g, 'QUINTAL', 0, 460, { size: 40, color: c, font: FONTS.ui, weight: 900, spacing: 3 });
  rr(g, 150, 60, 60, 60, 6); g.fillStyle = S().ui.gold; g.fill(); glow(g, 180, 90, 80, S().ui.gold, 0.5);
  for (let i = 0; i < 6; i++) circle(g, -300 + i * 70, 300, 14, alpha(c, 0.9));
  const R = lerp(40, 900, ease.out(prog(t, 0.2, te))), pulse = t > te ? 0.5 + 0.5 * Math.sin(t * 14) : 1;
  g.setLineDash([24, 18]); ring(g, 180, 90, R, 8, alpha(red, 0.9)); g.setLineDash([]);
  g.fillStyle = alpha(red, 0.12 * pulse); g.beginPath(); g.arc(180, 90, R, 0, 7); g.fill();
  g.restore();
  if (t > te) UI.bigLine(g, t - te, { str: 'TUDO PELOS ARES', dur: info.dur - te + 0.3, y: E.H * 0.12, color: red, size: V(70, 76) });
} });

// s057 — "Minhas pernas ficaram bambas."
registerShot('s057', { draw(g, t, info) {
  const L = Y(), cam = { z: 1.7 + 0.08 * t / info.dur, x: -40, y: 230 }, { GY, M } = yard(g, t, cam, { door: 1 }); const rim = RIM(M), tb = T0(info, 'bambas', 1.2);
  layer(g, cam, 1, (g) => {
    const w = Math.sin(t * 22) * 7 * (t < tb + 0.3 ? 1 : 0.3), base = { ...POSES.stand, kF: [6 + w, -50], kB: [-6 - w, -50] };
    fig(g, { x: L.CX, y: GY + 30, s: 2.0, facing: 1, outfit: EU, pose: posesAt(t, [[0, base], [tb, 'kneel']], 0.4), expr: 'scared', rim });
  });
  FX.dust(g, t, { count: 25 });
} });

// s058 — "O pai de Wallace tinha me dado uma bomba para matar todos nós."
registerShot('s058', { draw(g, t, info) {
  yardBlur(g, t, { x: -400, y: -200, z: 1.6, veil: 0.6 });
  const M = mood('golden'), r = V(310, 340) * (1 + 0.05 * t);
  face2(g, E.W / 2, E.H * V(0.58, 0.5), r, { outfit: PAIW, expr: t < 1.5 ? 'angry' : 'smirk', rimColor: M.rim, rimSide: 1 });
  g.fillStyle = linGrad(g, 0, 0, E.W, 0, ['rgba(0,0,0,.65)', 'rgba(0,0,0,.5)', 'rgba(0,0,0,0)']); g.fillRect(0, 0, E.W * 0.6, E.H);
} });

// s059 — "Olhei para ele, algemado,"  led away through the back door
registerShot('s059', { draw(g, t, info) {
  const L = Y(), cam = { z: 1.3, x: L.DOORX - L.CX + V(280, 220), y: 80 }, { GY, M } = yard(g, t, cam, { door: 1 }); const rim = RIM(M);
  layer(g, cam, 1, (g) => {
    const k = ease.inOut(prog(t, 0, info.dur)), bx = lerp(L.DOORX + 330, L.DOORX + 40, k), fade = 1 - prog(t, info.dur - 0.5, info.dur);
    fig(g, { x: bx - 130, y: GY, s: 1.4, facing: -1, outfit: SQUAD, pose: walkPose(t * 5.2), expr: 'determined', rim, alpha: 1 - prog(t, 0.8, 1.3) });
    const bad = { x: bx, y: GY, s: 1.4, facing: -1, outfit: PAIW, pose: { ...walkPose(t * 5.2 + 1), hF: cuffed.hF, eF: cuffed.eF, hB: cuffed.hB, eB: cuffed.eB }, expr: 'sad', rim, alpha: fade }; fig(g, bad); cuffs(g, bad);
    fig(g, { x: bx + 140, y: GY + 10, s: 1.4, facing: -1, outfit: SQUAD, pose: walkPose(t * 5.2 + 2), expr: 'determined', rim, alpha: fade });
  });
  blurLayer(g, 10, (g) => fig(g, { x: L.DOORX + V(640, 470), y: GY + 280, s: 2.6, facing: -1, outfit: EU, pose: POSES.stand, expr: 'sad', rim: RIM(M) }), cam, 1.5);
  FX.dust(g, t, { count: 30 });
} });

// s060 — "depois para Wallace, chorando nos braços do palhaço."
registerShot('s060', { draw(g, t, info) {
  const L = Y(), cam = { z: 1.75 + 0.08 * ease.inOut(t / info.dur), x: 40, y: 230 }, { GY, M } = yard(g, t, cam, { mood: 'golden' }); const rim = RIM(M);
  layer(g, cam, 1, (g) => {
    fig(g, { x: L.CX + 50, y: GY + 10, s: 1.6, facing: -1, outfit: WALLACE, pose: breathe(POSES.sad, t * 2.5, 1.4), expr: 'cry', rim });
    fig(g, { x: L.CX + 150, y: GY, s: 1.7, facing: -1, outfit: CLOWN, pose: { ...POSES.kneel, eF: [30, -120], hF: [60, -126], eB: [24, -124], hB: [56, -118] }, expr: 'sad', rim, blink: (t % 3) > 2.9 });
  });
  FX.dust(g, t, { count: 35, color: '#ffe9b0', a: 0.4 }); FX.lensStreak(g, E.W * 0.7, E.H * 0.3, E.W * 1.2, '#ffe0b0', 0.12);
} });
