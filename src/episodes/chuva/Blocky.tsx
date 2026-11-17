// Personagem em blocos (estilo avatar de jogo de blocos, design ORIGINAL) — "A chuva da vovó".
// Pivô na base dos pés, olhando para +Z. Unidade: 1 adulto ≈ 2,4 de altura.
// Rosto desenhado em canvas (expressões), roupas com textura de tecido, sombras reais (castShadow).
// Tudo dirigido por props (frame → pose): determinístico.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBox} from '@react-three/drei';
import {canvasTex, memo} from './assets';

/* ------------------------------------------------------------------ */
/* Visual                                                              */
/* ------------------------------------------------------------------ */

export type Pattern = 'liso' | 'listras' | 'xadrez' | 'trico';
export type Look = {
	skin: string;
	shirt: string;
	shirt2?: string;
	pattern?: Pattern;
	pants: string;
	shoes: string;
	/** vestido: tronco + saia nessa cor */
	dress?: string;
	/** jaleco / capa de chuva por cima (cor) */
	coat?: string;
	hair?: {type: 'curto' | 'coque' | 'trancas' | 'longo' | 'careca'; color: string};
	hat?: {type: 'bone' | 'boina' | 'veu' | 'capuz' | 'touca'; color: string};
	glasses?: boolean;
	mustache?: string;
	tie?: string;
	scale: number;
};

export type Expression = 'neutro' | 'feliz' | 'sorrisao' | 'triste' | 'choro' | 'emocionado' | 'susto' | 'rindo' | 'determinado' | 'serio' | 'olhosFechados';

/* ------------------------------------------------------------------ */
/* Rosto                                                               */
/* ------------------------------------------------------------------ */

const INK = '#1B1416';

