// Fechamento (c15–c20, 1:11–1:44) — plano aprovado em _CLAUDE/plano-cenas.md.
// A partir de 84,36 s (últimos 20 s): quarto inferior direito livre (cartões finais).
import React from 'react';
import {
	At, Big, Burst, C, Cam, CoinBurst, Enter, F, Icon, Illustrative, Label, LineChart, Odometer, Panel, Pill, PlayLogo, Shock, Stamp,
	breathe, clamp, easeOutBack, easeOutCubic, eb, eo, expoOut, k, lerp, punch, rampIn, rampOut, useT,
} from '../../monetizacao/kit';
import {ChannelCard, VideoThumb} from './pecas';

/* ------------------------------------------------------------------ */
/* c15 · 70,72–73,05 · "E tem outra diferença enorme"                  */
/* ------------------------------------------------------------------ */
const Frame916: React.FC<{h: number; color?: string; children?: React.ReactNode}> = ({h, color = 'rgba(255,255,255,0.35)', children}) => (
	<div style={{width: (h * 9) / 16, height: h, borderRadius: h * 0.07, border: `6px solid ${color}`, position: 'relative', overflow: 'hidden', boxSizing: 'border-box'}}>{children}</div>
);
const Frame169: React.FC<{w: number; color?: string}> = ({w, color = 'rgba(255,255,255,0.35)'}) => (
	<div style={{width: w, height: (w * 9) / 16, borderRadius: w * 0.05, border: `6px solid ${color}`, boxSizing: 'border-box'}} />
);

export const C15Diferenca: React.FC = () => {
	const T = useT();
	const W_OUTRA = 71.3;
	const W_DIF = 71.68;
	const W_ENORME = 72.18;
	const NE = 72.62; // "≠" toma o centro
	const grow = easeOutCubic(k(T, W_ENORME, 0.45));
	const leave = easeOutCubic(k(T, NE, 0.2));
	const zoom = (1 + 0.02 * (T - 70.72)) * (1 + 0.14 * punch(T, W_ENORME, 0.8));
	return (
		<Cam zoom={zoom} hits={[W_ENORME]} amp={16}>
			<At x={330} y={450} style={{opacity: 0.4 + 0.4 * leave}}>
				<Enter t={70.8} dir="left" dist={200} dur={0.4}>
					<Frame916 h={460} />
				</Enter>
			</At>
			<At x={1560} y={450} style={{opacity: 0.4 + 0.4 * leave}}>
				<Enter t={70.85} dir="right" dist={200} dur={0.4}>
					<Frame169 w={520} />
				</Enter>
			</At>
			<At x={960} y={450} style={{opacity: 1 - leave, transform: `translate(-50%,-50%) scale(${1 - 0.4 * leave})`}}>
				<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
					<div style={{display: 'flex', gap: 30}}>
						<Enter t={W_OUTRA} dir="up" dist={60} dur={0.3}>
							<Big size={100} color="#fff">
								OUTRA
							</Big>
						</Enter>
						<Enter t={W_DIF} dir="up" dist={60} dur={0.3}>
							<Big size={100} color="#fff">
								DIFERENÇA
							</Big>
						</Enter>
					</div>
					<div style={{transform: `scale(${T < W_ENORME ? 0 : 0.6 + 0.55 * easeOutBack(grow, 1.6)})`}}>
						<Big size={230} color={C.gold} glow={C.gold} italic>
							ENORME
						</Big>
					</div>
				</div>
			</At>
			<At x={960} y={450}>
				<Stamp t={NE} rot={0} from={2.4}>
					<Big size={300} color="#fff" glow={C.cyan}>
						≠
					</Big>
				</Stamp>
			</At>
			<Shock t={W_ENORME} color={C.gold} x={960} y={520} size={1200} />
		</Cam>
	);
};

