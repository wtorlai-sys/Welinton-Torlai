// sets.js — locais reutilizáveis. Todos ancorados em GY (chão) e CX; paredes/céu além do quadro.
import { E, V, mood, layer, backdrop, rr, seg, circle, poly, linGrad, radGrad, glow, alpha, shade, mix, text, FONTS } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';

export const ground = () => E.H * V(0.8, 0.68);

// Quarto à noite: janela com lua e prédios, cama, abajur apagado, relógio de parede
export function bedroom(g, t, cam, o = {}) {
  const M = mood('night'), GY = ground(), CX = E.W / 2;
  const wall = shade(M.wall, -0.25);
  layer(g, cam, 0.5, (g) => {
    g.fillStyle = linGrad(g, 0, -E.H, 0, GY, [shade(wall, -0.4), wall]); g.fillRect(-E.W, -E.H, E.W * 3, GY + E.H);
    const wx = CX + 60, wy = GY - 820, ww = 380, wh = 460;
    FX.windowFrame(g, { x: wx, y: wy, w: ww, h: wh, cols: 2, rows: 2, frame: shade(M.dark, -0.3), bar: 10 }, (g, x, y, w, h) => {
      backdrop(g, M.sky, [x, y, w, h]); FX.stars(g, t, { area: [x, y, w, h * 0.6], count: 30 });
      FX.moon(g, x + w * 0.7, y + h * 0.25, 30);
      FX.skyline(g, { x: x - 40, y: y + h, w: w + 80, minH: 60, maxH: 200, color: shade(M.dark, -0.2), windowColor: alpha(M.practical, 0.6), lit: 0.25, seed: 5 });
    });
    glow(g, wx + ww / 2, wy + wh / 2, 420, M.rim, 0.08);
    FX.clock(g, CX - 300, GY - 600, 60, o.clockT ?? (23 * 3600 + 59 * 60 + t), { face: shade('#e8ecf5', -0.35) });
  });
  layer(g, cam, 0.9, (g) => {
    g.fillStyle = linGrad(g, 0, GY, 0, E.H * 1.5, [shade(M.floor, -0.1), shade(M.dark, -0.4)]); g.fillRect(-E.W, GY, E.W * 3, E.H * 2);
    FX.floorLines(g, GY, GY + 700, 'rgba(0,0,0,.3)', 0.08);
    FX.pool(g, CX + 250, GY + 60, 380, 50, M.rim, 0.12);       // luar no chão
    FX.bed(g, { x: CX - 360, y: GY, w: 560, color: shade('#3a4a8a', -0.2), frame: shade(M.dark, -0.2), pillow: '#a8b0d8' });
  });
  return { GY, CX, M };
}

// Praça ao entardecer: árvores, banco, sol baixo, campinho
export function park(g, t, cam, o = {}) {
  const M = mood('golden'), GY = ground(), CX = E.W / 2, HY = GY - V(260, 360);
  layer(g, cam, 0.12, (g) => {
    backdrop(g, M.sky);
    FX.sun(g, CX + 220, HY - 120, 70, '#fff3dc', M.key, 5); FX.godRays(g, CX + 220, HY - 120, { color: M.key, a: 0.07 });
    FX.clouds(g, { y: HY - 800, h: 160, color: M.key, a: 0.15, seed: 2 });
  });
  layer(g, cam, 0.35, (g) => {
    FX.hills(g, { y: HY, amp: 26, color: mix(M.sky[1], M.dark, 0.65), seed: 7 });
    FX.skyline(g, { x: -E.W, y: HY + 10, w: E.W * 3, minH: 60, maxH: 260, color: mix(M.sky[1], M.dark, 0.75), windowColor: alpha(M.practical, 0.5), lit: 0.1, seed: 4 });
  });
  layer(g, cam, 0.6, (g) => { for (const [x, s] of [[-80, 1.6], [CX * 2 + 60, 1.8], [CX - 330, 1.1]]) FX.tree(g, x, GY - 60, s, shade(M.dark, -0.1)); });
  layer(g, cam, 0.9, (g) => {
    g.fillStyle = linGrad(g, 0, HY, 0, E.H * 1.5, [shade(M.grass, -0.3), shade(M.grass, -0.55), shade(M.dark, -0.3)]); g.fillRect(-E.W, HY, E.W * 3, E.H * 2);
    FX.pool(g, CX + 120, GY + 10, 600, 70, M.key, 0.16);
    if (o.bench !== false) bench(g, CX - 260, GY, M);
  });
  return { GY, CX, M };
}
export function bench(g, x, GY, M) {
  const c = shade(M.dark, -0.2);
  rr(g, x - 150, GY - 92, 300, 18, 6); g.fillStyle = c; g.fill();
  rr(g, x - 150, GY - 170, 300, 16, 6); g.fill(); rr(g, x - 150, GY - 140, 300, 14, 6); g.fill();
  for (const dx of [-120, 120]) seg(g, [[x + dx, GY - 92], [x + dx, GY]], 9, c);
  g.fillStyle = alpha(M.rim, 0.5); g.fillRect(x - 146, GY - 92, 292, 3);
}

