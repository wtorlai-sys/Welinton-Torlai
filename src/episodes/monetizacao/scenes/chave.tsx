// Cenas-chave (prévia visual): gancho, faixa R$ 1–5, revelação do milhão, Shorts vs longos.
// Tempos = segundos globais da narração (public/timestamps/monetizacao.json).
import React from 'react';
import {
	At, Big, Bill, Burst, C, Cam, CoinBurst, Enter, F, Flash, Icon, Illustrative, Label, LineChart, Panel, Pill, PlayLogo, Progress, Shock, SpeedLines,
	breathe, clamp, count, easeOutBack, easeOutCubic, eb, eo, expoIn, fmt, k, useT,
} from '../kit';
import {hash1} from '../../../style/random';
import {Coins3D} from '../three';

/* ------------------------------------------------------------------ */
/* CENA 1 — GANCHO (0,00–5,80)                                         */
/* "Você pode conseguir mil visualizações no YouTube e ganhar menos de cinco reais!" */
/* ------------------------------------------------------------------ */
const HOOK_PTS = [0.05, 0.12, 0.1, 0.28, 0.24, 0.45, 0.52, 0.5, 0.74, 0.86, 0.97];

export const S1Gancho: React.FC = () => {
	const T = useT();
	const views = count(T, 1.2, 2.35, 0, 1000);
	// valor recebido: R$ ?,?? sobe devagar e trava abaixo de 5
	const slam = 4.78;
	const zoomIn = easeOutCubic(k(T, slam - 0.05, 0.35));
	// câmera: push-in contínuo + punch no valor (lado direito)
	const push = 1 + T * 0.018;
	const camX = -zoomIn * 150;
	const camZ = push + zoomIn * 0.12;
	return (
		<Cam zoom={camZ} x={camX} hits={[1.2, 2.66, slam]} amp={16} ox={1300} oy={480}>
			{/* Painel de analytics (esquerda) */}
			<At x={600} y={470}>
				<Enter t={-0.2} dir="tilt" dist={120} dur={0.5}>
					<Panel w={880} h={640} glow={C.cyan}>
						<div style={{display: 'flex', alignItems: 'center', gap: 22}}>
							<PlayLogo size={78} glow={false} />
							<div>
								<Label size={26} color={C.dim}>Painel do canal</Label>
								<div style={{fontFamily: F.black, fontSize: 40, color: '#fff'}}>Visão geral</div>
							</div>
							<div style={{marginLeft: 'auto'}}>
								<Pill bg="rgba(56,214,255,0.16)" color={C.cyan} size={24}>
									<div style={{width: 12, height: 12, borderRadius: 6, background: C.cyan, opacity: 0.5 + 0.5 * Math.sin(T * 8)}} />
									AO VIVO
								</Pill>
							</div>
						</div>
						<div style={{display: 'flex', alignItems: 'center', gap: 24, marginTop: 44}}>
							<Icon name="eye" size={84} color={C.cyan} />
							<div>
								<Label size={28}>Visualizações</Label>
								<div style={{fontFamily: F.black, fontSize: 150, color: '#fff', lineHeight: 1, transform: `scale(${1 + 0.08 * Math.max(0, 1 - k(T, 2.35, 0.3) * 1) * (T > 2.35 ? 1 : 0)})`, transformOrigin: '0 50%', textShadow: `0 0 40px ${C.cyan}66`}}>
									{fmt(views)}
								</div>
							</div>
						</div>
						<div style={{position: 'absolute', left: 34, right: 34, bottom: 40}}>
							<LineChart w={812} h={190} pts={HOOK_PTS} p={eo(T, 0.2, 2.4)} color={C.cyan} strokeW={7} />
						</div>
					</Panel>
				</Enter>
			</At>

			{/* Logo do YouTube (play) — surge no "YouTube" */}
			<At x={1360} y={200}>
				<Enter t={2.52} dir="spin" dur={0.5}>
					<div style={{transform: `scale(${breathe(T, 0.03, 4)})`}}>
						<PlayLogo size={190} />
					</div>
				</Enter>
			</At>

			{/* Receita: "ganhar" → card; "menos de" → seta para baixo; "cinco reais" → SLAM */}
			<At x={1360} y={540}>
				<Enter t={3.5} dir="right" dist={300} dur={0.4}>
					<Panel w={640} h={420} glow={C.green} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
						<Label size={28} color={C.green} style={{position: 'absolute', top: 30}}>Receita estimada</Label>
						{T < slam ? (
							<div style={{fontFamily: F.black, fontSize: 130, color: '#fff', opacity: 0.85}}>
								R$ <span style={{opacity: 0.6}}>{(Math.floor(T * 20) % 2 ? '?' : '¿').replace('¿', '?')},??</span>
							</div>
						) : (
							<div style={{transform: `scale(${1 + 0.6 * (1 - easeOutBack(k(T, slam, 0.32), 2.2))})`}}>
								<Big size={210} color={C.green} glow={C.green}>
									R$ 5
								</Big>
							</div>
						)}
						<Enter t={3.9} dir="pop" dur={0.35} style={{position: 'absolute', bottom: 34}}>
							<Pill bg={C.red} size={30}>
								<Icon name="down" size={34} color="#fff" /> MENOS DE
							</Pill>
						</Enter>
					</Panel>
				</Enter>
			</At>

			{/* Dinheiro surgindo e sumindo (contraste views x dinheiro) */}
			{[0, 1, 2, 3].map((i) => {
				const t0 = 3.6 + i * 0.22;
				const lt = T - t0;
				if (lt < 0 || lt > 1.2) return null;
				const op = clamp(lt / 0.15) * clamp((1.2 - lt) / 0.5);
				return (
					<At key={i} x={1120 + i * 160} y={830 - lt * 140} style={{opacity: op, transform: `translate(-50%,-50%) rotate(${-15 + i * 12}deg) scale(${1 - lt * 0.5})`, filter: `blur(${Math.max(0, lt - 0.6) * 10}px)`}}>
						<Bill w={170} value="$" />
					</At>
				);
			})}
			<Shock t={slam} color={C.green} x={1360} y={540} size={900} />
			<Burst t={slam} color={C.green} x={1360} y={540} n={16} len={360} />
			<Flash t={slam} max={0.35} color={C.green} />
		</Cam>
	);
};

