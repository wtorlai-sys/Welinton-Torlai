// STYLE_GUIDE §2 — personagem toon paramétrico.
// Cabeça branca (MeshBasic), corpo cápsula toon, braços/pernas de palito pretos
// articulados, contorno inverted hull e sombra de contato embutida.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ContactShadows} from '@react-three/drei';
import {
	OUTLINE_SCALE,
	makeBlobShadowMaterial,
	makeFaceInkMaterial,
	makeFaceWhiteMaterial,
	makeHeadMaterial,
	makeLimbMaterial,
	makeOutlineMaterial,
	makeToonMaterial,
} from '../style/materials';
import {PALETTE, REF} from '../style/constants';
import {lerp} from '../style/easing';

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

export type Expression = 'neutro' | 'deboche' | 'feliz' | 'susto' | 'bravo';
export type HatType = 'none' | 'bone' | 'capacete' | 'gorro';

export type Outfit = {
	/** Cor da cápsula do corpo (roupa). */
	body: string;
	hat: HatType;
	hatColor?: string;
	/** Colete refletivo por cima da roupa. */
	vest?: boolean;
	vestColor?: string;
};

/** Ângulos em graus. Ombro/quadril: [frente, lateral(para fora)]. Cotovelo/joelho: dobra. */
export type Pose = {
	lShoulder: [number, number];
	rShoulder: [number, number];
	lElbow: number;
	rElbow: number;
	lHip: [number, number];
	rHip: [number, number];
	lKnee: number;
	rKnee: number;
	/** inclinação do tronco para frente (+) / trás (-) */
	spine: number;
	headYaw: number;
	headPitch: number;
	headTilt: number;
	/** deslocamento vertical da raiz (m) — ex.: sentado no chão */
	rootY: number;
};

export type PoseName = 'stand' | 'sit' | 'sitHug' | 'wave' | 'shrug' | 'point' | 'walk';

/* ------------------------------------------------------------------ */
/* Proporções (m)                                                      */
/* ------------------------------------------------------------------ */

/**
 * Rig em "unidades de desenho" (cabeça r=0.24). O personagem inteiro é escalado por
 * CHAR_SCALE para medir REF.character.height (1,0 m) com a cabeça = 35% da altura.
 */
export const RIG = {
	thigh: 0.19,
	shin: 0.19,
	upperArm: 0.19,
	foreArm: 0.19,
	limbR: 0.024,
	hipY: 0.4,
	hipX: 0.075,
	bodyR: 0.18,
	bodyLen: 0.18,
	bodyY: 0.63,
	shoulderY: 0.8,
	shoulderX: 0.165,
	headR: 0.24,
	headY: 1.131,
} as const;

/** altura de desenho (topo da cabeça) → 1,0 m reais */
const DESIGN_HEIGHT = RIG.headY + RIG.headR; // 1.371 => cabeça (0.48) = 35%
export const CHAR_SCALE = REF.character.height / DESIGN_HEIGHT;
/** altura real (m) do centro da cabeça: em pé e sentado — use para mirar a câmera */
export const HEAD_HEIGHT = {stand: RIG.headY * CHAR_SCALE, sit: (RIG.headY - 0.34) * CHAR_SCALE};

/* ------------------------------------------------------------------ */
/* Poses                                                               */
/* ------------------------------------------------------------------ */

const BASE: Pose = {
	lShoulder: [0, 12],
	rShoulder: [0, 12],
	lElbow: 8,
	rElbow: 8,
	lHip: [0, 2],
	rHip: [0, 2],
	lKnee: 0,
	rKnee: 0,
	spine: 0,
	headYaw: 0,
	headPitch: 0,
	headTilt: 0,
	rootY: 0,
};

