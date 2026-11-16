// Legendas em blocos de 2–3 palavras (perfil "canal"): palavra entra quando é dita,
// palavra ativa destacada, valores em R$ verdes e maiores, números de views dourados.
import React, {useEffect, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {ensureFonts} from '../../style/fonts';
import {C, F, W, clamp, easeOutBack, useT} from './kit';

export type CapWord = {text: string; start: number; end: number};
export type CapChunk = {start: number; end: number; words: CapWord[]};

let uiFont: Promise<void> | null = null;
export const ensureEpisodeFonts = () => {
	ensureFonts();
	if (!uiFont) {
		const h = delayRender('Montserrat UI');
		uiFont = Promise.all(
			['600', '700', '800'].map((w) => loadFont({family: 'Montserrat UI', url: staticFile(`fonts/Montserrat-${w}.woff2`), weight: w})),
		)
			.then(() => continueRender(h))
			.catch((e) => {
				console.error(e);
				continueRender(h);
			});
	}
	return uiFont;
};

const VIEWS = /^(1\.000|\d+ mil|1 milhão)$/i;
const KEY = new Set(
	'mentira fixo tradicionais brasileiro estimativa monetizado monetizar recém-monetizado calma detalhe completamente finanças entretenimento humor shorts menos mais muito importante especial público conteúdo anúncios receita interessante enorme comenta internet'.split(' '),
);

const styleFor = (raw: string) => {
	const t = raw.replace(/[?!.,]/g, '');
	if (t.startsWith('R$')) return {color: C.green, scale: 1.28};
	if (VIEWS.test(t)) return {color: C.gold, scale: 1.2};
	if (t.toLowerCase() === 'youtube') return {color: C.red, scale: 1.1};
	if (KEY.has(t.toLowerCase())) return {color: C.gold, scale: 1.05};
	return {color: '#FFFFFF', scale: 1};
};

export const Legendas: React.FC<{src: string; y?: number | ((T: number) => number); size?: number; cx?: (T: number) => number}> = ({src, y = 905, size = 66, cx}) => {
	const T = useT();
	const [data, setData] = useState<CapChunk[] | null>(null);
	const [handle] = useState(() => delayRender('Legendas'));
	useEffect(() => {
		ensureEpisodeFonts();
		fetch(staticFile(src))
			.then((r) => r.json())
			.then((j) => setData(j))
			.finally(() => continueRender(handle));
	}, [src, handle]);
	if (!data) return null;
	let ci = -1;
	for (let i = 0; i < data.length; i++) if (data[i].start <= T) ci = i;
	if (ci < 0) return null;
	const ch = data[ci];
	const next = data[ci + 1];
	const until = next ? Math.min(next.start, ch.end + 0.9) : ch.end + 0.9;
	if (T > until) return null;
	const yy = typeof y === 'function' ? y(T) : y;
	const out = clamp((until - T) / 0.08);
	return (
		<div style={{position: 'absolute', left: (cx ? cx(T) : W / 2) - W / 2, width: W, top: yy, transform: 'translateY(-50%)', display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: size * 0.5, opacity: out, pointerEvents: 'none'}}>
			{ch.words.map((w, i) => {
				if (T < w.start - 0.02) return null;
				const p = easeOutBack(clamp((T - w.start) / 0.12), 2);
				const active = T >= w.start && (i === ch.words.length - 1 || T < ch.words[i + 1].start);
				const st = styleFor(w.text);
				const hi = st.color !== '#FFFFFF';
				return (
					<span
						key={i}
						style={{
							display: 'inline-block',
							fontFamily: F.black,
							fontSize: size * st.scale,
							lineHeight: 1,
							textTransform: 'uppercase',
							color: hi ? st.color : active ? '#FFFFFF' : '#E6EBFF',
							WebkitTextStroke: `${16}px #000`,
							paintOrder: 'stroke fill',
							textShadow: `0 5px 0 rgba(0,0,0,0.85)${hi && active ? `, 0 0 30px ${st.color}88` : ''}`,
							transform: `scale(${(0.8 + 0.2 * p) * (active ? 1.06 : 1)}) translateY(${(1 - p) * 14}px)`,
							opacity: clamp(p * 2),
							whiteSpace: 'nowrap',
						}}
					>
						{w.text}
					</span>
				);
			})}
		</div>
	);
};