/* ------------------------------------------------------------------ */
/* CENA 4 — PRIMEIRA ESTIMATIVA (26,95–33,35)                          */
/* "uma estimativa comum para canais menores fica entre um e cinco reais a cada mil visualizações" */
/* ------------------------------------------------------------------ */
export const S4Faixa: React.FC = () => {
	const T = useT();
	const r1 = 30.22;
	const r5 = 30.76;
	const fill = easeOutCubic(k(T, r1 + 0.1, 0.55));
	const viewsC = count(T, 31.7, 32.4, 0, 1000);
	const z = 1 + (T - 26.95) * 0.012 + 0.06 * easeOutCubic(k(T, r5, 0.4));
	return (
		<Cam zoom={z} hits={[r1, r5]} amp={12}>
			<At x={960} y={150}>
				<div style={{display: 'flex', gap: 24}}>
					<Enter t={27.06} dir="down" dist={80}>
						<Pill bg="rgba(56,214,255,0.18)" color={C.cyan} size={34}>
							<Icon name="chart" size={38} color={C.cyan} /> ESTIMATIVA COMUM
						</Pill>
					</Enter>
					<Enter t={28.66} dir="down" dist={80}>
						<Pill bg="rgba(255,255,255,0.1)" size={34}>
							<Icon name="user" size={36} color="#fff" /> CANAIS MENORES
						</Pill>
					</Enter>
				</div>
			</At>

			{/* trilho da faixa R$ 1 → R$ 5 */}
			<At x={960} y={470}>
				<Enter t={29.75} dir="zoom" dur={0.4}>
					<div style={{width: 1300, height: 300, position: 'relative'}}>
						<div style={{position: 'absolute', left: 140, right: 140, top: 210, height: 34, borderRadius: 17, background: 'rgba(255,255,255,0.08)'}}>
							<div style={{width: `${fill * 100}%`, height: '100%', borderRadius: 17, background: `linear-gradient(90deg, ${C.greenDeep}, ${C.green})`, boxShadow: `0 0 40px ${C.green}`}} />
							{[0, 1, 2, 3, 4].map((i) => (
								<div key={i} style={{position: 'absolute', left: `${i * 25}%`, top: -18, width: 4, height: 70, marginLeft: -2, background: 'rgba(255,255,255,0.25)', borderRadius: 2}} />
							))}
						</div>
						<div style={{position: 'absolute', left: 0, top: 0, width: 280, textAlign: 'center', transform: `scale(${eb(T, r1, 0.4, 2.2)})`}}>
							<Big size={170} color={C.green} glow={C.green}>R$ 1</Big>
						</div>
						<div style={{position: 'absolute', right: 0, top: 0, width: 280, textAlign: 'center', transform: `scale(${eb(T, r5, 0.4, 2.2)})`}}>
							<Big size={170} color={C.green} glow={C.green}>R$ 5</Big>
						</div>
					</div>
				</Enter>
			</At>

			{/* barras comparativas 1 x 5 */}
			<At x={480} y={720}>
				<Enter t={30.4} dir="left" dist={200}>
					<div style={{display: 'flex', alignItems: 'flex-end', gap: 26, height: 170}}>
						{[1, 2, 3, 4, 5].map((v, i) => (
							<div key={v} style={{width: 46, height: 170 * (v / 5) * easeOutBack(clamp((T - 30.45 - i * 0.07) / 0.35), 1.5), borderRadius: '10px 10px 3px 3px', background: `linear-gradient(180deg, ${C.green}, ${C.greenDeep})`, boxShadow: `0 0 20px ${C.green}55`}} />
						))}
					</div>
				</Enter>
			</At>

			{/* "a cada mil visualizações" */}
			<At x={1240} y={720}>
				<Enter t={31.6} dir="right" dist={220}>
					<Panel w={720} h={170} glow={C.gold} pad={26} style={{display: 'flex', alignItems: 'center', gap: 26}}>
						<Icon name="eye" size={90} color={C.gold} />
						<div>
							<Label size={26} color={C.gold}>a cada</Label>
							<div style={{fontFamily: F.black, fontSize: 84, color: '#fff', lineHeight: 1}}>{fmt(viewsC)} <span style={{fontSize: 44, color: C.dim}}>VIEWS</span></div>
						</div>
					</Panel>
				</Enter>
			</At>
			<Shock t={r1} color={C.green} x={240} y={420} size={500} />
			<Shock t={r5} color={C.green} x={1680} y={420} size={500} />
		</Cam>
	);
};