// Sala de jantar quente: janela ao fundo, luminária pendente, mesa
export function dining(g, t, cam, o = {}) {
  const M = mood('interiorWarm'), GY = ground(), CX = E.W / 2, wall = shade(M.wall, -0.2);
  layer(g, cam, 0.5, (g) => {
    g.fillStyle = linGrad(g, 0, -E.H, 0, GY, [shade(wall, -0.45), wall]); g.fillRect(-E.W, -E.H, E.W * 3, GY + E.H);
    FX.windowFrame(g, { x: CX - 520, y: GY - 760, w: 300, h: 380, cols: 2, rows: 2, frame: shade(M.dark, -0.2), bar: 10 }, (g, x, y, w, h) => { backdrop(g, mood('dusk').sky, [x, y, w, h]); });
    if (o.door) FX.door(g, { x: CX + 230, y: GY, w: 170, h: 380, color: shade(M.wall, -0.45), open: o.door, light: '#cfe0ff' });
    else { rr(g, CX + 240, GY - 640, 170, 120, 6); g.fillStyle = shade(M.dark, -0.1); g.fill(); g.fillStyle = shade(M.practical, -0.5); g.fillRect(CX + 252, GY - 628, 146, 96); }
  });
  layer(g, cam, 0.9, (g) => {
    g.fillStyle = linGrad(g, 0, GY, 0, E.H * 1.5, [shade(M.floor, -0.05), shade(M.dark, -0.4)]); g.fillRect(-E.W, GY, E.W * 3, E.H * 2);
    FX.floorLines(g, GY, GY + 700, 'rgba(0,0,0,.3)', 0.08);
    const lx = o.lampX ?? CX; seg(g, [[lx, -E.H], [lx, GY - 640]], 3, shade(M.dark, -0.3));
    poly(g, [[lx - 60, GY - 600], [lx + 60, GY - 600], [lx + 30, GY - 650], [lx - 30, GY - 650]], shade(M.dark, -0.2));
    glow(g, lx, GY - 590, 160, M.practical, 0.9); FX.lightCone(g, lx, GY - 600, { len: 620, spread: 0.6, color: M.practical, a: 0.12 });
    FX.pool(g, lx, GY + 20, 420, 60, M.practical, 0.25);
  });
  return { GY, CX, M };
}
export function table(g, x, GY, M, w = 520) {
  const c = shade(M.dark, -0.1), top = GY - 160;
  rr(g, x - w / 2, top, w, 18, 6); g.fillStyle = c; g.fill(); g.fillStyle = alpha(M.practical, 0.45); g.fillRect(x - w / 2 + 6, top, w - 12, 3);
  for (const dx of [-w / 2 + 30, w / 2 - 30]) seg(g, [[x + dx, top + 18], [x + dx, GY]], 10, c);
  return top;
}

// Rua à noite com chuva: fachadas, poste com cone de luz, calçada molhada
export function street(g, t, cam, o = {}) {
  const M = mood('storm'), GY = ground(), CX = E.W / 2;
  layer(g, cam, 0.15, (g) => { backdrop(g, M.sky); FX.skyline(g, { x: -E.W, y: GY - 500, w: E.W * 3, minH: 200, maxH: 700, color: shade(M.dark, 0.05), windowColor: alpha(M.practical, 0.6), lit: 0.2, seed: 9 }); });
  layer(g, cam, 0.55, (g) => {
    for (let i = -2; i <= 2; i++) FX.facade(g, { x: CX - 300 + i * 420, y: GY, w: 400, h: 720 + (i % 2) * 120, color: shade(M.wall, -0.35), win: M.practical, dark: shade(M.dark, -0.2), cols: 3, rows: 4, lit: 0.35, seed: 20 + i });
  });
  layer(g, cam, 0.9, (g) => {
    g.fillStyle = linGrad(g, 0, GY, 0, E.H * 1.5, [shade(M.floor, 0.05), shade(M.dark, -0.4)]); g.fillRect(-E.W, GY, E.W * 3, E.H * 2);
    FX.lampPost(g, CX + 210, GY, 560, { light: M.practical, a: 0.2 });
    FX.pool(g, CX + 240, GY + 30, 330, 50, M.practical, 0.35);
    for (let i = 0; i < 6; i++) g.fillStyle = alpha(M.practical, 0.05), g.fillRect(CX + 200 + Math.sin(i) * 60, GY + 40 + i * 30, 90, 4);  // reflexos
  });
  return { GY, CX, M };
}
