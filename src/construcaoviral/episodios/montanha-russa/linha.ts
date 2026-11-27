// "Parabéns! Você construiu uma montanha-russa" — trilhos, percursos (física), estado por segundo, rebobinares e câmera.
// Tempos = narração aprovada (viral-video-engine/projects/montanha-russa/03-narracao/frases.json).
import * as THREE from 'three';
import {CamKey, k, on, Rewind, V3, win} from '../../kit/tempo';
import {criaTrilho, quadro, simula, Trilho, uOnde} from '../../kit/Trilho';

export const DURACAO = 148.72;

export const REWINDS: Rewind[] = [
	{at: 7.4, dur: 0.8, to: 2.3}, // carrinho voou
	{at: 51.8, dur: 0.7, to: 48.9}, // corrente arrebentou, voltou de ré
	{at: 119.0, dur: 0.7, to: 116.0}, // carrinhos bateram
];

/* --------------------------------------- trilhos --------------------------------------- */
const PA: V3[] = [
	[-18, 1.5, 0],
	[-9, 1.5, 0],
	[-1, 1.6, 0],
	[3, 4.5, 0],
	[19, 28.5, 0],
	[22.5, 30.2, 0],
	[25, 30.3, 0],
	[27.5, 28, 0],
	[31.5, 8, 0],
	[34, 2.4, 0],
	[37.5, 1.8, -1.2],
	[40.5, 2.0, -5],
	[40, 2.2, -9.5],
	[36.5, 2.2, -12.8],
	[31, 2.2, -14],
	[24, 2.2, -14],
	[16, 2.2, -14],
];
const bancosA = (s: number) => PA.map((_, i) => [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -22, -50, -50, -35, -10, 0, 0][i] * s);
const cacheA = new Map<number, Trilho>();
/** Trilho principal com a curva inclinada `s` (0 = reta no chão, 1 = deitada 50°). */
export const trilhoA = (s: number) => {
	const key = Math.round(s * 20) / 20;
	if (!cacheA.has(key)) cacheA.set(key, criaTrilho(PA, bancosA(key), 600));
	return cacheA.get(key)!;
};
export const A0 = trilhoA(0);

const ZA = -34;
const ZB = -35.6;
const CIRC: [number, number][] = [
	[11.24, 3.36],
	[13, 7.6],
	[11.24, 11.84],
	[7, 13.6],
	[2.76, 11.84],
	[1, 7.6],
	[2.76, 3.36],
];
const GOTA: [number, number][] = [
	[13.2, 4.6],
	[12.6, 10.2],
	[9.7, 15.4],
	[7, 16.8],
	[4.3, 15.4],
	[1.4, 10.2],
	[0.8, 4.6],
];
const cacheB = new Map<number, Trilho>();
/** Trilho do loop: forma `g` (0 = redondo, 1 = gota). */
export const trilhoB = (g: number) => {
	const key = Math.round(g * 20) / 20;
	if (!cacheB.has(key)) {
		const loop = CIRC.map(([x, y], i) => {
			const [x2, y2] = GOTA[i];
			const z = ZA + ((i + 1) / (CIRC.length + 1)) * (ZB - ZA);
			return [x + (x2 - x) * key, y + (y2 - y) * key, z] as V3;
		});
		const pts: V3[] = [[-30, 1.6, ZA], [-14, 1.6, ZA], [-2, 1.6, ZA], [7, 1.6, ZA], ...loop, [7, 1.6, ZB], [16, 1.6, ZB], [30, 1.6, ZB]];
		cacheB.set(key, criaTrilho(pts, undefined, 700));
	}
	return cacheB.get(key)!;
};
export const B0 = trilhoB(0);

export const ZC = 16;
/** Trilho final (anda para −x): freio magnético x 2..14, freio de bloco x −10, estação x −26..−16. */
export const C = criaTrilho(
	[
		[34, 1.4, ZC],
		[20, 1.4, ZC],
		[6, 1.4, ZC],
		[-8, 1.4, ZC],
		[-20, 1.4, ZC],
		[-34, 1.4, ZC],
	],
	undefined,
	400,
);
export const uX = (tr: Trilho, x: number) => uOnde(tr, (p) => p.x <= x); // para o trilho C (x decrescente)