/* ------------------------------------------------------------------ */
/* c16 · 73,05–77,51 · Shorts × vídeos longos (ilustrativo)            */
/* ------------------------------------------------------------------ */
const Meter: React.FC<{level: number; color: string; label: string; arrow?: 'up' | 'down'}> = ({level, color, label, arrow}) => (
	<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12}}>
		<div style={{fontFamily: F.black, fontSize: 64, color, letterSpacing: '0.06em'}}>{label}</div>
		<div style={{width: 64, height: 300, borderRadius: 32, background: 'rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden'}}>
			<div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: `${level * 100}%`, borderRadius: 32, background: `linear-gradient(0deg, ${color}88, ${color})`, boxShadow: `0 0 30px ${color}`}} />
		</div>
		{arrow && <Icon name={arrow} size={70} color={color} />}
	</div>
);

export const C16Shorts: React.FC = () => {
	const T = useT();
	const A = 73.05;
	const W_SH = 73.52;
	const W_PAGAM = 74.74;
	const W_MENOS = 75.56;
	const W_TRAD = 76.28;
	const open = expoOut(k(T, A, 0.6));
	const leftLevel = T < W_MENOS ? 0.55 * eo(T, W_PAGAM, 0.4) : lerp(0.55, 0.12, easeOutCubic(k(T, W_MENOS, 0.5)));
	const on = easeOutCubic(k(T, W_TRAD, 0.4));
	const zoom = 1 + 0.012 * (T - A);
	return (
		<Cam zoom={zoom} x={lerp(30, -30, k(T, A, 4.4))} hits={[W_MENOS, W_TRAD]} amp={8}>
			{/* divisor que nasce do "≠" */}
			<div style={{position: 'absolute', left: 957, top: lerp(450, 40, open), width: 6, height: lerp(0, 820, open), background: `linear-gradient(180deg, transparent, ${C.cyan}, transparent)`, boxShadow: `0 0 20px ${C.cyan}`}} />
			<At x={960} y={450}>
				<div style={{width: 130, height: 130, borderRadius: 65, background: C.bg1, border: `4px solid ${C.cyan}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${C.cyan}66`, transform: `scale(${eb(T, A + 0.15, 0.4, 2)})`}}>
					<div style={{fontFamily: F.black, fontSize: 56, color: '#fff'}}>VS</div>
				</div>
			</At>
			{/* esquerda: Shorts */}
			<div style={{position: 'absolute', inset: 0, transform: `translateX(${-280 * (1 - open)}px)`, opacity: open}}>
				<At x={430} y={430}>
					<Enter t={W_SH - 0.08} dir="pop" dur={0.4}>
						<Frame916 h={560} color={`${C.red}AA`}>
							<div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#1C2B55,#0E1733)'}} />
							<div style={{position: 'absolute', left: '50%', top: '42%', transform: `translate(-50%,-50%) scale(${breathe(T, 0.04, 5)})`, width: 120, height: 160, borderRadius: 36, background: C.red, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 50px ${C.red}88`}}>
								<Icon name="play" size={80} color="#fff" />
							</div>
							<div style={{position: 'absolute', left: 0, right: 0, bottom: 30, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10}}>
								<Icon name="eye" size={40} color="#fff" />
								<Odometer n={4} size={46} prefix="" color="#fff" speed={14} seed={21} />
							</div>
						</Frame916>
					</Enter>
				</At>
				<At x={430} y={770}>
					<Enter t={W_SH} dir="up" dist={40} dur={0.3}>
						<Label size={40} color="#fff" weight={800}>
							Shorts
						</Label>
					</Enter>
				</At>
				<At x={750} y={460}>
					<Enter t={W_PAGAM - 0.05} dir="up" dist={60} dur={0.35}>
						<Meter level={leftLevel} color={T >= W_MENOS ? C.dim : C.green} label="$" arrow={T >= W_MENOS ? 'down' : undefined} />
					</Enter>
				</At>
			</div>
			{/* direita: vídeos longos (apagado até "tradicionais") */}
			<div style={{position: 'absolute', inset: 0, transform: `translateX(${280 * (1 - open)}px)`, opacity: open * (0.35 + 0.65 * on), filter: on < 0.9 ? `saturate(${0.2 + 0.8 * on})` : undefined}}>
				<At x={1440} y={400}>
					<VideoThumb w={600} views="" viewsColor="#fff" />
				</At>
				<At x={1440} y={770}>
					<Label size={40} color="#fff" weight={800}>
						Vídeos longos
					</Label>
				</At>
				<At x={1440} y={600}>
					<div style={{opacity: on}}>
						<LineChart w={520} h={120} pts={[0.1, 0.2, 0.25, 0.4, 0.5, 0.7, 0.9]} p={eo(T, W_TRAD, 0.8)} color={C.green} strokeW={7} grid={false} />
					</div>
				</At>
				<At x={1830} y={430}>
					<Meter level={0.92 * eo(T, W_TRAD + 0.05, 0.5)} color={C.green} label="$$$" arrow={T >= W_TRAD ? 'up' : undefined} />
				</At>
			</div>
			<At x={960} y={830}>
				<Enter t={W_TRAD + 0.2} dir="fade" dur={0.3}>
					<Illustrative />
				</Enter>
			</At>
		</Cam>
	);
};

/* ------------------------------------------------------------------ */
/* c17 · 77,51–83,66 · "E sabe o que é mais interessante? … tarifa especial" */
/* ------------------------------------------------------------------ */
export const C17Tarifa: React.FC = () => {
	const T = useT();
	const W_SABE = 77.94;
	const W_INT = 78.66;
	const W_CANAL = 79.82;
	const W_MON = 80.96;
	const W_REC = 82.04;
	const W_ESP = 83.0;
	const qOut = easeOutCubic(k(T, W_CANAL - 0.1, 0.3));
	const unlocked = T >= W_MON;
	const lockOut = easeOutCubic(k(T, W_REC - 0.25, 0.25));
	const tear = easeOutCubic(k(T, W_ESP, 0.6));
	const zoom = (1 + 0.012 * (T - 77.51)) * (1 + 0.06 * punch(T, W_ESP, 0.8));
	return (
		<Cam zoom={zoom} hits={[W_MON, W_ESP]} amp={10}>
			{/* "?" 3D */}
			{T < W_CANAL + 0.3 && (
				<At x={960} y={430} style={{opacity: 1 - qOut, transform: `translate(-50%,-50%) scale(${1 - 0.6 * qOut})`}}>
					<Enter t={W_SABE - 0.1} dir="drop" dist={240} dur={0.5}>
						<div style={{transform: `perspective(1400px) rotateY(${Math.sin((T - W_SABE) * 3) * 35}deg)`}}>
							<Icon name="question" size={340} color={C.gold} style={{filter: `drop-shadow(0 0 40px ${C.gold}88)`}} />
						</div>
					</Enter>
				</At>
			)}
			<Burst t={W_INT} color={C.gold} x={960} y={430} n={16} len={360} />
			{/* canal + cadeado */}
			<At x={660} y={430}>
				<Enter t={W_CANAL - 0.05} dir="pop" dur={0.45}>
					<ChannelCard on={easeOutCubic(k(T, W_MON, 0.25))} pulse={clamp(1 - k(T, W_MON, 0.6)) * (unlocked ? 1 : 0)} />
				</Enter>
			</At>
			{T < W_REC + 0.1 && (
				<At x={1390} y={420} style={{opacity: 1 - lockOut}}>
					<Enter t={W_CANAL + 0.1} dir="pop" dur={0.4}>
						<div style={{transform: `scale(${unlocked ? 1 + 0.15 * (1 - easeOutBack(k(T, W_MON, 0.35), 2)) : 1}) rotate(${unlocked ? 0 : Math.sin(T * 20) * 2}deg)`}}>
							<Icon name={unlocked ? 'unlock' : 'lock'} size={300} color={unlocked ? C.green : C.dim} style={{filter: unlocked ? `drop-shadow(0 0 40px ${C.green})` : undefined}} />
						</div>
					</Enter>
				</At>
			)}
			<Shock t={W_MON} color={C.green} x={1390} y={440} size={800} />
			<CoinBurst t={W_MON + 0.05} x={1390} y={440} n={10} power={0.7} seed={31} />
			{/* ingresso "TARIFA ESPECIAL" que rasga */}
			{T >= W_REC - 0.05 && (
				<At x={1390} y={420}>
					<div style={{transform: `translateX(${300 * rampIn(T, W_REC - 0.05, 0.45)}px)`, opacity: clamp(k(T, W_REC - 0.05, 0.15)) * (1 - k(T, W_ESP + 0.45, 0.2))}}>
						<div style={{position: 'relative', width: 560, height: 260}}>
							{[0, 1].map((half) => (
								<div
									key={half}
									style={{
										position: 'absolute',
										top: 0,
										left: half * 280,
										width: 280,
										height: 260,
										overflow: 'hidden',
										transform: `translate(${(half ? 1 : -1) * 120 * tear}px, ${240 * tear * tear}px) rotate(${(half ? 1 : -1) * 22 * tear}deg)`,
										filter: tear > 0 ? `saturate(${1 - tear})` : undefined,
									}}
								>
									<div style={{position: 'absolute', left: -half * 280, top: 0, width: 560, height: 260, borderRadius: 30, background: 'linear-gradient(135deg,#FFE9A3,#FFC83D 55%,#E6A21C)', boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 50px ${C.gold}66`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
										<div style={{position: 'absolute', left: 30, right: 30, top: 24, bottom: 24, border: '4px dashed rgba(90,60,0,0.4)', borderRadius: 20}} />
										<Icon name="star" size={64} color="#7A5200" />
										<div style={{fontFamily: F.black, fontSize: 58, color: '#4A3200', lineHeight: 1.05, textAlign: 'center'}}>
											TARIFA
											<br />
											ESPECIAL
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</At>
			)}
		</Cam>
	);
};

