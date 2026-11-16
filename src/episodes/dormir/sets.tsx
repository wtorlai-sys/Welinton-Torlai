// Sets do episódio "Dormir no mesmo lugar". Móveis em metros reais, escalados por SET_SCALE
// para conversar com o personagem de 1,0 m (STYLE_GUIDE §10).
import React from 'react';
import * as THREE from 'three';
import {Bed, Bookshelf, Briefcase, Chair, Counter, Curtains, DoorPanel, Fridge, Grass, Ground, House, Nightstand, PictureFrame, Road, Room, Rug, Sign, Slippers, Table, Tree, Wardrobe} from '../../components/scenery';
import {makeWallpaperMaterial} from '../../style/materials';
import {PALETTE} from '../../style/constants';

/** Objetos do cotidiano em escala de personagem (1 m ≈ adulto). */
export const SET_SCALE = 0.6;
const S = SET_SCALE;
/** Topo do edredom (m, mundo) — onde personagens deitam/sentam na cama. */
export const BED_TOP = 0.6 * S;

/** Quarto: janela na parede esquerda (o sol/luar entra por ela). */
export const Bedroom: React.FC<{
	bed: {x: number; z: number; width?: number; duvet?: string; rot?: number; pillows?: 1 | 2};
	lampOn?: boolean;
	ceiling?: boolean;
	wallColor?: string;
	wardrobe?: boolean;
	dragMarks?: boolean;
	hideWalls?: ('back' | 'left' | 'right')[];
}> = ({bed, lampOn = false, ceiling = true, wallColor = '#E9DCC3', wardrobe = true, dragMarks = false, hideWalls = []}) => (
	<group scale={S}>
		<Room width={4.4} depth={4} height={2.6} wallColor={wallColor} windows={[{wall: 'left', at: -0.4, y: 0.95, w: 1.2, h: 1.15}]} doors={[{wall: 'right', at: 0.2}]} ceiling={ceiling} hideWalls={hideWalls} />
		{!hideWalls.includes('right') && <DoorPanel position={[2.2, 0, 0.2]} rotation={[0, -Math.PI / 2, 0]} />}
		<Bed position={[bed.x / S, 0, bed.z / S]} rotation={[0, bed.rot ?? 0, 0]} width={bed.width ?? 1.0} duvet={bed.duvet} pillows={bed.pillows ?? 1} />
		<Nightstand position={[bed.x / S - (bed.width ?? 1) / 2 - 0.4, 0, -1.7]} lampOn={lampOn} />
		{wardrobe && <Wardrobe position={[-1.45, 0, -1.68]} />}
		<Rug position={[0.4, 0, 0.9]} color="#C9A27A" />
		{dragMarks &&
			[-0.3, 0.3].map((dx) => (
				<mesh key={dx} rotation={[-Math.PI / 2, 0, 0.35]} position={[0.2 + dx, 0.004, -1.05]}>
					<planeGeometry args={[0.05, 1.3]} />
					<meshStandardMaterial color="#5A3B22" roughness={1} transparent opacity={0.55} />
				</mesh>
			))}
	</group>
);

/** Cozinha: bancada no fundo, geladeira, mesa com cadeiras, janela à esquerda. */
export const Kitchen: React.FC = () => (
	<group scale={S}>
		<Room width={4.4} depth={4} height={2.6} wallColor="#DCEBE3" floorColor="#C08A58" windows={[{wall: 'left', at: -0.2, y: 1.0, w: 1.2, h: 1.1}]} />
		<Counter position={[-0.5, 0, -1.68]} length={2.8} />
		<Fridge position={[1.55, 0, -1.62]} />
		<Table position={[0.1, 0, 0.1]} />
		<Chair position={[-0.85, 0, 0.1]} rotation={[0, Math.PI / 2, 0]} />
		<Chair position={[0.1, 0, -0.65]} />
	</group>
);