/** Pose por nome. `t` em segundos para poses cíclicas (wave/walk). Determinístico. */
export const getPose = (name: PoseName, t = 0): Pose => {
	switch (name) {
		case 'stand':
			return {...BASE, lShoulder: [0, 12 + Math.sin(t * 2) * 1.5], rShoulder: [0, 12 + Math.sin(t * 2 + 1) * 1.5]};
		case 'sit':
			// Sentado na grama com as pernas esticadas para frente, mãos sobre as coxas.
			return {
				...BASE,
				lHip: [88, 10],
				rHip: [88, 10],
				lKnee: 12,
				rKnee: 12,
				lShoulder: [38, 8],
				rShoulder: [38, 8],
				lElbow: 35,
				rElbow: 35,
				spine: -6,
				rootY: -0.34,
			};
		case 'sitHug':
			// Sentado abraçando os joelhos.
			return {
				...BASE,
				lHip: [135, 8],
				rHip: [135, 8],
				lKnee: 150,
				rKnee: 150,
				lShoulder: [62, -6],
				rShoulder: [62, -6],
				lElbow: 55,
				rElbow: 55,
				spine: 8,
				rootY: -0.34,
			};
		case 'wave': {
			const w = Math.sin(t * 10) * 18;
			return {...BASE, rShoulder: [10, 150 + w * 0.3], rElbow: 30 + w, lShoulder: [0, 12]};
		}
		case 'shrug':
			return {...BASE, lShoulder: [15, 55], rShoulder: [15, 55], lElbow: 95, rElbow: 95, headTilt: 8};
		case 'point':
			return {...BASE, rShoulder: [85, 8], rElbow: 0, headYaw: -10};
		case 'walk': {
			const s = Math.sin(t * 7);
			const k = Math.max(0, -Math.cos(t * 7));
			return {
				...BASE,
				lHip: [s * 28, 2],
				rHip: [-s * 28, 2],
				lKnee: 10 + Math.max(0, -s) * 40,
				rKnee: 10 + Math.max(0, s) * 40,
				lShoulder: [-s * 25, 10],
				rShoulder: [s * 25, 10],
				lElbow: 20,
				rElbow: 20,
				rootY: k * 0.02,
			};
		}
	}
};

/** Interpola duas poses (para transições suaves entre poses). */
export const mixPose = (a: Pose, b: Pose, t: number): Pose => {
	const out = {} as Pose;
	(Object.keys(a) as (keyof Pose)[]).forEach((k) => {
		const va = a[k];
		const vb = b[k];
		(out as Record<string, unknown>)[k] = Array.isArray(va)
			? [lerp(va[0], (vb as [number, number])[0], t), lerp(va[1], (vb as [number, number])[1], t)]
			: lerp(va as number, vb as number, t);
	});
	return out;
};

/* ------------------------------------------------------------------ */
/* Geometrias compartilhadas                                           */
/* ------------------------------------------------------------------ */

const D = THREE.MathUtils.degToRad;

const geo = {
	head: new THREE.SphereGeometry(RIG.headR, 48, 32),
	body: new THREE.CapsuleGeometry(RIG.bodyR, RIG.bodyLen, 12, 32),
	thigh: new THREE.CylinderGeometry(RIG.limbR, RIG.limbR, RIG.thigh, 10).translate(0, -RIG.thigh / 2, 0),
	shin: new THREE.CylinderGeometry(RIG.limbR, RIG.limbR, RIG.shin, 10).translate(0, -RIG.shin / 2, 0),
	upperArm: new THREE.CylinderGeometry(RIG.limbR, RIG.limbR, RIG.upperArm, 10).translate(0, -RIG.upperArm / 2, 0),
	foreArm: new THREE.CylinderGeometry(RIG.limbR, RIG.limbR, RIG.foreArm, 10).translate(0, -RIG.foreArm / 2, 0),
	joint: new THREE.SphereGeometry(RIG.limbR, 10, 8),
	hand: new THREE.SphereGeometry(RIG.limbR * 1.9, 14, 10),
	foot: new THREE.SphereGeometry(RIG.limbR * 2.2, 14, 10).scale(1, 0.6, 1.7).translate(0, 0, 0.02),
};

/* ------------------------------------------------------------------ */
/* Inverted hull                                                       */
/* ------------------------------------------------------------------ */

type OutlinedProps = {
	geometry: THREE.BufferGeometry;
	material: THREE.Material;
	outline?: number;
	castShadow?: boolean;
	receiveShadow?: boolean;
} & Omit<React.ComponentProps<'group'>, 'children'>;