/* ------------------------------------------------------------------ */
/* CENA 7 — UM MILHÃO (48,40–55,65)                                    */
/* "E se o vídeo alcançar um milhão de visualizações? Você poderia ganhar entre mil e cinco mil reais." */
/* ------------------------------------------------------------------ */
export const S7Milhao: React.FC = () => {
	const T = useT();
	const hit = 50.34;
	const views = T < 49.3 ? 100000 : count(T, 49.3, hit, 100000, 1000000, expoIn);
	const r1 = 53.4;
	const r5 = 54.1;
	const reveal = T >= 52.1;
	// antecipação: escurece e aproxima devagar entre 51 e 53.3
	const tension = easeOutCubic(k(T, 51.0, 2.3));
	const z = 1 + (T - 48.4) * 0.02 + 0.18 * easeOutCubic(k(T, hit, 0.3)) * (1 - k(T, 51.6, 0.6)) + 0.08 * tension;
	const ring = clamp((views - 100000) / 900000);
	return (
		<>
			<Cam zoom={z} hits={[hit, r1, r5]} amp={26}>
				<SpeedLines amt={clamp(k(T, 49.3, 0.6)) * (1 - k(T, hit + 0.1, 0.5))} color={C.gold} />
				{/* Contador gigante + anel de progresso */}
				{!reveal || T < 52.4 ? (
					<At x={960} y={430} style={{opacity: 1 - k(T, 52.1, 0.3)}}>
						<Enter t={48.5} dir="zoom" dur={0.45}>
							<div style={{position: 'relative', width: 1100, height: 640, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
								<svg width={640} height={640} style={{position: 'absolute', left: 230, top: 0}}>
									<circle cx={320} cy={320} r={290} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={22} />
									<circle cx={320} cy={320} r={290} fill="none" stroke={C.gold} strokeWidth={22} strokeLinecap="round" strokeDasharray={`${ring * 1822} 2000`} transform="rotate(-90 320 320)" style={{filter: `drop-shadow(0 0 16px ${C.gold})`}} />
								</svg>
								<div style={{textAlign: 'center', position: 'relative'}}>
									<div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16}}>
										<Icon name="eye" size={64} color={C.gold} />
										<Label size={34} color={C.gold}>visualizações</Label>
									</div>
									<div style={{fontFamily: F.black, fontSize: 190, color: '#fff', lineHeight: 1.05, textShadow: `0 0 50px ${C.gold}88`, transform: `scale(${1 + 0.25 * (1 - easeOutBack(k(T, hit, 0.35), 2))})`}}>{fmt(views)}</div>
									<Enter t={51.0} dir="pop">
										<div style={{display: 'flex', justifyContent: 'center', marginTop: 10}}>
											<Icon name="question" size={110} color={C.gold} style={{transform: `rotate(${Math.sin(T * 6) * 8}deg)`}} />
										</div>
									</Enter>
								</div>
							</div>
						</Enter>
					</At>
				) : null}

				{/* Revelação */}
				{reveal && (
					<At x={960} y={440}>
						<div style={{textAlign: 'center'}}>
							<Enter t={52.18} dir="down" dist={60}>
								<Label size={40} color={C.dim} style={{marginBottom: 20}}>você poderia ganhar</Label>
							</Enter>
							<div style={{display: 'flex', alignItems: 'center', gap: 60, justifyContent: 'center'}}>
								{T < r1 ? (
									<Big size={150} color="#fff" style={{opacity: 0.7}}>R$ {'0123456789'[Math.floor(T * 30) % 10]}.{'7391'[Math.floor(T * 30) % 4]}00</Big>
								) : (
									<div style={{transform: `scale(${eb(T, r1, 0.35, 2.2)})`}}>
										<Big size={150} color={C.green} glow={C.green}>R$ 1.000</Big>
									</div>
								)}
								<Enter t={53.85} dir="pop">
									<Big size={90} color={C.dim}>a</Big>
								</Enter>
							</div>
							{T >= r5 - 0.4 && (
								<div style={{marginTop: 26, transform: `scale(${T < r5 ? 0.0001 : 1 + 0.9 * (1 - easeOutBack(k(T, r5, 0.4), 1.8))})`}}>
									<Big size={300} color={C.gold} glow={C.gold}>R$ 5.000</Big>
								</div>
							)}
						</div>
					</At>
				)}
				<Shock t={hit} color={C.gold} size={1400} y={430} />
				<Burst t={hit} color={C.gold} y={430} n={20} len={600} />
				<Shock t={r5} color={C.gold} size={1700} y={620} />
				<Burst t={r5} color={C.green} y={620} n={24} len={700} seed={4} />
				<CoinBurst t={r5} x={960} y={620} n={18} power={1.3} />
			</Cam>
			{T > r5 - 0.1 && <Coins3D t0={r5 - 0.1} burst n={22} seed={7} />}
			<Flash t={hit} max={0.6} />
			<Flash t={r5} max={0.8} color="#FFF4C8" />
			{/* vinheta de tensão */}
			<div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.85) 100%)', opacity: tension * (1 - k(T, r5, 0.2))}} />
		</>
	);
};

