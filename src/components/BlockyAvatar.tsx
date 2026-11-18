// Boneco 3D de blocos (estilo avatar de jogo) — usado no episódio "A garota popular".
// Exceção ao "personagem 2D" do STYLE_GUIDE pedida pelo usuário: os personagens deste episódio
// são os do Customuse (Max, irmão, garota), recriados em blocos para poderem ser ANIMADOS.
// Tudo determinístico: pose, expressão, boca e piscada vêm de props calculadas por frame.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBox} from '@react-three/drei';
import {mulberry32} from '../style/random';
import {makeBlobShadowMaterial} from '../style/materials';

export type HairStyle = 'messy' | 'quiff' | 'long' | 'short' | 'bun' | 'cap';
export type Expr =
	| 'neutro'
	| 'feliz'
	| 'convencido'
	| 'susto'
	| 'bravo'
	| 'nervoso'
	| 'apaixonado'
	| 'riso'
	| 'vazio'
	| 'determinado'
	| 'piscando'
	| 'curioso'
	| 'envergonhado'
	| 'chocado';

export type Look = {
	skin: string;
	shirt: string;
	shirtDark: string;
	sleeves: string;
	cuff?: string;
	pants: string;
	shoes: string;
	sole?: string;
	hair: HairStyle;
	hairColor: string;
	eyes: string;
	lashes?: boolean;
	blush?: boolean;
	hood?: boolean;
	pocket?: boolean;
	tee?: string;
	/** listras brancas (jaqueta college) */
	varsity?: boolean;
	cargo?: boolean;
	clip?: string;
	/** escala geral (1 = 1,08 m) */
	scale?: number;
};

export type Pose = {
	/** [frente(+)/trás, abrir(+)] em graus */
	armL?: [number, number];
	armR?: [number, number];
	legL?: number;
	legR?: number;
	/** [yaw, pitch(+ = olha p/ baixo), roll] */
	head?: [number, number, number];
	torsoYaw?: number;
	/** inclinação do corpo para frente (graus) */
	lean?: number;
	/** sobe/desce o corpo (m) */
	bob?: number;
	/** sentado: pernas a 90° e quadril baixo */
	sit?: boolean;
	/** deitado de bruços */
	prone?: boolean;
};

const D = THREE.MathUtils.degToRad;

/* ------------------------------------------------------------------ */
/* Materiais (memo por cor)                                            */
/* ------------------------------------------------------------------ */
const matCache = new Map<string, THREE.Material>();
export const plastic = (c: string, rough = 0.62) => {
	const k = `${c}|${rough}`;
	if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial({color: c, roughness: rough, metalness: 0}));
	return matCache.get(k)!;
};

/* ------------------------------------------------------------------ */
/* Rosto (CanvasTexture por expressão/boca/piscada, memo)              */
/* ------------------------------------------------------------------ */
const faceCache = new Map<string, THREE.CanvasTexture>();

