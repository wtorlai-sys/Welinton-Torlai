// Gera os personagens 2D (camadas PNG sem fundo + rig.json + faces) a partir de SVG desenhado em código.
// uso: node make_puppets.mjs <pasta-do-projeto>
import { createRequire } from 'module'; import fs from 'fs'; import path from 'path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const OUT = path.resolve(process.argv[2] || '.');
const INK = '#271925', LW = 20;

// ---------- caçador ----------
const W = 640, H = 1320;
const HC = [320, 360], HR = 205;              // cabeça
const shade = (id, cx, cy, r, dx, dy, col) => `
 <clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
 <g clip-path="url(#${id})"><circle cx="${cx}" cy="${cy}" r="${r}" fill="${col}"/><circle cx="${cx - dx}" cy="${cy - dy}" r="${r}" fill="#f6f1e2"/></g>`;
const headBase = () => `
 <defs>${''}</defs>
 ${shade('hs', HC[0], HC[1], HR, 34, 22, '#d9cfc0')}
 <circle cx="${HC[0]}" cy="${HC[1]}" r="${HR}" fill="none" stroke="${INK}" stroke-width="${LW}"/>`;
const hat = () => `
 <path d="M 20 ${HC[1]-95} L ${HC[0]} 30 L ${W-20} ${HC[1]-95} Q ${HC[0]} ${HC[1]-45} 20 ${HC[1]-95} Z" fill="#e7c47c" stroke="${INK}" stroke-width="${LW}" stroke-linejoin="round"/>
 <path d="M ${HC[0]} 44 L ${W-34} ${HC[1]-98} Q ${HC[0]+150} ${HC[1]-62} ${HC[0]+40} ${HC[1]-58} Z" fill="#c99d55" opacity=".75"/>
 <path d="M 120 ${HC[1]-170} Q ${HC[0]} ${HC[1]-135} ${W-120} ${HC[1]-170}" fill="none" stroke="#a27a3c" stroke-width="7"/>
 <path d="M 200 ${HC[1]-245} Q ${HC[0]} ${HC[1]-220} ${W-200} ${HC[1]-245}" fill="none" stroke="#a27a3c" stroke-width="7"/>
 <path d="M 20 ${HC[1]-95} L ${HC[0]} 30 L ${W-20} ${HC[1]-95} Q ${HC[0]} ${HC[1]-45} 20 ${HC[1]-95} Z" fill="none" stroke="${INK}" stroke-width="${LW}" stroke-linejoin="round"/>`;