/* -------------------------------------- pontos de A -------------------------------------- */
export const U = {
	estacao: uOnde(A0, (p) => p.x >= -9),
	baseSubida: uOnde(A0, (p) => p.x >= -0.5),
	topo: uOnde(A0, (p) => p.x >= 24.8),
	curva: uOnde(A0, (p) => p.z < -0.9),
	curvaMeio: uOnde(A0, (p) => p.z < -6),
	curvaFim: uOnde(A0, (p) => p.x < 30 && p.z < -13.6, 0.6),
};
const subida = (f: number) => U.baseSubida + (uOnde(A0, (p) => p.y >= 29.6) - U.baseSubida) * f;

// queda do topo (física)
const queda = simula(A0, U.topo, 0.8, 10);
let tauCurva = 0;
for (let t = 0; t < 10; t += 1 / 240)
	if (queda.u(t) >= U.curva) {
		tauCurva = t;
		break;
	}
const SOLTA1 = Math.max(1.6, 5.75 - tauCurva); // gancho
const SOLTA2 = 8.25; // porquê
const SOLTA3 = 138.35; // braços para cima

// ré quando a corrente arrebenta
const re = simula(A0, subida(0.9), 0, 6, 0.01);

// loops
const uAntesLoop = (tr: Trilho) => uOnde(tr, (p) => p.x >= -2);
const uFundoLoop = uOnde(B0, (p) => p.x >= 9 && p.y > 1.9);
const loopRedondo = simula(B0, uAntesLoop(B0), 19.5, 6, 0.01);
const B1 = trilhoB(1);
const loopGota = simula(B1, uAntesLoop(B1), 17.5, 8, 0.01);
let tauTopoGota = 0;
{
	let best = -1;
	for (let t = 0; t < 6; t += 1 / 240) {
		const y = quadro(B1, loopGota.u(t)).pos.y;
		if (y > best) {
			best = y;
			tauTopoGota = t;
		}
	}
}
const SOLTA_GOTA = 83.0 - tauTopoGota;
export const uTopoGota = loopGota.u(tauTopoGota);