const drawFace = (c: CanvasRenderingContext2D, e: Expression, blink: boolean, glasses: boolean, mustache?: string) => {
	const S = 256;
	c.clearRect(0, 0, S, S);
	c.lineCap = 'round';
	c.lineJoin = 'round';
	c.fillStyle = INK;
	c.strokeStyle = INK;
	const eyeY = 112;
	const ex = [86, 170];
	const closed = blink || e === 'rindo' || e === 'olhosFechados';
	// sobrancelhas
	c.lineWidth = 9;
	const brow = (x: number, side: number) => {
		c.beginPath();
		if (e === 'triste' || e === 'choro' || e === 'emocionado') {
			c.moveTo(x - 20 * side, eyeY - 48);
			c.lineTo(x + 20 * side, eyeY - 32);
		} else if (e === 'determinado' || e === 'serio') {
			c.moveTo(x - 20 * side, eyeY - (e === 'serio' ? 40 : 32));
			c.lineTo(x + 20 * side, eyeY - 44);
		} else if (e === 'susto') {
			c.moveTo(x - 20, eyeY - 56);
			c.quadraticCurveTo(x, eyeY - 66, x + 20, eyeY - 56);
		} else {
			c.moveTo(x - 20, eyeY - 42);
			c.quadraticCurveTo(x, eyeY - 50, x + 20, eyeY - 42);
		}
		c.stroke();
	};
	brow(ex[0], -1);
	brow(ex[1], 1);
	// olhos
	ex.forEach((x) => {
		if (closed) {
			c.lineWidth = 9;
			c.beginPath();
			if (e === 'rindo' || e === 'olhosFechados') {
				c.moveTo(x - 18, eyeY + 6);
				c.quadraticCurveTo(x, eyeY - 16, x + 18, eyeY + 6);
			} else {
				c.moveTo(x - 17, eyeY);
				c.lineTo(x + 17, eyeY);
			}
			c.stroke();
			return;
		}
		const big = e === 'susto' ? 1.25 : 1;
		const squint = e === 'serio' ? 0.55 : e === 'determinado' ? 0.8 : 1;
		c.fillStyle = INK;
		c.beginPath();
		c.ellipse(x, eyeY, 14 * big, 20 * big * squint, 0, 0, Math.PI * 2);
		c.fill();
		c.fillStyle = '#FFFFFF';
		c.beginPath();
		c.arc(x + 5, eyeY - 7 * squint, 5.5 * big, 0, Math.PI * 2);
		c.fill();
		if (e === 'emocionado' || e === 'choro' || e === 'triste') {
			// olho marejado: brilho extra embaixo
			c.beginPath();
			c.arc(x - 5, eyeY + 9 * squint, 3.5, 0, Math.PI * 2);
			c.fill();
		}
	});
	// bochechas
	if (e === 'feliz' || e === 'sorrisao' || e === 'rindo' || e === 'emocionado') {
		c.fillStyle = 'rgba(240,110,110,0.35)';
		[56, 200].forEach((x) => {
			c.beginPath();
			c.ellipse(x, 158, 20, 12, 0, 0, Math.PI * 2);
			c.fill();
		});
	}
	// boca
	c.fillStyle = INK;
	c.lineWidth = 9;
	const my = 182;
	c.beginPath();
	switch (e) {
		case 'neutro':
			c.moveTo(108, my);
			c.quadraticCurveTo(128, my + 8, 148, my);
			c.stroke();
			break;
		case 'feliz':
		case 'emocionado':
			c.moveTo(92, my - 6);
			c.quadraticCurveTo(128, my + 26, 164, my - 6);
			c.stroke();
			break;
		case 'sorrisao':
		case 'rindo':
			c.moveTo(86, my - 12);
			c.quadraticCurveTo(128, my + 48, 170, my - 12);
			c.closePath();
			c.fill();
			c.fillStyle = '#FFFFFF';
			c.fillRect(100, my - 10, 56, 9);
			c.fillStyle = '#D9505A';
			c.beginPath();
			c.ellipse(128, my + 14, 20, 8, 0, 0, Math.PI * 2);
			c.fill();
			break;
		case 'triste':
			c.moveTo(100, my + 10);
			c.quadraticCurveTo(128, my - 10, 156, my + 10);
			c.stroke();
			break;
		case 'choro':
			c.ellipse(128, my + 6, 26, 20, 0, 0, Math.PI * 2);
			c.fill();
			c.fillStyle = '#D9505A';
			c.beginPath();
			c.ellipse(128, my + 16, 14, 7, 0, 0, Math.PI * 2);
			c.fill();
			break;
		case 'susto':
			c.ellipse(128, my + 4, 14, 20, 0, 0, Math.PI * 2);
			c.fill();
			break;
		case 'determinado':
			c.moveTo(106, my + 2);
			c.lineTo(150, my - 4);
			c.stroke();
			break;
		case 'serio':
			c.moveTo(106, my);
			c.lineTo(150, my);
			c.stroke();
			break;
		case 'olhosFechados':
			c.moveTo(100, my - 4);
			c.quadraticCurveTo(128, my + 16, 156, my - 4);
			c.stroke();
			break;
	}
	// lágrimas (choro: rios; emocionado: gotas)
	if (e === 'choro' || e === 'emocionado' || e === 'triste') {
		c.fillStyle = 'rgba(120,190,255,0.95)';
		ex.forEach((x) => {
			if (e === 'choro') {
				c.fillRect(x - 6, eyeY + 18, 12, 110);
			} else {
				c.beginPath();
				c.moveTo(x - 10, eyeY + 34);
				c.quadraticCurveTo(x - 10, eyeY + 22, x - 4, eyeY + 18);
				c.quadraticCurveTo(x + 2, eyeY + 22, x + 2, eyeY + 34);
				c.arc(x - 4, eyeY + 34, 6, 0, Math.PI);
				c.fill();
			}
		});
	}
	if (glasses) {
		c.strokeStyle = '#4A3A30';
		c.lineWidth = 6;
		ex.forEach((x) => c.strokeRect(x - 30, eyeY - 26, 60, 50));
		c.beginPath();
		c.moveTo(ex[0] + 30, eyeY - 6);
		c.lineTo(ex[1] - 30, eyeY - 6);
		c.stroke();
	}
	if (mustache) {
		c.fillStyle = mustache;
		c.beginPath();
		c.ellipse(108, my - 18, 28, 11, -0.2, 0, Math.PI * 2);
		c.ellipse(148, my - 18, 28, 11, 0.2, 0, Math.PI * 2);
		c.fill();
	}
};

const faceTex = (e: Expression, blink: boolean, glasses: boolean, mustache?: string) =>
	canvasTex(`face-${e}-${blink}-${glasses}-${mustache}`, 256, 256, (c) => drawFace(c, e, blink, glasses, mustache));

