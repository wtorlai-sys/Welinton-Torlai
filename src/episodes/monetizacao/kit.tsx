// Kit de motion graphics do episódio "Monetização" (HUD/dashboard/finanças).
// Tudo dirigido pelo tempo global T (s) = frame / fps — determinístico (STYLE_GUIDE §1).
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {PALETTE} from '../../style/constants';
import {clamp, easeOutBack, easeOutCubic, lerp, smooth} from '../../style/easing';
import {hash1, noise1} from '../../style/random';

/* ------------------------------------------------------------------ */
/* Cores e fontes                                                      */
/* ------------------------------------------------------------------ */
export const C = {
	bg0: '#04060C',
	bg1: '#0A1124',
	panel: 'rgba(18,26,48,0.86)',
	panelHi: 'rgba(30,42,74,0.92)',
	line: 'rgba(150,180,255,0.16)',
	text: '#F4F7FF',
	dim: '#8C9AC0',
	green: '#22E07A',
	greenDeep: '#0B8F4B',
	cyan: '#38D6FF',
	gold: '#FFC83D',
	purple: '#9B6CFF',
	/** Vermelho = só elementos do YouTube / foco (PALETTE.accent, STYLE_GUIDE §3) */
	red: PALETTE.accent,
} as const;

export const F = {
	black: "'Montserrat Black', 'Arial Black', sans-serif",
	ui: "'Montserrat UI', 'Montserrat Black', sans-serif",
} as const;

/* ------------------------------------------------------------------ */
/* Tempo                                                               */
/* ------------------------------------------------------------------ */
export const useT = () => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	return f / fps;
};

/** progresso linear 0..1 de T entre a e a+d */
export const k = (T: number, a: number, d = 0.4) => clamp((T - a) / d);
export const eo = (T: number, a: number, d = 0.4) => easeOutCubic(k(T, a, d));
export const eb = (T: number, a: number, d = 0.45, s = 1.7) => (T < a ? 0 : easeOutBack(k(T, a, d), s));
export const expoOut = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
export const expoIn = (x: number) => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10));
/** envelope: entra em a (din), sai em b (dout) */
export const env = (T: number, a: number, b: number, din = 0.3, dout = 0.25) => clamp(Math.min((T - a) / din, (b - T) / dout));

export const fmt = (n: number) => Math.round(n).toLocaleString('pt-BR');
export const brl = (n: number) => `R$ ${fmt(n)}`;

/** contador: de `from` até `to` entre a e b (curva expo — dispara e freia) */
export const count = (T: number, a: number, b: number, from: number, to: number, curve: (x: number) => number = expoOut) => lerp(from, to, curve(clamp((T - a) / (b - a))));

/** tremida curta de impacto (STYLE_GUIDE §6: 6–10 frames) */
export const shakeAt = (T: number, hits: number[], amp = 22, dur = 0.3) => {
	let x = 0;
	let y = 0;
	let r = 0;
	for (const h of hits) {
		const p = (T - h) / dur;
		if (p < 0 || p > 1) continue;
		const a = amp * Math.pow(1 - p, 2);
		x += (noise1(T * 38, h) - 0.5) * 2 * a;
		y += (noise1(T * 41, h + 3) - 0.5) * 2 * a;
		r += (noise1(T * 30, h + 7) - 0.5) * a * 0.06;
	}
	return {x, y, r};
};

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */
export const W = 1920;
export const H = 1080;
/** centro horizontal do conteúdo (16:9) */
export const CX = 960;
/** centro vertical da área útil (barra do player embaixo) */
export const CY = 470;

type AtProps = {x?: number; y?: number; children: React.ReactNode; style?: React.CSSProperties; w?: number; h?: number; z?: number};
/** posiciona o centro do filho em (x, y) */
export const At: React.FC<AtProps> = ({x = CX, y = CY, children, style, w, h, z}) => (
	<div style={{position: 'absolute', left: x, top: y, width: w, height: h, transform: 'translate(-50%,-50%)', zIndex: z, ...style}}>{children}</div>
);

export const Fill: React.FC<{children?: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
	<div style={{position: 'absolute', inset: 0, ...style}}>{children}</div>
);

export type Dir = 'up' | 'down' | 'left' | 'right' | 'zoom' | 'pop' | 'spin' | 'drop' | 'fade' | 'tilt';

