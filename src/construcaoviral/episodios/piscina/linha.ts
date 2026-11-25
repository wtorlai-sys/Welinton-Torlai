// "Parabéns! Você construiu uma piscina" — linha do tempo (estado do mundo por segundo), rebobinares e câmera.
// Tempos = narração aprovada (viral-video-engine/projects/piscina/03-narracao/frases.json). t = tempo "de cena"
// (já passado pelo rebobinar); T = tempo real do áudio.
import {CamKey, k, on, Rewind, V3, win} from '../../kit/tempo';

export const DURACAO = 163.11;

export const REWINDS: Rewind[] = [
	{at: 5.2, dur: 0.9, to: 3.3}, // lamaçal
	{at: 26.8, dur: 0.9, to: 20.9}, // lona furada
	{at: 56.26, dur: 0.8, to: 53.9}, // camada rasgada
	{at: 70.0, dur: 0.8, to: 66.0}, // água verde
	{at: 125.4, dur: 0.8, to: 122.0}, // queimou o pé / escorregou
	{at: 140.9, dur: 1.0, to: 135.6}, // piscina saiu do chão
];

/** Dimensões (m): buraco x[-2,2] z[-4,4] y[-1.4,0]; casca de concreto 0,2 m; casa de máquinas x[3.6,5.2] z[-0.8,0.8]. */
export const POOL = {hx: 2, hz: 4, d: 1.4, wall: 0.2};
export const NIVEL = -0.12; // nível da água cheia
/** Espessuras exageradas (legíveis no corte, como nas referências). */
export const CAMADA_ESP = 0.06;
export const AZULEJO_ESP = 0.045;
export const FUNDO_AGUA = -POOL.d + POOL.wall + CAMADA_ESP + AZULEJO_ESP;

export type Estado = ReturnType<typeof estado>;