const faceMat = (e: Expression, blink: boolean, glasses: boolean, mustache?: string) =>
	memo(`fm-${e}-${blink}-${glasses}-${mustache}`, () => new THREE.MeshStandardMaterial({map: faceTex(e, blink, glasses, mustache), transparent: true, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2}));

/* ------------------------------------------------------------------ */
/* Tecidos                                                             */
/* ------------------------------------------------------------------ */

const fabricTex = (p: Pattern, a: string, b: string) =>
	canvasTex(`fab-${p}-${a}-${b}`, 128, 128, (c) => {
		c.fillStyle = a;
		c.fillRect(0, 0, 128, 128);
		if (p === 'listras') {
			c.fillStyle = b;
			for (let y = 0; y < 128; y += 32) c.fillRect(0, y, 128, 14);
		} else if (p === 'xadrez') {
			c.fillStyle = b;
			c.globalAlpha = 0.55;
			for (let i = 0; i < 128; i += 42) {
				c.fillRect(i, 0, 16, 128);
				c.fillRect(0, i, 128, 16);
			}
			c.globalAlpha = 1;
		}
		// trama de tricô/tecido (todas)
		c.globalAlpha = p === 'trico' ? 0.22 : 0.1;
		c.strokeStyle = '#000';
		c.lineWidth = 2;
		for (let y = 0; y < 128; y += 8)
			for (let x = 0; x < 128; x += 8) {
				c.beginPath();
				c.moveTo(x, y);
				c.lineTo(x + 4, y + 6);
				c.lineTo(x + 8, y);
				c.stroke();
			}
		c.globalAlpha = 1;
	});

/** Material de roupa/cabelo que escurece quando molhado. */
const useWetMat = (key: string, make: () => THREE.MeshStandardMaterial, wet: number) => {
	const m = useMemo(make, [key]); // eslint-disable-line react-hooks/exhaustive-deps
	const baseColor = useMemo(() => m.color.clone(), [m]);
	const baseRough = useMemo(() => m.roughness, [m]);
	m.color.copy(baseColor).multiplyScalar(1 - 0.38 * wet);
	m.roughness = baseRough - (baseRough - 0.28) * wet;
	return m;
};

/* ------------------------------------------------------------------ */
/* Pose                                                                */
/* ------------------------------------------------------------------ */

/** Graus. braço: [frente, abertura]; perna: frente; cabeça: [baixo, giro, inclinação]; tronco: [frente, giro, lado]. */
export type Pose = {
	armL: [number, number];
	armR: [number, number];
	legL: number;
	legR: number;
	head: [number, number, number];
	torso: [number, number, number];
	/** sobe/desce o corpo inteiro (m) */
	bob: number;
	/** sentado: pernas a 90° e quadril baixo */
	sit?: boolean;
};

const P0: Pose = {armL: [0, 4], armR: [0, 4], legL: 0, legR: 0, head: [0, 0, 0], torso: [0, 0, 0], bob: 0};
export const pose = (p: Partial<Pose> = {}): Pose => ({...P0, ...p});