/** Malha + cópia escalada BackSide preta (contorno). */
export const Outlined: React.FC<OutlinedProps> = ({geometry, material, outline = OUTLINE_SCALE, castShadow = true, receiveShadow = true, ...g}) => (
	<group {...g}>
		<mesh geometry={geometry} material={material} castShadow={castShadow} receiveShadow={receiveShadow} />
		<mesh geometry={geometry} material={makeOutlineMaterial()} scale={outline} />
	</group>
);

/* ------------------------------------------------------------------ */
/* Membros (FK: ombro→cotovelo, quadril→joelho)                       */
/* ------------------------------------------------------------------ */

const Limb: React.FC<{
	root: [number, number, number];
	fwd: number;
	side: number;
	sideSign: 1 | -1;
	bend: number;
	/** braço dobra para frente; perna dobra para trás */
	bendDir: 1 | -1;
	upper: THREE.BufferGeometry;
	lower: THREE.BufferGeometry;
	upperLen: number;
	lowerLen: number;
	end: 'hand' | 'foot';
}> = ({root, fwd, side, sideSign, bend, bendDir, upper, lower, upperLen, lowerLen, end}) => {
	const m = makeLimbMaterial();
	return (
		<group position={root} rotation={new THREE.Euler(-D(fwd), 0, D(side) * sideSign, 'ZXY')}>
			<mesh geometry={geo.joint} material={m} castShadow />
			<mesh geometry={upper} material={m} castShadow />
			<group position={[0, -upperLen, 0]} rotation={[-D(bend) * bendDir, 0, 0]}>
				<mesh geometry={geo.joint} material={m} castShadow />
				<mesh geometry={lower} material={m} castShadow />
				<group position={[0, -lowerLen, 0]} rotation={end === 'foot' ? [D(fwd - bend), 0, 0] : [0, 0, 0]}>
					<Outlined geometry={end === 'hand' ? geo.hand : geo.foot} material={m} outline={1.0} />
				</group>
			</group>
		</group>
	);
};

/* ------------------------------------------------------------------ */
/* Rosto: decals 2D conformados à esfera da cabeça                     */
/* ------------------------------------------------------------------ */

/** Cola uma geometria 2D (XY, em metros, centro do rosto = 0,0) na superfície da cabeça. */
const wrap = (g: THREE.BufferGeometry, lift: number) => {
	const pos = g.attributes.position as THREE.BufferAttribute;
	const r = RIG.headR + lift;
	for (let i = 0; i < pos.count; i++) {
		const x = pos.getX(i);
		const y = pos.getY(i);
		pos.setZ(i, Math.sqrt(Math.max(0, r * r - x * x - y * y)));
	}
	pos.needsUpdate = true;
	g.computeVertexNormals();
	return g;
};

const ellipse = (rx: number, ry: number, seg = 28) => {
	const s = new THREE.Shape();
	s.absellipse(0, 0, rx, ry, 0, Math.PI * 2, false, 0);
	return new THREE.ShapeGeometry(s, seg);
};

/** Meia-elipse de baixo (olho meio fechado = pálpebra reta em cima). */
const halfEllipse = (rx: number, ry: number) => {
	const s = new THREE.Shape();
	s.moveTo(-rx, 0);
	s.absellipse(0, 0, rx, ry, Math.PI, Math.PI * 2, false, 0);
	s.lineTo(-rx, 0);
	return new THREE.ShapeGeometry(s, 24);
};

/** Arco (∩ quando start=0,len=π; ∪ quando start=π). */
const arc = (r: number, thick: number, start: number, len: number) => new THREE.RingGeometry(r - thick / 2, r + thick / 2, 32, 1, start, len);

/** Barra com pontas arredondadas (sobrancelha, boca reta). */
const bar = (w: number, h: number) => {
	const s = new THREE.Shape();
	const r = h / 2;
	s.moveTo(-w / 2 + r, -r);
	s.lineTo(w / 2 - r, -r);
	s.absarc(w / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2, false);
	s.lineTo(-w / 2 + r, r);
	s.absarc(-w / 2 + r, 0, r, Math.PI / 2, (Math.PI * 3) / 2, false);
	const g = new THREE.ShapeGeometry(s, 8);
	// subdivide em X para conformar melhor na esfera
	return g;
};