const drawFace = (look: Look, expr: Expr, mouth: number, blink: number) => {
	const S = 256;
	const c = document.createElement('canvas');
	c.width = S;
	c.height = S;
	const g = c.getContext('2d')!;
	g.lineCap = 'round';
	g.lineJoin = 'round';
	const ink = '#2A1A12';
	const brow = new THREE.Color(look.hairColor).multiplyScalar(0.55).getStyle();
	const ex = 58; // distância dos olhos ao centro
	const ey = 112;
	const closedHappy = expr === 'apaixonado' || expr === 'riso';
	const big = expr === 'susto' || expr === 'chocado';

	// bochechas
	if (look.blush || expr === 'envergonhado' || expr === 'apaixonado') {
		const a = expr === 'envergonhado' ? 0.75 : expr === 'apaixonado' ? 0.6 : 0.38;
		g.fillStyle = `rgba(240,90,110,${a})`;
		[-1, 1].forEach((s) => {
			g.beginPath();
			g.ellipse(128 + s * 86, 160, 26, 15, 0, 0, Math.PI * 2);
			g.fill();
		});
	}
	if (expr === 'bravo') {
		g.fillStyle = 'rgba(220,50,40,0.28)';
		g.fillRect(0, 0, S, S);
	}

	// olhos
	const eye = (s: number, wink: boolean) => {
		const x = 128 + s * ex;
		if (closedHappy || wink || blink > 0.6) {
			g.strokeStyle = ink;
			g.lineWidth = 9;
			g.beginPath();
			if (closedHappy || wink) g.arc(x, ey + 10, 20, Math.PI * 1.15, Math.PI * 1.85);
			else {
				g.moveTo(x - 20, ey + 4);
				g.lineTo(x + 20, ey + 4);
			}
			g.stroke();
			return;
		}
		if (expr === 'vazio') {
			g.fillStyle = ink;
			g.beginPath();
			g.arc(x, ey, 9, 0, Math.PI * 2);
			g.fill();
			return;
		}
		const rw = big ? 36 : 30;
		const rh = (big ? 42 : 35) * (1 - blink * 0.8);
		g.fillStyle = '#FFFFFF';
		g.strokeStyle = ink;
		g.lineWidth = 5;
		g.beginPath();
		g.ellipse(x, ey, rw, rh, 0, 0, Math.PI * 2);
		g.fill();
		g.stroke();
		const ir = big ? 14 : 21;
		g.fillStyle = look.eyes;
		g.beginPath();
		g.ellipse(x + s * -2, ey + 3, ir, Math.min(ir + 2, rh - 2), 0, 0, Math.PI * 2);
		g.fill();
		g.fillStyle = '#140C08';
		g.beginPath();
		g.arc(x + s * -2, ey + 4, ir * 0.55, 0, Math.PI * 2);
		g.fill();
		g.fillStyle = '#FFFFFF';
		g.beginPath();
		g.arc(x + s * -2 - 6, ey - 5, ir * 0.32, 0, Math.PI * 2);
		g.fill();
		if (look.lashes) {
			g.strokeStyle = ink;
			g.lineWidth = 5;
			[-0.9, -0.5].forEach((a) => {
				const ax = x + s * Math.cos(a) * rw * 1.0;
				const ay = ey + Math.sin(a) * rh * 1.0;
				g.beginPath();
				g.moveTo(ax, ay);
				g.lineTo(ax + s * 10, ay - 8);
				g.stroke();
			});
		}
	};
	eye(-1, false);
	eye(1, expr === 'piscando');

	// sobrancelhas
	g.strokeStyle = brow;
	g.lineWidth = look.lashes ? 9 : 15;
	const browAt = (s: number, inner: number, outer: number) => {
		const x = 128 + s * ex;
		g.beginPath();
		g.moveTo(x - s * 26, ey - 50 + inner);
		g.lineTo(x + s * 26, ey - 50 + outer);
		g.stroke();
	};
	switch (expr) {
		case 'bravo':
		case 'determinado':
			browAt(-1, expr === 'bravo' ? 16 : 8, -4);
			browAt(1, expr === 'bravo' ? 16 : 8, -4);
			break;
		case 'nervoso':
		case 'envergonhado':
			browAt(-1, -10, 4);
			browAt(1, -10, 4);
			break;
		case 'susto':
		case 'chocado':
			browAt(-1, -16, -12);
			browAt(1, -16, -12);
			break;
		case 'convencido':
		case 'curioso':
			browAt(-1, 2, 2);
			browAt(1, -12, -18);
			break;
		default:
			browAt(-1, -2, 0);
			browAt(1, -2, 0);
	}

	// boca
	const my = 192;
	g.strokeStyle = ink;
	g.lineWidth = 7;
	const openMouth = (w: number, h: number) => {
		g.fillStyle = '#5A1E1E';
		g.beginPath();
		g.ellipse(128, my, w, h, 0, 0, Math.PI * 2);
		g.fill();
		g.stroke();
		if (h > 10) {
			g.fillStyle = '#E86A6A';
			g.beginPath();
			g.ellipse(128, my + h * 0.5, w * 0.6, h * 0.35, 0, 0, Math.PI * 2);
			g.fill();
			g.fillStyle = '#FFFFFF';
			g.fillRect(128 - w * 0.6, my - h + 3, w * 1.2, Math.min(9, h * 0.3));
		}
	};
	if (mouth > 0.06) {
		openMouth(20 + mouth * 12, 8 + mouth * 24);
	} else
		switch (expr) {
			case 'feliz':
			case 'apaixonado':
			case 'piscando': {
				g.fillStyle = '#5A1E1E';
				g.beginPath();
				g.moveTo(84, my - 10);
				g.quadraticCurveTo(128, my + 46, 172, my - 10);
				g.closePath();
				g.fill();
				g.stroke();
				g.fillStyle = '#FFFFFF';
				g.fillRect(94, my - 9, 68, 10);
				break;
			}
			case 'riso':
				openMouth(34, 30);
				break;
			case 'susto':
				openMouth(18, 22);
				break;
			case 'chocado':
				openMouth(26, 32);
				break;
			case 'curioso':
				openMouth(10, 10);
				break;
			case 'bravo':
			case 'nervoso': {
				g.fillStyle = '#FFFFFF';
				g.beginPath();
				g.roundRect(92, my - 12, 72, 24, 8);
				g.fill();
				g.stroke();
				g.beginPath();
				g.moveTo(92, my);
				g.lineTo(164, my);
				g.stroke();
				break;
			}
			case 'convencido':
				g.beginPath();
				g.moveTo(98, my + 2);
				g.quadraticCurveTo(135, my + 12, 166, my - 12);
				g.stroke();
				break;
			case 'vazio':
			case 'determinado':
				g.beginPath();
				g.moveTo(106, my);
				g.lineTo(150, my);
				g.stroke();
				break;
			case 'envergonhado':
				g.beginPath();
				g.moveTo(104, my);
				g.quadraticCurveTo(116, my - 8, 128, my);
				g.quadraticCurveTo(140, my + 8, 152, my);
				g.stroke();
				break;
			default:
				g.beginPath();
				g.moveTo(98, my - 6);
				g.quadraticCurveTo(128, my + 18, 158, my - 6);
				g.stroke();
		}
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	tex.anisotropy = 8;
	return tex;
};

