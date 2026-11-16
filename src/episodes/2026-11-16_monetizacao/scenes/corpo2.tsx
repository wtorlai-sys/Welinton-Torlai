// Corpo, parte 2 (c09–c14, 0:43–1:11) — plano aprovado em _CLAUDE/plano-cenas.md.
import React from 'react';
import {Freeze} from 'remotion';
import {
	At, Big, Burst, C, Cam, Enter, F, Fill, Flash, Icon, Illustrative, Label, LineChart, MoneyRain, Odometer, Panel, Pill, Shock, SpeedLines, Stamp,
	breathe, clamp, count, easeOutBack, easeOutCubic, eb, eo, expoIn, expoOut, fmt, k, lerp, punch, rampIn, useT,
} from '../../monetizacao/kit';
import {hash1} from '../../../style/random';
import {Coins3D} from '../../monetizacao/three';

/* ------------------------------------------------------------------ */
/* c09 · 43,44–48,48 · 100 mil → "até R$ 500"                          */
/* ------------------------------------------------------------------ */
export const C09CemMil: React.FC = () => {
	const T = useT();
	const A = 43.44;
	const W_100 = 44.0;
	const W_MIL = 44.36;
	const W_VIS = 44.62;
	const W_VALOR = 46.08;
	const W_CHEGAR = 46.66;
	const W_500 = 47.18;
	const arrive = rampIn(T, A, 0.6); // whip para cima: chega de cima
	const views = T < W_100 ? 10000 : count(T, W_100, W_VIS, 10000, 100000);
	const big = easeOutBack(clamp((T - W_MIL) / 0.45), 1.3);
	const slide = expoOut(k(T, W_VALOR - 0.1, 0.5));
	const follow = easeOutCubic(k(T, W_MIL, 0.6)) * (1 - slide);
	const zoom = (1 + 0.01 * (T - A)) * (1 + 0.1 * punch(T, W_500, 1.1));
	const bars = [
		{l: '1 MIL', v: 0.05},
		{l: '10 MIL', v: 0.16},
		{l: '100 MIL', v: 0.16 + 0.86 * big},
	];
	const gx = lerp(960, 560, slide);
	return (
		<div style={{position: 'absolute', inset: 0, transform: `translateY(${-560 * arrive}px)`, filter: arrive > 0.05 ? `blur(${arrive * 10}px)` : undefined}}>
			<Cam zoom={zoom} y={30 * follow} ox={lerp(960, 1360, slide)} oy={430} hits={[W_MIL, W_500]} amp={14}>
				{/* contador acelerado */}
				<At x={gx - 210} y={205}>
					<div style={{display: 'flex', alignItems: 'center', gap: 20, opacity: 1 - k(T, W_VALOR - 0.15, 0.3)}}>
						<Icon name="eye" size={84} color={C.gold} />
						<div style={{fontFamily: F.black, fontSize: 108, color: T >= W_VIS ? C.gold : '#fff', lineHeight: 1, filter: T > W_100 && T < W_VIS - 0.1 ? 'blur(1.5px)' : undefined, textShadow: `0 0 40px ${C.gold}55`}}>{fmt(views)}</div>
					</div>
				</At>
				{/* "+K" saltando do número */}
				{Array.from({length: 7}).map((_, i) => {
					const t0 = W_100 + i * 0.07;
					const lt = T - t0;
					if (lt < 0 || lt > 0.8) return null;
					return (
						<At key={i} x={gx - 200 + hash1(i * 3.3) * 420 + lt * (hash1(i) - 0.5) * 300} y={110 - lt * 260} style={{opacity: 1 - lt / 0.8}}>
							<div style={{fontFamily: F.black, fontSize: 46, color: C.gold}}>+K</div>
						</At>
					);
				})}
				{/* barras de evolução */}
				<At x={gx} y={530}>
					<div style={{width: 760, height: 460, position: 'relative'}}>
						<div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, background: 'rgba(255,255,255,0.25)'}} />
						{bars.map((b, i) => {
							const col = i === 2 ? C.gold : C.cyan;
							return (
								<div key={i} style={{position: 'absolute', left: 40 + i * 250, bottom: 0, width: 180, height: 460 * b.v, borderRadius: '18px 18px 4px 4px', background: `linear-gradient(180deg, ${col}, ${col}66)`, boxShadow: `0 0 ${i === 2 ? 50 : 20}px ${col}66`}}>
									<Label size={30} color={i === 2 ? C.gold : C.dim} style={{position: 'absolute', bottom: -46, left: '50%', transform: 'translateX(-50%)'}}>
										{b.l}
									</Label>
								</div>
							);
						})}
					</div>
				</At>
				<At x={gx + 250} y={760 - 460 * (0.16 + 0.86 * big) - 48}>
					<Stamp t={W_VIS} rot={-6} from={2}>
						<Pill bg={C.gold} color="#2E2200" size={44}>
							100 MIL
						</Pill>
					</Stamp>
				</At>
				{/* receita subindo + até R$ 500 */}
				<At x={1380} y={450}>
					<Enter t={W_VALOR - 0.05} dir="right" dist={260} dur={0.42}>
						<Panel w={720} h={560} glow={C.green}>
							<div style={{display: 'flex', alignItems: 'center', gap: 16}}>
								<Icon name="dollar" size={48} color={C.green} />
								<Label size={30} color={C.green}>
									Receita estimada
								</Label>
							</div>
							<div style={{position: 'absolute', left: 36, right: 36, bottom: 40}}>
								<LineChart w={648} h={260} pts={[0.05, 0.1, 0.12, 0.2, 0.28, 0.42, 0.55, 0.78, 0.95]} p={eo(T, W_VALOR, 1.0)} color={C.green} strokeW={9} />
							</div>
							<div style={{position: 'absolute', left: 0, right: 0, top: 110, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 20}}>
								<div style={{opacity: clamp(k(T, W_CHEGAR, 0.2))}}>
									<Big size={90} color="#fff">
										ATÉ
									</Big>
								</div>
								<Stamp t={W_500} rot={-4} from={2.4}>
									<Big size={150} color={C.green} glow={C.green}>
										R$ 500
									</Big>
								</Stamp>
							</div>
						</Panel>
					</Enter>
				</At>
				<Shock t={W_500} color={C.green} x={1420} y={330} size={900} />
				<Burst t={W_500} color={C.green} x={1420} y={330} n={16} len={420} />
			</Cam>
			<SpeedLines amt={arrive} color={C.gold} seed={5} />
			<Flash t={W_500} max={0.25} color={C.green} />
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* c10 · 48,48–52,00 · "E se o vídeo alcançar 1 milhão…" (preparação)   */
/* ------------------------------------------------------------------ */
export const W_MILHAO = 50.34;
export const C10Milhao: React.FC = () => {
	const T = useT();
	const A = 48.48;
	const W_VIDEO = 49.18;
	const W_ALC = 49.38;
	const W_VIS = 51.02;
	const views = T < W_ALC ? 100000 : count(T, W_ALC, W_MILHAO, 100000, 1000000, expoIn);
	const hit = T >= W_MILHAO;
	const fast = T > W_ALC + 0.5 && !hit;
	const zoom = (0.96 + 0.02 * (T - A)) * (1 + 0.25 * punch(T, W_MILHAO, 1.3));
	return (
		<>
			{/* gráfico disparando atrás, sai pelo topo */}
			<At x={960} y={560}>
				<div style={{opacity: 0.55}}>
					<LineChart w={1700} h={700} pts={[0.02, 0.03, 0.05, 0.06, 0.09, 0.12, 0.2, 0.35, 0.7, 1.4]} p={0.55 * eo(T, A, 1.5) + 0.45 * expoOut(k(T, W_MILHAO, 0.5))} color={C.gold} strokeW={10} />
				</div>
			</At>
			<Cam zoom={zoom} hits={[W_MILHAO]} amp={34}>
				<At x={960} y={420}>
					<Enter t={W_VIDEO - 0.1} dir="fade" dur={0.4}>
						<div style={{display: 'flex', alignItems: 'center', gap: 34, transform: `scale(${hit ? 1 + 0.25 * (1 - easeOutBack(k(T, W_MILHAO, 0.35), 2.2)) : 1})`}}>
							<Icon name="eye" size={150} color={hit ? C.gold : '#fff'} />
							<div style={{fontFamily: F.black, fontSize: 230, lineHeight: 1, color: hit ? C.gold : '#fff', filter: fast ? `blur(${2 + 3 * k(T, W_ALC + 0.5, 0.4)}px)` : undefined, textShadow: hit ? `0 0 60px ${C.gold}AA` : '0 0 30px rgba(255,255,255,0.25)', letterSpacing: '-0.02em'}}>
								{fmt(views)}
							</div>
						</div>
					</Enter>
				</At>
				<At x={960} y={660}>
					<Stamp t={W_VIS} rot={0} from={1.6}>
						<Big size={120} color={C.gold} glow={C.gold}>
							1 MILHÃO
						</Big>
					</Stamp>
				</At>
				<Shock t={W_MILHAO} color={C.gold} x={960} y={420} size={1400} dur={0.7} />
				<Burst t={W_MILHAO} color={C.gold} x={960} y={420} n={22} len={700} dur={0.6} />
			</Cam>
			<SpeedLines amt={fast ? 0.8 : 0} color={C.gold} seed={9} />
			<Flash t={W_MILHAO} max={0.7} />
		</>
	);
};

