// STYLE_GUIDE §2 — personagem 2D (desenho vetorial) dentro do cenário 3D.
// O desenho é escrito como SVG (unidades = cm, pés em y=0, cabeça em cima), convertido em
// geometria vetorial (SVGLoader) — nítido em qualquer zoom e 100% determinístico.
// O plano fica virado para a câmera (billboard vertical); sombra-proxy virada para a luz.
import React, {useMemo, useRef} from 'react';
import * as THREE from 'three';
import {useFrame} from '@react-three/fiber';
import {SVGLoader} from 'three/addons/loaders/SVGLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {makeBlobShadowMaterial} from '../style/materials';

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

export type Expression2D = 'neutro' | 'deboche' | 'feliz' | 'susto' | 'bravo' | 'dormindo' | 'sinistro';
export type Hat2D = 'none' | 'bone' | 'capacete' | 'gorro' | 'laco' | 'touca';

export type Outfit2D = {
	body: string;
	hat: Hat2D;
	hatColor?: string;
	vest?: boolean;
	vestColor?: string;
	/** cabelo (cor) — desenhado por cima da cabeça quando não há chapéu cobrindo */
	hair?: string;
	hairStyle?: 'espetado' | 'lado' | 'franja';
	mustache?: boolean;
	tie?: string;
	belt?: boolean;
	badge?: boolean;
	buttons?: boolean;
	/** cor da pele/cabeça (padrão creme) */
	skin?: string;
};

/** Braço: [ângulo a partir da vertical (graus, + = para fora), dobra do cotovelo (+ = mão sobe/entra)] */
type Arm = [number, number];
/** Perna: [ângulo a partir da vertical (+ = para fora), dobra do joelho] */
type Leg = [number, number];

export type Pose2D = {
	armL: Arm; // braço do lado ESQUERDO da tela
	armR: Arm;
	legL: Leg;
	legR: Leg;
	/** inclinação do corpo (graus, + = para a direita da tela) */
	lean: number;
	headTilt: number;
	/** desloca o corpo para baixo (cm) — sentar */
	drop: number;
	/** pernas escondidas (sentado sob coberta, atrás de móvel) */
	hideLegs?: boolean;
	/** pulinho (cm, para cima) */
	hop?: number;
};

export type PoseName2D = 'stand' | 'wave' | 'shrug' | 'point' | 'pointL' | 'crossArms' | 'drink' | 'push' | 'walk' | 'run' | 'sit' | 'sitBed' | 'armsUp' | 'handsHips' | 'lie';

const BASE: Pose2D = {armL: [10, 8], armR: [10, 8], legL: [4, 0], legR: [4, 0], lean: 0, headTilt: 0, drop: 0};

export const pose2D = (name: PoseName2D, t = 0): Pose2D => {
	switch (name) {
		case 'stand':
			return {...BASE, armL: [9 + Math.sin(t * 2) * 1.5, 8], armR: [9 + Math.sin(t * 2 + 1) * 1.5, 8]};
		case 'wave': {
			const w = Math.sin(t * 10) * 20;
			return {...BASE, armR: [150 + w * 0.2, 25 + w]};
		}
		case 'shrug':
			return {...BASE, armL: [55, 85], armR: [55, 85], headTilt: 6};
		case 'point':
			return {...BASE, armR: [95, 0]};
		case 'pointL':
			return {...BASE, armL: [95, 0]};
		case 'crossArms':
			return {...BASE, armL: [20, 112], armR: [20, 112], headTilt: -4};
		case 'drink':
			return {...BASE, armR: [25, 150], headTilt: -6};
		case 'push':
			return {...BASE, armL: [70, 10], armR: [70, 10], lean: 10, legL: [14, 0], legR: [-6, 0]};
		case 'handsHips':
			return {...BASE, armL: [40, 95], armR: [40, 95]};
		case 'armsUp':
			return {...BASE, armL: [160, 10], armR: [160, 10]};
		case 'walk': {
			const s = Math.sin(t * 7);
			return {...BASE, legL: [4 + s * 10, Math.max(0, s) * 25], legR: [4 - s * 10, Math.max(0, -s) * 25], armL: [10 - s * 12, 15], armR: [10 + s * 12, 15], hop: Math.abs(Math.cos(t * 7)) * 1.2};
		}
		case 'run': {
			const s = Math.sin(t * 13);
			return {...BASE, legL: [6 + s * 22, Math.max(0, s) * 60], legR: [6 - s * 22, Math.max(0, -s) * 60], armL: [25 - s * 25, 70], armR: [25 + s * 25, 70], lean: 6, hop: Math.abs(Math.cos(t * 13)) * 4};
		}
		case 'sit':
			// sentado no chão/cama de frente: corpo desce, pernas abertas para a frente
			return {...BASE, drop: 26, legL: [62, 40], legR: [62, 40], armL: [28, 20], armR: [28, 20]};
		case 'sitBed':
			// sentado na cama com as pernas sob a coberta
			return {...BASE, drop: 30, hideLegs: true, armL: [24, 30], armR: [24, 30]};
		case 'lie':
			return {...BASE, armL: [6, 0], armR: [6, 0], legL: [2, 0], legR: [2, 0]};
	}
};

