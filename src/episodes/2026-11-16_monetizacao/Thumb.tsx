// Thumbnails do vídeo 2026-11-16_monetizacao — teste A/B (v02, versão "clickbait").
// Feitas em 1920×1080 e exportadas em 1280×720 (--scale=0.6667).
// Receita: fundo de cor forte, 1 foco gigante, texto 3D com contorno grosso, lacuna de curiosidade
// (valor borrado), círculo/seta "à mão", rosto de choque. Só valores ditos na narração.
// Canto inferior direito livre (selo de duração do player).
import React, {useEffect} from 'react';
import {AbsoluteFill} from 'remotion';
import {Bill, C, Coin, F, Icon, PlayLogo} from '../monetizacao/kit';
import {ensureEpisodeFonts} from '../monetizacao/Legendas';

const YEL = '#FFE600';

const Abs: React.FC<{x: number; y: number; rot?: number; children: React.ReactNode; z?: number; style?: React.CSSProperties}> = ({x, y, rot = 0, children, z, style}) => (
	<div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg)`, transformOrigin: '50% 50%', zIndex: z, ...style}}>{children}</div>
);

/** Texto 3D "extrudado": contorno preto grosso + bloco de sombra em degraus + brilho */
const X3D: React.FC<{children: React.ReactNode; size: number; color?: string; side?: string; depth?: number; glow?: string; stroke?: number; style?: React.CSSProperties}> = ({
	children,
	size,
	color = '#fff',
	side = '#000',
	depth = 14,
	glow,
	stroke,
	style,
}) => {
	const sw = stroke ?? Math.round(size * 0.07);
	const sh: string[] = [];
	for (let i = 1; i <= depth; i++) sh.push(`${i}px ${i}px 0 ${side}`);
	sh.push(`${depth + 6}px ${depth + 10}px 18px rgba(0,0,0,0.55)`);
	if (glow) sh.push(`0 0 60px ${glow}`);
	return (
		<div
			style={{
				fontFamily: F.black,
				fontWeight: 900,
				fontSize: size,
				lineHeight: 0.92,
				color,
				whiteSpace: 'nowrap',
				letterSpacing: '-0.025em',
				WebkitTextStroke: `${sw}px #000`,
				paintOrder: 'stroke fill',
				textShadow: sh.join(', '),
				...style,
			}}
		>
			{children}
		</div>
	);
};

/** Raios de explosão atrás do foco */
const Rays: React.FC<{cx: number; cy: number; color: string; n?: number; op?: number}> = ({cx, cy, color, n = 22, op = 0.18}) => (
	<svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: op}}>
		{Array.from({length: n}).map((_, i) => {
			const a0 = (i / n) * Math.PI * 2;
			const a1 = a0 + Math.PI / n;
			const R = 2400;
			return <path key={i} d={`M${cx} ${cy} L${cx + Math.cos(a0) * R} ${cy + Math.sin(a0) * R} L${cx + Math.cos(a1) * R} ${cy + Math.sin(a1) * R} Z`} fill={color} />;
		})}
	</svg>
);

