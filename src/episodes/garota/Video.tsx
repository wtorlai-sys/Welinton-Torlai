// Episódio "A garota popular" — animação 3D (bonecos de blocos) cronometrada pela narração.
// Cada plano = set + luz + câmera em movimento + personagens animados por frame.
// Legenda e áudio entram depois (scripts/garota_popular/montar.py --video), por cima do render mudo.
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Sequence, continueRender, delayRender, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {BlockyAvatar, Expr, Pose, blinkAt, idle, talkFrom, walk} from '../../components/BlockyAvatar';
import {CameraRig, Shake, Shot} from '../../components/CameraRig';
import {Lighting, LightingPreset} from '../../components/Lighting';
import {clamp, easeOutCubic, lerp, sr} from '../../style/easing';
import {GAROTA, IRMAO, MAX} from './cast';
import {WORDS} from './words';
import {
	BlueStar,
	Books,
	Cafeteria,
	FloatingHearts,
	GirlRoom,
	Hallway,
	JuiceBox,
	JuiceSpray,
	LivingRoom,
	Loading,
	MaxRoom,
	Notifs,
	Paper,
	Pencil,
	Phone,
	Schoolyard,
	Sign,
	Steam,
	Sunglasses,
	SweatDrop,
	preloadTextures,
} from './sets';

export const GAROTA_FPS = 30;
export const GAROTA_SECONDS = 116.0;
export const GAROTA_FRAMES = Math.round(GAROTA_SECONDS * GAROTA_FPS);

type V3 = [number, number, number];
const w = (i: number) => WORDS[i].start;
const talk = (T: number, a: number, b: number) => talkFrom(WORDS, T, w(a) - 0.02, WORDS[b].end);
const D = Math.PI / 180;

/* ------------------------------------------------------------------ */
/* Poses                                                               */
/* ------------------------------------------------------------------ */
const P = {
	pointSelf: (t: number): Pose => ({...idle(t), armR: [78, -42]}),
	scratch: (t: number): Pose => ({...idle(t), armR: [168, -22 + Math.sin(t * 14) * 6], head: [0, 4, -8]}),
	facepalm: (t: number): Pose => ({...idle(t), armR: [138, -36], head: [0, 16, 6]}),
	typing: (t: number): Pose => ({armR: [62 + Math.sin(t * 21) * 4, -14], armL: [62 + Math.cos(t * 23) * 4, -14], head: [0, 14, 0]}),
	drawing: (t: number): Pose => ({armR: [64 + Math.sin(t * 7) * 6, -8 + Math.cos(t * 7) * 6], armL: [50, -12], head: [0, 28, 0], lean: 10}),
	phone: (t: number): Pose => ({...idle(t), armR: [70, -20], armL: [64, -24], head: [0, 16, 0]}),
	phoneTap: (t: number): Pose => ({...idle(t), armR: [70, -20], armL: [64 + Math.abs(Math.sin(t * 9)) * 8, -30], head: [0, 18, 0]}),
	chest: (t: number): Pose => ({armR: [48, -40], armL: [48, -40], head: [Math.sin(t * 2) * 6, -6, Math.sin(t * 2.2) * 8], torsoYaw: Math.sin(t * 2) * 8}),
	rub: (t: number): Pose => ({armR: [60, -44 + Math.sin(t * 15) * 7], armL: [60, -44 - Math.sin(t * 15) * 7], head: [0, 4, 0]}),
	hip: (t: number): Pose => ({...idle(t), armL: [8, 34], head: [Math.sin(t * 1.3) * 4, 0, 6]}),
	thumbs: (t: number): Pose => ({...idle(t), armR: [88, 6], armL: [88, -6]}),
	fist: (t: number): Pose => ({...idle(t), armR: [96 + Math.sin(t * 3) * 3, -12], head: [0, -6, 0]}),
	laugh: (t: number): Pose => ({armL: [32, -34], armR: [24, -30], bob: Math.abs(Math.sin(t * 13)) * 0.018, head: [0, -10 + Math.sin(t * 13) * 5, 0], lean: -4}),
	nod: (t: number): Pose => ({...idle(t), head: [0, 6 + Math.max(0, Math.sin(t * 8)) * 14, 0]}),
	holdUp: (t: number): Pose => ({...idle(t), armR: [78, -24], armL: [78, -24], head: [0, -4, 0]}),
};

/* ------------------------------------------------------------------ */
/* Personagens prontos                                                 */
/* ------------------------------------------------------------------ */
type CProps = {T: number; pose?: Pose; expr?: Expr; mouth?: number; position: V3; ry?: number; holdR?: React.ReactNode; holdL?: React.ReactNode; headWear?: React.ReactNode};
const Max: React.FC<CProps> = ({T, pose, expr = 'neutro', mouth = 0, position, ry = 0, ...r}) => (
	<BlockyAvatar look={MAX} pose={pose ?? idle(T, 1)} expr={expr} mouth={mouth} blink={blinkAt(T, 1)} position={position} rotation={[0, ry, 0]} {...r} />
);
const Garota: React.FC<CProps> = ({T, pose, expr = 'neutro', mouth = 0, position, ry = 0, ...r}) => (
	<BlockyAvatar look={GAROTA} pose={pose ?? idle(T, 2)} expr={expr} mouth={mouth} blink={blinkAt(T, 2)} position={position} rotation={[0, ry, 0]} {...r} />
);
const Irmao: React.FC<CProps> = ({T, pose, expr = 'convencido', mouth = 0, position, ry = 0, ...r}) => (
	<BlockyAvatar look={IRMAO} pose={pose ?? idle(T, 3)} expr={expr} mouth={mouth} blink={blinkAt(T, 3)} position={position} rotation={[0, ry, 0]} {...r} />
);

/** Altura do boneco sentado num assento de altura `seat`. */
const sitY = (seat: number, sc: number) => seat - 0.36 * sc;
const HAND_PHONE = (screen: 'chat' | 'coracoes' | 'perfil' | 'escuro' = 'chat') => <Phone screen={screen} position={[0, -0.03, 0.05]} rotation={[-Math.PI / 2 + 0.5, 0, 0]} scale={1.2} />;

/* ------------------------------------------------------------------ */
/* Planos                                                              */
/* ------------------------------------------------------------------ */
/** insert = plano de detalhe: a distância da câmera não é corrigida. */
type Cam = {p: V3; t: V3; fov?: number; move?: Shot['move']; amount?: number; ease?: (x: number) => number; insert?: boolean};

/**
 * No 9:16 a largura útil é ~56% da altura: um plano "de rosto" precisa da câmera ~1,7x mais longe
 * do que no 16:9. Corrige a distância (mantém a direção) para planos próximos.
 */
