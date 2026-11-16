// Cena de teste do estilo: estrada reta no campo, árvore solitária, Zé (boné vermelho)
// sentado na grama, placa "DAYS SINCE LAST CRASH: 7" e um carro passando.
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Character, getPose, HEAD_HEIGHT} from '../components/Character';
import {CAST} from '../characters';
import {Lighting} from '../components/Lighting';
import {CameraRig, Shot, Shake, activeShot} from '../components/CameraRig';
import {Captions, SafeAreaGuides} from '../components/Captions';
import {Car, DaysSinceSign, Fence, Grass, Ground, Road, Tree} from '../components/scenery';
import {sr} from '../style/easing';
import {PALETTE, REF} from '../style/constants';

/* Layout do mundo (m). Estrada ao longo de Z, câmera olhando para -Z. */
const ZE = {pos: [-4.9, 0, -6.2] as [number, number, number], facing: 38};
const HEAD: [number, number, number] = [ZE.pos[0], HEAD_HEIGHT.sit, ZE.pos[2]];
const SIGN = {pos: [-4.2, 0, -8.6] as [number, number, number], rotY: 0.42};
const CAR = {x: -1.75, z0: -52, speed: 22}; // m/s (~80 km/h), sentido +Z (vem até a câmera)

export const TEST_SCENE_FRAMES = 120;

// Planos com os VALORES DE REFERÊNCIA (STYLE_GUIDE §10). Corte a cada 1,5 s.
const SHOTS: Shot[] = [
	// 0-44: estabelecimento — câmera a 3,5 m, assunto a ~12 m; estrada e cerca como linhas guia
	{from: 0, durationInFrames: 45, position: [-2.4, REF.camera.establishing.height, 5.5], target: [-4.0, 0.9, -8.0], move: 'pushIn'},
	// 45-89: médio — 1,2 m de altura, personagem a 3,5 m; carro passa no fundo
	{from: 45, durationInFrames: 45, preset: 'medio', subject: HEAD, facing: ZE.facing, angle: -62, aim: [0.15, 0.42, 0], move: 'pushIn'},
	// 90-119: close de reação — 1,0 m, FOV 40°, rosto ~40% do quadro
	{from: 90, durationInFrames: 30, preset: 'close', subject: HEAD, facing: ZE.facing, angle: 4, move: 'pushIn', amount: 0.05},
];

/** captionY por plano (STYLE_GUIDE §8/§10): 30% no aberto (ação embaixo), 20% no médio (acima da placa),
 *  (18% no aberto: acima da copa da árvore) 80% no close (abaixo do queixo — a legenda nunca cobre o rosto). */
const CAPTION_Y = [0.18, 0.2, 0.8];

// Shake curto quando o carro passa raspando a câmera do plano médio.
const SHAKES: Shake[] = [{frame: 66, seed: 4}];

export const TestScene: React.FC<{qc?: boolean}> = ({qc = false}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const t = frame / fps;
	const carZ = CAR.z0 + CAR.speed * t;
	const {index} = activeShot(SHOTS, frame);

	// Antecipação → ação → reação: neutro enquanto o carro vem, deboche depois que passa.
	const expression = frame < 72 ? 'neutro' : 'deboche';
	// Cabeça acompanha o carro e volta para a câmera.
	const pose = getPose('sit', t);
	pose.headYaw = 40 * sr(frame, 48, 58) * (1 - sr(frame, 64, 76)) - 6 * sr(frame, 76, 90);
	pose.headTilt = 4 * sr(frame, 74, 86);
	const blink = frame >= 104 && frame <= 107 ? 1 - Math.abs(frame - 105.5) / 2 : 0;

	return (
		<AbsoluteFill style={{backgroundColor: PALETTE.skyHorizon}}>
			<ThreeCanvas width={width} height={height} shadows={{enabled: true, type: THREE.PCFShadowMap}} dpr={1} gl={{antialias: false, powerPreference: 'high-performance'}}>
				<CameraRig shots={SHOTS} shakes={SHAKES} />
				<Lighting preset="dia" focus={[ZE.pos[0], 0, ZE.pos[2] - 2]} shadowExtent={16} />

				<Ground roadHalfWidth={3.5} fieldBounds={[-500, -14, -700, -34]} />
				<Road halfWidth={3.5} />
				<Grass center={[ZE.pos[0] + 0.5, ZE.pos[2] + 2]} radius={13} count={26000} height={0.075} roadHalf={3.95} exclude={[[ZE.pos[0] - 0.55, ZE.pos[0] + 0.75, ZE.pos[2] - 0.5, ZE.pos[2] + 0.7]]} />
				<Fence from={[5.4, 14]} to={[5.4, -260]} />
				<Tree position={[-9.5, 0, -27]} height={7.5} seed={8} />

				<DaysSinceSign days={7} position={SIGN.pos} rotation={[0, SIGN.rotY, 0]} elevation={0.6} width={1.3} height={1.0} />

				<Character outfit={CAST.ze.outfit} pose={pose} expression={expression} blink={blink} position={ZE.pos} rotation={[0, THREE.MathUtils.degToRad(ZE.facing), 0]} />

				<Car color={PALETTE.yellow} position={[CAR.x, 0, carZ]} distance={carZ - CAR.z0} />
			</ThreeCanvas>

			<Captions src="timestamps/test.json" captionY={CAPTION_Y[index]} />
			{qc && <SafeAreaGuides />}
		</AbsoluteFill>
	);
};
