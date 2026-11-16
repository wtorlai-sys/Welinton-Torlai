// Teste de 10 s do estilo (personagem 2D em cenário 3D) — "E se a placa fosse sincera?"
// Zé (2D) ao lado da placa "DIAS SEM ACIDENTE: 7"; um carro sai da estrada e acerta a placa,
// que zera (o "0" é o ÚNICO vermelho da cena). Close final com deboche.
// Tudo dirigido por useCurrentFrame() — determinístico.
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Character2D, Pose2D, pose2D} from '../components/Character2D';
import {CAST} from '../characters';
import {Lighting, Sparks} from '../components/Lighting';
import {CameraRig, Shake, Shot, activeShot} from '../components/CameraRig';
import {Captions, SafeAreaGuides} from '../components/Captions';
import {Car, Fence, Grass, Ground, Road, Sign, Tree} from '../components/scenery';
import type {Word} from '../lib/timestamps';
import {PALETTE, REF} from '../style/constants';
import {clamp, easeOutBack, sr} from '../style/easing';
import {mulberry32} from '../style/random';
import {makePaintMaterial} from '../style/materials';

export const TESTE10_FRAMES = 300;

/* Layout do mundo (m). Estrada ao longo de Z; câmera padrão olha para -Z. */
const ZE: [number, number, number] = [-6.1, 0, -7.0];
const ZE_HEAD: [number, number, number] = [ZE[0], 0.825 * CAST.ze.escala, ZE[2]];
const SIGN = {x: -4.4, z: -9.0, rotY: 0.3};
const SUN_AZ = REF.light.sunAzimuth; // sol à esquerda da tela → light = -1, sombra-proxy virada para o sol
const DAY_TINT = '#FFF6EA';

/* Carro: vem pela faixa (+Z), desvia para a grama e bate na placa em IMPACT s. */
const IMPACT = 6.5;
const CAR_SPEED = 18; // m/s
const CAR_LANE = -1.75;
const CAR_HIT_Z = SIGN.z - 2.4; // centro do carro quando o para-choque encosta na placa
const carAt = (t: number) => {
	if (t >= IMPACT) {
		// para em 0,35 s, avançando ~0,5 m (amassa a placa)
		const k = clamp((t - IMPACT) / 0.35);
		return {x: SIGN.x + 0.1, z: CAR_HIT_Z + 0.15 * (1 - (1 - k) * (1 - k)), dist: CAR_SPEED * (t - IMPACT) * (1 - k / 2)};
	}
	const s = IMPACT - t; // segundos antes do impacto
	const veer = 1 - sr(s, 0, 1.3); // desvia no último 1,3 s
	return {x: CAR_LANE + (SIGN.x + 0.1 - CAR_LANE) * veer, z: CAR_HIT_Z - CAR_SPEED * s, dist: -CAR_SPEED * s};
};

/* Planos (corte a cada 2 s). */
const SHOTS: Shot[] = [
	// 0–2 s: estabelecimento — 3,5 m de altura, estrada e cerca como linhas guia
	{from: 0, durationInFrames: 60, position: [-2.2, REF.camera.establishing.height, 4.2], target: [-5.0, 0.8, -8.2], move: 'pushIn'},
	// 2–4 s: médio — Zé aponta orgulhoso para a placa
	{from: 60, durationInFrames: 60, position: [-5.6, REF.camera.medium.height, -2.4], target: [-5.15, 0.8, -8.2], move: 'pushIn', amount: 0.06},
	// 4–6 s: contraplano baixo na estrada — o carro vem
	{from: 120, durationInFrames: 60, position: [-3.4, 0.75, -6.4], target: [-1.9, 0.9, -40], move: 'pushIn', amount: 0.05},
	// 6–8 s: impacto — Zé à esquerda, placa e carro à direita
	{from: 180, durationInFrames: 60, position: [-5.0, 1.6, -0.9], target: [-4.95, 0.95, -8.8], move: 'static'},
	// 8–10 s: close de reação (FOV 40°)
	{from: 240, durationInFrames: 60, position: [-5.62, 1.0, -5.95], target: [ZE_HEAD[0], ZE_HEAD[1] + 0.02, ZE_HEAD[2]], fov: REF.camera.close.fov, move: 'pushIn', amount: 0.06},
];