const fixDist = (c: Cam): V3 => {
	if (c.insert) return c.p;
	const d = Math.hypot(c.p[0] - c.t[0], c.p[1] - c.t[1], c.p[2] - c.t[2]);
	const k = d < 1.4 ? 1.75 : Math.max(1, 1.75 - (d - 1.4) * 0.6);
	return [c.t[0] + (c.p[0] - c.t[0]) * k, c.t[1] + (c.p[1] - c.t[1]) * k, c.t[2] + (c.p[2] - c.t[2]) * k];
};
type Plan = {
	a: number;
	light: LightingPreset;
	interior?: boolean;
	sun?: [number, number];
	focus?: V3;
	cams: Cam[];
	shakes?: number[];
	Scene: React.FC<{t: number; T: number}>;
};

const hallway = (T: number) => <Hallway t={T} />;
const SCHOOL_SUN: [number, number] = [150, 38];
const SUNSET: [number, number] = [235, 9];

// posições recorrentes
const MAX_DESK: V3 = [-0.85, sitY(0.48, 0.95), -0.82];
const MAX_DRAW: V3 = [-0.25, sitY(0.48, 0.95), -0.82];
const STAR_AT: V3 = [-0.425, 0.754, -1.095];
const MAX_BED: V3 = [0.95, sitY(0.56, 0.95), -0.55];
const GIRL_BED: V3 = [-0.3, sitY(0.56, 0.93), -0.05];
const YARD_MAX: V3 = [-0.35, 0, -1.8];
const YARD_GIRL: V3 = [0.35, 0, -1.8];
const GIRL_RY = -Math.PI / 2;
const MAX_RY = Math.PI / 2;