/* ------------------------------------------------------------------ */
/* c11 · 52,00–55,73 · R$ 1.000 a R$ 5.000 (ápice)                     */
/* ------------------------------------------------------------------ */
const W_1000 = 53.58;
export const W_5000 = 54.14;
export const C11Apice: React.FC = () => {
	const T = useT();
	const A = 52.0;
	const q = rampIn(T, A, 0.55);
	const zoom = (1 + 0.012 * (T - A)) * (1 + 0.15 * punch(T, W_5000, 1.2));
	const done = T >= W_5000;
	return (
		<div style={{position: 'absolute', inset: 0, transform: `scale(${1 + 1.2 * q})`, filter: q > 0.03 ? `blur(${q * 16}px)` : undefined}}>
			{T >= W_5000 - 0.05 && (
				<div style={{position: 'absolute', inset: 0, zIndex: 0}}>
					<Coins3D t0={W_5000} n={46} seed={12} burst dur={1.4} />
				</div>
			)}
			<div style={{position: 'absolute', inset: 0, zIndex: 1}}>
			<Cam zoom={zoom} hits={[W_1000, W_5000]} amp={30}>
				<At x={960} y={215}>
					<div style={{display: 'flex', alignItems: 'center', gap: 24}}>
						<Enter t={52.7} dir="down" dist={60} dur={0.35}>
							<Label size={34} color={C.dim}>
								com 1 milhão de views
							</Label>
						</Enter>
						<Stamp t={W_1000} rot={-3} from={1.8}>
							<Pill bg="rgba(34,224,122,0.16)" color={C.green} size={50} style={{border: `3px solid ${C.green}`}}>
								R$ 1.000
							</Pill>
						</Stamp>
					</div>
				</At>
				<At x={960} y={500}>
					{!done ? (
						<Enter t={52.1} dir="pop" dur={0.35}>
							<Panel w={1200} h={320} glow={C.green} pad={30} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
								<Odometer n={4} size={190} speed={T > W_5000 - 0.4 ? 12 : 30} seed={11} />
							</Panel>
						</Enter>
					) : (
						<div style={{transform: `scale(${1 + 0.9 * (1 - easeOutBack(k(T, W_5000, 0.32), 2.4))})`}}>
							<Big size={300} color={C.green} glow={C.green} stroke={8}>
								R$ 5.000
							</Big>
						</div>
					)}
				</At>
			</Cam>
			</div>
			<MoneyRain t={W_5000 + 0.1} dur={1.4} n={18} seed={13} speed={1.1} />
			<Shock t={W_5000} color={C.green} x={960} y={500} size={1500} dur={0.7} />
			<Burst t={W_5000} color={C.gold} x={960} y={500} n={24} len={720} dur={0.6} />
			<Flash t={W_5000} max={0.75} color="#E9FFF2" />
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* c12 · 55,73–60,36 · Virada: "Mas calma…"                            */
/* ------------------------------------------------------------------ */
export const C12Virada: React.FC = () => {
	const T = useT();
	const W_MAS = 55.95;
	const W_DET = 57.76;
	const W_MUDA = 58.24;
	const W_CONTA = 59.8;
	const frozenAt = Math.round(55.6 * 30);
	const glitch = T >= W_MAS && T < W_MAS + 0.32;
	const g = (i: number) => (glitch ? (hash1(Math.floor(T * 30) * 3.1 + i) - 0.5) * 60 : 0);
	const cool = easeOutCubic(k(T, W_MAS, 0.5));
	const zoom = 1 + 0.03 * easeOutCubic(k(T, 56.2, 4));
	const lens = easeOutCubic(k(T, W_DET, 0.9));
	const qm = easeOutBack(k(T, W_MUDA, 0.4), 1.8);
	return (
		<Cam zoom={zoom}>
			{/* tudo congela, esfria e escurece */}
			<Fill style={{filter: `saturate(${1 - 0.85 * cool}) brightness(${1 - 0.55 * cool})`, transform: `translateX(${g(1)}px)`}}>
				<Freeze frame={frozenAt}>
					<C11Apice />
				</Freeze>
			</Fill>
			{glitch && (
				<>
					<Fill style={{mixBlendMode: 'screen', opacity: 0.6, transform: `translateX(${g(2) + 18}px)`, filter: 'hue-rotate(-60deg) saturate(3)'}}>
						<Freeze frame={frozenAt}>
							<C11Apice />
						</Freeze>
					</Fill>
					{Array.from({length: 6}).map((_, i) => (
						<div key={i} style={{position: 'absolute', left: 0, right: 0, top: hash1(Math.floor(T * 30) + i * 7) * 1000, height: 8 + hash1(i + Math.floor(T * 30)) * 40, background: i % 2 ? `${C.cyan}55` : 'rgba(255,255,255,0.18)', transform: `translateX(${g(i + 5)}px)`}} />
					))}
				</>
			)}
			{/* lupa sobre o valor: os dígitos viram "?" */}
			{T >= W_DET && (
				<At x={lerp(1500, 1180, lens)} y={lerp(260, 470, lens)} style={{opacity: lens}}>
					<div style={{position: 'relative', width: 380, height: 380}}>
						<div style={{position: 'absolute', inset: 0, borderRadius: '50%', border: `16px solid ${C.gold}`, background: 'rgba(10,17,36,0.9)', boxShadow: `0 0 60px ${C.gold}66, inset 0 0 50px rgba(0,0,0,0.6)`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
							<div style={{transform: `scale(${qm})`}}>
								<Big size={230} color={C.gold} glow={C.gold}>
									?
								</Big>
							</div>
						</div>
						<div style={{position: 'absolute', left: 300, top: 300, width: 190, height: 44, borderRadius: 22, background: C.gold, transform: 'rotate(45deg)', transformOrigin: '0 50%'}} />
					</div>
				</At>
			)}
			{/* a conta */}
			<At x={960} y={790}>
				<Enter t={W_CONTA - 0.05} dir="up" dist={60} dur={0.4}>
					<Panel w={1220} h={130} glow={C.gold} pad={20} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26, background: 'rgba(8,12,26,0.92)'}}>
						<Icon name="eye" size={56} color="#fff" />
						<Label size={38} color="#fff" weight={800}>
							views
						</Label>
						<Big size={64} color={C.dim}>
							×
						</Big>
						<div style={{padding: '8px 22px', borderRadius: 999, border: `4px solid ${C.gold}`, boxShadow: `0 0 ${20 + 10 * Math.sin(T * 6)}px ${C.gold}`}}>
							<Label size={38} color={C.gold} weight={800}>
								R$ por 1.000
							</Label>
						</div>
						<Big size={64} color={C.dim}>
							=
						</Big>
						<Big size={72} color={C.gold}>
							?
						</Big>
					</Panel>
				</Enter>
			</At>
		</Cam>
	);
};

/* ------------------------------------------------------------------ */
/* c13 · 60,36–63,68 · "O assunto do seu canal influencia muito…"      */
/* ------------------------------------------------------------------ */
export const C13Assunto: React.FC = () => {
	const T = useT();
	const A = 60.36;
	const W_ASS = 60.72;
	const W_INF = 61.8;
	const W_MUITO = 62.48;
	const W_PAG = 63.02;
	const light = easeOutCubic(k(T, A, 0.5));
	const knob = -130 + 100 * easeOutBack(k(T, W_INF, 0.5), 1.4) + 90 * easeOutBack(k(T, W_MUITO, 0.45), 1.6);
	const needle = -80 + 60 * easeOutBack(k(T, W_INF + 0.1, 0.5), 1.6) + 85 * easeOutBack(k(T, W_MUITO + 0.05, 0.45), 1.8);
	const lit = T >= W_PAG;
	const zoom = 1.04 + 0.015 * (T - A);
	return (
		<>
			<Cam zoom={zoom} hits={[W_MUITO]} amp={6}>
				{/* linha de ligação com pulso */}
				<svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
					<path d="M 760 430 C 900 300, 1060 300, 1180 430" fill="none" stroke={`${C.cyan}44`} strokeWidth={8} strokeDasharray="14 16" strokeDashoffset={-T * 120} />
					{T >= W_INF && [0, 1].map((i) => {
						const p = ((T - W_INF) * 1.6 + i * 0.5) % 1;
						const x = lerp(760, 1180, p);
						const y = 430 - Math.sin(p * Math.PI) * 97;
						return <circle key={i} cx={x} cy={y} r={14} fill={C.cyan} style={{filter: `drop-shadow(0 0 12px ${C.cyan})`}} />;
					})}
				</svg>
				{/* botão giratório */}
				<At x={520} y={440}>
					<Enter t={W_ASS - 0.05} dir="pop" dur={0.4}>
						<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30}}>
							<div style={{width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle at 40% 35%, #2C3B68, #121A33)', border: `6px solid ${C.cyan}66`, boxShadow: `0 0 60px ${C.cyan}33, 0 20px 50px rgba(0,0,0,0.6)`, position: 'relative', transform: `rotate(${knob}deg)`}}>
								<div style={{position: 'absolute', left: '50%', top: 22, width: 22, height: 90, marginLeft: -11, borderRadius: 11, background: C.cyan, boxShadow: `0 0 20px ${C.cyan}`}} />
							</div>
							<Pill bg="rgba(56,214,255,0.16)" color={C.cyan} size={38} style={{border: `2px solid ${C.cyan}88`}}>
								<Icon name="search" size={40} color={C.cyan} /> ASSUNTO DO CANAL
							</Pill>
						</div>
					</Enter>
				</At>
				{/* medidor de pagamento */}
				<At x={1390} y={440}>
					<Enter t={W_ASS + 0.1} dir="pop" dur={0.4}>
						<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30}}>
							<div style={{width: 520, height: 300, position: 'relative'}}>
								<svg width={520} height={300} viewBox="0 0 520 300" style={{position: 'absolute', inset: 0}}>
									<path d="M 40 280 A 220 220 0 0 1 480 280" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={40} strokeLinecap="round" />
									<path d="M 40 280 A 220 220 0 0 1 480 280" fill="none" stroke={`url(#gaugeg)`} strokeWidth={40} strokeLinecap="round" strokeDasharray={`${((needle + 90) / 180) * 691} 691`} />
									<defs>
										<linearGradient id="gaugeg" x1="0" x2="1">
											<stop offset="0" stopColor={C.cyan} />
											<stop offset="1" stopColor={C.green} />
										</linearGradient>
									</defs>
								</svg>
								<div style={{position: 'absolute', left: 260 - 9, top: 80, width: 18, height: 200, borderRadius: 9, background: '#fff', transformOrigin: '50% 100%', transform: `rotate(${needle}deg)`, boxShadow: '0 0 20px rgba(255,255,255,0.6)'}} />
								<div style={{position: 'absolute', left: 260 - 56, top: 224, width: 112, height: 112, borderRadius: 56, background: lit ? C.green : '#22305A', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: lit ? `0 0 60px ${C.green}` : undefined, fontFamily: F.black, fontSize: 40, color: lit ? '#04210F' : C.dim}}>
									R$
								</div>
							</div>
							<Pill bg={lit ? C.green : 'rgba(255,255,255,0.08)'} color={lit ? '#04210F' : '#fff'} size={38} style={{marginTop: 50}}>
								<Icon name="dollar" size={40} color={lit ? '#04210F' : '#fff'} /> PAGAMENTO
							</Pill>
						</div>
					</Enter>
				</At>
				<Shock t={W_PAG} color={C.green} x={1390} y={500} size={600} />
			</Cam>
			{/* acender: sai do escuro com faixa de luz */}
			<Fill style={{background: '#000', opacity: 1 - light}} />
			{T < A + 0.8 && <Fill style={{background: `linear-gradient(100deg, transparent ${lerp(-30, 110, k(T, A, 0.8))}%, rgba(56,214,255,0.25) ${lerp(-20, 120, k(T, A, 0.8))}%, transparent ${lerp(-10, 130, k(T, A, 0.8))}%)`}} />}
		</>
	);
};