export const estado = (t: number) => {
	// ---- Ato 1: buraco + água → lamaçal (0–5,2) | porquê em corte (6,1–11,6)
	const cavar = k(t, 0.2, 1.8);
	const fase1 = t < 11.6;
	const lama = on(t, 3.4, 5.2) ? k(t, 3.6, 4.8) : 0;
	const infiltra = on(t, 6.1, 11.6) ? k(t, 7.1, 10.0) : 0;
	const desmorona = on(t, 6.1, 11.6) ? k(t, 10.2, 11.2) : 0;
	let aguaBruta = 0; // água no buraco sem revestimento
	if (on(t, 1.9, 11.6)) aguaBruta = k(t, 1.9, 3.3) * (1 - lama * 0.75) * (1 - infiltra * 0.35);
	// ---- volume 45 t (11,6–18,8)
	const volume = on(t, 11.6, 18.84) ? k(t, 11.8, 12.6) : 0;
	// ---- lona (18,8–26,8)
	const lona = on(t, 18.84, 26.8) ? k(t, 19.2, 20.6) : 0;
	const cedeLona = on(t, 18.84, 26.8) ? k(t, 21.5, 23.5) : 0;
	const fura = on(t, 24.55, 26.8) ? 1 : 0;
	const pedra = on(t, 18.84, 26.8) ? k(t, 24.2, 24.65) : 0;
	if (on(t, 18.84, 26.8)) aguaBruta = k(t, 20.6, 21.4) * (1 - k(t, 24.8, 26.6) * 0.85);
	const cavado = t < 18.84 ? cavar : 1;
	// ---- estrutura (26,8+)
	const estrutura = t >= 26.8;
	const aco = estrutura ? k(t, 27.4, 29.9) : 0;
	const concreto = estrutura ? k(t, 29.95, 32.0) : 0;
	const acoBrilha = win(t, 37.9, 38.5, 41.0, 41.4);
	// água dentro da casca nas demonstrações de força e de poros
	let agua = 0;
	if (on(t, 32.4, 35.5)) agua = k(t, 32.5, 33.1);
	if (on(t, 35.5, 37.6)) agua = 1 - k(t, 35.35, 35.95);
	if (on(t, 41.3, 46.2)) agua = k(t, 41.4, 42.0) * (1 - k(t, 45.6, 46.1));
	const poros = on(t, 41.3, 46.2) ? k(t, 43.4, 45.6) : 0;
	// ---- impermeabilização / revestimento
	const camada = t >= 46 ? k(t, 46.5, 51.0) : 0;
	const estica = win(t, 49.0, 49.4, 50.2, 50.8);
	const rasgo = on(t, 55.7, 56.26) ? 1 : 0;
	const azulejo = t >= 56.26 ? k(t, 57.1, 59.0) : 0;
	// ---- piscina pronta, água (65,4+)
	if (t >= 65.4 && t < 132.7) agua = k(t, 65.4, 66.0);
	if (t >= 132.7 && t < 151.38) agua = 1 - k(t, 132.7, 134.0); // esvazia pra limpar
	if (t >= 151.38) agua = 1;
	const verde = on(t, 66.0, 70.0) ? k(t, 67.5, 69.4) : 0;
	const folhas = on(t, 66.0, 70.0) ? k(t, 66.0, 68.5) : on(t, 76.0, 83.2) ? 1 : 0;
	const suga = on(t, 79.6, 83.2) ? k(t, 79.6, 82.4) : 0;
	const filtroXray = win(t, 70.8, 71.4, 75.9, 76.3);
	const fluxo = on(t, 70.9, 76.0);
	const skimmer = t >= 78.6 ? k(t, 78.6, 79.5) : 0;
	const sujeiraAfunda = on(t, 85.8, 92.5) ? k(t, 85.9, 88.0) : 0;
	const ralo1 = t >= 89.4 ? k(t, 89.4, 90.4) : 0;
	const ralo2 = t >= 95.4 ? k(t, 95.4, 96.0) : 0;
	const tampas = t >= 96.1 ? k(t, 96.1, 96.8) : 0;
	const cabelo = on(t, 97.4, 100.7) ? k(t, 97.6, 100.2) : -1;
	const casaMaquinas = t >= 70.8;
	const bordaEscura = t >= 65.4 && t < 126.2;
	const bordaClara = t >= 126.2 ? k(t, 126.3, 128.1) : 0;
	// ---- chuva, água do chão, piscina sobe, válvula
	const lencol = on(t, 136.0, 140.9) ? k(t, 136.3, 138.8) : on(t, 141.9, 149.2) ? 1 - k(t, 147.2, 149.0) * 0.6 : 0;
	const sobe = on(t, 139.0, 140.9) ? k(t, 139.0, 140.1) : 0;
	const valvula = t >= 141.9 ? k(t, 142.3, 142.8) : 0;
	const valvulaAbre = on(t, 144.2, 151.38) ? k(t, 144.2, 144.6) : 0;
	const aguaValvula = on(t, 144.3, 151.38) ? k(t, 144.4, 146.6) : 0;
	const escada = t >= 151.7 ? 1 : 0;
	const luz = t >= 152.6 ? k(t, 152.6, 152.9) : 0;

	// ---- corte transversal (metade da frente afunda)
	const corte = Math.max(
		win(t, 6.1, 6.7, 11.4, 11.8),
		win(t, 21.2, 21.7, 26.8, 26.9),
		win(t, 32.4, 33.0, 45.9, 46.5),
		win(t, 60.7, 61.3, 64.8, 65.4),
		win(t, 70.8, 71.3, 75.9, 76.3),
		win(t, 114.3, 114.9, 121.5, 121.9),
		win(t, 136.0, 136.5, 138.9, 139.2),
		win(t, 141.9, 142.3, 151.2, 151.38),
	);

	// ---- realce amarelo da peça nomeada
	const realce = {
		concreto: win(t, 40.6, 40.8, 41.3, 41.6),
		camada: win(t, 52.5, 52.7, 53.4, 53.7),
		azulejo: win(t, 59.7, 59.9, 60.5, 60.8),
		filtro: win(t, 75.35, 75.55, 76.0, 76.3),
		skimmer: win(t, 83.6, 83.8, 85.6, 85.9),
		ralo: win(t, 93.0, 93.2, 93.9, 94.2),
		casa: win(t, 120.9, 121.1, 121.6, 121.9),
		borda: win(t, 131.1, 131.3, 131.9, 132.3),
		valvula: win(t, 150.1, 150.3, 151.1, 151.38),
	};

	return {
		t,
		fase1,
		cavado,
		lama,
		infiltra,
		desmorona,
		aguaBruta,
		volume,
		lona,
		cedeLona,
		fura,
		pedra,
		estrutura,
		aco,
		concreto,
		acoBrilha,
		agua,
		poros,
		camada,
		estica,
		rasgo,
		azulejo,
		verde,
		folhas,
		suga,
		filtroXray,
		fluxo,
		skimmer,
		sujeiraAfunda,
		ralo1,
		ralo2,
		tampas,
		cabelo,
		casaMaquinas,
		bordaEscura,
		bordaClara,
		lencol,
		sobe,
		valvula,
		valvulaAbre,
		aguaValvula,
		escada,
		luz,
		corte,
		realce,
	};
};

