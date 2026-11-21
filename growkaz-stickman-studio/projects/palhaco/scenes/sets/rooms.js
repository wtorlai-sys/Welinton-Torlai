// sets/rooms.js — (1) the house window seen from the yard, with the room inside; (2) the garage flashback.
import { E, V, mood, layer, backdrop, rr, seg, circle, linGrad, radGrad, glow, alpha, shade, mix } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';

// big window filling the frame; inner(g, floorY) draws the room's characters (clipped to the glass)
export function windowSet(g, t, cam, inner, o = {}) {
  const M = mood('golden'), IN = mood('interiorWarm'), CX = E.W / 2;
  const wx = CX - V(520, 430), wy = E.H * V(0.16, 0.24), ww = V(1040, 860), wh = V(700, 820), floorY = wy + wh - 30;
  layer(g, cam, 0.8, (g) => {                                   // exterior siding
    g.fillStyle = linGrad(g, 0, -E.H, 0, E.H * 2, [shade(M.wall, -0.15), shade(M.wall, -0.5)]); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
    g.fillStyle = 'rgba(0,0,0,.25)'; for (let y = -E.H; y < E.H * 2; y += 28) g.fillRect(-E.W, y, E.W * 3, 3);
    g.fillStyle = alpha(M.rim, 0.12); g.fillRect(-E.W, wy - 60, E.W * 3, 8);
  });
  layer(g, cam, 0.9, (g) => {
    g.save(); g.beginPath(); g.rect(wx, wy, ww, wh); g.clip();
    g.fillStyle = linGrad(g, 0, wy, 0, floorY, [shade(IN.wall, -0.1), IN.wall]); g.fillRect(wx, wy, ww, wh);
    // room: framed picture, lamp, floor
    rr(g, wx + ww * 0.62, wy + 90, 170, 120, 6); g.fillStyle = '#2a1e22'; g.fill(); g.fillStyle = shade(IN.practical, -0.5); g.fillRect(wx + ww * 0.62 + 14, wy + 104, 142, 92);
    seg(g, [[wx + ww * 0.18, wy], [wx + ww * 0.18, wy + 120]], 3, '#1a1418'); circle(g, wx + ww * 0.18, wy + 136, 22, '#ffe9c0'); glow(g, wx + ww * 0.18, wy + 136, 380, IN.practical, 0.45);
    g.fillStyle = shade(IN.floor, -0.2); g.fillRect(wx, floorY, ww, wh);
    FX.pool(g, wx + ww * 0.3, floorY + 10, 360, 40, IN.practical, 0.3);
    inner(g, floorY, IN, wx, ww);
    // glass reflection
    g.fillStyle = 'rgba(255,240,210,.06)'; g.beginPath(); g.moveTo(wx + ww * 0.55, wy); g.lineTo(wx + ww * 0.7, wy); g.lineTo(wx + ww * 0.35, wy + wh); g.lineTo(wx + ww * 0.2, wy + wh); g.fill();
    g.restore();
  });
  layer(g, cam, 0.9, (g) => {                                   // frame + mullions + sill
    const fr = shade(M.wall, -0.7); g.fillStyle = fr; g.fillRect(wx + ww / 2 - 7, wy, 14, wh); g.fillRect(wx, wy + wh * 0.45, ww, 12);
    g.strokeStyle = fr; g.lineWidth = 22; g.strokeRect(wx, wy, ww, wh); g.fillStyle = shade(M.wall, -0.3); g.fillRect(wx - 40, wy + wh + 10, ww + 80, 26);
  });
  if (o.fg !== false) layer(g, cam, 1.3, (g) => { g.fillStyle = shade(M.grass, -0.6); g.fillRect(-E.W, wy + wh + 36, E.W * 3, E.H); });
  return { floorY, wx, ww, IN };
}

// garage flashback: one hanging bulb, workbench with the wires + gloves, pegboard of tools
export function garage(g, t, cam) {
  const M = mood('interiorCool'), CX = E.W / 2, BY = E.H * V(0.62, 0.56);
  layer(g, cam, 0.6, (g) => {
    g.fillStyle = linGrad(g, 0, -E.H, 0, BY, [M.dark, shade(M.wall, -0.2)]); g.fillRect(-E.W, -E.H, E.W * 3, BY + E.H);
    rr(g, CX - 380, BY - 560, 760, 380, 8); g.fillStyle = shade(M.wall, -0.35); g.fill();
    g.fillStyle = 'rgba(0,0,0,.35)'; for (let i = 0; i < 14; i++) for (let j = 0; j < 7; j++) circle(g, CX - 350 + i * 52, BY - 530 + j * 52, 4, 'rgba(0,0,0,.35)');
    seg(g, [[CX - 280, BY - 480], [CX - 280, BY - 300]], 10, '#0c0e18'); seg(g, [[CX - 300, BY - 480], [CX - 260, BY - 480]], 22, '#0c0e18');
    seg(g, [[CX - 120, BY - 470], [CX - 60, BY - 330]], 12, '#0c0e18'); circle(g, CX + 120, BY - 400, 50, 'rgba(0,0,0,.0)'); FX.clock(g, CX + 230, BY - 440, 40, 0, { face: '#9aa4c0' });
  });
  layer(g, cam, 0.9, (g) => {
    g.fillStyle = shade(M.floor, -0.3); g.fillRect(-E.W, BY + 60, E.W * 3, E.H);
    g.fillStyle = '#2a2026'; g.fillRect(CX - 480, BY - 20, 960, 40); seg(g, [[CX - 440, BY + 20], [CX - 440, BY + 300]], 18, '#1a1418'); seg(g, [[CX + 440, BY + 20], [CX + 440, BY + 300]], 18, '#1a1418');
  });
  const sw = Math.sin(t * 1.6) * 0.12, bx = CX + Math.sin(sw) * 520, by = BY - 760 + Math.cos(sw) * 520 - 520 + 520;
  layer(g, cam, 0.85, (g) => { seg(g, [[CX, -E.H], [bx, by - 30]], 3, '#0a0a10'); circle(g, bx, by, 26, '#fff4d6'); glow(g, bx, by, 520, '#ffd08a', 0.5);
    FX.lightCone(g, bx, by, { angle: Math.PI / 2 + sw * 0.6, spread: 0.9, len: 1100, color: '#ffd08a', a: 0.16 }); });
  return { BY, CX, M, bulb: [bx, by] };
}
