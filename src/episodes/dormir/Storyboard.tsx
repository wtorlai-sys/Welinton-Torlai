// Storyboard do episódio "Dormir no mesmo lugar" — 1 frame = 1 quadro-chave, renderizado no
// estilo final. Cada quadro já usa a legenda real (timestamps da narração) no instante `t`.
// Depois de aprovado, cada quadro vira uma cena animada com a mesma câmera/set/elenco.
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Character, CharacterProps, HEAD_HEIGHT} from '../../components/Character';
import {CAST} from '../../characters';
import {Lighting, LightingPreset} from '../../components/Lighting';
import {CameraRig, Shot} from '../../components/CameraRig';
import {Captions} from '../../components/Captions';
import {MilkGlass} from '../../components/scenery';
import {parseTimestamps, Word} from '../../lib/timestamps';
import {PALETTE} from '../../style/constants';
import {BED_TOP, Bedroom, Briefcase, Kitchen, Street, WallPlaque, deg} from './sets';

export const NARRATION = {audio: 'audio/dormir-no-mesmo-lugar.mp3', timestamps: 'timestamps/dormir-no-mesmo-lugar.json', seconds: 82.36};

const KID = 0.75; // escala de criança
const kidHead = HEAD_HEIGHT.stand * KID;

type Panel = {
	id: string;
	/** instante da narração representado (s) */
	t: number;
	beat: string;
	plano: string;
	light: LightingPreset;
	sun?: {az: number; el: number};
	focus: [number, number, number];
	shot: Omit<Shot, 'from' | 'durationInFrames'>;
	captionY: number;
	Scene: React.FC;
};

// Sol entra pela janela da parede esquerda (-X): azimute -90°.
const WINDOW_SUN = {az: -90, el: 28};

/** Personagem com defaults do elenco. */
const Cast: React.FC<{who: keyof typeof CAST} & Omit<CharacterProps, 'outfit'>> = ({who, expression, ...p}) => (
	<Character outfit={CAST[who].outfit} expression={expression ?? CAST[who].expressaoPadrao} {...p} />
);