/* -------------------------------- boia de unicórnio -------------------------------- */
export type BoiaEst = {vis: boolean; pos: V3; rot: number; murcha: number; verde: number; lama: number};

export const boia = (t: number, e: Estado): BoiaEst => {
	const nivelBruto = -POOL.d + e.aguaBruta * (POOL.d - 0.15);
	if (t >= 2.5 && t < 11.6) {
		const arc = k(t, 2.5, 3.0);
		const x = 2.4 - arc * 2.6;
		const y = t < 3.0 ? 0.9 + Math.sin(arc * Math.PI) * 0.8 - arc * 1.0 : nivelBruto + 0.05 - e.lama * 0.5;
		return {vis: true, pos: [x, y, 1.2], rot: t * 0.3, murcha: 0, verde: 0, lama: e.lama};
	}
	if (t >= 20.9 && t < 26.8) return {vis: true, pos: [-0.4, nivelBruto + 0.05, -0.9], rot: t * 0.2, murcha: k(t, 24.8, 26.2), verde: 0, lama: 0};
	if (t >= 65.4 && t < 132.7) {
		const arc = k(t, 65.4, 66.0);
		const y = t < 66.0 ? 0.9 + Math.sin(arc * Math.PI) * 0.6 - arc * 0.95 : NIVEL + 0.04 + Math.sin(t * 2) * 0.02;
		return {vis: true, pos: [2.2 - arc * 2.0, y, 1.5 + Math.sin(t * 0.4) * 0.3], rot: t * 0.25, murcha: 0, verde: e.verde, lama: 0};
	}
	if (t >= 132.7 && t < 151.38) {
		const nivel = FUNDO_AGUA + e.agua * (NIVEL - FUNDO_AGUA) + e.aguaValvula * 0.35;
		const voa = e.sobe;
		return {vis: true, pos: [-0.6 + voa * 3.2, Math.max(nivel, -1.12) + 0.05 + Math.sin(voa * Math.PI) * 2.5 + voa * 0.6, 1.6 + voa * 2], rot: t * 0.2 + voa * 6, murcha: 0, verde: 0, lama: 0};
	}
	if (t >= 153.98) {
		const d = k(t, 153.98, 154.6);
		const y = t < 154.6 ? 1.6 - d * 1.55 : NIVEL + 0.04 + Math.sin(t * 2) * 0.02;
		return {vis: true, pos: [-0.5, y, 0.8 + Math.sin(t * 0.4) * 0.2], rot: t * 0.25, murcha: 0, verde: 0, lama: 0};
	}
	return {vis: false, pos: [0, 0, 0], rot: 0, murcha: 0, verde: 0, lama: 0};
};

/* ------------------------------------- mascote ------------------------------------- */
export type MascoteEst = {vis: boolean; pos: V3; rot: number; pose: string; face: 'feliz' | 'neutro' | 'susto' | 'dor' | 'olho-vermelho'; prop: null | 'pa' | 'mangueira' | 'rolo' | 'escova' | 'balde' | 'vassoura'; hat: boolean; naPiscina: boolean};

