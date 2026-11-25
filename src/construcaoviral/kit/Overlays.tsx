// Kit "Construção Viral" — camada 2D (DOM/SVG) sobre o 3D: legenda, pílulas, rótulos, setas, cotas, ícones,
// rebobinar/avanço, chuva, confete, CTA. Posições de mundo chegam já projetadas (px).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CAPTION_FONT} from '../../style/fonts';
import {PALETTE, SAFE} from '../../style/constants';
import {clamp, easeOutBack, easeOutCubic} from '../../style/easing';
import {hash1, mulberry32} from '../../style/random';
import {Word} from '../../lib/timestamps';

export const AMARELO = '#FFD21F';
export const AZUL = '#2F8FE8';
export const VERDE = '#2DBE5A';
export const VERMELHO = PALETTE.accent;
export const CINZA = '#8C949E';
const FONT = `'${CAPTION_FONT}', 'Arial Black', sans-serif`;

const pop = (age: number, dur = 0.25) => easeOutBack(clamp(age / dur));

/* ---------------------------------- legenda --------------------------------- */
const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const Legenda: React.FC<{words: Word[]; T: number; y: number; amarelas: Set<string>; corrige?: Record<string, string>}> = ({words, T, y, amarelas, corrige = {}}) => {
	let i = -1;
	for (let j = 0; j < words.length; j++) {
		if (words[j].start <= T + 0.02) i = j;
		else break;
	}
	if (i < 0) return null;
	const w = words[i];
	if (!words[i + 1] && T > w.end + 0.6) return null;
	let txt = w.text.replace(/[.,;:!?…"“”]/g, '');
	txt = corrige[txt.toLowerCase()] ?? txt;
	const hi = amarelas.has(`${i}`) || amarelas.has(txt.toLowerCase());
	const s = 0.82 + 0.18 * easeOutCubic(clamp((T - w.start) / 0.1));
	const yy = clamp(y, SAFE.top + 0.05, 1 - SAFE.bottom - 0.05);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div style={{position: 'absolute', left: 0, width: '90%', top: `${yy * 100}%`, transform: `translateY(-50%) scale(${s})`, display: 'flex', justifyContent: 'center'}}>
				<span
					style={{
						fontFamily: FONT,
						fontWeight: 900,
						fontSize: 92,
						lineHeight: 1,
						color: hi ? AMARELO : '#FFFFFF',
						WebkitTextStroke: '16px #141414',
						paintOrder: 'stroke fill',
						textShadow: '0 6px 0 rgba(0,0,0,0.55)',
						whiteSpace: 'nowrap',
					}}
				>
					{titleCase(txt)}
				</span>
			</div>
		</AbsoluteFill>
	);
};

/* ---------------------------------- pílula ---------------------------------- */
export const Pilula: React.FC<{x: number; y: number; text: string; cor: string; age: number; out?: number}> = ({x, y, text, cor, age, out = 1}) => {
	const s = pop(age) * out;
	if (s <= 0.01) return null;
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				transform: `translate(-50%,-50%) scale(${s})`,
				background: '#FFFFFF',
				border: `5px solid ${cor}`,
				borderRadius: 40,
				padding: '8px 22px 8px 16px',
				display: 'flex',
				alignItems: 'center',
				gap: 10,
				boxShadow: '0 4px 0 rgba(0,0,0,0.25)',
				whiteSpace: 'nowrap',
			}}
		>
			<div style={{width: 18, height: 18, borderRadius: 9, background: cor}} />
			<span style={{fontFamily: FONT, fontWeight: 900, fontSize: 38, color: '#1C1C1C', letterSpacing: '0.02em'}}>{text}</span>
		</div>
	);
};