const PLANS: Plan[] = [
	// 0 "A garota mais popular da escola" — ela vem pelo corredor com corações
	{
		a: 0,
		light: 'dia',
		interior: true,
		focus: [0, 0, -3],
		cams: [{p: [0, 1.05, 1.4], t: [0, 0.85, -4], fov: 36, move: 'pushIn', amount: 0.32, ease: easeOutCubic}],
		Scene: ({T}) => {
			const z = -5.2 + T * 1.25;
			return (
				<>
					{hallway(T)}
					<Garota T={T} pose={{...walk(T), armL: [40, -30], armR: [40, -30], head: [0, -4, 8]}} expr="apaixonado" position={[0, 0, z]} />
					<FloatingHearts t={T} position={[0, 1.15, z]} count={8} spread={0.3} rise={0.5} />
				</>
			);
		},
	},
	// 1 "está apaixonada por mim" — Max se aponta, orgulhoso
	{
		a: w(6),
		light: 'dia',
		interior: true,
		focus: [0, 0, -1],
		cams: [{p: [0.1, 0.94, -0.05], t: [0, 0.86, -1], fov: 40, move: 'pushIn', amount: 0.12}],
		Scene: ({t, T}) => (
			<>
				{hallway(T)}
				<Max T={T} pose={P.pointSelf(T)} expr={t < 0.3 ? 'feliz' : 'convencido'} position={[0, 0, -1]} />
				<Garota T={T} pose={walk(T)} expr="apaixonado" position={[-0.6, 0, -4.2 + t * 0.9]} />
			</>
		),
	},
	// 2 "mas tem um pequeno problema" — coça a cabeça, suor
	{
		a: w(10),
		light: 'dia',
		interior: true,
		focus: [0, 0, -1],
		cams: [{p: [0.25, 0.97, -0.08], t: [0, 0.88, -1], fov: 40, move: 'orbit', amount: 12}],
		Scene: ({t, T}) => (
			<>
				{hallway(T)}
				<Max T={T} pose={P.scratch(T)} expr="nervoso" position={[0, 0, -1]} />
				<SweatDrop t={t} position={[-0.12, 1.0, -0.84]} />
			</>
		),
	},
	// 3 "Ela acha que está apaixonada pelo meu irmão" — abraça o braço do irmão; Max: facepalm
	{
		a: w(15),
		light: 'dia',
		interior: true,
		focus: [0, 0, -2],
		cams: [
			{p: [0.15, 1.0, 0.35], t: [-0.15, 0.85, -1.9], fov: 42, move: 'truck', amount: 0.3},
			{p: [0.0, 0.98, -0.75], t: [0.0, 0.92, -1.7], fov: 40, move: 'pushIn', amount: 0.1},
		],
		Scene: ({t, T}) => (
			<>
				{hallway(T)}
				<Garota T={T} pose={{...idle(T, 2), armR: [62, -8], armL: [66, -48], head: [-18, -6, 10], torsoYaw: -18}} expr="apaixonado" position={[-0.17, 0, -1.6]} ry={0.35} />
				<FloatingHearts t={t} position={[-0.17, 1.15, -1.6]} count={6} spread={0.25} />
				<Irmao T={T} pose={{...idle(T, 3), head: [-28, 0, 0]}} expr="susto" position={[0.22, 0, -1.75]} ry={-0.15} />
				<Max T={T} pose={P.facepalm(T)} expr="vazio" position={[-0.8, 0, -2.9]} ry={0.2} />
			</>
		),
	},
	// 4 "Tudo começou quando criei uma conta anônima" — quarto, notebook
	{
		a: w(23),
		light: 'noite',
		interior: true,
		sun: [155, 34],
		focus: [-0.6, 0, -1],
		cams: [{p: [0.15, 1.35, 0.35], t: [-0.85, 0.92, -1.25], fov: 45, move: 'pushIn', amount: 0.15}],
		Scene: ({T}) => (
			<>
				<MaxRoom />
				<Max T={T} pose={{...P.typing(T), sit: true}} expr="convencido" position={MAX_DESK} ry={Math.PI} />
			</>
		),
	},
	// 5 "para postar meus desenhos" — por cima do ombro, tela do perfil anônimo
	{
		a: w(30),
		light: 'noite',
		interior: true,
		sun: [155, 34],
		focus: [-0.6, 0, -1],
		cams: [{p: [-0.3, 1.32, -0.5], t: [-0.85, 0.88, -1.38], fov: 38, move: 'pushIn', amount: 0.12, insert: true}],
		Scene: ({T}) => (
			<>
				<MaxRoom />
				<Max T={T} pose={{...P.typing(T), sit: true}} expr="convencido" position={MAX_DESK} ry={Math.PI} />
			</>
		),
	},
	// 6 "Eu nunca mostrava meu rosto, só minhas mãos" — vista de cima: mãos desenhando
	{
		a: w(34),
		light: 'noite',
		interior: true,
		sun: [155, 34],
		focus: [-0.5, 0, -1],
		cams: [
			{p: [-0.5, 1.45, -1.32], t: [-0.5, 0.75, -1.1], fov: 44, move: 'pushIn', amount: 0.12, insert: true},
			{p: [-0.5, 1.15, -1.25], t: [-0.5, 0.75, -1.12], fov: 34, move: 'pushIn', amount: 0.12, insert: true},
		],
		Scene: ({T}) => (
			<>
				<MaxRoom />
				{/* só as mãos (o rosto nunca aparece) */}
				<group position={[-0.47 + Math.sin(T * 7) * 0.02, 0.8, -1.0 + Math.cos(T * 7) * 0.015]} rotation={[0, 0.2, 0]}>
					<mesh position={[0.02, 0, 0.2]} castShadow>
						<boxGeometry args={[0.15, 0.13, 0.32]} />
						<meshStandardMaterial color="#C9322B" roughness={0.6} />
					</mesh>
					<mesh position={[0.02, -0.01, 0.0]} castShadow>
						<boxGeometry args={[0.13, 0.07, 0.12]} />
						<meshStandardMaterial color="#E8B48A" roughness={0.6} />
					</mesh>
					<Pencil position={[-0.03, -0.02, -0.06]} rotation={[0.9, 0, 0.4]} />
				</group>
				<group position={[-0.62, 0.79, -0.98]} rotation={[0, -0.3, 0]}>
					<mesh position={[0, 0, 0.2]} castShadow>
						<boxGeometry args={[0.15, 0.13, 0.32]} />
						<meshStandardMaterial color="#C9322B" roughness={0.6} />
					</mesh>
					<mesh position={[0, -0.01, 0.0]} castShadow>
						<boxGeometry args={[0.13, 0.07, 0.12]} />
						<meshStandardMaterial color="#E8B48A" roughness={0.6} />
					</mesh>
				</group>
			</>
		),
	},
	// 7 "e uma pequena estrela azul que sempre desenhava no canto das páginas"
	{
		a: w(42),
		light: 'noite',
		interior: true,
		sun: [155, 34],
		focus: [-0.5, 0, -1],
		cams: [{p: [-0.36, 0.98, -0.93], t: STAR_AT, fov: 30, move: 'pushIn', amount: 0.2, insert: true}],
		Scene: ({t, T}) => {
			const p = sr(t, 0.6, 2.4);
			const a = p * Math.PI * 2;
			return (
				<>
					<MaxRoom />
					<BlueStar progress={p} position={[STAR_AT[0], STAR_AT[1], STAR_AT[2]]} rotation={[-Math.PI / 2, 0, 0.3]} size={0.03} />
					<group position={[STAR_AT[0] + Math.cos(a) * 0.02 * (1 - p * 0.3), STAR_AT[1] + 0.07, STAR_AT[2] + Math.sin(a) * 0.02]} rotation={[0.5, 0, -0.3]}>
						<mesh>
							<cylinderGeometry args={[0.007, 0.007, 0.14, 8]} />
							<meshStandardMaterial color="#2F7BE8" roughness={0.4} />
						</mesh>
						<mesh position={[0, -0.075, 0]}>
							<coneGeometry args={[0.007, 0.015, 8]} />
							<meshStandardMaterial color="#1A2A48" />
						</mesh>
					</group>
				</>
			);
		},
	},
	// 8 "Em uma semana, a garota mais popular da escola" — de bruços na cama, chutando o ar
	{
		a: w(54),
		light: 'dia',
		interior: true,
		sun: [200, 20],
		focus: [-0.3, 0, -1],
		cams: [{p: [0.45, 1.0, 0.75], t: [-0.3, 0.7, -0.95], fov: 42, move: 'orbit', amount: 14}],
		Scene: ({t, T}) => (
			<>
				<GirlRoom />
				<Garota
					T={T}
					pose={{prone: true, legL: -55 + Math.sin(T * 6) * 28, legR: -55 - Math.sin(T * 6) * 28, armR: [150, -12], armL: [150, -12], head: [Math.sin(T * 2) * 8, -62, 0]}}
					expr="feliz"
					position={[-0.3, 0.56, -1.8]}
					holdR={<Phone screen="chat" position={[0, -0.02, 0.06]} rotation={[0, Math.PI, 0]} />}
				/>
				<FloatingHearts t={t} position={[-0.3, 0.95, -0.55]} count={7} spread={0.25} rise={0.45} />
			</>
		),
	},
	// 9 "começou a comentar em todas as minhas publicações" — digitando rápido, notificações
	{
		a: w(63),
		light: 'dia',
		interior: true,
		sun: [200, 20],
		focus: [-0.3, 0, -0.5],
		cams: [{p: [-0.12, 1.15, 0.75], t: [-0.3, 1.0, -0.05], fov: 40, move: 'pushIn', amount: 0.1}],
		Scene: ({t, T}) => (
			<>
				<GirlRoom />
				<Garota T={T} pose={{...P.typing(T), sit: true, head: [0, 18, 0]}} expr="feliz" position={GIRL_BED} holdR={HAND_PHONE('chat')} />
				<Notifs t={t} position={[-0.3, 1.0, 0.25]} count={9} />
			</>
		),
	},
	// 10 "Ela dizia que eu era o garoto mais talentoso que já tinha conhecido" — celular no peito
	{
		a: w(71),
		light: 'dia',
		interior: true,
		sun: [200, 20],
		focus: [0.3, 0, 0],
		cams: [
			{p: [0.4, 1.0, 1.45], t: [0.3, 0.82, 0.2], fov: 42, move: 'pushIn', amount: 0.1},
			{p: [0.2, 0.95, 0.95], t: [0.3, 0.88, 0.2], fov: 38, move: 'orbit', amount: 10},
		],
		Scene: ({t, T}) => (
			<>
				<GirlRoom />
				<Garota T={T} pose={P.chest(T)} expr="apaixonado" position={[0.3, 0, 0.2]} holdR={<Phone screen="chat" position={[0, -0.02, 0.04]} rotation={[-0.2, 0, 0]} />} />
				<FloatingHearts t={t} position={[0.3, 1.0, 0.2]} count={10} spread={0.4} rise={0.6} />
			</>
		),
	},
	// 11 "Na escola, porém, ela nem olhava para mim" — passa de nariz empinado
	{
		a: w(84),
		light: 'dia',
		interior: true,
		focus: [0, 0, -2],
		cams: [{p: [0.95, 1.0, 0.7], t: [-0.5, 0.9, -2.2], fov: 46, move: 'truck', amount: 0.4}],
		Scene: ({t, T}) => {
			const z = -4.2 + t * 1.25;
			const look = Math.atan2(z + 2.2, 1.1) / D;
			return (
				<>
					{hallway(T)}
					<Max T={T} pose={{...idle(T, 1), head: [clamp(look, -60, 60), 0, 0], armL: [55, -30]}} expr="vazio" position={[-1.0, 0, -2.2]} ry={MAX_RY} holdL={<Books position={[0.05, -0.02, 0.05]} rotation={[0, 0, 1.4]} />} />
					<Garota T={T} pose={{...walk(T), head: [38, -14, 0]}} expr="convencido" position={[0.15, 0, z]} />
				</>
			);
		},
	},
	// 12 "Mas, na internet, me mandava mensagens todos os dias" — Max na cama, notificações
	{
		a: w(92),
		light: 'noite',
		interior: true,
		sun: [155, 34],
		focus: [0.9, 0, -0.5],
		cams: [
			{p: [0.72, 1.15, 0.65], t: [0.95, 0.98, -0.45], fov: 42, move: 'pushIn', amount: 0.1},
			{p: [1.15, 1.08, 0.2], t: [0.95, 1.0, -0.45], fov: 36, move: 'orbit', amount: 10},
		],
		Scene: ({t, T}) => (
			<>
				<MaxRoom lamp={false} />
				<Max T={T} pose={{...P.phone(T), sit: true}} expr="feliz" position={MAX_BED} holdR={HAND_PHONE('chat')} />
				<pointLight position={[0.95, 1.0, -0.15]} color="#BCD2FF" intensity={1.5} distance={1.5} />
				<Notifs t={t} position={[0.95, 1.0, -0.15]} count={10} />
			</>
		),
	},
	// 13 "Uma noite, ela me perguntou se eu tinha namorada" — ela na cama, curiosa
	{
		a: w(101),
		light: 'noite',
		interior: true,
		sun: [155, 34],
		focus: [-0.3, 0, -0.5],
		cams: [{p: [0.25, 1.1, 0.8], t: [-0.3, 1.02, -0.05], fov: 40, move: 'pushIn', amount: 0.1}],
		Scene: ({T}) => (
			<>
				<GirlRoom night />
				<Garota T={T} pose={{...P.typing(T), sit: true, head: [10, 10, 10]}} expr="curioso" position={GIRL_BED} holdR={HAND_PHONE('chat')} />
				<pointLight position={[-0.3, 1.05, 0.3]} color="#BCD2FF" intensity={1.2} distance={1.4} />
			</>
		),
	},
	// 14 "Eu disse que não" — Max envergonhado digitando
	{
		a: w(110),
		light: 'noite',
		interior: true,
		sun: [155, 34],
		focus: [0.9, 0, -0.5],
		cams: [{p: [0.88, 1.02, 0.12], t: [0.95, 1.0, -0.5], fov: 38, move: 'pushIn', amount: 0.1}],
		Scene: ({T}) => (
			<>
				<MaxRoom lamp={false} />
				<Max T={T} pose={{...P.typing(T), sit: true}} expr="envergonhado" position={MAX_BED} holdR={HAND_PHONE('chat')} />
				<pointLight position={[0.95, 1.0, -0.15]} color="#BCD2FF" intensity={1.5} distance={1.5} />
			</>
		),
	},
	// 15 "Ela respondeu com três corações" — tela com os corações chegando um a um
	{
		a: w(114),
		light: 'noite',
		interior: true,
		sun: [155, 34],
		focus: [0.9, 0, -0.5],
		cams: [{p: [0.95, 1.0, 0.18], t: [0.95, 1.0, -0.2], fov: 34, move: 'pushIn', amount: 0.2, insert: true}],
		Scene: ({t, T}) => {
			const n = Math.min(3, Math.floor((T - w(117)) / 0.3) + 1);
			return (
				<>
					<MaxRoom lamp={false} />
					<Max T={T} pose={{...P.phone(T), sit: true}} expr="envergonhado" position={MAX_BED} />
					<Phone screen={n > 0 ? 'coracoes' : 'chat'} hearts={Math.max(0, n)} position={[0.95, 1.0, -0.12]} rotation={[0, 0, 0]} scale={1.15} />
					<pointLight position={[0.95, 1.0, 0.0]} color="#BCD2FF" intensity={1.2} distance={1.2} />
					{t > 0.2 && <FloatingHearts t={t - 0.2} position={[0.95, 1.03, -0.1]} count={3} spread={0.05} rise={0.08} size={0.012} color="#E63B6E" />}
				</>
			);
		},
	},
	// 16 "No dia seguinte, apareceu na escola" — corredor cheio, ela chega
	{
		a: w(119),
		light: 'dia',
		interior: true,
		focus: [0, 0, -3],
		cams: [{p: [0.35, 0.55, 1.4], t: [0, 1.0, -4], fov: 46, move: 'pushIn', amount: 0.2}],
		Scene: ({T, t}) => (
			<>
				{hallway(T)}
				<Garota T={T} pose={{...walk(T), head: [Math.sin(T) * 10, -6, 0]}} expr="feliz" position={[0.1, 0, -6 + t * 1.3]} />
			</>
		),
	},
	// 17 "perguntando ao meu irmão se ele tinha namorada" — ele aponta pra si mesmo
	{
		a: w(125),
		light: 'dia',
		interior: true,
		focus: [0.7, 0, -2.1],
		cams: [
			{p: [0.72, 1.08, -0.15], t: [0.72, 0.93, -2.12], fov: 42, move: 'truck', amount: 0.2, insert: true},
			{p: [0.5, 1.07, -1.2], t: [1.0, 1.0, -2.25], fov: 48, move: 'pushIn', amount: 0.1, insert: true},
		],
		Scene: ({T}) => (
			<>
				{hallway(T)}
				<Irmao T={T} pose={P.pointSelf(T)} expr="susto" position={[1.0, 0, -2.25]} ry={-Math.PI / 2 + 0.3} />
				<Garota T={T} pose={{...idle(T, 2), armL: [-28, 6], armR: [-28, 6], lean: 7, head: [0, -4, 10]}} expr="feliz" mouth={Math.max(0, Math.sin(T * 14)) * 0.6} position={[0.45, 0, -2.0]} ry={Math.PI / 2 - 0.2} />
			</>
		),
	},
	// 18 "Eu quase engasguei com o meu suco" — cuspe de suco na cantina
	{
		a: w(133),
		light: 'dia',
		interior: true,
		focus: [0.4, 0, -1],
		shakes: [w(135) + 0.05],
		cams: [{p: [0.45, 1.05, 0.55], t: [0.4, 0.95, -1.2], fov: 38, move: 'pushIn', amount: 0.15}],
		Scene: ({T}) => {
			const k = (T - w(135) - 0.05) / 0.9;
			return (
				<>
					<Cafeteria t={T} />
					<Max
						T={T}
						pose={{armR: k < 0 ? [118, -28] : [70, -20], armL: [40, -20], sit: true, head: [0, k < 0 ? -8 : -14, 0], lean: k > 0 && k < 0.4 ? -8 : 0}}
						expr={k < 0 ? 'neutro' : 'chocado'}
						position={[0.4, sitY(0.445, 0.95), -1.22]}
						holdR={<JuiceBox squeeze={k > 0 ? 1 : 0} position={[0, -0.03, 0.04]} />}
					/>
					<JuiceSpray k={k} position={[0.4, 1.0, -1.05]} />
				</>
			);
		},
	},
	// 19 "Meu irmão percebeu o que estava acontecendo" — sorriso de canto
	{
		a: w(140),
		light: 'dia',
		interior: true,
		focus: [0.6, 0, -2],
		cams: [{p: [0.5, 1.07, -1.08], t: [0.6, 1.0, -2], fov: 38, move: 'pushIn', amount: 0.12}],
		Scene: ({t, T}) => (
			<>
				{hallway(T)}
				<Irmao T={T} pose={{...idle(T, 3), head: [-30 + sr(t, 0.4, 1.2) * 30, 0, 0]}} expr={t < 0.8 ? 'curioso' : 'convencido'} position={[0.6, 0, -2]} />
			</>
		),
	},
	// 20 "e resolveu se aproveitar da situação" — sofá, óculos escuros, esfrega as mãos
	{
		a: w(147),
		light: 'dia',
		interior: true,
		sun: [150, 30],
		focus: [0, 0, -1.2],
		cams: [{p: [0.2, 1.05, 0.35], t: [0, 0.98, -1.25], fov: 40, move: 'pushIn', amount: 0.15}],
		Scene: ({T}) => (
			<>
				<LivingRoom />
				<Irmao T={T} pose={{...P.rub(T), sit: true}} expr="convencido" position={[0, sitY(0.46, 1.04), -1.2]} headWear={<Sunglasses position={[0, 0.015, 0.152]} />} />
			</>
		),
	},
	// 21 "Ele começou a fingir que era o dono da conta" — digita e aponta pra si
	{
		a: w(153),
		light: 'dia',
		interior: true,
		sun: [150, 30],
		focus: [0, 0, -1.2],
		cams: [{p: [-0.35, 1.1, 0.25], t: [0, 0.98, -1.25], fov: 40, move: 'orbit', amount: 12}],
		Scene: ({t, T}) => (
			<>
				<LivingRoom />
				<Irmao
					T={T}
					pose={{...(t < 1.2 ? P.phone(T) : P.pointSelf(T)), sit: true}}
					expr="convencido"
					position={[0, sitY(0.46, 1.04), -1.2]}
					headWear={<Sunglasses position={[0, 0.015, 0.152]} />}
					holdR={t < 1.2 ? HAND_PHONE('perfil') : undefined}
					holdL={t >= 1.2 ? HAND_PHONE('perfil') : undefined}
				/>
			</>
		),
	},
	// 22 "O pior é que ele nem sabia desenhar" — rabiscando com giz de cera
	{
		a: w(163),
		light: 'dia',
		interior: true,
		sun: [150, 30],
		focus: [0, 0, -0.6],
		cams: [{p: [0.55, 1.25, 0.6], t: [0, 0.8, -0.55], fov: 42, move: 'pushIn', amount: 0.15}],
		Scene: ({T}) => (
			<>
				<LivingRoom table />
				<mesh position={[0, 0.22, -0.9]} castShadow>
					<boxGeometry args={[0.45, 0.44, 0.4]} />
					<meshStandardMaterial color="#6B4A2E" roughness={0.8} />
				</mesh>
				<Irmao T={T} pose={{armR: [72 + Math.sin(T * 18) * 8, -14 + Math.cos(T * 15) * 10], armL: [55, -18], sit: true, head: [0, 26, Math.sin(T * 3) * 6], lean: 8}} expr="determinado" position={[0, sitY(0.44, 1.04), -0.9]} holdR={<Pencil color="#C9322B" position={[0, -0.02, 0.03]} rotation={[1.0, 0, 0]} />} />
				<Paper image="garota/tex/batata.png" w={0.2} h={0.36} position={[0.02, 0.729, -0.42]} rotation={[-Math.PI / 2, 0, 0.1]} />
				{[[-0.45, -0.25], [0.42, -0.2], [-0.35, 0.05]].map(([x, z], i) => (
					<mesh key={i} position={[x, 0.76, -0.4 + z]} castShadow>
						<icosahedronGeometry args={[0.035, 0]} />
						<meshStandardMaterial color="#F2EEE4" roughness={0.9} />
					</mesh>
				))}
				{['#3A6FD8', '#F2C230', '#5DA130', '#E27AA0'].map((c, i) => (
					<mesh key={c} position={[0.3 + i * 0.04, 0.732, -0.15]} rotation={[0, 0, Math.PI / 2]} castShadow>
						<cylinderGeometry args={[0.006, 0.006, 0.09, 6]} />
						<meshStandardMaterial color={c} />
					</mesh>
				))}
			</>
		),
	},
	// 23 "Quando ela pediu um desenho de um gato" — ela digitando o pedido
	{
		a: w(171),
		light: 'dia',
		interior: true,
		sun: [200, 20],
		focus: [-0.3, 0, -0.5],
		cams: [{p: [-0.6, 1.12, 0.65], t: [-0.3, 1.02, -0.05], fov: 40, move: 'pushIn', amount: 0.1}],
		Scene: ({T}) => (
			<>
				<GirlRoom />
				<Garota T={T} pose={{...P.typing(T), sit: true}} expr="curioso" position={GIRL_BED} holdR={HAND_PHONE('chat')} />
			</>
		),
	},
	// 24 "ele mandou uma coisa que parecia uma batata com orelhas" — mostra o desenho
	{
		a: w(179),
		light: 'dia',
		interior: true,
		sun: [150, 30],
		focus: [0, 0, -1],
		cams: [
			{p: [0.1, 1.0, 0.7], t: [0, 0.85, -1], fov: 40, move: 'pushIn', amount: 0.15},
			{p: [0, 0.75, -0.2], t: [0, 0.73, -0.83], fov: 40, move: 'pushIn', amount: 0.25},
		],
		Scene: ({T}) => (
			<>
				<LivingRoom />
				<Irmao T={T} pose={P.holdUp(T)} expr="feliz" position={[0, 0, -1]} />
				<Paper image="garota/tex/batata.png" w={0.24} h={0.42} position={[0, 0.74, -0.8]} rotation={[0, 0, Math.sin(T * 2) * 0.03]} />
			</>
		),
	},
	// 25 "E ela respondeu: Você é perfeito" — derretida, corações
	{
		a: w(189),
		light: 'dia',
		interior: true,
		sun: [200, 20],
		focus: [0.3, 0, 0],
		cams: [{p: [0.3, 0.98, 1.05], t: [0.3, 0.88, 0.2], fov: 40, move: 'pushIn', amount: 0.15}],
		Scene: ({t, T}) => (
			<>
				<GirlRoom />
				<Garota T={T} pose={P.chest(T)} expr="apaixonado" mouth={talk(T, 192, 194)} position={[0.3, 0, 0.2]} holdR={<Phone screen="chat" position={[0, -0.02, 0.04]} rotation={[-0.2, 0, 0]} />} />
				<FloatingHearts t={t + 0.6} position={[0.3, 0.95, 0.2]} count={14} spread={0.45} rise={0.7} />
			</>
		),
	},
	// 26 "Eu fiquei indignado" — vapor nas orelhas
	{
		a: w(195),
		light: 'noite',
		interior: true,
		sun: [155, 34],
		focus: [-0.2, 0, -0.3],
		shakes: [w(197)],
		cams: [{p: [-0.12, 0.98, 0.45], t: [-0.2, 0.9, -0.3], fov: 40, move: 'pushIn', amount: 0.2, ease: easeOutCubic}],
		Scene: ({t, T}) => (
			<>
				<MaxRoom />
				<Max T={T} pose={{...idle(T * 3, 1), armR: [40, 22], armL: [30, 26], bob: Math.abs(Math.sin(T * 9)) * 0.01}} expr="bravo" position={[-0.2, 0, -0.3]} holdR={HAND_PHONE('perfil')} />
				<Steam t={t} position={[-0.2, 0.92, -0.3]} />
			</>
		),
	},
	// 27 "Então decidi que estava na hora de contar a verdade" — determinado, contra-plongée
	{
		a: w(198),
		light: 'noite',
		interior: true,
		sun: [155, 34],
		focus: [-0.2, 0, -0.3],
		cams: [{p: [0.1, 0.5, 0.45], t: [-0.2, 1.0, -0.3], fov: 46, move: 'pushIn', amount: 0.22}],
		Scene: ({t, T}) => <><MaxRoom /><Max T={T} pose={t > 0.6 ? {...idle(T, 1), armR: [168, 18 + Math.sin(T * 3) * 4]} : idle(T, 1)} expr="determinado" position={[-0.2, 0, -0.3]} /></>,
	},
	// 28 "Na sexta-feira, criei coragem e mostrei meu celular para ela" — pátio
	{
		a: w(208),
		light: 'dia',
		sun: SCHOOL_SUN,
		focus: [0, 0, -1.8],
		cams: [
			{p: [0, 1.25, 2.2], t: [0, 0.8, -1.8], fov: 44, move: 'truck', amount: 0.5},
			{p: [-0.1, 1.0, -0.6], t: [0, 0.88, -1.8], fov: 40, move: 'pushIn', amount: 0.1},
		],
		Scene: ({t, T}) => {
			const x = Math.min(YARD_MAX[0], -2.6 + t * 1.3);
			const arrived = x >= YARD_MAX[0];
			const k = sr(t, 1.9, 2.4);
			return (
				<>
					<Schoolyard t={T} />
					<Max T={T} pose={arrived ? {...idle(T, 1), armR: [lerp(10, 82, k), -10]} : walk(T)} expr="determinado" position={[x, 0, YARD_MAX[2]]} ry={MAX_RY} holdR={HAND_PHONE('perfil')} />
					<Garota T={T} pose={{...idle(T, 2), head: [0, 0, 6]}} expr="curioso" position={YARD_GIRL} ry={GIRL_RY + 0.25} />
				</>
			);
		},
	},
	// 29 "Disse que a conta era minha" — por cima do ombro do Max
	{
		a: w(219),
		light: 'dia',
		sun: SCHOOL_SUN,
		focus: [0, 0, -1.8],
		cams: [{p: [-1.35, 1.48, -0.85], t: [0.3, 0.86, -1.85], fov: 40, move: 'pushIn', amount: 0.1, insert: true}],
		Scene: ({T}) => (
			<>
				<Schoolyard t={T} />
				<Max T={T} pose={{...idle(T, 1), armR: [82, -10]}} expr="determinado" mouth={Math.max(0, Math.sin(T * 13)) * 0.5} position={YARD_MAX} ry={MAX_RY} holdR={HAND_PHONE('perfil')} />
				<Garota T={T} pose={{...idle(T, 2), head: [8, 18, 0]}} expr="curioso" position={YARD_GIRL} ry={GIRL_RY + 0.25} />
			</>
		),
	},
	// 30 "que todos aqueles desenhos eram meus" — o caderno com a estrela (callback)
	{
		a: w(225),
		light: 'noite',
		interior: true,
		sun: [155, 34],
		focus: [-0.5, 0, -1],
		cams: [{p: [-0.47, 1.25, -0.98], t: [-0.48, 0.75, -1.13], fov: 32, move: 'pullOut', amount: 0.25, insert: true}],
		Scene: () => (
			<>
				<MaxRoom />
				<BlueStar progress={1} position={STAR_AT} rotation={[-Math.PI / 2, 0, 0.3]} size={0.03} />
			</>
		),
	},
	// 31 "Ela olhou para a tela," — olha pra baixo
	{
		a: w(231),
		light: 'dia',
		sun: SCHOOL_SUN,
		focus: [0, 0, -1.8],
		cams: [{p: [-0.45, 0.95, -1.2], t: [0.35, 0.86, -1.8], fov: 36, move: 'pushIn', amount: 0.1}],
		Scene: ({T}) => (
			<>
				<Schoolyard t={T} />
				<Max T={T} pose={{...idle(T, 1), armR: [82, -10]}} position={YARD_MAX} ry={MAX_RY} holdR={HAND_PHONE('perfil')} />
				<Garota T={T} pose={{...idle(T, 2), head: [10, 22, 0]}} expr="curioso" position={YARD_GIRL} ry={GIRL_RY + 0.25} />
			</>
		),
	},
	// 32 "depois olhou para mim" — levanta os olhos, surpresa
	{
		a: w(236),
		light: 'dia',
		sun: SCHOOL_SUN,
		focus: [0, 0, -1.8],
		cams: [{p: [-0.45, 0.95, -1.2], t: [0.35, 0.88, -1.8], fov: 34, move: 'pushIn', amount: 0.12}],
		Scene: ({t, T}) => (
			<>
				<Schoolyard t={T} />
				<Max T={T} pose={{...idle(T, 1), armR: [82, -10]}} position={YARD_MAX} ry={MAX_RY} holdR={HAND_PHONE('perfil')} />
				<Garota T={T} pose={{...idle(T, 2), head: [10 - sr(t, 0, 0.4) * 12, 22 - sr(t, 0, 0.4) * 26, 0]}} expr={t < 0.3 ? 'curioso' : 'susto'} position={YARD_GIRL} ry={GIRL_RY + 0.25} />
			</>
		),
	},
	// 33 "E começou a rir"
	{
		a: w(240),
		light: 'dia',
		sun: SCHOOL_SUN,
		focus: [0, 0, -1.8],
		cams: [{p: [-0.35, 0.92, -1.35], t: [0.35, 0.86, -1.8], fov: 40, move: 'orbit', amount: 10}],
		Scene: ({T}) => (
			<>
				<Schoolyard t={T} />
				<Garota T={T} pose={P.laugh(T)} expr="riso" position={YARD_GIRL} ry={GIRL_RY + 0.25} />
			</>
		),
	},
	// 34 "Espera, você é o garoto dos desenhos?" — aponta pra ele
	{
		a: w(244),
		light: 'dia',
		sun: SCHOOL_SUN,
		focus: [0, 0, -1.8],
		cams: [{p: [0, 1.1, 1.3], t: [0, 0.8, -1.8], fov: 40, move: 'pushIn', amount: 0.12, insert: true}],
		Scene: ({T}) => (
			<>
				<Schoolyard t={T} />
				<Max T={T} pose={{...idle(T, 1), armR: [30, -10]}} expr="envergonhado" position={YARD_MAX} ry={MAX_RY} holdR={HAND_PHONE('perfil')} />
				<Garota T={T} pose={{...idle(T, 2), armR: [86, 8], head: [0, 0, 8]}} expr="curioso" mouth={talk(T, 244, 250)} position={YARD_GIRL} ry={GIRL_RY} />
			</>
		),
	},
	// 35 "Eu balancei a cabeça" — Max confirma, tímido
	{
		a: w(251),
		light: 'dia',
		sun: SCHOOL_SUN,
		focus: [0, 0, -1.8],
		cams: [{p: [0.45, 0.95, -1.35], t: [-0.35, 0.88, -1.8], fov: 36, move: 'pushIn', amount: 0.1}],
		Scene: ({T}) => (
			<>
				<Schoolyard t={T} />
				<Max T={T} pose={{...P.nod(T), armR: [30, -10]}} expr="envergonhado" position={YARD_MAX} ry={MAX_RY} holdR={HAND_PHONE('perfil')} />
			</>
		),
	},
	// 36 "Ela ficou em silêncio por alguns segundos" — os dois parados, câmera lenta
	{
		a: w(255),
		light: 'dia',
		sun: SCHOOL_SUN,
		focus: [0, 0, -1.8],
		cams: [{p: [0.1, 1.45, 1.7], t: [0, 0.75, -1.8], fov: 34, move: 'pushIn', amount: 0.15, insert: true}],
		Scene: ({T}) => (
			<>
				<Schoolyard t={T} extras={false} />
				<Max T={T} pose={{armR: [20, -6], armL: [0, 4]}} expr="nervoso" position={YARD_MAX} ry={MAX_RY} holdR={HAND_PHONE('perfil')} />
				<Garota T={T} pose={{armR: [0, 4], armL: [0, 4], head: [0, 0, 0]}} expr="neutro" position={YARD_GIRL} ry={GIRL_RY} />
			</>
		),
	},
	// 37 "Então abriu uma pasta no celular" — toca no celular
	{
		a: w(262),
		light: 'dia',
		sun: SCHOOL_SUN,
		focus: [0, 0, -1.8],
		cams: [{p: [-0.4, 0.98, -1.3], t: [0.35, 0.82, -1.8], fov: 38, move: 'pushIn', amount: 0.12}],
		Scene: ({T}) => (
			<>
				<Schoolyard t={T} />
				<Garota T={T} pose={P.phoneTap(T)} expr="convencido" position={YARD_GIRL} ry={GIRL_RY + 0.25} holdR={<Phone image="garota/tex/galeria.png" position={[0, -0.03, 0.05]} rotation={[-Math.PI / 2 + 0.5, 0, 0]} scale={1.2} />} />
			</>
		),
	},
	// 38 "E me mostrou dezenas de desenhos!" — a tela cheia de desenhos com estrelinhas
	{
		a: w(268),
		light: 'dia',
		sun: SCHOOL_SUN,
		focus: [0, 0, -1.8],
		cams: [{p: [-0.25, 0.93, -1.1], t: [0.12, 0.9, -1.5], fov: 34, move: 'pushIn', amount: 0.3, insert: true}],
		Scene: ({t, T}) => (
			<>
				<Schoolyard t={T} />
				<Garota T={T} pose={{...idle(T, 2), armR: [88, -14]}} expr="convencido" position={YARD_GIRL} ry={GIRL_RY + 0.25} />
				<Phone image="garota/tex/galeria.png" position={[0.12, 0.9, -1.52 + sr(t, 0, 0.6) * 0.05]} rotation={[0, -0.95, 0]} scale={1.5} />
			</>
		),
	},
	// 39 "Eram todos meus!" — Max em choque (zoom-soco)
	{
		a: w(274),
		light: 'dia',
		sun: SCHOOL_SUN,
		focus: [0, 0, -1.8],
		shakes: [w(274) + 0.05],
		cams: [{p: [0.45, 0.93, -1.72], t: [-0.35, 0.9, -1.8], fov: 40, move: 'pushIn', amount: 0.35, ease: easeOutCubic}],
		Scene: ({T}) => (
			<>
				<Schoolyard t={T} />
				<Max T={T} pose={{...idle(T, 1), armR: [20, 14], armL: [20, 14], head: [0, -6, 0]}} expr="chocado" position={YARD_MAX} ry={MAX_RY} />
			</>
		),
	},
	// 40 "Ela olhou para mim e disse: Eu já sabia que era você desde o primeiro dia"
	{
		a: w(277),
		light: 'dia',
		sun: SCHOOL_SUN,
		focus: [0, 0, -1.8],
		cams: [
			{p: [-0.5, 0.93, -1.5], t: [0.35, 0.88, -1.8], fov: 36, move: 'pushIn', amount: 0.1},
			{p: [-0.3, 0.92, -1.62], t: [0.35, 0.9, -1.8], fov: 34, move: 'orbit', amount: 10},
		],
		Scene: ({T}) => (
			<>
				<Schoolyard t={T} />
				<Garota T={T} pose={P.hip(T)} expr="convencido" mouth={talk(T, 283, 292)} position={YARD_GIRL} ry={GIRL_RY} />
			</>
		),
	},
	// 41 "Seu irmão só estava me ajudando a descobrir se você gostava de mim" — irmão aparece atrás
	{
		a: w(293),
		light: 'dia',
		sun: SCHOOL_SUN,
		focus: [0, 0, -2],
		cams: [{p: [-0.65, 1.0, -1.35], t: [0.6, 0.95, -2.0], fov: 40, move: 'pushIn', amount: 0.12}],
		Scene: ({t, T}) => {
			const x = Math.max(1.0, 2.2 - t * 1.4);
			return (
				<>
					<Schoolyard t={T} />
					<Garota T={T} pose={P.hip(T)} expr="feliz" mouth={talk(T, 293, 305)} position={YARD_GIRL} ry={GIRL_RY} />
					<Irmao T={T} pose={x > 1.0 ? walk(T) : P.thumbs(T)} expr={x > 1.0 ? 'convencido' : 'piscando'} position={[x, 0, -2.3]} ry={x > 1.0 ? -Math.PI / 2 : -Math.PI / 2 + 0.6} />
				</>
			);
		},
	},
	// 42 "Eu fiquei completamente sem reação" — tela azul na cabeça do Max
	{
		a: w(306),
		light: 'dia',
		sun: SCHOOL_SUN,
		focus: [0, 0, -1.8],
		cams: [{p: [0.5, 0.95, -1.72], t: [-0.35, 0.92, -1.8], fov: 38, move: 'pushIn', amount: 0.15}],
		Scene: ({t, T}) => (
			<>
				<Schoolyard t={T} />
				<Max T={T} pose={{armR: [0, 3], armL: [0, 3]}} expr="vazio" position={YARD_MAX} ry={MAX_RY} />
				<Loading t={t} position={[-0.35, 1.26, -1.8]} rotation={[0, Math.PI / 2, 0]} />
			</>
		),
	},
	// 43 "Olhei para o meu irmão, que estava atrás dela," — foco vai pro irmão
	{
		a: w(311),
		light: 'dia',
		sun: SCHOOL_SUN,
		focus: [0.5, 0, -2],
		cams: [{p: [-0.55, 0.98, -1.62], t: [0.95, 1.0, -2.3], fov: 32, move: 'pushIn', amount: 0.15}],
		Scene: ({T}) => (
			<>
				<Schoolyard t={T} />
				<Garota T={T} pose={idle(T, 2)} expr="feliz" position={YARD_GIRL} ry={GIRL_RY} />
				<Irmao T={T} pose={{...idle(T, 3), armR: [10, 8], armL: [10, 8]}} expr="convencido" position={[1.0, 0, -2.3]} ry={-Math.PI / 2 + 0.6} />
			</>
		),
	},
	// 44 "segurando uma placa escrita: Finalmente!" — a placa sobe
	{
		a: w(320),
		light: 'dia',
		sun: SCHOOL_SUN,
		focus: [0.5, 0, -2],
		cams: [{p: [0.62, 1.12, -0.55], t: [1.0, 1.2, -2.3], fov: 38, move: 'pushIn', amount: 0.12, insert: true}],
		Scene: ({T}) => {
			const k = sr(T, w(323), w(324) + 0.1);
			const ry = -Math.PI / 2 + 0.6;
			return (
				<>
					<Schoolyard t={T} />
					<Garota T={T} pose={idle(T, 2)} expr="feliz" position={YARD_GIRL} ry={GIRL_RY} />
					<Irmao T={T} pose={{...idle(T, 3), armR: [lerp(40, 168, k), -10], armL: [lerp(40, 168, k), -10]}} expr={k > 0.5 ? 'riso' : 'convencido'} position={[1.0, 0, -2.3]} ry={ry} />
					<group position={[1.0 + Math.sin(ry) * 0.12, lerp(0.75, 1.55, k), -2.3 + Math.cos(ry) * 0.12]} rotation={[0, ry, Math.sin(T * 5) * 0.04 * k]}>
						<Sign />
					</group>
				</>
			);
		},
	},
	// 45 "E foi naquele momento que percebi" — pôr do sol: os dois comemoram
	{
		a: w(325),
		light: 'dia',
		sun: SUNSET,
		focus: [0.4, 0, -1.8],
		cams: [{p: [0, 1.1, 0.5], t: [0.45, 0.95, -2.0], fov: 42, move: 'truck', amount: 0.4}],
		Scene: ({T}) => (
			<>
				<Schoolyard t={T} extras={false} />
				<Garota T={T} pose={{...P.laugh(T), armR: [168, -22]}} expr="riso" position={[0.55, 0, -2.3]} ry={Math.PI / 2 - 0.5} />
				<Irmao T={T} pose={{...P.laugh(T + 0.3), armL: [168, -22]}} expr="riso" position={[1.0, 0, -2.3]} ry={-Math.PI / 2 + 0.5} />
				<directionalLight position={[-6, 1.5, 3]} color="#FF9A50" intensity={1.8} />
				<ambientLight color="#FFB27A" intensity={0.25} />
				<Max T={T} pose={P.scratch(T)} expr="envergonhado" position={[-0.1, 0, -1.0]} ry={0.15} />
			</>
		),
	},
	// 46 "Que o único enganado naquela história era eu" — close final
	{
		a: w(331),
		light: 'dia',
		sun: SUNSET,
		focus: [0, 0, -1],
		cams: [{p: [0.05, 0.92, -0.25], t: [-0.1, 0.9, -1.0], fov: 38, move: 'pushIn', amount: 0.18}],
		Scene: ({t, T}) => (
			<>
				<Schoolyard t={T} extras={false} />
				<directionalLight position={[-6, 1.5, 3]} color="#FF9A50" intensity={1.8} />
				<ambientLight color="#FFB27A" intensity={0.25} />
				<Max T={T} pose={t > 1.6 ? {...idle(T, 1), head: [0, 6, -4]} : P.scratch(T)} expr={t > 1.6 ? 'vazio' : 'envergonhado'} position={[-0.1, 0, -1.0]} ry={0.15} />
				<Garota T={T} pose={P.laugh(T)} expr="riso" position={[0.55, 0, -2.3]} ry={Math.PI / 2 - 0.5} />
				<Irmao T={T} pose={P.laugh(T + 0.3)} expr="riso" position={[1.0, 0, -2.3]} ry={-Math.PI / 2 + 0.5} />
			</>
		),
	},
];