const faceTexture = (look: Look, expr: Expr, mouth: number, blink: number) => {
	const m = Math.round(mouth * 6) / 6;
	const b = blink > 0.6 ? 1 : 0;
	const k = `${look.eyes}|${look.hairColor}|${look.lashes}|${look.blush}|${expr}|${m}|${b}`;
	if (!faceCache.has(k)) faceCache.set(k, drawFace(look, expr, m, b));
	return faceCache.get(k)!;
};

/* ------------------------------------------------------------------ */
/* Cabelo em blocos                                                    */
/* ------------------------------------------------------------------ */
type Chunk = [number, number, number, number, number, number, number, number, number]; // x y z w h d rx ry rz

const HW = 0.155; // meia-largura da cabeça
const HH = 0.14;
const HD = 0.145;

const hairChunks = (style: HairStyle): Chunk[] => {
	const r = mulberry32(style.length * 97 + 13);
	const j = (a: number) => (r() - 0.5) * 2 * a;
	const out: Chunk[] = [];
	switch (style) {
		case 'messy': {
			out.push([0, HH + 0.02, -0.01, 0.33, 0.07, 0.31, 0, 0, 0]);
			for (let ix = -2; ix <= 2; ix++)
				for (let iz = -2; iz <= 1; iz++) {
					const s = 0.085 + r() * 0.035;
					out.push([ix * 0.065 + j(0.015), HH + 0.065 + r() * 0.04, iz * 0.07 + j(0.015), s, s * 0.85, s, j(28), j(40), j(28)]);
				}
			// franja (acima das sobrancelhas)
			for (let ix = -2; ix <= 2; ix++) out.push([ix * 0.06 + j(0.01), HH - 0.005 + r() * 0.02, HD - 0.01, 0.075, 0.06, 0.06, 20 + j(10), j(20), j(25)]);
			// laterais e nuca
			[-1, 1].forEach((s) => {
				out.push([s * (HW + 0.005), HH - 0.04, -0.02, 0.04, 0.12, 0.25, 0, 0, s * 6]);
				out.push([s * (HW + 0.01), HH - 0.08, 0.06, 0.035, 0.07, 0.06, j(20), 0, s * 15]);
			});
			out.push([0, HH - 0.05, -HD - 0.01, 0.32, 0.17, 0.05, -8, 0, 0]);
			for (let ix = -2; ix <= 2; ix++) out.push([ix * 0.065, HH - 0.14 + j(0.01), -HD - 0.02, 0.07, 0.07, 0.05, j(20), j(10), j(20)]);
			break;
		}
		case 'quiff': {
			out.push([0, HH + 0.025, -0.02, 0.325, 0.07, 0.3, 0, 0, 0]);
			out.push([0, HH + 0.075, 0.07, 0.3, 0.08, 0.16, -18, 0, 0]);
			out.push([0.02, HH + 0.1, 0.12, 0.26, 0.07, 0.08, -30, 4, 0]);
			out.push([0, HH + 0.06, -0.06, 0.29, 0.06, 0.16, 6, 0, 0]);
			[-1, 1].forEach((s) => out.push([s * (HW + 0.006), HH - 0.045, -0.015, 0.03, 0.11, 0.26, 0, 0, 0]));
			out.push([0, HH - 0.06, -HD - 0.008, 0.32, 0.14, 0.035, 0, 0, 0]);
			break;
		}
		case 'long': {
			out.push([0, HH + 0.035, -0.01, 0.345, 0.09, 0.325, 0, 0, 0]);
			out.push([0, HH + 0.075, -0.03, 0.3, 0.05, 0.27, 0, 0, 0]);
			// franja varrida
			out.push([-0.04, HH + 0.005, HD, 0.23, 0.075, 0.06, 14, 0, 10]);
			out.push([0.09, HH - 0.01, HD, 0.15, 0.065, 0.06, 14, 0, -12]);
			// mechas que emolduram o rosto
			[-1, 1].forEach((s) => out.push([s * 0.138, -0.02, HD - 0.005, 0.05, 0.24, 0.05, 0, 0, s * -3]));
			// cortinas laterais onduladas até o meio das costas
			[-1, 1].forEach((s) => {
				for (let k = 0; k < 4; k++) {
					const y = HH - 0.06 - k * 0.15;
					const wob = k % 2 === 0 ? 0.0 : 0.018;
					out.push([s * (HW + 0.028 + wob), y, -0.01 - k * 0.006, 0.08, 0.22, 0.26 - k * 0.02, k % 2 ? 4 : -4, 0, s * (k % 2 ? -5 : 5)]);
				}
			});
			// costas
			for (let k = 0; k < 4; k++) out.push([0, HH - 0.05 - k * 0.15, -HD - 0.035, 0.38 - k * 0.01, 0.22, 0.08, k % 2 ? 5 : -5, 0, 0]);
			break;
		}
		case 'short':
			out.push([0, HH + 0.02, -0.01, 0.325, 0.06, 0.305, 0, 0, 0]);
			[-1, 1].forEach((s) => out.push([s * (HW + 0.005), HH - 0.04, -0.02, 0.025, 0.1, 0.26, 0, 0, 0]));
			out.push([0, HH - 0.05, -HD - 0.006, 0.32, 0.12, 0.03, 0, 0, 0]);
			out.push([0, HH + 0.005, HD - 0.01, 0.31, 0.04, 0.04, 0, 0, 0]);
			break;
		case 'bun':
			out.push([0, HH + 0.025, -0.01, 0.33, 0.07, 0.31, 0, 0, 0]);
			out.push([0, HH + 0.11, -0.06, 0.13, 0.11, 0.13, 0, 25, 0]);
			[-1, 1].forEach((s) => out.push([s * (HW + 0.008), HH - 0.07, -0.02, 0.03, 0.16, 0.26, 0, 0, 0]));
			out.push([0, HH - 0.08, -HD - 0.01, 0.32, 0.2, 0.04, 0, 0, 0]);
			break;
		case 'cap':
			out.push([0, HH + 0.04, 0, 0.33, 0.1, 0.32, 0, 0, 0]);
			out.push([0, HH + 0.005, HD + 0.06, 0.28, 0.02, 0.14, 0, 0, 0]);
			break;
	}
	return out;
};