/** Entrada/saída animada: `t` = início, `out` = saída (opcional). */
export const Enter: React.FC<{
	t: number;
	out?: number;
	dir?: Dir;
	dist?: number;
	dur?: number;
	outDir?: Dir;
	children: React.ReactNode;
	style?: React.CSSProperties;
	blur?: boolean;
}> = ({t, out, dir = 'up', dist = 160, dur = 0.42, outDir, children, style, blur = false}) => {
	const T = useT();
	if (T < t - 0.001) return null;
	if (out !== undefined && T > out + 0.3) return null;
	const back = dir === 'pop' || dir === 'spin' || dir === 'drop';
	const p = back ? easeOutBack(k(T, t, dur), 1.9) : expoOut(k(T, t, dur));
	const q = out === undefined ? 0 : easeOutCubic(k(T, out, 0.26));
	const move = (d: Dir, amt: number) => {
		switch (d) {
			case 'up':
				return `translateY(${amt * dist}px)`;
			case 'down':
				return `translateY(${-amt * dist}px)`;
			case 'left':
				return `translateX(${-amt * dist}px)`;
			case 'right':
				return `translateX(${amt * dist}px)`;
			case 'zoom':
				return `scale(${1 + amt * 1.4})`;
			case 'pop':
				return `scale(${1 - amt})`;
			case 'spin':
				return `scale(${1 - amt}) rotate(${-amt * 160}deg)`;
			case 'drop':
				return `translateY(${-amt * dist * 2}px) scale(${1 + amt * 0.4})`;
			case 'tilt':
				return `perspective(1400px) rotateX(${amt * 70}deg) translateY(${amt * dist}px)`;
			default:
				return '';
		}
	};
	const od = outDir ?? (dir === 'left' ? 'right' : dir === 'right' ? 'left' : dir === 'up' ? 'down' : dir === 'down' ? 'up' : 'pop');
	const inAmt = 1 - p;
	const opIn = dir === 'pop' || dir === 'spin' ? clamp(p * 3) : clamp(k(T, t, dur * 0.5));
	const tr = `${move(dir, inAmt)} ${q > 0 ? move(od === 'pop' ? 'pop' : od, -q * (od === 'pop' ? -1 : 1)) : ''}`;
	return (
		<div
			style={{
				transform: tr,
				opacity: opIn * (1 - q),
				filter: blur && inAmt > 0.02 ? `blur(${inAmt * 18}px)` : undefined,
				...style,
			}}
		>
			{children}
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* Fundo: gradiente escuro, grade em perspectiva (parallax), partículas */
/* ------------------------------------------------------------------ */
export const Bg: React.FC<{glow?: string; glow2?: string; speed?: number; dim?: number; grid?: boolean; T0?: number; symbols?: boolean}> = ({
	glow = C.cyan,
	glow2 = C.purple,
	speed = 1,
	dim = 0,
	grid = true,
	symbols = true,
}) => {
	const T = useT();
	const tt = T * speed;
	return (
		<Fill style={{background: `linear-gradient(180deg, ${C.bg1} 0%, ${C.bg0} 55%, #020308 100%)`, overflow: 'hidden'}}>
			{/* brilhos de cor */}
			<div style={{position: 'absolute', left: -200 + Math.sin(tt * 0.4) * 80, top: -300, width: 1200, height: 1200, borderRadius: '50%', background: `radial-gradient(circle, ${glow}38 0%, ${glow}00 62%)`}} />
			<div style={{position: 'absolute', left: 900 + Math.cos(tt * 0.33) * 90, top: 100, width: 1300, height: 1300, borderRadius: '50%', background: `radial-gradient(circle, ${glow2}30 0%, ${glow2}00 60%)`}} />
			{/* grade do "chão" em perspectiva, andando */}
			{grid && (
				<div style={{position: 'absolute', left: -800, right: -800, top: 700, height: 900, transform: 'perspective(700px) rotateX(68deg)', transformOrigin: '50% 0%', opacity: 0.55}}>
					<div
						style={{
							position: 'absolute',
							inset: 0,
							backgroundImage: `linear-gradient(${glow}55 2px, transparent 2px), linear-gradient(90deg, ${glow}55 2px, transparent 2px)`,
							backgroundSize: '120px 120px',
							backgroundPosition: `0px ${(tt * 160) % 120}px`,
							maskImage: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, #000 35%, #000 100%)',
							WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, #000 35%, #000 100%)',
						}}
					/>
				</div>
			)}
			{/* grade fina de HUD no alto */}
			<div style={{position: 'absolute', inset: 0, backgroundImage: `radial-gradient(${C.line} 2px, transparent 2px)`, backgroundSize: '54px 54px', backgroundPosition: `${(tt * 6) % 54}px ${(tt * 12) % 54}px`, opacity: 0.6}} />
			{/* partículas e símbolos flutuando */}
			{Array.from({length: 44}).map((_, i) => {
				const sx = hash1(i * 3.1) * W;
				const sp = 30 + hash1(i * 7.7) * 70;
				const y = (((hash1(i * 5.3) * H - tt * sp) % H) + H) % H;
				const sz = 4 + hash1(i * 9.1) * 8;
				const sym = symbols && i % 4 === 0;
				const col = i % 3 === 0 ? C.green : i % 3 === 1 ? glow : '#FFFFFF';
				const x = sx + Math.sin(tt * 0.8 + i) * 24;
				return sym ? (
					<div key={i} style={{position: 'absolute', left: x, top: y, fontFamily: F.black, fontSize: 30 + sz * 3, color: col, opacity: 0.14 + hash1(i) * 0.12, transform: `rotate(${Math.sin(tt + i) * 20}deg)`}}>
						{['$', 'R$', '▲', '%', '●'][i % 5]}
					</div>
				) : (
					<div key={i} style={{position: 'absolute', left: x, top: y, width: sz, height: sz, borderRadius: '50%', background: col, opacity: 0.18 + hash1(i * 2) * 0.3, boxShadow: `0 0 ${sz * 2}px ${col}`}} />
				);
			})}
			{/* vinheta + escurecimento */}
			<div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)'}} />
			{dim > 0 && <div style={{position: 'absolute', inset: 0, background: '#000', opacity: dim}} />}
		</Fill>
	);
};

/* ------------------------------------------------------------------ */
/* Câmera 2D: zoom/pan/rotação + tremida                               */
/* ------------------------------------------------------------------ */
export const Cam: React.FC<{zoom?: number; x?: number; y?: number; rot?: number; hits?: number[]; amp?: number; children: React.ReactNode; ox?: number; oy?: number}> = ({
	zoom = 1,
	x = 0,
	y = 0,
	rot = 0,
	hits = [],
	amp = 22,
	children,
	ox = CX,
	oy = CY,
}) => {
	const T = useT();
	const s = shakeAt(T, hits, amp);
	return (
		<Fill style={{transformOrigin: `${ox}px ${oy}px`, transform: `translate(${x + s.x}px, ${y + s.y}px) rotate(${rot + s.r}deg) scale(${zoom})`}}>
			{children}
		</Fill>
	);
};

/* ------------------------------------------------------------------ */
/* Painéis e textos                                                    */
/* ------------------------------------------------------------------ */
export const Panel: React.FC<{w: number; h?: number; children?: React.ReactNode; glow?: string; style?: React.CSSProperties; pad?: number}> = ({w, h, children, glow = C.cyan, style, pad = 34}) => (
	<div
		style={{
			width: w,
			height: h,
			padding: pad,
			boxSizing: 'border-box',
			borderRadius: 38,
			background: `linear-gradient(160deg, ${C.panelHi} 0%, ${C.panel} 100%)`,
			border: `2px solid ${glow}44`,
			boxShadow: `0 30px 80px rgba(0,0,0,0.55), 0 0 60px ${glow}22, inset 0 1px 0 rgba(255,255,255,0.12)`,
			position: 'relative',
			overflow: 'hidden',
			...style,
		}}
	>
		{children}
	</div>
);

export const Label: React.FC<{children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties; weight?: number}> = ({children, color = C.dim, size = 30, style, weight = 700}) => (
	<div style={{fontFamily: F.ui, fontWeight: weight, fontSize: size, color, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', ...style}}>{children}</div>
);

/** Texto gigante com contorno e brilho */
export const Big: React.FC<{children: React.ReactNode; size?: number; color?: string; glow?: string; stroke?: number; style?: React.CSSProperties; italic?: boolean}> = ({
	children,
	size = 200,
	color = '#fff',
	glow,
	stroke = 0,
	style,
	italic,
}) => (
	<div
		style={{
			fontFamily: F.black,
			fontWeight: 900,
			fontSize: size,
			lineHeight: 0.95,
			color,
			whiteSpace: 'nowrap',
			letterSpacing: '-0.02em',
			fontStyle: italic ? 'italic' : undefined,
			WebkitTextStroke: stroke ? `${stroke}px #000` : undefined,
			paintOrder: 'stroke fill',
			textShadow: glow ? `0 0 40px ${glow}AA, 0 0 90px ${glow}66, 0 10px 0 rgba(0,0,0,0.6)` : '0 10px 0 rgba(0,0,0,0.6)',
			...style,
		}}
	>
		{children}
	</div>
);

export const Pill: React.FC<{children: React.ReactNode; color?: string; bg?: string; size?: number; style?: React.CSSProperties}> = ({children, color = '#fff', bg = C.green, size = 34, style}) => (
	<div
		style={{
			display: 'inline-flex',
			alignItems: 'center',
			gap: 14,
			padding: `${size * 0.42}px ${size * 0.8}px`,
			borderRadius: 999,
			background: bg,
			color,
			fontFamily: F.black,
			fontSize: size,
			whiteSpace: 'nowrap',
			boxShadow: `0 10px 30px ${bg}55`,
			...style,
		}}
	>
		{children}
	</div>
);

/* ------------------------------------------------------------------ */
/* Ícones (SVG vetorial)                                               */
/* ------------------------------------------------------------------ */
export type IconName =
	| 'play'
	| 'eye'
	| 'user'
	| 'users'
	| 'dollar'
	| 'ad'
	| 'bell'
	| 'comment'
	| 'lock'
	| 'unlock'
	| 'alert'
	| 'question'
	| 'chart'
	| 'up'
	| 'down'
	| 'film'
	| 'laugh'
	| 'cursor'
	| 'check'
	| 'x'
	| 'globe'
	| 'like'
	| 'flame'
	| 'bulb'
	| 'search'
	| 'content'
	| 'pause'
	| 'coins'
	| 'star';

export const Icon: React.FC<{name: IconName; size?: number; color?: string; stroke?: number; style?: React.CSSProperties}> = ({name, size = 64, color = '#fff', stroke = 2.4, style}) => {
	const p = {fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
	const f = {fill: color};
	let body: React.ReactNode;
	switch (name) {
		case 'play':
			body = <path d="M8 5.5v13l11-6.5z" {...f} />;
			break;
		case 'eye':
			body = (
				<>
					<path d="M1.5 12s4-7.5 10.5-7.5S22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12z" {...p} />
					<circle cx="12" cy="12" r="3.4" {...f} />
				</>
			);
			break;
		case 'user':
			body = (
				<>
					<circle cx="12" cy="8" r="4" {...f} />
					<path d="M3.5 21c0-4.6 3.8-7.5 8.5-7.5s8.5 2.9 8.5 7.5z" {...f} />
				</>
			);
			break;
		case 'users':
			body = (
				<>
					<circle cx="9" cy="8" r="3.4" {...f} />
					<path d="M1.8 20c0-4 3.2-6.4 7.2-6.4s7.2 2.4 7.2 6.4z" {...f} />
					<circle cx="17" cy="9" r="2.7" {...f} opacity={0.7} />
					<path d="M15.5 13.8c3.8-.4 6.8 1.7 6.8 5.4h-4.6" {...f} opacity={0.7} />
				</>
			);
			break;
		case 'dollar':
			body = (
				<>
					<circle cx="12" cy="12" r="10" {...p} />
					<path d="M15.5 8.5c-.6-1.2-1.9-1.9-3.5-1.9-2 0-3.4 1-3.4 2.6 0 3.8 7.2 1.9 7.2 5.6 0 1.6-1.5 2.7-3.6 2.7-1.7 0-3.1-.8-3.7-2.1M12 4.8v14.4" {...p} />
				</>
			);
			break;
		case 'ad':
			body = (
				<>
					<rect x="1.5" y="5" width="21" height="14" rx="3" {...f} />
					<text x="12" y="15.6" textAnchor="middle" fontFamily="Montserrat Black" fontSize="9" fill="#0A1124">
						AD
					</text>
				</>
			);
			break;
		case 'bell':
			body = (
				<>
					<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.8 2H4.2z" {...f} />
					<path d="M9.8 20.5a2.3 2.3 0 0 0 4.4 0" {...p} />
				</>
			);
			break;
		case 'comment':
			body = <path d="M4 4.5h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H10l-5 4v-4H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z" {...f} />;
			break;
		case 'lock':
			body = (
				<>
					<rect x="4" y="10.5" width="16" height="11" rx="2.5" {...f} />
					<path d="M7.5 10.5V7.5a4.5 4.5 0 0 1 9 0v3" {...p} strokeWidth={2.8} />
				</>
			);
			break;
		case 'unlock':
			body = (
				<>
					<rect x="4" y="10.5" width="16" height="11" rx="2.5" {...f} />
					<path d="M7.5 10.5V7.5a4.5 4.5 0 0 1 8.6-1.9" {...p} strokeWidth={2.8} />
				</>
			);
			break;
		case 'alert':
			body = (
				<>
					<path d="M12 2.5 1.8 20.5h20.4z" {...f} />
					<path d="M12 9v5.5" stroke="#0A1124" strokeWidth={2.6} strokeLinecap="round" />
					<circle cx="12" cy="17.4" r="1.4" fill="#0A1124" />
				</>
			);
			break;
		case 'question':
			body = (
				<>
					<circle cx="12" cy="12" r="10.5" {...f} />
					<path d="M9.2 9.3a2.9 2.9 0 1 1 4.2 2.6c-.9.5-1.4 1.1-1.4 2.1v.6" stroke="#0A1124" strokeWidth={2.4} fill="none" strokeLinecap="round" />
					<circle cx="12" cy="17.6" r="1.3" fill="#0A1124" />
				</>
			);
			break;
		case 'chart':
			body = (
				<>
					<rect x="3" y="13" width="4" height="8" rx="1" {...f} />
					<rect x="10" y="8" width="4" height="13" rx="1" {...f} />
					<rect x="17" y="3" width="4" height="18" rx="1" {...f} />
				</>
			);
			break;
		case 'up':
			body = <path d="M3 17 9.5 10.5l4 4L21 7M15 7h6v6" {...p} strokeWidth={3} />;
			break;
		case 'down':
			body = <path d="M3 7l6.5 6.5 4-4L21 17M15 17h6v-6" {...p} strokeWidth={3} />;
			break;
		case 'film':
			body = (
				<>
					<rect x="2" y="4" width="20" height="16" rx="2.5" {...f} />
					{[6, 10, 14, 18].map((x) => (
						<React.Fragment key={x}>
							<rect x={x - 1} y="5.5" width="2" height="2" fill="#0A1124" />
							<rect x={x - 1} y="16.5" width="2" height="2" fill="#0A1124" />
						</React.Fragment>
					))}
					<path d="M10 9.2v5.6l4.6-2.8z" fill="#0A1124" />
				</>
			);
			break;
		case 'laugh':
			body = (
				<>
					<circle cx="12" cy="12" r="10.5" {...f} />
					<path d="M7 9.5q1.5-1.6 3 0M14 9.5q1.5-1.6 3 0" stroke="#0A1124" strokeWidth={1.8} fill="none" strokeLinecap="round" />
					<path d="M6.5 13h11a5.5 5.5 0 0 1-11 0z" fill="#0A1124" />
				</>
			);
			break;
		case 'cursor':
			body = <path d="M5 2.5v17l4.3-4 3 6.5 2.6-1.2-3-6.4H18z" fill={color} stroke="#0A1124" strokeWidth={1.4} strokeLinejoin="round" />;
			break;
		case 'check':
			body = <path d="M4 12.5 9.5 18 20 6.5" {...p} strokeWidth={3.4} />;
			break;
		case 'x':
			body = <path d="M5 5l14 14M19 5 5 19" {...p} strokeWidth={3.4} />;
			break;
		case 'globe':
			body = (
				<>
					<circle cx="12" cy="12" r="10" {...p} />
					<path d="M2 12h20M12 2c3 3 3 17 0 20M12 2c-3 3-3 17 0 20" {...p} />
				</>
			);
			break;
		case 'like':
			body = <path d="M2.5 10h4v11h-4zM8.5 21h9.2c1 0 1.9-.7 2.1-1.7l1.4-6.5c.3-1.3-.7-2.5-2-2.5h-5l.8-4.2c.2-1.2-.7-2.6-2-2.6L8.5 10z" {...f} />;
			break;
		case 'flame':
			body = <path d="M12 2.5c1 3.5 5.5 5.5 5.5 11a5.5 5.5 0 0 1-11 0c0-2.8 1.7-4.4 2.8-5.6.2 1.6.9 2.7 2.1 3.3C11 8 11.4 5 12 2.5z" {...f} />;
			break;
		case 'bulb':
			body = (
				<>
					<path d="M12 2.5a6.8 6.8 0 0 0-4 12.3c.7.6 1 1.3 1 2.2h6c0-.9.3-1.6 1-2.2a6.8 6.8 0 0 0-4-12.3z" {...f} />
					<rect x="9" y="18.2" width="6" height="1.8" rx="0.9" {...f} />
					<rect x="10" y="21" width="4" height="1.6" rx="0.8" {...f} />
				</>
			);
			break;
		case 'search':
			body = (
				<>
					<circle cx="10" cy="10" r="6.5" {...p} strokeWidth={3} />
					<path d="M15 15l6 6" {...p} strokeWidth={3.4} />
				</>
			);
			break;
		case 'content':
			body = (
				<>
					<rect x="2" y="3" width="20" height="13" rx="2.5" {...f} />
					<path d="M10 6.8v5.4l4.6-2.7z" fill="#0A1124" />
					<rect x="2" y="18" width="13" height="2.2" rx="1.1" {...f} opacity={0.6} />
				</>
			);
			break;
		case 'pause':
			body = (
				<>
					<rect x="5.5" y="4" width="4.5" height="16" rx="1.2" {...f} />
					<rect x="14" y="4" width="4.5" height="16" rx="1.2" {...f} />
				</>
			);
			break;
		case 'coins':
			body = (
				<>
					<ellipse cx="9" cy="16" rx="7" ry="3" {...f} />
					<ellipse cx="9" cy="12.5" rx="7" ry="3" {...f} opacity={0.85} />
					<ellipse cx="15" cy="8" rx="7" ry="3" {...f} opacity={0.7} />
				</>
			);
			break;
		case 'star':
			body = <path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z" {...f} />;
			break;
	}
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', overflow: 'visible', ...style}}>
			{body}
		</svg>
	);
};

/** Botão de play vermelho (símbolo genérico do YouTube, desenhado por código) */
export const PlayLogo: React.FC<{size?: number; glow?: boolean; style?: React.CSSProperties}> = ({size = 220, glow = true, style}) => (
	<div
		style={{
			width: size,
			height: size * 0.7,
			borderRadius: size * 0.2,
			background: `linear-gradient(180deg, #FF4A3D 0%, ${C.red} 60%, #C22A20 100%)`,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			boxShadow: glow ? `0 0 ${size * 0.35}px ${C.red}99, 0 ${size * 0.06}px 0 #7E160F, inset 0 ${size * 0.02}px 0 rgba(255,255,255,0.35)` : undefined,
			...style,
		}}
	>
		<svg width={size * 0.36} height={size * 0.36} viewBox="0 0 24 24">
			<path d="M6 3.5v17l15-8.5z" fill="#fff" strokeLinejoin="round" stroke="#fff" strokeWidth={2} />
		</svg>
	</div>
);

/** Moeda "3D" (giro no eixo Y via scaleX) */
export const Coin: React.FC<{size?: number; spin?: number; label?: string}> = ({size = 120, spin = 0, label = 'R$'}) => {
	const c = Math.cos(spin);
	const face = c >= 0;
	return (
		<div style={{width: size, height: size, position: 'relative', transform: `scaleX(${Math.max(0.08, Math.abs(c))})`}}>
			<div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: '#A8740C', transform: `translateX(${(face ? 1 : -1) * size * 0.05}px)`}} />
			<div
				style={{
					position: 'absolute',
					inset: 0,
					borderRadius: '50%',
					background: `radial-gradient(circle at 35% 30%, #FFF2B0 0%, ${C.gold} 40%, #D8920F 100%)`,
					border: `${size * 0.06}px solid #E9A81E`,
					boxSizing: 'border-box',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					fontFamily: F.black,
					fontSize: size * (label.length > 1 ? 0.34 : 0.5),
					color: '#9A6408',
					boxShadow: `0 0 ${size * 0.3}px ${C.gold}66`,
				}}
			>
				{label}
			</div>
		</div>
	);
};

/** Nota de dinheiro estilizada (genérica, sem copiar cédula real) */
export const Bill: React.FC<{w?: number; value?: string}> = ({w = 260, value = '$'}) => (
	<div
		style={{
			width: w,
			height: w * 0.48,
			borderRadius: w * 0.05,
			background: 'linear-gradient(135deg, #3FE58E 0%, #17A85C 55%, #0E7A42 100%)',
			border: `${w * 0.018}px solid #B8FFD7`,
			boxShadow: '0 14px 30px rgba(0,0,0,0.45)',
			position: 'relative',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
		}}
	>
		<div style={{position: 'absolute', inset: w * 0.04, border: `${w * 0.008}px dashed rgba(255,255,255,0.55)`, borderRadius: w * 0.03}} />
		<div style={{width: w * 0.3, height: w * 0.3, borderRadius: '50%', background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.black, fontSize: w * 0.15, color: '#fff'}}>
			{value}
		</div>
	</div>
);

/* ------------------------------------------------------------------ */
/* Gráficos                                                            */
/* ------------------------------------------------------------------ */
/** Gráfico de linha desenhado progressivamente (p = 0..1) */
export const LineChart: React.FC<{w: number; h: number; pts: number[]; p: number; color?: string; grid?: boolean; dot?: boolean; strokeW?: number; frozen?: boolean}> = ({
	w,
	h,
	pts,
	p,
	color = C.green,
	grid = true,
	dot = true,
	strokeW = 9,
}) => {
	const n = pts.length - 1;
	const X = (i: number) => (i / n) * w;
	const Y = (v: number) => h - v * h;
	const pos = clamp(p) * n;
	const full = Math.floor(pos);
	const fr = pos - full;
	const coords: [number, number][] = [];
	for (let i = 0; i <= full && i <= n; i++) coords.push([X(i), Y(pts[i])]);
	if (full < n) coords.push([lerp(X(full), X(full + 1), fr), lerp(Y(pts[full]), Y(pts[full + 1]), fr)]);
	const d = coords.map((c, i) => `${i ? 'L' : 'M'}${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(' ');
	const last = coords[coords.length - 1];
	const id = `g${color.replace('#', '')}${w}`;
	return (
		<svg width={w} height={h} style={{overflow: 'visible', display: 'block'}}>
			<defs>
				<linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor={color} stopOpacity={0.45} />
					<stop offset="100%" stopColor={color} stopOpacity={0} />
				</linearGradient>
			</defs>
			{grid &&
				[0.25, 0.5, 0.75, 1].map((g) => <line key={g} x1={0} x2={w} y1={h - g * h} y2={h - g * h} stroke="rgba(255,255,255,0.09)" strokeWidth={2} strokeDasharray="8 10" />)}
			{coords.length > 1 && (
				<>
					<path d={`${d} L${last[0]},${h} L0,${h} Z`} fill={`url(#${id})`} />
					<path d={d} fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round" style={{filter: `drop-shadow(0 0 12px ${color})`}} />
				</>
			)}
			{dot && last && p > 0.01 && (
				<>
					<circle cx={last[0]} cy={last[1]} r={strokeW * 2.6} fill={color} opacity={0.25} />
					<circle cx={last[0]} cy={last[1]} r={strokeW * 1.3} fill="#fff" />
				</>
			)}
		</svg>
	);
};