/* --------------------------- rótulo amarelo do termo ------------------------ */
export const Rotulo: React.FC<{x: number; y: number; text: string; age: number; out?: number}> = ({x, y, text, age, out = 1}) => {
	const s = pop(age, 0.3) * out;
	if (s <= 0.01) return null;
	return (
		<div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(-6deg) scale(${s})`, whiteSpace: 'nowrap'}}>
			<span style={{fontFamily: FONT, fontWeight: 900, fontSize: 64, color: AMARELO, WebkitTextStroke: '12px #1A1A1A', paintOrder: 'stroke fill', textShadow: '0 5px 0 rgba(0,0,0,0.5)'}}>{text}</span>
		</div>
	);
};

/* ----------------------------------- setas ---------------------------------- */
export const Seta: React.FC<{a: {x: number; y: number}; b: {x: number; y: number}; cor: string; grow: number; w?: number}> = ({a, b, cor, grow, w = 16}) => {
	if (grow <= 0.01) return null;
	const ex = a.x + (b.x - a.x) * grow;
	const ey = a.y + (b.y - a.y) * grow;
	const ang = Math.atan2(ey - a.y, ex - a.x);
	const L = Math.hypot(ex - a.x, ey - a.y);
	const head = Math.min(w * 2.6, L * 0.6);
	const hx = ex - Math.cos(ang) * head;
	const hy = ey - Math.sin(ang) * head;
	const px = Math.cos(ang + Math.PI / 2);
	const py = Math.sin(ang + Math.PI / 2);
	return (
		<svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
			<line x1={a.x} y1={a.y} x2={hx} y2={hy} stroke="#151515" strokeWidth={w + 8} strokeLinecap="round" />
			<polygon points={`${ex},${ey} ${hx + px * head * 0.62},${hy + py * head * 0.62} ${hx - px * head * 0.62},${hy - py * head * 0.62}`} fill={cor} stroke="#151515" strokeWidth={5} strokeLinejoin="round" />
			<line x1={a.x} y1={a.y} x2={hx} y2={hy} stroke={cor} strokeWidth={w} strokeLinecap="round" />
		</svg>
	);
};

/* ----------------------------------- cotas ---------------------------------- */
export const Cota: React.FC<{a: {x: number; y: number}; b: {x: number; y: number}; text: string; age: number; lado?: number}> = ({a, b, text, age, lado = 1}) => {
	const g = clamp(age / 0.4);
	if (g <= 0) return null;
	const mx = (a.x + b.x) / 2;
	const my = (a.y + b.y) / 2;
	const ex = a.x + (b.x - a.x) * g;
	const ey = a.y + (b.y - a.y) * g;
	const ang = Math.atan2(b.y - a.y, b.x - a.x);
	const nx = Math.cos(ang + Math.PI / 2) * 16;
	const ny = Math.sin(ang + Math.PI / 2) * 16;
	return (
		<>
			<svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
				{[
					[a.x, a.y, ex, ey],
					[a.x - nx, a.y - ny, a.x + nx, a.y + ny],
					[ex - nx, ey - ny, ex + nx, ey + ny],
				].map(([x1, y1, x2, y2], i) => (
					<g key={i}>
						<line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#151515" strokeWidth={12} strokeLinecap="round" />
						<line x1={x1} y1={y1} x2={x2} y2={y2} stroke={AMARELO} strokeWidth={6} strokeLinecap="round" />
					</g>
				))}
			</svg>
			<div style={{position: 'absolute', left: mx + nx * 3.2 * lado, top: my + ny * 3.2 * lado, transform: `translate(-50%,-50%) scale(${pop(age - 0.2)})`, whiteSpace: 'nowrap'}}>
				<span style={{fontFamily: FONT, fontWeight: 900, fontSize: 56, color: AMARELO, WebkitTextStroke: '11px #151515', paintOrder: 'stroke fill'}}>{text}</span>
			</div>
		</>
	);
};

/* ------------------------------- ícones e balões ---------------------------- */
export const Icone: React.FC<{x: number; y: number; tipo: 'ok' | 'x'; age: number}> = ({x, y, tipo, age}) => {
	const s = pop(age);
	if (s <= 0.01) return null;
	const cor = tipo === 'ok' ? VERDE : VERMELHO;
	return (
		<div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${s})`, width: 110, height: 110, borderRadius: 55, background: cor, border: '8px solid #FFF', boxShadow: '0 5px 0 rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
			<span style={{fontFamily: FONT, fontWeight: 900, fontSize: 70, color: '#FFF', lineHeight: 1}}>{tipo === 'ok' ? '✓' : '✕'}</span>
		</div>
	);
};

export const Balao: React.FC<{x: number; y: number; text: string; age: number; cor?: string}> = ({x, y, text, age, cor = VERMELHO}) => {
	const s = pop(age);
	if (s <= 0.01) return null;
	return (
		<div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(-4deg) scale(${s})`, background: '#FFF', border: `6px solid ${cor}`, borderRadius: 24, padding: '10px 26px', whiteSpace: 'nowrap', boxShadow: '0 5px 0 rgba(0,0,0,0.3)'}}>
			<span style={{fontFamily: FONT, fontWeight: 900, fontSize: 50, color: cor}}>{text}</span>
		</div>
	);
};

/** Texto grande amarelo solto (números: "45.000 L"). */
export const Destaque: React.FC<{x: number; y: number; text: string; age: number; size?: number}> = ({x, y, text, age, size = 96}) => {
	const s = pop(age, 0.3);
	if (s <= 0.01) return null;
	return (
		<div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${s})`, whiteSpace: 'nowrap'}}>
			<span style={{fontFamily: FONT, fontWeight: 900, fontSize: size, color: AMARELO, WebkitTextStroke: `${size * 0.18}px #151515`, paintOrder: 'stroke fill', textShadow: '0 6px 0 rgba(0,0,0,0.45)'}}>{text}</span>
		</div>
	);
};