const sin = Math.sin;
export const POSES = {
	idle: (t: number) => pose({armL: [3 + sin(t * 1.7) * 2, 5], armR: [3 - sin(t * 1.7) * 2, 5], head: [0, sin(t * 0.6) * 4, 0], bob: sin(t * 2.2) * 0.008}),
	walk: (t: number) => {
		const s = sin(t * 7);
		return pose({armL: [s * 32, 5], armR: [-s * 32, 5], legL: -s * 34, legR: s * 34, bob: Math.abs(s) * 0.05});
	},
	wave: (t: number) => pose({armR: [165, -15 + sin(t * 10) * 18], armL: [5, 5], head: [0, 0, 6]}),
	laugh: (t: number) => pose({armL: [28, -18], armR: [28, -18], torso: [-12 + sin(t * 18) * 3, 0, 0], head: [-16 + sin(t * 18) * 4, 0, 0], bob: Math.abs(sin(t * 18)) * 0.03}),
	cry: (t: number) => pose({armL: [140, -24], armR: [140, -24], head: [14, 0, 0], torso: [8, 0, 0], bob: Math.abs(sin(t * 12)) * 0.02}),
	sob: (t: number) => pose({armL: [10, 8], armR: [10, 8], head: [-18, 0, sin(t * 9) * 3], torso: [-4, 0, 0], bob: Math.abs(sin(t * 12)) * 0.025}),
	handChest: (t: number) => pose({armR: [105, -42], armL: [4, 6], head: [4, 0, -8 + sin(t) * 2], torso: [4, 0, 0]}),
	reach: (t: number) => pose({armR: [82 + sin(t * 2) * 2, -4], armL: [4, 6], torso: [6, 0, 0], head: [-4, 0, 0]}),
	point: () => pose({armR: [88, -2], armL: [4, 6]}),
	holdUp: (t: number) => pose({armR: [150 + sin(t * 3) * 3, -18], armL: [4, 6], head: [-6, 0, 0]}),
	pockets: (t: number) => pose({armL: [12 + sin(t * 14) * 12, 14], armR: [12 - sin(t * 14) * 12, 14], head: [16, sin(t * 5) * 18, 0], torso: [6, 0, 0]}),
	shrug: () => pose({armL: [40, 40], armR: [40, 40], head: [0, 0, 10]}),
	armsUp: (t: number) => pose({armL: [170, 20 + sin(t * 9) * 6], armR: [170, 20 - sin(t * 9) * 6], bob: Math.abs(sin(t * 9)) * 0.08}),
	carry: (t: number) => pose({armL: [70, -20], armR: [70, -20], head: [8, 0, 0], bob: sin(t * 2) * 0.01}),
	work: (t: number) => pose({armL: [62, -14], armR: [70 + sin(t * 9) * 6, -22], head: [26, 0, 0], torso: [10, 0, 0]}),
	lookUp: (t: number) => pose({head: [-32, 0, sin(t * 0.8) * 3], armL: [3, 5], armR: [3, 5]}),
	/** dança a dois: mão esquerda no ombro do par, direita segurando a mão dele */
	dance: (t: number, phase = 0) => {
		const s = sin(t * 3.6 + phase);
		return pose({armL: [92, 34], armR: [70, -30], legL: s * 14, legR: -s * 14, torso: [0, 0, s * 4], head: [-4, 0, s * 6], bob: Math.abs(s) * 0.04});
	},
	spin: (t: number) => pose({armL: [100, 70], armR: [100, 70], head: [-14, 0, 0], legL: sin(t * 10) * 12, legR: -sin(t * 10) * 12, bob: Math.abs(sin(t * 10)) * 0.04}),
	sit: (t: number) => pose({sit: true, legL: 90, legR: 90, armL: [40, 6], armR: [40, 6], head: [0, sin(t * 0.6) * 3, 0], bob: sin(t * 2) * 0.004}),
	sitWindow: (t: number) => pose({sit: true, legL: 90, legR: 90, armL: [52, -6], armR: [52, -6], head: [-10, sin(t * 0.4) * 3, 4]}),
	bow: (t: number) => pose({torso: [24 + sin(t * 3) * 6, 0, 0], head: [8, 0, 0], armL: [2, 4], armR: [2, 4]}),
};

export const mix = (a: Pose, b: Pose, k: number): Pose => {
	const l = (x: number, y: number) => x + (y - x) * k;
	const l2 = (x: [number, number], y: [number, number]): [number, number] => [l(x[0], y[0]), l(x[1], y[1])];
	const l3 = (x: [number, number, number], y: [number, number, number]): [number, number, number] => [l(x[0], y[0]), l(x[1], y[1]), l(x[2], y[2])];
	return {armL: l2(a.armL, b.armL), armR: l2(a.armR, b.armR), legL: l(a.legL, b.legL), legR: l(a.legR, b.legR), head: l3(a.head, b.head), torso: l3(a.torso, b.torso), bob: l(a.bob, b.bob), sit: k < 0.5 ? a.sit : b.sit};
};

/* ------------------------------------------------------------------ */
/* Componente                                                          */
/* ------------------------------------------------------------------ */

const D = THREE.MathUtils.degToRad;
const box = (w: number, h: number, d: number) => memo(`bx-${w}-${h}-${d}`, () => new THREE.BoxGeometry(w, h, d));

// medidas (escala 1)
const LEG = {w: 0.4, h: 0.9, d: 0.4};
const TOR = {w: 0.82, h: 0.86, d: 0.42};
const ARM = {w: 0.38, h: 0.86, d: 0.38};
const HEAD = 0.64;
const HIP_Y = LEG.h;
const SHOULDER_Y = HIP_Y + TOR.h - 0.12;
const NECK_Y = HIP_Y + TOR.h;

