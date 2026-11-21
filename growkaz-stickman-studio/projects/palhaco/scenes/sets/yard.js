// sets/yard.js — backyard birthday party at golden hour. Low sun behind the brick wall (right), house on the left
// with lit windows and the back door, balloons + bunting, grass floor. Characters go at depth 1.
import { E, V, mood, layer, backdrop, rr, seg, circle, poly, linGrad, glow, alpha, shade, mix, rng } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';

export const yardGround = () => E.H * V(0.8, 0.68);
export const Y = () => {                                 // layout anchors (character plane)
  const CX = E.W / 2, GY = yardGround();
  return { CX, GY, HX1: CX - V(560, 330), DOORX: CX - V(560, 330) - 250, GIFTX: CX + V(330, 230), TABLEX: CX + V(640, 470), WALLY: GY - 70 };
};
export const RIM = (M) => ({ color: M.rim, dir: [0.75, -0.65] });   // key = low sun, upper right

// o: { mood, door: 0..1 open, inside(g, x, y, w, h, i) draw into the windows, dim }
export function yard(g, t, cam, o = {}) {
  const M = mood(o.mood || 'golden'), L = Y(), { CX, GY, HX1 } = L;
  const wall = shade(M.wall, -0.25), wallDark = shade(M.wall, -0.55);
  layer(g, cam, 0.1, (g) => {
    backdrop(g, M.sky);
    FX.sun(g, CX + V(520, 300), GY - V(470, 640), V(60, 70), '#fff3dc', M.key, 5);
    FX.godRays(g, CX + V(520, 300), GY - V(470, 640), { count: 12, angle: Math.PI * 0.85, spread: Math.PI * 0.9, len: 1600, a: 0.05, t });
    FX.clouds(g, { y: GY - V(860, 1300), h: 220, color: '#fff0c8', a: 0.14, seed: 4 });
  });
  layer(g, cam, 0.3, (g) => {                                     // neighbour roofs + trees behind the wall
    const far = mix(M.sky[0], wallDark, 0.55);
    for (let i = -6; i < 8; i++) { const x = CX + i * 300, h = 160 + ((i * 73) % 90 + 90) % 90; poly(g, [[x - 140, GY - 120 - h], [x, GY - 230 - h], [x + 140, GY - 120 - h], [x + 140, GY], [x - 140, GY]], far); }
    for (let i = -5; i < 7; i++) FX.tree(g, CX + i * 330 + 120, GY - 110, 1.7 + (i % 3) * 0.25, shade(far, -0.15));
  });
  layer(g, cam, 0.8, (g) => {                                     // brick wall (muro)
    const top = L.WALLY - V(300, 330);
    g.fillStyle = linGrad(g, 0, top, 0, L.WALLY, [shade(wall, 0.1), wall, wallDark]); g.fillRect(HX1, top, 4000, L.WALLY - top + 6);
    g.fillStyle = shade(wall, 0.3); g.fillRect(HX1, top - 14, 4000, 18);
    g.strokeStyle = 'rgba(0,0,0,.22)'; g.lineWidth = 2;
    for (let r = 0, y = top + 26; y < L.WALLY; y += 30, r++) { g.beginPath(); g.moveTo(HX1, y); g.lineTo(HX1 + 4000, y); g.stroke(); for (let x = HX1 + (r % 2) * 40; x < HX1 + 4000; x += 80) { g.beginPath(); g.moveTo(x, y - 30); g.lineTo(x, y); g.stroke(); } }
    g.fillStyle = 'rgba(255,220,150,.12)'; g.fillRect(HX1, top - 14, 4000, 6);
    // bunting from house to a pole on the right
    const px = CX + V(820, 560); seg(g, [[px, L.WALLY], [px, top - 140]], 6, wallDark);
    const bx0 = HX1 + 10, by0 = top - 120, n = 22; g.strokeStyle = 'rgba(30,20,20,.7)'; g.lineWidth = 2; g.beginPath();
    const pt = (u) => [bx0 + (px - bx0) * u, by0 + Math.sin(u * Math.PI) * 70 - 20 * u];
    for (let i = 0; i <= 30; i++) { const [x, y] = pt(i / 30); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    const cols = ['#d64a33', '#f2c21a', '#3fb950', '#8a5ad6', '#f29ac0'];
    for (let i = 1; i < n; i++) { const [x, y] = pt(i / n), sw = Math.sin(t * 2 + i) * 3; poly(g, [[x - 14, y], [x + 14, y], [x + sw, y + 30]], mix(cols[i % 5], M.dark, 0.3)); }
    // balloons tied to the pole
    for (let i = 0; i < 5; i++) { const bxx = px + (i - 2) * 34 + Math.sin(t * 1.3 + i) * 6, byy = top - 220 - (i % 2) * 50 + Math.sin(t * 1.7 + i * 2) * 5;
      seg(g, [[px, top - 140], [bxx, byy + 40]], 1.5, 'rgba(240,230,220,.5)'); g.fillStyle = mix(cols[(i + 2) % 5], M.dark, 0.2); g.beginPath(); g.ellipse(bxx, byy, 30, 38, 0, 0, 7); g.fill(); circle(g, bxx - 10, byy - 14, 7, 'rgba(255,255,255,.35)'); }
  });
  layer(g, cam, 0.85, (g) => {                                    // house (left) with lit windows + back door
    const top = GY - V(620, 760), x0 = HX1 - 2200;
    g.fillStyle = linGrad(g, 0, top, 0, GY, [shade(M.wall, -0.1), shade(M.wall, -0.4)]); g.fillRect(x0, top, HX1 - x0, GY - top);
    g.fillStyle = 'rgba(0,0,0,.25)'; for (let y = top + 20; y < GY; y += 26) g.fillRect(x0, y, HX1 - x0, 3);
    g.fillStyle = linGrad(g, HX1 - 40, 0, HX1, 0, ['rgba(0,0,0,0)', alpha(M.rim, 0.35)]); g.fillRect(HX1 - 40, top, 40, GY - top);   // sun-lit corner edge
    poly(g, [[x0, top], [HX1 + 60, top], [HX1 - 120, top - 140], [x0, top - 140]], shade(M.dark, -0.2));
    const wins = [[L.DOORX - 520, GY - V(420, 470), 300, 220], [L.DOORX - 1040, GY - V(420, 470), 300, 220]];
    wins.forEach(([wx, wy, ww, wh], i) => {
      FX.windowFrame(g, { x: wx, y: wy, w: ww, h: wh, cols: 2, rows: 1, frame: shade(M.wall, -0.65), bar: 10 }, (g, x, y, w, h) => {
        g.fillStyle = linGrad(g, 0, y, 0, y + h, [M.practical, shade(M.practical, -0.4)]); g.fillRect(x, y, w, h);
        circle(g, x + w * 0.5, y + 30, 10, '#fff3d6'); glow(g, x + w * 0.5, y + 30, 90, '#fff3d6', 0.5);
        o.inside?.(g, x, y, w, h, i);
      });
      glow(g, wx + ww / 2, wy + wh / 2, 260, M.practical, 0.12);
    });
    const dw = 150, dh = V(270, 290), dx = L.DOORX - dw / 2, op = o.door || 0;
    g.fillStyle = shade(M.wall, -0.7); g.fillRect(dx - 10, GY - dh - 10, dw + 20, dh + 10);
    FX.door(g, { x: dx, y: GY, w: dw, h: dh, color: shade(M.wall, -0.5), open: op, light: M.practical });
    if (op > 0.2) { FX.lightCone(g, L.DOORX, GY - dh * 0.5, { angle: Math.PI * 0.45, spread: 0.7, len: 700, color: M.practical, a: 0.18 * op }); }
    circle(g, dx + dw - 22 + (op > 0 ? -999 : 0), GY - dh * 0.48, 6, '#c9a96a');
    rr(g, L.DOORX + 100, GY - dh + 20, 30, 40, 6); g.fillStyle = '#ffe9c0'; g.fill(); glow(g, L.DOORX + 115, GY - dh + 40, 120, M.practical, 0.5);
    g.fillStyle = shade(M.dark, -0.1); g.fillRect(L.DOORX - 120, GY - 16, 240, 16);   // step
  });
  layer(g, cam, 0.95, (g) => {                                    // lawn
    g.fillStyle = linGrad(g, 0, GY - 70, 0, GY + 600, [shade(M.grass, -0.2), shade(M.grass, -0.55), shade(M.dark, -0.3)]); g.fillRect(-E.W * 2, GY - 70, E.W * 5, E.H * 2);
    g.fillStyle = shade(M.floor, -0.1); g.fillRect(HX1 - 2200, GY - 70, 2200 + 60, 70 + 6);
    const r = rng(9); g.strokeStyle = alpha(shade(M.grass, 0.15), 0.35); g.lineWidth = 2;
    for (let i = 0; i < 220; i++) { const x = -E.W + r() * E.W * 3, y = GY - 60 + r() ** 1.6 * 560, h = 8 + r() * 12; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 3, y - h); g.stroke(); }
    FX.pool(g, CX + V(200, 120), GY + 10, V(700, 500), 90, M.key, 0.22);
    FX.pool(g, L.DOORX, GY + 10, 260, 40, M.practical, 0.18 + 0.3 * (o.door || 0));
  });
  return { ...L, M };
}
// generic soft-focus background for close-ups: yard viewed at a given offset, blurred + veiled
import { blurLayer, veil } from '/engine/core.js';
export function yardBlur(g, t, o = {}) {
  blurLayer(g, o.blur ?? 14, (g) => yard(g, t, { z: o.z ?? 1.5, x: o.x ?? 0, y: o.y ?? -150 }, o));
  veil(g, o.veilColor || mood(o.mood || 'golden').dark, o.veil ?? 0.35);
}