/* ------------------------------ rebobinar / avanço -------------------------- */
export const Rebobinar: React.FC<{x: number}> = ({x}) => (
	<AbsoluteFill style={{pointerEvents: 'none'}}>
		<AbsoluteFill style={{background: 'rgba(255,255,255,0.12)'}} />
		{Array.from({length: 16}).map((_, i) => {
			const y = ((i * 131 + x * 900) % 1920 + 1920) % 1920;
			return <div key={i} style={{position: 'absolute', left: 0, right: 0, top: y, height: 6 + (i % 3) * 3, background: 'rgba(255,255,255,0.55)'}} />;
		})}
		<div style={{position: 'absolute', left: '50%', top: '24%', transform: 'translate(-50%,-50%)', display: 'flex', gap: 0}}>
			{[0, 1].map((i) => (
				<svg key={i} width={110} height={120} viewBox="0 0 110 120">
					<polygon points="100,10 100,110 14,60" fill="#FFF" stroke="#222" strokeWidth={6} strokeLinejoin="round" />
				</svg>
			))}
		</div>
	</AbsoluteFill>
);

export const Avanco: React.FC = () => (
	<div style={{position: 'absolute', right: '14%', top: '12%', display: 'flex'}}>
		{[0, 1].map((i) => (
			<svg key={i} width={70} height={76} viewBox="0 0 110 120">
				<polygon points="10,10 10,110 96,60" fill={AMARELO} stroke="#222" strokeWidth={8} strokeLinejoin="round" />
			</svg>
		))}
	</div>
);

/* ------------------------------- chuva / confete ---------------------------- */
export const Chuva: React.FC<{T: number; k: number}> = ({T, k}) => {
	if (k <= 0.01) return null;
	return (
		<svg style={{position: 'absolute', left: 0, top: 0, opacity: k}} width={1080} height={1920}>
			{Array.from({length: 140}).map((_, i) => {
				const x0 = hash1(i) * 1300 - 100;
				const sp = 2600 + hash1(i + 50) * 900;
				const y = ((hash1(i + 9) * 2200 + T * sp) % 2200) - 200;
				const x = x0 - (y / 1920) * 160;
				return <line key={i} x1={x} y1={y} x2={x - 14} y2={y + 70} stroke="rgba(235,245,255,0.75)" strokeWidth={4} strokeLinecap="round" />;
			})}
		</svg>
	);
};

export const Confete: React.FC<{age: number}> = ({age}) => {
	if (age < 0 || age > 4) return null;
	const rnd = mulberry32(7);
	const cores = ['#FFD21F', '#2F8FE8', '#2DBE5A', '#FF7AB8', '#FF8A1F', '#9B6BFF', '#FFFFFF'];
	return (
		<svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920}>
			{Array.from({length: 160}).map((_, i) => {
				const x0 = rnd() * 1080;
				const vx = (rnd() - 0.5) * 500;
				const vy = -1400 - rnd() * 900;
				const g = 1900;
				const y = 1500 + vy * age + 0.5 * g * age * age;
				const x = x0 + vx * age + Math.sin(age * 6 + i) * 30;
				const r = age * 500 + i * 37;
				const c = cores[i % cores.length];
				return <rect key={i} x={x} y={y} width={22} height={12} fill={c} transform={`rotate(${r} ${x + 11} ${y + 6})`} />;
			})}
		</svg>
	);
};

/** Tingimento quando a câmera está debaixo d'água. */
export const Subaquatico: React.FC<{k: number}> = ({k}) =>
	k <= 0.01 ? null : <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, rgba(80,190,235,0.12), rgba(10,90,150,0.38))', opacity: k}} />;

/** Ondulação de calor (sol forte sobre pedra escura). */
export const Calor: React.FC<{T: number; k: number; y: number}> = ({T, k, y}) =>
	k <= 0.01 ? null : (
		<svg style={{position: 'absolute', left: 0, top: 0, opacity: k}} width={1080} height={1920}>
			{Array.from({length: 7}).map((_, i) => {
				const x = 120 + i * 140;
				const yy = y - ((T * 160 + i * 70) % 260);
				return <path key={i} d={`M ${x} ${yy} q 18 -30 0 -60 q -18 -30 0 -60`} stroke="rgba(255,140,40,0.8)" strokeWidth={9} fill="none" strokeLinecap="round" />;
			})}
		</svg>
	);

