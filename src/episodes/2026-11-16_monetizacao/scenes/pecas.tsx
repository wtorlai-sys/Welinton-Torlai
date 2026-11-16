// Peças reaproveitadas entre cenas deste vídeo (canal, faixa de valores, vídeo, bandeira).
import React from 'react';
import {Big, C, F, Icon, Label, Panel, breathe, clamp, easeOutBack, easeOutCubic, eb, k, useT} from '../../monetizacao/kit';

/** Cartão do canal (genérico) com a chave "Monetização" (on = 0..1) */
export const ChannelCard: React.FC<{on: number; pulse?: number; w?: number}> = ({on, pulse = 0, w = 780}) => {
	const T = useT();
	const knob = easeOutBack(clamp(on), 1.6);
	return (
		<Panel w={w} h={330} glow={on > 0.5 ? C.green : C.cyan} style={{transform: `scale(${breathe(T, 0.008, 2)})`}}>
			<div style={{display: 'flex', alignItems: 'center', gap: 28}}>
				<div style={{width: 120, height: 120, borderRadius: 60, background: 'linear-gradient(135deg,#34477A,#1B2547)', border: `3px solid ${C.cyan}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
					<Icon name="user" size={70} color={C.dim} />
				</div>
				<div>
					<div style={{fontFamily: F.black, fontSize: 54, color: '#fff', lineHeight: 1.05}}>Seu canal</div>
					<div style={{display: 'flex', alignItems: 'center', gap: 12, marginTop: 10}}>
						<Icon name="users" size={36} color={C.dim} />
						<div style={{width: 200, height: 16, borderRadius: 8, background: 'rgba(255,255,255,0.14)'}} />
					</div>
				</div>
			</div>
			<div
				style={{
					marginTop: 34,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					padding: '18px 26px',
					borderRadius: 22,
					background: on > 0.5 ? 'rgba(34,224,122,0.12)' : 'rgba(255,255,255,0.05)',
					border: `2px solid ${on > 0.5 ? C.green : 'rgba(255,255,255,0.12)'}`,
					boxShadow: pulse > 0 ? `0 0 ${60 * pulse}px ${C.green}` : undefined,
				}}
			>
				<div style={{display: 'flex', alignItems: 'center', gap: 16}}>
					<Icon name="dollar" size={44} color={on > 0.5 ? C.green : C.dim} />
					<Label size={30} color={on > 0.5 ? '#fff' : C.dim}>
						Monetização
					</Label>
				</div>
				<div style={{width: 120, height: 60, borderRadius: 30, background: on > 0.5 ? C.green : '#2A3558', position: 'relative', transition: 'none'}}>
					<div style={{position: 'absolute', top: 6, left: 6 + knob * 60, width: 48, height: 48, borderRadius: 24, background: '#fff', boxShadow: '0 4px 10px rgba(0,0,0,0.4)'}} />
				</div>
			</div>
		</Panel>
	);
};

/** Faixa "R$ a — R$ b": pontas entram nos tempos ta/tb, trilho enche depois de tb */
export const RangeTrack: React.FC<{a: string; b: string; ta: number; tb: number; tTrack: number; w?: number; size?: number}> = ({a, b, ta, tb, tTrack, w = 1300, size = 170}) => {
	const T = useT();
	const ew = Math.round(size * 3);
	const track = easeOutCubic(k(T, tTrack, 0.35));
	const fill = easeOutCubic(k(T, tb + 0.05, 0.5));
	const end = (t: number) => eb(T, t, 0.4, 2.2);
	return (
		<div style={{width: w, height: size + 150, position: 'relative'}}>
			<div style={{position: 'absolute', left: ew / 2, right: ew / 2, top: size + 60, height: 34, borderRadius: 17, background: 'rgba(255,255,255,0.08)', transform: `scaleX(${track})`, transformOrigin: '0 50%'}}>
				<div style={{width: `${fill * 100}%`, height: '100%', borderRadius: 17, background: `linear-gradient(90deg, ${C.greenDeep}, ${C.green})`, boxShadow: `0 0 40px ${C.green}`}} />
				{[0, 1, 2, 3, 4].map((i) => (
					<div key={i} style={{position: 'absolute', left: `${i * 25}%`, top: -18, width: 4, height: 70, marginLeft: -2, background: 'rgba(255,255,255,0.25)', borderRadius: 2}} />
				))}
			</div>
			<div style={{position: 'absolute', left: 0, top: 0, width: ew, display: 'flex', justifyContent: 'center', transform: `scale(${end(ta)})`}}>
				<Big size={size} color={C.green} glow={C.green}>
					{a}
				</Big>
			</div>
			<div style={{position: 'absolute', right: 0, top: 0, width: ew, display: 'flex', justifyContent: 'center', transform: `scale(${end(tb)})`}}>
				<Big size={size} color={C.green} glow={C.green}>
					{b}
				</Big>
			</div>
		</div>
	);
};

/** Bandeira do Brasil desenhada no código (simplificada) */
export const BrazilFlag: React.FC<{w?: number}> = ({w = 60}) => (
	<svg width={w} height={w * 0.7} viewBox="0 0 20 14" style={{display: 'block', borderRadius: 3}}>
		<rect width="20" height="14" fill="#1FA34A" />
		<path d="M10 1.6 18.2 7 10 12.4 1.8 7z" fill="#FFD43B" />
		<circle cx="10" cy="7" r="3.1" fill="#1D3F9A" />
		<path d="M7.1 6.3q3-1 5.8.6" stroke="#fff" strokeWidth={0.6} fill="none" />
	</svg>
);

/** Miniatura de vídeo 16:9 genérica (frente do cartão) */
export const VideoThumb: React.FC<{w?: number; views: string; viewsColor?: string}> = ({w = 640, views, viewsColor = '#fff'}) => {
	const T = useT();
	const h = (w * 9) / 16;
	return (
		<div style={{width: w}}>
			<div style={{width: w, height: h, borderRadius: 26, overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg,#1C2B55 0%,#0E1733 60%,#18304F 100%)', border: `2px solid ${C.cyan}44`, boxShadow: '0 30px 70px rgba(0,0,0,0.55)'}}>
				{/* "cena" abstrata */}
				<div style={{position: 'absolute', left: -60 + Math.sin(T) * 20, top: h * 0.45, width: w * 0.7, height: w * 0.7, borderRadius: '50%', background: `radial-gradient(circle, ${C.purple}55, transparent 65%)`}} />
				<div style={{position: 'absolute', right: -40, top: -60 + Math.cos(T) * 15, width: w * 0.55, height: w * 0.55, borderRadius: '50%', background: `radial-gradient(circle, ${C.cyan}44, transparent 65%)`}} />
				<div style={{position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 120, height: 84, borderRadius: 24, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
					<Icon name="play" size={64} color="#fff" />
				</div>
				<div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 10, background: 'rgba(255,255,255,0.15)'}}>
					<div style={{width: `${((T * 7) % 100).toFixed(1)}%`, height: '100%', background: C.red}} />
				</div>
			</div>
			<div style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 22}}>
				<Icon name="eye" size={64} color={viewsColor} />
				<div style={{fontFamily: F.black, fontSize: 92, color: viewsColor, lineHeight: 1}}>{views}</div>
				<Label size={28} style={{marginLeft: 6}}>visualizações</Label>
			</div>
		</div>
	);
};
