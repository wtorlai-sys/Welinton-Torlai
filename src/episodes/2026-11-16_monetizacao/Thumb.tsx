// Thumbnails do vídeo 2026-11-16_monetizacao — teste A/B.
// Feitas em 1920×1080 com o kit do vídeo e exportadas em 1280×720 (--scale).
// Regras: só valores ditos na narração; play vermelho genérico; nada importante no canto
// inferior direito (selo de duração do player); no máximo ~4 palavras grandes.
import React, {useEffect} from 'react';
import {AbsoluteFill} from 'remotion';
import {Big, Bill, C, Coin, F, Icon, PlayLogo} from '../monetizacao/kit';
import {ensureEpisodeFonts} from '../monetizacao/Legendas';

/** Fundo da thumb: mais saturado e contrastado que o do vídeo (lê bem em tamanho pequeno) */
const ThumbBg: React.FC<{a: string; b: string}> = ({a, b}) => (
	<AbsoluteFill style={{background: `linear-gradient(160deg, #0B1630 0%, ${C.bg0} 60%, #010205 100%)`, overflow: 'hidden'}}>
		<div style={{position: 'absolute', left: -300, top: -420, width: 1400, height: 1400, borderRadius: '50%', background: `radial-gradient(circle, ${a}55 0%, ${a}00 62%)`}} />
		<div style={{position: 'absolute', left: 820, top: 60, width: 1500, height: 1500, borderRadius: '50%', background: `radial-gradient(circle, ${b}50 0%, ${b}00 60%)`}} />
		<div style={{position: 'absolute', left: -800, right: -800, top: 760, height: 900, transform: 'perspective(700px) rotateX(68deg)', transformOrigin: '50% 0%', opacity: 0.5}}>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					backgroundImage: `linear-gradient(${b}66 2px, transparent 2px), linear-gradient(90deg, ${b}66 2px, transparent 2px)`,
					backgroundSize: '120px 120px',
					maskImage: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, #000 40%)',
					WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, #000 40%)',
				}}
			/>
		</div>
		<div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%)'}} />
	</AbsoluteFill>
);