/* ------------------------------------------------------------------ */
/* c14 · 63,68–70,72 · Nichos (ilustrativo)                            */
/* ------------------------------------------------------------------ */
const NichePanel: React.FC<{title: string; color: string; level: number; meter: string; children: React.ReactNode}> = ({title, color, level, meter, children}) => {
	const T = useT();
	return (
		<Panel w={500} h={560} glow={color} style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
			<div style={{height: 230, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>{children}</div>
			<Big size={title.length > 10 ? 44 : 58} color="#fff">
				{title}
			</Big>
			<div style={{marginTop: 26, width: 400, height: 40, borderRadius: 20, background: 'rgba(255,255,255,0.08)', overflow: 'hidden'}}>
				<div style={{width: `${level * 100}%`, height: '100%', borderRadius: 20, background: `linear-gradient(90deg, ${color}88, ${color})`, boxShadow: `0 0 24px ${color}`}} />
			</div>
			<div style={{fontFamily: F.black, fontSize: 70, color, marginTop: 18, letterSpacing: '0.08em', transform: `scale(${breathe(T, 0.02, 4)})`}}>{meter}</div>
		</Panel>
	);
};

export const C14Nichos: React.FC = () => {
	const T = useT();
	const A = 63.68;
	const W_FIN = 64.52;
	const W_MAIS = 66.38;
	const W_MIL = 67.32;
	const W_ENT = 69.32;
	const W_HUM = 70.2;
	const spread = expoOut(k(T, W_ENT - 0.15, 0.55));
	const finX = lerp(960, 400, spread);
	const zoom = lerp(1.18, 1.0, spread) * (1 + 0.01 * (T - A));
	const finLevel = 0.15 + 0.8 * easeOutCubic(k(T, W_MAIS, 0.7));
	const tiltIn = (t: number) => (1 - expoOut(k(T, t - 0.05, 0.55))) * 75;
	return (
		<Cam zoom={zoom} ox={finX} oy={460} hits={[W_MAIS]} amp={6}>
			<At x={960} y={100}>
				<Enter t={W_MIL - 0.05} dir="down" dist={60} dur={0.35}>
					<Pill bg="rgba(255,200,61,0.16)" color={C.gold} size={36} style={{border: `2px solid ${C.gold}88`}}>
						<Icon name="eye" size={40} color={C.gold} /> por 1.000 visualizações
					</Pill>
				</Enter>
			</At>
			<At x={finX} y={470}>
				<div style={{transform: `perspective(1600px) rotateY(${tiltIn(W_FIN)}deg)`, opacity: clamp(k(T, W_FIN - 0.05, 0.2))}}>
					<NichePanel title="FINANÇAS" color={C.green} level={finLevel} meter={T >= W_MAIS ? '$$$' : '$'}>
						{/* velas + linha subindo */}
						<div style={{display: 'flex', alignItems: 'flex-end', gap: 14, height: 170}}>
							{[0.35, 0.5, 0.42, 0.66, 0.6, 0.85, 1].map((v, i) => (
								<div key={i} style={{width: 30, height: 170 * v * eb(T, W_FIN + 0.1 + i * 0.05, 0.35, 1.6), borderRadius: 6, background: i % 3 === 2 ? `${C.green}88` : C.green, position: 'relative'}}>
									<div style={{position: 'absolute', left: 13, top: -18, width: 4, height: 18, background: C.green}} />
								</div>
							))}
						</div>
						<div style={{position: 'absolute', right: 20, top: 20, transform: `rotate(${T * 90}deg)`}}>
							<Icon name="dollar" size={64} color={C.gold} />
						</div>
					</NichePanel>
				</div>
			</At>
			<At x={960} y={470}>
				{T >= W_ENT - 0.05 && (
					<div style={{transform: `perspective(1600px) rotateY(${tiltIn(W_ENT)}deg)`, opacity: clamp(k(T, W_ENT - 0.05, 0.2))}}>
						<NichePanel title="ENTRETENIMENTO" color={C.purple} level={0.3 * eo(T, W_ENT + 0.2, 0.5)} meter="$">
							<div style={{display: 'flex', alignItems: 'center', gap: 24}}>
								<Icon name="film" size={150} color={C.purple} />
								<Icon name="content" size={110} color="#fff" />
							</div>
						</NichePanel>
					</div>
				)}
			</At>
			<At x={1520} y={470}>
				{T >= W_HUM - 0.05 && (
					<div style={{transform: `perspective(1600px) rotateY(${tiltIn(W_HUM)}deg)`, opacity: clamp(k(T, W_HUM - 0.05, 0.2))}}>
						<NichePanel title="HUMOR" color={C.gold} level={0.3 * eo(T, W_HUM + 0.15, 0.4)} meter="$">
							<div style={{transform: `rotate(${Math.sin(T * 8) * 8}deg)`}}>
								<Icon name="laugh" size={170} color={C.gold} />
							</div>
						</NichePanel>
					</div>
				)}
			</At>
			<At x={960} y={815}>
				<Enter t={W_HUM + 0.1} dir="fade" dur={0.3}>
					<Illustrative />
				</Enter>
			</At>
		</Cam>
	);
};

