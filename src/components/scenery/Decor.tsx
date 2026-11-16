// Detalhes de set (densidade de cenário — STYLE_GUIDE §5): estante com livros, cortinas,
// quadros, chinelos. Medidas em metros "reais" (o episódio escala o set).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBox} from '@react-three/drei';
import {makeFabricMaterial, makePlainMaterial, makeWoodMaterial} from '../../style/materials';
import {mulberry32} from '../../style/random';

type G = Omit<React.ComponentProps<'group'>, 'children'>;

const BOOK_COLORS = ['#2F6FDB', '#F2C230', '#2BA59B', '#7A4FD0', '#E8E8E8', '#3A3A44', '#C98A3A', '#5DA130'];

/** Estante de parede com 3 prateleiras cheias de livros (alturas/cores por seed). */
export const Bookshelf: React.FC<{w?: number; h?: number; seed?: number} & G> = ({w = 1.0, h = 1.2, seed = 3, ...g}) => {
	const books = useMemo(() => {
		const r = mulberry32(seed);
		const out: {x: number; y: number; w: number; h: number; c: string; tilt: number}[] = [];
		const shelves = 3;
		for (let s = 0; s < shelves; s++) {
			let x = -w / 2 + 0.04;
			const y0 = 0.04 + (s * (h - 0.06)) / shelves;
			const maxH = (h - 0.06) / shelves - 0.05;
			while (x < w / 2 - 0.08) {
				if (r() < 0.12) {
					x += 0.06 + r() * 0.08;
					continue;
				}
				const bw = 0.025 + r() * 0.03;
				const bh = maxH * (0.62 + r() * 0.36);
				const tilt = r() < 0.08 ? 0.25 : 0;
				out.push({x: x + bw / 2, y: y0 + bh / 2, w: bw, h: bh, c: BOOK_COLORS[Math.floor(r() * BOOK_COLORS.length)], tilt});
				x += bw + 0.004;
			}
		}
		return out;
	}, [w, h, seed]);
	const wood = makeWoodMaterial('#7A5236');
	return (
		<group {...g}>
			{[0, 1, 2, 3].map((s) => (
				<mesh key={s} position={[0, 0.02 + (s * (h - 0.06)) / 3, 0]} material={wood} castShadow receiveShadow>
					<boxGeometry args={[w, 0.03, 0.24]} />
				</mesh>
			))}
			{[-1, 1].map((sx) => (
				<mesh key={sx} position={[(sx * w) / 2, h / 2, 0]} material={wood} castShadow receiveShadow>
					<boxGeometry args={[0.03, h, 0.24]} />
				</mesh>
			))}
			{books.map((b, i) => (
				<mesh key={i} position={[b.x, b.y, 0.01]} rotation={[0, 0, b.tilt]} material={makePlainMaterial(b.c, 0.7)} castShadow receiveShadow>
					<boxGeometry args={[b.w, b.h, 0.17]} />
				</mesh>
			))}
		</group>
	);
};

/** Par de cortinas com dobras (onduladas) para emoldurar a janela. Origem = centro da janela, na parede. */
export const Curtains: React.FC<{w?: number; h?: number; color?: string; open?: number} & G> = ({w = 1.2, h = 1.6, color = '#8C3B4A', open = 0.75, ...g}) => {
	const geo = useMemo(() => {
		const pw = (w / 2) * (1.15 - open * 0.6);
		const geom = new THREE.PlaneGeometry(pw, h, 24, 1);
		const pos = geom.attributes.position as THREE.BufferAttribute;
		for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin((pos.getX(i) / pw) * Math.PI * 7) * 0.025);
		geom.computeVertexNormals();
		return {geom, pw};
	}, [w, h, open]);
	const m = makeFabricMaterial(color);
	return (
		<group {...g}>
			<mesh geometry={geo.geom} material={m} position={[-w / 2 - 0.08 + geo.pw / 2 - geo.pw * 0.3, h / 2 - 0.25, 0.08]} castShadow receiveShadow />
			<mesh geometry={geo.geom} material={m} position={[w / 2 + 0.08 - geo.pw / 2 + geo.pw * 0.3, h / 2 - 0.25, 0.08]} castShadow receiveShadow />
			<mesh position={[0, h - 0.22, 0.1]} rotation={[0, 0, Math.PI / 2]} material={makePlainMaterial('#3A2A1E', 0.4, 0.5)}>
				<cylinderGeometry args={[0.012, 0.012, w + 0.5, 8]} />
			</mesh>
		</group>
	);
};

/** Quadro na parede (moldura + "pintura" simples de montanhas). */
export const PictureFrame: React.FC<{w?: number; h?: number; sky?: string; hill?: string} & G> = ({w = 0.45, h = 0.34, sky = '#E9B872', hill = '#3E6B4A', ...g}) => (
	<group {...g}>
		<RoundedBox args={[w + 0.06, h + 0.06, 0.03]} radius={0.008} material={makeWoodMaterial('#5A3A24')} castShadow />
		<mesh position={[0, 0, 0.016]} material={makePlainMaterial(sky, 0.8)}>
			<planeGeometry args={[w, h]} />
		</mesh>
		<mesh position={[0, -h * 0.18, 0.017]} material={makePlainMaterial(hill, 0.8)}>
			<circleGeometry args={[w * 0.42, 24, 0, Math.PI]} />
		</mesh>
	</group>
);

/** Par de chinelos. */
export const Slippers: React.FC<{color?: string} & G> = ({color = '#2F6FDB', ...g}) => (
	<group {...g}>
		{[-0.07, 0.07].map((x, i) => (
			<group key={x} position={[x, 0, i * 0.04]} rotation={[0, i ? -0.15 : 0.1, 0]}>
				<RoundedBox args={[0.1, 0.03, 0.26]} radius={0.012} position={[0, 0.015, 0]} material={makeFabricMaterial(color)} castShadow receiveShadow />
				<RoundedBox args={[0.1, 0.05, 0.1]} radius={0.02} position={[0, 0.04, 0.06]} material={makeFabricMaterial(color)} castShadow />
			</group>
		))}
	</group>
);
