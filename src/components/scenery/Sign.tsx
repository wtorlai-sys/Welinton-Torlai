// STYLE_GUIDE §5 — placa-gag com texto de alto contraste e fonte grossa (legível em 0,5 s).
import React, {useEffect, useMemo, useState} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {continueRender, delayRender} from 'remotion';
import {CAPTION_FONT, ensureFonts} from '../../style/fonts';
import {PALETTE} from '../../style/constants';
import {makeMetalMaterial} from '../../style/materials';

export type SignLine = {text: string; size: number; color?: string; /** espaço depois (fração da altura) */ gap?: number};

export type SignProps = {
	lines: SignLine[];
	width?: number;
	height?: number;
	board?: string;
	border?: string;
	/** altura da base da placa em relação ao chão */
	elevation?: number;
	posts?: 1 | 2;
} & Omit<React.ComponentProps<'group'>, 'children'>;

const PX_PER_M = 900;

const drawSign = (ctx: CanvasRenderingContext2D, w: number, h: number, lines: SignLine[], board: string, border: string) => {
	ctx.fillStyle = board;
	ctx.fillRect(0, 0, w, h);
	const b = Math.round(h * 0.045);
	ctx.lineWidth = b;
	ctx.strokeStyle = border;
	const r = h * 0.06;
	ctx.beginPath();
	ctx.roundRect(b * 1.2, b * 1.2, w - b * 2.4, h - b * 2.4, r);
	ctx.stroke();
	const total = lines.reduce((s, l) => s + l.size + (l.gap ?? 0.03), 0);
	let y = (1 - total) / 2;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	lines.forEach((l) => {
		let px = l.size * h;
		ctx.font = `900 ${px}px '${CAPTION_FONT}'`;
		const maxW = w * 0.86;
		const mw = ctx.measureText(l.text).width;
		if (mw > maxW) {
			px *= maxW / mw;
			ctx.font = `900 ${px}px '${CAPTION_FONT}'`;
		}
		ctx.fillStyle = l.color ?? PALETTE.ink;
		ctx.fillText(l.text, w / 2, (y + l.size / 2) * h + px * 0.04);
		y += l.size + (l.gap ?? 0.03);
	});
};

export const Sign: React.FC<SignProps> = ({lines, width = 1.6, height = 1.0, board = '#F4F1E6', border = PALETTE.ink, elevation = 1.0, posts = 2, ...g}) => {
	const gl = useThree((s) => s.gl);
	const advance = useThree((s) => s.advance);
	const [ready, setReady] = useState(false);
	const [handle] = useState(() => delayRender('Desenhando placa'));
	const {texture, canvas} = useMemo(() => {
		const c = document.createElement('canvas');
		c.width = Math.round(width * PX_PER_M);
		c.height = Math.round(height * PX_PER_M);
		const t = new THREE.CanvasTexture(c);
		t.colorSpace = THREE.SRGBColorSpace;
		t.anisotropy = gl.capabilities.getMaxAnisotropy();
		t.generateMipmaps = true;
		t.minFilter = THREE.LinearMipmapLinearFilter;
		return {texture: t, canvas: c};
	}, [width, height, gl]);
	const key = JSON.stringify(lines) + board + border;
	useEffect(() => {
		let alive = true;
		ensureFonts().then(() => {
			if (!alive) return;
			drawSign(canvas.getContext('2d')!, canvas.width, canvas.height, lines, board, border);
			texture.needsUpdate = true;
			setReady(true);
		});
		return () => {
			alive = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key, canvas, texture]);
	useEffect(() => {
		if (!ready) return;
		// frameloop="never": a textura chegou depois do frame — redesenha antes de liberar o render
		advance(performance.now());
		requestAnimationFrame(() => continueRender(handle));
	}, [ready, handle, advance]);

	const faceMat = useMemo(
		() =>
			// emissivo leve com o próprio mapa: continua legível na sombra, sem estourar no bloom
			new THREE.MeshStandardMaterial({map: texture, roughness: 0.55, emissiveMap: texture, emissive: '#ffffff', emissiveIntensity: 0.18}),
		[texture],
	);
	const backMat = makeMetalMaterial('#8E959C');
	const postMat = makeMetalMaterial('#9AA1A8');
	const postX = posts === 2 ? [-width * 0.35, width * 0.35] : [0];
	const top = elevation + height;
	return (
		<group {...g}>
			{postX.map((x) => (
				<mesh key={x} position={[x, top / 2, -0.04]} material={postMat} castShadow receiveShadow>
					<cylinderGeometry args={[0.035, 0.035, top, 12]} />
				</mesh>
			))}
			<mesh position={[0, elevation + height / 2, 0]} material={backMat} castShadow receiveShadow>
				<boxGeometry args={[width + 0.04, height + 0.04, 0.03]} />
			</mesh>
			<mesh position={[0, elevation + height / 2, 0.0165]} material={faceMat} receiveShadow>
				<planeGeometry args={[width, height]} />
			</mesh>
		</group>
	);
};

/** Contador-gag "DAYS SINCE LAST …: N" — o número é o único vermelho (foco). */
export const DaysSinceSign: React.FC<Omit<SignProps, 'lines'> & {what?: string; days: number | string}> = ({what = 'CRASH', days, ...p}) => (
	<Sign
		width={1.5}
		height={1.15}
		{...p}
		lines={[
			{text: 'DAYS SINCE', size: 0.17, gap: 0.0},
			{text: `LAST ${what}:`, size: 0.17, gap: 0.02},
			{text: String(days), size: 0.46, color: PALETTE.accent, gap: 0},
		]}
	/>
);
