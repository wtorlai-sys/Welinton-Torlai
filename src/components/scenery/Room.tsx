// Cômodo com piso de tábuas, paredes pintadas (com espessura, projetam sombra), teto,
// rodapé e janela recortada na parede — o sol entra pela janela (STYLE_GUIDE §4).
// Frente aberta (+Z) para a câmera. Medidas em metros "reais"; o episódio escala o set.
import React from 'react';
import * as THREE from 'three';
import {makeFloorMaterial, makePlainMaterial, makeWallMaterial, makeWoodMaterial} from '../../style/materials';

export type WallSide = 'back' | 'left' | 'right';
export type WindowSpec = {wall: WallSide; /** centro ao longo da parede */ at: number; y?: number; w?: number; h?: number};

export type RoomProps = {
	width?: number;
	depth?: number;
	height?: number;
	wallColor?: string;
	floorColor?: string;
	windows?: WindowSpec[];
	/** porta (abertura) — mesma notação da janela, y=0 */
	doors?: WindowSpec[];
	ceiling?: boolean;
	/** "parede removível" de set: esconde paredes que bloqueiam a câmera */
	hideWalls?: WallSide[];
	/** material das paredes (ex.: papel de parede) — substitui wallColor */
	wallMaterial?: THREE.Material;
} & Omit<React.ComponentProps<'group'>, 'children'>;

const T = 0.14; // espessura da parede

type Hole = {at: number; y: number; w: number; h: number; frame: boolean};

/** Parede ao longo de X local (comprimento L), com furos; origem no centro da base. */
const Wall: React.FC<{L: number; H: number; holes: Hole[]; color: string; material?: THREE.Material}> = ({L, H, holes, color, material}) => {
	const mat = material ?? makeWallMaterial(color);
	const pieces: [number, number, number, number][] = []; // x0,x1,y0,y1
	const sorted = [...holes].sort((a, b) => a.at - b.at);
	let cursor = -L / 2;
	sorted.forEach((h) => {
		const x0 = h.at - h.w / 2;
		const x1 = h.at + h.w / 2;
		if (x0 > cursor) pieces.push([cursor, x0, 0, H]);
		if (h.y > 0) pieces.push([x0, x1, 0, h.y]);
		if (h.y + h.h < H) pieces.push([x0, x1, h.y + h.h, H]);
		cursor = x1;
	});
	if (cursor < L / 2) pieces.push([cursor, L / 2, 0, H]);
	const frameMat = makePlainMaterial('#F4EFE6', 0.5);
	return (
		<group>
			{pieces.map(([x0, x1, y0, y1], i) => (
				<mesh key={i} position={[(x0 + x1) / 2, (y0 + y1) / 2, 0]} material={mat} castShadow receiveShadow>
					<boxGeometry args={[x1 - x0, y1 - y0, T]} />
				</mesh>
			))}
			{/* rodapé */}
			{pieces
				.filter((p) => p[2] === 0)
				.map(([x0, x1], i) => (
					<mesh key={`b${i}`} position={[(x0 + x1) / 2, 0.06, T / 2 + 0.01]} material={makeWoodMaterial('#6E4E33')} receiveShadow>
						<boxGeometry args={[x1 - x0, 0.12, 0.02]} />
					</mesh>
				))}
			{/* batentes + cruzeta da janela (projetam sombra no piso) */}
			{sorted
				.filter((h) => h.frame)
				.map((h, i) => (
					<group key={`f${i}`} position={[h.at, h.y, 0]}>
						{[
							[0, -0.04, h.w + 0.16, 0.08],
							[0, h.h + 0.04, h.w + 0.16, 0.08],
							[-h.w / 2 - 0.04, h.h / 2, 0.08, h.h],
							[h.w / 2 + 0.04, h.h / 2, 0.08, h.h],
							[0, h.h / 2, 0.05, h.h],
							[0, h.h * 0.55, h.w, 0.05],
						].map(([x, y, w, hh], k) => (
							<mesh key={k} position={[x, y, 0]} material={frameMat} castShadow receiveShadow>
								<boxGeometry args={[w, hh, T + 0.03]} />
							</mesh>
						))}
					</group>
				))}
		</group>
	);
};

export const Room: React.FC<RoomProps> = ({
	width = 4.4,
	depth = 4,
	height = 2.6,
	wallColor = '#E9DCC3',
	floorColor = '#C2814A',
	windows = [],
	doors = [],
	ceiling = true,
	hideWalls = [],
	wallMaterial,
	...g
}) => {
	const show = (w: WallSide) => !hideWalls.includes(w);
	const holesFor = (side: WallSide): Hole[] => [
		...windows.filter((w) => w.wall === side).map((w) => ({at: w.at, y: w.y ?? 0.9, w: w.w ?? 1.1, h: w.h ?? 1.2, frame: true})),
		...doors.filter((d) => d.wall === side).map((d) => ({at: d.at, y: 0, w: d.w ?? 0.9, h: d.h ?? 2.05, frame: false})),
	];
	return (
		<group {...g}>
			{/* piso continua à frente (onde fica a câmera) para nunca aparecer o vazio */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 2.5]} receiveShadow material={makeFloorMaterial(floorColor)}>
				<planeGeometry args={[width + 2 * T, depth + 5]} />
			</mesh>
			{ceiling && (
				<mesh position={[0, height + 0.07, 0]} material={makeWallMaterial('#FAF7F2')} castShadow receiveShadow>
					<boxGeometry args={[width + 2 * T, 0.14, depth + T]} />
				</mesh>
			)}
			{show('back') && <group position={[0, 0, -depth / 2 - T / 2]}>
				<Wall L={width + 2 * T} H={height} holes={holesFor('back')} color={wallColor} material={wallMaterial} />
			</group>}
			{show('left') && <group position={[-width / 2 - T / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
				<Wall L={depth} H={height} holes={holesFor('left').map((h) => ({...h, at: -h.at}))} color={wallColor} material={wallMaterial} />
			</group>}
			{show('right') && <group position={[width / 2 + T / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
				<Wall L={depth} H={height} holes={holesFor('right')} color={wallColor} material={wallMaterial} />
			</group>}
		</group>
	);
};