export const headCenterY = (look: Look, sit = false) => (NECK_Y + HEAD / 2 + 0.02 - (sit ? LEG.h - 0.48 : 0)) * look.scale;

export type BlockyProps = {
	look: Look;
	pose?: Pose;
	expression?: Expression;
	blink?: boolean;
	/** 0..1 — molhado (roupa escura e brilhante) */
	wet?: number;
	/** 0..1 — saia abrindo no giro */
	flare?: number;
	/** objeto preso na mão direita / esquerda (coordenadas da mão) */
	holdR?: React.ReactNode;
	holdL?: React.ReactNode;
	bandaged?: boolean;
} & Omit<React.ComponentProps<'group'>, 'children'>;

export const Blocky: React.FC<BlockyProps> = ({look, pose: p = P0, expression = 'neutro', blink = false, wet = 0, flare = 0, holdR, holdL, bandaged, ...g}) => {
	const id = JSON.stringify(look);
	const skin = useMemo(() => memo(`skin-${look.skin}`, () => new THREE.MeshStandardMaterial({color: look.skin, roughness: 0.55})), [look.skin]);
	const top = look.coat ?? look.dress ?? look.shirt;
	const shirtMat = useWetMat(`sh-${id}`, () => new THREE.MeshStandardMaterial({map: look.coat || look.dress ? null : fabricTex(look.pattern ?? 'liso', look.shirt, look.shirt2 ?? look.shirt), color: look.coat || look.dress ? top : '#fff', roughness: look.coat === '#F2C230' ? 0.35 : 0.85}), wet);
	const innerMat = useWetMat(`in-${id}`, () => new THREE.MeshStandardMaterial({map: fabricTex(look.pattern ?? 'liso', look.shirt, look.shirt2 ?? look.shirt), roughness: 0.85}), wet);
	const pantsMat = useWetMat(`pa-${id}`, () => new THREE.MeshStandardMaterial({map: fabricTex('liso', look.pants, look.pants), roughness: 0.9}), wet);
	const shoeMat = useWetMat(`so-${id}`, () => new THREE.MeshStandardMaterial({color: look.shoes, roughness: 0.6}), wet);
	const hairMat = useWetMat(`ha-${id}`, () => new THREE.MeshStandardMaterial({color: look.hair?.color ?? '#333', roughness: 0.8}), wet);
	const hatMat = useWetMat(`ht-${id}`, () => new THREE.MeshStandardMaterial({color: look.hat?.color ?? '#fff', roughness: 0.75, transparent: look.hat?.type === 'veu', opacity: look.hat?.type === 'veu' ? 0.72 : 1}), wet);
	const dressMat = useWetMat(`dr-${id}`, () => new THREE.MeshStandardMaterial({map: fabricTex('liso', look.dress ?? '#fff', look.dress ?? '#fff'), roughness: 0.85, side: THREE.DoubleSide}), wet);
	const tieMat = useMemo(() => new THREE.MeshStandardMaterial({color: look.tie ?? '#000', roughness: 0.5}), [look.tie]);
	const face = faceMat(expression, blink, !!look.glasses, look.mustache);

	const sitDrop = p.sit ? LEG.h - 0.48 : 0;
	const legs = look.dress ? skin : pantsMat;
	const sh = (m: THREE.Material) => ({material: m, castShadow: true, receiveShadow: true});

	const arm = (side: 1 | -1) => {
		const a = side === 1 ? p.armL : p.armR;
		const hold = side === 1 ? holdL : holdR;
		return (
			<group key={side} position={[side * (TOR.w / 2 + ARM.w / 2), SHOULDER_Y, 0]} rotation={[-D(a[0]), 0, side * D(a[1])]}>
				<mesh {...sh(look.coat ? shirtMat : innerMat)} geometry={box(ARM.w, ARM.h * 0.55, ARM.d)} position={[0, -ARM.h * 0.25 + 0.1, 0]} />
				<mesh {...sh(skin)} geometry={box(ARM.w * 0.96, ARM.h * 0.47, ARM.d * 0.96)} position={[0, -ARM.h * 0.72 + 0.1, 0]} />
				{side === -1 && bandaged &&
					[0, 1, 2, 3].map((i) => <mesh key={i} {...sh(memo('band', () => new THREE.MeshStandardMaterial({color: '#F4EEE2', roughness: 0.9})))} geometry={box(0.08, 0.2, 0.08)} position={[-0.14 + i * 0.095, -ARM.h + 0.02, 0.14]} />)}
				<group position={[0, -ARM.h + 0.1, 0]}>{hold}</group>
			</group>
		);
	};

	const leg = (side: 1 | -1) => (
		<group key={side} position={[side * LEG.w / 2, HIP_Y, 0]} rotation={[-D(side === 1 ? p.legL : p.legR), 0, 0]}>
			<mesh {...sh(legs)} geometry={box(LEG.w * 0.98, LEG.h * 0.85, LEG.d)} position={[0, -LEG.h * 0.42, 0]} />
			<mesh {...sh(shoeMat)} geometry={box(LEG.w, LEG.h * 0.16, LEG.d * 1.12)} position={[0, -LEG.h * 0.92, 0.03]} />
		</group>
	);

	const hy = HEAD / 2;
	return (
		<group {...g}>
			<group scale={look.scale} position={[0, p.bob - sitDrop * look.scale, 0]}>
				{leg(1)}
				{leg(-1)}
				<group position={[0, HIP_Y, 0]} rotation={[D(p.torso[0]), D(p.torso[1]), D(p.torso[2])]}>
					<group position={[0, -HIP_Y, 0]}>
						{/* tronco */}
						<mesh {...sh(shirtMat)} geometry={box(TOR.w, TOR.h, TOR.d)} position={[0, HIP_Y + TOR.h / 2, 0]} />
						{look.coat && (
							<>
								<mesh {...sh(innerMat)} geometry={box(0.26, TOR.h * 0.98, 0.02)} position={[0, HIP_Y + TOR.h / 2, TOR.d / 2 + 0.005]} />
								<mesh {...sh(shirtMat)} geometry={box(TOR.w + 0.02, 0.36, TOR.d + 0.04)} position={[0, HIP_Y - 0.12, 0]} />
							</>
						)}
						{look.tie && <mesh {...sh(tieMat)} geometry={box(0.1, 0.5, 0.02)} position={[0, HIP_Y + TOR.h - 0.3, TOR.d / 2 + 0.02]} />}
						{look.dress && (
							<mesh {...sh(dressMat)} position={[0, HIP_Y - 0.28, 0]}>
								<cylinderGeometry args={[0.48, 0.62 + flare * 0.5, 0.78 - flare * 0.1, 8, 1, true]} />
							</mesh>
						)}
						{arm(1)}
						{arm(-1)}
						{/* cabeça */}
						<group position={[0, NECK_Y, 0]} rotation={[D(p.head[0]), D(p.head[1]), D(p.head[2])]}>
							<mesh {...sh(skin)} position={[0, 0.04, 0]} geometry={box(0.34, 0.1, 0.3)} />
							<RoundedBox args={[HEAD, HEAD, HEAD]} radius={0.12} smoothness={3} position={[0, hy + 0.02, 0]} castShadow receiveShadow material={skin} />
							<mesh position={[0, hy + 0.02, HEAD / 2 + 0.004]} material={face}>
								<planeGeometry args={[HEAD * 0.9, HEAD * 0.9]} />
							</mesh>
							<Hair look={look} mat={hairMat} />
							<Hat look={look} mat={hatMat} />
						</group>
					</group>
				</group>
			</group>
		</group>
	);
};