export const mascote = (t: number): MascoteEst => {
	const hat = t >= 18.84 && t < 155.25;
	const m = (pos: V3, rot: number, pose: string, face: MascoteEst['face'] = 'feliz', prop: MascoteEst['prop'] = null, naPiscina = false): MascoteEst => ({vis: true, pos, rot, pose, face, prop, hat, naPiscina});
	if (t < 1.8) return m([2.55, 0, 2.6], -90, 'cava', 'feliz', 'pa');
	if (t < 2.5) return m([2.6, 0, 2.6], -90, 'mangueira', 'feliz', 'mangueira');
	if (t < 3.5) return m([2.6, 0, 2.6], -60, 'comemora');
	if (t < 5.2) return m([2.6 - k(t, 3.6, 4.4) * 0.9, -k(t, 3.6, 4.4) * 0.05, 2.6], -40, 'atolado', 'susto');
	if (t < 11.6) return m([2.35, 0, -0.6], -70, t > 9.5 ? 'aponta' : 'idle', 'neutro');
	if (t < 18.84) return m([2.8, 0, 1.4], -50, t > 15.9 ? 'aponta' : 'idle', t > 16.5 ? 'susto' : 'feliz');
	if (t < 26.8) return m([2.35, 0, -1.6], -70, t > 21.0 ? 'aponta' : 'idle', t > 24.6 ? 'susto' : 'feliz');
	if (t < 41.3) return m([2.35, 0, -0.6], -70, t > 33.0 ? 'aponta' : 'idle', 'feliz');
	if (t < 46.0) return m([2.35, 0, -0.6], -70, 'idle', 'neutro');
	if (t < 53.6) return m([-0.9, -1.1, -2.9], 150, 'esfrega', 'feliz', 'rolo', true);
	if (t < 56.26) return m([0.0, -1.1, -2.95], 35, 'esfrega', t > 55.85 ? 'susto' : 'feliz', 'escova', true);
	if (t < 60.7) return m([2.75, 0, 1.6], -60, t > 59.7 ? 'comemora' : 'idle', 'feliz');
	if (t < 65.3) return m([-1.2, -1.1, -1.0], -90, 'esfrega', 'feliz', 'escova', true);
	if (t < 70.8) return m([2.75, 0, 1.6], -60, t < 66.0 ? 'comemora' : 'idle', t > 68.6 ? 'susto' : 'feliz');
	if (t < 76.0) return m([3.0, 0, 1.6], -20, 'aponta', 'feliz');
	if (t < 85.8) return m([2.75, 0, -2.6], -100, 'idle', 'feliz');
	if (t < 100.7) return m([2.75, 0, 2.2], -60, 'idle', 'feliz');
	if (t < 109.1) return m([2.45, 0, 0.9], -90, t > 103.2 && t < 106.2 ? 'despeja' : 'idle', 'feliz', t > 103.0 && t < 106.4 ? 'balde' : null);
	if (t < 114.2) return m([2.45, 0, 0.9], -20, 'coca-olho', 'olho-vermelho');
	if (t < 121.7) return m([2.75, 0, -0.9], -30, 'aponta', 'feliz');
	if (t < 125.4) {
		if (t < 122.9) return m([2.05, 0.08, 1.9], 0, 'idle', 'neutro');
		if (t < 124.45) return m([2.05, 0.08, 1.9], 0, 'pula', 'dor');
		return m([2.05, 0.08, 1.9], 0, 'escorrega', 'susto');
	}
	if (t < 132.6) return m([2.05, 0.08, 1.9], 0, t > 130.9 ? 'comemora' : 'idle', 'feliz');
	if (t < 141.9) return m([0.4, -1.15, -1.2], 160, t > 139.0 ? 'segura-borda' : 'esfrega', t > 134.9 ? 'susto' : 'feliz', t > 139.0 ? null : 'vassoura', true);
	if (t < 151.38) return m([2.75, 0, -1.0], -70, 'idle', 'feliz');
	if (t < 155.0) return {...m([2.6, 0, 2.2], -60, 'idle'), vis: false};
	if (t < 155.24) return m([2.05, 0.08, 1.4], -90, 'idle', 'feliz');
	if (t < 156.3) {
		const j = k(t, 155.24, 156.1);
		return m([2.05 - j * 1.9, 0.08 + Math.sin(j * Math.PI) * 1.2 - j * 0.85, 1.4], -90, 'salta', 'feliz');
	}
	return m([0.3, -0.78, 1.0], 20, 'acena', 'feliz');
};

/* -------------------------------------- câmera ------------------------------------- */
const W: {pos: V3; look: V3} = {pos: [5.8, 4.4, 10.5], look: [0.2, -0.6, 0.3]};
const SEC = (z = 9.6, y = -0.3): {pos: V3; look: V3} => ({pos: [0, y, z], look: [0, -0.75, 0]});

