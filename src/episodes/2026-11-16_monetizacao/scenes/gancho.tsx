// Gancho (c01–c02) — plano aprovado em _CLAUDE/plano-cenas.md.
// Tempo global T (s) = frame/30; gatilhos no tempo exato da palavra (palavras.json).
import React from 'react';
import {
	At, Big, Bill, Burst, C, Cam, Enter, F, Flash, Icon, Label, LineChart, MoneyRain, Odometer, Panel, Pill, PlayLogo, Shock, SpeedLines, Stamp,
	breathe, clamp, count, easeOutBack, easeOutCubic, eb, eo, expoOut, fmt, k, lerp, punch, rampIn, rampOut, useT,
} from '../../monetizacao/kit';
import {Coins3D, Play3D} from '../../monetizacao/three';

/* ------------------------------------------------------------------ */
/* c01 · 0,00–9,01 · 1.000 views × menos de R$ 5, depois "muito mais"   */
/* ------------------------------------------------------------------ */
const W_MIL = 1.2; // "mil"
const W_VIS = 1.68; // "visualizações"
const W_YT = 2.66; // "YouTube"
const W_GANHAR = 3.54; // "ganhar"
const W_MENOS = 3.9; // "menos"
const W_R5 = 4.78; // "R$ 5"
const W_MAS = 5.88; // "mas"  → sub-momento B (chicote para cima, sem corte)
const W_GANHAR2 = 6.8; // "ganhar"
const W_MUITO = 7.2; // "muito"
const W_MAIS = 7.84; // "mais"

const HOOK_PTS = [0.06, 0.14, 0.1, 0.26, 0.22, 0.42, 0.38, 0.55, 0.5, 0.7, 0.66];
const UP_PTS = [0.04, 0.07, 0.06, 0.1, 0.09, 0.15, 0.2, 0.32, 0.5, 0.74, 1.0];

const PANEL = {x: 700, y: 450};
const REV = {x: 1470, y: 450};