/* ------------------------------------------------------------------ */
/* CENA 10 — SHORTS VS VÍDEOS LONGOS (70,80–77,60)                     */
/* "E tem outra diferença enorme. Os Shorts geralmente pagam muito menos do que os vídeos tradicionais." */
/* ------------------------------------------------------------------ */
export const S10Shorts: React.FC = () => {
	const T = useT();
	const split = eo(T, 71.6, 0.5);
	const shortsViews = count(T, 73.6, 76.5, 0, 98000, (x) => x);
	const lowFill = easeOutCubic(k(T, 74.8, 0.6)) * 0.22;
	const highFill = easeOutCubic(k(T, 76.3, 0.7)) * 0.86;
	const z = 1 + (T - 70.8) * 0.01;
	const chartP = eo(T, 76.3, 1.2);
	return (
		<Cam zoom={z} hits={[71.66, 75.12]} amp={10}>
			<At x={960} y={120}>
				<Enter t={71.3} dir="down" dist={90}>
					<div style={{display: 'flex', alignItems: 'center', gap: 28}}>
						<Big size={72} color="#fff">SHORTS</Big>
						<div style={{fontFamily: F.black, fontSize: 56, color: C.gold, transform: `rotate(-8deg) scale(${breathe(T, 0.06, 6)})`, textShadow: `0 0 24px ${C.gold}`}}>VS</div>
						<Big size={72} color="#fff">VÍDEOS LONGOS</Big>
					</div>
				</Enter>
			</At>
			{/* divisor */}
			<div style={{position: 'absolute', left: 958, top: 210, width: 4, height: 640 * split, background: `linear-gradient(180deg, ${C.gold}, ${C.gold}00)`, boxShadow: `0 0 20px ${C.gold}`}} />

			{/* ESQUERDA: Shorts 9:16 */}
			<At x={480} y={520}>
				<Enter t={73.4} dir="left" dist={260}>
					<div style={{display: 'flex', alignItems: 'center', gap: 44}}>
						<div style={{width: 300, height: 533, borderRadius: 40, border: '6px solid #2A3558', background: 'linear-gradient(180deg, #1B2442, #0D1328)', position: 'relative', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.5)'}}>
							{/* conteúdo vertical rolando */}
							{[0, 1, 2].map((i) => {
								const yy = ((i * 533 - (T - 73.4) * 260) % 1599 + 1599) % 1599 - 533;
								return <div key={i} style={{position: 'absolute', left: 0, right: 0, top: yy, height: 533, background: [`linear-gradient(160deg, ${C.purple}, #1B2442)`, `linear-gradient(160deg, ${C.cyan}, #1B2442)`, `linear-gradient(160deg, ${C.gold}, #1B2442)`][i], opacity: 0.55}} />;
							})}
							<div style={{position: 'absolute', left: '50%', top: '42%', transform: 'translate(-50%,-50%)'}}>
								<PlayLogo size={110} />
							</div>
							<div style={{position: 'absolute', right: 16, bottom: 120, display: 'flex', flexDirection: 'column', gap: 22}}>
								<Icon name="like" size={42} />
								<Icon name="comment" size={42} />
							</div>
							<div style={{position: 'absolute', left: 18, bottom: 26, display: 'flex', alignItems: 'center', gap: 10}}>
								<Icon name="eye" size={34} color="#fff" />
								<span style={{fontFamily: F.black, fontSize: 34, color: '#fff'}}>{fmt(shortsViews)}</span>
							</div>
							<Label size={22} color="#fff" style={{position: 'absolute', left: 18, top: 18, opacity: 0.8}}>9:16</Label>
						</div>
						<div style={{width: 300}}>
							<Label size={30} color="#fff">Shorts</Label>
							<Label size={24} style={{marginTop: 6}}>receita</Label>
							<div style={{marginTop: 14}}><Progress w={280} p={lowFill} color={C.gold} h={30} /></div>
							<Enter t={74.74} dir="pop">
								<div style={{display: 'flex', alignItems: 'center', gap: 12, marginTop: 26}}>
									<Icon name="down" size={56} color={C.gold} />
									<span style={{fontFamily: F.black, fontSize: 64, color: C.gold}}>$</span>
								</div>
							</Enter>
						</div>
					</div>
				</Enter>
			</At>

			{/* DIREITA: vídeo tradicional 16:9 */}
			<At x={1440} y={520}>
				<Enter t={76.2} dir="right" dist={260}>
					<div style={{display: 'flex', flexDirection: 'column', gap: 30}}>
						<div style={{width: 640, height: 360, borderRadius: 26, border: '6px solid #2A3558', background: 'linear-gradient(160deg, #22305A, #0D1328)', position: 'relative', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.5)'}}>
							<div style={{position: 'absolute', left: 30, right: 30, top: 40}}>
								<LineChart w={580} h={200} pts={[0.1, 0.18, 0.3, 0.34, 0.5, 0.62, 0.7, 0.86, 0.95]} p={chartP} color={C.green} strokeW={7} />
							</div>
							<div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 10, background: 'rgba(255,255,255,0.15)'}}>
								<div style={{width: `${clamp((T - 76.2) / 3) * 100}%`, height: '100%', background: C.red}} />
							</div>
							<Label size={22} color="#fff" style={{position: 'absolute', left: 18, top: 14, opacity: 0.8}}>16:9</Label>
						</div>
						<div style={{display: 'flex', alignItems: 'center', gap: 30}}>
							<div>
								<Label size={30} color="#fff">Vídeo tradicional</Label>
								<div style={{marginTop: 14}}><Progress w={380} p={highFill} color={C.green} h={30} /></div>
							</div>
							<Enter t={76.56} dir="pop">
								<div style={{display: 'flex', alignItems: 'center', gap: 8}}>
									<Icon name="up" size={56} color={C.green} />
									<span style={{fontFamily: F.black, fontSize: 64, color: C.green}}>$$$</span>
								</div>
							</Enter>
						</div>
					</div>
				</Enter>
			</At>
			<At x={1560} y={850}>
				<Enter t={74.0} dir="fade">
					<Illustrative />
				</Enter>
			</At>
		</Cam>
	);
};

export const _unused = hash1;