/** Meia-lua de sorriso aberto (D deitado). */
const smile = (w: number, h: number) => {
	const s = new THREE.Shape();
	s.moveTo(-w / 2, 0);
	s.lineTo(w / 2, 0);
	s.absellipse(0, 0, w / 2, h, 0, -Math.PI, true, 0);
	return new THREE.ShapeGeometry(s, 24);
};

type Feature = {g: THREE.BufferGeometry; white?: boolean};

const place = (g: THREE.BufferGeometry, x: number, y: number, rotDeg = 0, sx = 1, sy = 1) => {
	g.scale(sx, sy, 1);
	g.rotateZ(D(rotDeg));
	g.translate(x, y, 0);
	return g;
};

const EYE_X = 0.085;
const EYE_Y = 0.035;

const buildFace = (expr: Expression, blink: number, mouthOpen: number): Feature[] => {
	const eyeSy = Math.max(0.08, 1 - blink);
	const f: Feature[] = [];
	const both = (make: (side: 1 | -1) => THREE.BufferGeometry, white = false) => {
		f.push({g: make(1), white}, {g: make(-1), white});
	};
	switch (expr) {
		case 'neutro':
			both((s) => place(ellipse(0.026, 0.04), s * EYE_X, EYE_Y, 0, 1, eyeSy));
			both((s) => place(bar(0.06, 0.014), s * EYE_X, EYE_Y + 0.07, s * -4));
			f.push({g: place(mouthOpen > 0.05 ? ellipse(0.03, 0.012 + 0.03 * mouthOpen) : bar(0.06, 0.012), 0, -0.075)});
			break;
		case 'deboche':
			// olhos meio fechados + sobrancelha reta, boca torta
			both((s) => place(halfEllipse(0.03, 0.03), s * EYE_X, EYE_Y + 0.005, 0, 1, eyeSy));
			both((s) => place(bar(0.072, 0.016), s * EYE_X, EYE_Y + 0.022, 0));
			f.push({g: place(bar(0.065, 0.013), 0.018, -0.078, 9)});
			break;
		case 'feliz':
			// olhos fechados em arco ^^ + sorriso aberto
			both((s) => place(arc(0.027, 0.013, 0, Math.PI), s * EYE_X, EYE_Y - 0.008));
			both((s) => place(bar(0.05, 0.012), s * EYE_X, EYE_Y + 0.07, s * 8));
			f.push({g: place(smile(0.11, 0.05 + 0.02 * mouthOpen), 0, -0.055)});
			break;
		case 'susto':
			// olhos arregalados (círculos tipo óculos) + boca em O
			both((s) => place(ellipse(0.046, 0.046), s * EYE_X, EYE_Y + 0.005), true);
			both((s) => place(arc(0.046, 0.011, 0, Math.PI * 2), s * EYE_X, EYE_Y + 0.005));
			both((s) => place(ellipse(0.012, 0.012), s * (EYE_X - 0.006), EYE_Y + 0.002));
			both((s) => place(bar(0.05, 0.012), s * EYE_X, EYE_Y + 0.095, s * 10));
			f.push({g: place(arc(0.02 + 0.01 * mouthOpen, 0.012, 0, Math.PI * 2), 0, -0.085, 0, 1, 1.25)});
			break;
		case 'bravo':
			both((s) => place(ellipse(0.024, 0.034), s * EYE_X, EYE_Y - 0.005, 0, 1, eyeSy));
			both((s) => place(bar(0.075, 0.018), s * (EYE_X - 0.008), EYE_Y + 0.05, s * -22));
			f.push({g: place(arc(0.04, 0.013, 0.25, Math.PI - 0.5), 0, -0.11)});
			break;
	}
	return f.map((x) => ({...x, g: wrap(x.g, x.white ? 0.004 : 0.007)}));
};

const Face: React.FC<{expression: Expression; blink: number; mouthOpen: number}> = ({expression, blink, mouthOpen}) => {
	const q = (n: number) => Math.round(n * 20) / 20; // quantiza p/ memo estável
	const features = useMemo(() => buildFace(expression, q(blink), q(mouthOpen)), [expression, q(blink), q(mouthOpen)]);
	return (
		<group>
			{features.map((x, i) => (
				<mesh key={i} geometry={x.g} material={x.white ? makeFaceWhiteMaterial() : makeFaceInkMaterial()} renderOrder={x.white ? 1 : 2} />
			))}
		</group>
	);
};