const Hair: React.FC<{look: Look; mat: THREE.Material}> = ({look, mat}) => {
	const h = look.hair;
	if (!h || h.type === 'careca') return null;
	const y = HEAD + 0.02;
	const s = {material: mat, castShadow: true, receiveShadow: true};
	return (
		<group>
			{look.hat?.type !== 'bone' && look.hat?.type !== 'touca' && <mesh {...s} geometry={box(HEAD + 0.06, 0.16, HEAD + 0.06)} position={[0, y - 0.02, -0.01]} />}
			<mesh {...s} geometry={box(HEAD + 0.06, HEAD * 0.62, 0.12)} position={[0, y - HEAD * 0.32, -HEAD / 2 - 0.02]} />
			{(h.type === 'curto' || h.type === 'trancas' || h.type === 'longo' || h.type === 'coque') && (
				<>
					<mesh {...s} geometry={box(0.08, HEAD * 0.42, HEAD * 0.9)} position={[HEAD / 2 + 0.02, y - HEAD * 0.22, -0.03]} />
					<mesh {...s} geometry={box(0.08, HEAD * 0.42, HEAD * 0.9)} position={[-HEAD / 2 - 0.02, y - HEAD * 0.22, -0.03]} />
				</>
			)}
			{h.type === 'coque' && (
				<mesh {...s} position={[0, y + 0.1, -0.12]}>
					<sphereGeometry args={[0.2, 12, 10]} />
				</mesh>
			)}
			{h.type === 'trancas' &&
				[-1, 1].map((sd) => (
					<group key={sd}>
						<mesh {...s} geometry={box(0.16, 0.36, 0.16)} position={[sd * (HEAD / 2 + 0.1), y - 0.36, -0.06]} />
						<mesh {...s} geometry={box(0.2, 0.08, 0.2)} position={[sd * (HEAD / 2 + 0.1), y - 0.16, -0.06]} material={memo('laco', () => new THREE.MeshStandardMaterial({color: '#FF7FB0'}))} />
					</group>
				))}
			{h.type === 'longo' && <mesh {...s} geometry={box(HEAD + 0.1, 0.62, 0.14)} position={[0, y - 0.62, -HEAD / 2 - 0.02]} />}
		</group>
	);
};

