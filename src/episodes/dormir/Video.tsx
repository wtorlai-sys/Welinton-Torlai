// Episódio "Dormir no mesmo lugar" — vídeo completo (82 s), cronometrado pela narração.
// Cada plano = <Sequence> com set + luz + câmera + elenco 2D; legenda e áudio são globais.
// Tudo dirigido por frame (determinístico). STYLE_GUIDE: cortes a cada 1,5–3 s.
import React, {createContext, useContext, useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Sequence, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Pose2D, pose2D} from '../../components/Character2D';
import {CAST} from '../../characters';
import {Glow, Lighting, LightingPreset} from '../../components/Lighting';
import {CameraRig, Shake, Shot} from '../../components/CameraRig';
import {Captions} from '../../components/Captions';
import {parseTimestamps, Word} from '../../lib/timestamps';
import {PALETTE} from '../../style/constants';
import {clamp, sr} from '../../style/easing';
import {hash1} from '../../style/random';
import {makeEmissiveMaterial} from '../../style/materials';
import {BED_TOP, Bedroom2, Kitchen2, Street2, WallPlaque} from './sets';
import {C2, DaySun, KitchenSun, MoonShaft, PUSH_R} from './Storyboard';
import {NARRATION} from './Storyboard';

export const DORMIR_FPS = 30;
export const DORMIR_FRAMES = Math.ceil(NARRATION.seconds * DORMIR_FPS);

/* ------------------------------------------------------------------ */
/* Tempo, fala e piscadas                                              */
/* ------------------------------------------------------------------ */

const WordsCtx = createContext<Word[]>([]);

/** Abertura da boca: fala se T estiver dentro de uma palavra entre [from, to]. */
const useTalk = () => {
	const words = useContext(WordsCtx);
	return (T: number, from: number, to: number) => {
		if (T < from || T > to) return 0;
		const w = words.find((x) => T >= x.start && T <= x.end + 0.04);
		if (!w) return 0;
		return 0.35 + 0.65 * Math.abs(Math.sin((T - w.start) * 17));
	};
};

/** Piscada determinística (2–3 frames) a cada ~3 s, com fase por personagem. */
const blinkAt = (T: number, seed: number) => {
	const period = 2.8 + hash1(seed) * 1.6;
	const ph = (T + hash1(seed + 7) * period) % period;
	return ph < 0.1 ? 1 - Math.abs(ph - 0.05) / 0.05 : 0;
};

/** Contexto de cada plano: tempo local (s) e global (s). */
type SceneProps = {t: number; T: number};

type Plan = {
	start: number;
	end: number;
	light: LightingPreset;
	sun?: {az: number; el: number};
	focus?: [number, number, number];
	cam: Omit<Shot, 'from' | 'durationInFrames'>;
	shakes?: {at: number; intensity?: number}[];
	captionY: number;
	Scene: React.FC<SceneProps>;
};

/* ------------------------------------------------------------------ */
/* Peças recorrentes                                                   */
/* ------------------------------------------------------------------ */

const NIGHT_TINT = '#C9CCE6';
const DAY_TINT = '#FFF6EA';

/** Robertos na cama de casal (Bedroom2 padrão). */
const ROB_SLEEP: [number, number, number] = [-0.474, 0, -1.0];
const CLONE_SIT: [number, number, number] = [-0.03, BED_TOP - 0.02, -0.82];
/** Cama de solteiro (centro x = -0.3). */
const SINGLE_SLEEP: [number, number, number] = [-0.3, 0, -1.0];

/** Deitado com a cabeça no travesseiro. `drop` depende da escala (adulto 34, Zé 24, Nina 10). */
const sleepPose = (T: number, tilt = -16, drop = 34): Pose2D => ({...pose2D('sitBed'), drop: drop + Math.sin(T * 1.6) * 0.6, headTilt: tilt, armL: [5, 0], armR: [5, 0]});

/** Lâmpada de "ideia" acima da cabeça. */
const IdeaBulb: React.FC<{position: [number, number, number]; s: number}> = ({position, s}) =>
	s <= 0 ? null : (
		<group position={position} scale={0.06 * s}>
			<Glow>
				<mesh material={makeEmissiveMaterial('#FFE27A', 5)}>
					<sphereGeometry args={[1, 20, 14]} />
				</mesh>
			</Glow>
			<mesh position={[0, -1.15, 0]}>
				<cylinderGeometry args={[0.45, 0.45, 0.6, 12]} />
				<meshStandardMaterial color="#9AA1A8" metalness={0.7} roughness={0.35} />
			</mesh>
		</group>
	);

const lerpHex = (a: string, b: string, k: number) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), Math.round(clamp(k) * 10) / 10).getHexString();

/* ------------------------------------------------------------------ */
/* Roteiro de planos                                                   */
/* ------------------------------------------------------------------ */

const NIGHT_SUN = {az: 155, el: 34};
const DAY_SUN = {az: 155, el: 40};
const KIT_SUN = {az: 200, el: 40};
const BED_FOCUS: [number, number, number] = [-0.3, 0, -0.6];
const P1_CAM = {position: [-0.24, 1.0, 0.85] as [number, number, number], target: [-0.25, 0.52, -0.95] as [number, number, number], fov: 52};
const NINA_ROOM = {wallpaper: ['#8E6FD6', '#A88BE8'] as [string, string], duvet: '#2BA59B', bedWidth: 1.0, lampOn: false, curtain: '#2BA59B', rug: '#6FA8DC'};

