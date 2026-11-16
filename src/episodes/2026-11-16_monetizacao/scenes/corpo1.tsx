// Corpo, parte 1 (c03–c08, 0:11–0:43) — plano aprovado em _CLAUDE/plano-cenas.md.
import React from 'react';
import {
	At, Big, Burst, C, Cam, CoinBurst, Enter, F, Icon, Label, Odometer, Panel, Pill, PlayLogo, Shock, SpeedLines, Stamp,
	breathe, clamp, count, easeOutBack, easeOutCubic, eb, eo, expoOut, fmt, k, lerp, punch, rampIn, useT,
} from '../../monetizacao/kit';
import {BrazilFlag, ChannelCard, RangeTrack, VideoThumb} from './pecas';

/** chegada "zoom-through": entra maior e desfocado, assenta (expo.out) */
const ZoomArrive: React.FC<{t: number; d?: number; children: React.ReactNode}> = ({t, d = 0.5, children}) => {
	const T = useT();
	const q = rampIn(T, t, d);
	return <div style={{position: 'absolute', inset: 0, transform: `scale(${1 + 0.6 * q})`, filter: q > 0.03 ? `blur(${q * 14}px)` : undefined, opacity: 1 - q * 0.6}}>{children}</div>;
};

/* ------------------------------------------------------------------ */
/* c03 · 10,98–16,32 · "Vou te mostrar quanto um canal recém-monetizado…" */
/* ------------------------------------------------------------------ */
export const C03Mostrar: React.FC = () => {
	const T = useT();
	const W_CANAL = 12.5;
	const W_MON = 13.24;
	const W_REC = 14.18;
	const W_MIL = 14.98;
	const on = easeOutCubic(k(T, W_MON, 0.25));
	const split = expoOut(k(T, W_REC - 0.05, 0.5));
	const zoom = 1 + 0.012 * (T - 10.98);
	return (
		<ZoomArrive t={10.98} d={0.55}>
			<Cam zoom={zoom} x={-10 * (T - 10.98)} hits={[W_MON]} amp={8}>
				<At x={lerp(980, 700, split)} y={400}>
					<Enter t={11.18} dir="pop" dur={0.45}>
						<ChannelCard on={on} pulse={clamp(1 - k(T, W_MON, 0.6))} />
					</Enter>
				</At>
				<Shock t={W_MON} color={C.green} x={lerp(980, 700, split) + 290} y={484} size={260} dur={0.45} />
				{/* carteira com R$ ??? */}
				<At x={1450} y={400}>
					<Enter t={W_REC - 0.05} dir="right" dist={240} dur={0.4}>
						<Panel w={540} h={330} glow={C.green} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22}}>
							<Label size={28} color={C.green}>
								Quanto recebe?
							</Label>
							<Odometer n={3} size={100} speed={18} seed={3} />
						</Panel>
					</Enter>
				</At>
				{/* por 1.000 visualizações */}
				<At x={1080} y={690}>
					<Enter t={W_MIL} dir="up" dist={80} dur={0.35}>
						<Pill bg="rgba(255,200,61,0.16)" color={C.gold} size={46} style={{border: `2px solid ${C.gold}88`}}>
							<Icon name="eye" size={52} color={C.gold} /> por 1.000 visualizações
						</Pill>
					</Enter>
				</At>
			</Cam>
		</ZoomArrive>
	);
};