const Hat: React.FC<{look: Look; mat: THREE.Material}> = ({look, mat}) => {
	const h = look.hat;
	if (!h) return null;
	const y = HEAD + 0.02;
	const s = {material: mat, castShadow: true, receiveShadow: true};
	switch (h.type) {
		case 'bone':
			// boné com a aba virada para trás (item-assinatura do narrador)
			return (
				<group>
					<RoundedBox args={[HEAD + 0.08, 0.22, HEAD + 0.08]} radius={0.06} position={[0, y + 0.02, 0]} {...s} />
					<mesh {...s} geometry={box(HEAD * 0.7, 0.05, 0.34)} position={[0, y - 0.06, -HEAD / 2 - 0.16]} />
					<mesh {...s} geometry={box(0.1, 0.06, 0.1)} position={[0, y + 0.15, 0]} />
				</group>
			);
		case 'boina':
			return (
				<group>
					<mesh {...s} geometry={box(HEAD + 0.12, 0.12, HEAD + 0.14)} position={[0, y + 0.02, -0.01]} />
					<mesh {...s} geometry={box(HEAD * 0.8, 0.04, 0.16)} position={[0, y - 0.02, HEAD / 2 + 0.1]} />
				</group>
			);
		case 'touca':
			return <RoundedBox args={[HEAD + 0.08, 0.26, HEAD + 0.08]} radius={0.08} position={[0, y + 0.0, 0]} {...s} />;
		case 'capuz':
			return (
				<group>
					<mesh {...s} geometry={box(HEAD + 0.16, 0.12, HEAD + 0.16)} position={[0, y + 0.04, -0.02]} />
					<mesh {...s} geometry={box(0.08, HEAD + 0.08, HEAD + 0.14)} position={[HEAD / 2 + 0.06, HEAD / 2, -0.03]} />
					<mesh {...s} geometry={box(0.08, HEAD + 0.08, HEAD + 0.14)} position={[-HEAD / 2 - 0.06, HEAD / 2, -0.03]} />
					<mesh {...s} geometry={box(HEAD + 0.16, HEAD + 0.08, 0.08)} position={[0, HEAD / 2, -HEAD / 2 - 0.08]} />
				</group>
			);
		case 'veu':
			return (
				<group>
					<mesh {...s} geometry={box(HEAD * 0.9, 0.06, 0.14)} position={[0, y + 0.03, 0.05]} material={memo('tiara', () => new THREE.MeshStandardMaterial({color: '#F7E7B0', metalness: 0.5, roughness: 0.3}))} />
					<mesh {...s} geometry={box(HEAD + 0.2, 1.5, 0.04)} position={[0, y - 0.72, -HEAD / 2 - 0.12]} rotation={[0.08, 0, 0]} />
				</group>
			);
	}
};