/** Rosto de choque desenhado em vetor (sem emoji: o Chromium do render não tem a fonte) */
const ShockFace: React.FC<{size: number}> = ({size}) => (
	<svg width={size} height={size} viewBox="0 0 200 200" style={{filter: 'drop-shadow(10px 16px 0 rgba(0,0,0,0.45))', overflow: 'visible'}}>
		<defs>
			<radialGradient id="fg" cx="38%" cy="30%" r="75%">
				<stop offset="0%" stopColor="#FFF6A8" />
				<stop offset="45%" stopColor="#FFD21F" />
				<stop offset="100%" stopColor="#F29A00" />
			</radialGradient>
		</defs>
		<circle cx="100" cy="100" r="88" fill="url(#fg)" stroke="#000" strokeWidth="7" />
		{/* mãos no rosto */}
		<ellipse cx="24" cy="138" rx="22" ry="34" fill="#FFC21A" stroke="#000" strokeWidth="6" transform="rotate(-18 24 138)" />
		<ellipse cx="176" cy="138" rx="22" ry="34" fill="#FFC21A" stroke="#000" strokeWidth="6" transform="rotate(18 176 138)" />
		{/* sobrancelhas levantadas */}
		<path d="M48 50 Q66 32 84 44" fill="none" stroke="#5A3300" strokeWidth="8" strokeLinecap="round" />
		<path d="M116 44 Q134 32 152 50" fill="none" stroke="#5A3300" strokeWidth="8" strokeLinecap="round" />
		{/* olhos arregalados */}
		<ellipse cx="70" cy="82" rx="20" ry="25" fill="#fff" stroke="#000" strokeWidth="5" />
		<ellipse cx="130" cy="82" rx="20" ry="25" fill="#fff" stroke="#000" strokeWidth="5" />
		<circle cx="72" cy="86" r="8" fill="#000" />
		<circle cx="128" cy="86" r="8" fill="#000" />
		{/* boca aberta */}
		<ellipse cx="100" cy="144" rx="24" ry="30" fill="#5A1200" stroke="#000" strokeWidth="6" />
		<ellipse cx="100" cy="158" rx="13" ry="9" fill="#FF6B6B" />
		{/* gota de suor */}
		<path d="M170 30 Q182 52 170 62 Q158 52 170 30 Z" fill="#7FD8FF" stroke="#000" strokeWidth="4" />
	</svg>
);

const circlePath = (w: number, h: number) =>
	`M${w * 0.1} ${h * 0.3} C ${w * 0.25} ${-h * 0.05}, ${w * 0.85} ${-h * 0.06}, ${w * 0.97} ${h * 0.42} C ${w * 1.04} ${h * 0.82}, ${w * 0.6} ${h * 1.04}, ${w * 0.32} ${h * 0.96} C ${w * 0.04} ${h * 0.88}, ${-w * 0.03} ${h * 0.5}, ${w * 0.16} ${h * 0.2}`;

/** Círculo "à mão" (volta levemente torta, aberta no fim) */
const HandCircle: React.FC<{w: number; h: number; color?: string; sw?: number}> = ({w, h, color = YEL, sw = 18}) => (
	<svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{overflow: 'visible', filter: 'drop-shadow(6px 8px 0 rgba(0,0,0,0.5))'}}>
		<path d={circlePath(w, h)} fill="none" stroke="#000" strokeWidth={sw + 12} strokeLinecap="round" />
		<path d={circlePath(w, h)} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />
	</svg>
);

/** Seta curva grossa "à mão" (de cima-direita para baixo-esquerda) */
const CurvedArrow: React.FC<{w: number; h: number; color?: string}> = ({w, h, color = YEL}) => {
	const d = `M${w * 0.92} ${h * 0.06} C ${w * 0.9} ${h * 0.55}, ${w * 0.6} ${h * 0.8}, ${w * 0.16} ${h * 0.84}`;
	const head = `M${w * 0.3} ${h * 0.62} L${w * 0.08} ${h * 0.85} L${w * 0.32} ${h * 1.02}`;
	return (
		<svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{overflow: 'visible', filter: 'drop-shadow(6px 8px 0 rgba(0,0,0,0.5))'}}>
			{(
				[
					['#000', 46],
					[color, 28],
				] as const
			).map(([c, s]) => (
				<g key={c} fill="none" stroke={c} strokeWidth={s} strokeLinecap="round" strokeLinejoin="round">
					<path d={d} />
					<path d={head} />
				</g>
			))}
		</svg>
	);
};

/** Seta reta grossa */
const Arrow: React.FC<{w: number; color: string; rot?: number}> = ({w, color, rot = 0}) => (
	<svg width={w} height={w} viewBox="0 0 100 100" style={{transform: `rotate(${rot}deg)`, filter: 'drop-shadow(8px 10px 0 rgba(0,0,0,0.5))', overflow: 'visible'}}>
		<path d="M50 4 L96 52 H68 V96 H32 V52 H4 Z" fill={color} stroke="#000" strokeWidth={6} strokeLinejoin="round" />
	</svg>
);