/* ------------------------------------------------------------------ */
/* c04 · 16,32–21,91 · "Primeiro, uma coisa importante. O YouTube não paga um valor fixo…" */
/* ------------------------------------------------------------------ */
export const C04ValorFixo: React.FC = () => {
	const T = useT();
	const W_PRI = 16.52;
	const W_IMP = 17.66;
	const W_YT = 18.76;
	const W_VALOR = 20.1;
	const W_VIS = 21.06;
	const OUT1 = 18.3;
	const slide = expoOut(k(T, W_VALOR - 0.05, 0.5));
	const zoom = (1 + 0.015 * (T - 16.32)) * (1 + 0.08 * punch(T, W_VIS, 0.9));
	return (
		<Cam zoom={zoom} hits={[W_PRI, W_VIS]} amp={12}>
			{/* "PRIMEIRO" + alerta */}
			{T < OUT1 + 0.4 && (
				<At x={960} y={420}>
					<Enter t={W_PRI - 0.1} out={OUT1} outDir="up" dir="drop" dist={200} dur={0.4}>
						<div style={{display: 'flex', alignItems: 'center', gap: 50}}>
							<div style={{width: 230, height: 230, borderRadius: 60, background: `linear-gradient(135deg, ${C.cyan}, #1E7FB8)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 70px ${C.cyan}77`}}>
								<Big size={190} color="#fff">
									1
								</Big>
							</div>
							<div>
								<Big size={150} color="#fff">
									PRIMEIRO
								</Big>
								<div style={{display: 'flex', alignItems: 'center', gap: 20, marginTop: 18, opacity: clamp(k(T, W_IMP, 0.15))}}>
									<div style={{transform: `scale(${eb(T, W_IMP, 0.35, 2.4) * (1 + 0.1 * Math.max(0, Math.sin((T - W_IMP) * 9)))})`}}>
										<Icon name="alert" size={84} color={C.gold} />
									</div>
									<Label size={50} color={C.gold} weight={800}>
										importante
									</Label>
								</div>
							</div>
						</div>
					</Enter>
				</At>
			)}
			{/* painel de monetização (inspirado) */}
			<At x={lerp(960, 650, slide)} y={420}>
				<Enter t={18.46} dir="tilt" dist={140} dur={0.5}>
					<Panel w={960} h={560} glow={C.cyan}>
						<div style={{display: 'flex', alignItems: 'center', gap: 22}}>
							<PlayLogo size={86} glow={false} />
							<div>
								<Label size={24}>Painel do canal</Label>
								<div style={{fontFamily: F.black, fontSize: 42, color: '#fff'}}>Monetização</div>
							</div>
						</div>
						<Label size={26} style={{marginTop: 30}}>
							Receita por visualização
						</Label>
						{/* barras oscilando: o valor muda o tempo todo */}
						<div style={{position: 'absolute', left: 40, right: 40, bottom: 40, height: 270, display: 'flex', alignItems: 'flex-end', gap: 16}}>
							{Array.from({length: 14}).map((_, i) => {
								const grow = easeOutBack(clamp((T - W_YT - 0.15 - i * 0.04) / 0.35), 1.4);
								const v = 0.3 + 0.32 * (0.5 + 0.5 * Math.sin(T * 3.1 + i * 1.7)) + 0.3 * (0.5 + 0.5 * Math.sin(T * 1.3 + i * 0.6));
								return <div key={i} style={{flex: 1, height: `${v * 100 * grow}%`, borderRadius: '10px 10px 3px 3px', background: `linear-gradient(180deg, ${C.green}, ${C.greenDeep})`, boxShadow: `0 0 18px ${C.green}44`}} />;
							})}
						</div>
					</Panel>
				</Enter>
			</At>
			{/* etiqueta "valor fixo" + ✕ */}
			<At x={1430} y={420}>
				<Enter t={W_VALOR} dir="right" dist={220} dur={0.38}>
					<div style={{transform: `rotate(${-6 + Math.sin(T * 2) * 1.5}deg)`}}>
						<div style={{width: 470, padding: '40px 30px', borderRadius: 30, background: 'linear-gradient(135deg,#FFE08A,#FFC83D)', boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 50px ${C.gold}55`, textAlign: 'center', position: 'relative'}}>
							<div style={{position: 'absolute', left: 26, top: '50%', marginTop: -16, width: 32, height: 32, borderRadius: 16, background: C.bg1}} />
							<div style={{fontFamily: F.black, fontSize: 76, color: '#3A2A00', lineHeight: 1}}>VALOR FIXO</div>
							<div style={{fontFamily: F.ui, fontWeight: 800, fontSize: 34, color: '#6B5000', marginTop: 10}}>por visualização</div>
						</div>
					</div>
				</Enter>
			</At>
			<At x={1430} y={420}>
				<Stamp t={W_VIS} rot={8} from={2.6}>
					<Icon name="x" size={340} color={C.red} stroke={4.2} style={{filter: `drop-shadow(0 0 30px ${C.red})`}} />
				</Stamp>
			</At>
			<Shock t={W_VIS} color={C.red} x={1430} y={420} size={700} />
		</Cam>
	);
};

/* ------------------------------------------------------------------ */
/* c05 · 21,91–27,13 · filtros: vídeos tradicionais, público, Brasil     */
/* ------------------------------------------------------------------ */
export const C05Filtros: React.FC = () => {
	const T = useT();
	const A = 21.91;
	const W_IDEIA = 23.12;
	const CH = [23.88, 25.18, 26.42];
	const arrive = rampIn(T, A, 0.6); // whip para a esquerda: chega da direita
	const open = expoOut(k(T, W_IDEIA - 0.05, 0.5));
	const n = CH.filter((t) => T >= t).length;
	const zoom = 1.02 + 0.012 * (T - A);
	const chip = (i: number, icon: React.ReactNode, text: string) => (
		<div key={i} style={{transform: `scale(${eb(T, CH[i], 0.35, 1.9)})`, opacity: clamp(k(T, CH[i], 0.1))}}>
			<Pill bg="rgba(56,214,255,0.14)" color="#fff" size={40} style={{border: `2px solid ${C.cyan}88`}}>
				{icon}
				{text}
				<Icon name="check" size={36} color={C.green} />
			</Pill>
		</div>
	);
	return (
		<div style={{position: 'absolute', inset: 0, transform: `translateX(${560 * arrive}px)`, filter: arrive > 0.05 ? `blur(${arrive * 10}px)` : undefined}}>
			<Cam zoom={zoom} x={-12 * (T - A)} hits={CH} amp={5}>
				{/* lâmpada "para ter uma ideia" */}
				<At x={960} y={230}>
					<div style={{display: 'flex', alignItems: 'center', gap: 18, opacity: 0.35 + 0.65 * open}}>
						<div style={{filter: open > 0.5 ? `drop-shadow(0 0 ${30 * open}px ${C.gold})` : undefined}}>
							<Icon name="bulb" size={90} color={open > 0.5 ? C.gold : C.dim} />
						</div>
						<Big size={86} color="#fff">
							ESTIMATIVA
						</Big>
					</div>
				</At>
				{/* barra de filtros */}
				<At x={960} y={470}>
					<div style={{width: 300 + 1400 * open, height: 170, borderRadius: 85, background: 'rgba(14,22,44,0.92)', border: `2px solid ${C.cyan}55`, boxShadow: `0 30px 80px rgba(0,0,0,0.5), 0 0 60px ${C.cyan}22`, display: 'flex', alignItems: 'center', padding: '0 36px', gap: 26, boxSizing: 'border-box', overflow: 'hidden'}}>
						<Icon name="search" size={64} color={C.cyan} />
						<div style={{flex: 1, display: 'flex', justifyContent: 'center', gap: 22}}>
							{n >= 1 && chip(0, <Icon name="content" size={46} color={C.cyan} />, 'Vídeos tradicionais')}
							{n >= 2 && chip(1, <Icon name="users" size={46} color={C.cyan} />, 'Público')}
							{n >= 3 && chip(2, <BrazilFlag w={58} />, 'Brasil')}
						</div>
					</div>
				</At>
				{/* toast discreto no último filtro */}
				<At x={960} y={690}>
					<Enter t={CH[2] + 0.2} dir="up" dist={60} dur={0.35}>
						<Label size={30} color={C.dim}>
							filtros: tipo de vídeo · público · país
						</Label>
					</Enter>
				</At>
			</Cam>
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* c06 · 27,13–33,27 · R$ 1 a R$ 5 a cada 1.000 visualizações            */
/* ------------------------------------------------------------------ */
export const R1 = 30.22;
export const R5 = 30.64;
export const C06Faixa: React.FC = () => {
	const T = useT();
	const W_EST = 27.5;
	const W_MEN = 28.98;
	const W_ENTRE = 29.8;
	const W_MIL = 31.94;
	const views = count(T, W_MIL, W_MIL + 0.5, 0, 1000);
	const zoom = (1 + 0.012 * (T - 27.13)) * (1 + 0.1 * punch(T, R5, 1.0));
	return (
		<ZoomArrive t={27.13} d={0.55}>
			<Cam zoom={zoom} hits={[R1, R5]} amp={10}>
				<At x={960} y={150}>
					<div style={{display: 'flex', gap: 24}}>
						<Enter t={W_EST} dir="down" dist={80} dur={0.35}>
							<Pill bg="rgba(56,214,255,0.18)" color={C.cyan} size={36}>
								<Icon name="chart" size={40} color={C.cyan} /> ESTIMATIVA COMUM
							</Pill>
						</Enter>
						<Enter t={W_MEN} dir="down" dist={80} dur={0.35}>
							<Pill bg="rgba(255,255,255,0.1)" size={36}>
								<Icon name="user" size={36} color="#fff" /> CANAIS MENORES
							</Pill>
						</Enter>
					</div>
				</At>
				<At x={960} y={440}>
					<RangeTrack a="R$ 1" b="R$ 5" ta={R1} tb={R5} tTrack={W_ENTRE} />
				</At>
				<At x={960} y={710}>
					<Enter t={W_MIL - 0.05} dir="up" dist={90} dur={0.38}>
						<Panel w={760} h={150} glow={C.gold} pad={22} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26}}>
							<Icon name="eye" size={84} color={C.gold} />
							<Label size={30} color={C.gold}>
								a cada
							</Label>
							<div style={{fontFamily: F.black, fontSize: 88, color: '#fff', lineHeight: 1}}>{fmt(views)}</div>
							<Label size={30}>views</Label>
						</Panel>
					</Enter>
				</At>
				<Shock t={R1} color={C.green} x={290} y={440 - 60} size={480} />
				<Shock t={R5} color={C.green} x={1630} y={440 - 60} size={560} />
			</Cam>
		</ZoomArrive>
	);
};

/** HUD fixo da regra "R$ 1–5 / 1.000 views" (c07 até a virada) */
export const RegraHUD: React.FC = () => {
	const T = useT();
	if (T < 33.95 || T > 56.6) return null;
	const out = k(T, 56.22, 0.3);
	return (
		<div style={{position: 'absolute', left: 50, top: 44, opacity: (1 - out) * clamp(k(T, 33.95, 0.12)), transform: `translateX(${-out * 80}px)`}}>
			<Panel w={380} h={104} glow={C.green} pad={18} style={{display: 'flex', alignItems: 'center', gap: 16}}>
				<Icon name="coins" size={52} color={C.gold} />
				<div>
					<div style={{fontFamily: F.black, fontSize: 38, color: C.green, lineHeight: 1}}>R$ 1 – R$ 5</div>
					<Label size={20} style={{marginTop: 6}}>
						a cada 1.000 views
					</Label>
				</div>
			</Panel>
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* c07 · 33,27–40,20 · "Agora, imagina só! … um vídeo alcançar 10 mil"   */
/* ------------------------------------------------------------------ */
export const C07DezMil: React.FC = () => {
	const T = useT();
	const W_AGORA = 33.5;
	const W_IMAG = 33.92;
	const W_SO = 34.38;
	const W_CANAL = 35.32;
	const W_MON = 36.5;
	const W_VID = 37.56;
	const W_10 = 38.42;
	const W_MIL = 38.88;
	// faixa da c06 encolhe até o HUD no canto
	const shrink = expoOut(k(T, W_AGORA, 0.45));
	// recuo de câmera + pan até o vídeo
	const back = 1.12 - 0.12 * easeOutCubic(k(T, W_IMAG, 1.2));
	const pan = expoOut(k(T, W_VID - 0.3, 0.7));
	const zoom = back * (1 + 0.012 * (T - 33.27)) * (1 + 0.08 * punch(T, W_MIL, 0.9));
	const views = T < W_10 ? 1000 : count(T, W_10, W_MIL + 0.1, 1000, 10000);
	const done = T >= W_MIL + 0.1;
	return (
		<>
			{T < W_AGORA + 0.47 && (
				<div style={{position: 'absolute', left: lerp(960, 240, shrink), top: lerp(440, 96, shrink), transform: `translate(-50%,-50%) scale(${lerp(1, 0.22, shrink)})`, opacity: 1 - k(T, W_AGORA + 0.35, 0.12)}}>
					<RangeTrack a="R$ 1" b="R$ 5" ta={0} tb={0} tTrack={0} />
				</div>
			)}
			<Cam zoom={zoom} x={-460 * pan} hits={[W_SO, W_MIL]} amp={10}>
				{/* IMAGINA SÓ */}
				{T < 35.2 && (
					<At x={960} y={430}>
						<Enter t={W_IMAG - 0.05} out={34.9} dir="zoom" dur={0.35} blur>
							<div style={{display: 'flex', alignItems: 'baseline', gap: 36}}>
								<Big size={170} color="#fff" italic>
									IMAGINA
								</Big>
								<Stamp t={W_SO} rot={-6} from={2}>
									<Big size={190} color={C.gold} glow={C.gold} italic>
										SÓ!
									</Big>
								</Stamp>
							</div>
						</Enter>
					</At>
				)}
				<Burst t={W_SO} color={C.gold} x={1380} y={430} n={14} len={260} />
				{/* canal monetizado */}
				<At x={760} y={420}>
					<Enter t={W_CANAL - 0.08} dir="left" dist={260} dur={0.42}>
						<ChannelCard on={1} pulse={clamp(1 - k(T, W_MON, 0.7)) * (T >= W_MON ? 1 : 0)} />
					</Enter>
				</At>
				<Shock t={W_MON} color={C.green} x={1030} y={555} size={360} dur={0.5} />
				{/* vídeo que alcança 10 mil */}
				<At x={1540} y={400}>
					<Enter t={W_VID - 0.04} dir="drop" dist={160} dur={0.45}>
						<VideoThumb w={640} views={fmt(views)} viewsColor={done ? C.gold : '#fff'} />
					</Enter>
				</At>
				<At x={1540} y={110}>
					<Stamp t={W_MIL} rot={-5} from={2.2}>
						<Pill bg={C.gold} color="#2E2200" size={50}>
							10 MIL
						</Pill>
					</Stamp>
				</At>
				{/* pessoas enchendo */}
				<At x={1540} y={725}>
					<div style={{display: 'flex', gap: 12}}>
						{Array.from({length: 10}).map((_, i) => (
							<div key={i} style={{transform: `scale(${eb(T, W_MIL + i * 0.05, 0.3, 2)})`}}>
								<Icon name="user" size={58} color={i % 3 === 0 ? C.gold : C.cyan} />
							</div>
						))}
					</div>
				</At>
			</Cam>
		</>
	);
};

/* ------------------------------------------------------------------ */
/* c08 · 40,20–43,44 · "você pode receber entre R$ 10 e R$ 50"           */
/* ------------------------------------------------------------------ */
export const C08DezCinquenta: React.FC = () => {
	const T = useT();
	const W_VOCE = 40.4;
	const W_ENTRE = 41.24;
	const W_10 = 41.58;
	const W_50 = 42.16;
	// cartão gira: frente (vídeo) até 90°, verso (receita) de -90° a 0
	const flip = easeOutCubic(k(T, W_VOCE - 0.15, 0.55));
	const ang = flip * 180;
	const front = ang < 90;
	const zoom = (1 + 0.014 * (T - 40.2)) * (1 + 0.12 * punch(T, W_50, 1.0));
	return (
		<Cam zoom={zoom} hits={[W_10, W_50]} amp={12}>
			<At x={960} y={430}>
				<div style={{transform: `perspective(2000px) rotateY(${front ? ang : ang - 180}deg)`}}>
					{front ? (
						<VideoThumb w={760} views="10.000" viewsColor={C.gold} />
					) : (
						<Panel w={1560} h={560} glow={C.green} style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
							<div style={{display: 'flex', alignItems: 'center', gap: 18}}>
								<Icon name="dollar" size={56} color={C.green} />
								<Label size={34} color={C.green}>
									Receita com 10 mil visualizações
								</Label>
							</div>
							<div style={{marginTop: 40}}>
								<RangeTrack a="R$ 10" b="R$ 50" ta={W_10} tb={W_50} tTrack={W_ENTRE} w={1460} size={180} />
							</div>
						</Panel>
					)}
				</div>
			</At>
			<Shock t={W_50} color={C.green} x={1500} y={400} size={760} />
			<CoinBurst t={W_50} x={1560} y={660} n={10} power={0.8} seed={8} />
		</Cam>
	);
};