/* ------------------------------------------------------------------ */
/* Render                                                              */
/* ------------------------------------------------------------------ */
const planEnd = (i: number) => (i + 1 < PLANS.length ? PLANS[i + 1].a : GAROTA_SECONDS);

const PlanView: React.FC<{plan: Plan; end: number}> = ({plan, end}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const t = frame / fps;
	const T = plan.a + t;
	const total = Math.round((end - plan.a) * fps);
	const n = plan.cams.length;
	const shots: Shot[] = plan.cams.map((c, i) => {
		const from = Math.round((total * i) / n);
		const to = Math.round((total * (i + 1)) / n);
		return {from, durationInFrames: to - from, position: fixDist(c), target: c.t, fov: c.fov ?? 45, move: c.move ?? 'static', amount: c.amount, ease: c.ease};
	});
	const shakes: Shake[] = (plan.shakes ?? []).map((s, i) => ({frame: Math.round((s - plan.a) * fps), duration: 9, intensity: 0.025, seed: i + 3}));
	return (
		<AbsoluteFill style={{backgroundColor: '#000'}}>
			<ThreeCanvas width={width} height={height} shadows={{enabled: true, type: THREE.PCFShadowMap}} dpr={1} gl={{antialias: false}}>
				<CameraRig shots={shots} shakes={shakes} />
				<Lighting preset={plan.light} focus={plan.focus ?? [0, 0, 0]} shadowExtent={plan.interior ? 5 : 9} sunAzimuth={plan.sun?.[0]} sunElevation={plan.sun?.[1]} interior={plan.interior ?? true} />
				{plan.light === 'noite' && <pointLight position={fixDist(plan.cams[0])} color="#C9D4FF" intensity={2.2} distance={6} decay={1.2} />}
				{plan.light === 'noite' && <ambientLight color="#8C98C8" intensity={0.55} />}
				<plan.Scene t={t} T={T} />
			</ThreeCanvas>
		</AbsoluteFill>
	);
};

export const GarotaVideo: React.FC = () => {
	const {fps} = useVideoConfig();
	const [ready, setReady] = useState(false);
	const [handle] = useState(() => delayRender('texturas'));
	useEffect(() => {
		preloadTextures().then(() => {
			setReady(true);
			continueRender(handle);
		});
	}, [handle]);
	if (!ready) return null;
	return (
		<AbsoluteFill style={{backgroundColor: '#000'}}>
			{PLANS.map((p, i) => {
				const from = Math.round(p.a * fps);
				const to = Math.round(planEnd(i) * fps);
				return (
					<Sequence key={i} from={from} durationInFrames={Math.max(1, to - from)} name={`Plano ${i}`}>
						<PlanView plan={p} end={planEnd(i)} />
					</Sequence>
				);
			})}
		</AbsoluteFill>
	);
};

/** Frame do meio de cada plano (para stills de QC). */
export const GAROTA_QC_FRAMES = PLANS.map((p, i) => Math.round(((p.a + planEnd(i)) / 2) * GAROTA_FPS));
