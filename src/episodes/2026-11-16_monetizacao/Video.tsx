// Vídeo 2026-11-16_monetizacao — 1920×1080, 30 fps, duração = narração (104,36 s).
// Fundo global + cenas por janela de tempo (segundos globais) + legendas + narração.
// Plano: episodios/2026-11-16_monetizacao/_CLAUDE/plano-cenas.md
import React, {useEffect} from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {Bg, C, Flash, easeOutCubic, k, lerp, useT} from '../monetizacao/kit';
import {Legendas, ensureEpisodeFonts} from '../monetizacao/Legendas';
import {C01Gancho, C02Mentira} from './scenes/gancho';
import {C09CemMil, C10Milhao, C11Apice, C12Virada, C13Assunto, C14Nichos} from './scenes/corpo2';
import {C15Diferenca, C16Shorts, C17Tarifa, C18Fatores, C19CTA} from './scenes/fim';
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
	{id: 'c09', a: 43.44, b: 48.48, C: C09CemMil, glow: C.gold, glow2: C.green, speed: 1.4},
	{id: 'c10', a: 48.48, b: 52.0, C: C10Milhao, glow: C.gold, glow2: C.purple, dim: 0.35},
	{id: 'c11', a: 52.0, b: 55.73, C: C11Apice, glow: C.green, glow2: C.gold, speed: 1.6},
	{id: 'c12', a: 55.73, b: 60.36, C: C12Virada, glow: C.purple, glow2: C.cyan, speed: 0.25, dim: 0.45},
	{id: 'c13', a: 60.36, b: 63.68, C: C13Assunto, glow: C.cyan, glow2: C.green},
	{id: 'c14', a: 63.68, b: 70.72, C: C14Nichos, glow: C.green, glow2: C.purple},
	{id: 'c15', a: 70.72, b: 73.05, C: C15Diferenca, glow: C.gold, glow2: C.cyan, flash: true},
	{id: 'c16', a: 73.05, b: 77.51, C: C16Shorts, glow: C.red, glow2: C.green},
	{id: 'c17', a: 77.51, b: 83.66, C: C17Tarifa, glow: C.gold, glow2: C.green},
	{id: 'c18', a: 83.66, b: 90.91, C: C18Fatores, glow: C.green, glow2: C.cyan},
	{id: 'c19', a: 90.91, b: 104.37, C: C19CTA, glow: C.cyan, glow2: C.green},
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
			<Legendas src={`${SLUG}/legendas.json`} y={915} cx={(T) => lerp(960, 600, easeOutCubic(k(T, 83.5, 0.4)))} />
			{audio && <Audio src={staticFile(`${SLUG}/narracao.mp3`)} />}
		</AbsoluteFill>
	);
};
