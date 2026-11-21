// shots/00_yard3d.js — s001 (opening establishing orbit) and s061 (final pull-out at dusk), same 3D backyard.
import { E, V, registerShot, mood, ease, prog } from '/engine/core.js';
import { POSES } from '/engine/rig2d.js';
import { EU, BILL, WALLACE, CLOWN, KIDS, SQUAD, GIFT, RED } from '../cast.js';

function buildYard(T, M, final) {
  const st = T.stage({ mood: 'golden', fov: V(36, 50), fog: [22, 60], keyPos: [9, 6, 8], keyIntensity: 3.4, ambient: 2.2 });
  st.add(T.ground(70, 70, M.grass));
  st.add(T.box(30, 2.4, 0.35, M.wall, 6, 1.2, -4.5));                                   // brick wall
  st.add(T.box(10, 4.2, 7, M.wall, -8, 2.1, -1.5));                                     // house
  for (const z of [-3.2, 0.2]) { const w = T.windowPane(1.6, 1.3, { glowColor: M.practical, cols: 2, rows: 1, power: 0.9, interior: true }); w.position.set(-2.98, 2.0, z); w.rotation.y = Math.PI / 2; st.add(w); }
  const door = T.windowPane(1.0, 2.1, { glowColor: M.practical, cols: 1, rows: 1, power: final ? 1.1 : 0.4 }); door.position.set(-2.98, 1.05, 2.2); door.rotation.y = Math.PI / 2; st.add(door);
  st.add(T.box(2.0, 0.08, 0.9, '#efe6da', 3.2, 0.78, -2.6)); for (const dx of [-0.9, 0.9]) st.add(T.box(0.06, 0.78, 0.06, '#1a1418', 3.2 + dx, 0.39, -2.6));
  st.add(T.cyl(0.2, 0.2, 0.25, '#f3d9e6', 3.2, 0.95, -2.6));
  const box = T.box(0.9, 0.9, 0.9, GIFT, 1.2, 0.45, -1.4); st.add(box); st.add(T.box(0.18, 0.92, 0.92, RED, 1.2, 0.45, -1.4));
  const lid = T.box(1.0, 0.16, 1.0, GIFT, 1.2, 0.98, -1.4); st.add(lid);
  if (final) { lid.position.set(2.0, 0.08, -0.6); lid.rotation.set(0.1, 0.6, 0.2); }
  const cols = ['#d64a33', '#f2c21a', '#3fb950', '#8a5ad6', '#f29ac0'];
  st.add(T.cyl(0.04, 0.04, 3.2, '#1a1418', 5.5, 1.6, -3.6));
  cols.forEach((c, i) => st.add(T.sphere(0.28, c, 5.5 + (i - 2) * 0.32, 3.5 + (i % 2) * 0.35, -3.6)));
  for (const x of [-2, 2, 6, 10, 14]) st.add(T.tree3D(x, -7, 1.3, '#1c2a22'));
  const kids = final
    ? [[EU, -0.2, 0.2, 0.3], [BILL, 0.4, 1.0, 0], [WALLACE, 1.7, 0.6, Math.PI]]
    : [[EU, 0.2, -1.2, 0], [BILL, -0.6, -0.2, 0.4], [WALLACE, 2.3, -0.3, Math.PI], [KIDS[0], 0.9, 0.8, 2.2], [KIDS[1], 2.6, -2.0, 3.6], [KIDS[2], -1.2, -2.6, 0.1]];
  const figs = kids.map(([o, x, z, ry], i) => { const f = T.figure3D(o, { rim: M.rim, pose: i % 2 ? POSES.cheer : POSES.stand }); f.position.set(x, 0, z); f.rotation.y = ry; st.add(f); return f; });
  if (final) {
    const c = T.figure3D(CLOWN, { rim: M.rim, pose: POSES.kneel }); c.position.set(2.4, 0, 0.6); c.rotation.y = Math.PI; st.add(c);
    const sq = T.figure3D(SQUAD, { rim: M.rim, pose: POSES.crossArms }); sq.position.set(-1.6, 0, 1.8); sq.rotation.y = -0.3; st.add(sq);
  }
  return { stage: st, figs };
}
registerShot('s001', { kind: '3d',
  init(T) { return buildYard(T, mood('golden'), false); },
  draw(s, t, info, T) {
    s.figs.forEach((f, i) => f.setPose?.(i % 2 && Math.sin(t * 6 + i) > 0 ? POSES.cheer : POSES.stand));
    T.orbit(s.stage.camera, t, { target: [1.2, 0.9, -1.2], radius: V(8.5, 9.5), height: [3.4, 2.4], from: 0.25, to: 0.75, dur: info.dur });
  } });
registerShot('s061', { kind: '3d',
  init(T) { return buildYard(T, mood('golden'), true); },
  draw(s, t, info, T) { T.orbit(s.stage.camera, t, { target: [1.0, 0.8, 0.3], radius: [V(5, 6), V(9, 10.5)], height: [1.6, 3.6], from: 0.55, to: 0.15, dur: info.dur }); } });