const PLANS: Plan[] = [
	// 0 — "Nesse mundo, se você dormir duas vezes no mesmo lugar," : a cópia surge
	{
		start: 0,
		end: 1.8,
		light: 'noite',
		sun: NIGHT_SUN,
		focus: BED_FOCUS,
		cam: {...P1_CAM, move: 'pushIn', amount: 0.06},
		captionY: 0.8,
		Scene: ({t, T}) => (
			<>
				<Bedroom2 lumps={[{x: -0.3, len: 1.3}, {x: 0.45, len: 0.9}]} />
				<C2 who="roberto" expression="dormindo" pose={sleepPose(T)} position={ROB_SLEEP} light={1} tint={NIGHT_TINT} />
				<C2 who="roberto" expression="sinistro" pose={{...pose2D('sitBed'), drop: 30 + 26 * (1 - sr(t, 0, 0.7)), armL: [18, 35], armR: [18, 35]}} position={CLONE_SIT} turn={-0.25} light={1} tint={NIGHT_TINT} shadowYaw={155} blink={blinkAt(T, 2)} />
				<WallPlaque lines={['NOITE Nº', '2']} sizes={[0.3, 0.5]} red={1} position={[-0.5, 0.95, -1.19]} width={0.3} height={0.26} />
				<MoonShaft />
			</>
		),
	},
	// 1 — close na cópia
	{
		start: 1.8,
		end: 3.6,
		light: 'noite',
		sun: NIGHT_SUN,
		focus: BED_FOCUS,
		cam: {position: [-0.02, 0.86, -0.1], target: [-0.03, 0.84, -0.82], fov: 40, move: 'pushIn', amount: 0.1},
		captionY: 0.82,
		Scene: ({T}) => (
			<>
				<Bedroom2 lumps={[{x: -0.3, len: 1.3}, {x: 0.45, len: 0.9}]} />
				<C2 who="roberto" expression="sinistro" pose={{...pose2D('sitBed'), armL: [18, 35], armR: [18, 35], headTilt: Math.sin(T * 2) * 2}} position={CLONE_SIT} turn={-0.15} light={1} tint={NIGHT_TINT} blink={blinkAt(T, 2)} />
				<MoonShaft />
			</>
		),
	},
	// 2 — "uma cópia sua vai aparecer" : a cópia olha para o dorminhoco
	{
		start: 3.6,
		end: 5.6,
		light: 'noite',
		sun: NIGHT_SUN,
		focus: BED_FOCUS,
		cam: {position: [0.55, 0.95, 0.5], target: [-0.3, 0.5, -0.9], fov: 50, move: 'orbit', amount: 8},
		captionY: 0.8,
		Scene: ({T}) => (
			<>
				<Bedroom2 lumps={[{x: -0.3, len: 1.3}, {x: 0.45, len: 0.9}]} />
				<C2 who="roberto" expression="dormindo" pose={sleepPose(T)} position={ROB_SLEEP} light={1} tint={NIGHT_TINT} />
				<C2 who="roberto" expression="sinistro" pose={{...pose2D('sitBed'), armL: [70, 20], armR: [18, 35], headTilt: -8}} position={CLONE_SIT} turn={-0.7} light={1} tint={NIGHT_TINT} shadowYaw={155} blink={blinkAt(T, 2)} />
				<MoonShaft />
			</>
		),
	},
	// 3 — "e ela pode roubar sua vida!" : close no dorminhoco, a mão da cópia entra
	{
		start: 5.6,
		end: 7.6,
		light: 'noite',
		sun: NIGHT_SUN,
		focus: BED_FOCUS,
		cam: {position: [-0.42, 0.66, -0.38], target: [-0.47, 0.5, -1.0], fov: 42, move: 'pushIn', amount: 0.08},
		shakes: [{at: 6.2, intensity: 0.03}],
		captionY: 0.2,
		Scene: ({T}) => (
			<>
				<Bedroom2 lumps={[{x: -0.3, len: 1.3}, {x: 0.45, len: 0.9}]} />
				<C2 who="roberto" expression="dormindo" pose={sleepPose(T)} position={ROB_SLEEP} light={1} tint={NIGHT_TINT} mouthOpen={0.3 + 0.3 * Math.sin(T * 3)} />
				<C2 who="roberto" expression="sinistro" pose={{...pose2D('sitBed'), armL: [80 + 15 * sr(T, 5.8, 6.4), 10], armR: [18, 35]}} position={CLONE_SIT} turn={-0.7} light={1} tint={NIGHT_TINT} />
				<MoonShaft />
			</>
		),
	},
	// 4 — "Foi exatamente o que aconteceu com o Sr. Roberto." : noite 1, Roberto feliz e sozinho
	{
		start: 7.6,
		end: 10.6,
		light: 'noite',
		sun: NIGHT_SUN,
		focus: BED_FOCUS,
		cam: {...P1_CAM, move: 'pullOut', amount: 0.08},
		captionY: 0.8,
		Scene: ({T}) => (
			<>
				<Bedroom2 lumps={[{x: -0.3, len: 1.3}]} />
				<C2 who="roberto" expression="dormindo" pose={sleepPose(T, -10)} position={ROB_SLEEP} light={1} tint={NIGHT_TINT} mouthOpen={0.2 + 0.2 * Math.sin(T * 2.4)} />
				<WallPlaque lines={['NOITE Nº', '1']} sizes={[0.3, 0.5]} position={[-0.5, 0.95, -1.19]} width={0.3} height={0.26} />
				<MoonShaft />
			</>
		),
	},
	// 5 — "Ele dormiu duas noites na mesma cama," : a placa vira de 1 para 2
	{
		start: 10.6,
		end: 13.1,
		light: 'noite',
		sun: NIGHT_SUN,
		focus: BED_FOCUS,
		cam: {position: [-0.42, 0.98, -0.45], target: [-0.5, 0.98, -1.19], fov: 45, move: 'pushIn', amount: 0.1},
		shakes: [{at: 11.75, intensity: 0.025}],
		captionY: 0.8,
		Scene: ({T}) => (
			<>
				<Bedroom2 lumps={[{x: -0.3, len: 1.3}]} />
				<C2 who="roberto" expression="dormindo" pose={sleepPose(T, -10)} position={ROB_SLEEP} light={1} tint={NIGHT_TINT} />
				{T < 11.72 ? (
					<WallPlaque key="n1" lines={['NOITE Nº', '1']} sizes={[0.3, 0.5]} position={[-0.5, 0.95, -1.19]} width={0.3} height={0.26} />
				) : (
					<WallPlaque key="n2" lines={['NOITE Nº', '2']} sizes={[0.3, 0.5]} red={1} position={[-0.5, 0.95, -1.19]} width={0.3} height={0.26} />
				)}
				<MoonShaft />
			</>
		),
	},
	// 6 — "e na manhã seguinte..." : Roberto acorda espreguiçando
	{
		start: 13.1,
		end: 14.9,
		light: 'dia',
		sun: DAY_SUN,
		focus: BED_FOCUS,
		cam: {...P1_CAM, move: 'pushIn', amount: 0.05},
		captionY: 0.8,
		Scene: ({t, T}) => (
			<>
				<Bedroom2 lampOn={false} lumps={[{x: -0.3, len: 1.3}, {x: 0.45, len: 1.3}]} />
				<C2 who="roberto" expression="feliz" pose={{...pose2D('sitBed'), drop: 34 - 6 * sr(t, 0, 0.6), armL: [150 * sr(t, 0.2, 0.9), 10], armR: [150 * sr(t, 0.2, 0.9), 10]}} position={ROB_SLEEP} light={1} tint={DAY_TINT} mouthOpen={0.8 * sr(t, 0.3, 0.8)} />
				<DaySun />
			</>
		),
	},
	// 7 — "...encontrou outro Roberto dormindo ao seu lado." : aéreo
	{
		start: 14.9,
		end: 16.9,
		light: 'dia',
		sun: {az: 155, el: 50},
		focus: BED_FOCUS,
		cam: {preset: 'aereo', subject: [-0.3, 0, -0.62], height: 2.5, dist: 89, fov: 50, move: 'pushIn', amount: 0.1},
		shakes: [{at: 15.0, intensity: 0.03}],
		captionY: 0.18,
		Scene: ({T}) => (
			<>
				<Bedroom2 ceiling={false} lampOn={false} folded={0.5} />
				<C2 who="roberto" expression="susto" pose="lie" flat position={[-0.52, BED_TOP + 0.06, -0.68]} light={1} />
				<C2 who="roberto" expression="dormindo" pose="lie" flat position={[-0.08, BED_TOP + 0.06, -0.68]} light={1} mouthOpen={0.3 + 0.3 * Math.sin(T * 2.4)} />
			</>
		),
	},
	// 8 — "E sabe o pior?" : close Roberto em choque
	{
		start: 16.9,
		end: 18.4,
		light: 'dia',
		sun: DAY_SUN,
		focus: BED_FOCUS,
		cam: {position: [-0.4, 0.68, -0.25], target: [-0.47, 0.6, -1.0], fov: 42, move: 'pushIn', amount: 0.1},
		captionY: 0.82,
		Scene: ({T}) => (
			<>
				<Bedroom2 lampOn={false} lumps={[{x: -0.3, len: 1.3}]} />
				<C2 who="roberto" expression="susto" pose={{...pose2D('sitBed'), drop: 26, armL: [40, 80], armR: [40, 80]}} position={ROB_SLEEP} light={1} tint={DAY_TINT} blink={blinkAt(T, 1)} />
				<DaySun />
			</>
		),
	},
	// 9 — "O outro foi trabalhar no lugar dele." : o clone sai de camisa e gravata
	{
		start: 18.4,
		end: 20.4,
		light: 'dia',
		focus: [0.5, 0, 0.5],
		cam: {position: [1.45, 1.15, 4.3], target: [0.75, 0.7, -0.3], fov: 52, move: 'truck', amount: 0.5},
		captionY: 0.2,
		Scene: ({t, T}) => (
			<>
				<Street2 />
				<C2 who="roberto" expression="susto" pose="shrug" position={[0, 0.1, -0.88]} light={-1} shadowYaw={-45} blink={blinkAt(T, 1)} />
				<C2 who="roberto" outfit={CAST.roberto.variantes.trabalho} expression="feliz" pose="walk" t={t} position={[0.8 + t * 0.45, 0, 1.4 + t * 0.15]} turn={0.5} light={-1} hold="briefcase" shadowYaw={-45} />
			</>
		),
	},
	// 10 — "Por isso ninguém dorme..." : grua sobre a rua
	{
		start: 20.4,
		end: 22.0,
		light: 'dia',
		focus: [0.5, 0, 1],
		cam: {position: [0.4, 1.4, 5.2], target: [0.8, 0.5, 0.5], fov: 55, move: 'crane', amount: 1.4},
		captionY: 0.2,
		Scene: ({t}) => (
			<>
				<Street2 />
				<C2 who="roberto" outfit={CAST.roberto.variantes.trabalho} expression="feliz" pose="walk" t={t + 2} position={[0.3 + t * 0.45, 0, 2.2 + t * 0.1]} turn={0.5} light={-1} hold="briefcase" shadowYaw={-45} />
			</>
		),
	},
	// 11 — "...no mesmo lugar duas vezes." : placa-regra sobre a cama vazia
	{
		start: 22.0,
		end: 23.7,
		light: 'dia',
		sun: DAY_SUN,
		focus: BED_FOCUS,
		cam: {position: [-0.28, 0.85, 0.7], target: [-0.3, 0.8, -1.19], fov: 50, move: 'pushIn', amount: 0.12},
		captionY: 0.82,
		Scene: () => (
			<>
				<Bedroom2 lampOn={false} folded={0} />
				<WallPlaque lines={['PROIBIDO DORMIR', '2X', 'NO MESMO LUGAR']} sizes={[0.2, 0.36, 0.2]} red={1} position={[-0.3, 0.86, -1.19]} width={0.5} height={0.34} />
				<DaySun />
			</>
		),
	},
	// 12 — "Mas minha irmã Nina, de 8 anos," : Zé apresenta (narrador)
	{
		start: 23.7,
		end: 25.3,
		light: 'dia',
		sun: DAY_SUN,
		focus: BED_FOCUS,
		cam: {position: [0.12, 0.72, 1.25], target: [0.05, 0.62, -0.2], fov: 50, move: 'pushIn', amount: 0.06},
		captionY: 0.2,
		Scene: ({T}) => {
			const talk = useTalk();
			return (
				<>
					<Bedroom2 {...NINA_ROOM} />
					<C2 who="ze" expression="deboche" pose={{...pose2D('stand'), armL: [60, 100]}} position={[0.18, 0, 0.4]} turn={-0.2} light={1} tint={DAY_TINT} mouthOpen={talk(T, 23.7, 25.3)} blink={blinkAt(T, 3)} shadowYaw={155} />
					<C2 who="nina" expression="bravo" pose="crossArms" position={[-0.4, 0, -0.05]} light={1} tint={DAY_TINT} blink={blinkAt(T, 4)} shadowYaw={155} />
					<DaySun />
				</>
			);
		},
	},
	// 13 — "...odeia mudar de cama." : contra-plongée da Nina
	{
		start: 25.3,
		end: 27.3,
		light: 'dia',
		sun: DAY_SUN,
		focus: BED_FOCUS,
		cam: {position: [-0.18, 0.5, 1.35], target: [-0.3, 0.62, -0.6], fov: 52, move: 'pushIn', amount: 0.08},
		captionY: 0.82,
		Scene: ({T}) => (
			<>
				<Bedroom2 {...NINA_ROOM} />
				<C2 who="nina" expression="bravo" pose="crossArms" position={[-0.3, 0, 0.22]} light={1} tint={DAY_TINT} blink={blinkAt(T, 4)} shadowYaw={155} />
				<WallPlaque lines={['CAMA DA NINA', 'NÃO MEXA']} sizes={[0.26, 0.36]} red={1} position={[0.02, 1.0, -1.19]} width={0.4} height={0.22} />
				<DaySun />
			</>
		),
	},
	// 14 — "Eu quero dormir na minha cama." : Nina fala (close) e bate o pé
	{
		start: 27.3,
		end: 29.1,
		light: 'dia',
		sun: DAY_SUN,
		focus: BED_FOCUS,
		cam: {position: [-0.26, 0.56, 0.95], target: [-0.3, 0.58, 0.22], fov: 42},
		shakes: [{at: 28.75, intensity: 0.02}],
		captionY: 0.84,
		Scene: ({T}) => {
			const talk = useTalk();
			return (
				<>
					<Bedroom2 {...NINA_ROOM} />
					<C2 who="nina" expression="bravo" pose={{...pose2D('crossArms'), hop: T > 28.7 && T < 28.9 ? 2.5 : 0}} position={[-0.3, 0, 0.22]} light={1} tint={DAY_TINT} mouthOpen={talk(T, 27.3, 29.1)} shadowYaw={155} />
					<DaySun />
				</>
			);
		},
	},
	// 15 — "Minha mãe sempre mudava os móveis de lugar" : a cama desliza
	{
		start: 29.1,
		end: 31.1,
		light: 'dia',
		sun: DAY_SUN,
		focus: [-0.2, 0, -0.4],
		cam: {position: [-0.05, 0.95, 1.65], target: [-0.1, 0.55, -0.5], fov: 52},
		captionY: 0.84,
		Scene: ({t, T}) => {
			const k = sr(t, 0.1, 1.8);
			return (
				<>
					<Bedroom2 {...NINA_ROOM} bedOffset={[0.55 * k, 0.35 * k]} bedRot={0.3 * k} dragMarks={k > 0.3} />
					<C2 who="mae" expression="bravo" pose={{...PUSH_R, legL: [20 + Math.sin(t * 9) * 6, 0], legR: [-6 - Math.sin(t * 9) * 6, 12]}} position={[-0.62 + 0.33 * k, 0, -0.05 + 0.2 * k]} turn={0.6} light={1} tint={DAY_TINT} blink={blinkAt(T, 5)} shadowYaw={155} />
					<WallPlaque lines={['CAMA MUDADA', 'DE LUGAR:', '364 VEZES']} sizes={[0.2, 0.2, 0.3]} red={2} position={[-0.62, 0.95, -1.19]} width={0.4} height={0.3} />
					<DaySun />
				</>
			);
		},
	},
	// 16 — "...para enganar a regra." : contador vira 365
	{
		start: 31.1,
		end: 33.0,
		light: 'dia',
		sun: DAY_SUN,
		focus: [-0.2, 0, -0.4],
		cam: {position: [-0.5, 0.92, -0.35], target: [-0.6, 0.98, -1.19], fov: 45, move: 'pushIn', amount: 0.08},
		shakes: [{at: 32.0, intensity: 0.02}],
		captionY: 0.82,
		Scene: ({T}) => (
			<>
				<Bedroom2 {...NINA_ROOM} bedOffset={[0.55, 0.35]} bedRot={0.3} dragMarks />
				<C2 who="mae" expression={T > 32.0 ? 'feliz' : 'neutro'} pose="handsHips" position={[-0.3, 0, -0.55]} turn={-0.3} light={1} tint={DAY_TINT} blink={blinkAt(T, 5)} />
				{T < 31.95 ? (
					<WallPlaque key="364" lines={['CAMA MUDADA', 'DE LUGAR:', '364 VEZES']} sizes={[0.2, 0.2, 0.3]} red={2} position={[-0.62, 0.95, -1.19]} width={0.4} height={0.3} />
				) : (
					<WallPlaque key="365" lines={['CAMA MUDADA', 'DE LUGAR:', '365 VEZES']} sizes={[0.2, 0.2, 0.3]} red={2} position={[-0.62, 0.95, -1.19]} width={0.4} height={0.3} />
				)}
				<DaySun />
			</>
		),
	},
	// 17 — "Até que, numa quinta-feira," : calendário
	{
		start: 33.0,
		end: 34.3,
		light: 'dia',
		sun: KIT_SUN,
		focus: [0, 0, 0],
		cam: {position: [0.52, 0.93, -0.55], target: [0.56, 0.955, -1.19], fov: 42, move: 'pushIn', amount: 0.15},
		captionY: 0.8,
		Scene: () => (
			<>
				<Kitchen2 />
				<WallPlaque lines={['QUINTA', 'FEIRA']} sizes={[0.36, 0.36]} red={0} position={[0.56, 0.86, -1.19]} width={0.24} height={0.19} />
				<KitchenSun />
			</>
		),
	},
	// 18 — "esqueceu." : Nina dorme na MESMA cama (noite 2)
	{
		start: 34.3,
		end: 35.7,
		light: 'noite',
		sun: NIGHT_SUN,
		focus: BED_FOCUS,
		cam: {position: [-0.3, 0.95, 0.75], target: [-0.3, 0.55, -0.95], fov: 50, move: 'pushIn', amount: 0.08},
		captionY: 0.8,
		Scene: ({T}) => (
			<>
				<Bedroom2 {...NINA_ROOM} lampOn lumps={[{x: 0, len: 1.0}]} />
				<C2 who="nina" expression="dormindo" pose={sleepPose(T, -12, 10)} position={SINGLE_SLEEP} light={1} tint={NIGHT_TINT} />
				<WallPlaque lines={['NOITE Nº', '2']} sizes={[0.3, 0.5]} red={1} position={[0.02, 1.0, -1.19]} width={0.3} height={0.26} />
				<MoonShaft />
			</>
		),
	},
	// 19 — "Na manhã seguinte, encontrei Nina tomando leite na cozinha." : aberto
	{
		start: 35.7,
		end: 37.5,
		light: 'dia',
		sun: KIT_SUN,
		focus: [0, 0, 0],
		cam: {position: [0.12, 0.95, 2.3], target: [0.12, 0.52, 0.0], fov: 52, move: 'pushIn', amount: 0.06},
		captionY: 0.2,
		Scene: ({t, T}) => (
			<>
				<Kitchen2 />
				<C2 who="nina" expression="neutro" pose="drink" hold="glass" position={[0.22, 0, 0.45]} turn={-0.25} light={-1} shadowYaw={200} blink={blinkAt(T, 4)} />
				<C2 who="ze" expression="deboche" pose="walk" t={t} position={[-0.6 + 0.4 * sr(t, 0, 1.2), 0, 0.85]} turn={0.45} light={-1} shadowYaw={200} />
				<KitchenSun />
			</>
		),
	},
	// 20 — close: Nina bebendo
	{
		start: 37.5,
		end: 39.2,
		light: 'dia',
		sun: KIT_SUN,
		focus: [0, 0, 0],
		cam: {position: [0.18, 0.6, 1.15], target: [0.22, 0.58, 0.45], fov: 42, move: 'pushIn', amount: 0.06},
		captionY: 0.84,
		Scene: ({T}) => (
			<>
				<Kitchen2 />
				<C2 who="nina" expression={T < 38.6 ? 'neutro' : 'feliz'} pose="drink" hold="glass" position={[0.22, 0, 0.45]} turn={-0.25} light={-1} blink={blinkAt(T, 4)} />
				<KitchenSun />
			</>
		),
	},
	// 21 — "Mas tinha outra Nina dormindo no quarto." : Zé encontra a outra
	{
		start: 39.2,
		end: 41.5,
		light: 'dia',
		sun: DAY_SUN,
		focus: BED_FOCUS,
		cam: {position: [0.3, 0.8, 1.2], target: [-0.3, 0.5, -0.9], fov: 50},
		shakes: [{at: 40.3, intensity: 0.035}],
		captionY: 0.2,
		Scene: ({T}) => (
			<>
				<Bedroom2 {...NINA_ROOM} lumps={[{x: 0, len: 1.0}]} />
				<C2 who="nina" expression="dormindo" pose={sleepPose(T, -12, 10)} position={SINGLE_SLEEP} light={1} tint={DAY_TINT} />
				<C2 who="ze" expression={T < 40.3 ? 'neutro' : 'susto'} pose={T < 40.3 ? 'stand' : 'armsUp'} position={[0.2, 0, 0.15]} turn={-0.6} light={1} tint={DAY_TINT} shadowYaw={155} blink={blinkAt(T, 3)} />
				<DaySun />
			</>
		),
	},
	// 22 — "Duas Ninas!"
	{
		start: 41.5,
		end: 43.2,
		light: 'dia',
		sun: KIT_SUN,
		focus: [0, 0, 0.3],
		cam: {position: [0.0, 1.0, 2.9], target: [0.0, 0.46, 0.45], fov: 52, move: 'pushIn', amount: 0.06},
		shakes: [{at: 41.75, intensity: 0.04}],
		captionY: 0.18,
		Scene: ({T}) => (
			<>
				<Kitchen2 />
				<C2 who="nina" expression="bravo" pose="point" position={[-0.2, 0, 0.5]} turn={0.5} light={-1} shadowYaw={200} blink={blinkAt(T, 4)} />
				<C2 who="nina" expression="bravo" pose="point" flip position={[0.2, 0, 0.5]} turn={0.5} light={-1} shadowYaw={200} blink={blinkAt(T, 6)} />
				<C2 who="pai" expression="susto" pose="shrug" position={[-0.36, 0, 1.15]} turn={0.4} light={-1} shadowYaw={200} />
				<C2 who="ze" expression="susto" pose="armsUp" position={[0.36, 0, 1.2]} turn={-0.4} light={-1} shadowYaw={200} />
				<KitchenSun />
			</>
		),
	},
	// 23 — "E as duas diziam ser a verdadeira!" : close nas duas falando
	{
		start: 43.2,
		end: 45.1,
		light: 'dia',
		sun: KIT_SUN,
		focus: [0, 0, 0.3],
		cam: {position: [0.0, 0.6, 1.3], target: [0.0, 0.56, 0.5], fov: 45},
		captionY: 0.84,
		Scene: ({T}) => {
			const talk = useTalk();
			return (
				<>
					<Kitchen2 />
					<C2 who="nina" expression="bravo" pose="point" position={[-0.2, 0, 0.5]} turn={0.5} light={-1} mouthOpen={talk(T, 43.2, 45.1)} />
					<C2 who="nina" expression="bravo" pose="point" flip position={[0.2, 0, 0.5]} turn={0.5} light={-1} mouthOpen={talk(T + 0.12, 43.2, 45.1)} />
					<KitchenSun />
				</>
			);
		},
	},
	// 24 — "Meu pai teve uma ideia." : lâmpada acende
	{
		start: 45.1,
		end: 46.6,
		light: 'dia',
		sun: KIT_SUN,
		focus: [0, 0, 0.3],
		cam: {position: [-0.3, 0.86, 1.95], target: [-0.36, 0.86, 1.15], fov: 45, move: 'pushIn', amount: 0.06},
		captionY: 0.84,
		Scene: ({T}) => {
			const on = sr(T, 45.9, 46.15);
			return (
				<>
					<Kitchen2 />
					<C2 who="pai" expression={on > 0.5 ? 'feliz' : 'neutro'} pose={on > 0.5 ? {...pose2D('stand'), armR: [165, 0]} : 'stand'} position={[-0.36, 0, 1.15]} turn={0.1} light={-1} blink={blinkAt(T, 7)} />
					<IdeaBulb position={[-0.36, 1.13, 1.16]} s={on} />
					<KitchenSun />
				</>
			);
		},
	},
	// 25 — "Perguntou o que cada uma tinha feito primeiro naquela manhã." : contraplano sobre as Ninas
	{
		start: 46.6,
		end: 50.0,
		light: 'dia',
		sun: KIT_SUN,
		focus: [0, 0, 0.3],
		cam: {position: [0.05, 0.62, 1.7], target: [0.0, 0.62, -0.3], fov: 52, move: 'pushIn', amount: 0.08},
		captionY: 0.2,
		Scene: ({T}) => {
			const talk = useTalk();
			return (
				<>
					<Kitchen2 />
					<C2 who="pai" expression="neutro" pose={{...pose2D('stand'), armR: [60, 40]}} position={[0.0, 0, -0.35]} light={-1} mouthOpen={talk(T, 46.6, 50.0)} blink={blinkAt(T, 7)} />
					<C2 who="nina" expression="neutro" pose="stand" position={[-0.22, 0, 0.75]} light={-1} blink={blinkAt(T, 4)} />
					<C2 who="nina" expression="neutro" pose="stand" position={[0.22, 0, 0.75]} light={-1} blink={blinkAt(T, 6)} />
					<KitchenSun />
				</>
			);
		},
	},
	// 26 — "Fui tomar leite." (Nina A, com o copo)
	{
		start: 50.0,
		end: 51.1,
		light: 'dia',
		sun: KIT_SUN,
		focus: [0, 0, 0.3],
		cam: {position: [-0.18, 0.6, 1.2], target: [-0.2, 0.57, 0.5], fov: 42},
		captionY: 0.84,
		Scene: ({T}) => {
			const talk = useTalk();
			return (
				<>
					<Kitchen2 />
					<C2 who="nina" expression="feliz" pose={{...pose2D('stand'), armR: [30, 120]}} hold="glass" position={[-0.2, 0, 0.5]} turn={0.1} light={-1} mouthOpen={talk(T, 50.0, 51.1)} />
					<KitchenSun />
				</>
			);
		},
	},
	// 27 — "Fui procurar meu irmão." (Nina B)
	{
		start: 51.1,
		end: 52.4,
		light: 'dia',
		sun: KIT_SUN,
		focus: [0, 0, 0.3],
		cam: {position: [0.22, 0.6, 1.2], target: [0.2, 0.57, 0.5], fov: 42},
		captionY: 0.84,
		Scene: ({T}) => {
			const talk = useTalk();
			return (
				<>
					<Kitchen2 />
					<C2 who="nina" expression="neutro" pose="handsHips" position={[0.2, 0, 0.5]} turn={-0.1} light={-1} mouthOpen={talk(T, 51.1, 52.4)} blink={blinkAt(T, 6)} />
					<KitchenSun />
				</>
			);
		},
	},
	// 28 — "Meu pai ficou branco," : literalmente
	{
		start: 52.4,
		end: 53.9,
		light: 'dia',
		sun: KIT_SUN,
		focus: [0, 0, 0.3],
		cam: {position: [-0.32, 0.86, 1.85], target: [-0.36, 0.84, 1.15], fov: 42, move: 'pushIn', amount: 0.1},
		shakes: [{at: 53.2, intensity: 0.04}],
		captionY: 0.84,
		Scene: ({T}) => {
			const k = sr(T, 53.0, 53.5);
			const pai = CAST.pai.outfit;
			return (
				<>
					<Kitchen2 />
					<C2 who="pai" outfit={{...pai, skin: lerpHex('#F6EEDD', '#FFFFFF', k), hair: lerpHex(pai.hair!, '#F4F4F4', k), tie: lerpHex(pai.tie!, '#E8E8E8', k)}} expression="susto" pose="stand" position={[-0.36, 0, 1.15]} light={-1} tint={lerpHex('#FFFFFF', '#F2F6FF', k)} />
					<KitchenSun />
				</>
			);
		},
	},
	// 29 — "porque ele tinha me visto entrando no quarto para acordar Nina." : lembrança
	{
		start: 53.9,
		end: 56.9,
		light: 'dia',
		sun: DAY_SUN,
		focus: BED_FOCUS,
		cam: {position: [0.35, 0.85, 1.3], target: [-0.3, 0.5, -0.8], fov: 50},
		captionY: 0.2,
		Scene: ({t, T}) => (
			<>
				<Bedroom2 {...NINA_ROOM} lumps={[{x: 0, len: 1.0}]} />
				<C2 who="nina" expression="dormindo" pose={sleepPose(T, -12, 10)} position={SINGLE_SLEEP} light={1} tint="#FFE9C8" />
				<C2 who="ze" expression="neutro" pose={t < 2.2 ? 'walk' : 'wave'} t={t} position={[0.55 - 0.55 * sr(t, 0, 2.2), 0, 0.6 - 0.45 * sr(t, 0, 2.2)]} turn={-0.6} light={1} tint="#FFE9C8" shadowYaw={155} blink={blinkAt(T, 3)} />
				<DaySun />
			</>
		),
	},
	// 30 — "Então descobrimos que a Nina do quarto era a verdadeira." : ela acorda
	{
		start: 56.9,
		end: 60.4,
		light: 'dia',
		sun: DAY_SUN,
		focus: BED_FOCUS,
		cam: {position: [-0.25, 0.85, 0.85], target: [-0.3, 0.55, -0.95], fov: 50, move: 'pushIn', amount: 0.08},
		captionY: 0.82,
		Scene: ({t, T}) => (
			<>
				<Bedroom2 {...NINA_ROOM} lumps={[{x: 0, len: 1.0}]} />
				<C2 who="nina" expression={t < 1.2 ? 'dormindo' : 'feliz'} pose={{...pose2D('sitBed'), drop: 10 - 6 * sr(t, 1.0, 1.6), armL: [140 * sr(t, 1.3, 1.9), 10], armR: [140 * sr(t, 1.3, 1.9), 10]}} position={SINGLE_SLEEP} light={1} tint={DAY_TINT} />
				<C2 who="ze" expression="feliz" pose="stand" position={[0.25, 0, -0.2]} turn={-0.4} light={1} tint={DAY_TINT} blink={blinkAt(T, 3)} />
				<DaySun />
			</>
		),
	},
	// 31 — "Mas a outra Nina começou a sorrir." : o sorriso cresce
	{
		start: 60.4,
		end: 63.0,
		light: 'dia',
		sun: KIT_SUN,
		focus: [0, 0, 0.4],
		cam: {position: [0.05, 0.66, 1.6], target: [0.0, 0.58, 0.45], fov: 44, move: 'pushIn', amount: 0.15, roll: 3},
		captionY: 0.84,
		Scene: ({T}) => (
			<>
				<Kitchen2 />
				<C2 who="nina" expression={T < 62.0 ? 'neutro' : 'sinistro'} pose="stand" hold="glass" position={[0.0, 0, 0.45]} turn={-0.15} light={-1} tint={lerpHex('#FFFFFF', '#E3DDF0', sr(T, 61.5, 62.5))} blink={blinkAt(T, 4)} />
				<KitchenSun />
			</>
		),
	},
	// 32 — "Que bom que escolheram ela."
	{
		start: 63.0,
		end: 64.5,
		light: 'dia',
		sun: KIT_SUN,
		focus: [0, 0, 0.4],
		cam: {position: [0.05, 0.62, 1.2], target: [0.0, 0.56, 0.45], fov: 40, roll: 7},
		captionY: 0.84,
		Scene: ({T}) => {
			const talk = useTalk();
			return (
				<>
					<Kitchen2 />
					<C2 who="nina" expression="sinistro" pose="stand" position={[0.0, 0, 0.45]} turn={-0.15} light={-1} tint="#E3DDF0" mouthOpen={talk(T, 63.0, 64.5)} />
					<KitchenSun />
				</>
			);
		},
	},
	// 33 — "Agora posso ficar com o quarto só para mim."
	{
		start: 64.5,
		end: 67.1,
		light: 'dia',
		sun: KIT_SUN,
		focus: [0, 0, 0.4],
		cam: {position: [0.0, 0.6, 1.05], target: [0.0, 0.58, 0.45], fov: 40, roll: -9, move: 'pushIn', amount: 0.12},
		captionY: 0.84,
		Scene: ({T}) => {
			const talk = useTalk();
			return (
				<>
					<Kitchen2 />
					<C2 who="nina" expression="sinistro" pose="handsHips" position={[0.0, 0, 0.45]} turn={0.15} light={-1} tint="#DCD4EE" mouthOpen={talk(T, 64.5, 67.1)} />
					<KitchenSun />
				</>
			);
		},
	},
	// 34 — "E saiu correndo!"
	{
		start: 67.1,
		end: 68.4,
		light: 'dia',
		sun: KIT_SUN,
		focus: [0, 0, 0.3],
		cam: {position: [0.0, 1.0, 2.9], target: [0.1, 0.46, 0.45], fov: 52},
		shakes: [{at: 67.3, intensity: 0.04}],
		captionY: 0.18,
		Scene: ({t}) => (
			<>
				<Kitchen2 />
				<C2 who="nina" expression="sinistro" pose="run" t={t} position={[-0.35 + 1.7 * sr(t, 0.05, 1.25), 0, 0.7]} turn={0.7} light={-1} shadowYaw={200} />
				<C2 who="pai" expression="susto" pose="shrug" position={[-0.36, 0, 1.15]} turn={0.5} light={-1} shadowYaw={200} />
				<C2 who="ze" expression="susto" pose="armsUp" position={[-0.05, 0, 1.25]} turn={0.5} light={-1} shadowYaw={200} />
			</>
		),
	},
	// 35 — "Nunca mais apareceu!" : some na rua
	{
		start: 68.4,
		end: 70.0,
		light: 'dia',
		focus: [0.5, 0, 2],
		cam: {position: [-1.6, 1.0, 3.4], target: [1.6, 0.35, 5.8], fov: 52, move: 'pushIn', amount: 0.05},
		captionY: 0.2,
		Scene: ({t}) => (
			<>
				<Street2 />
				<C2 who="nina" expression="sinistro" pose="run" t={t} position={[0.2 + t * 1.8, 0, 5.8]} turn={0.8} light={-1} shadowYaw={-45} />
				<C2 who="ze" expression="susto" pose="shrug" position={[-0.7, 0, 3.0]} turn={0.6} light={-1} shadowYaw={-45} />
			</>
		),
	},
	// 36 — "Agora me conta, você teria coragem..." : CTA
	{
		start: 70.0,
		end: 72.2,
		light: 'noite',
		sun: NIGHT_SUN,
		focus: BED_FOCUS,
		cam: {position: [-0.22, 0.72, 1.25], target: [-0.28, 0.58, -0.5], fov: 52, move: 'pushIn', amount: 0.05},
		captionY: 0.84,
		Scene: ({T}) => {
			const talk = useTalk();
			return (
				<>
					<Bedroom2 wallpaper={['#2F4F8A', '#3D63A8']} duvet="#E07A3A" bedWidth={1.0} curtain="#A07A36" />
					<C2 who="ze" expression="deboche" pose="sit" position={[-0.3, BED_TOP, -0.35]} turn={0.2} light={1} tint={NIGHT_TINT} shadowYaw={155} mouthOpen={talk(T, 70.0, 72.2)} blink={blinkAt(T, 3)} />
					<WallPlaque lines={['NOITE Nº', '1']} sizes={[0.3, 0.5]} position={[0.05, 0.98, -1.19]} width={0.28} height={0.24} />
					<MoonShaft />
				</>
			);
		},
	},
	// 37 — "...de dormir duas vezes no mesmo lugar?" : close
	{
		start: 72.2,
		end: 74.6,
		light: 'noite',
		sun: NIGHT_SUN,
		focus: BED_FOCUS,
		cam: {position: [-0.28, 0.82, 0.35], target: [-0.3, 0.8, -0.35], fov: 42, move: 'pushIn', amount: 0.08},
		captionY: 0.84,
		Scene: ({T}) => {
			const talk = useTalk();
			return (
				<>
					<Bedroom2 wallpaper={['#2F4F8A', '#3D63A8']} duvet="#E07A3A" bedWidth={1.0} curtain="#A07A36" />
					<C2 who="ze" expression="deboche" pose={{...pose2D('sit'), armR: [90, 0]}} position={[-0.3, BED_TOP, -0.35]} turn={0.1} light={1} tint={NIGHT_TINT} mouthOpen={talk(T, 72.2, 74.6)} blink={blinkAt(T, 3)} />
					<MoonShaft />
				</>
			);
		},
	},
	// 38 — "Curta e se inscreva..." : Zé feliz acenando
	{
		start: 74.6,
		end: 78.5,
		light: 'noite',
		sun: NIGHT_SUN,
		focus: BED_FOCUS,
		cam: {position: [-0.22, 0.72, 1.25], target: [-0.28, 0.58, -0.5], fov: 52, move: 'pushIn', amount: 0.06},
		captionY: 0.84,
		Scene: ({t, T}) => {
			const talk = useTalk();
			return (
				<>
					<Bedroom2 wallpaper={['#2F4F8A', '#3D63A8']} duvet="#E07A3A" bedWidth={1.0} curtain="#A07A36" />
					<C2 who="ze" expression="feliz" pose={{...pose2D('sit'), armR: [150 + Math.sin(t * 9) * 12, 25 + Math.sin(t * 9) * 20]}} position={[-0.3, BED_TOP, -0.35]} turn={0.2} light={1} tint={NIGHT_TINT} shadowYaw={155} mouthOpen={talk(T, 74.6, 78.5)} />
					<WallPlaque lines={['NOITE Nº', '1']} sizes={[0.3, 0.5]} position={[0.05, 0.98, -1.19]} width={0.28} height={0.24} />
					<MoonShaft />
				</>
			);
		},
	},
	// 39 — "...quando alguém sonha a mesma coisa três noites seguidas." : Zé dorme, abajur apaga
	{
		start: 78.5,
		end: NARRATION.seconds + 0.01,
		light: 'noite',
		sun: NIGHT_SUN,
		focus: BED_FOCUS,
		cam: {position: [-0.3, 0.95, 0.75], target: [-0.3, 0.55, -0.95], fov: 50, move: 'pushIn', amount: 0.12},
		captionY: 0.8,
		Scene: ({t, T}) => (
			<>
				<Bedroom2 wallpaper={['#2F4F8A', '#3D63A8']} duvet="#E07A3A" bedWidth={1.0} curtain="#A07A36" lumps={[{x: 0, len: 1.0}]} lampOn={T < 81.4} />
				<C2 who="ze" expression={t < 1.2 ? 'deboche' : 'dormindo'} pose={{...sleepPose(T, -12 * sr(t, 0.6, 1.4)), drop: 24 - 8 * (1 - sr(t, 0.2, 1.2))}} position={SINGLE_SLEEP} light={1} tint={NIGHT_TINT} />
				<WallPlaque lines={['NOITE Nº', '1']} sizes={[0.3, 0.5]} position={[0.05, 0.98, -1.19]} width={0.28} height={0.24} />
				<MoonShaft />
			</>
		),
	},
];

