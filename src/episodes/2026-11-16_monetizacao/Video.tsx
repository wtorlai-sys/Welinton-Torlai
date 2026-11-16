// Vídeo 2026-11-16_monetizacao — 1920×1080, 30 fps, duração = narração (104,36 s).
// Fundo global + cenas por janela de tempo (segundos globais) + legendas + narração.
// Plano: episodios/2026-11-16_monetizacao/_CLAUDE/plano-cenas.md
import React, {useEffect} from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {Bg, C, Flash, useT} from '../monetizacao/kit';
import {Legendas, ensureEpisodeFonts} from '../monetizacao/Legendas';
import {C01Gancho, C02Mentira} from './scenes/gancho';
import {C03Mostrar, C04ValorFixo, C05Filtros, C06Faixa, C07DezMil, C08DezCinquenta, RegraHUD} from './scenes/corpo1';

const SLUG = '2026-11-16_monetizacao';
export const EP_FPS = 30;
export const EP_SECONDS = 104.36;
export const EP_FRAMES = Math.ceil(EP_SECONDS * EP_FPS);

type Cena = {id: string; a: number; b: number; C: React.FC; glow: string; glow2: string; speed?: number; dim?: number; flash?: boolean};

export const CENAS: Cena[] = [
	{id: 'c01', a: 0, b: 9.01, C: C01Gancho, glow: C.cyan, glow2: C.green},
	{id: 'c02', a: 9.01, b: 10.98, C: C02Mentira, glow: C.green, glow2: C.purple, flash: true},
	{id: 'c03', a: 10.98, b: 16.32, C: C03Mostrar, glow: C.cyan, glow2: C.green},
	{id: 'c04', a: 16.32, b: 21.91, C: C04ValorFixo, glow: C.cyan, glow2: C.gold},
	{id: 'c05', a: 21.91, b: 27.13, C: C05Filtros, glow: C.cyan, glow2: C.purple},
	{id: 'c06', a: 27.13, b: 33.27, C: C06Faixa, glow: C.green, glow2: C.cyan},
	{id: 'c07', a: 33.27, b: 40.2, C: C07DezMil, glow: C.purple, glow2: C.gold},
	{id: 'c08', a: 40.2, b: 43.44, C: C08DezCinquenta, glow: C.green, glow2: C.purple},
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
			<RegraHUD />
			{CENAS.filter((c) => c.flash).map((c) => (
				<Flash key={c.id} t={c.a} dur={0.2} max={0.5} />
			))}
			<Legendas src={`${SLUG}/legendas.json`} y={915} />
			{audio && <Audio src={staticFile(`${SLUG}/narracao.mp3`)} />}
		</AbsoluteFill>
	);
};
