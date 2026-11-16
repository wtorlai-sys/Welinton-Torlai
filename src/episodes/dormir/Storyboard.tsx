// Storyboard do episódio "Dormir no mesmo lugar" — 1 frame = 1 quadro-chave, renderizado no
// estilo final. Cada quadro já usa a legenda real (timestamps da narração) no instante `t`.
// Depois de aprovado, cada quadro vira uma cena animada com a mesma câmera/set/elenco.
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Character2DProps, Pose2D, pose2D} from '../../components/Character2D';
import {CAST} from '../../characters';
import {Lighting, LightingPreset} from '../../components/Lighting';
import {CameraRig, Shot} from '../../components/CameraRig';
import {Captions} from '../../components/Captions';
import {parseTimestamps, Word} from '../../lib/timestamps';
import {PALETTE} from '../../style/constants';
import {BED_TOP, Bedroom2, Kitchen2, Street2, WallPlaque} from './sets';
import {Character2D} from '../../components/Character2D';
import {DustMotes, LightShaft} from '../../components/LightFX';

export const NARRATION = {audio: 'audio/dormir-no-mesmo-lugar.mp3', timestamps: 'timestamps/dormir-no-mesmo-lugar.json', seconds: 82.36};

const KID = 0.75; // escala de criança

/** Personagem 2D do elenco (escala/expressão padrão do CAST). */
const C2: React.FC<{who: keyof typeof CAST} & Omit<Character2DProps, 'outfit'> & {outfit?: Character2DProps['outfit']}> = ({who, ...p}) => (
	<Character2D outfit={p.outfit ?? CAST[who].outfit} expression={p.expression ?? CAST[who].expressaoPadrao} scale={p.scale ?? CAST[who].escala} {...p} />
);

/** Empurrando algo para a direita da tela. */
const PUSH_R: Pose2D = {...pose2D('stand'), armR: [82, -4], armL: [-62, -6], lean: 12, legL: [20, 0], legR: [-6, 12]};
/** Sentado na beira da cama, pernas penduradas. */
const SIT_EDGE: Pose2D = {...pose2D('stand'), drop: 26, legL: [8, 0], legR: [8, 0], armL: [22, 20], armR: [22, 20]};

// Janela do fundo do quarto (Bedroom2) e da cozinha (Kitchen2), em coordenadas de mundo.
const BED_WIN: [THREE.Vector3Tuple, THREE.Vector3Tuple, THREE.Vector3Tuple, THREE.Vector3Tuple] = [[0.39, 1.26, -1.19], [0.99, 1.26, -1.19], [0.99, 0.57, -1.19], [0.39, 0.57, -1.19]];
const KIT_WIN: [THREE.Vector3Tuple, THREE.Vector3Tuple, THREE.Vector3Tuple, THREE.Vector3Tuple] = [[-0.99, 1.14, -1.19], [-0.45, 1.14, -1.19], [-0.45, 0.69, -1.19], [-0.99, 0.69, -1.19]];
const DaySun: React.FC = () => (
	<>
		<LightShaft window={BED_WIN} dir={[-0.324, -0.643, 0.694]} length={1.9} color="#FFE0A8" strength={0.16} />
		<DustMotes center={[0.35, 0.7, -0.6]} size={[0.8, 0.8, 1.0]} count={120} color="#FFF0D0" />
	</>
);
const MoonShaft: React.FC = () => (
	<>
		<LightShaft window={BED_WIN} dir={[-0.35, -0.57, 0.75]} length={1.9} color="#9DB4FF" strength={0.22} />
		<DustMotes center={[0.35, 0.75, -0.6]} size={[0.8, 0.8, 1.0]} count={160} />
	</>
);
const KitchenSun: React.FC = () => (
	<>
		<LightShaft window={KIT_WIN} dir={[0.262, -0.643, 0.72]} length={1.8} color="#FFE0A8" strength={0.16} />
		<DustMotes center={[-0.45, 0.65, -0.55]} size={[0.7, 0.7, 0.9]} count={120} color="#FFF0D0" />
	</>
);

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