/* ------------------------------------------------------------------ */
/* Chapéus e colete                                                    */
/* ------------------------------------------------------------------ */

const hatGeo = {
	capDome: new THREE.SphereGeometry(RIG.headR * 1.035, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.48),
	capBrim: new THREE.CylinderGeometry(0.14, 0.14, 0.018, 32, 1, false, -Math.PI / 2, Math.PI).scale(1, 1, 1.15),
	capButton: new THREE.SphereGeometry(0.02, 12, 8),
	helmetDome: new THREE.SphereGeometry(RIG.headR * 1.1, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.5),
	helmetBrim: new THREE.CylinderGeometry(RIG.headR * 1.32, RIG.headR * 1.32, 0.022, 40),
	helmetRidge: new THREE.BoxGeometry(0.05, 0.03, RIG.headR * 2.1).translate(0, RIG.headR * 1.08, 0),
	beanie: new THREE.SphereGeometry(RIG.headR * 1.06, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.42),
	beanieCuff: new THREE.TorusGeometry(RIG.headR * 0.98, 0.035, 12, 40).rotateX(Math.PI / 2),
	pom: new THREE.IcosahedronGeometry(0.06, 1),
	vest: new THREE.CylinderGeometry(RIG.bodyR * 1.07, RIG.bodyR * 1.07, 0.3, 32, 1, true),
	vestBand: new THREE.CylinderGeometry(RIG.bodyR * 1.085, RIG.bodyR * 1.085, 0.045, 32, 1, true),
};

const Hat: React.FC<{type: HatType; color: string}> = ({type, color}) => {
	const m = makeToonMaterial(color);
	switch (type) {
		case 'none':
			return null;
		case 'bone':
			return (
				<group rotation={[D(-8), 0, 0]} position={[0, 0.01, 0]}>
					<Outlined geometry={hatGeo.capDome} material={m} />
					<Outlined geometry={hatGeo.capBrim} material={m} position={[0, RIG.headR * 0.18, RIG.headR * 0.86]} rotation={[D(-12), 0, 0]} />
					<Outlined geometry={hatGeo.capButton} material={m} position={[0, RIG.headR * 1.03, 0]} />
				</group>
			);
		case 'capacete':
			return (
				<group position={[0, 0.03, 0]} rotation={[D(-5), 0, 0]}>
					<Outlined geometry={hatGeo.helmetDome} material={m} />
					<Outlined geometry={hatGeo.helmetBrim} material={m} position={[0, 0.0, 0.02]} />
					<Outlined geometry={hatGeo.helmetRidge} material={m} />
				</group>
			);
		case 'gorro':
			return (
				<group position={[0, 0.035, 0]}>
					<Outlined geometry={hatGeo.beanie} material={m} />
					<Outlined geometry={hatGeo.beanieCuff} material={m} position={[0, RIG.headR * 0.25, 0]} />
					<Outlined geometry={hatGeo.pom} material={makeToonMaterial(PALETTE.white)} position={[0, RIG.headR * 1.1, 0]} />
				</group>
			);
	}
};

const bandMat = new THREE.MeshBasicMaterial({color: new THREE.Color('#E4E8EC').multiplyScalar(1.6)});

const Vest: React.FC<{color: string}> = ({color}) => (
	<group position={[0, RIG.bodyY + 0.02, 0]}>
		<Outlined geometry={hatGeo.vest} material={makeToonMaterial(color)} />
		<mesh geometry={hatGeo.vestBand} material={bandMat} position={[0, 0.06, 0]} />
		<mesh geometry={hatGeo.vestBand} material={bandMat} position={[0, -0.08, 0]} />
	</group>
);

/* ------------------------------------------------------------------ */
/* Personagem                                                          */
/* ------------------------------------------------------------------ */

export type CharacterProps = {
	outfit: Outfit;
	expression?: Expression;
	pose?: PoseName | Pose;
	/** tempo em segundos (para poses cíclicas) — passe frame/fps */
	t?: number;
	/** 0 aberto → 1 fechado */
	blink?: number;
	/** 0..1 abertura da boca (lip-flap da narração) */
	mouthOpen?: number;
	/** Sombra no chão: SEMPRE ligada (STYLE_GUIDE §2). */
	shadow?: 'contact' | 'blob' | 'both';
	/** squash & stretch rápido para reações (1 = normal) */
	squash?: number;
} & Omit<React.ComponentProps<'group'>, 'children'>;