/** A: painel + receita (0–5,9) */
const HookA: React.FC = () => {
	const T = useT();
	const slide = expoOut(k(T, W_GANHAR - 0.05, 0.5));
	const panelX = lerp(960, PANEL.x, slide);
	const views = count(T, W_MIL, W_VIS + 0.12, 0, 1000);
	const landed = T >= W_VIS + 0.12;
	const landPop = landed ? 1 + 0.12 * (1 - easeOutCubic(k(T, W_VIS + 0.12, 0.3))) : 1;
	// câmera: deriva linear + foco no cartão de receita em "menos" + punch no R$ 5
	const f = expoOut(k(T, W_MENOS - 0.05, 0.45));
	const zoom = (1 + 0.012 * T) * (1 + 0.2 * f) * (1 + 0.14 * punch(T, W_R5, 1.1));
	const camX = (960 - REV.x) * f;
	return (
		<Cam zoom={zoom} x={camX} hits={[W_MIL, W_YT, W_R5]} amp={14} ox={lerp(960, REV.x, f)} oy={REV.y}>
			{/* Painel do canal (inspirado, ilustrativo) */}
			<At x={panelX} y={PANEL.y}>
				<Enter t={W_MIL - 0.12} dir="zoom" dur={0.4} blur>
					<div style={{transform: `scale(${breathe(T, 0.008, 2)})`}}>
						<Panel w={920} h={620} glow={C.cyan}>
							<div style={{display: 'flex', alignItems: 'center', gap: 20}}>
								<div style={{width: 64, height: 64, borderRadius: 32, background: 'linear-gradient(135deg,#2B3A66,#1A2445)', border: `2px solid ${C.cyan}55`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
									<Icon name="user" size={38} color={C.dim} />
								</div>
								<div>
									<Label size={24} color={C.dim}>Painel do canal</Label>
									<div style={{fontFamily: F.black, fontSize: 38, color: '#fff'}}>Visão geral</div>
								</div>
							</div>
							<div style={{display: 'flex', alignItems: 'center', gap: 26, marginTop: 40}}>
								<Icon name="eye" size={92} color={landed ? C.gold : C.cyan} />
								<div>
									<Label size={28}>Visualizações</Label>
									<div
										style={{
											fontFamily: F.black,
											fontSize: 168,
											lineHeight: 1,
											color: landed ? C.gold : '#fff',
											transform: `scale(${landPop})`,
											transformOrigin: '0 60%',
											textShadow: `0 0 40px ${landed ? C.gold : C.cyan}66`,
										}}
									>
										{fmt(views)}
									</div>
								</div>
							</div>
							<div style={{position: 'absolute', left: 36, right: 36, bottom: 40}}>
								<LineChart w={848} h={170} pts={HOOK_PTS} p={eo(T, W_MIL, 1.6)} color={C.cyan} strokeW={7} />
							</div>
						</Panel>
					</div>
				</Enter>
			</At>

			{/* "YouTube": selo de play carimba no canto do painel */}
			<At x={panelX + 400} y={PANEL.y - 300}>
				<Stamp t={W_YT} rot={10} from={3}>
					<div style={{transform: `scale(${breathe(T, 0.03, 4)})`}}>
						<PlayLogo size={150} />
					</div>
				</Stamp>
			</At>
			<Shock t={W_YT} color={C.red} x={panelX + 400} y={PANEL.y - 300} size={420} dur={0.45} />

			{/* "ganhar": cartão de receita */}
			<At x={REV.x} y={REV.y}>
				<Enter t={W_GANHAR - 0.05} dir="right" dist={260} dur={0.38}>
					<Panel w={600} h={440} glow={C.green} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
						<Label size={28} color={C.green} style={{position: 'absolute', top: 30}}>
							Receita estimada
						</Label>
						{T < W_R5 ? (
							<div style={{fontFamily: F.black, fontSize: 120, color: '#fff', opacity: 0.55, marginTop: 70}}>R$ ?,??</div>
						) : (
							<div style={{transform: `scale(${1 + 0.7 * (1 - easeOutBack(k(T, W_R5, 0.3), 2.4))})`, marginTop: 96}}>
								<Big size={230} color={C.green} glow={C.green}>
									R$ 5
								</Big>
							</div>
						)}
						<div style={{position: 'absolute', top: 78}}>
							<Enter t={W_MENOS} dir="drop" dist={60} dur={0.3}>
								<Pill bg={C.red} size={34}>
									<Icon name="down" size={38} color="#fff" /> MENOS DE
								</Pill>
							</Enter>
						</div>
					</Panel>
				</Enter>
			</At>

			{/* dinheiro surge e se desfaz (muitas views, pouco dinheiro) */}
			{[0, 1, 2, 3, 4].map((i) => {
				const lt = T - (W_GANHAR + 0.05 + i * 0.09);
				if (lt < 0 || lt > 1.1) return null;
				const op = clamp(lt / 0.12) * clamp((1.1 - lt) / 0.55);
				return (
					<At
						key={i}
						x={REV.x - 230 + i * 115}
						y={REV.y - 250 - lt * 200}
						style={{opacity: op, transform: `translate(-50%,-50%) scale(${1 - lt * 0.45})`, filter: `blur(${Math.max(0, lt - 0.45) * 14}px)`}}
					>
						{i % 2 ? <Bill w={150} value="$" /> : <div style={{fontFamily: F.black, fontSize: 70, color: C.gold}}>R$</div>}
					</At>
				);
			})}
			<Shock t={W_R5} color={C.green} x={REV.x} y={REV.y + 40} size={900} />
			<Burst t={W_R5} color={C.green} x={REV.x} y={REV.y + 40} n={16} len={380} />
		</Cam>
	);
};

/** B: "mas também pode ganhar muito mais do que isso" (5,88–9,01) */
const HookB: React.FC = () => {
	const T = useT();
	const lead = rampIn(T, W_MAS, 0.55); // chega de cima freando
	const p = 0.3 * eo(T, W_MAS, 0.9) + 0.7 * expoOut(k(T, W_GANHAR2, 0.75));
	const textOn = T >= W_MUITO;
	const zoom = (1 + 0.02 * (T - W_MAS)) * (1 + 0.12 * punch(T, W_MAIS, 1.0));
	return (
		<Cam zoom={zoom} y={-560 * lead} hits={[W_GANHAR2, W_MAIS]} amp={16}>
			{/* gráfico disparando */}
			<At x={960} y={430}>
				<div style={{opacity: textOn ? lerp(1, 0.45, eo(T, W_MUITO, 0.3)) : 1}}>
					<LineChart w={1560} h={560} pts={UP_PTS} p={p} color={C.green} strokeW={12} />
				</div>
			</At>
			{/* odômetro de R$ girando (sem valor final) */}
			<At x={1340} y={175}>
				<Enter t={W_GANHAR2} dir="pop" dur={0.3}>
					<Panel w={580} h={160} glow={C.green} pad={22} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18}}>
						<Icon name="up" size={70} color={C.green} />
						<Odometer n={5} size={88} />
					</Panel>
				</Enter>
			</At>
			{T >= W_MAIS - 0.05 && <Coins3D t0={W_MAIS} n={30} seed={4} burst dur={1.2} />}
			{/* "MUITO MAIS" */}
			<At x={960} y={470}>
				<div style={{display: 'flex', gap: 50, alignItems: 'baseline'}}>
					<Stamp t={W_MUITO} rot={-4} from={1.8}>
						<Big size={230} color="#fff" stroke={10} italic>
							MUITO
						</Big>
					</Stamp>
					<Stamp t={W_MAIS} rot={-4} from={2.4}>
						<Big size={250} color={C.green} glow={C.green} stroke={10} italic>
							MAIS
						</Big>
					</Stamp>
				</div>
			</At>
			<Shock t={W_MAIS} color={C.green} x={1300} y={470} size={1100} />
			<MoneyRain t={W_MAIS + 0.05} dur={1.1} n={14} seed={7} speed={1.2} />
		</Cam>
	);
};