/* ------------------------------------------------------------------ */
/* Cores                                                               */
/* ------------------------------------------------------------------ */

export const INK = '#1A1414';
export const SKIN = '#F6EEDD';
const SHADE_TO = new THREE.Color('#2A2F4A');
/** Tom de sombra (2º tom do desenho): mistura com azul-escuro. */
export const shadeOf = (hex: string, k = 0.32) => '#' + new THREE.Color(hex).lerp(SHADE_TO, k).getHexString();

/* ------------------------------------------------------------------ */
/* Desenho (SVG em cm; y para baixo; pés em y=0)                       */
/* ------------------------------------------------------------------ */

const R = 17.5; // raio da cabeça (35% de 100 cm)
const HEAD_Y = -82.5;
const SW = 2.2; // contorno
const LIMB = 2.5;
const rad = (d: number) => (d * Math.PI) / 180;
const f = (n: number) => n.toFixed(2);

type DrawOpts = {outfit: Outfit2D; expression: Expression2D; pose: Pose2D; turn: number; light: number; blink: number; mouthOpen: number};

const limbPts = (x: number, y: number, a: number, b: number, side: number, L1: number, L2: number, downSign = 1) => {
	const kx = x + side * Math.sin(rad(a)) * L1;
	const ky = y + downSign * Math.cos(rad(a)) * L1;
	const a2 = a - b;
	const hx = kx + side * Math.sin(rad(a2)) * L2;
	const hy = ky + downSign * Math.cos(rad(a2)) * L2;
	return {kx, ky, hx, hy};
};

/** Meia-lua de sombra dentro de um círculo, no lado oposto à luz. */
const crescent = (cx: number, cy: number, r: number, side: number, fill: string) => {
	const R2 = r * 1.18;
	const s1 = side > 0 ? 1 : 0;
	const s2 = side > 0 ? 0 : 1;
	return `<path d="M${f(cx)} ${f(cy - r)} A${f(r)} ${f(r)} 0 0 ${s1} ${f(cx)} ${f(cy + r)} A${f(R2)} ${f(R2)} 0 0 ${s2} ${f(cx)} ${f(cy - r)} Z" fill="${fill}"/>`;
};