export const PANELS: Panel[] = [
	{
		id: 'P1',
		t: 0.4,
		beat: 'Gancho: "se você dormir duas vezes no mesmo lugar, uma cópia sua vai aparecer"',
		plano: 'Médio no pé da cama, noite (vira a thumbnail)',
		light: 'noite',
		sun: WINDOW_SUN,
		focus: [0, 0, -0.5],
		shot: {position: [1.95, 1.1, -0.2], target: [0.05, 0.5, -0.85], fov: 55},
		captionY: 0.78,
		Scene: () => (
			<>
				<Bedroom bed={{x: 0.18, z: -0.6, width: 1.5, duvet: '#5F7FB8', pillows: 2}} lampOn wardrobe={false} hideWalls={['right']} />
				<Cast who="roberto" expression="dormindo" pose="lie" lying position={[0.4, BED_TOP, -0.62]} />
				<Cast who="roberto" expression="sinistro" pose="sit" position={[-0.05, BED_TOP, -0.62]} rotation={[0, deg(70), 0]} />
				<WallPlaque lines={['NOITE Nº', '2']} sizes={[0.3, 0.5]} red={1} position={[0.12, 0.95, -1.19]} width={0.4} height={0.34} />
			</>
		),
	},
	{
		id: 'P2',
		t: 15.2,
		beat: '"…encontrou outro Roberto dormindo ao seu lado"',
		plano: 'Aéreo simétrico (top-down) sobre a cama — ironia',
		light: 'dia',
		sun: {az: -90, el: 40},
		focus: [0, 0, -0.5],
		shot: {preset: 'aereo', subject: [0.18, 0, -0.6], height: 3.0, dist: 89, fov: 50},
		captionY: 0.2,
		Scene: () => (
			<>
				<Bedroom bed={{x: 0.18, z: -0.6, width: 1.5, duvet: '#5F7FB8', pillows: 2}} ceiling={false} />
				<Cast who="roberto" expression="susto" pose="lie" lying position={[0.0, BED_TOP, -0.62]} />
				<Cast who="roberto" expression="dormindo" pose="lie" lying position={[0.37, BED_TOP, -0.62]} />
			</>
		),
	},
	{
		id: 'P3',
		t: 18.6,
		beat: '"E sabe o pior? O outro foi trabalhar no lugar dele."',
		plano: 'Aberto na frente da casa: o clone sai feliz com a maleta, o original de pijama na porta',
		light: 'dia',
		focus: [0.5, 0, 0],
		shot: {position: [1.6, 1.2, 4.6], target: [0.5, 0.75, -0.6], fov: 55},
		captionY: 0.2,
		Scene: () => (
			<>
				<Street />
				<Cast who="roberto" expression="susto" pose="shrug" position={[0, 0.1, -0.9]} />
				<Cast who="roberto" expression="feliz" pose="walk" t={0.35} position={[1.25, 0, 1.6]} rotation={[0, deg(55), 0]} rightHand={<Briefcase rotation={[0, Math.PI / 2, 0]} />} />
			</>
		),
	},
	{
		id: 'P4',
		t: 25.8,
		beat: '"Mas minha irmã Nina, de 8 anos, odeia mudar de cama."',
		plano: 'Médio da Nina emburrada na frente da cama; placa-gag na parede',
		light: 'dia',
		sun: WINDOW_SUN,
		focus: [0, 0, -0.4],
		shot: {position: [0.15, 0.8, 1.75], target: [0.15, 0.55, -0.5], fov: 55},
		captionY: 0.2,
		Scene: () => (
			<>
				<Bedroom bed={{x: 0.3, z: -0.6, duvet: '#B9A4E6'}} wallColor="#F0E2D0" />
				<Cast who="nina" expression="bravo" pose="crossArms" scale={KID} position={[0.12, 0, 0.12]} rotation={[0, deg(-8), 0]} />
				<WallPlaque lines={['CAMA DA NINA', 'NÃO MEXA']} sizes={[0.26, 0.36]} red={1} position={[0.3, 0.98, -1.19]} width={0.62} height={0.32} />
			</>
		),
	},
	{
		id: 'P5',
		t: 31.0,
		beat: '"Minha mãe sempre mudava os móveis de lugar para enganar a regra."',
		plano: 'Aberto do quarto: a mãe empurra a cama; marcas no piso + contador na parede',
		light: 'dia',
		sun: WINDOW_SUN,
		focus: [0, 0, -0.4],
		shot: {position: [0.2, 1.1, 2.4], target: [0.1, 0.5, -0.45], fov: 55},
		captionY: 0.8,
		Scene: () => (
			<>
				<Bedroom bed={{x: 0.36, z: -0.35, duvet: '#B9A4E6', rot: 0.35}} wallColor="#F0E2D0" dragMarks />
				<Cast who="mae" expression="bravo" pose="push" position={[-0.36, 0, 0.02]} rotation={[0, deg(70), 0]} />
				<WallPlaque lines={['CAMA MUDADA', 'DE LUGAR:', '364 VEZES']} sizes={[0.2, 0.2, 0.3]} red={2} position={[0.45, 0.98, -1.19]} width={0.6} height={0.4} />
			</>
		),
	},
	{
		id: 'P6',
		t: 37.4,
		beat: '"Na manhã seguinte, encontrei Nina tomando leite na cozinha."',
		plano: 'Médio na cozinha: Nina bebendo leite, Zé (narrador) desconfiado',
		light: 'dia',
		sun: WINDOW_SUN,
		focus: [0, 0, 0],
		shot: {position: [0.3, 1.0, 2.7], target: [0.2, 0.5, 0.0], fov: 55},
		captionY: 0.2,
		Scene: () => (
			<>
				<Kitchen />
				<Cast who="nina" expression="neutro" pose="drink" scale={KID} position={[0.0, 0, 0.5]} rotation={[0, deg(20), 0]} rightHand={<MilkGlass position={[0, -0.02, 0.03]} rotation={[deg(-40), 0, 0]} />} />
				<Cast who="ze" expression="deboche" pose="crossArms" scale={0.85} position={[0.48, 0, 0.85]} rotation={[0, deg(-40), 0]} />
				{/* calendário preso na geladeira */}
				<WallPlaque lines={['QUINTA', 'FEIRA']} sizes={[0.36, 0.36]} position={[0.93, 0.66, -0.755]} width={0.3} height={0.24} />
			</>
		),
	},
	{
		id: 'P7',
		t: 42.4,
		beat: '"Duas Ninas! E as duas diziam ser a verdadeira!"',
		plano: 'Médio-aberto: as duas Ninas se acusando; Pai e Zé em choque nas bordas',
		light: 'dia',
		sun: WINDOW_SUN,
		focus: [0, 0, 0],
		shot: {position: [0.05, 1.05, 3.4], target: [0.05, 0.45, 0.35], fov: 55},
		captionY: 0.2,
		Scene: () => (
			<>
				<Kitchen />
				<Cast who="nina" expression="bravo" pose="point" scale={KID} position={[-0.22, 0, 0.55]} rotation={[0, deg(70), 0]} />
				<Cast who="nina" expression="bravo" pose="point" scale={KID} position={[0.28, 0, 0.55]} rotation={[0, deg(-70), 0]} />
				<Cast who="pai" expression="susto" pose="shrug" position={[-0.38, 0, 1.2]} rotation={[0, deg(25), 0]} />
				<Cast who="ze" expression="susto" pose="shrug" scale={0.85} position={[0.4, 0, 1.25]} rotation={[0, deg(-25), 0]} />
			</>
		),
	},
	{
		id: 'P8',
		t: 63.6,
		beat: '"Que bom que escolheram ela. Agora posso ficar com o quarto só para mim."',
		plano: 'Close de reação da Nina falsa (sorriso sinistro), leve dutch angle',
		light: 'dia',
		sun: WINDOW_SUN,
		focus: [0, 0, 0],
		shot: {preset: 'close', subject: [0.0, kidHead, 0.45], facing: 10, height: kidHead + 0.12, roll: 6},
		captionY: 0.8,
		Scene: () => (
			<>
				<Kitchen />
				<Cast who="nina" expression="sinistro" pose="stand" scale={KID} position={[0.0, 0, 0.45]} rotation={[0, deg(10), 0]} />
			</>
		),
	},
	{
		id: 'P9',
		t: 71.4,
		beat: '"Agora me conta, você teria coragem de dormir duas vezes no mesmo lugar?"',
		plano: 'Médio do Zé sentado na cama falando com a câmera (CTA), noite',
		light: 'noite',
		sun: WINDOW_SUN,
		focus: [0, 0, -0.4],
		shot: {position: [0.55, 0.85, 1.45], target: [0.25, 0.5, -0.5], fov: 52},
		captionY: 0.8,
		Scene: () => (
			<>
				<Bedroom bed={{x: 0.3, z: -0.6, duvet: PALETTE.turquoise}} lampOn wallColor="#DDE3EC" />
				<Cast who="ze" expression="deboche" pose="sit" position={[0.12, BED_TOP, -0.6]} rotation={[0, deg(65), 0]} />
				<WallPlaque lines={['NOITE Nº', '1']} sizes={[0.3, 0.5]} position={[0.55, 1.02, -1.19]} width={0.45} height={0.38} />
			</>
		),
	},
];

