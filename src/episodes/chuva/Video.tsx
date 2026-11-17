// "A chuva da vovó" — história em blocos, 16:9 (YouTube horizontal), 89 s, cronometrada pela narração.
// Cada plano = <Sequence> com cenário + luz + câmera + elenco em blocos. Legenda do canal (1 palavra,
// minúscula, branca, contorno fino). Tudo dirigido por frame: determinístico.
import React, {createContext, useContext, useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Sequence, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {PerspectiveCamera} from '@react-three/drei';
import {Lighting, LightingPreset, Sparks} from '../../components/Lighting';
import {parseTimestamps, Word, activeWordIndex} from '../../lib/timestamps';
import {ensureFonts} from '../../style/fonts';
import {clamp, easeInOutCubic, easeOutCubic, lerp, sr} from '../../style/easing';
import {hash1, noise1} from '../../style/random';
import {canvasTex, loadEpisodeTextures, plain} from './assets';
import {Blocky, Expression, Look, POSES, Pose, headCenterY, mix, pose} from './Blocky';
import {CAST} from './cast';
import {Baby, Cake, Cassette, Chair, LampPost, OnionStall, RainCloud, Radio, Shoes, SolderingIron, Table, Umbrella, WeddingArch} from './props';
import {LivingRoom, Maternity, SALA_WIN, Town, Yard} from './sets';

export const CHUVA_FPS = 30;
export const CHUVA_SECONDS = 89.3;
export const CHUVA_FRAMES = Math.ceil(CHUVA_SECONDS * CHUVA_FPS);
export const CHUVA_W = 1920;
export const CHUVA_H = 1080;

type V3 = [number, number, number];

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

const WordsCtx = createContext<Word[]>([]);
/** instante (s) em que a n-ésima ocorrência de `w` começa a ser falada a partir de `after` */
const useWordAt = () => {
	const words = useContext(WordsCtx);
	return (w: string, after = 0, fallback = after) => {
		const hit = words.find((x) => x.start >= after - 0.01 && x.text.toLowerCase().replace(/[.,?!]/g, '') === w);
		return hit ? hit.start : fallback;
	};
};

const blinkAt = (T: number, seed: number) => {
	const period = 2.6 + hash1(seed) * 1.8;
	const ph = (T + hash1(seed + 7) * period) % period;
	return ph < 0.11;
};

/** Personagem com piscada automática. */
const Who: React.FC<{c: keyof typeof CAST; T: number; seed?: number} & Omit<React.ComponentProps<typeof Blocky>, 'look'>> = ({c, T, seed = 1, blink, ...p}) => (
	<Blocky look={CAST[c] as Look} blink={blink ?? blinkAt(T, seed)} {...p} />
);

/* ------------------------------------------------------------------ */
/* Câmera (posição/alvo interpolados + tremida)                        */
/* ------------------------------------------------------------------ */

type Cam = {p: V3; l: V3; p2?: V3; l2?: V3; fov?: number; fov2?: number; ease?: (x: number) => number};

const CamRig: React.FC<{cam: Cam; k: number; shake: number; t: number}> = ({cam, k, shake, t}) => {
	const e = (cam.ease ?? easeInOutCubic)(clamp(k));
	const p = new THREE.Vector3(...cam.p).lerp(new THREE.Vector3(...(cam.p2 ?? cam.p)), e);
	const l = new THREE.Vector3(...cam.l).lerp(new THREE.Vector3(...(cam.l2 ?? cam.l)), e);
	// micro-movimento de mão (câmera sempre viva)
	const hand = 0.012;
	p.x += (noise1(t * 0.9, 1) - 0.5) * hand + (noise1(t * 22, 4) - 0.5) * shake;
	p.y += (noise1(t * 0.8, 2) - 0.5) * hand + (noise1(t * 22, 5) - 0.5) * shake;
	const fov = lerp(cam.fov ?? 40, cam.fov2 ?? cam.fov ?? 40, e);
	const m = new THREE.Matrix4().lookAt(p, l, new THREE.Vector3(0, 1, 0));
	const q = new THREE.Quaternion().setFromRotationMatrix(m);
	return <PerspectiveCamera makeDefault position={p} quaternion={q} fov={fov} near={0.05} far={1500} />;
};

/* ------------------------------------------------------------------ */
/* Peças pequenas                                                      */
/* ------------------------------------------------------------------ */

const IceCream: React.FC<React.ComponentProps<'group'>> = (g) => (
	<group {...g}>
		<mesh castShadow position={[0, 0.12, 0]} rotation={[0, 0, 1.4]} material={plain('#D9A05A', 0.7)}>
			<coneGeometry args={[0.1, 0.34, 10]} />
		</mesh>
		<mesh castShadow position={[0.22, 0.08, 0.05]} scale={[1.3, 0.55, 1.2]} material={plain('#F6C6D6', 0.5)}>
			<sphereGeometry args={[0.13, 12, 10]} />
		</mesh>
	</group>
);

const RingBox: React.FC<React.ComponentProps<'group'>> = (g) => (
	<group {...g}>
		<mesh castShadow material={plain('#2BA59B', 0.5)}>
			<boxGeometry args={[0.2, 0.12, 0.2]} />
		</mesh>
		<mesh position={[0, 0.1, -0.09]} rotation={[-1.2, 0, 0]} material={plain('#2BA59B', 0.5)}>
			<boxGeometry args={[0.2, 0.04, 0.2]} />
		</mesh>
		<mesh position={[0, 0.065, 0]} material={plain('#F4F1E6', 0.9)}>
			<boxGeometry args={[0.16, 0.01, 0.16]} />
		</mesh>
	</group>
);

/** Placa de parede/poste com texto (fonte do canal). */
const Plaque: React.FC<{k: string; lines: {t: string; s: number; c?: string}[]; w?: number; h?: number; bg?: string; post?: boolean} & React.ComponentProps<'group'>> = ({k, lines, w = 2.4, h = 1.4, bg = '#F4EFE0', post = false, ...g}) => {
	const map = canvasTex(`plq-${k}`, 1024, Math.round((1024 * h) / w), (c) => {
		const W = 1024;
		const H = Math.round((1024 * h) / w);
		c.fillStyle = bg;
		c.fillRect(0, 0, W, H);
		c.strokeStyle = '#1B1416';
		c.lineWidth = 22;
		c.strokeRect(24, 24, W - 48, H - 48);
		const tot = lines.reduce((a, l) => a + l.s * 1.18, 0);
		let y = (H - tot * H) / 2;
		c.textAlign = 'center';
		c.textBaseline = 'middle';
		lines.forEach((l) => {
			let px = l.s * H;
			c.font = `900 ${px}px 'Montserrat Black'`;
			const mw = c.measureText(l.t).width;
			if (mw > W * 0.86) {
				px *= (W * 0.86) / mw;
				c.font = `900 ${px}px 'Montserrat Black'`;
			}
			c.fillStyle = l.c ?? '#1B1416';
			c.fillText(l.t, W / 2, y + (l.s * 1.18 * H) / 2);
			y += l.s * 1.18 * H;
		});
	});
	return (
		<group {...g}>
			<mesh castShadow receiveShadow material={plain('#5A3A22', 0.6)}>
				<boxGeometry args={[w + 0.12, h + 0.12, 0.08]} />
			</mesh>
			<mesh position={[0, 0, 0.045]}>
				<planeGeometry args={[w, h]} />
				<meshStandardMaterial map={map} roughness={0.85} />
			</mesh>
			{post && (
				<mesh castShadow position={[0, -h / 2 - 1.2, -0.08]} material={plain('#5A3A22', 0.6)}>
					<boxGeometry args={[0.14, 2.4, 0.14]} />
				</mesh>
			)}
		</group>
	);
};

/** Gota única caindo até um ponto e espirrando. */
const Drop: React.FC<{t: number; hit: number; at: V3; h?: number}> = ({t, hit, at, h = 2.2}) => {
	const k = (t - (hit - 0.35)) / 0.35;
	if (k < 0 || k > 2.2) return null;
	if (k <= 1) {
		return (
			<mesh position={[at[0], at[1] + (1 - k * k) * h, at[2]]} scale={[1, 1.6, 1]} material={plain('#BFE0FF', 0.05, 0.1)}>
				<sphereGeometry args={[0.035, 10, 8]} />
			</mesh>
		);
	}
	const s = k - 1;
	return (
		<group position={at}>
			{[0, 1, 2, 3, 4, 5].map((i) => {
				const a = (i / 6) * Math.PI * 2;
				return (
					<mesh key={i} position={[Math.cos(a) * s * 0.12, s * 0.12 - s * s * 0.1, Math.sin(a) * s * 0.12]} material={plain('#D8ECFF', 0.05)}>
						<sphereGeometry args={[0.014 * (1.4 - s * 0.5), 6, 4]} />
					</mesh>
				);
			})}
		</group>
	);
};

/** Notas musicais saindo do rádio. */
const Notes: React.FC<{t: number; at: V3; on: number}> = ({t, at, on}) => (
	<group position={at}>
		{[0, 1, 2, 3].map((i) => {
			const k = (t * 0.6 + i / 4) % 1;
			return (
				<mesh key={i} position={[Math.sin(k * 6 + i) * 0.3, k * 1.6, 0]} scale={on * (1 - k) * 1.2}>
					<sphereGeometry args={[0.06, 8, 6]} />
					<meshStandardMaterial color="#1B1416" />
				</mesh>
			);
		})}
	</group>
);

/* ------------------------------------------------------------------ */
/* Planos                                                              */
/* ------------------------------------------------------------------ */

type SP = {t: number; T: number; d?: number};
type Plan = {
	s: number;
	light: LightingPreset;
	interior?: boolean;
	sun?: [number, number];
	focus?: V3;
	extent?: number;
	cam: Cam;
	shake?: [number, number][];
	sepia?: boolean;
	title?: string;
	Scene: React.FC<SP>;
};

// alturas de cabeça
const HN = headCenterY(CAST.narrador as Look);
const HV = headCenterY(CAST.vovo as Look);
const HVs = headCenterY(CAST.vovo as Look, true);

// Rua: valentão sob a nuvem na origem, menina chorando ao lado.
const STREET_EXTRAS: React.FC<{T: number}> = ({T}) => (
	<>
		<Who c="vizinho1" T={T} seed={11} pose={POSES.walk(T)} position={[-4.4, 0.22, -8 + ((T * 1.4) % 14)]} />
		<Who c="vizinha" T={T} seed={12} pose={POSES.walk(T + 0.3)} position={[4.6, 0.22, 2 - ((T * 1.2) % 14)]} rotation={[0, Math.PI, 0]} />
		<Who c="pai" T={T} seed={13} pose={POSES.idle(T)} position={[-5.4, 0.22, -16]} rotation={[0, 0.8, 0]} expression="feliz" />
		<Who c="senhora" T={T} seed={14} pose={POSES.idle(T + 1)} position={[5.2, 0.22, -20]} rotation={[0, -0.6, 0]} />
	</>
);

const BullyScene: React.FC<SP & {wet?: number; rain?: number; flash?: number; expr?: Expression; girlExpr?: Expression; cloud?: number}> = ({t, T, wet = 1, rain = 1, flash = 0, expr = 'susto', girlExpr = 'choro', cloud = 2}) => (
	<>
		<Town />
		<STREET_EXTRAS T={T} />
		<Who c="valentao" T={T} seed={2} pose={mix(POSES.idle(T), POSES.shrug(), 0.4)} expression={expr} wet={wet} />
		<RainCloud t={t} rain={rain} flash={flash} size={cloud} fall={3.6 + (cloud - 2) * 0.5} position={[0, 3.6 + (cloud - 2) * 0.5, 0]} seed={5} drops={Math.round(180 * cloud / 2)} />
		<Who c="menina" T={T} seed={3} pose={girlExpr === 'choro' ? POSES.sob(T) : POSES.laugh(T)} expression={girlExpr} position={[1.3, 0, 0.5]} rotation={[0, -0.9, 0]} />
		<IceCream position={[0.85, 0, 0.9]} />
	</>
);

const WeddingSet: React.FC<SP & {groomWet?: number; brideExpr?: Expression; groomExpr?: Expression; groomPose?: Pose; rain?: number}> = ({t, T, groomWet = 0, brideExpr = 'feliz', groomExpr = 'feliz', groomPose, rain = 0}) => (
	<>
		<Town />
		<WeddingArch position={[0, 0, -16]} />
		<Who c="padre" T={T} seed={20} pose={POSES.idle(T)} position={[0, 0, -16.4]} expression="neutro" />
		<Who c="noivo" T={T} seed={21} pose={groomPose ?? POSES.idle(T)} expression={groomExpr} wet={groomWet} position={[-0.9, 0, -14.6]} rotation={[0, 0.25, 0]} holdR={groomPose ? <RingBox position={[0, -0.1, 0.12]} /> : undefined} />
		<Who c="noiva" T={T} seed={22} pose={brideExpr === 'choro' ? POSES.cry(T) : POSES.idle(T)} expression={brideExpr} position={[0.9, 0, -14.6]} rotation={[0, -0.25, 0]} />
		{rain > 0 && <RainCloud t={t} rain={rain} size={2.2} fall={3.6} position={[-0.9, 5.9, -14.6]} seed={8} />}
		{[-1, 1].map((s) =>
			[0, 1, 2].map((r) => (
				<group key={`${s}${r}`}>
					<Chair position={[s * 2.6, 0, -10 + r * 2]} rotation={[0, Math.PI, 0]} />
					<Who c={(['vizinho1', 'vizinha', 'pai', 'mae', 'vizinho2', 'senhora'] as const)[(r * 2 + (s > 0 ? 1 : 0)) % 6]} T={T} seed={30 + r * 2 + s} pose={POSES.sit(T)} position={[s * 2.6, 0, -10.1 + r * 2]} rotation={[0, Math.PI, 0]} expression={brideExpr === 'choro' ? 'susto' : 'feliz'} />
				</group>
			)),
		)}
	</>
);

// Quintal: mesa no centro, vovó na cabeceira (x=0, z=-1.8) olhando +Z; narrador à direita dela.
const VOVO_SEAT: V3 = [0, 0, -1.9];
const NARR_SPOT: V3 = [1.6, 0, -1.5];
const DANCE: V3 = [0, 0, 3.8];

const PartyGuests: React.FC<{T: number; react?: number}> = ({T, react = 0}) => (
	<>
		<Who c="mae" T={T} seed={41} pose={POSES.sit(T)} position={[-2.0, 0, 0.2]} rotation={[0, Math.PI / 2, 0]} expression={react > 0.5 ? 'susto' : 'feliz'} />
		<Who c="pai" T={T} seed={42} pose={POSES.sit(T + 1)} position={[2.0, 0, 0.6]} rotation={[0, -Math.PI / 2, 0]} expression={react > 0.5 ? 'susto' : 'sorrisao'} />
		<Who c="vizinho2" T={T} seed={43} pose={POSES.sit(T + 2)} position={[-2.0, 0, 1.4]} rotation={[0, Math.PI / 2, 0]} expression="feliz" />
		<Who c="vizinha" T={T} seed={44} pose={POSES.sit(T + 3)} position={[2.0, 0, 1.8]} rotation={[0, -Math.PI / 2, 0]} expression={react > 0.5 ? 'emocionado' : 'feliz'} />
		{[[-2, 0.2], [2, 0.6], [-2, 1.4], [2, 1.8]].map(([x, z], i) => (
			<Chair key={i} position={[x, 0, z]} rotation={[0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]} />
		))}
	</>
);

const PartyTable: React.FC<{T: number; cake?: string; radioOn?: number; radio?: boolean}> = ({T, cake = '80', radioOn = 0, radio = false}) => (
	<>
		<Table position={[0, 0, 1]} rotation={[0, Math.PI / 2, 0]} w={3.4} d={1.6} />
		<Cake n={cake} t={T} position={[0, 1.04, 0.1]} />
		{[-0.5, 0.5].map((x) => (
			<mesh key={x} position={[x, 1.06, 1.3]} castShadow material={plain('#F4F4F4', 0.4)}>
				<cylinderGeometry args={[0.22, 0.2, 0.04, 16]} />
			</mesh>
		))}
		{radio && <Radio on={radioOn} t={T} position={[0.4, 1.04, 2.1]} rotation={[0, Math.PI, 0]} scale={0.8} />}
	</>
);

const PLANS: Plan[] = [
	/* 0 — GANCHO: cidade ensolarada, UMA nuvem de tempestade; mergulho de drone até ela */
	{
		s: 0,
		light: 'dia',
		focus: [0, 0, 0],
		extent: 26,
		cam: {p: [26, 34, 34], l: [0, 2, 0], p2: [3.8, 4.2, 7.5], l2: [0, 2.6, 0], fov: 46, fov2: 40, ease: (x) => easeInOutCubic(x) * 0.9 + x * 0.1},
		shake: [[0.62, 0.12]],
		Scene: ({t, T}) => <BullyScene t={t} T={T} cloud={3} flash={t > 0.6 && t < 0.78 ? 1 : 0} />,
	},
	/* 1 — "quando você chora": menina chorando, sorvete no chão */
	{
		s: 1.24,
		light: 'dia',
		focus: [1.3, 0, 0.5],
		extent: 7,
		cam: {p: [-0.6, 1.3, 2.3], l: [1.3, 1.1, 0.5], p2: [-0.2, 1.25, 1.95], fov: 34},
		Scene: ({t, T}) => <BullyScene t={t} T={T} />,
	},
	/* 2 — "a chuva cai só em cima de quem te fez chorar": contra-plongée, raio */
	{
		s: 2.6,
		light: 'dia',
		focus: [0, 0, 0],
		extent: 8,
		cam: {p: [-1.4, 0.35, 2.6], l: [0, 2.6, 0], p2: [-1.1, 0.45, 2.1], fov: 52, fov2: 46},
		shake: [[1.3, 0.1]],
		Scene: ({t, T}) => <BullyScene t={t} T={T} flash={t > 1.3 && t < 1.5 ? 1 : 0} />,
	},
	{
		s: 3.7,
		light: 'dia',
		focus: [0, 0, 0],
		extent: 7,
		cam: {p: [0.5, 1.3, 2.4], l: [0.2, 1.35, 0], p2: [0.4, 1.3, 1.9], fov: 34},
		Scene: ({t, T}) => <BullyScene t={t} T={T} expr="serio" girlExpr="rindo" />,
	},
	/* 3 — "Uma nuvem do tamanho de um guarda-chuva" */
	{
		s: 5.44,
		light: 'dia',
		focus: [0, 0, 0],
		extent: 8,
		cam: {p: [1.2, 2.4, 6.4], l: [1.2, 2.6, 0], p2: [-0.2, 2.5, 6.0], fov: 38},
		Scene: ({t, T}) => (
			<>
				<BullyScene t={t} T={T} expr="serio" girlExpr="rindo" />
				<Who c="senhora" T={T} seed={6} pose={POSES.carry(T)} position={[2.6, 0, 0]} rotation={[0, -0.2, 0]} expression="neutro" />
				<Umbrella position={[2.75, 1.25, 0.45]} color="#3A6FD8" color2="#F4EFE6" />
			</>
		),
	},
	/* 4 — "Por isso, ninguém aqui faz ninguém chorar" — placa de aviso */
	{
		s: 7.96,
		light: 'dia',
		focus: [-5.2, 0, 3],
		extent: 8,
		cam: {p: [-2.4, 2.3, 6.6], l: [-5.2, 2.6, 3.4], p2: [-3.1, 2.4, 5.6], fov: 40},
		Scene: ({t, T}) => (
			<>
				<Town />
				<Plaque k="aviso" post position={[-5.3, 2.9, 3.4]} rotation={[0, 0.7, 0]} w={2.6} h={1.6} lines={[{t: 'AVISO', s: 0.22, c: '#2B5D4A'}, {t: 'É PROIBIDO', s: 0.15}, {t: 'FAZER ALGUÉM CHORAR', s: 0.13}, {t: '(a nuvem sabe quem foi)', s: 0.09, c: '#5A5A5A'}]} />
				
			</>
		),
	},
	{
		s: 9.4,
		light: 'dia',
		focus: [0, 0, -4],
		extent: 10,
		cam: {p: [4.5, 2.2, 3], l: [-0.4, 1.6, -4], p2: [3.4, 2.0, 2], fov: 42},
		Scene: ({T}) => (
			<>
				<Town />
				<Who c="vizinho1" T={T} seed={51} pose={POSES.bow(T)} position={[-1.6, 0, -4]} rotation={[0, Math.PI / 2, 0]} expression="feliz" />
				<Who c="vizinho2" T={T} seed={52} pose={POSES.bow(T + 0.4)} position={[1.6, 0, -4]} rotation={[0, -Math.PI / 2, 0]} expression="feliz" />
				<Who c="pai" T={T} seed={53} pose={POSES.wave(T)} position={[-4.4, 0.22, -9]} rotation={[0, 0.6, 0]} expression="sorrisao" />
				<Who c="senhora" T={T} seed={54} pose={POSES.wave(T + 0.5)} position={[4.6, 0.22, -11]} rotation={[0, -0.6, 0]} expression="sorrisao" />
			</>
		),
	},
	/* 5 — "Em 2019": casamento na praça */
	{
		s: 11.06,
		light: 'dia',
		focus: [0, 0, -13],
		extent: 12,
		cam: {p: [0, 4.6, 2], l: [0, 2.4, -15], p2: [0, 3.4, -2.5], fov: 42},
		Scene: ({t, T}) => <WeddingSet t={t} T={T} />,
	},
	/* "o noivo esqueceu as alianças" */
	{
		s: 12.54,
		light: 'dia',
		focus: [-0.9, 0, -14.6],
		extent: 6,
		cam: {p: [-0.2, 1.7, -11.6], l: [-0.95, 1.6, -14.6], p2: [-0.4, 1.7, -12.3], fov: 36},
		Scene: ({t, T}) => <WeddingSet t={t} T={T} groomExpr="susto" groomPose={POSES.pockets(T)} />,
	},
	/* "A noiva chorou" */
	{
		s: 14.3,
		light: 'dia',
		focus: [0.9, 0, -14.6],
		extent: 6,
		cam: {p: [0.2, 2.0, -12.4], l: [0.95, 2.05, -14.6], p2: [0.4, 2.0, -12.9], fov: 32},
		Scene: ({t, T}) => <WeddingSet t={t} T={T} brideExpr="choro" groomExpr="susto" groomPose={POSES.pockets(T)} />,
	},
	/* "Ele casou ensopado" */
	{
		s: 15.48,
		light: 'dia',
		focus: [0, 0, -14.6],
		extent: 8,
		cam: {p: [0, 2.4, -9.4], l: [0, 2.6, -15], p2: [0, 2.5, -8.2], fov: 40},
		Scene: ({t, T}) => <WeddingSet t={t} T={T} rain={1} groomWet={1} groomExpr="serio" brideExpr="feliz" />,
	},
	/* 6 — "Seu Tião vende cebola" */
	{
		s: 17.2,
		light: 'dia',
		focus: [0, 0, -3],
		extent: 8,
		cam: {p: [1.6, 2.4, 4.4], l: [0, 1.9, -3], p2: [0.6, 2.2, 3.0], fov: 40},
		Scene: ({t, T}) => (
			<>
				<Town />
				<OnionStall position={[0, 0, -2.6]} />
				<Who c="tiao" T={T} seed={61} pose={POSES.wave(T)} position={[0, 0, -3.8]} expression="sorrisao" wet={0.6} />
				<RainCloud t={t} size={2.2} fall={3.6} position={[0, 6.0, -3.8]} seed={9} />
				<STREET_EXTRAS T={T} />
			</>
		),
	},
	/* "Ele usa capa de chuva o ano inteiro" — freguesa com olho ardendo da cebola */
	{
		s: 18.74,
		light: 'dia',
		focus: [0, 0, -3],
		extent: 6,
		cam: {p: [-2.6, 2.3, 0.6], l: [0, 2.2, -3.8], p2: [-2.0, 2.4, 0.0], fov: 36},
		Scene: ({t, T}) => (
			<>
				<Town />
				<OnionStall position={[0, 0, -2.6]} />
				<Who c="tiao" T={T} seed={61} pose={POSES.work(T)} position={[0, 0, -3.8]} expression="feliz" wet={0.6} />
				<RainCloud t={t} size={2.2} fall={3.6} position={[0, 6.0, -3.8]} seed={9} />
				<Who c="vizinha" T={T} seed={62} pose={POSES.cry(T)} position={[1.4, 0, -0.9]} rotation={[0, Math.PI + 0.4, 0]} expression="triste" />
			</>
		),
	},
	/* 7 — "E quando nasce um bebê?" */
	{
		s: 21.04,
		light: 'dia',
		interior: true,
		sun: [150, 30],
		focus: [0, 0, -1],
		extent: 6,
		cam: {p: [2.6, 2.2, 4.4], l: [0, 2.0, -1], p2: [1.8, 2.1, 3.4], fov: 40},
		Scene: ({t, T}) => (
			<>
				<Maternity />
				<Who c="medico" T={T} seed={71} pose={POSES.holdUp(T)} position={[0, 0, -0.6]} expression="feliz" holdR={<Baby position={[0, 0.25, 0]} />} />
				<Who c="mae" T={T} seed={72} pose={POSES.sit(T)} position={[-2.6, 0.55, -2.6]} expression="emocionado" />
			</>
		),
	},
	/* "Coitado do médico" */
	{
		s: 23.0,
		light: 'dia',
		interior: true,
		sun: [150, 30],
		focus: [0, 0, -1],
		extent: 5,
		cam: {p: [0.3, 2.4, 2.6], l: [0, 2.3, -0.6], p2: [0.2, 2.35, 2.1], fov: 36},
		Scene: ({t, T}) => (
			<>
				<Maternity />
				<Who c="medico" T={T} seed={71} pose={mix(POSES.holdUp(T), POSES.carry(T), 0.6)} position={[0, 0, -0.6]} expression="serio" wet={1} holdR={<Baby position={[0, 0.25, 0]} />} />
				<RainCloud t={t} size={2.0} fall={3.5} position={[0, 4.0, -0.6]} seed={11} />
			</>
		),
	},
	/* 8 — "Então, quase nunca chove aqui" — cidade seca e ensolarada */
	{
		s: 24.26,
		light: 'dia',
		focus: [0, 0, -14],
		extent: 30,
		sun: [-40, 52],
		cam: {p: [7, 16, 18], l: [0, 3, -16], p2: [3, 12, 12], fov: 46},
		Scene: ({T}) => (
			<>
				<Town dry={1} />
				<STREET_EXTRAS T={T} />
			</>
		),
	},
	/* "Faz 412 dias que não cai uma gota" — contador */
	{
		s: 26.92,
		light: 'dia',
		focus: [-5, 0, -5],
		extent: 8,
		cam: {p: [-2.2, 2.9, 0.4], l: [-5.2, 3.0, -4.6], p2: [-2.8, 3.0, -1.2], fov: 38},
		Scene: ({t}) => (
			<>
				<Town dry={1} />
				<Plaque
					k={t < 0.15 ? 'cont-411' : 'cont-412'}
					post
					position={[-5.3, 3.2, -4.6]}
					rotation={[0, 0.9, 0]}
					w={2.6}
					h={1.6}
					bg="#FFF6D8"
					lines={[{t: 'ESTAMOS HÁ', s: 0.12}, {t: t < 0.15 ? '411' : '412', s: 0.36, c: '#2B5D4A'}, {t: 'DIAS SEM CHUVA', s: 0.12}]}
				/>
			</>
		),
	},
	{
		s: 28.6,
		light: 'dia',
		focus: [0, 0, -14],
		extent: 32,
		sun: [-40, 52],
		cam: {p: [0, 3.5, 12], l: [0, 6, -30], p2: [0, 22, 20], l2: [0, 0, -18], fov: 48},
		Scene: ({T}) => (
			<>
				<Town dry={1} />
				<STREET_EXTRAS T={T} />
			</>
		),
	},
	/* 9 — "Minha avó Dulce fez 80 anos no sábado" — festa no quintal, hora dourada */
	{
		s: 30.9,
		light: 'dourado',
		focus: [0, 0, 0],
		extent: 14,
		cam: {p: [7.5, 5.4, 11], l: [0, 1.6, 0], p2: [4.6, 3.6, 7.6], fov: 42},
		Scene: ({T}) => (
			<>
				<Yard />
				<PartyTable T={T} />
				<PartyGuests T={T} />
				<Chair position={VOVO_SEAT} />
				<Who c="vovo" T={T} seed={81} pose={POSES.sit(T)} position={[0, 0, -2.0]} expression="feliz" />
				<Who c="narrador" T={T} seed={82} pose={POSES.wave(T)} position={NARR_SPOT} rotation={[0, -0.3, 0]} expression="sorrisao" />
				<Umbrella open={0} position={[0.9, 0, -2.4]} rotation={[0.25, 0, -0.2]} />
			</>
		),
	},
	/* "Ela ama a chuva" */
	{
		s: 33.68,
		light: 'dourado',
		focus: [0, 0, -2],
		extent: 6,
		cam: {p: [0.9, HVs + 0.1, 0.6], l: [0, HVs + 0.1, -2.0], p2: [0.7, HVs + 0.1, 0.1], fov: 32},
		Scene: ({T}) => (
			<>
				<Yard />
				<PartyTable T={T} />
				<Chair position={VOVO_SEAT} />
				<Who c="vovo" T={T} seed={81} pose={mix(POSES.sit(T), POSES.lookUp(T), 0.5)} position={[0, 0, -2.0]} expression="feliz" />
			</>
		),
	},
	/* 10 — FLASHBACK: vovó e vovô dançando na chuva, rádio ligado (noite, sépia) */
	{
		s: 35.08,
		light: 'noite',
		sepia: true,
		focus: DANCE,
		extent: 10,
		cam: {p: [5.4, 3.0, 11.2], l: [0, 1.8, 3.2], p2: [3.6, 2.6, 9.2], fov: 40},
		Scene: ({t, T}) => (
			<>
				<Yard party={false} night />
				<RainCloud t={t} noCloud radius={14} drops={900} fall={8} position={[0, 8, 3]} />
				<Who c="vovo_jovem" T={T} seed={91} pose={POSES.dance(T)} position={[0.5, 0, DANCE[2]]} rotation={[0, -Math.PI / 2 + 0.2 * Math.sin(T * 1.8), 0]} expression="rindo" wet={1} flare={0.3} />
				<Who c="vovoZeca" T={T} seed={92} pose={POSES.dance(T, Math.PI)} position={[-0.5, 0, DANCE[2]]} rotation={[0, Math.PI / 2 + 0.2 * Math.sin(T * 1.8), 0]} expression="feliz" wet={1} />
				<Radio on={1} t={T} position={[-2.6, 0.4, -4.4]} />
				<pointLight color="#FFC46B" intensity={10} distance={8} position={[-2.6, 1.6, -3.6]} />
				<LampPost on position={[2.6, 0, 2.2]} />
				<pointLight color="#FFD08A" intensity={45} distance={14} decay={1.6} position={[1.5, 4.2, 5.5]} castShadow shadow-mapSize={[1024, 1024]} />
			</>
		),
	},
	{
		s: 36.8,
		light: 'noite',
		sepia: true,
		focus: [-2.6, 0, -4.4],
		extent: 5,
		cam: {p: [-1.6, 1.4, -2.2], l: [-2.6, 0.75, -4.4], p2: [-1.9, 1.25, -2.8], fov: 34},
		Scene: ({t, T}) => (
			<>
				<Yard party={false} night />
				<RainCloud t={t} noCloud radius={10} drops={700} fall={8} position={[0, 8, 3]} />
				<Radio on={1} t={T} position={[-2.6, 0.4, -4.4]} />
				<Notes t={T} at={[-2.6, 1.2, -4.2]} on={1} />
				<pointLight color="#FFC46B" intensity={8} distance={6} position={[-2.2, 1.6, -3.6]} />
			</>
		),
	},
	/* 11 — "O vovô morreu faz três anos": poltrona vazia com a boina */
	{
		s: 39.04,
		light: 'dia',
		interior: true,
		sun: [180, 24],
		focus: [0, 0, -4],
		extent: 8,
		cam: {p: [1.6, 2.0, 1.6], l: [-1.8, 1.0, -3.6], p2: [0.8, 1.8, 0.4], fov: 40},
		Scene: () => (
			<>
				<LivingRoom lamp={false} />
				<mesh position={[-1.75, 1.0, -3.45]} rotation={[0, 0.5, 0]} castShadow material={plain('#5A5048', 0.8)}>
					<boxGeometry args={[0.6, 0.1, 0.62]} />
				</mesh>
			</>
		),
	},
	/* "Desde então, ela fica na janela…" — de costas, contra a luz */
	{
		s: 41.02,
		light: 'dia',
		interior: true,
		sun: [180, 24],
		focus: [SALA_WIN.x, 0, -5],
		extent: 6,
		cam: {p: [SALA_WIN.x - 1.4, 2.4, -1.0], l: [SALA_WIN.x, 2.2, -6], p2: [SALA_WIN.x - 1.0, 2.3, -1.8], fov: 42},
		Scene: ({T}) => (
			<>
				<LivingRoom lamp={false} />
				<Chair position={[SALA_WIN.x, 0, -4.6]} rotation={[0, Math.PI, 0]} />
				<Who c="vovo" T={T} seed={81} pose={POSES.sitWindow(T)} position={[SALA_WIN.x, 0, -4.7]} rotation={[0, Math.PI, 0]} expression="neutro" />
			</>
		),
	},
	/* "olhando o céu seco" — céu azul sem nenhuma nuvem pela janela */
	{
		s: 43.2,
		light: 'dia',
		interior: true,
		sun: [180, 24],
		focus: [SALA_WIN.x, 0, -5],
		extent: 6,
		cam: {p: [SALA_WIN.x, 2.3, -4.6], l: [SALA_WIN.x, 6, -20], p2: [SALA_WIN.x, 2.3, -5.2], l2: [SALA_WIN.x, 8, -20], fov: 46},
		Scene: () => <LivingRoom lamp={false} />,
	},
	/* "Ela nunca pediu nada" */
	{
		s: 44.64,
		light: 'dia',
		interior: true,
		sun: [180, 24],
		focus: [SALA_WIN.x, 0, -5],
		extent: 5,
		cam: {p: [SALA_WIN.x + 0.35, HVs + 0.15, -8.2], l: [SALA_WIN.x, HVs, -4.7], p2: [SALA_WIN.x + 0.3, HVs + 0.15, -7.6], fov: 30},
		Scene: ({T}) => (
			<>
				<LivingRoom lamp={false} />
				<Chair position={[SALA_WIN.x, 0, -4.6]} rotation={[0, Math.PI, 0]} />
				<Who c="vovo" T={T} seed={81} pose={mix(POSES.sitWindow(T), pose({sit: true, legL: 90, legR: 90, head: [-6, 150, 0], armL: [52, -6], armR: [52, -6]}), 0.0)} position={[SALA_WIN.x, 0, -4.7]} rotation={[0, Math.PI, 0]} expression="neutro" />
			</>
		),
	},
	/* "Mas eu sabia." */
	{
		s: 46.3,
		light: 'dia',
		interior: true,
		sun: [180, 24],
		focus: [3, 0, 2],
		extent: 5,
		cam: {p: [2.5, HN + 0.05, 4.1], l: [3, HN, 2], p2: [2.6, HN + 0.05, 3.6], fov: 32},
		Scene: ({T}) => (
			<>
				<LivingRoom lamp={false} />
				<Who c="narrador" T={T} seed={82} pose={POSES.idle(T)} position={[3, 0, 2]} rotation={[0, -0.23, 0]} expression="determinado" />
			</>
		),
	},
	/* 12 — "Então, eu consertei o rádio do vovô" — oficina, luminária quente */
	{
		s: 47.44,
		light: 'dia',
		interior: true,
		sun: [180, 18],
		focus: [-4.5, 0, 1.5],
		extent: 6,
		cam: {p: [-1.0, 2.6, 4.2], l: [-4.7, 1.6, 1.0], p2: [-1.8, 2.4, 3.4], fov: 40},
		Scene: ({t, T}) => (
			<>
				<LivingRoom />
				<Radio open={1} t={T} position={[-5.0, 1.36, 0.8]} rotation={[0, Math.PI / 2, 0]} />
				<Who c="narrador" T={T} seed={82} pose={POSES.work(T)} position={[-3.6, 0, 0.8]} rotation={[0, -Math.PI / 2, 0]} expression="determinado" holdR={<SolderingIron t={t} position={[0, 0, 0.05]} rotation={[0.2, 0, 0]} />} />
			</>
		),
	},
	/* "Levei duas semanas" — close nas mãos, faíscas */
	{
		s: 49.4,
		light: 'dia',
		interior: true,
		sun: [180, 18],
		focus: [-4.8, 0, 0.8],
		extent: 4,
		cam: {p: [-3.85, 1.95, 1.6], l: [-4.95, 1.6, 0.75], p2: [-4.0, 1.9, 1.35], fov: 38},
		shake: [[1.62, 0.05]],
		Scene: ({t, T}) => (
			<>
				<LivingRoom />
				<Radio open={1} t={T} position={[-5.0, 1.36, 0.8]} rotation={[0, Math.PI / 2, 0]} />
				<Who c="narrador" T={T} seed={82} pose={POSES.work(T)} position={[-3.6, 0, 0.8]} rotation={[0, -Math.PI / 2, 0]} expression={t > 1.6 ? 'susto' : 'determinado'} holdR={<SolderingIron t={t} position={[0, 0, 0.05]} rotation={[0.2, 0, 0]} />} />
				<Sparks t={(t * 1.0) % 0.7} position={[-4.75, 1.72, 0.85]} count={30} speed={2} life={0.55} />
			</>
		),
	},
	/* "e queimei quatro dedos" — mão com 4 curativos, orgulhoso */
	{
		s: 51.04,
		light: 'dia',
		interior: true,
		sun: [180, 18],
		focus: [-2.6, 0, 1.2],
		extent: 5,
		cam: {p: [-1.0, HN + 0.2, 3.4], l: [-2.6, HN + 0.15, 1.2], p2: [-1.25, HN + 0.18, 3.0], fov: 36},
		Scene: ({T}) => (
			<>
				<LivingRoom />
				<Radio on={0.4} t={T} position={[-5.0, 1.36, 0.8]} rotation={[0, Math.PI / 2, 0]} />
				<Who c="narrador" T={T} seed={82} pose={POSES.holdUp(T)} position={[-2.6, 0, 1.2]} rotation={[0, 0.6, 0]} expression="sorrisao" bandaged />
			</>
		),
	},
	/* "Achei a fita deles" — insert da fita */
	{
		s: 52.56,
		light: 'dia',
		interior: true,
		sun: [180, 18],
		focus: [-5, 0, 1.5],
		extent: 3,
		cam: {p: [-4.25, 2.1, 2.2], l: [-4.95, 1.42, 2.0], p2: [-4.4, 1.95, 2.15], fov: 30},
		Scene: () => (
			<>
				<LivingRoom />
				<Cassette position={[-4.95, 1.42, 2.0]} rotation={[-Math.PI / 2 + 0.05, 0, Math.PI / 2 + 0.25]} scale={0.6} />
			</>
		),
	},
	/* 13 — "Coloquei pra tocar no meio da festa" */
	{
		s: 54.06,
		light: 'dourado',
		focus: [0, 0, 1],
		extent: 8,
		cam: {p: [3.6, 2.6, 5.6], l: [0.4, 1.4, 1.8], p2: [2.6, 2.3, 4.6], fov: 40},
		Scene: ({t, T}) => {
			const on = sr(t, 0.6, 1.2);
			return (
				<>
					<Yard />
					<PartyTable T={T} radio radioOn={on} />
					<PartyGuests T={T} />
					<Chair position={VOVO_SEAT} />
					<Who c="vovo" T={T} seed={81} pose={POSES.sit(T)} position={[0, 0, -2.0]} expression="feliz" />
					<Who c="narrador" T={T} seed={82} pose={POSES.reach(T)} position={[0.9, 0, 3.0]} rotation={[0, Math.PI, 0]} expression="feliz" />
					<Notes t={T} at={[0.4, 1.7, 2.0]} on={on} />
				</>
			);
		},
	},
	/* "A vovó parou." */
	{
		s: 56.28,
		light: 'dourado',
		focus: [0, 0, -2],
		extent: 5,
		cam: {p: [0.25, HVs + 0.05, -0.4], l: [0, HVs, -2.0], p2: [0.2, HVs + 0.05, -0.7], fov: 32},
		Scene: ({T}) => (
			<>
				<Yard />
				<Chair position={VOVO_SEAT} />
				<Who c="vovo" T={T} seed={81} pose={pose({sit: true, legL: 90, legR: 90, armL: [40, 6], armR: [40, 6]})} position={[0, 0, -2.0]} expression="susto" blink={false} />
			</>
		),
	},
	/* "Pôs a mão no peito." */
	{
		s: 57.48,
		light: 'dourado',
		focus: [0, 0, -2],
		extent: 5,
		cam: {p: [-0.7, HVs - 0.15, -0.2], l: [0, HVs - 0.35, -2.0], p2: [-0.55, HVs - 0.15, -0.5], fov: 36},
		Scene: ({t, T}) => (
			<>
				<Yard />
				<Chair position={VOVO_SEAT} />
				<Who c="vovo" T={T} seed={81} pose={mix(POSES.sit(T), {...POSES.handChest(T), sit: true, legL: 90, legR: 90}, sr(t, 0, 0.5))} position={[0, 0, -2.0]} expression="emocionado" />
			</>
		),
	},
	/* "E chorou." */
	{
		s: 58.96,
		light: 'dourado',
		focus: [0, 0, -2],
		extent: 4,
		cam: {p: [0.15, HVs + 0.12, -0.4], l: [0, HVs + 0.1, -2.0], p2: [0.1, HVs + 0.12, -0.75], fov: 30},
		Scene: ({T}) => (
			<>
				<Yard />
				<Chair position={VOVO_SEAT} />
				<Who c="vovo" T={T} seed={81} pose={{...POSES.handChest(T), sit: true, legL: 90, legR: 90}} position={[0, 0, -2.0]} expression="emocionado" />
			</>
		),
	},
	/* 14 — "A primeira gota bateu na minha testa." */
	{
		s: 59.88,
		light: 'dourado',
		focus: [1.6, 0, -1.5],
		extent: 5,
		cam: {p: [1.85, HN + 0.05, 0.4], l: [1.6, HN + 0.2, -1.5], p2: [1.8, HN + 0.06, 0.1], fov: 34},
		Scene: ({t, T}) => {
			const hit = 61.5 - 59.88;
			return (
				<>
					<Yard />
					<Who c="narrador" T={T} seed={82} pose={POSES.idle(T)} position={NARR_SPOT} rotation={[0, 0.1, 0]} expression={t > hit ? 'susto' : 'feliz'} blink={t > hit && t < hit + 0.15} />
					<RainCloud t={t} rain={0} form={sr(t, 0, 1.4) * 0.8} size={1.8} position={[1.6, HN + 1.7, -1.5]} />
					<Drop t={t} hit={hit} at={[1.6, HN + 0.34, -1.2]} h={1.2} />
				</>
			);
		},
	},
	/* "A segunda, no meu ombro." */
	{
		s: 62.3,
		light: 'dourado',
		focus: [1.6, 0, -1.5],
		extent: 5,
		cam: {p: [0.4, HN, 0.3], l: [1.5, HN - 0.35, -1.5], p2: [0.55, HN - 0.02, 0.0], fov: 36},
		Scene: ({t, T}) => {
			const hit = 63.3 - 62.3;
			return (
				<>
					<Yard />
					<Who c="narrador" T={T} seed={82} pose={mix(POSES.idle(T), POSES.lookUp(T), 0.6)} position={NARR_SPOT} rotation={[0, 0.1, 0]} expression="susto" />
					<RainCloud t={t} rain={0} form={0.85} size={1.8} position={[1.6, HN + 1.7, -1.5]} />
					<Drop t={t} hit={hit} at={[1.6 - 0.42 * 0.74, HN - 0.42, -1.5]} h={1.3} />
				</>
			);
		},
	},
	/* "Aí o céu abriu." — contra-plongée: nuvem cresce e despeja */
	{
		s: 64.0,
		light: 'dourado',
		focus: [1.6, 0, -1.5],
		extent: 6,
		cam: {p: [2.8, 0.5, 1.2], l: [1.6, 3.2, -1.5], p2: [2.4, 0.6, 0.6], fov: 50},
		shake: [[0.62, 0.08]],
		Scene: ({t, T}) => (
			<>
				<Yard />
				<Who c="narrador" T={T} seed={82} pose={POSES.lookUp(T)} position={NARR_SPOT} rotation={[0, 0.3, 0]} expression="susto" wet={sr(t, 0.6, 1.2)} />
				<RainCloud t={t} rain={sr(t, 0.55, 0.8)} form={0.85 + sr(t, 0.3, 0.7) * 0.15} flash={t > 0.6 && t < 0.72 ? 0.6 : 0} size={2.1} fall={3.6} position={[1.6, 3.6, -1.5]} />
			</>
		),
	},
	/* "Só em cima de mim." — plano aberto: festa seca, só ele molhado */
	{
		s: 65.32,
		light: 'dourado',
		focus: [0, 0, 0],
		extent: 12,
		cam: {p: [-6.5, 4.6, 9.5], l: [0.6, 1.5, -0.5], p2: [-5.4, 4.0, 8.0], fov: 40},
		Scene: ({t, T}) => (
			<>
				<Yard />
				<PartyTable T={T} radio radioOn={1} />
				<PartyGuests T={T} react={1} />
				<Chair position={VOVO_SEAT} />
				<Who c="vovo" T={T} seed={81} pose={{...POSES.handChest(T), sit: true, legL: 90, legR: 90}} position={[0, 0, -2.0]} expression="emocionado" />
				<Who c="narrador" T={T} seed={82} pose={POSES.armsUp(T)} position={NARR_SPOT} rotation={[0, -0.4, 0]} expression="sorrisao" wet={1} />
				<RainCloud t={t} size={2.1} fall={3.6} position={[1.6, 3.6, -1.5]} />
			</>
		),
	},
	/* 15 — "Eu estendi a mão pra ela." (por cima do ombro da vovó) */
	{
		s: 66.88,
		light: 'dourado',
		focus: [1, 0, -1.6],
		extent: 6,
		cam: {p: [-1.3, 3.1, -3.9], l: [1.5, HN - 0.4, -0.9], p2: [-1.1, 3.0, -3.6], fov: 40},
		Scene: ({t, T}) => (
			<>
				<Yard />
				<Chair position={VOVO_SEAT} />
				<Who c="vovo" T={T} seed={81} pose={{...POSES.handChest(T), sit: true, legL: 90, legR: 90}} position={[0, 0, -2.0]} rotation={[0, 0.9, 0]} expression="emocionado" />
				<Who c="narrador" T={T} seed={82} pose={POSES.reach(T)} position={[1.5, 0, -0.9]} rotation={[0, -2.3, 0]} expression="feliz" wet={1} />
				<RainCloud t={t} size={2.1} fall={3.6} position={[1.5, 3.6, -0.9]} />
			</>
		),
	},
	/* "Ela tirou os sapatos." */
	{
		s: 68.56,
		light: 'dourado',
		focus: [0, 0, -1],
		extent: 4,
		cam: {p: [1.4, 0.5, 0.4], l: [0, 0.3, -1.2], p2: [1.1, 0.45, 0.1], fov: 36},
		Scene: ({t, T}) => (
			<>
				<Yard />
				<Shoes position={[0.2, 0, -1.4]} />
				<Who c="vovo" T={T} seed={81} pose={POSES.walk(T * 0.5)} position={[-0.3 + t * 0.35, 0, -1.0]} rotation={[0, Math.PI / 2, 0]} expression="feliz" />
			</>
		),
	},
	/* "Deixou o guarda-chuva do vovô fechado." */
	{
		s: 70.0,
		light: 'dourado',
		focus: [0, 0, -2],
		extent: 5,
		cam: {p: [1.6, 1.2, 0.6], l: [0.4, 1.0, -2.2], p2: [1.3, 1.1, 0.3], fov: 36},
		Scene: ({T}) => (
			<>
				<Yard />
				<Chair position={VOVO_SEAT} />
				<Umbrella open={0} position={[0.9, 0, -2.4]} rotation={[0.25, 0, -0.2]} />
				<mesh position={[0, 0.66, -1.9]} rotation={[0, 0.3, 0]} castShadow material={plain('#5A5048', 0.8)}>
					<boxGeometry args={[0.5, 0.08, 0.52]} />
				</mesh>
			</>
		),
	},
	/* 16 — "Dançou comigo na minha chuva." — MESMO enquadramento do flashback */
	{
		s: 71.98,
		light: 'dourado',
		focus: DANCE,
		extent: 10,
		cam: {p: [5.4, 3.0, 11.2], l: [0, 1.8, 3.2], p2: [3.6, 2.6, 9.2], fov: 40},
		Scene: ({t, T}) => (
			<>
				<Yard />
				<PartyTable T={T} radio radioOn={1} />
				<PartyGuests T={T} react={0} />
				<Who c="vovo" T={T} seed={81} pose={POSES.dance(T)} position={[0.5, 0, DANCE[2]]} rotation={[0, -Math.PI / 2 + 0.2 * Math.sin(T * 1.8), 0]} expression="rindo" wet={1} flare={0.3} />
				<Who c="narrador" T={T} seed={82} pose={POSES.dance(T, Math.PI)} position={[-0.5, 0, DANCE[2]]} rotation={[0, Math.PI / 2 + 0.2 * Math.sin(T * 1.8), 0]} expression="sorrisao" wet={1} />
				<RainCloud t={t} size={2.6} fall={4} position={[0, 4.4, DANCE[2]]} drops={240} />
			</>
		),
	},
	/* "Rodou até a saia ficar pesada de água." */
	{
		s: 74.42,
		light: 'dourado',
		focus: DANCE,
		extent: 6,
		cam: {p: [3.6, 1.7, DANCE[2] + 2.4], l: [0, 1.3, DANCE[2]], p2: [-1.6, 1.8, DANCE[2] + 3.8], fov: 40, ease: (x) => x},
		Scene: ({t, T}) => (
			<>
				<Yard />
				<Who c="vovo" T={T} seed={81} pose={POSES.spin(T)} position={[0, 0, DANCE[2]]} rotation={[0, t * 7, 0]} expression="rindo" wet={1} flare={0.5 + 0.5 * Math.abs(Math.sin(t * 3.5))} />
				<Who c="narrador" T={T} seed={82} pose={POSES.laugh(T)} position={[-1.6, 0, DANCE[2] - 0.8]} rotation={[0, 0.9, 0]} expression="rindo" wet={1} />
				<RainCloud t={t} size={3.2} fall={4} position={[-0.6, 4.4, DANCE[2] - 0.3]} drops={260} radius={1.9} />
			</>
		),
	},
	/* "E riu tão alto…" */
	{
		s: 77.32,
		light: 'dourado',
		focus: DANCE,
		extent: 5,
		cam: {p: [0.2, HV + 0.1, DANCE[2] + 2.0], l: [0, HV, DANCE[2]], p2: [0.15, HV + 0.1, DANCE[2] + 1.6], fov: 32},
		Scene: ({t, T}) => (
			<>
				<Yard />
				<Who c="vovo" T={T} seed={81} pose={POSES.laugh(T)} position={[0, 0, DANCE[2]]} expression="rindo" wet={1} />
				<RainCloud t={t} size={2.6} fall={4} position={[0, 4.4, DANCE[2]]} />
			</>
		),
	},
	/* "…que a rua inteira veio olhar." — vizinhos na cerca */
	{
		s: 78.66,
		light: 'dourado',
		focus: [0, 0, 8],
		extent: 10,
		cam: {p: [0.6, 2.2, 2.2], l: [0, 2.0, 9.5], p2: [0.4, 2.1, 3.2], fov: 44},
		Scene: ({T}) => (
			<>
				<Yard />
				{(['vizinho1', 'senhora', 'tiao', 'vizinho2', 'menina', 'valentao', 'noiva', 'noivo'] as const).map((c, i) => (
					<Who key={c} c={c} T={T} seed={100 + i} pose={i % 3 === 0 ? POSES.wave(T + i) : POSES.idle(T + i)} position={[-5.6 + i * 1.6, 0, 9.4 + (i % 2) * 0.5]} rotation={[0, Math.PI, 0]} expression={i % 2 ? 'sorrisao' : 'emocionado'} />
				))}
			</>
		),
	},
	/* 17 — "A música acabou." */
	{
		s: 80.32,
		light: 'dourado',
		focus: [0.4, 0, 2.1],
		extent: 4,
		cam: {p: [0.5, 1.75, 0.8], l: [0.4, 1.35, 2.1], p2: [0.45, 1.72, 1.05], fov: 34},
		Scene: ({t, T}) => (
			<>
				<Yard />
				<PartyTable T={T} radio radioOn={1 - sr(t, 0.2, 0.9)} />
			</>
		),
	},
	/* "A nuvem sumiu." */
	{
		s: 81.66,
		light: 'dourado',
		focus: DANCE,
		extent: 8,
		cam: {p: [2.4, 0.8, DANCE[2] + 3.6], l: [0, 3.6, DANCE[2]], p2: [2.2, 0.9, DANCE[2] + 3.2], fov: 48},
		Scene: ({t, T}) => {
			const k = sr(t, 0.1, 0.9);
			return (
				<>
					<Yard />
					<Who c="vovo" T={T} seed={81} pose={POSES.lookUp(T)} position={[0.5, 0, DANCE[2]]} rotation={[0, -0.6, 0]} expression="feliz" wet={1} />
					<Who c="narrador" T={T} seed={82} pose={POSES.lookUp(T)} position={[-0.5, 0, DANCE[2]]} rotation={[0, 0.6, 0]} expression="feliz" wet={1} />
					<RainCloud t={t} size={2.6} fall={4} position={[0, 4.4 + k * 1.5, DANCE[2]]} form={1 - k} rain={1 - sr(t, 0, 0.3)} color="#8A93A2" />
				</>
			);
		},
	},
	/* 18 — "Agora, todo ano, no aniversário dela…" — um ano depois, bolo 81 */
	{
		s: 82.76,
		light: 'dourado',
		focus: [0, 0, 0],
		extent: 10,
		title: 'um ano depois',
		cam: {p: [5.6, 3.4, 7.6], l: [0.4, 1.6, -1], p2: [3.8, 2.8, 5.4], fov: 40},
		Scene: ({T}) => (
			<>
				<Yard />
				<PartyTable T={T} cake="81" radio radioOn={1} />
				<PartyGuests T={T} />
				<Chair position={VOVO_SEAT} />
				<Who c="vovo" T={T} seed={81} pose={POSES.sit(T)} position={[0, 0, -2.0]} expression="emocionado" />
				<Who c="narrador" T={T} seed={82} pose={POSES.carry(T)} position={NARR_SPOT} rotation={[0, -0.6, 0]} expression="sorrisao" holdR={<Cassette position={[0.25, -0.05, 0.25]} rotation={[0, Math.PI / 2, 0]} scale={0.5} />} />
			</>
		),
	},
	{
		s: 85.56,
		light: 'dourado',
		focus: [0, 0, -2],
		extent: 5,
		cam: {p: [0.5, HVs + 0.2, 0.4], l: [0.3, HVs + 0.3, -2.0], p2: [0.45, HVs + 0.2, 0.0], fov: 34},
		Scene: ({t, T}) => (
			<>
				<Yard />
				<Chair position={VOVO_SEAT} />
				<Who c="vovo" T={T} seed={81} pose={{...POSES.handChest(T), sit: true, legL: 90, legR: 90}} position={[0, 0, -2.0]} expression="emocionado" />
				<RainCloud t={t} rain={sr(t, 0.6, 1.0)} form={sr(t, 0, 0.8)} size={1.9} fall={3.4} position={[1.6, 3.4, -1.5]} />
				<Who c="narrador" T={T} seed={82} pose={POSES.idle(T)} position={NARR_SPOT} rotation={[0, -0.6, 0]} expression="sorrisao" wet={sr(t, 0.8, 1.4)} />
			</>
		),
	},
	/* 19 — "E a gente dança na minha chuva." — final: drone sobe sobre o quintal ao anoitecer */
	{
		s: 87.24,
		light: 'dourado',
		sun: [-45, 5],
		focus: DANCE,
		extent: 14,
		cam: {p: [3.2, 2.4, DANCE[2] + 6], l: [0, 1.8, DANCE[2]], p2: [10, 16, DANCE[2] + 20], l2: [0, 1, DANCE[2] - 1], fov: 42, ease: easeOutCubic},
		Scene: ({t, T}) => (
			<>
				<Yard />
				<PartyTable T={T} cake="81" radio radioOn={1} />
				<PartyGuests T={T} />
				<Who c="vovo" T={T} seed={81} pose={POSES.dance(T)} position={[0.5, 0, DANCE[2]]} rotation={[0, -Math.PI / 2 + 0.2 * Math.sin(T * 1.8), 0]} expression="rindo" wet={1} flare={0.3} />
				<Who c="narrador" T={T} seed={82} pose={POSES.dance(T, Math.PI)} position={[-0.5, 0, DANCE[2]]} rotation={[0, Math.PI / 2 + 0.2 * Math.sin(T * 1.8), 0]} expression="sorrisao" wet={1} />
				<RainCloud t={t} size={2.6} fall={4} position={[0, 4.4, DANCE[2]]} drops={240} />
			</>
		),
	},
];

/* ------------------------------------------------------------------ */
/* Render de um plano                                                  */
/* ------------------------------------------------------------------ */

const PlanView: React.FC<{plan: Plan; end: number}> = ({plan, end}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const t = frame / fps;
	const T = plan.s + t;
	const d = end - plan.s;
	let shake = 0;
	(plan.shake ?? []).forEach(([at, amp]) => {
		const k = (t - at) / 0.28;
		if (k >= 0 && k <= 1) shake += amp * (1 - k) * (1 - k);
	});
	return (
		<AbsoluteFill style={plan.sepia ? {filter: 'sepia(0.55) saturate(0.8) contrast(1.05) brightness(1.05)'} : undefined}>
			<ThreeCanvas width={width} height={height} shadows={{enabled: true, type: THREE.PCFShadowMap}} dpr={1} gl={{antialias: false}}>
				<CamRig cam={plan.cam} k={t / d} shake={shake} t={T} />
				<Lighting preset={plan.light} focus={plan.focus ?? [0, 0, 0]} shadowExtent={plan.extent ?? 10} sunAzimuth={plan.sun?.[0]} sunElevation={plan.sun?.[1]} interior={plan.interior} shadowMapSize={4096} vignette={plan.light === 'noite' ? 0.75 : 0.42} />
				<plan.Scene t={t} T={T} d={d} />
			</ThreeCanvas>
			{plan.sepia && <AbsoluteFill style={{boxShadow: 'inset 0 0 260px 60px rgba(30,18,6,0.65)'}} />}
			{plan.title && <TitleCard text={plan.title} t={t} />}
		</AbsoluteFill>
	);
};

const TitleCard: React.FC<{text: string; t: number}> = ({text, t}) => {
	const a = clamp(t / 0.2) * (1 - clamp((t - 1.2) / 0.3));
	return (
		<div style={{position: 'absolute', left: 80, top: 70, opacity: a, transform: `translateY(${(1 - easeOutCubic(clamp(t / 0.3))) * 20}px)`}}>
			<span style={{fontFamily: "'Montserrat Black'", fontSize: 64, color: '#fff', WebkitTextStroke: '10px #000', paintOrder: 'stroke fill', letterSpacing: '0.02em'}}>{text}</span>
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* Legenda do canal: 1 palavra, minúscula, branca, contorno preto fino */
/* ------------------------------------------------------------------ */

const ChannelCaption: React.FC<{words: Word[]}> = ({words}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const i = activeWordIndex(words, t + 1.3 / 30 * 0, 0.4);
	if (i < 0) return null;
	const w = words[i];
	const prev = i > 0 ? words[i - 1].text : '.';
	let txt = w.text.replace(/[^\p{L}\p{N}'-]/gu, '');
	const first = i === 0 || /[.!?]$/.test(prev);
	if (first && (txt.length === 1 || txt.slice(1) === txt.slice(1).toLowerCase())) txt = txt.toLowerCase();
	const k = clamp((t - w.start) * fps / 3);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div style={{position: 'absolute', left: 0, right: 0, top: '84%', transform: `translateY(-50%) scale(${0.85 + 0.15 * easeOutCubic(k)})`, display: 'flex', justifyContent: 'center'}}>
				<span style={{fontFamily: "'Montserrat Black'", fontSize: 84, color: '#fff', WebkitTextStroke: '12px #000', paintOrder: 'stroke fill', textShadow: '0 4px 0 rgba(0,0,0,0.55)', whiteSpace: 'nowrap'}}>{txt}</span>
			</div>
		</AbsoluteFill>
	);
};

/* ------------------------------------------------------------------ */
/* Composição                                                          */
/* ------------------------------------------------------------------ */

export const ChuvaVideo: React.FC<{captions?: boolean; audio?: boolean}> = ({captions = true, audio = true}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const [words, setWords] = useState<Word[] | null>(null);
	const [ready, setReady] = useState(false);
	const [handle] = useState(() => delayRender('Carregando episódio'));
	useEffect(() => {
		Promise.all([
			fetch(staticFile('timestamps/chuva-da-vovo.json'))
				.then((r) => r.json())
				.then((j) => setWords(parseTimestamps(j))),
			loadEpisodeTextures(),
			ensureFonts(),
		])
			.then(() => setReady(true))
			.finally(() => continueRender(handle));
	}, [handle]);
	if (!ready || !words) return <AbsoluteFill style={{background: '#000'}} />;
	const T = frame / fps;
	const fadeOut = clamp((T - (CHUVA_SECONDS - 0.6)) / 0.5);
	return (
		<WordsCtx.Provider value={words}>
			<AbsoluteFill style={{background: '#000'}}>
				{PLANS.map((p, i) => {
					const end = i + 1 < PLANS.length ? PLANS[i + 1].s : CHUVA_SECONDS;
					const from = Math.round(p.s * fps);
					const to = Math.round(end * fps);
					return (
						<Sequence key={i} from={from} durationInFrames={Math.max(1, to - from)} name={`Plano ${i}`}>
							<PlanView plan={p} end={end} />
						</Sequence>
					);
				})}
				{captions && <ChannelCaption words={words} />}
				<AbsoluteFill style={{backgroundColor: '#000', opacity: fadeOut}} />
				{audio && <Audio src={staticFile('audio/chuva-da-vovo.mp3')} />}
			</AbsoluteFill>
		</WordsCtx.Provider>
	);
};

/** Quadros-chave para QC (1 frame por plano, no meio dele). */
export const CHUVA_QC_TIMES = PLANS.map((p, i) => {
	const end = i + 1 < PLANS.length ? PLANS[i + 1].s : CHUVA_SECONDS;
	return (p.s + end) / 2;
});
// referência para não acusar import não usado
void useWordAt;
