// sets/roadside.js — beira de estrada ao entardecer. Sol baixo no horizonte (key light) atrás da placa,
// estrada em perspectiva para a direita, campo escuro, placa "DIAS SEM ACIDENTE".
import { E, V, mood, layer, backdrop, rr, seg, circle, poly, linGrad, glow, alpha, shade, mix, text, FONTS, S } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';

export const roadGround = () => E.H * V(0.8, 0.68);
export const SIGN_X = () => E.W / 2 + V(120, 150);
export const HERO_X = () => E.W / 2 - V(200, 210);

export function roadside(g, t, cam, o = {}) {
  const M = mood(o.mood || 'dusk'), GY = roadGround(), CX = E.W / 2, HY = GY - V(260, 330);
  const VPX = CX + V(420, 330);
  layer(g, cam, 0.12, (g) => {
    backdrop(g, M.sky);
    FX.sun(g, CX + V(120, 60), HY - 60, 70, '#fff3dc', M.key, 5);
    FX.godRays(g, CX + V(120, 60), HY - 60, { color: M.key, a: 0.08 });
    FX.clouds(g, { y: HY - V(500, 900), h: 160, color: M.key, a: 0.12, seed: 4 });
  });
  layer(g, cam, 0.3, (g) => {
    FX.hills(g, { y: HY, amp: 30, color: mix(M.sky[1], M.dark, 0.7), seed: 3 });
    for (const [x, s] of [[-260, 0.7], [-120, 0.55], [CX * 2 + 200, 0.8]]) FX.tree(g, x, HY + 10, s, mix(M.dark, M.sky[1], 0.25));
  });
  layer(g, cam, 0.85, (g) => {
    g.fillStyle = linGrad(g, 0, HY, 0, E.H * 1.6, [shade(M.grass, -0.35), shade(M.grass, -0.6), shade(M.dark, -0.3)]);
    g.fillRect(-E.W, HY, E.W * 3, E.H * 2);
    // estrada em perspectiva (do ponto de fuga para baixo/direita)
    poly(g, [[VPX - 8, HY], [VPX + 8, HY], [E.W * 2.2, E.H * 1.6], [CX + V(80, 60), E.H * 1.6]], shade(M.road, -0.2));
    poly(g, [[VPX - 1, HY], [VPX + 1, HY], [E.W * 1.25, E.H * 1.6], [E.W * 1.18, E.H * 1.6]], alpha(M.practical, 0.55));
    poly(g, [[VPX - 8, HY], [VPX - 6, HY], [CX + V(110, 90), E.H * 1.6], [CX + V(80, 60), E.H * 1.6]], alpha('#ffffff', 0.35));
    FX.fog(g, HY - 40, 120, M.fog, 0.35);
    FX.pool(g, CX + V(120, 60), GY + 10, 520, 60, M.key, 0.18);
  });
  return { GY, CX, HY, VPX, M };
}

// Placa-gag. days: texto do número; red: número em cor de alerta; tilt: rad; bent: amassado 0..1
export function sign(g, x, GY, o = {}) {
  const { days = '7', alert = false, tilt = 0, s = 1, M = mood('dusk') } = o;
  const w = 300 * s, h = 230 * s, post = 230 * s;
  g.save(); g.translate(x, GY); g.rotate(tilt);
  seg(g, [[0, 0], [0, -post]], 14 * s, S().ink);
  seg(g, [[4 * s, 0], [4 * s, -post]], 3 * s, alpha(M.rim, 0.7));
  const y0 = -post - h;
  rr(g, -w / 2 - 8 * s, y0 - 8 * s, w + 16 * s, h + 16 * s, 16 * s); g.fillStyle = S().ink; g.fill();
  rr(g, -w / 2, y0, w, h, 12 * s); g.fillStyle = '#f2ead8'; g.fill();
  g.fillStyle = linGrad(g, 0, y0, 0, y0 + h, [alpha('#000', 0), alpha(M.dark, 0.25)]); g.fill();
  rr(g, -w / 2 - 8 * s, y0 - 8 * s, w + 16 * s, h + 16 * s, 16 * s); g.strokeStyle = alpha(M.rim, 0.9); g.lineWidth = 3 * s; g.stroke();
  text(g, 'DIAS SEM', 0, y0 + 40 * s, { size: 36 * s, color: '#1a1420', font: FONTS.ui, weight: 900 });
  text(g, 'ACIDENTE:', 0, y0 + 80 * s, { size: 36 * s, color: '#1a1420', font: FONTS.ui, weight: 900 });
  text(g, days, 0, y0 + 160 * s, { size: 110 * s, color: alert ? S().ui.accent === '#c6ff3d' ? '#ff5a3c' : S().ui.accent : '#1a1420', font: FONTS.ui, weight: 900, glow: alert ? 20 : 0, glowColor: alpha('#ff5a3c', 0.7) });
  g.restore();
}

// Carro de perfil (frente para a esquerda quando dir = -1)
export function car(g, x, GY, o = {}) {
  const { s = 1, dir = -1, color = '#f2c21a', crush = 0, wheel = 0, M = mood('dusk') } = o;
  g.save(); g.translate(x, GY); g.scale(dir * s, s);
  const ink = S().ink;
  // carroceria (frente em +x), amassado encurta a frente
  const fx = 260 - crush * 40;
  g.beginPath(); g.moveTo(-250, -40); g.lineTo(-250, -110); g.quadraticCurveTo(-240, -125, -200, -128); g.lineTo(-120, -130);
  g.lineTo(-70, -200); g.lineTo(90, -200); g.lineTo(150, -135); g.lineTo(fx - 20, -125 + crush * 10); g.quadraticCurveTo(fx, -115, fx, -80 + crush * 6); g.lineTo(fx, -40); g.closePath();
  g.fillStyle = shade(color, -0.35); g.fill();
  g.fillStyle = linGrad(g, 0, -200, 0, -40, [shade(color, 0.05), shade(color, -0.25), shade(color, -0.55)]); g.fill();
  g.strokeStyle = alpha(M.rim, 0.9); g.lineWidth = 4; g.beginPath(); g.moveTo(-200, -128); g.lineTo(-120, -130); g.lineTo(-70, -200); g.lineTo(90, -200); g.stroke();
  poly(g, [[-55, -190], [10, -190], [10, -138], [-100, -138]], alpha('#1a2430', 0.9));
  poly(g, [[25, -190], [82, -190], [130, -138], [25, -138]], alpha('#1a2430', 0.9));
  poly(g, [[-40, -186], [-20, -186], [-62, -142], [-82, -142]], alpha('#ffffff', 0.15));
  rr(g, fx - 24, -112, 24, 22, 6); g.fillStyle = '#fff6d8'; g.fill(); glow(g, fx, -100, 120, M.practical, 0.5);
  rr(g, -252, -110, 16, 20, 4); g.fillStyle = '#ff5a3c'; g.fill();
  for (const wx of [-160, 170 - crush * 20]) {
    circle(g, wx, -40, 44, ink); circle(g, wx, -40, 20, '#6a6a78');
    seg(g, [[wx + Math.cos(wheel) * 18, -40 + Math.sin(wheel) * 18], [wx - Math.cos(wheel) * 18, -40 - Math.sin(wheel) * 18]], 5, ink);
  }
  g.restore();
  g.save(); g.globalAlpha = 0.45; g.fillStyle = '#000'; g.beginPath(); g.ellipse(x, GY + 4, 270 * s, 16 * s, 0, 0, 7); g.fill(); g.restore();
}