/** Frente da casa do Sr. Roberto + rua ao fundo. */
export const Street: React.FC = () => (
	<>
		<Ground roadHalfWidth={-100} />
		<group position={[0, 0, 6]} rotation={[0, Math.PI / 2, 0]}>
			<Road halfWidth={2.4} from={200} to={-200} />
		</group>
		<group scale={S} position={[0, 0, -3]}>
			<House w={7} d={6} doorOpen />
		</group>
		<Grass center={[0.5, 1.5]} radius={6} count={14000} height={0.08} roadHalf={0} roadX={-1000} exclude={[[-0.6, 0.6, -1.3, 4.0], [-50, 50, 3.4, 8.8]]} />
		{/* calçada até a rua */}
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 1.2]} receiveShadow>
			<planeGeometry args={[0.9, 4.6]} />
			<meshStandardMaterial color="#B9B2A6" roughness={0.9} />
		</mesh>
		<Tree position={[-3.6, 0, -0.6]} height={4.5} seed={21} />
		<Tree position={[5.5, 0, -6]} height={5.5} seed={4} />
	</>
);

export {Briefcase};

/** Placa de parede (gag). Texto curto, fonte grossa; `red` = índice da linha em vermelho (1 por cena). */
export const WallPlaque: React.FC<{lines: string[]; sizes?: number[]; red?: number; position: [number, number, number]; rotation?: [number, number, number]; width?: number; height?: number}> = ({
	lines,
	sizes,
	red,
	position,
	rotation = [0, 0, 0],
	width = 0.7,
	height = 0.4,
}) => (
	<Sign
		posts={0}
		elevation={0}
		width={width}
		height={height}
		position={position}
		rotation={rotation}
		lines={lines.map((t, i) => ({text: t, size: sizes?.[i] ?? 0.3, gap: 0.02, color: i === red ? PALETTE.accent : PALETTE.ink}))}
	/>
);

export const deg = THREE.MathUtils.degToRad;

/**
 * Quarto do casal (v2, para personagem 2D): janela no FUNDO, à direita da cama — o luar/sol entra
 * por trás e cruza o quadro. Papel de parede, estante, quadro, chinelos (densidade das referências).
 * Medidas em metros reais dentro do grupo escalado.
 */
export const BEDROOM2 = {
	bed: {x: -0.5, z: -1.0, width: 1.5},
	window: {at: 1.15, y: 0.95, w: 1.0, h: 1.15},
	nightstand: {x: 0.62, z: -1.7},
};

export const Bedroom2: React.FC<{duvet?: string; lampOn?: boolean; lumps?: {x: number; len?: number}[]; wallpaper?: [string, string]}> = ({
	duvet = '#4F6FA8',
	lampOn = true,
	lumps = [],
	wallpaper = ['#557A86', '#6A92A0'],
}) => {
	const b = BEDROOM2;
	return (
		<group scale={S}>
			<Room
				width={4.4}
				depth={4}
				height={2.6}
				wallMaterial={makeWallpaperMaterial(wallpaper[0], wallpaper[1])}
				windows={[{wall: 'back', at: b.window.at, y: b.window.y, w: b.window.w, h: b.window.h}]}
				doors={[{wall: 'left', at: 0.6}]}
			/>
			<Curtains position={[b.window.at, b.window.y - 0.2, -2.0]} w={b.window.w} h={b.window.h + 0.6} color="#A07A36" open={0.8} />
			<Bed position={[b.bed.x, 0, b.bed.z]} width={b.bed.width} duvet={duvet} pillows={2} folded={0} lumps={lumps} />
			<Nightstand position={[b.nightstand.x, 0, b.nightstand.z]} lampOn={lampOn} />
			<Bookshelf position={[-1.75, 0.95, -1.86]} w={0.8} h={1.1} seed={5} />
			<PictureFrame position={[-1.25, 1.75, -1.98]} />
			<Rug position={[-0.4, 0, 0.55]} w={1.8} d={1.0} color="#8E5A4A" />
			<Slippers position={[0.15, 0, -0.05]} color="#3A6FD8" />
			<Wardrobe position={[1.75, 0, -1.68]} color="#B9A07E" />
		</group>
	);
};