/* ------------------------------------------------------------------ */
/* Composição                                                          */
/* ------------------------------------------------------------------ */

const PlanView: React.FC<{plan: Plan}> = ({plan}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const t = frame / fps;
	const T = plan.start + t;
	const dur = Math.round((plan.end - plan.start) * fps);
	const shots: Shot[] = [{from: 0, durationInFrames: dur, ...plan.cam} as Shot];
	const shakes: Shake[] = (plan.shakes ?? []).map((s, i) => ({frame: Math.round((s.at - plan.start) * fps), duration: 8, intensity: s.intensity ?? 0.03, seed: i + 3}));
	const bg = plan.light === 'dia' ? PALETTE.skyHorizon : PALETTE.nightBg;
	return (
		<AbsoluteFill style={{backgroundColor: bg}}>
			<ThreeCanvas width={width} height={height} shadows={{enabled: true, type: THREE.PCFShadowMap}} dpr={1} gl={{antialias: false}}>
				<CameraRig shots={shots} shakes={shakes} />
				<Lighting preset={plan.light} focus={plan.focus ?? [0, 0, 0]} shadowExtent={plan.light === 'dia' && !plan.sun ? 8 : 6} sunAzimuth={plan.sun?.az} sunElevation={plan.sun?.el} interior={!!plan.sun} />
				<plan.Scene t={t} T={T} />
			</ThreeCanvas>
		</AbsoluteFill>
	);
};