export const Character: React.FC<CharacterProps> = ({
	outfit,
	expression = 'neutro',
	pose = 'stand',
	t = 0,
	blink = 0,
	mouthOpen = 0,
	shadow = 'contact',
	squash = 1,
	...group
}) => {
	const p = typeof pose === 'string' ? getPose(pose, t) : pose;
	const sitting = p.rootY < -0.3;
	return (
		<group {...group}>
			{/* Sombra de contato — fica no chão, fora do deslocamento da pose. */}
			{(shadow === 'contact' || shadow === 'both') && (
				<ContactShadows
					position={[0, 0.012, sitting ? 0.04 : 0]}
					scale={sitting ? 1.4 : 1.1}
					resolution={256}
					blur={REF.light.contactBlur}
					far={sitting ? 0.6 : 0.9}
					opacity={REF.light.contactOpacity}
					color="#0B1A10"
					frames={Infinity}
				/>
			)}
			{(shadow === 'blob' || shadow === 'both') && (
				<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, sitting ? 0.06 : 0]} scale={sitting ? [0.7, 0.8, 1] : [0.5, 0.5, 1]} material={makeBlobShadowMaterial()}>
					<planeGeometry />
				</mesh>
			)}

			<group scale={CHAR_SCALE}>
			<group position={[0, p.rootY, 0]} scale={[1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash)]}>
				{/* Pernas (quadril → joelho) */}
				<Limb root={[RIG.hipX, RIG.hipY, 0]} fwd={p.lHip[0]} side={p.lHip[1]} sideSign={1} bend={p.lKnee} bendDir={-1} upper={geo.thigh} lower={geo.shin} upperLen={RIG.thigh} lowerLen={RIG.shin} end="foot" />
				<Limb root={[-RIG.hipX, RIG.hipY, 0]} fwd={p.rHip[0]} side={p.rHip[1]} sideSign={-1} bend={p.rKnee} bendDir={-1} upper={geo.thigh} lower={geo.shin} upperLen={RIG.thigh} lowerLen={RIG.shin} end="foot" />

				{/* Tronco inclina a partir do quadril */}
				<group position={[0, RIG.hipY, 0]} rotation={[D(p.spine), 0, 0]}>
					<group position={[0, -RIG.hipY, 0]}>
						<Outlined geometry={geo.body} material={makeToonMaterial(outfit.body)} position={[0, RIG.bodyY, 0]} />
						{outfit.vest && <Vest color={outfit.vestColor ?? PALETTE.vest} />}

						{/* Braços (ombro → cotovelo) */}
						<Limb root={[RIG.shoulderX, RIG.shoulderY, 0]} fwd={p.lShoulder[0]} side={p.lShoulder[1]} sideSign={1} bend={p.lElbow} bendDir={1} upper={geo.upperArm} lower={geo.foreArm} upperLen={RIG.upperArm} lowerLen={RIG.foreArm} end="hand" />
						<Limb root={[-RIG.shoulderX, RIG.shoulderY, 0]} fwd={p.rShoulder[0]} side={p.rShoulder[1]} sideSign={-1} bend={p.rElbow} bendDir={1} upper={geo.upperArm} lower={geo.foreArm} upperLen={RIG.upperArm} lowerLen={RIG.foreArm} end="hand" />

						{/* Cabeça */}
						<group position={[0, RIG.headY, 0]} rotation={new THREE.Euler(D(p.headPitch), D(p.headYaw), D(p.headTilt), 'YXZ')}>
							<mesh geometry={geo.head} material={makeHeadMaterial()} castShadow />
							<mesh geometry={geo.head} material={makeOutlineMaterial()} scale={OUTLINE_SCALE} />
							<Face expression={expression} blink={blink} mouthOpen={mouthOpen} />
							<Hat type={outfit.hat} color={outfit.hatColor ?? outfit.body} />
						</group>
					</group>
				</group>
			</group>
			</group>
		</group>
	);
};