/* ------------------------------------------------------------------ */
/* A — "QUANTO PAGA?!": 1 milhão de views, valor borrado e circulado   */
/* ------------------------------------------------------------------ */
const ThumbA: React.FC = () => (
	<AbsoluteFill style={{overflow: 'hidden', background: 'radial-gradient(circle at 38% 55%, #FF7A00 0%, #E01B0C 42%, #6E0000 100%)'}}>
		<Rays cx={620} cy={600} color="#FFD000" op={0.22} />
		{/* painel do vídeo (ilustrativo) */}
		<Abs x={70} y={250} rot={-5}>
			<div
				style={{
					width: 1060,
					height: 700,
					borderRadius: 44,
					background: 'linear-gradient(165deg, #1A2650 0%, #0A1024 100%)',
					border: '10px solid #fff',
					boxShadow: '18px 26px 0 rgba(0,0,0,0.45), 0 0 80px rgba(0,0,0,0.5)',
					padding: '50px 60px',
					boxSizing: 'border-box',
					overflow: 'hidden',
				}}
			>
				<div style={{display: 'flex', alignItems: 'center', gap: 30}}>
					<PlayLogo size={200} glow={false} />
					<div>
						<div style={{display: 'flex', alignItems: 'center', gap: 18}}>
							<Icon name="eye" size={96} color={C.gold} stroke={3} />
							<X3D size={124} color={C.gold} depth={8}>
								1.000.000
							</X3D>
						</div>
						<div style={{fontFamily: F.ui, fontWeight: 800, fontSize: 44, color: '#AFC0EA', letterSpacing: '0.08em', marginTop: 8}}>VISUALIZAÇÕES</div>
					</div>
				</div>
				<div style={{height: 4, background: 'rgba(255,255,255,0.15)', margin: '40px 0 26px'}} />
				<div style={{fontFamily: F.ui, fontWeight: 800, fontSize: 50, color: C.green, letterSpacing: '0.08em'}}>
					<Icon name="dollar" size={52} color={C.green} stroke={3} style={{verticalAlign: '-8px', marginRight: 14}} />
					RECEITA
				</div>
				{/* valor borrado (lacuna de curiosidade) */}
				<div style={{filter: 'blur(26px)', marginTop: 4}}>
					<X3D size={230} color={C.green} depth={6}>
						R$ 5.000
					</X3D>
				</div>
			</div>
		</Abs>
		{/* círculo amarelo no valor */}
		<Abs x={80} y={610} rot={-5}>
			<HandCircle w={960} h={360} />
		</Abs>
		{/* título */}
		<Abs x={1100} y={50} rot={4}>
			<X3D size={158} color="#fff" depth={16}>
				QUANTO
			</X3D>
		</Abs>
		<Abs x={1110} y={215} rot={4}>
			<X3D size={186} color={YEL} depth={18}>
				PAGA?!
			</X3D>
		</Abs>
		{/* seta curva do título para o valor */}
		<Abs x={930} y={430}>
			<CurvedArrow w={360} h={340} />
		</Abs>
		{/* rosto de choque */}
		<Abs x={1360} y={500} rot={8}>
			<ShockFace size={400} />
		</Abs>
	</AbsoluteFill>
);

/* ------------------------------------------------------------------ */
/* B — contraste brutal: R$ 5 × R$ 5.000                               */
/* ------------------------------------------------------------------ */
const PILE: [number, number, number, number][] = [
	// notas empilhadas (x, y, largura, rotação)
	[1180, 820, 360, -6],
	[1450, 800, 340, 8],
	[1300, 740, 360, 3],
	[1120, 700, 320, -14],
	[1500, 680, 300, 16],
];
const PILE_COINS: [number, number, number, number][] = [
	[1130, 600, 130, 0.3],
	[1700, 580, 120, 1.0],
	[1290, 640, 110, 0.7],
	[1620, 760, 100, 0.2],
];