/** captionY por plano — legenda longe do rosto, da placa e do carro. */
const CAPTION_Y = [0.22, 0.2, 0.24, 0.2, 0.8];

const SHAKES: Shake[] = [{frame: Math.round(IMPACT * 30), seed: 5, intensity: 0.09}];

/** Narração de teste (sem áudio): timestamps word-level escritos à mão. */
const W = (text: string, start: number, end: number): Word => ({text, start, end});
const WORDS: Word[] = [
	W('E', 0.0, 0.2), W('SE', 0.2, 0.45), W('ESSA', 0.45, 0.8), W('PLACA', 0.8, 1.2), W('FOSSE', 1.2, 1.55), W('SINCERA?', 1.55, 2.1),
	W('7', 2.2, 2.55), W('DIAS', 2.55, 2.9), W('SEM', 2.9, 3.25), W('ACIDENTE.', 3.25, 4.0),
	W('ATÉ', 4.2, 4.6), W('QUE…', 4.6, 6.4),
	W('PÁ!', 6.5, 7.0), W('ZERO.', 7.1, 8.0),
	W('PELO', 8.1, 8.4), W('MENOS', 8.4, 8.8), W('DUROU', 8.8, 9.2), W('UMA', 9.2, 9.45), W('SEMANA.', 9.45, 9.9),
];

/** Fala do Zé: boca abre nas palavras dele. */
const talk = (t: number, from: number, to: number) => {
	if (t < from || t > to) return 0;
	const w = WORDS.find((x) => t >= x.start && t <= x.end + 0.04);
	return w ? 0.35 + 0.65 * Math.abs(Math.sin((t - w.start) * 17)) : 0;
};

/** Pedaços da placa voando (balística analítica, seed fixa). */
const DEBRIS = (() => {
	const r = mulberry32(11);
	return Array.from({length: 14}, () => ({
		v: new THREE.Vector3((r() - 0.5) * 3, 1.5 + r() * 2.5, 0.8 + r() * 2.2),
		spin: new THREE.Vector3(r() * 12, r() * 12, r() * 12),
		size: 0.05 + r() * 0.07,
		color: r() < 0.5 ? '#F4F1E6' : '#8E959C',
	}));
})();

const Debris: React.FC<{t: number; origin: [number, number, number]}> = ({t, origin}) => {
	if (t < 0) return null;
	const tt = Math.min(t, 0.9);
	return (
		<group position={origin}>
			{DEBRIS.map((d, i) => {
				const y = Math.max(0.03 - origin[1], d.v.y * tt - 4.9 * tt * tt);
				const k = y <= 0.03 - origin[1] ? 0.5 : 1; // no chão para de girar
				return (
					<mesh key={i} position={[d.v.x * tt, y, d.v.z * tt]} rotation={[d.spin.x * tt * k, d.spin.y * tt * k, d.spin.z * tt * k]} material={makePaintMaterial(d.color)} castShadow>
						<boxGeometry args={[d.size, d.size * 0.6, 0.015]} />
					</mesh>
				);
			})}
		</group>
	);
};

const signLines = (days: string, red: boolean) => [
	{text: 'DIAS SEM', size: 0.18, gap: 0.0},
	{text: 'ACIDENTE:', size: 0.18, gap: 0.02},
	{text: days, size: 0.46, color: red ? PALETTE.accent : PALETTE.ink, gap: 0},
];