/* ------------------------------------------------------------------ */
/* Coração extrudado (clipe, corações flutuando)                       */
/* ------------------------------------------------------------------ */
let heartGeo: THREE.ExtrudeGeometry | null = null;
export const heartGeometry = () => {
	if (heartGeo) return heartGeo;
	const s = new THREE.Shape();
	s.moveTo(0, -0.5);
	s.bezierCurveTo(-0.15, -0.35, -0.55, -0.1, -0.5, 0.2);
	s.bezierCurveTo(-0.45, 0.5, -0.1, 0.55, 0, 0.3);
	s.bezierCurveTo(0.1, 0.55, 0.45, 0.5, 0.5, 0.2);
	s.bezierCurveTo(0.55, -0.1, 0.15, -0.35, 0, -0.5);
	heartGeo = new THREE.ExtrudeGeometry(s, {depth: 0.25, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 3, curveSegments: 16});
	heartGeo.center();
	return heartGeo;
};

/* ------------------------------------------------------------------ */
/* Boneco                                                              */
/* ------------------------------------------------------------------ */
const Box: React.FC<{p: [number, number, number]; s: [number, number, number]; c: string; r?: number; rot?: [number, number, number]}> = ({p, s, c, r = 0.018, rot}) =>
	r > 0 ? (
		<RoundedBox args={s} radius={Math.min(r, Math.min(...s) / 2 - 0.001)} smoothness={2} position={p} rotation={rot} material={plastic(c)} castShadow receiveShadow />
	) : (
		<mesh position={p} rotation={rot} material={plastic(c)} castShadow receiveShadow>
			<boxGeometry args={s} />
		</mesh>
	);