const face = (hx: number, hy: number, tx: number, e: Expression2D, blink: number, mouthOpen: number) => {
	const out: string[] = [];
	const ey = hy - 1;
	const my = hy + 8;
	const mx = hx + tx * 1.1;
	const eyes = [-6.8, 6.8].map((dx) => hx + tx + dx);
	const line = (d: string, w = 2.2) => out.push(`<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`);
	const fill = (d: string, c = INK, stroke = false) => out.push(`<path d="${d}" fill="${c}"${stroke ? ` stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"` : ''}/>`);
	const pupil = (x: number, y: number, rx: number, ry: number) => {
		const k = Math.max(0.12, 1 - blink);
		out.push(`<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry * k)}" fill="${INK}"/>`);
	};
	switch (e) {
		case 'neutro':
			eyes.forEach((x) => pupil(x, ey, 2.3, 3.2));
			eyes.forEach((x, i) => line(`M${f(x - 3.8)} ${f(ey - 7 + (i ? 0.4 : 0))} L${f(x + 3.8)} ${f(ey - 7 + (i ? 0 : 0.4))}`));
			if (mouthOpen > 0.05) fill(`M${f(mx - 4)} ${f(my)} Q${f(mx)} ${f(my + 3 + 5 * mouthOpen)} ${f(mx + 4)} ${f(my)} Z`, '#3B1F22', true);
			else line(`M${f(mx - 4)} ${f(my)} Q${f(mx)} ${f(my + 1)} ${f(mx + 4)} ${f(my)}`);
			break;
		case 'deboche':
			// pálpebra reta (meio fechado) + sobrancelha baixa e reta + boca torta
			eyes.forEach((x) => {
				fill(`M${f(x - 2.8)} ${f(ey - 0.5)} A2.8 2.8 0 0 0 ${f(x + 2.8)} ${f(ey - 0.5)} Z`);
				line(`M${f(x - 4.6)} ${f(ey - 0.8)} L${f(x + 4.6)} ${f(ey - 0.8)}`, 2.4);
				line(`M${f(x - 4.2)} ${f(ey - 5)} L${f(x + 4.2)} ${f(ey - 5)}`, 2.6);
			});
			line(`M${f(mx - 4)} ${f(my + 1)} Q${f(mx + 1)} ${f(my + 1.6)} ${f(mx + 5.5)} ${f(my - 1.6)}`);
			break;
		case 'feliz':
			eyes.forEach((x) => line(`M${f(x - 3.6)} ${f(ey + 1.2)} Q${f(x)} ${f(ey - 4.2)} ${f(x + 3.6)} ${f(ey + 1.2)}`, 2.4));
			eyes.forEach((x, i) => line(`M${f(x - 3.6)} ${f(ey - 8 + (i ? 1 : 0))} Q${f(x)} ${f(ey - 10)} ${f(x + 3.6)} ${f(ey - 8 + (i ? 0 : 1))}`));
			fill(`M${f(mx - 7.5)} ${f(my - 1.5)} L${f(mx + 7.5)} ${f(my - 1.5)} Q${f(mx + 7)} ${f(my + 9 + 2 * mouthOpen)} ${f(mx)} ${f(my + 9 + 2 * mouthOpen)} Q${f(mx - 7)} ${f(my + 9 + 2 * mouthOpen)} ${f(mx - 7.5)} ${f(my - 1.5)} Z`, '#3B1F22', true);
			fill(`M${f(mx - 6.5)} ${f(my - 1.2)} L${f(mx + 6.5)} ${f(my - 1.2)} L${f(mx + 6)} ${f(my + 1.6)} L${f(mx - 6)} ${f(my + 1.6)} Z`, '#FFFFFF');
			break;
		case 'susto':
			eyes.forEach((x) => out.push(`<circle cx="${f(x)}" cy="${f(ey)}" r="4.8" fill="#FFFFFF" stroke="${INK}" stroke-width="1.6"/>`));
			eyes.forEach((x) => out.push(`<circle cx="${f(x + tx * 0.3)}" cy="${f(ey + 0.5)}" r="1.5" fill="${INK}"/>`));
			eyes.forEach((x, i) => line(`M${f(x - 3.8)} ${f(ey - 9 + (i ? 1.5 : 0))} Q${f(x)} ${f(ey - 11.5)} ${f(x + 3.8)} ${f(ey - 9 + (i ? 0 : 1.5))}`));
			out.push(`<ellipse cx="${f(mx)}" cy="${f(my + 1.5)}" rx="${f(2.8 + mouthOpen)}" ry="${f(4 + 1.5 * mouthOpen)}" fill="#3B1F22" stroke="${INK}" stroke-width="1.5"/>`);
			break;
		case 'bravo':
			eyes.forEach((x) => pupil(x, ey + 0.5, 2.3, 2.9));
			eyes.forEach((x, i) => {
				const inner = i === 0 ? 1 : -1; // ponta de dentro para baixo
				line(`M${f(x - 4.4 * inner)} ${f(ey - 8.6)} L${f(x + 4.4 * inner)} ${f(ey - 4.6)}`, 2.8);
			});
			line(`M${f(mx - 5)} ${f(my + 2.2)} Q${f(mx)} ${f(my - 2.6)} ${f(mx + 5)} ${f(my + 2.2)}`, 2.4);
			break;
		case 'dormindo':
			eyes.forEach((x) => line(`M${f(x - 3.6)} ${f(ey)} Q${f(x)} ${f(ey + 3.4)} ${f(x + 3.6)} ${f(ey)}`, 2.3));
			out.push(`<ellipse cx="${f(mx)}" cy="${f(my + 1)}" rx="1.8" ry="${f(1.6 + 1.2 * mouthOpen)}" fill="#3B1F22"/>`);
			break;
		case 'sinistro':
			// pálpebras pesadas, pupila pequena clara, sobrancelha em V, sorriso largo com dentes
			eyes.forEach((x, i) => {
				fill(`M${f(x - 3.4)} ${f(ey - 0.4)} A3.4 3.1 0 0 0 ${f(x + 3.4)} ${f(ey - 0.4)} Z`);
				out.push(`<circle cx="${f(x + (i ? -0.8 : 0.8))}" cy="${f(ey + 1.0)}" r="1.0" fill="#F2D27A"/>`);
				line(`M${f(x - 4.8)} ${f(ey - 0.7)} L${f(x + 4.8)} ${f(ey - 0.7)}`, 2.4);
				const inner = i === 0 ? 1 : -1;
				line(`M${f(x - 4.6 * inner)} ${f(ey - 7.6)} L${f(x + 4.4 * inner)} ${f(ey - 3.8)}`, 2.6);
			});
			{
				const w = 10;
				const top = my - 3;
				const bot = my + 6;
				fill(`M${f(mx - w)} ${f(top - 1.5)} Q${f(mx)} ${f(top + 3)} ${f(mx + w)} ${f(top - 1.5)} Q${f(mx + 6)} ${f(bot + 1)} ${f(mx)} ${f(bot + 1)} Q${f(mx - 6)} ${f(bot + 1)} ${f(mx - w)} ${f(top - 1.5)} Z`, '#FFFFFF', true);
				for (let k = -3; k <= 3; k++) line(`M${f(mx + k * 2.6)} ${f(top + 1.4 - Math.abs(k) * 0.4)} L${f(mx + k * 2.6)} ${f(bot - Math.abs(k) * 1.1)}`, 0.9);
				line(`M${f(mx - w + 1.5)} ${f(my + 1.6)} Q${f(mx)} ${f(my + 3.6)} ${f(mx + w - 1.5)} ${f(my + 1.6)}`, 0.9);
			}
			break;
	}
	return out.join('');
};

const hatSvg = (o: Outfit2D, hx: number, hy: number, tx: number, front: boolean) => {
	const c = o.hatColor ?? o.body;
	const d = shadeOf(c, 0.25);
	const st = `stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"`;
	switch (o.hat) {
		case 'none':
			return '';
		case 'bone':
			return front
				? `<path d="M${f(hx - R * 0.99)} ${f(hy - 5)} A${R} ${R} 0 0 1 ${f(hx + R * 0.99)} ${f(hy - 5)} Z" fill="${c}" ${st}/>` +
						`<path d="M${f(hx + tx - R * 0.95)} ${f(hy - 5)} Q${f(hx + tx)} ${f(hy - 0.5)} ${f(hx + tx + R * 0.95)} ${f(hy - 5)} Q${f(hx + tx)} ${f(hy - 8.5)} ${f(hx + tx - R * 0.95)} ${f(hy - 5)} Z" fill="${d}" ${st}/>` +
						`<circle cx="${f(hx + tx * 0.4)}" cy="${f(hy - R - 0.5)}" r="1.8" fill="${c}" ${st}/>`
				: '';
		case 'capacete':
			return front
				? `<path d="M${f(hx - R * 1.06)} ${f(hy - 3)} A${f(R * 1.06)} ${f(R * 1.1)} 0 0 1 ${f(hx + R * 1.06)} ${f(hy - 3)} Z" fill="${c}" ${st}/>` +
						`<path d="M${f(hx - R * 1.32)} ${f(hy - 3)} L${f(hx + R * 1.32)} ${f(hy - 3)} L${f(hx + R * 1.25)} ${f(hy - 0.5)} L${f(hx - R * 1.25)} ${f(hy - 0.5)} Z" fill="${d}" ${st}/>` +
						`<path d="M${f(hx - 2)} ${f(hy - R * 1.1 - 2)} L${f(hx + 2)} ${f(hy - R * 1.1 - 2)} L${f(hx + 2.4)} ${f(hy - 3)} L${f(hx - 2.4)} ${f(hy - 3)} Z" fill="${d}" ${st}/>`
				: '';
		case 'gorro':
			return front
				? `<path d="M${f(hx - R)} ${f(hy - 6)} A${R} ${f(R * 1.05)} 0 0 1 ${f(hx + R)} ${f(hy - 6)} Z" fill="${c}" ${st}/>` +
						`<rect x="${f(hx - R * 1.03)}" y="${f(hy - 9)}" width="${f(R * 2.06)}" height="5.5" rx="2.5" fill="${d}" ${st}/>` +
						`<circle cx="${f(hx)}" cy="${f(hy - R - 6)}" r="4.2" fill="#F4F0E8" ${st}/>`
				: '';
		case 'laco': {
			if (!front) return '';
			const bx = hx + R * 0.55;
			const by = hy - R * 0.82;
			return (
				`<path d="M${f(bx)} ${f(by)} L${f(bx - 10)} ${f(by - 7)} Q${f(bx - 13)} ${f(by)} ${f(bx - 10)} ${f(by + 7)} Z" fill="${c}" ${st}/>` +
				`<path d="M${f(bx)} ${f(by)} L${f(bx + 10)} ${f(by - 7)} Q${f(bx + 13)} ${f(by)} ${f(bx + 10)} ${f(by + 7)} Z" fill="${c}" ${st}/>` +
				`<circle cx="${f(bx)}" cy="${f(by)}" r="3" fill="${d}" ${st}/>`
			);
		}
		case 'touca':
			return front
				? `<path d="M${f(hx - R * 0.98)} ${f(hy - 7)} Q${f(hx - 6)} ${f(hy - R - 14)} ${f(hx + R + 10)} ${f(hy - R - 4)} Q${f(hx + 6)} ${f(hy - R + 2)} ${f(hx + R * 0.98)} ${f(hy - 7)} Z" fill="${c}" ${st}/>` +
						`<rect x="${f(hx - R * 1.02)}" y="${f(hy - 10)}" width="${f(R * 2.04)}" height="5.5" rx="2.6" fill="#F4F0E8" ${st}/>` +
						`<circle cx="${f(hx + R + 10)}" cy="${f(hy - R - 4)}" r="3.6" fill="#F4F0E8" ${st}/>`
				: '';
	}
};

const hairSvg = (o: Outfit2D, hx: number, hy: number, tx: number) => {
	if (!o.hair) return '';
	const c = o.hair;
	const st = `stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"`;
	if (o.hairStyle === 'espetado') {
		const pts: string[] = [];
		const n = 7;
		for (let i = 0; i <= n; i++) {
			const a = Math.PI + (i / n) * Math.PI;
			const rr = i % 2 ? R + 7 : R + 1;
			pts.push(`${f(hx + tx * 0.3 + Math.cos(a) * rr)} ${f(hy - 3 + Math.sin(a) * rr * 0.95)}`);
		}
		return `<path d="M${f(hx - R)} ${f(hy - 2)} L${pts.join(' L')} L${f(hx + R)} ${f(hy - 2)} Q${f(hx + 6)} ${f(hy - 12)} ${f(hx - 4)} ${f(hy - 9)} Q${f(hx - 12)} ${f(hy - 7)} ${f(hx - R)} ${f(hy - 2)} Z" fill="${c}" ${st}/>`;
	}
	if (o.hairStyle === 'franja')
		return `<path d="M${f(hx - R * 1.04)} ${f(hy + 2)} A${f(R * 1.04)} ${f(R * 1.06)} 0 0 1 ${f(hx + R * 1.04)} ${f(hy + 2)} L${f(hx + R * 0.9)} ${f(hy - 6)} Q${f(hx + tx)} ${f(hy - 4)} ${f(hx - R * 0.9)} ${f(hy - 7)} Z" fill="${c}" ${st}/>`;
	// 'lado' (repartido, grisalho etc.)
	return `<path d="M${f(hx - R * 1.02)} ${f(hy - 1)} A${f(R * 1.02)} ${f(R * 1.04)} 0 0 1 ${f(hx + R * 1.02)} ${f(hy - 1)} Q${f(hx + 8)} ${f(hy - 13)} ${f(hx - 2 + tx)} ${f(hy - 10)} Q${f(hx - 10)} ${f(hy - 8)} ${f(hx - R * 1.02)} ${f(hy - 1)} Z" fill="${c}" ${st}/>`;
};

/** Monta o SVG do personagem. Exportado para testes/thumbnail. */
export const drawCharacterSvg = ({outfit: o, expression, pose: p, turn, light, blink, mouthOpen}: DrawOpts) => {
	const tx = turn * 5;
	const skin = o.skin ?? '#F6EEDD';
	const body = o.body;
	const dy = p.drop - (p.hop ?? 0);
	const parts: string[] = [];
	const st = `stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"`;
	const strokeOnly = (d: string) => `<path d="${d}" fill="none" ${st}/>`;
	const limb = (pts: number[][]) => `<polyline points="${pts.map((q) => q.map(f).join(',')).join(' ')}" fill="none" stroke="${INK}" stroke-width="${LIMB}" stroke-linecap="round" stroke-linejoin="round"/>`;

	// Pernas (do quadril, que desce com `drop`)
	const hipY = -31 + dy;
	if (!p.hideLegs) {
		([[-5, -1, p.legL], [5, 1, p.legR]] as [number, number, Leg][]).forEach(([x, side, [a, k]]) => {
			const q = limbPts(x, hipY, a, -k, side, 15, 15);
			parts.push(limb([[x, hipY], [q.kx, q.ky], [q.hx, q.hy]]));
			parts.push(`<ellipse cx="${f(q.hx + side * 1.8)}" cy="${f(q.hy - 1.2)}" rx="4.6" ry="2.5" fill="${INK}"/>`);
		});
	}

	// Corpo (cápsula) — fill, meia-lua de sombra, contorno
	const lean = p.lean;
	const bTop = -67 + dy;
	const bBot = -29 + dy;
	const bw = 13;
	const capsule = `M${f(-bw)} ${f(bTop + bw)} A${bw} ${bw} 0 0 1 ${f(bw)} ${f(bTop + bw)} L${f(bw)} ${f(bBot - bw)} A${bw} ${bw} 0 0 1 ${f(-bw)} ${f(bBot - bw)} Z`;
	const g0 = `<g transform="rotate(${f(lean)} 0 ${f(hipY)})">`;
	parts.push(g0);
	parts.push(`<path d="${capsule}" fill="${body}"/>`);
	// sombra do corpo: faixa no lado oposto à luz
	{
		const s = -light;
		const x0 = s * bw;
		const x1 = s * (bw - 5.5);
		parts.push(`<path d="M${f(x1)} ${f(bTop + bw)} Q${f(x1 - s * 1)} ${f((bTop + bBot) / 2)} ${f(x1)} ${f(bBot - bw)} L${f(x1)} ${f(bBot - bw * 0.35)} Q${f(s * bw * 0.6)} ${f(bBot - 1)} ${f(s * 2)} ${f(bBot)} L${f(x0)} ${f(bBot - bw)} L${f(x0)} ${f(bTop + bw)} Q${f(s * bw * 0.9)} ${f(bTop + 2)} ${f(s * 3)} ${f(bTop)} Q${f(x1)} ${f(bTop + 3)} ${f(x1)} ${f(bTop + bw)} Z" fill="${shadeOf(body)}"/>`);
	}
	if (o.vest) {
		const vc = o.vestColor ?? '#C8F02A';
		parts.push(`<path d="M${f(-bw + 0.5)} ${f(bTop + 9)} L${f(-4 + tx * 0.4)} ${f(bTop + 3)} L${f(-4 + tx * 0.4)} ${f(bBot - 4)} L${f(-bw + 1)} ${f(bBot - 9)} Z" fill="${vc}"/>`);
		parts.push(`<path d="M${f(bw - 0.5)} ${f(bTop + 9)} L${f(4 + tx * 0.4)} ${f(bTop + 3)} L${f(4 + tx * 0.4)} ${f(bBot - 4)} L${f(bw - 1)} ${f(bBot - 9)} Z" fill="${vc}"/>`);
		parts.push(`<rect x="${f(-bw + 0.8)}" y="${f(bBot - 17)}" width="${f(bw * 2 - 1.6)}" height="2.6" fill="#E4E8EC"/>`);
	}
	if (o.tie) {
		const cx = tx * 0.5;
		parts.push(`<path d="M${f(cx - 4)} ${f(bTop + 1.5)} L${f(cx)} ${f(bTop + 6)} L${f(cx + 4)} ${f(bTop + 1.5)} Z" fill="#FFFFFF" stroke="${INK}" stroke-width="1.2"/>`);
		parts.push(`<path d="M${f(cx - 1.6)} ${f(bTop + 5)} L${f(cx + 1.6)} ${f(bTop + 5)} L${f(cx + 2.6)} ${f(bTop + 21)} L${f(cx)} ${f(bTop + 25)} L${f(cx - 2.6)} ${f(bTop + 21)} Z" fill="${o.tie}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`);
	}
	if (o.buttons) [0, 1, 2].forEach((i) => parts.push(`<circle cx="${f(tx * 0.5 + (o.tie ? 4.5 : 0))}" cy="${f(bTop + 12 + i * 7)}" r="1" fill="${INK}"/>`));
	if (o.belt) {
		parts.push(`<rect x="${f(-bw + 0.6)}" y="${f(bBot - 9.5)}" width="${f(bw * 2 - 1.2)}" height="3.2" fill="${INK}"/>`);
		parts.push(`<rect x="${f(tx * 0.5 - 2)}" y="${f(bBot - 10)}" width="4" height="4.2" fill="#E2B53C" stroke="${INK}" stroke-width="0.8"/>`);
	}
	if (o.badge) parts.push(`<path d="M${f(-6 + tx * 0.4)} ${f(bTop + 8)} l1.2 2.6 2.8 0.3 -2.1 1.9 0.6 2.8 -2.5 -1.4 -2.5 1.4 0.6 -2.8 -2.1 -1.9 2.8 -0.3 Z" fill="#E2B53C" stroke="${INK}" stroke-width="0.6"/>`);
	parts.push(strokeOnly(capsule));

	// Braços (sobre o corpo)
	const shY = -58 + dy;
	([[-10, -1, p.armL], [10, 1, p.armR]] as [number, number, Arm][]).forEach(([x, side, [a, b]]) => {
		const q = limbPts(x, shY, a, b, side, 13.5, 13);
		parts.push(limb([[x, shY], [q.kx, q.ky], [q.hx, q.hy]]));
		parts.push(`<circle cx="${f(q.hx)}" cy="${f(q.hy)}" r="2.5" fill="${INK}"/>`);
	});

	// Cabeça
	const hx = 0;
	const hy = HEAD_Y + dy;
	parts.push(`<g transform="rotate(${f(p.headTilt)} ${f(hx)} ${f(hy + R)})">`);
	parts.push(`<circle cx="${hx}" cy="${f(hy)}" r="${R}" fill="${skin}"/>`);
	parts.push(crescent(hx, hy, R, -light, shadeOf(skin, 0.16)));
	parts.push(`<circle cx="${hx}" cy="${f(hy)}" r="${R}" fill="none" ${st}/>`);
	parts.push(hairSvg(o, hx, hy, tx));
	parts.push(face(hx, hy, tx, expression, blink, mouthOpen));
	if (o.mustache)
		parts.push(`<path d="M${f(hx + tx * 1.1)} ${f(hy + 5)} Q${f(hx + tx * 1.1 - 4)} ${f(hy + 3)} ${f(hx + tx * 1.1 - 7.5)} ${f(hy + 6.5)} Q${f(hx + tx * 1.1 - 3)} ${f(hy + 7.5)} ${f(hx + tx * 1.1)} ${f(hy + 6)} Q${f(hx + tx * 1.1 + 3)} ${f(hy + 7.5)} ${f(hx + tx * 1.1 + 7.5)} ${f(hy + 6.5)} Q${f(hx + tx * 1.1 + 4)} ${f(hy + 3)} ${f(hx + tx * 1.1)} ${f(hy + 5)} Z" fill="${INK}"/>`);
	parts.push(hatSvg(o, hx, hy, tx, true));
	parts.push(`</g>`);
	parts.push(`</g>`);
	return `<svg xmlns="http://www.w3.org/2000/svg">${parts.join('')}</svg>`;
};

/* ------------------------------------------------------------------ */
/* SVG → geometria vetorial (cores por vértice, camadas em z)          */
/* ------------------------------------------------------------------ */

const loader = new SVGLoader();
const LAYER = 0.04; // cm entre camadas (vira 0.4 mm)

const svgToGeometry = (svg: string) => {
	const data = loader.parse(svg);
	const geos: THREE.BufferGeometry[] = [];
	let z = 0;
	const tmp = new THREE.Color();
	const push = (g: THREE.BufferGeometry, color: string) => {
		const pos = g.getAttribute('position');
		g.translate(0, 0, z);
		z += LAYER;
		tmp.setStyle(color);
		const cols = new Float32Array(pos.count * 3);
		for (let i = 0; i < pos.count; i++) cols.set([tmp.r, tmp.g, tmp.b], i * 3);
		g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
		if (g.index) g = g.toNonIndexed();
		for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'color') g.deleteAttribute(k);
		geos.push(g);
	};
	for (const path of data.paths) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const style = (path.userData?.style ?? {}) as any;
		if (style.fill && style.fill !== 'none') {
			const shapes = SVGLoader.createShapes(path);
			if (shapes.length) push(new THREE.ShapeGeometry(shapes, 10), style.fill);
		}
		if (style.stroke && style.stroke !== 'none') {
			for (const sub of path.subPaths) {
				const g = SVGLoader.pointsToStroke(sub.getPoints(24), style);
				if (g) push(g, style.stroke);
			}
		}
	}
	const merged = mergeGeometries(geos, false)!;
	// cm → m e y para cima
	merged.scale(0.01, -0.01, 0.01);
	return merged;
};

