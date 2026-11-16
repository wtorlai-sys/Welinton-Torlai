// Sets do episódio "Dormir no mesmo lugar". Móveis em metros reais, escalados por SET_SCALE
// para conversar com o personagem de 1,0 m (STYLE_GUIDE §10).
import React from 'react';
import * as THREE from 'three';
import {ContactShadows} from '@react-three/drei';
import {Bed, Bookshelf, Inked, Briefcase, Chair, Counter, Curtains, DoorPanel, Fridge, Grass, Ground, House, Nightstand, PictureFrame, Road, Room, Rug, Sign, Slippers, Table, Tree, Wardrobe} from '../../components/scenery';
import {makeTileMaterial, makeWallpaperMaterial} from '../../style/materials';
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

export type Bedroom2Props = {
	duvet?: string;
	lampOn?: boolean;
	lumps?: {x: number; len?: number}[];
	wallpaper?: [string, string];
	bedWidth?: number;
	/** desloca/gira a cama (mãe mudando os móveis) — metros reais e radianos */
	bedOffset?: [number, number];
	bedRot?: number;
	dragMarks?: boolean;
	ceiling?: boolean;
	curtain?: string;
	rug?: string;
	folded?: number;
};

export const Bedroom2: React.FC<Bedroom2Props> = ({
	duvet = '#3A6FD8',
	lampOn = true,
	lumps = [],
	wallpaper = ['#2F7F8F', '#3D97A8'],
	bedWidth = 1.5,
	bedOffset = [0, 0],
	bedRot = 0,
	dragMarks = false,
	ceiling = true,
	curtain = '#E0A93B',
	rug = '#E07A3A',
	folded = 0,
}) => {
	const b = BEDROOM2;
	return (
		<>
		<RoomAO />
		<group scale={S}>
			<Inked>
			<Room
				width={4.4}
				depth={4}
				height={2.6}
				ceiling={ceiling}
				wallMaterial={makeWallpaperMaterial(wallpaper[0], wallpaper[1])}
				windows={[{wall: 'back', at: b.window.at, y: b.window.y, w: b.window.w, h: b.window.h}]}
				doors={[{wall: 'left', at: 0.6}]}
			/>
			<Curtains position={[b.window.at, b.window.y - 0.2, -2.0]} w={b.window.w} h={b.window.h + 0.6} color={curtain} open={0.8} />
			<Bed position={[b.bed.x + bedOffset[0], 0, b.bed.z + bedOffset[1]]} rotation={[0, bedRot, 0]} width={bedWidth} duvet={duvet} pillows={bedWidth > 1.2 ? 2 : 1} folded={folded} lumps={lumps} />
			<Nightstand position={[b.nightstand.x, 0, b.nightstand.z]} lampOn={lampOn} />
			<Bookshelf position={[-1.75, 0.95, -1.86]} w={0.8} h={1.1} seed={5} />
			<PictureFrame position={[-1.25, 1.75, -1.98]} />
			<Rug position={[-0.4, 0, 0.55]} w={1.8} d={1.0} color={rug} />
			<Slippers position={[0.15, 0, -0.05]} color="#3A6FD8" />
			<Wardrobe position={[1.75, 0, -1.68]} color="#F2C230" />
			{dragMarks &&
				[-0.35, 0.35].map((dx) => (
					<mesh key={dx} rotation={[-Math.PI / 2, 0, bedRot * 0.5]} position={[b.bed.x + bedOffset[0] * 0.5 + dx, 0.004, b.bed.z + 0.2]}>
						<planeGeometry args={[0.05, 1.6]} />
						<meshStandardMaterial color="#4A2F1C" roughness={1} transparent opacity={0.5} />
					</mesh>
				))}
			</Inked>
		</group>
		</>
	);
};