export const CAMERA: CamKey[] = [
	{t: 0, pos: [4.7, 1.7, 6.5], look: [2.0, 0.5, 2.2]},
	{t: 1.8, pos: [5.4, 3.0, 9.0], look: [1.0, -0.3, 1.0]},
	{t: 3.4, ...W},
	{t: 5.2, ...W},
	{t: 6.1, ...W},
	{t: 6.9, ...SEC()},
	{t: 11.4, ...SEC(8.8)},
	{t: 12.4, pos: [7.6, 8.2, 11.5], look: [0, -0.6, -0.3], fov: 52},
	{t: 15.8, pos: [7.0, 7.6, 10.8], look: [0, -0.6, -0.3], fov: 52},
	{t: 16.6, pos: [4.6, 1.3, 8.0], look: [0, -0.3, 0]},
	{t: 18.7, pos: [4.3, 1.3, 7.6], look: [0, -0.3, 0]},
	{t: 19.1, pos: [4.8, 3.0, 8.4], look: [0.6, -0.6, 0.6]},
	{t: 20.8, pos: [4.9, 3.2, 8.6], look: [0.6, -0.6, 0.6]},
	{t: 21.7, ...SEC()},
	{t: 24.2, pos: [1.0, -0.6, 3.0], look: [1.85, -0.8, -0.4], fov: 42},
	{t: 26.8, pos: [1.0, -0.62, 2.8], look: [1.85, -0.8, -0.4], fov: 42},
	{t: 27.7, pos: [4.6, 5.2, 9.4], look: [0, -1.0, 0]},
	{t: 30.0, pos: [4.2, 4.2, 8.6], look: [0, -1.0, 0]},
	{t: 32.3, pos: [4.0, 4.0, 8.3], look: [0, -1.0, 0]},
	{t: 33.0, ...SEC()},
	{t: 37.6, ...SEC(9.0)},
	{t: 39.0, pos: [-1.3, -0.6, 4.0], look: [-1.9, -0.7, 0]},
	{t: 41.2, pos: [-1.3, -0.6, 3.7], look: [-1.9, -0.7, 0]},
	{t: 42.0, pos: [-1.0, -0.7, 1.4], look: [-1.95, -0.7, 0]},
	{t: 45.8, pos: [-1.05, -0.7, 1.25], look: [-1.95, -0.7, 0]},
	{t: 46.8, pos: [1.4, 0.3, 0.8], look: [0.2, -0.8, -3.6]},
	{t: 51.6, pos: [1.3, 0.1, 0.0], look: [0.2, -0.8, -3.6]},
	{t: 52.3, pos: [2.7, 1.7, 3.1], look: [0, -0.9, -1.5]},
	{t: 53.6, pos: [2.5, 1.5, 2.7], look: [0, -0.9, -1.5]},
	{t: 54.2, pos: [1.35, -0.3, -1.3], look: [-0.05, -0.65, -3.1]},
	{t: 56.26, pos: [1.3, -0.32, -1.4], look: [-0.05, -0.65, -3.1]},
	{t: 57.1, pos: [3.6, 5.0, 6.0], look: [0, -1.0, -0.5]},
	{t: 59.0, pos: [3.0, 6.6, 5.0], look: [0, -1.0, -0.5]},
	{t: 60.6, pos: [3.0, 6.3, 5.0], look: [0, -1.0, -0.5]},
	{t: 61.4, pos: [-1.3, -0.8, 1.7], look: [-1.72, -0.8, 0]},
	{t: 64.8, pos: [-1.3, -0.8, 1.55], look: [-1.72, -0.8, 0]},
	{t: 65.8, ...W},
	{t: 69.9, pos: [5.2, 3.9, 9.2], look: [0.2, -0.6, 0.3]},
	{t: 70.9, pos: [3.2, 0.2, 7.6], look: [3.0, -0.4, 0]},
	{t: 74.5, pos: [3.6, 0.0, 6.4], look: [3.6, -0.35, 0]},
	{t: 75.9, pos: [3.9, 0.0, 5.6], look: [4.2, -0.3, 0]},
	{t: 76.5, pos: [1.6, 0.55, -0.8], look: [0.9, -0.1, -3.6]},
	{t: 82.9, pos: [1.3, 0.25, -1.8], look: [1.0, -0.2, -3.8]},
	{t: 85.8, pos: [1.35, 0.3, -1.6], look: [1.0, -0.2, -3.8]},
	{t: 86.7, pos: [0.4, -0.7, 2.6], look: [0, -1.15, -1.5]},
	{t: 91.8, pos: [0.3, -0.75, 0.6], look: [0, -1.1, -2.4]},
	{t: 93.0, pos: [0.15, -0.65, -0.9], look: [0, -1.1, -2.4]},
	{t: 94.2, pos: [0.2, -0.7, -0.4], look: [0, -1.1, -2.0]},
	{t: 97.4, pos: [0.2, -0.8, 0.4], look: [0, -1.15, -2.0]},
	{t: 100.6, pos: [0.15, -0.85, -0.2], look: [0, -1.15, -1.6]},
	{t: 101.4, pos: [4.6, 1.9, 4.8], look: [1.6, 0.2, 0.6]},
	{t: 108.9, pos: [4.2, 1.7, 4.2], look: [2.3, 0.5, 0.9]},
	{t: 109.6, pos: [3.3, 1.15, 3.2], look: [2.45, 0.75, 0.9]},
	{t: 114.1, pos: [3.25, 1.15, 3.0], look: [2.45, 0.75, 0.9]},
	{t: 115.0, pos: [3.0, -0.1, 8.6], look: [3.0, -0.45, 0]},
	{t: 121.5, pos: [3.1, -0.1, 8.2], look: [3.1, -0.45, 0]},
	{t: 122.2, pos: [3.4, 1.25, 4.9], look: [2.0, 0.35, 1.9]},
	{t: 125.3, pos: [3.35, 1.2, 4.8], look: [2.0, 0.35, 1.9]},
	{t: 126.3, pos: [5.6, 4.6, 9.6], look: [0.2, -0.3, 0.3]},
	{t: 128.4, pos: [5.0, 3.9, 8.6], look: [0.2, -0.3, 0.3]},
	{t: 129.0, pos: [3.4, 0.7, 4.9], look: [2.0, 0.05, 2.0]},
	{t: 131.8, pos: [3.4, 0.85, 4.7], look: [2.0, 0.2, 2.0]},
	{t: 132.6, ...W},
	{t: 135.8, pos: [5.6, 4.2, 9.8], look: [0.2, -0.6, 0.3]},
	{t: 136.6, ...SEC(10.6, -0.6)},
	{t: 138.8, ...SEC(10.6, -0.6)},
	{t: 139.3, pos: [6.8, 4.2, 12.6], look: [0, 0.4, 0]},
	{t: 140.9, pos: [7.0, 4.3, 12.9], look: [0, 0.5, 0]},
	{t: 141.9, pos: [7.0, 4.3, 12.9], look: [0, 0.5, 0]},
	{t: 142.6, ...SEC(10.0, -0.6)},
	{t: 144.0, pos: [0.4, -1.0, 4.6], look: [0.3, -1.2, -0.5]},
	{t: 149.0, pos: [0.4, -1.0, 4.2], look: [0.3, -1.2, -0.5]},
	{t: 149.6, pos: [0.65, -0.9, 0.9], look: [0.6, -1.08, -0.5]},
	{t: 151.3, pos: [0.65, -0.9, 0.8], look: [0.6, -1.08, -0.5]},
	{t: 151.38, pos: [-0.2, 0.9, -1.8], look: [-1.1, -0.1, -3.8], cut: true},
	{t: 152.4, pos: [-0.25, 0.85, -1.9], look: [-1.1, -0.1, -3.8]},
	{t: 152.45, pos: [1.1, 0.25, -1.4], look: [0.55, -0.7, -3.8], cut: true},
	{t: 153.5, pos: [1.08, 0.25, -1.5], look: [0.55, -0.7, -3.8]},
	{t: 153.55, pos: [3.4, 2.6, 4.2], look: [-0.3, -0.2, 0.8], cut: true},
	{t: 154.95, pos: [3.3, 2.5, 4.0], look: [-0.3, -0.2, 0.8]},
	{t: 155.0, pos: [4.4, 1.4, 4.3], look: [1.2, 0.1, 1.2], cut: true},
	{t: 156.3, pos: [4.6, 1.8, 5.0], look: [0.6, -0.2, 1.0]},
	{t: 158.6, pos: [7.2, 6.4, 13.4], look: [0, -0.2, -1.4]},
	{t: 163.2, pos: [7.3, 6.6, 13.7], look: [0, -0.2, -1.4]},
];

export const TREMORES = [
	{at: 4.58, amp: 0.18},
	{at: 10.3, amp: 0.08},
	{at: 24.62, amp: 0.1},
	{at: 139.06, amp: 0.25},
	{at: 139.8, amp: 0.2},
	{at: 124.5, amp: 0.1},
];

/** Legenda: sobe para ~30% quando a ação está embaixo (cortes, subaquático). */
export const legendaY = (T: number) => {
	const alto = [
		[5.3, 11.6],
		[21.2, 26.9],
		[32.4, 46.0],
		[61.0, 65.0],
		[70.8, 76.0],
		[86.0, 100.6],
		[114.3, 121.7],
		[136.0, 139.0],
		[141.9, 151.3],
	].some(([a, b]) => T >= a && T < b);
	return alto ? 0.27 : 0.62;
};
