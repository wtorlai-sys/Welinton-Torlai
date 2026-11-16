// Vídeo 2026-11-16_monetizacao — 1920×1080, 30 fps, duração = narração (104,36 s).
// Fundo global + cenas por janela de tempo (segundos globais) + legendas + narração.
// Plano: episodios/2026-11-16_monetizacao/_CLAUDE/plano-cenas.md
import React, {useEffect} from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {Bg, C, Flash, useT} from '../monetizacao/kit';
import {Legendas, ensureEpisodeFonts} from '../monetizacao/Legendas';
import {C01Gancho, C02Mentira} from './scenes/gancho';

const SLUG = '2026-11-16_monetizacao';
export const EP_FPS = 30;
export const EP_SECONDS = 104.36;
export const EP_FRAMES = Math.ceil(EP_SECONDS * EP_FPS);

type Cena = {id: string; a: number; b: number; C: React.FC; glow: string; glow2: string; speed?: number; dim?: number; flash?: boolean};

export const CENAS: Cena[] = [
	{id: 'c01', a: 0, b: 9.01, C: C01Gancho, glow: C.cyan, glow2: C.green},
	{id: 'c02', a: 9.01, b: 10.98, C: C02Mentira, glow: C.green, glow2: C.purple, flash: true},
];

export const Monetizacao20261116: React.FC<{audio?: boolean}> = ({audio = true}) => {
	const T = useT();
	useEffect(() => {
		ensureEpisodeFonts();
	}, []);
	const cena = CENAS.find((c) => T >= c.a && T < c.b);
	return (
		<AbsoluteFill style={{background: C.bg0, overflow: 'hidden'}}>
			<Bg glow={cena?.glow} glow2={cena?.glow2} speed={cena?.speed ?? 1} dim={cena?.dim ?? 0} />
			{cena && <cena.C />}
			{CENAS.filter((c) => c.flash).map((c) => (
				<Flash key={c.id} t={c.a} dur={0.2} max={0.5} />
			))}
			<Legendas src={`${SLUG}/legendas.json`} y={915} />
			{audio && <Audio src={staticFile(`${SLUG}/narracao.mp3`)} />}
		</AbsoluteFill>
	);
};