const ex = HC[0], ey = HC[1] + 40;           // centro do rosto
const L = (d, w = 14) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const dot = (x, y, r = 15) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/>`;
const mouthOpen = (d, teeth = true, tongue = false) => `<path d="${d}" fill="#5a1f2c" stroke="${INK}" stroke-width="13" stroke-linejoin="round"/>` +
  (teeth ? `<clipPath id="mc${d.length}"><path d="${d}"/></clipPath><rect clip-path="url(#mc${d.length})" x="0" y="0" width="${W}" height="${ey + 62}" fill="#fffaf0"/>` : '') +
  (tongue ? `<clipPath id="tc${d.length}"><path d="${d}"/></clipPath><ellipse clip-path="url(#tc${d.length})" cx="${ex}" cy="${ey + 150}" rx="60" ry="40" fill="#e0707a"/>` : '') +
  `<path d="${d}" fill="none" stroke="${INK}" stroke-width="13" stroke-linejoin="round"/>`;
const FACES = {
  neutral: dot(ex - 70, ey) + dot(ex + 70, ey) + L(`M ${ex-110} ${ey-55} L ${ex-35} ${ey-52}`) + L(`M ${ex+35} ${ey-52} L ${ex+110} ${ey-55}`) + L(`M ${ex-30} ${ey+80} L ${ex+30} ${ey+80}`, 11),
  happy: L(`M ${ex-100} ${ey+8} Q ${ex-70} ${ey-30} ${ex-40} ${ey+8}`) + L(`M ${ex+40} ${ey+8} Q ${ex+70} ${ey-30} ${ex+100} ${ey+8}`) +
    L(`M ${ex-110} ${ey-62} Q ${ex-75} ${ey-80} ${ex-38} ${ey-64}`) + L(`M ${ex+38} ${ey-64} Q ${ex+75} ${ey-80} ${ex+110} ${ey-62}`) +
    mouthOpen(`M ${ex-95} ${ey+50} Q ${ex} ${ey+70} ${ex+95} ${ey+50} Q ${ex+70} ${ey+150} ${ex} ${ey+150} Q ${ex-70} ${ey+150} ${ex-95} ${ey+50} Z`, true, true),
  nervous: dot(ex - 68, ey + 5, 12) + dot(ex + 68, ey + 5, 12) + L(`M ${ex-110} ${ey-40} L ${ex-38} ${ey-68}`) + L(`M ${ex+38} ${ey-68} L ${ex+110} ${ey-40}`) +
    L(`M ${ex-60} ${ey+90} q 15 -15 30 0 q 15 15 30 0 q 15 -15 30 0 q 15 15 30 0`, 11) +
    `<path d="M ${ex+160} ${ey-90} q 22 40 0 58 q -22 -18 0 -58 Z" fill="#9fd3f0" stroke="${INK}" stroke-width="8"/>`,
  shocked: `<circle cx="${ex-72}" cy="${ey-5}" r="42" fill="#fffaf0" stroke="${INK}" stroke-width="12"/><circle cx="${ex+72}" cy="${ey-5}" r="42" fill="#fffaf0" stroke="${INK}" stroke-width="12"/>` +
    dot(ex - 72, ey - 5, 11) + dot(ex + 72, ey - 5, 11) + L(`M ${ex-115} ${ey-80} Q ${ex-72} ${ey-108} ${ex-30} ${ey-84}`) + L(`M ${ex+30} ${ey-84} Q ${ex+72} ${ey-108} ${ex+115} ${ey-80}`) +
    mouthOpen(`M ${ex} ${ey+62} C ${ex+45} ${ey+62} ${ex+45} ${ey+150} ${ex} ${ey+150} C ${ex-45} ${ey+150} ${ex-45} ${ey+62} ${ex} ${ey+62} Z`, false),
  shouting: L(`M ${ex-112} ${ey-62} L ${ex-35} ${ey-30}`, 17) + L(`M ${ex+35} ${ey-30} L ${ex+112} ${ey-62}`, 17) +
    L(`M ${ex-95} ${ey-8} L ${ex-45} ${ey-2}`) + L(`M ${ex+45} ${ey-2} L ${ex+95} ${ey-8}`) +
    mouthOpen(`M ${ex-100} ${ey+40} Q ${ex} ${ey+25} ${ex+100} ${ey+40} Q ${ex+85} ${ey+175} ${ex} ${ey+178} Q ${ex-85} ${ey+175} ${ex-100} ${ey+40} Z`, true, true),
  confused: dot(ex - 70, ey) + dot(ex + 70, ey + 4, 12) + L(`M ${ex-115} ${ey-80} Q ${ex-75} ${ey-108} ${ex-35} ${ey-78}`) + L(`M ${ex+35} ${ey-45} L ${ex+112} ${ey-52}`) +
    L(`M ${ex-45} ${ey+95} q 25 -20 50 -5 q 25 15 45 -12`, 11),
};
const headSVG = (face) => headBase() + FACES[face] + hat();
// corpo: túnica índigo em cápsula, faixa de corda, bolsa de pano
const BC = [320, 790], BW = 190, BH = 250;
const body = () => `
 <clipPath id="bc"><ellipse cx="${BC[0]}" cy="${BC[1]}" rx="${BW}" ry="${BH}"/></clipPath>
 <g clip-path="url(#bc)">
  <ellipse cx="${BC[0]}" cy="${BC[1]}" rx="${BW}" ry="${BH}" fill="#2f4f86"/>
  <ellipse cx="${BC[0]-40}" cy="${BC[1]-20}" rx="${BW}" ry="${BH}" fill="#4570b4"/>
  <rect x="0" y="${BC[1]+150}" width="${W}" height="200" fill="#3b2f3f"/>
  <path d="M ${BC[0]-170} ${BC[1]-170} L ${BC[0]+170} ${BC[1]+170}" stroke="#a9773f" stroke-width="34"/>
  <path d="M ${BC[0]-170} ${BC[1]-170} L ${BC[0]+170} ${BC[1]+170}" stroke="${INK}" stroke-width="5" stroke-dasharray="2 22"/>
  <rect x="0" y="${BC[1]+95}" width="${W}" height="34" fill="#d9b25e" stroke="${INK}" stroke-width="8"/>
  <path d="M ${BC[0]-12} ${BC[1]-240} L ${BC[0]-12} ${BC[1]+95}" stroke="${INK}" stroke-width="8"/>
  ${[ -150, -80, -10].map(y => `<circle cx="${BC[0]+14}" cy="${BC[1]+y}" r="9" fill="#e9d9a8" stroke="${INK}" stroke-width="5"/>`).join('')}
 </g>
 <ellipse cx="${BC[0]}" cy="${BC[1]}" rx="${BW}" ry="${BH}" fill="none" stroke="${INK}" stroke-width="${LW}"/>
 <!-- bolsa -->
 <path d="M ${BC[0]+120} ${BC[1]+140} q 70 -10 90 30 q 10 80 -40 100 q -70 10 -80 -50 Z" fill="#b98a4c" stroke="${INK}" stroke-width="14" stroke-linejoin="round"/>
 <path d="M ${BC[0]+135} ${BC[1]+175} q 40 -10 70 5" fill="none" stroke="${INK}" stroke-width="7"/>`;
const SH = { L: [BC[0]-170, BC[1]-120], R: [BC[0]+170, BC[1]-120] };
const arm = (s, side) => { const x = s[0], y = s[1], d = side === 'L' ? -1 : 1, hx = x + d * 40, hy = y + 300;
  return `<path d="M ${x} ${y} Q ${x + d * 45} ${y + 150} ${hx} ${hy}" fill="none" stroke="${INK}" stroke-width="18" stroke-linecap="round"/>
  <circle cx="${x}" cy="${y}" r="20" fill="#2f4f86" stroke="${INK}" stroke-width="10"/>
  <ellipse cx="${hx}" cy="${hy + 10}" rx="24" ry="28" fill="${INK}"/>`; };
const HIP = { L: [BC[0]-70, BC[1]+220], R: [BC[0]+70, BC[1]+220] };
const FEET = 1290;
const leg = (h, side) => { const x = h[0], d = side === 'L' ? -1 : 1;
  return `<path d="M ${x} ${h[1]} L ${x - d * 4} ${FEET - 22}" stroke="${INK}" stroke-width="18" stroke-linecap="round"/>
  <path d="M ${x - d * 4} ${FEET - 14} L ${x + d * 48} ${FEET - 8}" stroke="${INK}" stroke-width="22" stroke-linecap="round"/>`; };

// ---------- rato ----------
const RW = 520, RH = 300;
const ratBody = (tail) => `
 ${tail ? `<path d="M 120 205 C 40 200 20 120 60 90 C 90 70 70 40 30 50" fill="none" stroke="${INK}" stroke-width="26" stroke-linecap="round"/>
 <path d="M 120 205 C 40 200 20 120 60 90 C 90 70 70 40 30 50" fill="none" stroke="#e8a7a7" stroke-width="12" stroke-linecap="round"/>`
   : `<circle cx="118" cy="200" r="13" fill="#e8a7a7" stroke="${INK}" stroke-width="7"/><path d="M 92 170 l -16 -12 M 88 196 l -22 0 M 94 222 l -16 12" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`}
 ${[170, 300].map(x => `<path d="M ${x} 250 l -8 36 l 22 0" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}
 <clipPath id="rb"><ellipse cx="240" cy="200" rx="130" ry="72"/></clipPath>
 <g clip-path="url(#rb)"><ellipse cx="240" cy="200" rx="130" ry="72" fill="#6e6676"/><ellipse cx="225" cy="185" rx="130" ry="72" fill="#948ca0"/></g>
 <ellipse cx="240" cy="200" rx="130" ry="72" fill="none" stroke="${INK}" stroke-width="14"/>`;
const ratHead = `
 <circle cx="355" cy="105" r="42" fill="#c9a0b0" stroke="${INK}" stroke-width="13"/>
 <path d="M 300 120 Q 330 70 420 120 Q 470 150 490 168 Q 440 200 360 200 Q 300 195 300 120 Z" fill="#948ca0" stroke="${INK}" stroke-width="14" stroke-linejoin="round"/>
 <circle cx="492" cy="166" r="14" fill="#e07a8a" stroke="${INK}" stroke-width="7"/>
 <circle cx="400" cy="138" r="11" fill="${INK}"/><circle cx="404" cy="134" r="3.5" fill="#fff"/>
 <path d="M 470 180 l 40 10 M 466 186 l 34 22" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;

const docs = {};
const svg = (w, h, inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`;
docs['hero/L_head'] = svg(W, H, headSVG('neutral'));
for (const f of Object.keys(FACES)) docs['hero/F_' + f] = svg(W, H, headSVG(f));
docs['hero/L_body'] = svg(W, H, body());
docs['hero/L_armL'] = svg(W, H, arm(SH.L, 'L')); docs['hero/L_armR'] = svg(W, H, arm(SH.R, 'R'));
docs['hero/L_legL'] = svg(W, H, leg(HIP.L, 'L')); docs['hero/L_legR'] = svg(W, H, leg(HIP.R, 'R'));
docs['hero/source'] = svg(W, H, leg(HIP.L, 'L') + leg(HIP.R, 'R') + arm(SH.L, 'L') + arm(SH.R, 'R') + body() + headSVG('neutral'));
for (const [id, tail] of [['rato', true], ['rato-sem-rabo', false]]) {
  docs[id + '/L_body'] = svg(RW, RH, ratBody(tail)); docs[id + '/L_head'] = svg(RW, RH, ratHead);
}
const meta = { W, H, HC, HR, NECK: [HC[0], HC[1] + HR - 10], HIPC: [BC[0], BC[1] + 200], SH, HIP, FEET, EYES: [[ex - 70, ey], [ex + 70, ey]],
  rat: { RW, RH, NECK: [330, 170], HIPC: [240, 272], FEET: 288 } };
fs.mkdirSync(OUT + '/_svg', { recursive: true });
const b = await chromium.launch(); const p = await b.newPage();
for (const [k, s] of Object.entries(docs)) {
  const [w, h] = k.startsWith('hero') ? [W, H] : [RW, RH];
  await p.setViewportSize({ width: w, height: h });
  await p.setContent(`<html><body style="margin:0;background:transparent">${s}</body></html>`);
  fs.mkdirSync(path.dirname(`${OUT}/_svg/${k}.png`), { recursive: true });
  await p.screenshot({ path: `${OUT}/_svg/${k}.png`, omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
}
await b.close();
fs.writeFileSync(OUT + '/_svg/meta.json', JSON.stringify(meta));
console.log('ok', Object.keys(docs).length);