/** Barras verticais crescendo com atraso escalonado */
export const Bars: React.FC<{w: number; h: number; vals: number[]; p: number; colors?: string[]; gap?: number; labels?: string[]; radius?: number}> = ({w, h, vals, p, colors = [C.green], gap = 18, labels, radius = 14}) => {
	const n = vals.length;
	const bw = (w - gap * (n - 1)) / n;
	return (
		<div style={{width: w, height: h, position: 'relative'}}>
			{vals.map((v, i) => {
				const q = easeOutBack(clamp(p * (1 + n * 0.25) - i * 0.25), 1.4);
				const col = colors[i % colors.length];
				return (
					<div key={i} style={{position: 'absolute', left: i * (bw + gap), bottom: 0, width: bw, height: Math.max(0, v * h * q), borderRadius: `${radius}px ${radius}px 4px 4px`, background: `linear-gradient(180deg, ${col} 0%, ${col}88 100%)`, boxShadow: `0 0 24px ${col}55`}}>
						{labels && <Label style={{position: 'absolute', bottom: -48, left: '50%', transform: 'translateX(-50%)'}} size={24}>{labels[i]}</Label>}
					</div>
				);
			})}
		</div>
	);
};

/** Anel de choque (impacto) */
export const Shock: React.FC<{t: number; color?: string; size?: number; x?: number; y?: number; dur?: number}> = ({t, color = '#fff', size = 900, x = CX, y = CY, dur = 0.55}) => {
	const T = useT();
	const q = k(T, t, dur);
	if (q <= 0 || q >= 1) return null;
	const s = easeOutCubic(q);
	return (
		<div style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: '50%', border: `${(1 - q) * 26 + 2}px solid ${color}`, transform: `scale(${0.15 + s})`, opacity: 1 - q}} />
	);
};

