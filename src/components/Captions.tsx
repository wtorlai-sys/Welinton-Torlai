// STYLE_GUIDE §8 — legenda palavra por vez, sincronizada com timestamps word-level.
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {activeWordIndex, parseTimestamps, Word} from '../lib/timestamps';
import {CAPTION_FONT, ensureFonts} from '../style/fonts';
import {REF, SAFE} from '../style/constants';
import {clamp, easeOutCubic} from '../style/easing';

export type CaptionsProps = {
	/** palavras já parseadas OU caminho em /public de um JSON (ElevenLabs/MiniMax) */
	words?: Word[];
	src?: string;
	/** posição vertical do CENTRO da legenda (fração da altura). Padrão 0.65. */
	captionY?: number;
	/** offset de tempo (s) — use quando a cena começa no meio da narração */
	offset?: number;
	fontSize?: number;
	/** palavras-chave que ganham a cor de destaque */
	highlight?: string[];
	highlightColor?: string;
};

/** Mantém a legenda dentro da área segura (8% topo / 12% base). */
const safeY = (y: number) => clamp(y, SAFE.top + 0.05, 1 - SAFE.bottom - 0.05);

export const Captions: React.FC<CaptionsProps> = ({words, src, captionY = REF.caption.y, offset = 0, fontSize = REF.caption.fontSize, highlight = [], highlightColor = '#FFD23F'}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const [loaded, setLoaded] = useState<Word[] | null>(words ?? null);
	const [handle] = useState(() => (words ? null : delayRender('Carregando timestamps')));

	useEffect(() => {
		ensureFonts();
	}, []);
	useEffect(() => {
		if (words || !src) return;
		fetch(staticFile(src))
			.then((r) => r.json())
			.then((j) => setLoaded(parseTimestamps(j)))
			.finally(() => handle !== null && continueRender(handle));
	}, [src, words, handle]);

	const list = words ?? loaded;
	if (!list) return null;
	const t = frame / fps + offset;
	const i = activeWordIndex(list, t);
	if (i < 0) return null;
	const w = list[i];
	const startFrame = Math.round((w.start - offset) * fps);
	// Pop-in 0.8 → 1.0 em 3 frames
	const k = clamp((frame - startFrame) / 3);
	const scale = 0.8 + 0.2 * easeOutCubic(k);
	const clean = w.text.replace(/[.,;:!?…"“”]/g, '').toLowerCase();
	const isHi = highlight.map((h) => h.toLowerCase()).includes(clean);
	// paint-order: stroke fill => metade do traço fica por fora: 2×9 px = contorno visível de 9 px
	const stroke = REF.caption.strokePx * 2;

	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div
				style={{
					position: 'absolute',
					left: 0,
					width: width * (1 - SAFE.right), // nunca invade os 10% da direita
					top: safeY(captionY) * height,
					transform: `translateY(-50%) scale(${scale})`,
					transformOrigin: '50% 50%',
					display: 'flex',
					justifyContent: 'center',
				}}
			>
				<span
					style={{
						fontFamily: `'${CAPTION_FONT}', 'Arial Black', sans-serif`,
						fontWeight: 900,
						fontSize,
						lineHeight: 1,
						letterSpacing: '0.01em',
						textTransform: 'uppercase',
						color: isHi ? highlightColor : '#FFFFFF',
						WebkitTextStroke: `${stroke}px #000`,
						paintOrder: 'stroke fill',
						textShadow: `0 ${REF.caption.shadowPx}px 0 rgba(0,0,0,0.85)`,
						whiteSpace: 'nowrap',
					}}
				>
					{w.text}
				</span>
			</div>
		</AbsoluteFill>
	);
};

/** Guia visual da área segura (só para QC; não usar no render final). */
export const SafeAreaGuides: React.FC = () => (
	<AbsoluteFill style={{pointerEvents: 'none'}}>
		<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: `${SAFE.top * 100}%`, background: 'rgba(255,0,255,0.25)', borderBottom: '3px dashed #f0f'}} />
		<div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: `${SAFE.bottom * 100}%`, background: 'rgba(255,0,255,0.25)', borderTop: '3px dashed #f0f'}} />
		<div style={{position: 'absolute', right: 0, top: 0, bottom: 0, width: `${SAFE.right * 100}%`, background: 'rgba(255,0,255,0.25)', borderLeft: '3px dashed #f0f'}} />
	</AbsoluteFill>
);