/* ------------------------------------------ estado ------------------------------------------ */
export type CarroEst = {trilho: 'A' | 'B' | 'C'; u: number; voo?: {pos: THREE.Vector3; rot: number}; vis: boolean};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export const carro = (t: number): CarroEst => {
	// gancho: solta do topo, voa na 1ª curva e cai no lago
	if (t < 7.4) {
		if (t < SOLTA1) return {trilho: 'A', u: U.topo, vis: true};
		const dt = t - SOLTA1;
		if (dt < tauCurva) return {trilho: 'A', u: queda.u(dt), vis: true};
		const q = quadro(A0, U.curva);
		const v = queda.v(tauCurva);
		const f = dt - tauCurva;
		const pos = q.pos.clone().addScaledVector(q.t, v * f);
		pos.y += 3.5 * f - 4.9 * f * f;
		if (pos.y < -0.6) pos.y = -0.6;
		return {trilho: 'A', u: U.curva, voo: {pos, rot: f * 2.2}, vis: true};
	}
	if (t < 14.5) {
		if (t < SOLTA2) return {trilho: 'A', u: U.topo, vis: true};
		return {trilho: 'A', u: Math.min(queda.u(t - SOLTA2), U.curva), vis: true};
	}
	if (t < 21.3) return {trilho: 'A', u: t < 18.9 ? U.curva : U.curva + (U.curvaFim - U.curva) * k(t, 18.9, 21.2), vis: true};
	if (t < 24.4) return {trilho: 'B', u: uTopoRedondo, vis: true};
	if (t < 38.0) {
		if (t < 28.45) return {trilho: 'A', u: U.curva + (U.curvaFim - U.curva) * clamp01((t - 24.6) / 3.8), vis: true};
		if (t < 32.7) return {trilho: 'A', u: U.curva - 0.012, vis: true};
		if (t < 36.0) return {trilho: 'A', u: U.curva - 0.012 + (U.curvaFim - U.curva + 0.012) * clamp01((t - 32.8) / 3.1), vis: true};
		return {trilho: 'A', u: U.curvaMeio, vis: true};
	}
	if (t < 66.5) {
		if (t < 42.6) return {trilho: 'A', u: U.baseSubida - 0.004, vis: true};
		if (t < 49.22) return {trilho: 'A', u: subida(0.82 * k(t, 42.6, 46.0) + 0.08 * k(t, 46.3, 49.0)), vis: true};
		if (t < 52.1) return {trilho: 'A', u: re.u(t - 49.22) - (0), vis: true};
		if (t < 58.9) return {trilho: 'A', u: subida(0.35 + 0.12 * k(t, 52.4, 58.8)), vis: true};
		if (t < 62.9) return {trilho: 'A', u: subida(0.47 - 0.012 * k(t, 58.95, 60.3)), vis: true};
		return {trilho: 'A', u: subida(0.458 + 0.2 * k(t, 63.0, 66.5)), vis: true};
	}
	if (t < 89.0) {
		if (t < 69.4) return {trilho: 'B', u: 0.02 + (uAntesLoop(B0) - 0.02) * k(t, 66.6, 69.2), vis: true};
		if (t < 72.5) return {trilho: 'B', u: loopRedondo.u(t - 69.4), vis: true};
		if (t < 75.55) return {trilho: 'B', u: uFundoLoop, vis: true};
		if (t < SOLTA_GOTA) return {trilho: 'B', u: uAntesLoop(B1), vis: true};
		if (t < 84.6) return {trilho: 'B', u: loopGota.u(t - SOLTA_GOTA), vis: true};
		return {trilho: 'B', u: loopGota.u(84.6 - SOLTA_GOTA) + 0.0, vis: true};
	}
	if (t < 98.4) return {trilho: 'B', u: uTopoGota, vis: true};
	if (t < 113.2) {
		const u0 = uX(C, 30);
		const u1 = uX(C, 17);
		const u2 = uX(C, 0);
		if (t < 101.7) return {trilho: 'C', u: u0 + (u1 - u0) * clamp01((t - 98.6) / 3.1), vis: true};
		if (t < 106.3) return {trilho: 'C', u: u1, vis: true};
		const x = clamp01((t - 106.3) / 5.0);
		return {trilho: 'C', u: u1 + (u2 - u1) * (1 - (1 - x) * (1 - x)), vis: true};
	}
	// blocos: carro B (que chega); o carro A (estação) é `carro2`
	if (t < 132.6) {
		const xs: number = (() => {
			if (t < 117.4) return 8 - 16 * k(t, 113.2, 117.2);
			if (t < 119.0) return -8 - 9.5 * clamp01((t - 117.4) / 1.34);
			if (t < 123.9) return 8 - 15 * k(t, 119.7, 123.8);
			if (t < 129.2) return -7 - 3 * k(t, 123.9, 124.3);
			return -10 - 11 * k(t, 129.4, 132.2);
		})();
		return {trilho: 'C', u: uX(C, xs), vis: true};
	}
	if (t < 138.3) return {trilho: 'C', u: uX(C, -21), vis: true};
	if (t < SOLTA3) return {trilho: 'A', u: U.topo, vis: true};
	return {trilho: 'A', u: Math.min(queda.u(t - SOLTA3), 0.97), vis: true};
};
const uTopoRedondo = (() => {
	let best = -1;
	let u = 0;
	for (let i = 0; i <= B0.N; i++)
		if (B0.P[i].y > best) {
			best = B0.P[i].y;
			u = B0.U[i];
		}
	return u;
})();