export const Storyboard: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const p = PANELS[Math.min(frame, PANELS.length - 1)];
	const [words, setWords] = useState<Word[] | null>(null);
	const [handle] = useState(() => delayRender('timestamps'));
	useEffect(() => {
		fetch(staticFile(NARRATION.timestamps))
			.then((r) => r.json())
			.then((j) => setWords(parseTimestamps(j)))
			.finally(() => continueRender(handle));
	}, [handle]);
	const shots: Shot[] = [{from: 0, durationInFrames: PANELS.length, ...p.shot, move: 'static'} as Shot];
	const bg = p.light === 'dia' ? PALETTE.skyHorizon : PALETTE.nightBg;
	return (
		<AbsoluteFill style={{backgroundColor: bg}}>
			<ThreeCanvas key={p.id} width={width} height={height} shadows={{enabled: true, type: THREE.PCFShadowMap}} dpr={1} gl={{antialias: false}}>
				<CameraRig shots={shots} />
				<Lighting preset={p.light} focus={p.focus} shadowExtent={6} sunAzimuth={p.sun?.az} sunElevation={p.sun?.el} interior={p.id !== 'P3'} />
				<p.Scene />
			</ThreeCanvas>
			{words && <Captions words={words} captionY={p.captionY} offset={p.t - frame / fps} />}
		</AbsoluteFill>
	);
};