/** Raios saindo do centro (burst) */
export const Burst: React.FC<{t: number; color?: string; x?: number; y?: number; n?: number; len?: number; dur?: number; seed?: number}> = ({t, color = C.gold, x = CX, y = CY, n = 14, len = 420, dur = 0.5, seed = 1}) => {
	const T = useT();
	const q = k(T, t, dur);
	if (q <= 0 || q >= 1) return null;
	return (
		<div style={{position: 'absolute', left: x, top: y}}>
			{Array.from({length: n}).map((_, i) => {
				const a = (i / n) * 360 + hash1(i + seed) * 12;
				const r0 = 80 + easeOutCubic(q) * len;
				const l = (1 - q) * 120 + 20;
				return <div key={i} style={{position: 'absolute', left: 0, top: -5, width: l, height: 10, borderRadius: 5, background: color, transformOrigin: '0 50%', transform: `rotate(${a}deg) translateX(${r0}px)`, opacity: 1 - q}} />;
			})}
		</div>
	);
};

/** Flash de luz em tela cheia */
export const Flash: React.FC<{t: number; dur?: number; color?: string; max?: number}> = ({t, dur = 0.25, color = '#fff', max = 0.85}) => {
	const T = useT();
	const q = k(T, t, dur);
	if (q <= 0 || q >= 1) return null;
	return <Fill style={{background: color, opacity: max * Math.pow(1 - q, 2)}} />;
};

