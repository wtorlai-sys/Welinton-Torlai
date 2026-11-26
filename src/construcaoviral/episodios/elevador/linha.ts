// "Parabéns! Você construiu um elevador" — linha do tempo (estado por segundo), rebobinares e câmera.
// Tempos = narração aprovada (viral-video-engine/projects/elevador/03-narracao/frases.json).
import {CamKey, k, on, Rewind, V3, win} from '../../kit/tempo';

export const DURACAO = 146.57;
export const ANDAR = 3; // m por andar; térreo y=0, 12º andar y=33
export const TOPO = 36; // laje da cobertura
export const POLIA: V3 = [0.475, 37.6, -0.55]; // polia de tração (eixo em z)
export const R_POLIA = 0.825; // tangente esquerda x=-0.35 (cabine), direita x=1.3 (contrapeso)
export const CAB = {x0: -1.2, x1: 0.5, z0: -1.05, z1: 0, h: 2.4, cx: -0.35};
export const CP = {x0: 1.05, x1: 1.55, z0: -0.85, z1: -0.25, h: 2.2, cx: 1.3};
export const TRILHOS = {cab: [-1.36, 0.66], cp: [0.98, 1.62]};
export const LIMIT: V3 = [-1.5, 37.3, -0.75]; // roda do limitador
export const ANDAR_PORTA = 7; // andar da cena da porta (y=18)

export const REWINDS: Rewind[] = [
	{at: 6.9, dur: 0.8, to: 5.0}, // caixa despencou
	{at: 53.4, dur: 0.7, to: 51.2}, // cabo arrebentou
	{at: 106.0, dur: 0.7, to: 104.2}, // bateu no fundo
	{at: 121.15, dur: 0.75, to: 118.5}, // passo no vazio
];

const lerp = (a: number, b: number, x: number) => a + (b - a) * x;
/** Queda acelerada (quadrática) de y0 a y1 em [a,b]. */
const queda = (t: number, a: number, b: number, y0: number, y1: number) => {
	const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
	return y0 + (y1 - y0) * x * x;
};

/* ------------------------------ cabine (y do piso) ------------------------------ */
export const fundoPoco = (t: number) => (t < 107.1 ? -0.3 : lerp(-0.3, -1.8, k(t, 107.1, 108.5)));

export const cabineY = (t: number): number => {
	if (t < 13.5) return 0;
	if (t < 17.6) return lerp(0, 9, k(t, 13.6, 17.4));
	if (t < 24.1) return lerp(9, 12, k(t, 17.8, 23.8));
	if (t < 39.9) return lerp(12, 21, k(t, 28.0, 29.9)) - lerp(0, 9, k(t, 30.1, 31.7));
	if (t < 51.3) return lerp(12, 15, k(t, 39.9, 40.8)) + lerp(0, 3, k(t, 49.8, 51.0));
	if (t < 54.1) return t < 52.0 ? 18 : queda(t, 52.0, 53.3, 18, 0);
	if (t < 63.0) return lerp(18, 24, k(t, 58.0, 62.0));
	if (t < 65.4) return 24 - k(t, 64.0, 65.2) * 0.8;
	if (t < 80.4) return 23.2;
	if (t < 92.0) return t < 81.9 ? 23.2 : t < 88.42 ? queda(t, 81.9, 88.42, 23.2, 9) : 9 - k(t, 88.42, 88.7) * 0.15;
	if (t < 103.9) return t < 97.7 ? 8.85 : t < 100.9 ? queda(t, 97.7, 100.9, 8.85, 6.0) : 6.0 - k(t, 100.9, 101.1) * 0.1;
	if (t < 106.7) return t < 104.3 ? 5.9 : queda(t, 104.3, 105.74, 5.9, fundoPoco(t) + 0.05);
	if (t < 117.1) return t < 109.9 ? 2.0 : lerp(2.0, -0.85, k(t, 109.9, 111.1)) - (t > 111.1 ? Math.sin(Math.min(1, (t - 111.1) / 0.5) * Math.PI) * 0.15 : 0);
	if (t < 121.6) return 3;
	if (t < 137.4) return lerp(3, 18, k(t, 122.2, 124.6));
	return lerp(18, 33, k(t, 137.6, 139.3));
};
/** Contrapeso: do outro lado da polia (cabine em cima → contrapeso embaixo). */
export const contrapesoY = (t: number) => 31.2 - cabineY(t);