export const Teste10s: React.FC<{qc?: boolean}> = ({qc = false}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const t = frame / fps;
	const {index} = activeShot(SHOTS, frame);

	// Carro e orientação (pela derivada da trajetória)
	const car = carAt(t);
	const ahead = carAt(Math.min(t + 0.05, IMPACT - 0.001));
	const back = carAt(Math.min(t, IMPACT - 0.05) - 0.05);
	const yaw = t < IMPACT ? Math.atan2(ahead.x - back.x, ahead.z - back.z) : Math.atan2(carAt(IMPACT - 0.001).x - carAt(IMPACT - 0.1).x, carAt(IMPACT - 0.001).z - carAt(IMPACT - 0.1).z);
	const hit = t - IMPACT;
	const bounce = hit > 0 ? Math.sin(hit * 22) * Math.exp(-hit * 6) * 0.05 : 0;

	// Placa: tomba para a frente com overshoot e fica torta; número zera 0,4 s depois
	const fall = hit > 0 ? easeOutBack(clamp(hit / 0.45), 2.2) : 0;
	const zeroed = hit > 0.4;

	// Zé: antecipação → ação → reação
	let expression: 'neutro' | 'feliz' | 'deboche' | 'susto' = 'deboche';
	let pose: Pose2D = pose2D('stand', t);
	let turn = 0.15;
	if (t >= 2 && t < 4) {
		expression = 'feliz';
		pose = {...pose2D('point'), armR: [92 + Math.sin(t * 6) * 3, 0]};
		turn = 0.35;
	} else if (t >= 4 && t < IMPACT) {
		expression = 'neutro';
		turn = 0.6 * sr(t, 4.2, 4.8); // olha para a estrada
	} else if (t >= IMPACT && t < 8) {
		expression = 'susto';
		pose = {...pose2D('armsUp'), hop: 6 * Math.max(0, Math.sin(clamp(hit / 0.3) * Math.PI))};
		turn = 0.5;
	} else if (t >= 8) {
		expression = 'deboche';
		pose = {...pose2D('crossArms'), headTilt: -4 + 3 * sr(t, 8.0, 8.6)};
		turn = 0.1;
	}
	const blink = (t > 1.3 && t < 1.42) || (t > 9.6 && t < 9.72) ? 1 : 0;
	const mouthOpen = expression === 'susto' ? 0.8 : talk(t, 8.1, 9.9) + talk(t, 2.2, 4.0) * 0.8;

	return (
		<AbsoluteFill style={{backgroundColor: PALETTE.skyHorizon}}>
			<ThreeCanvas width={width} height={height} shadows={{enabled: true, type: THREE.PCFShadowMap}} dpr={1} gl={{antialias: false, powerPreference: 'high-performance'}}>
				<CameraRig shots={SHOTS} shakes={SHAKES} />
				<Lighting preset="dia" focus={[ZE[0] + 1, 0, ZE[2] - 2]} shadowExtent={14} />

				<Ground roadHalfWidth={3.5} fieldBounds={[-500, -14, -700, -34]} />
				<Road halfWidth={3.5} />
				<Grass center={[ZE[0] + 1.2, ZE[2] + 1]} radius={12} count={24000} height={0.075} roadHalf={3.95} exclude={[[ZE[0] - 0.4, ZE[0] + 0.4, ZE[2] - 0.3, ZE[2] + 0.3]]} />
				<Fence from={[5.4, 14]} to={[5.4, -260]} />
				<Tree position={[-10.5, 0, -24]} height={7.5} seed={8} />
				<Tree position={[9.5, 0, -48]} height={6.5} seed={3} />

				{/* Placa-gag: tomba com o impacto (pivô na base) */}
				<group position={[SIGN.x, 0, SIGN.z]} rotation={[0, SIGN.rotY, 0]}>
					<group rotation={[0.22 * fall, 0, -0.14 * fall]}>
						<group visible={!zeroed}>
							<Sign lines={signLines('7', false)} width={1.3} height={1.05} elevation={0.95} posts={1} />
						</group>
						<group visible={zeroed}>
							<Sign lines={signLines('0', true)} width={1.3} height={1.05} elevation={0.95} posts={1} />
						</group>
					</group>
				</group>
				<Debris t={hit} origin={[SIGN.x, 0.95, SIGN.z + 0.1]} />
				<Sparks t={hit} position={[SIGN.x, 0.95, SIGN.z + 0.05]} count={50} speed={4} life={0.6} />

				<Character2D
					outfit={CAST.ze.outfit}
					scale={CAST.ze.escala}
					expression={expression}
					pose={pose}
					turn={turn}
					light={-1}
					tint={DAY_TINT}
					shadowYaw={SUN_AZ}
					blink={blink}
					mouthOpen={mouthOpen}
					position={ZE}
				/>

				<group position={[car.x, bounce, car.z]} rotation={[-bounce * 0.6, yaw, 0]}>
					<Car color={PALETTE.yellow} distance={car.dist} />
				</group>
			</ThreeCanvas>

			<Captions words={WORDS} captionY={CAPTION_Y[index]} highlight={['pá', 'zero']} />
			{qc && <SafeAreaGuides />}
		</AbsoluteFill>
	);
};