export type AvatarProps = {
	look: Look;
	pose?: Pose;
	expr?: Expr;
	mouth?: number;
	blink?: number;
	/** objetos presos na mão (coordenadas locais da mão) */
	holdR?: React.ReactNode;
	holdL?: React.ReactNode;
	/** acessório preso à cabeça (coordenadas do centro da cabeça) */
	headWear?: React.ReactNode;
	shadow?: boolean;
} & Omit<React.ComponentProps<'group'>, 'children'>;

export const BlockyAvatar: React.FC<AvatarProps> = ({look, pose = {}, expr = 'neutro', mouth = 0, blink = 0, holdR, holdL, headWear, shadow = true, ...g}) => {
	const sc = look.scale ?? 1;
	const chunks = useMemo(() => hairChunks(look.hair), [look.hair]);
	const face = faceTexture(look, expr, mouth, blink);
	const faceMat = useMemo(() => new THREE.MeshBasicMaterial({transparent: true, toneMapped: false}), []);
	faceMat.map = face;
	faceMat.needsUpdate = true;
	const [aLx, aLz] = pose.armL ?? [0, 4];
	const [aRx, aRz] = pose.armR ?? [0, 4];
	const [hy, hp, hr] = pose.head ?? [0, 0, 0];
	const hip = pose.sit ? 0.36 : 0.4;
	const legL = pose.sit ? 90 : pose.legL ?? 0;
	const legR = pose.sit ? 90 : pose.legR ?? 0;
	const sole = look.sole ?? '#F4F4F4';

	const leg = (s: number, ang: number) => (
		<group position={[s * 0.09, hip, 0]} rotation={[D(-ang), 0, 0]}>
			<Box p={[0, -0.165, 0]} s={[0.165, 0.33, 0.18]} c={look.pants} />
			{look.cargo && <Box p={[s * 0.088, -0.17, 0.01]} s={[0.02, 0.09, 0.1]} c={new THREE.Color(look.pants).multiplyScalar(0.8).getStyle()} r={0.006} />}
			<Box p={[0, -0.36, 0.015]} s={[0.17, 0.065, 0.205]} c={look.shoes} r={0.02} />
			<Box p={[0, -0.39, 0.015]} s={[0.172, 0.022, 0.208]} c={sole} r={0.008} />
		</group>
	);
	const arm = (s: number, ax: number, az: number, hold?: React.ReactNode) => (
		<group position={[s * 0.265, 0.76, 0]} rotation={[D(-ax), 0, D(s * az)]}>
			<Box p={[0, -0.15, 0]} s={[0.155, 0.31, 0.17]} c={look.sleeves} />
			{look.cuff && <Box p={[0, -0.29, 0]} s={[0.16, 0.025, 0.175]} c={look.cuff} r={0.006} />}
			<Box p={[0, -0.335, 0]} s={[0.14, 0.075, 0.15]} c={look.skin} r={0.025} />
			{hold && <group position={[0, -0.36, 0.02]}>{hold}</group>}
		</group>
	);

	return (
		<group {...g}>
			{shadow && !pose.prone && (
				<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]} material={makeBlobShadowMaterial()} scale={sc}>
					<planeGeometry args={[0.7, 0.55]} />
				</mesh>
			)}
			<group scale={sc} rotation={pose.prone ? [D(90), 0, 0] : [0, 0, 0]} position={pose.prone ? [0, 0.1, 0] : [0, 0, 0]}>
				<group position={[0, pose.bob ?? 0, 0]}>
					{leg(-1, legL)}
					{leg(1, legR)}
					<group position={[0, hip, 0]} rotation={[D(pose.lean ?? 0), D(pose.torsoYaw ?? 0), 0]}>
						<group position={[0, -hip, 0]}>
							{/* tronco */}
							<Box p={[0, 0.59, 0]} s={[0.37, 0.38, 0.2]} c={look.shirt} />
							{look.pocket && <Box p={[0, 0.48, 0.1]} s={[0.24, 0.1, 0.012]} c={look.shirtDark} r={0.005} />}
							{look.tee && <Box p={[0, look.varsity ? 0.6 : 0.745, 0.1]} s={look.varsity ? [0.1, 0.36, 0.01] : [0.07, 0.03, 0.01]} c={look.tee} r={0.004} />}
							{look.varsity && (
								<>
									<Box p={[0, 0.415, 0]} s={[0.375, 0.03, 0.205]} c="#F2F2F2" r={0.006} />
									<Box p={[0, 0.775, 0]} s={[0.3, 0.03, 0.205]} c="#F2F2F2" r={0.006} />
								</>
							)}
							{look.hood && (
								<>
									<Box p={[0, 0.79, -0.06]} s={[0.27, 0.07, 0.1]} c={look.shirtDark} r={0.025} />
								</>
							)}
							{arm(-1, aLx, aLz, holdL)}
							{arm(1, aRx, aRz, holdR)}
							{/* cabeça */}
							<group position={[0, 0.79, 0]} rotation={[D(hp), D(hy), D(hr)]}>
								<Box p={[0, 0.02, 0]} s={[0.1, 0.04, 0.1]} c={look.skin} r={0.01} />
								<group position={[0, 0.17, 0]}>
									<Box p={[0, 0, 0]} s={[HW * 2, HH * 2, HD * 2]} c={look.skin} r={0.035} />
									<mesh position={[0, -0.005, HD + 0.002]} material={faceMat}>
										<planeGeometry args={[0.29, 0.29]} />
									</mesh>
									{chunks.map(([x, y, z, w, h, d, rx, ry, rz], i) => (
										<Box key={i} p={[x, y, z]} s={[w, h, d]} c={look.hairColor} r={0.012} rot={[D(rx), D(ry), D(rz)]} />
									))}
									{headWear}
									{look.clip && (
										<mesh geometry={heartGeometry()} material={plastic(look.clip, 0.4)} position={[0.11, HH + 0.01, HD + 0.045]} scale={0.055} rotation={[0, 0.3, -0.3]} castShadow />
									)}
								</group>
							</group>
						</group>
					</group>
				</group>
			</group>
		</group>
	);
};