const cache = new Map<string, THREE.BufferGeometry>();
const geometryFor = (svg: string) => {
	let g = cache.get(svg);
	if (!g) {
		g = svgToGeometry(svg);
		if (cache.size > 400) cache.clear();
		cache.set(svg, g);
	}
	return g;
};

/* ------------------------------------------------------------------ */
/* Componente                                                          */
/* ------------------------------------------------------------------ */

export type Character2DProps = {
	outfit: Outfit2D;
	expression?: Expression2D;
	pose?: PoseName2D | Pose2D;
	t?: number;
	/** -1..1: vira o rosto para a esquerda/direita da tela (3/4 desenhado) */
	turn?: number;
	/** de que lado da TELA vem a luz: -1 esquerda, 1 direita (sombra do desenho vai para o outro lado) */
	light?: number;
	/** cor da luz ambiente que tinge o desenho (integração com a cena) */
	tint?: string;
	blink?: number;
	mouthOpen?: number;
	/** espelha o desenho (olhar para o outro lado) */
	flip?: boolean;
	/** gira o desenho no próprio plano (graus) — ex.: deitado de lado = ±90 */
	roll?: number;
	/** deitado plano (para planos aéreos): desenho deitado no plano XZ, cabeça para -Z */
	flat?: boolean;
	/** guinada (graus) da sombra-proxy: virada para o sol. undefined = sem sombra projetada */
	shadowYaw?: number;
	/** elipse de sombra no chão (padrão: sim, exceto deitado) */
	groundShadow?: boolean;
	scale?: number;
	position?: [number, number, number];
};