/** Segundo carrinho (cena dos blocos): parado na estação e depois sai. */
export const carro2 = (t: number): CarroEst | null => {
	if (t < 113.2 || t >= 138.3) return null;
	if (t < 129.4) return {trilho: 'C', u: uX(C, -21), vis: true};
	return {trilho: 'C', u: uX(C, -21 - 13 * k(t, 129.4, 131.4)), vis: t < 131.4};
};

export const estado = (t: number) => {
	const c = carro(t);
	return {
		t,
		c,
		c2: carro2(t),
		bancoA: on(t, 24.4, 38.0) ? k(t, 28.9, 32.4) : t >= 38 ? 1 : 0,
		formaB: t >= 75.55 ? k(t, 75.6, 78.4) : 0,
		rodasBaixo: t >= 15.6 ? k(t, 15.6, 16.4) : 0,
		rodasCima: win(t, 17.5, 17.7, 18.6, 18.9),
		rodasLado: win(t, 18.2, 18.4, 18.8, 19.1),
		inclina: on(t, 24.4, 28.6) ? k(t, 25.2, 27.2) : 0, // corpo jogado para fora
		corrente: t >= 41.0 ? k(t, 41.1, 42.4) : 0,
		correnteRompe: on(t, 49.22, 52.5) || on(t, 58.9, 62.9),
		correnteIdade: on(t, 49.22, 52.5) ? t - 49.22 : on(t, 58.9, 62.9) ? t - 58.9 : -1,
		dentes: t >= 53.2 ? k(t, 53.3, 54.6) : 0,
		garra: t >= 55.2 ? k(t, 55.3, 55.8) : 0,
		clac: [56.98, 57.66, 58.02, 60.32, 64.96, 65.54, 65.94].some((x) => t >= x && t < x + 0.12),
		esmaga: on(t, 72.5, 75.55) ? k(t, 72.6, 73.0) : 0,
		fantasma: win(t, 86.1, 86.5, 88.6, 89.0),
		solta: on(t, 89.0, 93.8) ? k(t, 89.6, 91.4) * (1 - k(t, 93.1, 93.8)) : 0,
		barra: t >= 92.4 && t < 113.2 ? k(t, 92.6, 93.6) : t >= 113.2 ? 1 : 0,
		barraTrava: t >= 94.38 && t < 113.2,
		imas: t >= 103.4 ? k(t, 103.5, 104.3) : 0,
		lamina: t >= 104.8 ? k(t, 104.9, 105.6) : 0,
		semEnergia: win(t, 110.6, 110.8, 111.6, 112.0),
		trechos: t >= 119.7 ? k(t, 119.8, 120.6) : 0,
		sinal: t >= 129.4 ? 'verde' : 'vermelho',
		flash: win(t, 133.05, 133.1, 133.3, 133.5),
		fila: on(t, 134.3, 136.1),
		grita: on(t, 136.1, 138.3),
		realce: {
			rodas: win(t, 23.0, 23.2, 24.1, 24.4),
			curva: win(t, 36.9, 37.1, 37.9, 38.1),
			corrente: win(t, 47.4, 47.6, 48.1, 48.4),
			dentes: win(t, 61.4, 61.6, 62.7, 63.0),
			loop: win(t, 85.5, 85.7, 86.1, 86.4),
			barra: win(t, 97.6, 97.8, 98.3, 98.6),
			imas: win(t, 112.3, 112.5, 113.1, 113.3),
			trechos: win(t, 128.2, 128.4, 129.0, 129.3),
		},
	};
};
export type Estado = ReturnType<typeof estado>;

export const trilhoDe = (e: Estado, qual: 'A' | 'B' | 'C') => (qual === 'A' ? trilhoA(e.bancoA) : qual === 'B' ? trilhoB(e.formaB) : C);