/* ------------------------------------------------------------------ */
/* c18 · 83,66–90,91 · Fatores (quarto inferior direito livre)         */
/* ------------------------------------------------------------------ */
const NODE = {x: 760, y: 420};
const FACTORS = [
	{t: 85.12, x: 300, y: 190, icon: 'users' as const, label: 'Público', color: C.cyan},
	{t: 86.0, x: 1260, y: 190, icon: 'content' as const, label: 'Conteúdo', color: C.purple},
	{t: 86.96, x: 300, y: 660, icon: 'ad' as const, label: 'Anúncios', color: C.gold},
	{t: 88.38, x: 1440, y: 430, icon: 'eye' as const, label: 'Views que geram receita', color: C.green},
];
export const C18Fatores: React.FC = () => {
	const T = useT();
	const A = 83.66;
	const W_PAG = 83.98;
	const W_REC = 90.22;
	const arrive = rampIn(T, A, 0.6); // whip para a direita: chega da esquerda
	const lit = T >= W_REC;
	// câmera puxa de leve para o último cartão que entrou
	const last = [...FACTORS].reverse().find((f) => T >= f.t);
	const tx = last ? (960 - last.x) * 0.06 : 0;
	const ty = last ? (470 - last.y) * 0.06 : 0;
	// speed ramp para dentro do nó no fim
	const dive = rampOut(T, 90.6, 0.31);
	const zoom = (1 + 0.01 * (T - A)) * (1 + 1.6 * dive);
	return (
		<div style={{position: 'absolute', inset: 0, transform: `translateX(${-560 * arrive}px)`, filter: arrive > 0.05 || dive > 0.1 ? `blur(${Math.max(arrive, dive) * 10}px)` : undefined}}>
			<Cam zoom={zoom} x={tx} y={ty} ox={NODE.x} oy={NODE.y} hits={[W_REC]} amp={8}>
				<svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
					{FACTORS.map((f, i) => {
						if (T < f.t) return null;
						const p = easeOutCubic(k(T, f.t, 0.35));
						const ex = lerp(NODE.x, f.x, p);
						const ey = lerp(NODE.y, f.y, p);
						const pulses = lit ? [k(T, W_REC, 0.45)] : [((T - f.t) * 0.9) % 1];
						return (
							<g key={i}>
								<line x1={NODE.x} y1={NODE.y} x2={ex} y2={ey} stroke={`${f.color}66`} strokeWidth={6} strokeDasharray="12 12" strokeDashoffset={T * 60} />
								{pulses.map((q, j) => {
									// pulso corre do cartão até o centro
									const px = lerp(f.x, NODE.x, q);
									const py = lerp(f.y, NODE.y, q);
									return q > 0 && q < 1 ? <circle key={j} cx={px} cy={py} r={lit ? 18 : 11} fill={lit ? C.green : f.color} style={{filter: `drop-shadow(0 0 12px ${lit ? C.green : f.color})`}} /> : null;
								})}
							</g>
						);
					})}
				</svg>
				<At x={NODE.x} y={NODE.y}>
					<Enter t={W_PAG - 0.08} dir="pop" dur={0.45}>
						<div style={{width: 300, height: 300, borderRadius: 150, background: lit ? `radial-gradient(circle, ${C.green}, ${C.greenDeep})` : 'radial-gradient(circle at 40% 35%, #2C3B68, #121A33)', border: `6px solid ${C.green}`, boxShadow: `0 0 ${lit ? 120 : 50}px ${C.green}${lit ? 'CC' : '55'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `scale(${breathe(T, 0.03, 3)})`}}>
							<div style={{fontFamily: F.black, fontSize: 96, color: lit ? '#04210F' : C.green, lineHeight: 1}}>R$</div>
							<Label size={28} color={lit ? '#04210F' : '#fff'} weight={800}>
								Pagamento
							</Label>
						</div>
					</Enter>
				</At>
				{FACTORS.map((f, i) => (
					<At key={i} x={f.x} y={f.y}>
						<Enter t={f.t - 0.04} dir="pop" dur={0.4}>
							<Panel w={f.label.length > 12 ? 600 : 380} h={130} glow={f.color} pad={20} style={{display: 'flex', alignItems: 'center', gap: 20}}>
								<div style={{width: 86, height: 86, borderRadius: 24, background: `${f.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
									<Icon name={f.icon} size={58} color={f.color} />
								</div>
								<div style={{fontFamily: F.black, fontSize: f.label.length > 12 ? 34 : 44, color: '#fff', lineHeight: 1.05, whiteSpace: 'nowrap'}}>{f.label}</div>
							</Panel>
						</Enter>
					</At>
				))}
				<Shock t={W_REC + 0.45} color={C.green} x={NODE.x} y={NODE.y} size={900} />
			</Cam>
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* c19 + c20 · 90,91–104,36 · CTA (contínuo; câmera desce em 95,8)     */
/* ------------------------------------------------------------------ */
const Sprout: React.FC<{size?: number; color?: string}> = ({size = 40, color = C.green}) => (
	<svg width={size} height={size} viewBox="0 0 24 24">
		<path d="M12 21v-9" stroke={color} strokeWidth={2.6} strokeLinecap="round" />
		<path d="M12 12C12 7 8.5 4.5 4 4.5 4 9 7 12 12 12z" fill={color} />
		<path d="M12 14c0-4 2.8-6 6.5-6 0 3.6-2.5 6-6.5 6z" fill={color} opacity={0.75} />
	</svg>
);

const Comment: React.FC<{text: string; color: string; t: number}> = ({text, color, t}) => {
	const T = useT();
	const p = easeOutBack(clamp((T - t) / 0.35), 1.7);
	if (T < t) return null;
	return (
		<div style={{display: 'flex', alignItems: 'center', gap: 20, transform: `translateY(${(1 - p) * 40}px) scale(${0.85 + 0.15 * p})`, opacity: clamp(p * 2), transformOrigin: '0 50%'}}>
			<div style={{width: 72, height: 72, borderRadius: 36, background: `linear-gradient(135deg, ${color}, ${color}66)`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
				<Icon name="user" size={42} color="#0A1124" />
			</div>
			<div style={{padding: '18px 28px', borderRadius: '8px 28px 28px 28px', background: 'rgba(255,255,255,0.08)', border: `2px solid ${color}55`}}>
				<div style={{fontFamily: F.ui, fontWeight: 800, fontSize: 36, color: '#fff', whiteSpace: 'nowrap'}}>{text}</div>
			</div>
		</div>
	);
};

const Ep: React.FC<{n: number; t: number; ghost?: boolean; w?: number}> = ({n, t, ghost, w = 250}) => {
	const T = useT();
	if (T < t) return null;
	const p = easeOutBack(clamp((T - t) / 0.4), 1.6);
	return (
		<div style={{transform: `scale(${p})`, opacity: clamp(p * 2)}}>
			<div style={{width: w, height: (w * 9) / 16, borderRadius: 18, border: ghost ? `3px dashed ${C.dim}` : `3px solid ${C.gold}`, background: ghost ? 'rgba(255,255,255,0.03)' : 'linear-gradient(135deg,#1C2B55,#0E1733)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: ghost ? undefined : `0 0 40px ${C.gold}55`}}>
				<Icon name={ghost ? 'question' : 'play'} size={ghost ? 50 : 56} color={ghost ? C.dim : '#fff'} />
				<div style={{position: 'absolute', left: -8, top: -18}}>
					<Pill bg={ghost ? '#2A3558' : C.gold} color={ghost ? C.dim : '#2E2200'} size={26}>
						EP. {n}
						{ghost ? '?' : ''}
					</Pill>
				</div>
			</div>
		</div>
	);
};

export const C19CTA: React.FC = () => {
	const T = useT();
	const A = 90.91;
	const W_CONTA = 91.62;
	const W_COM = 92.64;
	const W_YT = 93.56;
	const W_JA = 94.38;
	const W_MON = 95.02;
	const W_COMENTA = 96.06;
	const W_EMB = 96.5;
	const W_PORQUE = 97.22;
	const W_PRI = 98.44;
	const W_VAR = 99.2;
	const W_GANHAR = 102.06;
	const W_INTERNET = 103.7;
	const arrive = rampIn(T, A, 0.6); // chega do speed ramp (zoom-through)
	const down = expoOut(k(T, 95.8, 0.7)); // câmera desce até o campo de comentário
	const titleOut = easeOutCubic(k(T, 98.1, 0.3));
	const zoom = (1 + 0.008 * (T - A)) * (1 + 0.6 * arrive);
	// cursor em arco até o botão "Comentar"
	const cur = easeOutCubic(k(T, W_COMENTA, 0.44));
	const btn = {x: 870, y: 465};
	const cx = lerp(1250, btn.x, cur);
	const cy = lerp(160, btn.y, cur) - Math.sin(cur * Math.PI) * 140;
	const press = T >= W_EMB ? 1 - 0.12 * Math.sin(Math.PI * clamp((T - W_EMB) / 0.22)) : 1;
	const coinP = easeOutCubic(k(T, W_GANHAR, 1.1));
	return (
		<>
			<div style={{position: 'absolute', inset: 0, filter: arrive > 0.05 ? `blur(${arrive * 12}px)` : undefined}}>
				<Cam zoom={zoom} ox={560} oy={430} y={-330 * down} x={0}>
					{/* painel de comentários (inspirado, ilustrativo) */}
					<div style={{position: 'absolute', left: 120, top: 130, width: 900}}>
						<Enter t={A + 0.05} dir="up" dist={120} dur={0.45}>
							<Panel w={900} h={1100} glow={C.cyan} pad={40}>
								<div style={{display: 'flex', alignItems: 'center', gap: 20}}>
									<div style={{transform: `scale(${eb(T, W_YT, 0.35, 2.2)})`, width: 92}}>
										<PlayLogo size={92} glow={false} />
									</div>
									<div>
										<Label size={24}>Seu vídeo</Label>
										<div style={{fontFamily: F.black, fontSize: 46, color: '#fff'}}>Comentários</div>
									</div>
									<div style={{marginLeft: 'auto'}}>
										<Icon name="comment" size={56} color={C.cyan} />
									</div>
								</div>
								<div style={{display: 'flex', gap: 20, marginTop: 40}}>
									<div style={{transform: `scale(${eb(T, W_COM, 0.35, 1.9)})`}}>
										<Pill bg="rgba(34,224,122,0.12)" color="#fff" size={34} style={{border: `2px solid ${C.green}88`}}>
											<Sprout size={40} /> Começando o canal
										</Pill>
									</div>
									<div style={{transform: `scale(${eb(T, W_JA, 0.35, 1.9)})`}}>
										<Pill bg="rgba(34,224,122,0.12)" color="#fff" size={34} style={{border: `2px solid ${C.green}88`}}>
											<Icon name="check" size={36} color={C.green} /> Já monetizei
										</Pill>
									</div>
								</div>
								{/* campo + botão */}
								<div style={{display: 'flex', alignItems: 'center', gap: 20, marginTop: 50}}>
									<div style={{flex: 1, height: 96, borderRadius: 48, background: 'rgba(255,255,255,0.06)', border: `2px solid ${T >= W_EMB ? C.cyan : 'rgba(255,255,255,0.15)'}`, display: 'flex', alignItems: 'center', padding: '0 34px'}}>
										<div style={{fontFamily: F.ui, fontWeight: 600, fontSize: 32, color: C.dim}}>Adicione um comentário…</div>
										{T >= W_EMB && <div style={{width: 3, height: 44, marginLeft: 6, background: '#fff', opacity: Math.floor(T * 3) % 2 ? 1 : 0}} />}
									</div>
									<div style={{transform: `scale(${press})`, padding: '26px 38px', borderRadius: 48, background: T >= W_EMB ? C.cyan : '#2A3558', fontFamily: F.black, fontSize: 34, color: T >= W_EMB ? '#04121F' : '#fff', boxShadow: T >= W_EMB ? `0 0 40px ${C.cyan}88` : undefined}}>
										Comentar
									</div>
								</div>
								<div style={{display: 'flex', flexDirection: 'column', gap: 26, marginTop: 50}}>
									<Comment text="Começando agora!" color={C.green} t={W_PORQUE} />
									<Comment text="Já monetizei!" color={C.gold} t={W_PORQUE + 0.4} />
								</div>
							</Panel>
						</Enter>
					</div>
					<Shock t={W_EMB} color={C.cyan} x={btn.x} y={btn.y} size={260} dur={0.4} />
					{/* cursor em arco */}
					{T >= W_COMENTA - 0.05 && T < 97.6 && (
						<div style={{position: 'absolute', left: cx - 14, top: cy - 8, transform: `scale(${T >= W_EMB && T < W_EMB + 0.2 ? 0.85 : 1})`, opacity: clamp(k(T, W_COMENTA - 0.05, 0.12)) * (1 - k(T, 97.3, 0.25))}}>
							<Icon name="cursor" size={90} color="#fff" />
						</div>
					)}
				</Cam>
			</div>
			{/* título (quarto superior direito) */}
			<At x={1460} y={260} style={{opacity: 1 - titleOut, transform: `translate(-50%,-50%) translateY(${-120 * titleOut}px)`}}>
				<Stamp t={W_MON} rot={-4} from={2.2}>
					<div style={{textAlign: 'center'}}>
						<Big size={110} color="#fff" stroke={6}>
							VOCÊ JÁ
						</Big>
						<Big size={110} color={C.green} glow={C.green} stroke={6}>
							MONETIZOU?
						</Big>
					</div>
				</Stamp>
			</At>
			<Shock t={W_MON} color={C.green} x={1460} y={260} size={800} />
			{/* série: EP. 1 e os próximos (fica acima de y 540) */}
			<At x={1480} y={250}>
				<div style={{display: 'flex', gap: 30, alignItems: 'center'}}>
					<Ep n={1} t={W_PRI} w={T >= W_VAR ? 230 : 320} />
					<Ep n={2} t={W_VAR} ghost w={230} />
					<Ep n={3} t={W_VAR + 0.12} ghost w={230} />
				</div>
			</At>
			{T >= W_GANHAR && (
				<>
					<div style={{position: 'absolute', left: 1130, top: 395, width: 700 * coinP, height: 8, borderRadius: 4, background: `linear-gradient(90deg, ${C.green}00, ${C.green})`, boxShadow: `0 0 20px ${C.green}`}} />
					<div style={{position: 'absolute', left: 1130 + 700 * coinP - 50, top: 350, transform: `rotate(${T * 400}deg)`}}>
						<Icon name="dollar" size={96} color={C.gold} />
					</div>
				</>
			)}
			<At x={1480} y={490}>
				<Enter t={W_INTERNET - 0.05} dir="pop" dur={0.4}>
					<div style={{transform: `scale(${breathe(T, 0.05, 5)}) rotate(${Math.sin(T * 2) * 4}deg)`}}>
						<PlayLogo size={110} />
					</div>
				</Enter>
			</At>
			<Burst t={W_INTERNET} color={C.red} x={1480} y={490} n={12} len={160} dur={0.5} />
		</>
	);
};