/** Linhas de velocidade (aceleração) */
export const SpeedLines: React.FC<{amt: number; color?: string; seed?: number}> = ({amt, color = '#fff', seed = 0}) => {
	const T = useT();
	if (amt <= 0.01) return null;
	return (
		<Fill style={{overflow: 'hidden'}}>
			{Array.from({length: 26}).map((_, i) => {
				const x = hash1(i * 1.7 + seed) * W;
				const sp = 1400 + hash1(i * 4.1 + seed) * 1600;
				const y = ((((hash1(i * 2.3 + seed) * 1500 + T * sp) % 1500) + 1500) % 1500) - 300;
				const l = 120 + hash1(i * 6.6) * 260;
				return <div key={i} style={{position: 'absolute', left: x, top: y, width: 4, height: l * amt, borderRadius: 2, background: `linear-gradient(180deg, ${color}00, ${color})`, opacity: 0.35 * amt}} />;
			})}
		</Fill>
	);
};

/** Notificação (toast) de interface */
export const Toast: React.FC<{icon: IconName; title: string; sub?: string; color?: string; w?: number}> = ({icon, title, sub, color = C.green, w = 760}) => (
	<div style={{width: w, display: 'flex', alignItems: 'center', gap: 26, padding: '24px 30px', borderRadius: 30, background: 'rgba(20,28,52,0.95)', border: `2px solid ${color}66`, boxShadow: `0 20px 50px rgba(0,0,0,0.5), 0 0 40px ${color}33`, boxSizing: 'border-box'}}>
		<div style={{width: 84, height: 84, borderRadius: 24, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
			<Icon name={icon} size={52} color="#fff" />
		</div>
		<div style={{minWidth: 0}}>
			<div style={{fontFamily: F.black, fontSize: 38, color: '#fff', whiteSpace: 'nowrap'}}>{title}</div>
			{sub && <div style={{fontFamily: F.ui, fontWeight: 600, fontSize: 28, color: C.dim, marginTop: 4, whiteSpace: 'nowrap'}}>{sub}</div>}
		</div>
	</div>
);

/** Barra de progresso */
export const Progress: React.FC<{w: number; p: number; color?: string; h?: number}> = ({w, p, color = C.green, h = 22}) => (
	<div style={{width: w, height: h, borderRadius: h, background: 'rgba(255,255,255,0.1)', overflow: 'hidden'}}>
		<div style={{width: `${clamp(p) * 100}%`, height: '100%', borderRadius: h, background: `linear-gradient(90deg, ${color}AA, ${color})`, boxShadow: `0 0 20px ${color}`}} />
	</div>
);

/** Selo "ilustrativo" para comparações sem dados oficiais */
export const Illustrative: React.FC<{color?: string}> = ({color = C.dim}) => (
	<Label size={22} color={color} style={{opacity: 0.85, letterSpacing: '0.12em'}}>
		* comparação ilustrativa
	</Label>
);

/** Chuva de dinheiro 2D (moedas girando e notas) */
export const MoneyRain: React.FC<{t: number; dur?: number; n?: number; seed?: number; bills?: boolean; speed?: number}> = ({t, dur = 3, n = 22, seed = 3, bills = true, speed = 1}) => {
	const T = useT();
	if (T < t || T > t + dur + 1.5) return null;
	const fade = clamp((t + dur + 1.5 - T) / 0.5);
	return (
		<Fill style={{overflow: 'hidden', opacity: fade}}>
			{Array.from({length: n}).map((_, i) => {
				const st = t + hash1(i * 3.3 + seed) * dur * 0.7;
				const lt = T - st;
				if (lt < 0) return null;
				const x = hash1(i * 7.1 + seed) * 1800 + 60;
				const vy = (900 + hash1(i * 1.9 + seed) * 700) * speed;
				const y = -200 + lt * vy;
				if (y > H + 200) return null;
				const isBill = bills && i % 3 === 0;
				const sz = 70 + hash1(i * 2.2 + seed) * 70;
				const rot = Math.sin(lt * 3 + i) * 40;
				return (
					<div key={i} style={{position: 'absolute', left: x + Math.sin(lt * 2 + i) * 50, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg)`}}>
						{isBill ? <Bill w={sz * 2.2} value="$" /> : <Coin size={sz} spin={lt * (5 + hash1(i) * 5)} label={i % 2 ? '$' : 'R$'} />}
					</div>
				);
			})}
		</Fill>
	);
};

/** Explosão de moedas a partir de um ponto */
export const CoinBurst: React.FC<{t: number; x?: number; y?: number; n?: number; seed?: number; power?: number}> = ({t, x = CX, y = CY, n = 16, seed = 5, power = 1}) => {
	const T = useT();
	const lt = T - t;
	if (lt < 0 || lt > 1.6) return null;
	return (
		<div style={{position: 'absolute', left: x, top: y}}>
			{Array.from({length: n}).map((_, i) => {
				const a = (i / n) * Math.PI * 2 + hash1(i + seed) * 0.5;
				const v = (900 + hash1(i * 3 + seed) * 900) * power;
				const px = Math.cos(a) * v * lt;
				const py = Math.sin(a) * v * lt * 0.8 + 1600 * lt * lt;
				const sz = 60 + hash1(i * 5 + seed) * 50;
				return (
					<div key={i} style={{position: 'absolute', left: px, top: py, transform: 'translate(-50%,-50%)', opacity: clamp((1.6 - lt) / 0.4)}}>
						<Coin size={sz} spin={lt * 9 + i} label={i % 2 ? '$' : 'R$'} />
					</div>
				);
			})}
		</div>
	);
};

/** Pulso suave (respiração) para manter tudo vivo */
export const breathe = (T: number, amt = 0.02, sp = 2.2, ph = 0) => 1 + Math.sin(T * sp + ph) * amt;

/** Digita texto progressivamente */
export const typed = (s: string, T: number, a: number, cps = 26) => s.slice(0, Math.max(0, Math.floor((T - a) * cps)));

export {clamp, easeOutBack, easeOutCubic, lerp, smooth};