/* ------------------------------------------ câmera ------------------------------------------ */
type Seg = NonNullable<CamKey['seg']>;
/** Câmera presa ao carrinho: deslocamento no referencial do carrinho (lado, cima, frente) e mira à frente. */
const presa = (lado: number, cima: number, frente: number, mira = 3, fov = 55): Seg => (T: number) => {
	const e = estado(T);
	const tr = trilhoDe(e, e.c.trilho);
	const q = quadro(tr, e.c.u);
	const base = e.c.voo ? e.c.voo.pos : q.pos;
	const pos = base.clone().addScaledVector(q.side, lado).addScaledVector(q.up, cima).addScaledVector(q.t, frente);
	const look = base.clone().addScaledVector(q.t, mira).addScaledVector(q.up, 0.6);
	return {pos: pos.toArray() as V3, look: look.toArray() as V3, fov};
};
/** Câmera presa ao carrinho mirando um ponto do próprio carrinho (offsets em lado/cima/frente). */
const mira = (pos: V3, alvo: V3, fov = 42): Seg => (T: number) => {
	const e = estado(T);
	const q = quadro(trilhoDe(e, e.c.trilho), e.c.u);
	const L = (o: V3) => q.pos.clone().addScaledVector(q.side, o[0]).addScaledVector(q.up, o[1]).addScaledVector(q.t, o[2]);
	return {pos: L(pos).toArray() as V3, look: L(alvo).toArray() as V3, fov};
};
/** Câmera parada num ponto, sempre olhando para o carrinho. */
const olha = (pos: V3, fov = 50): Seg => (T: number) => {
	const e = estado(T);
	const q = quadro(trilhoDe(e, e.c.trilho), e.c.u);
	return {pos, look: [q.pos.x, q.pos.y + 0.7, q.pos.z], fov};
};
/** Câmera que acompanha o carrinho de longe (posição fixa relativa em mundo). */
const acompanha = (off: V3, fov = 50): Seg => (T: number) => {
	const e = estado(T);
	const q = quadro(trilhoDe(e, e.c.trilho), e.c.u);
	const base = e.c.voo ? e.c.voo.pos : q.pos;
	return {pos: [base.x + off[0], base.y + off[1], base.z + off[2]], look: [base.x, base.y + 0.6, base.z], fov};
};
const K = (t: number, pos: V3, look: V3, fov = 50, cut = false): CamKey => ({t, pos, look, fov, cut});
/** Trecho dirigido por função de t0 até t1 (depois disso a câmera parte da posição em t1, sem salto). */
const S = (t0: number, t1: number, seg: Seg, cut = false): CamKey[] => {
	const a = seg(t0);
	const b = seg(t1);
	return [
		{t: t0, pos: a.pos, look: a.look, fov: a.fov, cut, seg},
		{t: t1, pos: b.pos, look: b.look, fov: b.fov},
	];
};