const ThumbB: React.FC = () => (
	<AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
		{/* lado esquerdo: vermelho escuro (pouco) */}
		<div style={{position: 'absolute', inset: 0, background: 'radial-gradient(circle at 25% 55%, #B3160C 0%, #5A0502 55%, #1E0000 100%)', clipPath: 'polygon(0 0, 50% 0, 40% 100%, 0 100%)'}} />
		{/* lado direito: verde forte (muito) */}
		<div style={{position: 'absolute', inset: 0, background: 'radial-gradient(circle at 72% 45%, #2EE57D 0%, #00954A 45%, #002E16 100%)', clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 40% 100%)'}} />
		<div style={{position: 'absolute', inset: 0, clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 40% 100%)'}}>
			<Rays cx={1400} cy={470} color="#FFFFFF" op={0.16} />
		</div>
		{/* corte diagonal com brilho */}
		<svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
			<line x1={960} y1={0} x2={768} y2={1080} stroke="#000" strokeWidth={34} />
			<line x1={960} y1={0} x2={768} y2={1080} stroke={YEL} strokeWidth={16} style={{filter: `drop-shadow(0 0 20px ${YEL})`}} />
		</svg>

		{/* ESQUERDA: 1.000 views → R$ 5 */}
		<Abs x={60} y={70}>
			<div style={{display: 'flex', alignItems: 'center', gap: 16}}>
				<Icon name="eye" size={100} color="#fff" stroke={3} />
				<X3D size={120} color="#fff" depth={10}>
					1.000
				</X3D>
			</div>
		</Abs>
		<Abs x={80} y={330} rot={-6}>
			<X3D size={270} color="#FF4A3D" side="#4A0000" depth={18}>
				R$ 5
			</X3D>
		</Abs>
		<Abs x={150} y={700}>
			<Coin size={150} spin={0.4} />
		</Abs>
		<Abs x={340} y={640}>
			<Arrow w={180} color="#FF4A3D" rot={180} />
		</Abs>

		{/* DIREITA: 1 milhão → R$ 5.000 */}
		{PILE.map(([x, y, w, r], i) => (
			<Abs key={`p${i}`} x={x} y={y} rot={r}>
				<div style={{filter: 'drop-shadow(10px 14px 0 rgba(0,0,0,0.45))'}}>
					<Bill w={w} value="R$" />
				</div>
			</Abs>
		))}
		{PILE_COINS.map(([x, y, s, sp], i) => (
			<Abs key={`pc${i}`} x={x} y={y}>
				<Coin size={s} spin={sp} />
			</Abs>
		))}
		<Abs x={1010} y={70}>
			<div style={{display: 'flex', alignItems: 'center', gap: 16}}>
				<Icon name="eye" size={100} color="#fff" stroke={3} />
				<X3D size={120} color="#fff" depth={10}>
					1 MILHÃO
				</X3D>
			</div>
		</Abs>
		<Abs x={870} y={300} rot={-4}>
			<X3D size={212} color={YEL} side="#7A5200" depth={20} glow="rgba(255,230,0,0.6)">
				R$ 5.000
			</X3D>
		</Abs>

		{/* selo central */}
		<Abs x={690} y={560}>
			<div
				style={{
					width: 200,
					height: 200,
					borderRadius: '50%',
					background: '#fff',
					border: '12px solid #000',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					boxShadow: '10px 14px 0 rgba(0,0,0,0.5)',
				}}
			>
				<span style={{fontFamily: F.black, fontSize: 96, color: '#000', letterSpacing: '-0.04em'}}>VS</span>
			</div>
		</Abs>
	</AbsoluteFill>
);

export const MonetizacaoThumb: React.FC<{v: 'A' | 'B'}> = ({v}) => {
	useEffect(() => {
		ensureEpisodeFonts();
	}, []);
	return v === 'A' ? <ThumbA /> : <ThumbB />;
};