/* ------------------------------------ estado ------------------------------------ */
export const estado = (t: number) => {
	const y = cabineY(t);
	const fase0 = t < 13.5; // caixa na corda
	// caixa de madeira (gancho)
	let caixaY = 0;
	if (t < 5.6) caixaY = lerp(0, 33, k(t, 0.6, 4.4));
	else if (t < 7.7) caixaY = queda(t, 5.6, 6.6, 33, 0);
	else caixaY = 33;
	const caixaQuebrada = on(t, 6.6, 7.7);
	const cordaRompe = (on(t, 5.6, 7.7) ? 1 : 0) || (on(t, 9.36, 10.3) ? 1 : 0);
	const cordaEstica = on(t, 7.7, 10.3) ? k(t, 7.9, 9.3) : 0;
	const oitoPessoas = on(t, 10.28, 13.5) ? k(t, 10.3, 10.9) : 0;
	const cabine = t >= 10.28;
	const cabo = t >= 13.6 ? k(t, 13.6, 14.4) : 0;
	const motor = t >= 13.6 ? k(t, 16.0, 16.6) : 0;
	const motorGrande = win(t, 19.6, 21.2, 35.6, 37.6);
	const contrapeso = t >= 24.4 ? k(t, 24.6, 26.0) : 0;
	const balanca = win(t, 40.6, 41.4, 44.0, 44.8);
	const guias = t >= 44.5 ? k(t, 45.0, 48.6) : 0; // crescem de baixo para cima
	const caboRompe = on(t, 51.74, 54.1);
	const nCabos = t >= 55.9 ? 1 + Math.round(5 * k(t, 56.2, 57.6)) : 1;
	const semLuz = win(t, 63.3, 63.6, 80.2, 80.6);
	const freio = t >= 66.9 ? k(t, 66.9, 67.4) : 0;
	// sapatas: 1 = fechadas (molas); 0 = abertas (energia)
	let sapatas = 1;
	if (on(t, 70.3, 71.86)) sapatas = 1 - k(t, 70.4, 70.9);
	if (on(t, 71.86, 80.4)) sapatas = k(t, 72.8, 73.15);
	const energiaFreio = on(t, 70.3, 71.9);
	const tamborGira = on(t, 70.9, 74.2) ? 1 - k(t, 73.1, 74.2) : 0;
	const garras = t >= 84.6 ? k(t, 84.7, 85.4) : 0;
	let garrasFecham = 0;
	if (on(t, 88.3, 97.7)) garrasFecham = k(t, 88.3, 88.45);
	if (on(t, 97.7, 101.0)) garrasFecham = 0;
	if (t >= 101.0 && t < 103.9) garrasFecham = k(t, 101.0, 101.15);
	const faiscas = win(t, 88.3, 88.4, 89.2, 89.6) + win(t, 100.95, 101.05, 101.6, 102.0);
	const limitador = t >= 92.0 ? k(t, 94.4, 95.0) : 0;
	const limitadorTrava = on(t, 99.5, 103.9);
	const alavanca = on(t, 100.5, 103.9) ? k(t, 100.5, 100.9) : 0;
	const molas = t >= 109.8 ? k(t, 109.8, 110.4) : 0;
	const compressao = on(t, 111.0, 117.1) ? Math.sin(Math.min(1, (t - 111.0) / 0.6) * Math.PI) * 0.35 + 0.15 : 0;
	// porta do 7º andar
	let portaAberta = 0;
	if (on(t, 117.1, 121.6)) portaAberta = k(t, 117.4, 118.2);
	if (on(t, 121.6, 124.8)) portaAberta = 1 - k(t, 121.7, 122.2);
	if (on(t, 124.8, 137.4)) portaAberta = k(t, 124.8, 125.4) * (1 - k(t, 132.9, 133.3));
	let porta12 = 0;
	if (t >= 139.3) porta12 = k(t, 139.4, 140.0);
	const trava = t >= 122.6 ? k(t, 122.6, 123.1) : 0;
	const travaSolta = t >= 124.7;
	const espelho = t >= 133.4 ? k(t, 133.5, 133.9) : 0;
	const alarme = t >= 134.6 ? k(t, 134.7, 135.1) : 0;
	const luzCabine = semLuz > 0.5 ? 0 : 1;
	const velocidade = Math.abs(cabineY(t + 0.02) - cabineY(t - 0.02)) / 0.04;
	const realce = {
		contrapeso: win(t, 38.5, 38.7, 39.6, 39.9),
		guias: win(t, 50.0, 50.2, 51.0, 51.3),
		cabos: win(t, 61.6, 61.8, 62.8, 63.1),
		freio: win(t, 75.6, 75.8, 76.8, 77.1),
		garras: win(t, 90.6, 90.8, 91.7, 92.0),
		limitador: win(t, 102.1, 102.3, 103.6, 103.9),
		molas: win(t, 112.6, 112.8, 113.8, 114.1),
		trava: win(t, 128.4, 128.6, 129.5, 129.8),
	};
	return {
		t,
		y,
		fase0,
		caixaY,
		caixaQuebrada,
		cordaRompe,
		cordaEstica,
		oitoPessoas,
		cabine,
		cabo,
		motor,
		motorGrande,
		contrapeso,
		cpY: contrapesoY(t),
		balanca,
		guias,
		caboRompe,
		nCabos,
		semLuz,
		freio,
		sapatas,
		energiaFreio,
		tamborGira,
		garras,
		garrasFecham,
		faiscas,
		limitador,
		limitadorTrava,
		alavanca,
		fundo: fundoPoco(t),
		molas,
		compressao,
		portaAberta,
		porta12,
		trava,
		travaSolta,
		espelho,
		alarme,
		luzCabine,
		velocidade,
		realce,
	};
};
export type Estado = ReturnType<typeof estado>;