export const PANELS: Panel[] = [
	{
		id: 'P1',
		t: 0.4,
		beat: 'Gancho: "se você dormir duas vezes no mesmo lugar, uma cópia sua vai aparecer"',
		plano: 'Médio no pé da cama, noite: Roberto dorme, a cópia sentada ao lado sorri (vira a thumbnail)',
		light: 'noite',
		sun: {az: 155, el: 34},
		focus: [0, 0, -0.5],
		shot: {position: [-0.24, 1.0, 0.85], target: [-0.25, 0.52, -0.95], fov: 52},
		captionY: 0.8,
		Scene: () => (
			<>
				<Bedroom2 lumps={[{x: -0.3, len: 1.3}, {x: 0.45, len: 0.9}]} />
				{/* Roberto dormindo: cabeça no travesseiro, corpo sob o edredom */}
				<Character2D outfit={CAST.roberto.outfit} expression="dormindo" pose={{...pose2D('sitBed'), drop: 34, headTilt: -16, armL: [5, 0], armR: [5, 0]}} position={[-0.79 * 0.6 + 0.0, 0.0, -1.0]} light={1} tint="#C7CCE8" />
				{/* a cópia, sentada, encarando a câmera */}
				<Character2D outfit={CAST.roberto.outfit} expression="sinistro" pose={{...pose2D('sitBed'), armL: [18, 35], armR: [18, 35]}} position={[-0.03, BED_TOP - 0.02, -0.82]} turn={-0.25} light={1} tint="#D8CFE2" shadowYaw={155} />
				<WallPlaque lines={['NOITE Nº', '2']} sizes={[0.3, 0.5]} red={1} position={[-0.5, 0.95, -1.19]} width={0.3} height={0.26} />
				<MoonShaft />
			</>
		),
	},
	{
		id: 'P2',
		t: 15.2,
		beat: '"…e na manhã seguinte encontrou outro Roberto dormindo ao seu lado"',
		plano: 'Aéreo simétrico (top-down) sobre a cama — ironia: dois Robertos idênticos',
		light: 'dia',
		sun: {az: 155, el: 50},
		focus: [-0.3, 0, -0.6],
		shot: {preset: 'aereo', subject: [-0.3, 0, -0.62], height: 2.5, dist: 89, fov: 50},
		captionY: 0.18,
		Scene: () => (
			<>
				<Bedroom2 ceiling={false} lampOn={false} folded={0.5} />
				<C2 who="roberto" expression="susto" pose="lie" flat position={[-0.52, BED_TOP + 0.06, -0.68]} light={1} />
				<C2 who="roberto" expression="dormindo" pose="lie" flat position={[-0.08, BED_TOP + 0.06, -0.68]} light={1} />
			</>
		),
	},
	{
		id: 'P3',
		t: 18.6,
		beat: '"E sabe o pior? O outro foi trabalhar no lugar dele."',
		plano: 'Aberto na frente da casa: o clone sai feliz com a maleta, o original de pijama na porta',
		light: 'dia',
		focus: [0.5, 0, 0.5],
		shot: {position: [1.45, 1.15, 4.3], target: [0.55, 0.7, -0.3], fov: 52},
		captionY: 0.2,
		Scene: () => (
			<>
				<Street2 />
				<C2 who="roberto" expression="susto" pose="shrug" position={[0, 0.1, -0.88]} light={-1} shadowYaw={-45} />
				<C2 who="roberto" outfit={CAST.roberto.variantes.trabalho} expression="feliz" pose="walk" t={0.35} position={[1.15, 0, 1.5]} turn={0.5} light={-1} hold="briefcase" shadowYaw={-45} />
			</>
		),
	},
	{
		id: 'P4',
		t: 25.8,
		beat: '"Mas minha irmã Nina, de 8 anos, odeia mudar de cama."',
		plano: 'Contra-plongée (câmera baixa) da Nina emburrada na frente da cama; placa-gag',
		light: 'dia',
		sun: {az: 155, el: 40},
		focus: [-0.3, 0, -0.5],
		shot: {position: [-0.18, 0.5, 1.35], target: [-0.3, 0.62, -0.6], fov: 52},
		captionY: 0.82,
		Scene: () => (
			<>
				<Bedroom2 wallpaper={['#8E6FD6', '#A88BE8']} duvet="#2BA59B" bedWidth={1.0} lampOn={false} curtain="#2BA59B" rug="#6FA8DC" />
				<C2 who="nina" expression="bravo" pose="crossArms" position={[-0.3, 0, 0.22]} light={1} tint="#FFF4E6" shadowYaw={155} />
				<WallPlaque lines={['CAMA DA NINA', 'NÃO MEXA']} sizes={[0.26, 0.36]} red={1} position={[0.02, 1.0, -1.19]} width={0.4} height={0.22} />
				<DaySun />
			</>
		),
	},
	{
		id: 'P5',
		t: 31.0,
		beat: '"Minha mãe sempre mudava os móveis de lugar para enganar a regra."',
		plano: 'Médio-aberto: a mãe empurra a cama; marcas no piso + contador na parede',
		light: 'dia',
		sun: {az: 155, el: 40},
		focus: [-0.2, 0, -0.4],
		shot: {position: [-0.05, 0.95, 1.65], target: [-0.1, 0.55, -0.5], fov: 52},
		captionY: 0.84,
		Scene: () => (
			<>
				<Bedroom2 wallpaper={['#8E6FD6', '#A88BE8']} duvet="#2BA59B" bedWidth={1.0} lampOn={false} curtain="#2BA59B" rug="#6FA8DC" bedOffset={[0.55, 0.35]} bedRot={0.3} dragMarks />
				<C2 who="mae" expression="bravo" pose={PUSH_R} position={[-0.5, 0, -0.05]} turn={0.6} light={1} tint="#FFF4E6" shadowYaw={155} />
				<WallPlaque lines={['CAMA MUDADA', 'DE LUGAR:', '364 VEZES']} sizes={[0.2, 0.2, 0.3]} red={2} position={[-0.62, 0.95, -1.19]} width={0.4} height={0.3} />
				<DaySun />
			</>
		),
	},
	{
		id: 'P6',
		t: 37.4,
		beat: '"Na manhã seguinte, encontrei Nina tomando leite na cozinha."',
		plano: 'Médio na cozinha: Nina bebendo leite, Zé (narrador) desconfiado; calendário "QUINTA" na geladeira',
		light: 'dia',
		sun: {az: 200, el: 40},
		focus: [0, 0, 0],
		shot: {position: [0.12, 0.95, 2.3], target: [0.12, 0.52, 0.0], fov: 52},
		captionY: 0.2,
		Scene: () => (
			<>
				<Kitchen2 />
				<C2 who="nina" expression="neutro" pose="drink" hold="glass" position={[0.22, 0, 0.45]} turn={-0.25} light={-1} shadowYaw={200} />
				<C2 who="ze" expression="deboche" pose="crossArms" position={[-0.18, 0, 0.85]} turn={0.45} light={-1} shadowYaw={200} />
				<WallPlaque lines={['QUINTA', 'FEIRA']} sizes={[0.36, 0.36]} position={[0.56, 0.86, -1.19]} width={0.24} height={0.19} />
				<KitchenSun />
			</>
		),
	},
	{
		id: 'P7',
		t: 42.4,
		beat: '"Duas Ninas! E as duas diziam ser a verdadeira!"',
		plano: 'Médio-aberto: as duas Ninas se acusando; Pai e Zé em choque no primeiro plano',
		light: 'dia',
		sun: {az: 200, el: 40},
		focus: [0, 0, 0.3],
		shot: {position: [0.0, 1.0, 2.9], target: [0.0, 0.46, 0.45], fov: 52},
		captionY: 0.18,
		Scene: () => (
			<>
				<Kitchen2 />
				<C2 who="nina" expression="bravo" pose="point" position={[-0.2, 0, 0.5]} turn={0.5} light={-1} shadowYaw={200} />
				<C2 who="nina" expression="bravo" pose="point" flip position={[0.2, 0, 0.5]} turn={0.5} light={-1} shadowYaw={200} />
				<C2 who="pai" expression="susto" pose="shrug" position={[-0.36, 0, 1.15]} turn={0.4} light={-1} shadowYaw={200} />
				<C2 who="ze" expression="susto" pose="armsUp" position={[0.36, 0, 1.2]} turn={-0.4} light={-1} shadowYaw={200} />
				<KitchenSun />
			</>
		),
	},
	{
		id: 'P8',
		t: 63.6,
		beat: '"Que bom que escolheram ela. Agora posso ficar com o quarto só para mim."',
		plano: 'Close de reação da Nina falsa (sorriso sinistro), dutch angle',
		light: 'dia',
		sun: {az: 200, el: 40},
		focus: [0, 0, 0.4],
		shot: {position: [0.05, 0.62, 1.2], target: [0.0, 0.56, 0.45], fov: 40, roll: 7},
		captionY: 0.82,
		Scene: () => (
			<>
				<Kitchen2 />
				<C2 who="nina" expression="sinistro" pose="stand" position={[0.0, 0, 0.45]} turn={-0.15} light={-1} tint="#E9E4F2" />
				<KitchenSun />
			</>
		),
	},
	{
		id: 'P9',
		t: 71.4,
		beat: '"Agora me conta, você teria coragem de dormir duas vezes no mesmo lugar?"',
		plano: 'Médio do Zé sentado na beira da cama falando com a câmera (CTA), noite',
		light: 'noite',
		sun: {az: 155, el: 34},
		focus: [-0.3, 0, -0.5],
		shot: {position: [-0.22, 0.72, 1.25], target: [-0.28, 0.58, -0.5], fov: 52},
		captionY: 0.84,
		Scene: () => (
			<>
				<Bedroom2 wallpaper={['#2F4F8A', '#3D63A8']} duvet="#E07A3A" bedWidth={1.0} curtain="#A07A36" />
				<C2 who="ze" expression="deboche" pose="sit" position={[-0.3, BED_TOP, -0.35]} turn={0.2} light={1} tint="#D3CFE6" shadowYaw={155} />
				<WallPlaque lines={['NOITE Nº', '1']} sizes={[0.3, 0.5]} position={[0.05, 0.98, -1.19]} width={0.28} height={0.24} />
				<MoonShaft />
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
