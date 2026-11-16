// shots/01_placa.js — "E se a placa fosse sincera?" (teste de 10 s)
import { E, V, registerShot, mood, layer, blurLayer, veil, ease, prog, key, clamp, lerp, shake, talkAmount, rng, seg, circle, glow, alpha, shade, text, FONTS, S } from '/engine/core.js';
import { drawFigure, POSES, posesAt, breathe, bigFace } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { roadside, roadGround, sign, car, SIGN_X, HERO_X } from '../sets/roadside.js';
import { ZE } from '../cast.js';

const rimL = (M) => ({ color: M.rim, dir: [0.6, -1], w: 5 });   // sol baixo atrás/à direita

// s01 — estabelecimento: estrada ao pôr do sol, Zé ao lado da placa, push-in lento
registerShot('s01', { draw(g, t, info) {
  const cam = { z: 1 + 0.08 * ease.inOut(t / info.dur), x: -20 * ease.inOut(t / info.dur), y: -60 };
  const { GY, M } = roadside(g, t, cam);
  layer(g, cam, 1, (g) => {
    sign(g, SIGN_X(), GY, { s: 0.8, M });
    drawFigure(g, { x: HERO_X(), y: GY, s: 1.0, facing: 1, outfit: ZE, pose: breathe(POSES.stand, t), expr: 'neutral', look: [0.6, -0.2], rim: rimL(M), blink: (t % 2.7) > 2.6 });
  });
  FX.dust(g, t, { count: 40, color: M.key, a: 0.3 });
  FX.lensStreak(g, E.W / 2 + 60, roadGround() - V(320, 390), E.W * 1.3, M.key, 0.2);
} });

// s02 — médio: Zé aponta orgulhoso, número 7 brilha
registerShot('s02', { draw(g, t, info) {
  const cam = { z: 1.55 + 0.06 * ease.inOut(t / info.dur), x: -40 + 30 * ease.inOut(t / info.dur), y: 75 };
  const { GY, M } = roadside(g, t, cam);
  layer(g, cam, 1, (g) => {
    sign(g, SIGN_X(), GY, { s: 0.8, M });
    const pose = breathe(posesAt(t, [[0, POSES.stand], [0.25, POSES.point]]), t);
    drawFigure(g, { x: HERO_X(), y: GY, s: 1.0, facing: 1, outfit: ZE, pose, expr: t > 0.3 ? 'happy' : 'smile', rim: rimL(M), blink: (t % 2.9) > 2.8 });
  });
  blurLayer(g, 10, (g) => { for (const [x, y, r] of [[60, E.H * 0.95, 160], [E.W - 40, E.H * 0.9, 130]]) circle(g, x, y, r, shade(M.grass, -0.7)); });
  FX.dust(g, t, { count: 30, color: M.key, a: 0.3 });
  const p = ease.outBack(prog(t, 0.1, 0.45));
  if (p > 0) { g.save(); g.translate(E.W / 2, E.H * 0.2); g.scale(p, p); UI.readout(g, { label: 'RECORDE:', value: '7 DIAS', x: 0, y: 0, align: 'center', size: V(60, 72) }); g.restore(); }
} });

// s03 — "Até que…": câmera baixa no asfalto, faróis crescendo, desvio
registerShot('s03', { draw(g, t, info) {
  const k = ease.in(prog(t, 0, info.dur));
  const cam = { z: 1.15 + 0.1 * k, x: 220, y: -120, r: -0.03 * k };
  const { GY, HY, VPX, M } = roadside(g, t, cam);
  layer(g, cam, 1, (g) => {
    const d = lerp(0.06, 1.1, k * k);                                 // escala pela distância
    const x = lerp(VPX, VPX - 300, k * k), y = lerp(HY + 6, GY + 160, k);
    car(g, x, y, { s: d * 0.9, dir: -1, M, wheel: t * 20 });
    glow(g, x - 240 * d, y - 100 * d, 300 * d + 40, M.practical, 0.55);
  });
  FX.speedLines(g, t, { cx: E.W * 0.75, cy: E.H * 0.55, count: 40, a: 0.25 * k });
  FX.dust(g, t, { count: 25, color: M.key, a: 0.25 });
} });