/* ------------------------------------ CTA ----------------------------------- */
export const CTA: React.FC<{age: number; sabia: string; naoSabia: string; canal?: string}> = ({age, sabia, naoSabia, canal}) => {
	if (age < 0) return null;
	const l = (a: number, txt: string, size: number, cor: string, top: number) => {
		const s = pop(age - a, 0.3);
		return s <= 0.01 ? null : (
			<div style={{position: 'absolute', left: '45%', top, transform: `translate(-50%,0) scale(${s})`, whiteSpace: 'nowrap'}}>
				<span style={{fontFamily: FONT, fontWeight: 900, fontSize: size, color: cor, WebkitTextStroke: `${size * 0.16}px #151515`, paintOrder: 'stroke fill'}}>{txt}</span>
			</div>
		);
	};
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{l(0, 'SABIA? COMENTE', 44, '#FFFFFF', 200)}
			{l(0.25, `“${sabia}”`, 88, AMARELO, 255)}
			{l(2.4, 'NÃO SABIA? COMENTE', 44, '#FFFFFF', 385)}
			{l(2.65, `“${naoSabia}”`, 88, '#7FD3FF', 440)}
			{canal &&
				(() => {
					const s = pop(age - 3.2);
					return s <= 0.01 ? null : (
						<div style={{position: 'absolute', left: '42%', top: '74%', transform: `translate(-50%,-50%) scale(${s})`, background: 'rgba(30,30,30,0.85)', borderRadius: 16, padding: '10px 26px'}}>
							<span style={{fontFamily: FONT, fontWeight: 900, fontSize: 40, color: '#FFF'}}>{canal}</span>
						</div>
					);
				})()}
		</AbsoluteFill>
	);
};

/** Lupa de "microscópio" com bichinhos e algas (2D). */
export const Lupa: React.FC<{x: number; y: number; age: number; limpa: number; T: number}> = ({x, y, age, limpa, T}) => {
	const s = pop(age, 0.35);
	if (s <= 0.01) return null;
	const rnd = mulberry32(3);
	return (
		<div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${s})`}}>
			<svg width={520} height={520} viewBox="-260 -260 520 520">
				<defs>
					<clipPath id="lupa">
						<circle r={230} />
					</clipPath>
				</defs>
				<circle r={244} fill="#1A1A1A" />
				<g clipPath="url(#lupa)">
					<rect x={-260} y={-260} width={520} height={520} fill="#7FD0F2" />
					{Array.from({length: 14}).map((_, i) => {
						const bx = (rnd() - 0.5) * 380 + Math.sin(T * 2 + i) * 18;
						const by = (rnd() - 0.5) * 380 + Math.cos(T * 1.7 + i) * 18;
						const alga = i % 3 === 0;
						const o = 1 - limpa;
						return alga ? (
							<path key={i} d={`M ${bx} ${by} q 20 -30 0 -60 q -20 -30 0 -60`} stroke="#3FA34D" strokeWidth={14} fill="none" opacity={o} strokeLinecap="round" />
						) : (
							<g key={i} opacity={o} transform={`translate(${bx} ${by}) rotate(${i * 40 + T * 40})`}>
								<ellipse rx={30} ry={16} fill="#B6E36B" stroke="#4F7A1F" strokeWidth={5} />
								<circle cx={10} cy={-3} r={4} fill="#222" />
								<circle cx={-4} cy={-3} r={4} fill="#222" />
							</g>
						);
					})}
				</g>
				<circle r={234} fill="none" stroke="#FFF" strokeWidth={10} />
			</svg>
		</div>
	);
};

/** Régua de pH: ponteiro vai de `de` até `para` (0 ácido … 1 básico). */
export const ReguaPH: React.FC<{x: number; y: number; age: number; v: number}> = ({x, y, age, v}) => {
	const s = pop(age, 0.3);
	if (s <= 0.01) return null;
	return (
		<div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${s})`}}>
			<svg width={560} height={150} viewBox="0 0 560 150">
				<defs>
					<linearGradient id="ph" x1="0" x2="1">
						<stop offset="0" stopColor="#E8453C" />
						<stop offset="0.25" stopColor="#F59E2B" />
						<stop offset="0.5" stopColor="#3CC25A" />
						<stop offset="0.75" stopColor="#2F8FE8" />
						<stop offset="1" stopColor="#7A4FD0" />
					</linearGradient>
				</defs>
				<rect x={20} y={56} width={520} height={46} rx={23} fill="url(#ph)" stroke="#151515" strokeWidth={7} />
				<polygon points={`${20 + v * 520},50 ${8 + v * 520},14 ${32 + v * 520},14`} fill="#FFF" stroke="#151515" strokeWidth={5} />
				<text x={280} y={142} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill="#FFF" stroke="#151515" strokeWidth={8} paintOrder="stroke">
					pH
				</text>
			</svg>
		</div>
	);
};