export const Character2D: React.FC<Character2DProps> = ({
	outfit,
	expression = 'neutro',
	pose = 'stand',
	t = 0,
	turn = 0,
	light = -1,
	tint = '#FFFFFF',
	blink = 0,
	mouthOpen = 0,
	flip = false,
	roll = 0,
	flat = false,
	shadowYaw,
	groundShadow,
	scale = 1,
	position = [0, 0, 0],
}) => {
	const p = typeof pose === 'string' ? pose2D(pose, t) : pose;
	const q = (n: number) => Math.round(n * 20) / 20;
	const svg = drawCharacterSvg({outfit, expression, pose: p, turn: q(turn), light: flip ? -light : light, blink: q(blink), mouthOpen: q(mouthOpen)});
	const geometry = geometryFor(svg);
	const material = useMemo(() => new THREE.MeshBasicMaterial({vertexColors: true, side: THREE.DoubleSide, toneMapped: true}), []);
	material.color.set(tint);
	const proxyMat = useMemo(() => new THREE.MeshBasicMaterial({colorWrite: false, depthWrite: false, side: THREE.DoubleSide}), []);
	const billboard = useRef<THREE.Group>(null);
	const world = useMemo(() => new THREE.Vector3(), []);
	useFrame(({camera}) => {
		if (!billboard.current || flat) return;
		billboard.current.getWorldPosition(world);
		billboard.current.rotation.y = Math.atan2(camera.position.x - world.x, camera.position.z - world.z);
	});
	const sx = flip ? -1 : 1;
	const showBlob = groundShadow ?? (!flat && Math.abs(roll) < 30);
	return (
		<group position={position} scale={scale}>
			{showBlob && (
				<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]} scale={[0.5, 0.26, 1]} material={makeBlobShadowMaterial()}>
					<planeGeometry />
				</mesh>
			)}
			{flat ? (
				<group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
					<mesh geometry={geometry} material={material} scale={[sx, 1, 1]} rotation={[0, 0, THREE.MathUtils.degToRad(roll)]} position={[0, -0.5, 0]} />
				</group>
			) : (
				<group ref={billboard}>
					<mesh geometry={geometry} material={material} scale={[sx, 1, 1]} rotation={[0, 0, THREE.MathUtils.degToRad(roll)]} />
				</group>
			)}
			{shadowYaw !== undefined && !flat && (
				<mesh geometry={geometry} material={proxyMat} rotation={[0, THREE.MathUtils.degToRad(shadowYaw), THREE.MathUtils.degToRad(roll)]} castShadow />
			)}
		</group>
	);
};