const Abs: React.FC<{x: number; y: number; rot?: number; children: React.ReactNode; origin?: string}> = ({x, y, rot = 0, children, origin = '0 0'}) => (
	<div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg)`, transformOrigin: origin}}>{children}</div>
);

/** Seta grossa (vetor) */
const Arrow: React.FC<{w: number; color: string; down?: boolean}> = ({w, color, down}) => (
	<svg width={w} height={w} viewBox="0 0 100 100" style={{filter: `drop-shadow(0 0 30px ${color}) drop-shadow(0 10px 0 rgba(0,0,0,0.55))`, transform: down ? 'rotate(180deg)' : undefined}}>
		<path d="M50 4 L94 52 H66 V96 H34 V52 H6 Z" fill={color} stroke="#000" strokeWidth={4} strokeLinejoin="round" />
	</svg>
);

/* ------------------------------------------------------------------ */
/* A — o choque: 1.000 views → menos de R$ 5                           */
/* ------------------------------------------------------------------ */
const ThumbA: React.FC = () => (
	<AbsoluteFill>
		<ThumbBg a={C.cyan} b={C.red} />
		{/* cartão de vídeo com views */}
		<Abs x={80} y={190} rot={-4}>
			<div
				style={{
					width: 860,
					height: 640,
					borderRadius: 40,
					background: 'linear-gradient(160deg, #1B2A52 0%, #0E1630 100%)',
					border: `6px solid ${C.cyan}`,
					boxShadow: `0 0 70px ${C.cyan}77, 0 30px 60px rgba(0,0,0,0.6)`,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					gap: 26,
				}}
			>
				<PlayLogo size={260} />
				<div style={{display: 'flex', alignItems: 'center', gap: 22}}>
					<Icon name="eye" size={130} color={C.gold} stroke={2.8} />
					<Big size={170} color={C.gold} glow={C.gold} stroke={12}>
						1.000
					</Big>
				</div>
				<Big size={110} color="#fff" stroke={12}>
					VIEWS
				</Big>
			</div>
		</Abs>
		{/* valor */}
		<Abs x={1080} y={170}>
			<div style={{fontFamily: F.black, fontSize: 96, color: '#fff', WebkitTextStroke: '10px #000', paintOrder: 'stroke fill', background: C.red, padding: '8px 34px', borderRadius: 24, transform: 'rotate(4deg)', boxShadow: `0 0 50px ${C.red}AA`}}>
				MENOS DE
			</div>
		</Abs>
		<Abs x={1010} y={320}>
			<Big size={360} color={C.green} glow={C.green} stroke={18}>
				R$ 5
			</Big>
		</Abs>
		{/* seta vermelha para baixo + moedinhas caindo */}
		<Abs x={1040} y={690}>
			<Arrow w={210} color={C.red} down />
		</Abs>
		<Abs x={1280} y={700} rot={18}>
			<Coin size={130} />
		</Abs>
		<Abs x={1440} y={830} rot={-12}>
			<Coin size={90} spin={0.9} />
		</Abs>
		<Abs x={1590} y={660} rot={10}>
			<Big size={200} color="#fff" stroke={16}>
				?!
			</Big>
		</Abs>
	</AbsoluteFill>
);

/* ------------------------------------------------------------------ */
/* B — a ambição: 1 milhão de views → até R$ 5.000                     */
/* ------------------------------------------------------------------ */
const COINS: [number, number, number, number][] = [
	// x, y, tamanho, giro
	[60, 760, 150, 0.2],
	[300, 900, 110, 1.0],
	[1580, 90, 150, 0.5],
	[1730, 300, 110, 1.2],
	[60, 400, 100, 0.8],
	[1760, 520, 120, 0.1],
];
const BILLS: [number, number, number, number][] = [
	[1420, 230, 300, -18],
	[60, 70, 280, 14],
	[520, 830, 260, 8],
];

const ThumbB: React.FC = () => (
	<AbsoluteFill>
		<ThumbBg a={C.gold} b={C.green} />
		{/* raios de fundo */}
		<svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: 0.12}}>
			{Array.from({length: 18}).map((_, i) => {
				const a0 = (i / 18) * Math.PI * 2;
				const a1 = a0 + Math.PI / 36;
				const cx = 900;
				const cy = 560;
				const R = 1600;
				return <path key={i} d={`M${cx} ${cy} L${cx + Math.cos(a0) * R} ${cy + Math.sin(a0) * R} L${cx + Math.cos(a1) * R} ${cy + Math.sin(a1) * R} Z`} fill={C.gold} />;
			})}
		</svg>
		{/* gráfico disparando */}
		<svg width={1920} height={1080} style={{position: 'absolute', inset: 0, filter: `drop-shadow(0 0 22px ${C.green})`}}>
			<polyline points="120,1000 420,940 650,960 900,840 1120,720 1300,520 1460,260" fill="none" stroke={C.green} strokeWidth={22} strokeLinejoin="round" strokeLinecap="round" opacity={0.75} />
		</svg>
		{BILLS.map(([x, y, w, r], i) => (
			<Abs key={`b${i}`} x={x} y={y} rot={r}>
				<Bill w={w} value="R$" />
			</Abs>
		))}
		{COINS.map(([x, y, s, sp], i) => (
			<Abs key={`c${i}`} x={x} y={y}>
				<Coin size={s} spin={sp} />
			</Abs>
		))}
		{/* topo: 1 MILHÃO de views */}
		<Abs x={330} y={70}>
			<div style={{display: 'flex', alignItems: 'center', gap: 26}}>
				<PlayLogo size={190} />
				<Big size={150} color={C.gold} glow={C.gold} stroke={12}>
					1 MILHÃO
				</Big>
			</div>
		</Abs>
		<Abs x={560} y={250}>
			<div style={{display: 'flex', alignItems: 'center', gap: 18}}>
				<Icon name="eye" size={90} color="#fff" stroke={3} />
				<Big size={90} color="#fff" stroke={10}>
					DE VIEWS
				</Big>
			</div>
		</Abs>
		{/* o valor */}
		<Abs x={250} y={420}>
			<Big size={110} color="#fff" stroke={12}>
				ATÉ
			</Big>
		</Abs>
		<Abs x={200} y={520}>
			<Big size={300} color={C.green} glow={C.green} stroke={18}>
				R$ 5.000
			</Big>
		</Abs>
		{/* seta para cima */}
		<Abs x={1600} y={560}>
			<Arrow w={200} color={C.green} />
		</Abs>
	</AbsoluteFill>
);

export const MonetizacaoThumb: React.FC<{v: 'A' | 'B'}> = ({v}) => {
	useEffect(() => {
		ensureEpisodeFonts();
	}, []);
	return v === 'A' ? <ThumbA /> : <ThumbB />;
};