/* ------------------------------------ mascote ------------------------------------ */
export type MascoteEst = {vis: boolean; pos: V3; rot: number; pose: string; face: 'feliz' | 'neutro' | 'susto' | 'dor' | 'olho-vermelho'; hat: boolean};

export const mascote = (t: number, e: Estado): MascoteEst => {
	const hat = t >= 13.5;
	const naCab = (pose: string, face: MascoteEst['face'] = 'feliz', rot = 0, dx = 0): MascoteEst => ({vis: true, pos: [CAB.cx + 0.25 + dx, e.y + 0.05, -0.5], rot, pose, face, hat});
	if (t < 7.7) return {vis: true, pos: [CAB.cx, e.caixaY + 0.15, -0.55], rot: 0, pose: t < 5.6 ? (t < 4.4 ? 'idle' : 'comemora') : 'segura-borda', face: t < 5.6 ? 'feliz' : 'susto', hat: false};
	if (t < 10.28) return {vis: true, pos: [CAB.cx, 33.15, -0.55], rot: 0, pose: 'idle', face: t > 8.6 ? 'susto' : 'neutro', hat: false};
	if (t < 13.5) return {vis: false, pos: [0, 0, 0], rot: 0, pose: 'idle', face: 'feliz', hat};
	if (t < 24.1) return naCab(t > 21 ? 'idle' : 'idle', t > 20.5 ? 'neutro' : 'feliz');
	if (t < 39.9) return naCab(t > 28 && t < 31.7 ? 'comemora' : 'idle', 'feliz');
	if (t < 44.5) return naCab('segura-borda', 'susto');
	if (t < 51.74) return naCab('idle', 'feliz');
	if (t < 54.1) return naCab('segura-borda', 'susto');
	if (t < 63.3) return naCab(t > 58 ? 'comemora' : 'idle', 'feliz');
	if (t < 77.0) return naCab('idle', t > 63.6 ? 'susto' : 'feliz');
	if (t < 81.9) return naCab('idle', 'neutro');
	if (t < 88.5) return naCab('segura-borda', 'susto');
	if (t < 92.0) return naCab('idle', 'feliz');
	if (t < 97.7) return naCab('idle', 'feliz');
	if (t < 101.2) return naCab('segura-borda', 'susto');
	if (t < 104.3) return naCab('idle', 'feliz');
	if (t < 106.7) return naCab('segura-borda', 'susto');
	if (t < 111.0) return naCab('idle', 'neutro');
	if (t < 117.1) return naCab(t > 111.6 ? 'comemora' : 'idle', 'feliz');
	// cena da porta (corredor do 7º andar, atrás da parede do fundo do poço)
	const yA = (ANDAR_PORTA - 1) * ANDAR;
	if (t < 121.6) {
		const passo = k(t, 119.9, 120.6);
		return {vis: true, pos: [CAB.cx, yA, -2.4 + passo * 1.0], rot: 0, pose: passo > 0.95 ? 'segura-borda' : passo > 0 ? 'anda' : 'idle', face: t > 120.6 ? 'susto' : 'neutro', hat};
	}
	if (t < 125.3) return {vis: true, pos: [CAB.cx, yA, -2.4], rot: 0, pose: 'idle', face: 'feliz', hat};
	if (t < 133.0) return {vis: true, pos: [CAB.cx + 0.45, yA, -1.25], rot: 0, pose: 'aponta', face: 'feliz', hat};
	if (t < 137.4) return naCab(t > 135.5 ? 'comemora' : 'idle', 'feliz');
	if (t < 139.4) return naCab('aponta', 'feliz', -60);
	const sai = k(t, 139.9, 140.8);
	return {vis: true, pos: [CAB.cx, 33.05, -0.5 - sai * 1.6], rot: 0, pose: 'comemora', face: 'feliz', hat};
};