// s04 — "PÁ!": o carro entra pela direita e acerta a placa; shake, faíscas, destroços
const DEB = (() => { const r = rng(9); return Array.from({ length: 18 }, () => [(r() - 0.6) * 900, -300 - r() * 700, r() * 14 - 7, 6 + r() * 14]); })();
registerShot('s04', { draw(g, t, info) {
  const hit = 0.12, h = t - hit;
  const [sx, sy] = h > 0 ? shake(t, 26 * Math.exp(-h * 5), 18) : [0, 0];
  const cam = { z: 1.05 + 0.03 * t, x: 60 + sx, y: -20 + sy };
  const { GY, M } = roadside(g, t, cam);
  const SX = SIGN_X();
  layer(g, cam, 1, (g) => {
    const cx = h < 0 ? SX + 520 + (-h) * 2400 : SX + 230 + 30 * (1 - Math.exp(-h * 12));
    sign(g, SX - (h > 0 ? 40 * ease.out(prog(h, 0, 0.3)) : 0), GY, { s: 0.8, M, tilt: h > 0 ? -0.55 * ease.outBack(prog(h, 0, 0.4)) : 0 });
    car(g, cx, GY, { s: 0.75, dir: -1, M, crush: h > 0 ? 1 : 0, wheel: h < 0 ? t * 30 : 0 });
    const pose = h > 0.05 ? breathe(POSES.handsOnHead, t) : POSES.stand;
    drawFigure(g, { x: HERO_X() - 40, y: GY, s: 1.0, facing: 1, outfit: ZE, pose, expr: h > 0.05 ? 'shocked' : 'neutral', rim: rimL(M) });
    if (h > 0) {
      const tt = Math.min(h, 1.2);
      for (const [vx, vy, sp, sz] of DEB) { const x = SX + 60 + vx * tt, y = Math.min(GY - 4, GY - 300 + vy * tt + 1400 * tt * tt); g.save(); g.translate(x, y); g.rotate(sp * tt); g.fillStyle = sz > 12 ? '#f2ead8' : S().ink; g.fillRect(-sz, -sz * 0.6, sz * 2, sz * 1.2); g.restore(); }
      FX.rings(g, SX + 120, GY - 330, h, { count: 3, r0: 40, r1: 420, speed: 2, color: '#fff3e0', a: 0.6 * (1 - prog(h, 0, 0.8)) });
      for (let i = 0; i < 6; i++) FX.sparkle(g, SX + 100 + Math.sin(i * 2.1) * 140 * (0.4 + h), GY - 330 + Math.cos(i * 1.7) * 120 * (0.4 + h), 26 * (1 - prog(h, 0, 0.6)), '#fff3c0');
    }
  });
  FX.dust(g, t, { count: 60, color: M.key, a: 0.4 });
} });

// s05 — "Zero.": insert na placa torta, número vira 0 em vermelho
registerShot('s05', { draw(g, t, info) {
  const cam = { z: 2.1 + 0.12 * ease.inOut(t / info.dur), x: -30, y: 170, r: -0.04 };
  const { GY, M } = roadside(g, t, cam);
  const flip = 0.25;
  layer(g, cam, 1, (g) => {
    car(g, SIGN_X() + 260, GY, { s: 0.75, dir: -1, M, crush: 1 });
    sign(g, SIGN_X() - 40, GY, { s: 0.8, M, tilt: -0.55, days: t < flip ? '7' : '0', alert: t >= flip });
  });
  if (t > flip) FX.rings(g, E.W / 2, E.H * 0.45, t - flip, { count: 2, r0: 60, r1: 380, speed: 1.6, color: '#ff8a6a', a: 0.5 * (1 - prog(t, flip, flip + 0.8)) });
  FX.dust(g, t, { count: 40, color: M.key, a: 0.35 });
} });

// s06 — "Pelo menos durou uma semana.": close gigante do Zé, deboche, falando
registerShot('s06', { draw(g, t, info) {
  const M = mood('dusk');
  blurLayer(g, 14, (g) => roadside(g, t, { z: 1.6, x: 260, y: -300 })); veil(g, '#0a0a10', 0.3);
  blurLayer(g, 10, (g) => { const GY = roadGround(); car(g, SIGN_X() + 260, GY, { s: 0.75, dir: -1, M, crush: 1 }); sign(g, SIGN_X() - 40, GY, { s: 0.8, M, tilt: -0.55, days: '0', alert: true }); }, { z: 1.6, x: 260, y: -300 }, 1);
  const r = V(300, 330) * (1 + 0.04 * t), cx = E.W / 2 - V(80, 40), cy = E.H * V(0.6, 0.5);
  const talk = talkAmount(info.globalT, 7.85, 9.6);
  bigFace(g, cx, cy, r, { outfit: ZE, expr: 'smirk', talk, rimColor: M.rim, rimSide: 1, blink: (t % 2.6) > 2.5, look: [0.15, 0] });
  if (talk > 0) FX.rings(g, cx, cy, t, { count: 3, r0: r * 1.1, r1: r * 1.5, color: '#fff3e0', a: 0.25 });
  FX.dust(g, t, { count: 30, color: M.key, a: 0.3 });
} });
