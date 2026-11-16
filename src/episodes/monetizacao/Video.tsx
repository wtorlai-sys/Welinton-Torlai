// Episódio "Monetização" — 1920×1080, 30 fps, duração = narração (104,36 s).
// Fundo global + cenas por janela de tempo (segundos globais) + legendas + áudio.
import React, {useEffect} from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {Bg, C, Flash, useT} from './kit';
import {Legendas, ensureEpisodeFonts} from './Legendas';
import {S1Gancho, S4Faixa, S7Milhao, S10Shorts} from './scenes/chave';

export const MON_FPS = 30;
export const MON_SECONDS = 104.36;
export const MON_FRAMES = Math.ceil(MON_SECONDS * MON_FPS);

type Cena = {id: string; a: number; b: number; C: React.FC; glow: string; glow2: string; speed?: number; dim?: number};

export const CENAS: Cena[] = [
	{id: 'c01', a: 0, b: 5.8, C: S1Gancho, glow: C.cyan, glow2: C.red},
	{id: 'c04', a: 26.95, b: 33.35, C: S4Faixa, glow: C.green, glow2: C.cyan},
	{id: 'c07', a: 48.4, b: 55.65, C: S7Milhao, glow: C.gold, glow2: C.purple},
	{id: 'c10', a: 70.8, b: 77.6, C: S10Shorts, glow: C.purple, glow2: C.red},
];

export const MonetizacaoVideo: React.FC<{audio?: boolean}> = ({audio = true}) => {
	const T = useT();
	useEffect(() => {
		ensureEpisodeFonts();
	}, []);
	const cena = CENAS.find((c) => T >= c.a && T < c.b);
	return (
		<AbsoluteFill style={{background: C.bg0, overflow: 'hidden'}}>
			<Bg glow={cena?.glow} glow2={cena?.glow2} speed={cena?.speed ?? 1} dim={cena?.dim ?? 0} />
			{cena && <cena.C />}
			{CENAS.map((c) => (
				<Flash key={c.id} t={c.a} dur={0.18} max={0.25} />
			))}
			<Legendas src="timestamps/monetizacao-legendas.json" y={915} />
			{audio && <Audio src={staticFile('audio/monetizacao.mp3')} />}
		</AbsoluteFill>
	);
};