export const DormirVideo: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const T = frame / fps;
	const [words, setWords] = useState<Word[] | null>(null);
	const [handle] = useState(() => delayRender('timestamps'));
	useEffect(() => {
		fetch(staticFile(NARRATION.timestamps))
			.then((r) => r.json())
			.then((j) => setWords(parseTimestamps(j)))
			.finally(() => continueRender(handle));
	}, [handle]);
	const plan = PLANS.find((p) => T >= p.start && T < p.end) ?? PLANS[PLANS.length - 1];
	const fadeOut = clamp((T - (NARRATION.seconds - 0.6)) / 0.5);
	if (!words) return null;
	return (
		<WordsCtx.Provider value={words}>
			<AbsoluteFill style={{backgroundColor: '#000'}}>
				{PLANS.map((p, i) => {
					const from = Math.round(p.start * fps);
					const to = Math.round(p.end * fps);
					return (
						<Sequence key={i} from={from} durationInFrames={Math.max(1, to - from)} name={`Plano ${i}`}>
							<PlanView plan={p} />
						</Sequence>
					);
				})}
				<Captions words={words} captionY={plan.captionY} />
				<AbsoluteFill style={{backgroundColor: '#000', opacity: fadeOut}} />
				<Audio src={staticFile(NARRATION.audio)} />
			</AbsoluteFill>
		</WordsCtx.Provider>
	);
};

export const DORMIR_PLANS = PLANS;