export const C01Gancho: React.FC = () => {
	const T = useT();
	// chicote para cima em "mas": A acelera para baixo (power4.in) e B chega de cima
	const out = rampOut(T, W_MAS - 0.24, 0.24);
	const lines = Math.max(out, rampIn(T, W_MAS, 0.5)) * (T > W_MAS - 0.24 ? 1 : 0) + (T >= W_MUITO ? 0.5 * clamp(1 - k(T, W_MAIS + 0.4, 0.8)) : 0);
	return (
		<>
			{/* frame 0: play 3D explode do centro e a câmera atravessa em "mil" */}
			{T < W_MIL + 0.1 && (
				<div style={{position: 'absolute', inset: 0, transform: `scale(${1 + 4 * Math.pow(k(T, W_MIL - 0.28, 0.36), 3)})`, opacity: 1 - k(T, W_MIL - 0.08, 0.16)}}>
					<Play3D t0={0} size={1.25} y={0.35} />
				</div>
			)}
			<Shock t={0.02} color={C.red} x={960} y={420} size={1000} dur={0.6} />
			<Burst t={0.02} color="#fff" x={960} y={420} n={18} len={520} />
			{T < W_MAS && (
				<div style={{position: 'absolute', inset: 0, transform: `translateY(${out * 700}px)`, filter: out > 0.05 ? `blur(${out * 8}px)` : undefined}}>
					<HookA />
				</div>
			)}
			{T >= W_MAS && (
				<div style={{position: 'absolute', inset: 0, filter: T < W_MAS + 0.25 ? `blur(${rampIn(T, W_MAS, 0.25) * 8}px)` : undefined}}>
					<HookB />
				</div>
			)}
			<SpeedLines amt={lines} color={C.green} seed={2} />
			<Flash t={W_R5} max={0.3} color={C.green} />
		</>
	);
};

/* ------------------------------------------------------------------ */
/* c02 · 9,01–10,98 · "E não, não é mentira"                           */
/* ------------------------------------------------------------------ */
const W_ENAO = 9.16;
const W_NAO2 = 9.9;
const W_MENTIRA = 10.38;

export const C02Mentira: React.FC = () => {
	const T = useT();
	// inclinação 3D que se endireita no carimbo
	const straight = easeOutCubic(k(T, W_MENTIRA, 0.35));
	const tiltY = lerp(-26 + 4 * (T - 9.01), 0, straight);
	const strike = easeOutCubic(k(T, W_NAO2, 0.28));
	const zoom = (1.05 + 0.03 * (T - 9.01)) * (1 + 0.08 * punch(T, W_MENTIRA, 0.7));
	return (
		<Cam zoom={zoom} hits={[W_MENTIRA]} amp={14}>
			<At x={940} y={430}>
				<div style={{transform: `perspective(1600px) rotateY(${tiltY}deg) rotateX(${6 * (1 - straight)}deg)`}}>
					<Enter t={W_ENAO - 0.12} dir="zoom" dur={0.35} blur>
						<div style={{position: 'relative'}}>
							<Big size={210} color={straight > 0.5 ? '#5E6B8E' : '#8C9AC0'}>
								MENTIRA?
							</Big>
							{/* risco dourado em "não" */}
							<div
								style={{
									position: 'absolute',
									left: -30,
									top: '52%',
									height: 30,
									width: `${strike * 112}%`,
									borderRadius: 15,
									background: `linear-gradient(90deg, ${C.gold}, #FFE08A)`,
									boxShadow: `0 0 30px ${C.gold}`,
									transform: 'rotate(-5deg)',
									transformOrigin: '0 50%',
								}}
							/>
						</div>
					</Enter>
				</div>
			</At>
			{/* selo VERDADE em "mentira" */}
			<At x={1400} y={570}>
				<Stamp t={W_MENTIRA} rot={-12} from={2.6}>
					<div
						style={{
							width: 360,
							height: 360,
							borderRadius: '50%',
							border: `14px solid ${C.green}`,
							background: 'rgba(11,143,75,0.28)',
							boxShadow: `0 0 70px ${C.green}88, inset 0 0 40px ${C.green}55`,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 6,
						}}
					>
						<Icon name="check" size={150} color={C.green} stroke={3.4} />
						<div style={{fontFamily: F.black, fontSize: 54, color: C.green, letterSpacing: '0.04em'}}>VERDADE</div>
					</div>
				</Stamp>
			</At>
			<Shock t={W_MENTIRA} color={C.green} x={1400} y={570} size={800} />
			<Flash t={W_MENTIRA} max={0.22} color={C.green} />
		</Cam>
	);
};
