import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
const P = '../ratos-hanoi/textures/';
const loadTex = (f, rx = 1, ry = 1) => new Promise(r => new THREE.TextureLoader().load(P + f, t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; r(t); }));
const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...o });
const INK = '#271925';
function signTex(lines, w = 1024, h = 512, bg = '#f3e6c4', fg = INK, accent = '#d2452f') {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = INK; g.lineWidth = 28; g.strokeRect(14, 14, w - 28, h - 28);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach((L, i) => { g.font = `900 ${L.size}px Arial Black, Arial, sans-serif`; g.fillStyle = L.red ? accent : fg; g.fillText(L.t, w / 2, L.y); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export async function build() {
  const T = { brick: await loadTex('tijolo.jpg', 4, 2), water: await loadTex('agua.jpg', 2, 6), wood: await loadTex('madeira.jpg', 1, 1), wood2: await loadTex('madeira.jpg', 2, 1) };
  const out = {};
  // 1. esgoto: túnel fechado de tijolo ao longo de z (de +14 a -44), abóbada, canal central, passarelas, canos e lâmpadas
  { const g = new THREE.Group(); const Z0 = 14, Z1 = -44, L = Z0 - Z1, ZC = (Z0 + Z1) / 2, HW = 3.2, WALK = 0.6, SPRING = 2.3;
    const tex = (t, rx, ry) => { const c = t.clone(); c.repeat.set(rx, ry); c.needsUpdate = true; return c; };
    const brickWall = std({ map: tex(T.brick, L / 4, 1), color: '#d8c4bc' });
    const brickVault = std({ map: tex(T.brick, L / 4, 3), color: '#cdb7b4', side: THREE.DoubleSide, emissive: '#3a2630', emissiveIntensity: 0.35 });
    const brickFloor = std({ map: tex(T.brick, 1, L / 3), color: '#b8a49c', emissive: '#3a2630', emissiveIntensity: 0.45 });
    const vault = new THREE.Mesh(new THREE.CylinderGeometry(HW, HW, L, 48, 1, true, Math.PI / 2, Math.PI), brickVault);
    vault.rotation.x = Math.PI / 2; vault.position.set(0, SPRING, ZC); g.add(vault);
    for (const sx of [-1, 1]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.3, SPRING - WALK + 0.02, L), brickWall); wall.position.set(sx * (HW + 0.15), WALK + (SPRING - WALK) / 2, ZC); g.add(wall);
      const walk = new THREE.Mesh(new THREE.BoxGeometry(HW - 1.2, WALK, L), brickFloor); walk.position.set(sx * (1.2 + (HW - 1.2) / 2), WALK / 2, ZC); g.add(walk);
      const curb = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, L), std({ color: '#7d6a72' })); curb.position.set(sx * 1.25, WALK + 0.05, ZC); g.add(curb);
      const slime = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.35, L), std({ color: '#5f7d55' })); slime.position.set(sx * (HW - 0.0), WALK + 0.17, ZC); g.add(slime);
    }
    const bed = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, L), brickFloor); bed.position.set(0, 0.05, ZC); g.add(bed);
    const water = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.04, L), std({ map: tex(T.water, 1, L / 4), color: '#cfe6c6', roughness: 0.25, emissive: '#1e3a2e', emissiveIntensity: 0.5 })); water.position.set(0, 0.32, ZC); g.add(water);
    // arcos de reforço + pilastras a cada 4 m
    const rib = std({ color: '#7a5f66', map: tex(T.brick, 3, 0.3), emissive: '#3a2630', emissiveIntensity: 0.5 });
    for (let z = Z0 - 2; z > Z1; z -= 4) {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(HW - 0.08, 0.16, 8, 32, Math.PI), rib); arc.position.set(0, SPRING, z); g.add(arc);
      for (const sx of [-1, 1]) { const pil = new THREE.Mesh(new THREE.BoxGeometry(0.22, SPRING - WALK, 0.34), rib); pil.position.set(sx * (HW - 0.06), WALK + (SPRING - WALK) / 2, z); g.add(pil); }
    }
    // fundo: grade escura e parede atrás da câmera
    const endWall = new THREE.Mesh(new THREE.BoxGeometry(2 * HW + 0.6, SPRING + HW + 0.2, 0.3), std({ color: '#2e2436' })); endWall.position.set(0, (SPRING + HW + 0.2) / 2, Z1); g.add(endWall);
    for (let x = -2.8; x <= 2.81; x += 0.4) { const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, SPRING + HW - 0.4, 6), std({ color: '#4a3a40' })); bar.position.set(x, (SPRING + HW) / 2, Z1 + 0.5); g.add(bar); }
    const front = endWall.clone(); front.material = std({ map: tex(T.brick, 2, 2) }); front.position.z = Z0; g.add(front);
    // canos despejando no canal
    for (const [sx, z] of [[-1, -3.5], [1, -11], [-1, -19]]) {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.7, 16), std({ color: '#6f6a74', metalness: 0.3, roughness: 0.6 })); pipe.rotation.z = Math.PI / 2; pipe.position.set(sx * (HW - 0.3), 1.05, z); g.add(pipe);
      const fall = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.75, 0.04), std({ color: '#9cc4b4', roughness: 0.2, transparent: true, opacity: 0.85 })); fall.position.set(sx * (HW - 0.75), 0.68, z); g.add(fall);
    }
    // lâmpadas de parede com luz de verdade (pontos quentes ao longo do túnel)
    for (const [sx, z] of [[1, 4], [-1, 0], [1, -4], [-1, -8], [1, -12], [-1, -17], [1, -23], [-1, -30]]) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.4, 0.3), std({ color: '#3a3040' })); box.position.set(sx * (HW - 0.12), 2.0, z); g.add(box);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), new THREE.MeshStandardMaterial({ color: '#ffcf80', emissive: '#ff9a30', emissiveIntensity: 1.6 })); bulb.position.set(sx * (HW - 0.3), 2.0, z); bulb.userData.noShadow = true; g.add(bulb);
      const light = new THREE.PointLight('#ffb466', 42, 15, 2); light.position.set(sx * (HW - 0.6), 2.0, z); g.add(light);
    }
    out.esgoto = g; }
  // 2. balcão da recompensa com placa e cesto de rabos
  { const g = new THREE.Group(); const wood = std({ map: T.wood2 });
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 1.0), wood); top.position.y = 1.0; g.add(top);
    const front = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.95, 0.08), wood); front.position.set(0, 0.5, 0.46); g.add(front);
    for (const x of [-1.2, 1.2]) for (const z of [-0.42, 0.42]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1, 0.1), wood); l.position.set(x, 0.5, z); g.add(l); }
    for (const x of [-1.25, 1.25]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.9, 0.12), std({ map: T.wood })); p.position.set(x, 1.45, -0.45); g.add(p); }
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 1.2), std({ map: signTex([{ t: 'RECOMPENSA', y: 120, size: 120 }, { t: '1 CENTAVO', y: 270, size: 150, red: true }, { t: 'POR RABO', y: 410, size: 110 }]) }));
    sign.position.set(0, 2.45, -0.38); g.add(sign);
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.3, 0.05), std({ map: T.wood })); back.position.set(0, 2.45, -0.42); g.add(back);
    const bask = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.32, 0.45, 20, 1, true), std({ color: '#c8a060', side: THREE.DoubleSide })); bask.position.set(0.6, 1.3, 0); g.add(bask);
    const pink = std({ color: '#e8a0a8' });
    for (let i = 0; i < 14; i++) { const a = i * 2.39, rr = 0.08 + 0.22 * ((i * 0.37) % 1);
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.1 * Math.cos(a), 0.25, 0.1 * Math.sin(a)), new THREE.Vector3(0.25 * Math.cos(a + 0.6), 0.42 + 0.1 * (i % 3), 0.25 * Math.sin(a + 0.6))]);
      const tail = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.025, 6), pink); tail.position.set(0.6 + rr * Math.cos(a), 1.32, rr * Math.sin(a)); g.add(tail); }
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.35), std({ color: '#5e3d2a' })); box.position.set(-0.6, 1.15, 0); g.add(box);
    for (let i = 0; i < 6; i++) { const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 16), std({ color: '#d6a640', metalness: 0.6, roughness: 0.35 })); coin.position.set(-0.6 + (i % 3) * 0.12 - 0.12, 1.25 + Math.floor(i / 3) * 0.022, (i % 2) * 0.08 - 0.04); g.add(coin); }
    out.balcao = g; }
  // 3. gaiola da criação de ratos
  { const g = new THREE.Group(); const wood = std({ map: T.wood }), bar = std({ color: '#4a3a40', metalness: 0.3, roughness: 0.6 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 1.0), wood); base.position.y = 0.06; g.add(base);
    const roof = base.clone(); roof.position.y = 1.0; g.add(roof);
    for (let i = 0; i <= 10; i++) { const x = -0.75 + i * 0.15; for (const z of [-0.45, 0.45]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.9, 6), bar); b.position.set(x, 0.53, z); g.add(b); } }
    for (let i = 0; i <= 6; i++) { const z = -0.45 + i * 0.15; for (const x of [-0.75, 0.75]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.9, 6), bar); b.position.set(x, 0.53, z); g.add(b); } }
    const hay = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.8), std({ color: '#e0c070' })); hay.position.y = 0.16; g.add(hay);
    out.gaiola = g; }
  // 4. poste de iluminação colonial
  { const g = new THREE.Group(), iron = std({ color: '#3a3040', metalness: 0.4, roughness: 0.5 });
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 3.6, 12), iron); p.position.y = 1.8; g.add(p);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.4, 12), iron); b.position.y = 0.2; g.add(b);
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.14, 0.45, 6), new THREE.MeshStandardMaterial({ color: '#ffe3a0', emissive: '#ffbe5c', emissiveIntensity: 1.4 })); lamp.position.y = 3.85; g.add(lamp);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.28, 6), iron); cap.position.y = 4.2; g.add(cap);
    out.poste = g; }
  const ex = new GLTFExporter(), res = {};
  for (const [k, obj] of Object.entries(out)) {
    const buf = await ex.parseAsync(obj, { binary: true }); let s = ''; const u = new Uint8Array(buf);
    for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
    res[k] = btoa(s);
  }
  return res;
}
