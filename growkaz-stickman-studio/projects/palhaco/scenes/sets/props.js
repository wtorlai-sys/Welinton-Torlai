// sets/props.js — character wrappers (clown nose/wig, squad helmet) + shared props (gift box, gloves, pliers, photo, hands).
import { E, V, S, seg, circle, ring, rr, poly, glow, alpha, shade, mix, linGrad, text, FONTS, ease, clamp } from '/engine/core.js';
import { drawFigure, bigFace, headPos } from '/engine/rig2d.js';
import { GIFT, RED, BLUE, NOSE, WIG } from '../cast.js';

function clownBits(g, hx, hy, r, f, big = false) {
  const wc = WIG;
  for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { const a = (sd < 0 ? Math.PI : 0) + sd * (-0.75 + i * 0.5); circle(g, hx + Math.cos(a) * r * 1.02 + (big ? 0 : -f * r * 0.15), hy - r * 0.15 + Math.sin(a) * r * 0.75, r * (0.36 - i * 0.04), i === 1 ? shade(wc, -0.12) : wc); }
  circle(g, hx + (big ? 0 : f * r * 0.98), hy + (big ? r * 0.05 : r * 0.02), r * (big ? 0.2 : 0.24), NOSE);
  circle(g, hx + (big ? -r * 0.06 : f * r * 0.92), hy - r * (big ? 0.02 : 0.05), r * 0.06, 'rgba(255,255,255,.75)');
}
function helmetBits(g, hx, hy, r, f) {
  g.fillStyle = '#22324f'; g.beginPath(); g.arc(hx, hy - r * 0.05, r * 1.2, Math.PI, 0); g.lineTo(hx + r * 1.2, hy + r * 0.25); g.lineTo(hx - r * 1.2, hy + r * 0.25); g.fill();
  g.fillStyle = 'rgba(150,200,255,.45)'; g.beginPath(); g.moveTo(hx + f * r * 0.1, hy - r * 0.55); g.lineTo(hx + f * r * 1.35, hy - r * 0.45); g.lineTo(hx + f * r * 1.3, hy + r * 0.55); g.lineTo(hx + f * r * 0.1, hy + r * 0.5); g.closePath(); g.fill();
  seg(g, [[hx + f * r * 0.4, hy - r * 0.35], [hx + f * r * 1.1, hy - r * 0.3]], r * 0.06, 'rgba(255,255,255,.6)');
}
// drawFigure + per-character extras
export function fig(g, o) {
  drawFigure(g, o);
  const ex = o.outfit?.extra; if (!ex) return;
  const [hx, hy, r] = headPos(o), f = o.facing ?? 1;
  if (ex === 'clown') clownBits(g, hx, hy, r, f);
  if (ex === 'helmet') helmetBits(g, hx, hy, r, f);
}
export function face2(g, cx, cy, r, o) {
  const of = o.outfit || {};
  if (of.extra === 'clown') { g.save(); g.translate(cx, cy); for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) circle(g, sd * r * (1.0 + 0.05 * i), -r * 0.35 + i * r * 0.32, r * (0.42 - i * 0.06), i === 1 ? shade(WIG, -0.12) : WIG); g.restore(); }
  bigFace(g, cx, cy, r, o);
  if (of.extra === 'clown') { circle(g, cx, cy + r * 0.08, r * 0.2, NOSE); circle(g, cx - r * 0.06, cy + r * 0.02, r * 0.05, 'rgba(255,255,255,.75)'); }
  if (of.extra === 'helmet') { g.save(); g.translate(cx, cy); g.fillStyle = '#22324f'; g.beginPath(); g.arc(0, -r * 0.05, r * 1.2, Math.PI, 0); g.fill(); g.fillStyle = 'rgba(150,200,255,.3)'; rr(g, -r * 0.9, -r * 0.6, r * 1.8, r * 0.7, r * 0.2); g.fill(); g.restore(); }
}
// big gift box standing on the ground (x = centre, y = ground). lid: 0 closed .. 1 off
export function giftBox(g, x, y, s = 1, o = {}) {
  const w = 190 * s, h = 190 * s, lid = o.lid || 0, c = o.color || GIFT, rib = o.ribbon || RED;
  g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(x, y + 2, w * 0.6, 10 * s, 0, 0, 7); g.fill();
  g.fillStyle = linGrad(g, x - w / 2, 0, x + w / 2, 0, [shade(c, -0.35), c, shade(c, -0.15)]); g.fillRect(x - w / 2, y - h, w, h);
  g.fillStyle = rib; g.fillRect(x - 14 * s, y - h, 28 * s, h);
  if (o.inside) { g.fillStyle = '#120c0c'; g.fillRect(x - w / 2 + 8 * s, y - h, w - 16 * s, 14 * s); }
  g.save(); g.translate(x + lid * 150 * s, y - h - lid * 120 * s); g.rotate(lid * 0.9);
  g.fillStyle = shade(c, 0.08); g.fillRect(-w / 2 - 12 * s, -34 * s, w + 24 * s, 34 * s); g.fillStyle = rib; g.fillRect(-14 * s, -34 * s, 28 * s, 34 * s);
  if (lid < 0.3) { g.fillStyle = rib; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(sd * 36 * s, -50 * s, 40 * s, 20 * s, sd * 0.5, 0, 7); g.fill(); } circle(g, 0, -40 * s, 14 * s, shade(rib, -0.2)); }
  g.restore();
  g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x - w / 2, y - h, 6 * s, h);
}
// party table with small gifts and a cake
export function partyTable(g, x, y, s = 1, M) {
  const w = 300 * s, top = y - 110 * s, cloth = mix('#f2efe8', M.dark, 0.25);
  seg(g, [[x - w * 0.4, top], [x - w * 0.4, y]], 8 * s, '#1a1418'); seg(g, [[x + w * 0.4, top], [x + w * 0.4, y]], 8 * s, '#1a1418');
  g.fillStyle = cloth; g.fillRect(x - w / 2, top - 6 * s, w, 50 * s); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x - w / 2, top + 30 * s, w, 14 * s);
  g.fillStyle = '#f3d9e6'; g.fillRect(x - 40 * s, top - 56 * s, 80 * s, 50 * s); g.fillStyle = '#e9a0b8'; g.fillRect(x - 40 * s, top - 34 * s, 80 * s, 8 * s);
  for (let i = 0; i < 4; i++) { seg(g, [[x - 24 * s + i * 16 * s, top - 56 * s], [x - 24 * s + i * 16 * s, top - 74 * s]], 4 * s, '#f2efe8'); glow(g, x - 24 * s + i * 16 * s, top - 80 * s, 16 * s, '#ffcf6a', 0.9); circle(g, x - 24 * s + i * 16 * s, top - 79 * s, 3 * s, '#fff3c0'); }
  for (const [dx, c, ww] of [[-110, '#3fb950', 50], [96, '#8a5ad6', 60], [-70, BLUE, 36]]) { g.fillStyle = mix(c, M.dark, 0.2); g.fillRect(x + dx * s - ww * s / 2, top - 6 * s - ww * 0.8 * s, ww * s, ww * 0.8 * s); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x + dx * s - 3 * s, top - 6 * s - ww * 0.8 * s, 6 * s, ww * 0.8 * s); }
}
// black thick gloves (pair)
export function gloves(g, x, y, s = 1, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  for (const [dx, dy, a] of [[0, 0, -0.2], [46, 18, 0.25]]) { g.save(); g.translate(dx, dy); g.rotate(a);
    rr(g, -38, -40, 76, 90, 26); g.fillStyle = '#121014'; g.fill(); for (let i = 0; i < 4; i++) { rr(g, -34 + i * 18, -92, 16, 60, 8); g.fill(); }
    rr(g, 30, -30, 34, 16, 8); g.fill(); g.fillStyle = '#26222a'; g.fillRect(-40, 40, 80, 18); g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-26, -60); g.lineTo(-26, 20); g.stroke(); g.restore(); }
  g.restore();
}
// wire cutters / pliers, closed 0..1
export function pliers(g, x, y, s = 1, rot = 0, open = 0.3) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  for (const sd of [-1, 1]) { g.save(); g.rotate(sd * open * 0.35);
    poly(g, [[0, 0], [70, sd * 6], [96, sd * 2], [70, sd * 14], [10, sd * 12]], '#b9c2cc');
    seg(g, [[0, sd * 6], [-150, sd * 30]], 26, sd > 0 ? '#d64a33' : '#c4402c'); g.restore(); }
  circle(g, 0, 0, 12, '#8a929c'); circle(g, 0, 0, 4, '#4a525c'); g.restore();
}
// twisted red + blue wires wrapped with black tape, from (x0,y0) to (x1,y1)
export function wires(g, x0, y0, x1, y1, t, o = {}) {
  const { w = 14, cutBlue = 0, tape = [0.3, 0.65] } = o; const n = 40, dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  const path = (ph, amp) => Array.from({ length: n + 1 }, (_, i) => { const u = i / n, a = Math.sin(u * 14 + ph) * amp; return [x0 + dx * u + nx * a, y0 + dy * u + ny * a]; });
  const blue = path(Math.PI, w * 0.8), red = path(0, w * 0.8);
  if (cutBlue > 0) { const k = Math.floor(n * 0.5); const g1 = blue.slice(0, k), g2 = blue.slice(k + 1); seg(g, g1.map((p, i) => i === g1.length - 1 ? [p[0] - ny * cutBlue * 30, p[1] + nx * cutBlue * 30] : p), w, BLUE); seg(g, g2.map((p, i) => i === 0 ? [p[0] + ny * cutBlue * 30, p[1] - nx * cutBlue * 30] : p), w, BLUE); }
  else seg(g, blue, w, BLUE);
  seg(g, red, w, RED); seg(g, red.map(p => [p[0] - 2, p[1] - 3]), w * 0.25, 'rgba(255,255,255,.35)');
  for (const u of tape) { const cx = x0 + dx * u, cy = y0 + dy * u; g.save(); g.translate(cx, cy); g.rotate(Math.atan2(dy, dx)); rr(g, -w * 2, -w * 1.9, w * 4, w * 3.8, w * 0.5); g.fillStyle = '#141216'; g.fill(); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(-w * 2, -w * 1.7, w * 4, w * 0.4); g.restore(); }
}
// hand + sleeve reaching into frame (insert shots). from = sleeve end off-frame, to = hand position
export function arm(g, from, to, s, sleeve, hand = '#0e0b12', o = {}) {
  const ang = Math.atan2(to[1] - from[1], to[0] - from[0]), bx = to[0] - Math.cos(ang) * 120 * s, by = to[1] - Math.sin(ang) * 120 * s;
  if (o.rim) { g.save(); g.translate(-5, -5); seg(g, [from, [bx, by]], 92 * s, o.rim); seg(g, [[bx, by], to], 64 * s, o.rim); circle(g, to[0], to[1], 46 * s, o.rim); g.restore(); }
  seg(g, [[bx, by], to], 62 * s, hand); seg(g, [from, [bx, by]], 92 * s, sleeve);
  if (o.closed) { circle(g, to[0], to[1], 44 * s, hand); for (let i = 0; i < 4; i++) circle(g, to[0] + Math.cos(ang) * 30 * s - Math.sin(ang) * (i - 1.5) * 22 * s, to[1] + Math.sin(ang) * 30 * s + Math.cos(ang) * (i - 1.5) * 22 * s, 15 * s, hand); }
  else { circle(g, to[0], to[1], 40 * s, hand); for (let i = 0; i < 4; i++) { const a = ang - 0.45 + i * 0.3; seg(g, [to, [to[0] + Math.cos(a) * 90 * s, to[1] + Math.sin(a) * 90 * s]], 17 * s, hand); } seg(g, [to, [to[0] + Math.cos(ang - 1.3) * 64 * s, to[1] + Math.sin(ang - 1.3) * 64 * s]], 18 * s, hand); }
}
// polaroid photo with content callback (content drawn in local coords 0..w, 0..h)
export function photo(g, x, y, w, rot, content) {
  const h = w * 0.82; g.save(); g.translate(x, y); g.rotate(rot);
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-w / 2 + 10, -h / 2 + 14, w, h * 1.18);
  g.fillStyle = '#efe9dc'; g.fillRect(-w / 2, -h / 2, w, h * 1.18);
  const p = w * 0.06; g.save(); g.beginPath(); g.rect(-w / 2 + p, -h / 2 + p, w - 2 * p, h - p); g.clip(); g.translate(-w / 2 + p, -h / 2 + p); content?.(g, w - 2 * p, h - p); g.restore();
  g.restore();
}