export const CAMERA: CamKey[] = [
	// gancho
	...S(0, SOLTA1 + 0.2, acompanha([7, 3, 9], 52)),
	K(SOLTA1 + 1.2, [16, 16, 40], [34, 12, -3], 55),
	K(7.4, [16, 15, 40], [36, 10, -3], 55),
	// porquê: acompanha a descida e congela na curva
	...S(8.2, 13.6, acompanha([8, 3, 10], 52)),
	K(14.4, [43, 4.5, 8], [37.5, 2.2, -1.2], 48),
	// rodas (close no truque de rodas)
	...S(14.9, 18.8, mira([2.6, 0.35, 2.2], [0.55, -0.05, 0.95], 42)),
	...S(18.9, 21.25, acompanha([5, 4, 7], 50)),
	K(21.3, [7, 7.8, ZB + 9], [7, 13.0, (ZA + ZB) / 2], 50, true),
	K(24.3, [7, 8.2, ZB + 8.5], [7, 13.0, (ZA + ZB) / 2], 50),
	// curva inclinada (vista de frente da curva)
	...S(24.45, 28.5, olha([49, 6.5, -6.5], 50), true),
	K(29.2, [57, 11, -7], [38, 2.2, -7], 55),
	K(32.4, [57, 11, -7], [38, 2.2, -7], 55),
	...S(32.75, 36.1, olha([49, 6.5, -6.5], 50)),
	K(36.8, [49, 6.2, -7], [39.8, 2.6, -7.2], 50),
	K(37.95, [49, 6.2, -7], [39.8, 2.6, -7.2], 50),
	// subida de corrente
	K(38.4, [-4, 6, 14], [4, 6, 0], 52),
	K(41.5, [-3, 8, 16], [6, 9, 0], 55),
	...S(42.6, 47.6, acompanha([-6, 3, 11], 52)),
	K(48.3, [12, 22, 22], [18, 25, 0], 55),
	...S(49.3, 51.8, acompanha([-5, 3, 12], 52)),
	K(52.3, [3, 12, 14], [10, 14, 0], 52),
	...S(55.2, 62.8, mira([2.8, -0.35, -2.2], [0.0, 0.0, -0.9], 44)),
	...S(62.9, 66.5, acompanha([-5, 3, 11], 52)),
	// loop
	K(66.6, [-14, 5, ZA + 14], [-4, 3, ZA], 52, true),
	...S(69.3, 72.3, acompanha([0, 2, 14], 52)),
	K(72.4, [7, 7, ZB + 22], [7, 7.6, (ZA + ZB) / 2], 52),
	K(75.5, [7, 7.4, ZB + 26], [7, 8.6, (ZA + ZB) / 2], 52),
	K(78.6, [7, 8.6, ZB + 28], [7, 9, (ZA + ZB) / 2], 52),
	K(84.6, [7, 8.6, ZB + 28], [7, 9, (ZA + ZB) / 2], 52),
	K(88.8, [7, 8.8, ZB + 30], [7, 9, (ZA + ZB) / 2], 52),
	// trava (no topo da gota, de cabeça pra baixo)
	K(89.2, [9.5, 15.4, ZA + 2.0], [7, 16.4, (ZA + ZB) / 2], 50, true),
	K(98.3, [9.4, 15.4, ZA + 1.8], [7, 16.4, (ZA + ZB) / 2], 50),
	// freio magnético
	K(98.6, [18, 6, ZC + 16], [24, 1.8, ZC], 50, true),
	K(101.7, [16, 5, ZC + 14], [17, 1.8, ZC], 50),
	K(106.0, [12, 4, ZC + 11], [10, 1.6, ZC], 50),
	...S(106.3, 111.4, olha([8.5, 1.0, ZC + 3.4], 46)),
	K(113.1, [6.5, 3.4, ZC + 8], [2, 1.6, ZC], 50),
	// blocos
	K(113.3, [-6, 12, ZC + 27], [-6, 1.4, ZC], 60, true),
	K(132.5, [-9, 11, ZC + 25], [-10, 1.4, ZC], 60),
	// acabamento (cortes)
	K(132.7, [28, 22, 6], [27.5, 26, 0], 50, true),
	K(134.2, [28.5, 22, 6.5], [27.5, 26, 0], 50),
	K(134.3, [-5, 4.5, ZC + 9.5], [-12, 2.0, ZC + 2.4], 52, true),
	K(136.0, [-5.5, 4.4, ZC + 9.2], [-12, 2.0, ZC + 2.4], 52),
	K(136.1, [-18.5, 2.6, ZC + 4.2], [-21, 2.0, ZC], 45, true),
	K(138.2, [-18.6, 2.6, ZC + 4.0], [-21, 2.0, ZC], 45),
	// uso: braços para cima na descida
	...S(138.3, 140.6, presa(0, 1.9, 2.8, -2, 58), true),
	K(141.6, [30, 26, 46], [10, 10, -8], 55),
	K(143.5, [32, 30, 54], [8, 10, -10], 55),
	K(148.8, [33, 31, 56], [8, 10, -10], 55),
];

export const TREMORES = [
	{at: 6.4, amp: 0.4},
	{at: 49.22, amp: 0.15},
	{at: 60.32, amp: 0.12},
	{at: 72.8, amp: 0.15},
	{at: 118.74, amp: 0.4},
];

export const legendaY = (T: number) => (T >= 55 && T < 61 ? 0.72 : T >= 89 && T < 98.4 ? 0.74 : 0.66);