/** Cozinha detalhada: azulejo, bancada, armários, geladeira, mesa, fruteira, panelas, janela lateral. */
export const Kitchen2: React.FC = () => (
	<>
	<RoomAO />
	<group scale={S}>
		<Inked>
		<Room width={4.4} depth={4} height={2.6} wallMaterial={makeTileMaterial('#F4EEDC', '#B7AE9C', 0.16)} floorColor="#B98656" windows={[{wall: 'back', at: -1.2, y: 1.15, w: 0.9, h: 0.75}]} doors={[{wall: 'right', at: 0.4}]} />
		<Curtains position={[-1.2, 0.95, -2.0]} w={0.9} h={1.2} color="#2BA59B" open={0.85} />
		<Counter position={[-0.6, 0, -1.68]} length={2.6} color="#3A6FD8" />
		{/* fogão + panela + chaleira */}
		<mesh position={[0.25, 0.92, -1.68]} castShadow>
			<boxGeometry args={[0.6, 0.02, 0.55]} />
			<meshStandardMaterial color="#2B2B30" roughness={0.4} metalness={0.4} />
		</mesh>
		<mesh position={[0.1, 1.0, -1.65]} castShadow>
			<cylinderGeometry args={[0.13, 0.12, 0.14, 20]} />
			<meshStandardMaterial color="#C9CED3" roughness={0.25} metalness={0.8} />
		</mesh>
		<mesh position={[0.4, 1.0, -1.72]} castShadow>
			<sphereGeometry args={[0.1, 18, 12]} />
			<meshStandardMaterial color="#F2C230" roughness={0.35} />
		</mesh>
		<Fridge position={[1.55, 0, -1.62]} />
		<Wardrobe position={[-1.9, 0, -1.65]} color="#F27BB0" />
		<Table position={[0.1, 0, 0.1]} />
		{/* fruteira + xícaras na mesa */}
		<mesh position={[0.3, 0.8, 0.1]} castShadow>
			<sphereGeometry args={[0.14, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
			<meshStandardMaterial color="#C98A3A" roughness={0.6} side={2} />
		</mesh>
		{[[0.25, '#F2C230'], [0.35, '#5DA130'], [0.3, '#F29A30']].map(([x, col], i) => (
			<mesh key={i} position={[x as number, 0.84, 0.08 + i * 0.03]} castShadow>
				<sphereGeometry args={[0.05, 14, 10]} />
				<meshStandardMaterial color={col as string} roughness={0.5} />
			</mesh>
		))}
		<mesh position={[-0.25, 0.81, 0.25]} castShadow>
			<cylinderGeometry args={[0.04, 0.035, 0.08, 16]} />
			<meshStandardMaterial color="#F4F0E8" roughness={0.4} />
		</mesh>
		<Chair position={[-0.85, 0, 0.1]} rotation={[0, Math.PI / 2, 0]} />
		<Chair position={[0.1, 0, -0.65]} />
		<PictureFrame position={[0.9, 1.75, -1.98]} sky="#9FD8CB" hill="#3A6FD8" />
		</Inked>
	</group>
	</>
);

/**
 * Sombra de contato do cômodo inteiro (escurece o piso sob móveis — dá peso/profundidade).
 * Fica acima das sombras-blob dos personagens (y=0.006) para não capturá-las.
 */
export const RoomAO: React.FC = () => <ContactShadows position={[0, 0.0095, 0]} scale={[2.8, 2.6]} resolution={1024} blur={2.2} far={0.5} opacity={0.7} color="#1A1020" frames={1} />;

/** Rua do Sr. Roberto com mais detalhe: cerca, arbustos, caixa de correio, poste. */
export const Street2: React.FC = () => (
	<>
		<Street />
		{/* cerca de madeira no limite do jardim */}
		<group>
			{Array.from({length: 18}, (_, i) => -4.2 + i * 0.3)
				.filter((x) => Math.abs(x) > 0.55)
				.map((x) => (
					<mesh key={x} position={[x, 0.22, 3.2]} castShadow receiveShadow>
						<boxGeometry args={[0.07, 0.44, 0.04]} />
						<meshStandardMaterial color="#F2EEE4" roughness={0.7} />
					</mesh>
				))}
			{[-1, 1].map((sd) => (
				<mesh key={sd} position={[sd * 2.4, 0.3, 3.2]} castShadow>
					<boxGeometry args={[3.7, 0.05, 0.03]} />
					<meshStandardMaterial color="#F2EEE4" roughness={0.7} />
				</mesh>
			))}
		</group>
		{/* arbustos (massas low-poly sólidas) */}
		{[[-1.6, -1.0], [-0.9, -1.05], [1.0, -1.05], [1.8, -1.0]].map(([x, z], i) => (
			<mesh key={i} position={[x, 0.22, z]} scale={[0.38, 0.3, 0.3]} castShadow receiveShadow>
				<icosahedronGeometry args={[1, 1]} />
				<meshStandardMaterial color={i % 2 ? '#4E8F2E' : '#5DA130'} roughness={0.9} flatShading />
			</mesh>
		))}
		{/* caixa de correio */}
		<group position={[0.75, 0, 3.0]}>
			<mesh position={[0, 0.3, 0]} castShadow>
				<boxGeometry args={[0.04, 0.6, 0.04]} />
				<meshStandardMaterial color="#6B4E33" roughness={0.8} />
			</mesh>
			<mesh position={[0, 0.65, 0]} castShadow>
				<boxGeometry args={[0.16, 0.13, 0.26]} />
				<meshStandardMaterial color="#3A6FD8" roughness={0.4} metalness={0.3} />
			</mesh>
		</group>
	</>
);