/* ------------------------------------- câmera ------------------------------------- */
/** Plano frontal do poço: olha para (x, y) na profundidade da cabine, a `d` metros. */
const F = (t: number, y: number, d: number, x = 0, fov = 50, cut = false): CamKey => ({t, pos: [x + 0.4, y + 0.5, -0.5 + d], look: [x, y, -0.6], fov, cut});
/** Segue a cabine em [a,b] com chaves a cada `dt`. */
const segue = (a: number, b: number, d: number, dy = 1.2, dt = 0.25, x = -0.2): CamKey[] => {
	const ks: CamKey[] = [];
	for (let t = a; t <= b + 1e-6; t += dt) ks.push(F(t, cabineY(t) + dy, d, x));
	return ks;
};
const caixaFollow = (): CamKey[] => {
	const ks: CamKey[] = [];
	for (let t = 0; t <= 4.4; t += 0.4) {
		const yy = lerp(0, 33, k(t, 0.6, 4.4));
		ks.push(F(t, yy + 1.0, 9 + yy * 0.12, -0.3));
	}
	return ks;
};

export const CAMERA: CamKey[] = [
	...caixaFollow(),
	F(5.2, 18, 44, 0.2, 50),
	F(6.9, 17.5, 43, 0.2, 50),
	// close da corda (porquê)
	{t: 7.7, pos: [0.9, 35.4, 2.2], look: [CAB.cx, 35.6, -0.6], fov: 45},
	{t: 10.1, pos: [0.8, 35.5, 2.0], look: [CAB.cx, 35.6, -0.6], fov: 45},
	// cabine com 8 pessoas no térreo
	F(10.3, 1.3, 6.5, -0.35, 50, true),
	F(13.4, 1.3, 6.9, -0.35),
	...segue(13.6, 15.6, 9, 1.4, 0.4),
	{t: 16.6, pos: [3.6, 39.6, 5.0], look: [0.6, 37.4, -1.4], fov: 50},
	{t: 23.8, pos: [4.6, 40.4, 6.4], look: [0.7, 37.4, -1.6], fov: 50},
	F(24.6, 36.6, 11, 0.6),
	F(27.6, 18, 40, 0.5),
	F(37.9, 18, 40, 0.5),
	F(39.8, 16.6, 9, 0.4),
	F(44.4, 16.6, 9, 0.4),
	F(45.2, 18, 42, 0.2),
	F(48.8, 18, 42, 0.2),
	F(49.8, 19.6, 9, 0),
	F(51.9, 19.6, 10, 0),
	...segue(52.0, 53.3, 10, 1.5, 0.2, 0),
	F(54.2, 19.6, 9, 0),
	{t: 56.2, pos: [0.9, 23.8, 6.5], look: [0.2, 27.5, -0.6], fov: 50},
	{t: 57.8, pos: [0.9, 23.8, 6.5], look: [0.2, 27.5, -0.6], fov: 50},
	...segue(58.0, 62.0, 9, 1.4, 0.5, 0),
	F(63.2, 25.4, 9, -0.1),
	F(65.3, 24.9, 8.6, -0.1),
	// freio da máquina (close)
	{t: 66.0, pos: [1.2, 38.1, 2.3], look: [0.475, 37.6, -0.17], fov: 44},
	{t: 76.8, pos: [1.1, 38.0, 2.0], look: [0.475, 37.6, -0.17], fov: 44},
	F(77.4, 24.4, 6.5, -0.35),
	F(80.3, 24.4, 6.2, -0.35),
	...segue(80.6, 88.4, 8, 1.2, 0.25, -0.3),
	{t: 88.7, pos: [-0.6, 9.4, 1.9], look: [-1.36, 8.95, -0.5], fov: 44},
	{t: 91.8, pos: [-0.65, 9.45, 2.0], look: [-1.36, 8.95, -0.5], fov: 44},
	// limitador de velocidade
	{t: 92.6, pos: [-0.3, 37.9, 2.6], look: [LIMIT[0], LIMIT[1] - 0.2, LIMIT[2]], fov: 44},
	{t: 100.0, pos: [-0.35, 37.85, 2.4], look: [LIMIT[0], LIMIT[1] - 0.2, LIMIT[2]], fov: 44},
	{t: 100.05, pos: [-0.5, cabineY(100.9) + 0.3, 2.6], look: [-1.3, cabineY(100.9) - 0.1, -0.5], fov: 46, cut: true},
	{t: 101.6, pos: [-0.5, cabineY(101.6) + 0.3, 2.7], look: [-1.3, cabineY(101.6) - 0.1, -0.5], fov: 46},
	{t: 101.7, pos: [-0.3, 37.9, 2.6], look: [LIMIT[0], LIMIT[1] - 0.2, LIMIT[2]], fov: 44, cut: true},
	{t: 103.7, pos: [-0.35, 37.85, 2.5], look: [LIMIT[0], LIMIT[1] - 0.2, LIMIT[2]], fov: 44},
	...segue(103.9, 105.8, 8, 1.0, 0.2, -0.2),
	{t: 106.8, pos: [0.3, -0.45, 7.6], look: [0.1, -0.7, -0.6], fov: 50},
	{t: 116.9, pos: [0.35, -0.45, 7.2], look: [0.1, -0.7, -0.6], fov: 50},
	// porta do 7º andar
	{t: 117.2, pos: [0.9, 19.5, 4.8], look: [CAB.cx, 18.8, -2.0], fov: 50},
	{t: 121.1, pos: [0.85, 19.4, 4.4], look: [CAB.cx, 18.8, -2.0], fov: 50},
	{t: 121.9, pos: [0.9, 19.5, 4.8], look: [CAB.cx, 18.8, -2.0], fov: 50},
	{t: 132.8, pos: [0.85, 19.5, 4.4], look: [CAB.cx, 18.8, -2.0], fov: 50},
	// montagem dentro da cabine (cortes secos)
	{t: 132.92, pos: [-0.05, 19.5, 0.6], look: [-1.15, 19.4, -0.55], fov: 50, cut: true},
	{t: 134.2, pos: [-0.1, 19.5, 0.65], look: [-1.15, 19.4, -0.55], fov: 50},
	{t: 134.25, pos: [-0.75, 19.35, 0.5], look: [0.48, 19.2, -0.5], fov: 50, cut: true},
	{t: 135.4, pos: [-0.75, 19.35, 0.55], look: [0.48, 19.2, -0.5], fov: 50},
	{t: 135.45, pos: [CAB.cx, 19.6, 2.4], look: [CAB.cx, 19.5, -0.6], fov: 50, cut: true},
	{t: 137.3, pos: [CAB.cx, 19.6, 2.6], look: [CAB.cx, 19.5, -0.6], fov: 50},
	...segue(137.5, 139.3, 7, 1.3, 0.3, -0.35),
	F(140.0, 34.6, 7.5, -0.35),
	F(141.4, 34.8, 9, -0.35),
	F(142.4, 19, 46, 0.4),
	F(146.6, 19, 47, 0.4),
];

export const TREMORES = [
	{at: 6.6, amp: 0.6},
	{at: 43.2, amp: 0.15},
	{at: 53.3, amp: 0.5},
	{at: 88.42, amp: 0.15},
	{at: 101.0, amp: 0.12},
	{at: 105.74, amp: 0.5},
	{at: 111.1, amp: 0.08},
];

export const legendaY = (T: number) => (T >= 65.4 && T < 77 ? 0.7 : T >= 106.7 && T < 117 ? 0.24 : 0.66);