/* ------------------------------------------------------------------ */
/* Poses e movimentos prontos (tudo função do tempo)                   */
/* ------------------------------------------------------------------ */
export const idle = (t: number, seed = 0): Pose => ({
	armL: [3 + Math.sin(t * 1.7 + seed) * 2, 5],
	armR: [3 + Math.sin(t * 1.7 + seed + 1) * 2, 5],
	head: [Math.sin(t * 0.7 + seed) * 6, Math.sin(t * 1.1 + seed) * 2, 0],
	bob: Math.sin(t * 2.4 + seed) * 0.004,
});

export const walk = (t: number, speed = 1): Pose => {
	const ph = t * 7.5 * speed;
	return {
		legL: Math.sin(ph) * 32,
		legR: -Math.sin(ph) * 32,
		armL: [-Math.sin(ph) * 30, 6],
		armR: [Math.sin(ph) * 30, 6],
		bob: Math.abs(Math.cos(ph)) * 0.025,
		head: [0, -2, Math.sin(ph) * 2],
	};
};

/** Piscada determinística de ~3 frames a cada 2,6–4 s. */
export const blinkAt = (t: number, seed: number) => {
	const period = 2.6 + ((seed * 0.37) % 1.4);
	const ph = (t + seed * 0.53) % period;
	return ph < 0.1 ? 1 : 0;
};

/** Boca falando (0..1) a partir dos timestamps — só dentro de [from, to]. */
export const talkFrom = (words: {start: number; end: number}[], t: number, from: number, to: number) => {
	if (t < from || t > to) return 0;
	const w = words.find((x) => t >= x.start && t <= x.end + 0.03);
	if (!w) return 0;
	return 0.35 + 0.65 * Math.abs(Math.sin((t - w.start) * 16));
};
