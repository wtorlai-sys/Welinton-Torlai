// Cenários e objetos do episódio "A garota popular" (3D, determinístico).
import React, {useMemo, useState} from 'react';
import * as THREE from 'three';
import {RoundedBox} from '@react-three/drei';
import {continueRender, delayRender, staticFile} from 'remotion';
import {Glow} from '../../components/Lighting';
import {Room} from '../../components/scenery/Room';
import {Bed} from '../../components/scenery/Furniture';
import {Bookshelf, Curtains} from '../../components/scenery/Decor';
import {BlockyAvatar, heartGeometry, idle, plastic, walk, blinkAt} from '../../components/BlockyAvatar';
import {extra} from './cast';
import {makeEmissiveMaterial, makeFloorMaterial, makePlainMaterial, makeTileMaterial, makeWallMaterial, makeWallpaperMaterial, makeWoodMaterial} from '../../style/materials';
import {clamp, easeOutBack, sr} from '../../style/easing';
import {hash1, mulberry32} from '../../style/random';

type G = Omit<React.ComponentProps<'group'>, 'children'>;
type V3 = [number, number, number];

/* ------------------------------------------------------------------ */
/* Texturas (imagens recortadas do Customuse / canvas)                 */
/* ------------------------------------------------------------------ */
const texCache = new Map<string, THREE.Texture>();
/** Carrega todas as imagens antes do 1º frame (senão o 1º render sai com textura preta). */
export const TEX_FILES = ['garota/tex/batata.png', 'garota/tex/galeria.png', 'garota/tex/dragao.png', 'garota/tex/placa.png'];
let preload: Promise<void> | null = null;
export const preloadTextures = () => {
	if (!preload)
		preload = Promise.all(
			TEX_FILES.map(
				(f) =>
					new Promise<void>((res) => {
						new THREE.TextureLoader().load(
							staticFile(f),
							(t) => {
								t.colorSpace = THREE.SRGBColorSpace;
								t.anisotropy = 8;
								texCache.set(f, t);
								res();
							},
							undefined,
							() => res(),
						);
					}),
			),
		).then(() => undefined);
	return preload;
};
export const useTex = (file: string) => {
	const [, force] = useState(0);
	const [handle] = useState(() => (texCache.has(file) ? null : delayRender(`tex ${file}`)));
	useMemo(() => {
		if (texCache.has(file)) return;
		const t = new THREE.TextureLoader().load(
			staticFile(file),
			() => {
				force((x) => x + 1);
				if (handle !== null) continueRender(handle);
			},
			undefined,
			() => handle !== null && continueRender(handle),
		);
		t.colorSpace = THREE.SRGBColorSpace;
		t.anisotropy = 8;
		texCache.set(file, t);
	}, [file, handle]);
	return texCache.get(file)!;
};

const canvasTex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
	if (texCache.has(key)) return texCache.get(key)!;
	const c = document.createElement('canvas');
	c.width = w;
	c.height = h;
	draw(c.getContext('2d')!);
	const t = new THREE.CanvasTexture(c);
	t.colorSpace = THREE.SRGBColorSpace;
	t.anisotropy = 8;
	texCache.set(key, t);
	return t;
};

const heartPath = (g: CanvasRenderingContext2D, x: number, y: number, s: number) => {
	g.beginPath();
	g.moveTo(x, y + s * 0.35);
	g.bezierCurveTo(x - s * 0.9, y - s * 0.3, x - s * 0.45, y - s * 0.95, x, y - s * 0.45);
	g.bezierCurveTo(x + s * 0.45, y - s * 0.95, x + s * 0.9, y - s * 0.3, x, y + s * 0.35);
	g.fill();
};

/** Telas de celular/notebook desenhadas em canvas. */
export type Screen = 'perfil' | 'coracoes' | 'chat' | 'galeria' | 'post' | 'escuro' | 'brilho';
const screenTex = (kind: Screen, hearts = 3) =>
	canvasTex(`scr-${kind}-${hearts}`, 360, 720, (g) => {
		g.fillStyle = kind === 'escuro' ? '#0E1220' : '#F7F5FA';
		g.fillRect(0, 0, 360, 720);
		if (kind === 'escuro') return;
		g.fillStyle = '#7A5CE0';
		g.fillRect(0, 0, 360, 70);
		if (kind === 'perfil' || kind === 'post') {
			g.fillStyle = '#C9CCD6';
			g.beginPath();
			g.arc(180, 190, 80, 0, Math.PI * 2);
			g.fill();
			g.fillStyle = '#8D92A3';
			g.beginPath();
			g.arc(180, 170, 32, 0, Math.PI * 2);
			g.fill();
			g.beginPath();
			g.ellipse(180, 245, 52, 30, 0, Math.PI, 0);
			g.fill();
			g.fillStyle = '#FFFFFF';
			g.font = '900 60px sans-serif';
			g.textAlign = 'center';
			g.fillText('?', 180, 215);
			for (let i = 0; i < 6; i++) {
				g.fillStyle = ['#F5E6C8', '#DDEBF7', '#F7DCE6', '#E2F2DA', '#EFE2F7', '#FFF0C9'][i];
				g.fillRect(24 + (i % 3) * 108, 320 + Math.floor(i / 3) * 140, 96, 128);
				g.fillStyle = '#3A6FD8';
				g.beginPath();
				const sx = 24 + (i % 3) * 108 + 82;
				const sy = 320 + Math.floor(i / 3) * 140 + 114;
				for (let k = 0; k < 10; k++) {
					const r = k % 2 ? 5 : 11;
					const a = -Math.PI / 2 + (k * Math.PI) / 5;
					g.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r);
				}
				g.fill();
			}
		}
		if (kind === 'chat' || kind === 'coracoes') {
			[[40, 130, 220, '#E9E6F2'], [100, 230, 220, '#7A5CE0'], [40, 330, 180, '#E9E6F2']].forEach(([x, y, w, c]) => {
				g.fillStyle = c as string;
				g.beginPath();
				g.roundRect(x as number, y as number, w as number, 70, 24);
				g.fill();
			});
			if (kind === 'coracoes') {
				g.fillStyle = '#E63B6E';
				for (let i = 0; i < hearts; i++) heartPath(g, 110 + i * 70, 500, 70);
			}
		}
		if (kind === 'brilho') {
			const gr = g.createRadialGradient(180, 360, 10, 180, 360, 360);
			gr.addColorStop(0, '#FFFFFF');
			gr.addColorStop(1, '#C9D8FF');
			g.fillStyle = gr;
			g.fillRect(0, 70, 360, 650);
		}
	});

/* ------------------------------------------------------------------ */
/* Objetos                                                             */
/* ------------------------------------------------------------------ */
export const Phone: React.FC<{screen?: Screen; hearts?: number; image?: string; glow?: number} & G> = ({screen = 'chat', hearts = 3, image, glow = 1.6, ...g}) => {
	const imgTex = image ? useTex(image) : null; // eslint-disable-line react-hooks/rules-of-hooks
	const map = imgTex ?? screenTex(screen, hearts);
	const mat = useMemo(() => new THREE.MeshBasicMaterial({toneMapped: false}), []);
	mat.map = map;
	mat.color.setScalar(glow > 1 ? 1 : glow);
	mat.needsUpdate = true;
	return (
		<group {...g}>
			<RoundedBox args={[0.075, 0.15, 0.01]} radius={0.008} smoothness={2} material={plastic('#1B1C22', 0.3)} castShadow />
			<mesh position={[0, 0, 0.0055]} material={mat}>
				<planeGeometry args={[0.066, 0.138]} />
			</mesh>
		</group>
	);
};

export const Laptop: React.FC<{screen?: Screen} & G> = ({screen = 'perfil', ...g}) => {
	const mat = useMemo(() => new THREE.MeshBasicMaterial({toneMapped: false}), []);
	mat.map = screenTex(screen);
	return (
		<group {...g}>
			<mesh position={[0, 0.01, 0]} material={plastic('#9EA4AE', 0.35)} castShadow receiveShadow>
				<boxGeometry args={[0.36, 0.02, 0.25]} />
			</mesh>
			<mesh position={[0, 0.021, 0.02]} material={plastic('#2C2F36', 0.6)}>
				<boxGeometry args={[0.32, 0.002, 0.13]} />
			</mesh>
			<group position={[0, 0.02, -0.12]} rotation={[-0.25, 0, 0]}>
				<mesh position={[0, 0.12, 0]} material={plastic('#9EA4AE', 0.35)} castShadow>
					<boxGeometry args={[0.36, 0.24, 0.012]} />
				</mesh>
				<mesh position={[0, 0.12, 0.007]} material={mat} rotation={[0, 0, Math.PI / 2]}>
					<planeGeometry args={[0.21, 0.33]} />
				</mesh>
			</group>
			<pointLight position={[0, 0.15, 0.15]} color="#BFD2FF" intensity={0.6} distance={1.2} />
		</group>
	);
};

/** Papel/caderno com imagem (desenho da batata, dragão…). */
export const Paper: React.FC<{image: string; w?: number; h?: number} & G> = ({image, w = 0.22, h = 0.3, ...g}) => {
	const t = useTex(image);
	return (
		<group {...g}>
			<mesh castShadow receiveShadow material={plastic('#F2EEE4', 0.9)}>
				<boxGeometry args={[w + 0.006, h + 0.006, 0.003]} />
			</mesh>
			<mesh position={[0, 0, 0.002]}>
				<planeGeometry args={[w, h]} />
				<meshStandardMaterial map={t} roughness={0.9} />
			</mesh>
		</group>
	);
};

/** Estrela azul desenhada aos poucos (progress 0..1). */
export const BlueStar: React.FC<{progress: number; size?: number} & G> = ({progress, size = 0.04, ...g}) => {
	const geo = useMemo(() => {
		const s = new THREE.Shape();
		for (let k = 0; k <= 10; k++) {
			const r = k % 2 ? 0.42 : 1;
			const a = Math.PI / 2 + (k * Math.PI) / 5;
			if (k === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
			else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
		}
		return new THREE.ShapeGeometry(s);
	}, []);
	const p = clamp(progress);
	return (
		<group {...g}>
			<mesh geometry={geo} scale={size * (0.2 + 0.8 * p)} material={makePlainMaterial('#2F7BE8', 0.5)} />
		</group>
	);
};

export const Pencil: React.FC<{color?: string} & G> = ({color = '#F2C230', ...g}) => (
	<group {...g}>
		<mesh rotation={[0, 0, 0]} material={plastic(color)} castShadow>
			<cylinderGeometry args={[0.006, 0.006, 0.14, 6]} />
		</mesh>
		<mesh position={[0, -0.08, 0]} material={plastic('#E8C9A0')}>
			<coneGeometry args={[0.006, 0.02, 6]} />
		</mesh>
	</group>
);

export const JuiceBox: React.FC<{squeeze?: number} & G> = ({squeeze = 0, ...g}) => (
	<group {...g}>
		<mesh scale={[1 - squeeze * 0.35, 1, 1 - squeeze * 0.2]} material={plastic('#F28C38')} castShadow>
			<boxGeometry args={[0.06, 0.1, 0.04]} />
		</mesh>
		<mesh position={[0, 0.03, 0.021]} material={plastic('#F2C230')}>
			<boxGeometry args={[0.04, 0.03, 0.002]} />
		</mesh>
		<mesh position={[0.015, 0.07, 0]} rotation={[0, 0, -0.2]} material={plastic('#FFFFFF')}>
			<cylinderGeometry args={[0.003, 0.003, 0.06, 6]} />
		</mesh>
	</group>
);

/** Corações subindo (t = tempo local em s). */
export const FloatingHearts: React.FC<{t: number; count?: number; seed?: number; spread?: number; rise?: number; color?: string; size?: number} & G> = ({
	t,
	count = 6,
	seed = 3,
	spread = 0.35,
	rise = 0.5,
	color = '#F2507E',
	size = 0.05,
	...g
}) => {
	const r = mulberry32(seed);
	const list = Array.from({length: count}, () => ({x: (r() - 0.5) * 2 * spread, z: (r() - 0.5) * spread * 0.5, d: r() * 1.2, s: 0.7 + r() * 0.6, w: r() * 6}));
	return (
		<group {...g}>
			{list.map((h, i) => {
				const k = (t - h.d) / 1.6;
				if (k < 0) return null;
				const kk = k % 1;
				const sc = easeOutBack(clamp(kk * 5)) * (1 - sr(kk, 0.75, 1)) * h.s * size;
				return (
					<mesh key={i} geometry={heartGeometry()} position={[h.x + Math.sin(t * 3 + h.w) * 0.03, kk * rise, h.z]} scale={sc} material={plastic(color, 0.35)} />
				);
			})}
		</group>
	);
};

/** Bolhas de notificação com coração saindo do celular. */
export const Notifs: React.FC<{t: number; count?: number} & G> = ({t, count = 8, ...g}) => {
	const r = mulberry32(17);
	const items = Array.from({length: count}, (_, i) => ({d: i * 0.32, x: (r() - 0.5) * 0.5, y: 0.15 + r() * 0.35, z: (r() - 0.5) * 0.1}));
	const bubble = canvasTex('notif', 128, 96, (g2) => {
		g2.fillStyle = '#FFFFFF';
		g2.beginPath();
		g2.roundRect(4, 4, 120, 70, 22);
		g2.fill();
		g2.beginPath();
		g2.moveTo(30, 70);
		g2.lineTo(20, 92);
		g2.lineTo(50, 72);
		g2.fill();
		g2.fillStyle = '#F2507E';
		heartPath(g2, 64, 40, 44);
	});
	return (
		<group {...g}>
			{items.map((it, i) => {
				const k = clamp((t - it.d) / 0.35);
				if (k <= 0) return null;
				const s = easeOutBack(k) * 0.14;
				return (
					<mesh key={i} position={[it.x * k, it.y * k + 0.05, it.z]} scale={[s, s * 0.75, s]}>
						<planeGeometry args={[1, 1]} />
						<meshBasicMaterial map={bubble} transparent toneMapped={false} />
					</mesh>
				);
			})}
		</group>
	);
};

/** Vapor saindo das orelhas (raiva). */
export const Steam: React.FC<{t: number} & G> = ({t, ...g}) => (
	<group {...g}>
		{[-1, 1].map((s) =>
			[0, 1, 2].map((k) => {
				const kk = ((t * 1.6 + k / 3) % 1 + 1) % 1;
				return (
					<mesh key={`${s}${k}`} position={[s * (0.2 + kk * 0.12), kk * 0.12, 0]} scale={0.03 + kk * 0.05} material={makePlainMaterial('#F4F4F4', 0.9)}>
						<sphereGeometry args={[1, 10, 8]} />
					</mesh>
				);
			}),
		)}
	</group>
);

export const SweatDrop: React.FC<{t: number} & G> = ({t, ...g}) => (
	<group {...g} position={[(g.position as V3)?.[0] ?? 0, ((g.position as V3)?.[1] ?? 0) - (t % 1.2) * 0.05, (g.position as V3)?.[2] ?? 0]}>
		<mesh material={makePlainMaterial('#7EC8F2', 0.2)} scale={[0.022, 0.03, 0.015]}>
			<sphereGeometry args={[1, 12, 10]} />
		</mesh>
		<mesh position={[0, 0.03, 0]} material={makePlainMaterial('#7EC8F2', 0.2)}>
			<coneGeometry args={[0.014, 0.03, 10]} />
		</mesh>
	</group>
);

/** Jato de suco (k = 0..1 desde o cuspe). */
export const JuiceSpray: React.FC<{k: number} & G> = ({k, ...g}) => {
	if (k <= 0 || k >= 1) return null;
	const r = mulberry32(5);
	return (
		<group {...g}>
			{Array.from({length: 26}, (_, i) => {
				const vx = (r() - 0.5) * 0.9;
				const vy = 0.3 + r() * 0.6;
				const vz = 0.6 + r() * 0.8;
				const tt = k * 0.7;
				return (
					<mesh key={i} position={[vx * tt, vy * tt - 2.4 * tt * tt, vz * tt]} scale={0.012 + r() * 0.012} material={plastic('#F7A13A', 0.2)}>
						<sphereGeometry args={[1, 8, 6]} />
					</mesh>
				);
			})}
		</group>
	);
};

/** Círculo de "carregando" sobre a cabeça. */
export const Loading: React.FC<{t: number} & G> = ({t, ...g}) => (
	<group {...g}>
		{Array.from({length: 8}, (_, i) => {
			const a = (i / 8) * Math.PI * 2 - t * 5;
			const on = (i / 8 + t * 0.8) % 1;
			return (
				<mesh key={i} position={[Math.cos(a) * 0.07, Math.sin(a) * 0.07, 0]} scale={0.012 + on * 0.008} material={makePlainMaterial(on > 0.6 ? '#FFFFFF' : '#9AA3B5', 0.4)}>
					<sphereGeometry args={[1, 8, 6]} />
				</mesh>
			);
		})}
	</group>
);

export const Sign: React.FC<G> = (g) => {
	const t = useTex('garota/tex/placa.png');
	return (
		<group {...g}>
			<mesh castShadow material={plastic('#C8A36A', 0.9)}>
				<boxGeometry args={[0.52, 0.26, 0.012]} />
			</mesh>
			<mesh position={[0, 0, 0.007]}>
				<planeGeometry args={[0.5, 0.24]} />
				<meshStandardMaterial map={t} roughness={0.9} />
			</mesh>
		</group>
	);
};

export const Books: React.FC<G> = (g) => (
	<group {...g}>
		{['#3A6FD8', '#F2C230', '#2BA59B'].map((c, i) => (
			<mesh key={i} position={[0, i * 0.035, 0]} rotation={[0, i * 0.15, 0]} material={plastic(c)} castShadow>
				<boxGeometry args={[0.2, 0.033, 0.15]} />
			</mesh>
		))}
	</group>
);

export const Sunglasses: React.FC<G> = (g) => (
	<group {...g}>
		{[-1, 1].map((s) => (
			<mesh key={s} position={[s * 0.07, 0, 0]} material={plastic('#111216', 0.15)}>
				<boxGeometry args={[0.11, 0.06, 0.01]} />
			</mesh>
		))}
		<mesh material={plastic('#111216', 0.15)}>
			<boxGeometry args={[0.3, 0.012, 0.01]} />
		</mesh>
	</group>
);

/* ------------------------------------------------------------------ */
/* Figurantes                                                          */
/* ------------------------------------------------------------------ */
export const Extras: React.FC<{t: number; spots: {p: V3; ry?: number; walk?: boolean; sit?: boolean}[]; seed?: number}> = ({t, spots, seed = 0}) => (
	<>
		{spots.map((s, i) => {
			const id = i + seed;
			const wk = s.walk ? walk(t + hash1(id) * 3, 0.8) : {...idle(t, id), sit: s.sit};
			const dz = s.walk ? ((t * 0.9 + hash1(id) * 4) % 3) - 1.5 : 0;
			const ry = s.ry ?? 0;
			return (
				<BlockyAvatar
					key={i}
					look={extra(id)}
					pose={{...wk, head: [Math.sin(t * 0.8 + id) * 20, 0, 0]}}
					expr={id % 3 === 0 ? 'feliz' : 'neutro'}
					blink={blinkAt(t, id + 9)}
					mouth={id % 2 ? Math.max(0, Math.sin(t * 9 + id)) * 0.5 : 0}
					position={[s.p[0] + Math.sin(ry) * dz, s.p[1], s.p[2] + Math.cos(ry) * dz]}
					rotation={[0, ry, 0]}
				/>
			);
		})}
	</>
);

/* ------------------------------------------------------------------ */
/* Cenários                                                            */
/* ------------------------------------------------------------------ */
const LOCKERS = ['#3D7BC8', '#2BA59B', '#4C9A5A', '#E0A436', '#3D7BC8', '#5B8FD6'];

const LockerRow: React.FC<{n: number; color?: string; seed?: number} & G> = ({n, seed = 0, ...g}) => (
	<group {...g}>
		{Array.from({length: n}, (_, i) => {
			const c = LOCKERS[Math.floor(i / 3 + seed) % LOCKERS.length];
			return (
				<group key={i} position={[i * 0.42, 0, 0]}>
					<mesh position={[0, 0.95, 0]} material={makePlainMaterial(c, 0.45, 0.25)} castShadow receiveShadow>
						<boxGeometry args={[0.4, 1.8, 0.45]} />
					</mesh>
					{[0, 1, 2, 3].map((k) => (
						<mesh key={k} position={[0, 1.6 + k * 0.035, 0.226]} material={makePlainMaterial('#1E2A36', 0.6)}>
							<boxGeometry args={[0.22, 0.012, 0.004]} />
						</mesh>
					))}
					<mesh position={[0.13, 1.05, 0.235]} material={makePlainMaterial('#C9CED6', 0.3, 0.8)}>
						<boxGeometry args={[0.03, 0.12, 0.02]} />
					</mesh>
				</group>
			);
		})}
	</group>
);

const Board: React.FC<G> = (g) => {
	const r = mulberry32(4);
	return (
		<group {...g}>
			<mesh material={makeWoodMaterial('#A57A4E')} receiveShadow>
				<boxGeometry args={[1.6, 0.9, 0.04]} />
			</mesh>
			<mesh position={[0, 0, 0.021]} material={makePlainMaterial('#C99A62', 0.95)}>
				<planeGeometry args={[1.5, 0.8]} />
			</mesh>
			{Array.from({length: 11}, (_, i) => (
				<mesh key={i} position={[-0.6 + r() * 1.2, -0.28 + r() * 0.56, 0.025]} rotation={[0, 0, (r() - 0.5) * 0.3]} material={makePlainMaterial(['#FFE36E', '#FF9EC4', '#8FE3F0', '#B6F08A', '#FFFFFF'][i % 5], 0.8)}>
					<planeGeometry args={[0.16, 0.16]} />
				</mesh>
			))}
		</group>
	);
};

/** Corredor da escola (olha para -Z). Armários dos dois lados, luminárias no teto. */
export const Hallway: React.FC<{t: number; extras?: boolean}> = ({t, extras = true}) => (
	<group>
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -4]} material={makeTileMaterial('#DCD5C6', '#BFB6A4', 0.4)} receiveShadow>
			<planeGeometry args={[4, 20]} />
		</mesh>
		{[-1, 1].map((s) => (
			<group key={s}>
				<mesh position={[s * 1.75, 1.5, -4]} material={makeWallMaterial('#E8E1CF')} receiveShadow>
					<boxGeometry args={[0.1, 3, 20]} />
				</mesh>
				<LockerRow n={20} seed={s > 0 ? 2 : 0} position={[s * 1.47, 0, 4]} rotation={[0, s > 0 ? -Math.PI / 2 : Math.PI / 2, 0]} />
			</group>
		))}
		<mesh position={[0, 3, -4]} material={makeWallMaterial('#F5F2EA')}>
			<boxGeometry args={[3.6, 0.1, 20]} />
		</mesh>
		{[-1, -4, -7, -10, 2].map((z) => (
			<Glow key={z}>
				<mesh position={[0, 2.94, z]} material={makeEmissiveMaterial('#FFF4DC', 2.2)}>
					<boxGeometry args={[0.6, 0.02, 1.2]} />
				</mesh>
			</Glow>
		))}
		<pointLight position={[0, 2.6, -1]} intensity={4} distance={7} color="#FFF1DA" />
		<pointLight position={[0, 2.6, -6]} intensity={4} distance={7} color="#FFF1DA" />
		<mesh position={[0, 1.5, -12]} material={makeWallMaterial('#E8E1CF')}>
			<boxGeometry args={[3.6, 3, 0.1]} />
		</mesh>
		<mesh position={[0, 1.4, -11.94]} material={makeEmissiveMaterial('#DDEEFF', 1.2)}>
			<planeGeometry args={[1.4, 1.6]} />
		</mesh>
		<Board position={[0, 1.7, -11.9]} scale={0.6} />
		{extras && (
			<Extras
				t={t}
				seed={2}
				spots={[
					{p: [-0.8, 0, -6.5], ry: 0.6},
					{p: [-0.45, 0, -6.8], ry: -0.6},
					{p: [0.9, 0, -8.5], ry: 0},
					{p: [0.5, 0, -4.0], ry: Math.PI, walk: true},
				]}
			/>
		)}
	</group>
);

/** Quarto do Max à noite: mesa com notebook e luminária, cama, janela com lua. */
export const MaxRoom: React.FC<{lamp?: boolean}> = ({lamp = true}) => (
	<group>
		<Room width={3.6} depth={3.4} height={2.5} wallMaterial={makeWallpaperMaterial('#2E4468', '#36507A', 0.3)} floorColor="#7A5A3E" windows={[{wall: 'back', at: 0.6, y: 1.0, w: 0.9, h: 0.9}]} />
		{/* céu noturno + lua atrás da janela */}
		<mesh position={[0.6, 1.5, -2.3]} material={makeEmissiveMaterial('#1B2A55', 0.8)}>
			<planeGeometry args={[2, 1.6]} />
		</mesh>
		<Glow>
			<mesh position={[0.85, 1.65, -2.25]} material={makeEmissiveMaterial('#F4EFD8', 2.5)}>
				<circleGeometry args={[0.09, 24]} />
			</mesh>
		</Glow>
		<Curtains position={[0.6, 0.95, -1.62]} w={1.1} h={1.05} color="#3A6FD8" open={0.7} />
		{/* mesa */}
		<group position={[-0.9, 0, -1.3]}>
			<mesh position={[0, 0.72, 0]} material={makeWoodMaterial('#9A6B42')} castShadow receiveShadow>
				<boxGeometry args={[1.2, 0.04, 0.6]} />
			</mesh>
			{[[-0.55, -0.26], [0.55, -0.26], [-0.55, 0.26], [0.55, 0.26]].map(([x, z], i) => (
				<mesh key={i} position={[x, 0.36, z]} material={makeWoodMaterial('#7E5634')} castShadow>
					<boxGeometry args={[0.05, 0.72, 0.05]} />
				</mesh>
			))}
			<Laptop position={[0.05, 0.74, 0.05]} />
			<group position={[-0.45, 0.74, -0.15]}>
				<mesh position={[0, 0.2, 0]} rotation={[0, 0, 0.3]} material={plastic('#2B2F38')} castShadow>
					<cylinderGeometry args={[0.012, 0.012, 0.4, 8]} />
				</mesh>
				<mesh position={[0.08, 0.38, 0.02]} rotation={[0, 0, -0.9]} material={plastic('#2B2F38')}>
					<coneGeometry args={[0.07, 0.1, 16, 1, true]} />
				</mesh>
				{lamp && (
					<>
						<Glow>
							<mesh position={[0.1, 0.35, 0.02]} material={makeEmissiveMaterial('#FFD27A', 5)}>
								<sphereGeometry args={[0.025, 12, 10]} />
							</mesh>
						</Glow>
						<pointLight position={[0.12, 0.3, 0.1]} color="#FFC870" intensity={2.4} distance={3} castShadow={false} />
					</>
				)}
			</group>
			<Books position={[0.45, 0.74, -0.1]} />
			<Paper image="garota/tex/dragao.png" w={0.16} h={0.2} position={[0.4, 0.75, 0.15]} rotation={[-Math.PI / 2, 0, 0.3]} />
		</group>
		{/* cadeira */}
		<group position={[-0.85, 0, -0.75]}>
			<mesh position={[0, 0.45, 0]} material={plastic('#2B2F38')} castShadow>
				<boxGeometry args={[0.45, 0.06, 0.42]} />
			</mesh>
			<mesh position={[0, 0.75, 0.2]} material={plastic('#2B2F38')} castShadow>
				<boxGeometry args={[0.45, 0.55, 0.05]} />
			</mesh>
			<mesh position={[0, 0.22, 0]} material={plastic('#5A606C')}>
				<cylinderGeometry args={[0.03, 0.03, 0.44, 8]} />
			</mesh>
		</group>
		<Bed position={[1.15, 0, -0.6]} rotation={[0, -Math.PI / 2, 0]} width={1.0} length={1.9} duvet="#3E5C8A" pillows={1} />
		<Bookshelf position={[-1.6, 0, 0.6]} rotation={[0, Math.PI / 2, 0]} w={0.9} h={1.4} />
		{[['#E27AA0', -1.2, 1.75], ['#F2C230', -0.55, 1.85]].map(([c, x, y], i) => (
			<mesh key={i} position={[x as number, y as number, -1.68]} material={makePlainMaterial(c as string, 0.8)}>
				<planeGeometry args={[0.38, 0.5]} />
			</mesh>
		))}
		<hemisphereLight args={['#5A6FA0', '#2A2230', 0.6]} />
	</group>
);

/** Quarto da garota: paredes rosa, luzinhas, cama lilás, pelúcias. */
export const GirlRoom: React.FC<{night?: boolean}> = ({night = false}) => (
	<group>
		<Room width={3.6} depth={3.4} height={2.5} wallMaterial={makeWallpaperMaterial(night ? '#7A4A6E' : '#F2B6CF', night ? '#8A5A7E' : '#F7C8DA', 0.25)} floorColor="#C99A70" windows={[{wall: 'back', at: 0.9, y: 1.0, w: 0.9, h: 0.9}]} />
		<mesh position={[0.9, 1.45, -2.3]} material={makeEmissiveMaterial(night ? '#1B2A55' : '#F4A86A', night ? 0.8 : 1.4)}>
			<planeGeometry args={[2, 1.6]} />
		</mesh>
		{/* luzinhas */}
		<Glow>
			{Array.from({length: 22}, (_, i) => {
				const x = -1.7 + i * 0.16;
				const y = 2.25 - Math.abs(Math.sin(i * 0.55)) * 0.12;
				return (
					<mesh key={i} position={[x, y, -1.66]} material={makeEmissiveMaterial(i % 2 ? '#FFD27A' : '#FFE9B8', 4)}>
						<sphereGeometry args={[0.022, 8, 6]} />
					</mesh>
				);
			})}
		</Glow>
		<pointLight position={[0, 2.0, -1.2]} color="#FFC890" intensity={night ? 1.6 : 1.2} distance={4} />
		<Bed position={[-0.3, 0, -0.95]} width={1.1} length={1.9} duvet="#B48AD6" pillows={2} />
		{/* pelúcias */}
		{[[-0.65, '#E8B4C8'], [0.05, '#F2E2C2']].map(([x, c], i) => (
			<group key={i} position={[x as number, 0.62, -1.7]}>
				<mesh position={[0, 0.1, 0]} material={makePlainMaterial(c as string, 0.95)} castShadow>
					<sphereGeometry args={[0.11, 16, 12]} />
				</mesh>
				<mesh position={[0, 0.26, 0]} material={makePlainMaterial(c as string, 0.95)} castShadow>
					<sphereGeometry args={[0.08, 16, 12]} />
				</mesh>
				{[-1, 1].map((s) => (
					<mesh key={s} position={[s * 0.06, 0.33, 0]} material={makePlainMaterial(c as string, 0.95)}>
						<sphereGeometry args={[0.03, 10, 8]} />
					</mesh>
				))}
			</group>
		))}
		<group position={[1.3, 0, -1.3]}>
			<mesh position={[0, 0.7, 0]} material={makeWoodMaterial('#F4EDE4')} castShadow receiveShadow>
				<boxGeometry args={[0.8, 0.04, 0.5]} />
			</mesh>
			<mesh position={[0, 0.35, 0]} material={makeWoodMaterial('#EDE3D6')} castShadow>
				<boxGeometry args={[0.76, 0.66, 0.46]} />
			</mesh>
			<mesh position={[0, 1.1, -0.2]} material={makePlainMaterial('#FFFFFF', 0.2, 0.3)}>
				<circleGeometry args={[0.28, 32]} />
			</mesh>
		</group>
		{['#8FE3F0', '#FFE36E', '#B6F08A'].map((c, i) => (
			<mesh key={i} position={[-1.3 + i * 0.35, 1.7 + (i % 2) * 0.12, -1.68]} material={makePlainMaterial(c, 0.8)}>
				<planeGeometry args={[0.28, 0.36]} />
			</mesh>
		))}
		<hemisphereLight args={night ? ['#6A5A9A', '#3A2A3A', 0.6] : ['#FFE0EC', '#C99A70', 0.5]} />
	</group>
);

/** Cantina: mesas compridas, bandejas, alunos ao fundo. */
export const Cafeteria: React.FC<{t: number}> = ({t}) => (
	<group>
		<Room width={9} depth={9} height={3.2} wallColor="#EDE6D2" floorColor="#B98A5A" windows={[{wall: 'back', at: -2.5, y: 1.1, w: 1.6, h: 1.4}, {wall: 'back', at: 0, y: 1.1, w: 1.6, h: 1.4}, {wall: 'back', at: 2.5, y: 1.1, w: 1.6, h: 1.4}]} ceiling={false} />
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} material={makeTileMaterial('#E2DCCD', '#C2B9A6', 0.5)} receiveShadow>
			<planeGeometry args={[9, 9]} />
		</mesh>
		{[-2.6, -0.6, 1.6].map((z, i) => (
			<group key={z} position={[i === 2 ? 0 : 0.4, 0, z]}>
				<mesh position={[0, 0.72, 0]} material={makePlainMaterial('#E9EDF2', 0.4)} castShadow receiveShadow>
					<boxGeometry args={[3.2, 0.05, 0.8]} />
				</mesh>
				{[-1, 1].map((s) => (
					<mesh key={s} position={[0, 0.42, s * 0.62]} material={makePlainMaterial('#3D7BC8', 0.5)} castShadow receiveShadow>
						<boxGeometry args={[3.2, 0.05, 0.3]} />
					</mesh>
				))}
				{[-1.4, 1.4].map((x) => (
					<mesh key={x} position={[x, 0.36, 0]} material={makePlainMaterial('#9AA1A8', 0.3, 0.7)}>
						<boxGeometry args={[0.06, 0.72, 0.6]} />
					</mesh>
				))}
				{[-0.9, 0.2, 1.1].map((x, k) => (
					<group key={x} position={[x, 0.75, (k % 2 ? -1 : 1) * 0.15]}>
						<mesh material={makePlainMaterial('#F28C38', 0.5)} castShadow>
							<boxGeometry args={[0.36, 0.015, 0.26]} />
						</mesh>
						<mesh position={[-0.08, 0.03, 0]} material={makePlainMaterial('#F2D58A', 0.7)}>
							<boxGeometry args={[0.12, 0.04, 0.09]} />
						</mesh>
						<mesh position={[0.1, 0.04, 0.03]} material={makePlainMaterial('#5DA130', 0.5)}>
							<sphereGeometry args={[0.035, 12, 10]} />
						</mesh>
					</group>
				))}
			</group>
		))}
		<Extras
			t={t}
			seed={6}
			spots={[
				{p: [-0.6, 0, -3.2], sit: true},
				{p: [0.6, 0, -3.2], sit: true},
				{p: [1.4, 0, -2.0], ry: Math.PI, sit: true},
				{p: [-1.0, 0, -2.0], ry: Math.PI, sit: true},
				{p: [2.8, 0, -1.5], ry: -1.2, walk: true},
			]}
		/>
		<hemisphereLight args={['#FFF4E0', '#B98A5A', 0.7]} />
	</group>
);

/** Sala de estar: sofá, mesa de centro, planta, janela com sol. */
export const LivingRoom: React.FC<{table?: boolean}> = ({table = false}) => (
	<group>
		<Room width={4.4} depth={3.6} height={2.6} wallColor="#E9D9BE" floorColor="#A9764A" windows={[{wall: 'back', at: 1.3, y: 0.9, w: 1.1, h: 1.2}]} />
		<mesh position={[1.3, 1.5, -2.4]} material={makeEmissiveMaterial('#CFE6FF', 1.4)}>
			<planeGeometry args={[2, 1.8]} />
		</mesh>
		{!table && (
			<group position={[0, 0, -1.25]}>
				<mesh position={[0, 0.24, 0]} material={makePlainMaterial('#C8B89C', 0.95)} castShadow receiveShadow>
					<boxGeometry args={[1.9, 0.3, 0.8]} />
				</mesh>
				<mesh position={[0, 0.48, -0.33]} material={makePlainMaterial('#C8B89C', 0.95)} castShadow receiveShadow>
					<boxGeometry args={[1.9, 0.62, 0.18]} />
				</mesh>
				{[-1, 1].map((s) => (
					<mesh key={s} position={[s * 0.98, 0.38, 0]} material={makePlainMaterial('#BBA98B', 0.95)} castShadow>
						<boxGeometry args={[0.18, 0.5, 0.8]} />
					</mesh>
				))}
				{[-0.45, 0.45].map((x) => (
					<mesh key={x} position={[x, 0.42, 0.02]} material={makePlainMaterial('#D7C9AE', 0.95)} castShadow>
						<boxGeometry args={[0.86, 0.08, 0.7]} />
					</mesh>
				))}
			</group>
		)}
		<group position={table ? [0, 0, -0.4] : [0, 0, -0.1]}>
			<mesh position={[0, table ? 0.7 : 0.38, 0]} material={makeWoodMaterial('#7E5634')} castShadow receiveShadow>
				<boxGeometry args={table ? [1.3, 0.05, 0.8] : [1.0, 0.04, 0.5]} />
			</mesh>
			{[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
				<mesh key={i} position={[sx * (table ? 0.6 : 0.45), (table ? 0.7 : 0.38) / 2, sz * (table ? 0.35 : 0.2)]} material={makeWoodMaterial('#6B4A2E')}>
					<boxGeometry args={[0.05, table ? 0.7 : 0.38, 0.05]} />
				</mesh>
			))}
		</group>
		<group position={[-1.7, 0, -1.4]}>
			<mesh position={[0, 0.2, 0]} material={makePlainMaterial('#C96A3A', 0.8)} castShadow>
				<cylinderGeometry args={[0.16, 0.12, 0.4, 12]} />
			</mesh>
			{Array.from({length: 7}, (_, i) => (
				<mesh key={i} position={[Math.cos(i) * 0.12, 0.55 + (i % 3) * 0.12, Math.sin(i) * 0.12]} rotation={[i, i * 2, 0]} material={makePlainMaterial('#3E8A3A', 0.7)} castShadow>
					<boxGeometry args={[0.2, 0.2, 0.2]} />
				</mesh>
			))}
		</group>
		<hemisphereLight args={['#FFF4E0', '#A9764A', 0.6]} />
	</group>
);

/** Árvore de blocos. */
const BlockTree: React.FC<{seed?: number} & G> = ({seed = 1, ...g}) => {
	const r = mulberry32(seed);
	return (
		<group {...g}>
			<mesh position={[0, 0.9, 0]} material={makeWoodMaterial('#6B4A2E')} castShadow>
				<boxGeometry args={[0.3, 1.8, 0.3]} />
			</mesh>
			{Array.from({length: 9}, (_, i) => {
				const s = 0.8 + r() * 0.5;
				return (
					<mesh key={i} position={[(r() - 0.5) * 1.4, 2.0 + r() * 1.1, (r() - 0.5) * 1.4]} material={makePlainMaterial(['#4E9A3A', '#5DAF42', '#3F8A32'][i % 3], 0.8)} castShadow receiveShadow>
						<boxGeometry args={[s, s, s]} />
					</mesh>
				);
			})}
		</group>
	);
};

const brickTex = () =>
	canvasTex('brick', 512, 512, (g) => {
		g.fillStyle = '#8A8178';
		g.fillRect(0, 0, 512, 512);
		const r = mulberry32(8);
		for (let row = 0; row < 16; row++)
			for (let col = 0; col < 9; col++) {
				const x = col * 64 - (row % 2) * 32;
				const v = 0.85 + r() * 0.25;
				g.fillStyle = `rgb(${Math.round(160 * v)},${Math.round(78 * v)},${Math.round(58 * v)})`;
				g.fillRect(x + 2, row * 32 + 2, 60, 28);
			}
	});

/** Prédio de tijolos da escola (fundo do pátio). */
const SchoolBuilding: React.FC<G> = (g) => {
	const tex = useMemo(() => {
		const t = brickTex().clone();
		t.wrapS = t.wrapT = THREE.RepeatWrapping;
		t.repeat.set(10, 3);
		t.needsUpdate = true;
		return t;
	}, []);
	return (
		<group {...g}>
			<mesh position={[0, 3, 0]} castShadow receiveShadow>
				<boxGeometry args={[24, 6, 4]} />
				<meshStandardMaterial map={tex} roughness={0.9} />
			</mesh>
			<mesh position={[0, 6.1, 0]} material={makePlainMaterial('#D8D2C4', 0.7)}>
				<boxGeometry args={[24.4, 0.25, 4.4]} />
			</mesh>
			{[1.6, 4.3].map((y) =>
				Array.from({length: 9}, (_, i) => (
					<group key={`${y}-${i}`} position={[-10 + i * 2.5, y, 2.02]}>
						<mesh material={makePlainMaterial('#EDE8DC', 0.6)}>
							<boxGeometry args={[1.5, 1.3, 0.04]} />
						</mesh>
						<mesh position={[0, 0, 0.025]} material={makePlainMaterial('#5E7F99', 0.15, 0.3)}>
							<planeGeometry args={[1.35, 1.15]} />
						</mesh>
					</group>
				)),
			)}
			<mesh position={[1.2, 1.2, 2.03]} material={makePlainMaterial('#3D7BC8', 0.5)}>
				<boxGeometry args={[1.6, 2.4, 0.05]} />
			</mesh>
		</group>
	);
};

/** Pátio da escola: piso de concreto, grama, árvores de blocos, bancos, cesta, prédio. */
export const Schoolyard: React.FC<{t: number; extras?: boolean}> = ({t, extras = true}) => (
	<group>
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -6]} material={makeTileMaterial('#C9C4BA', '#AFA99E', 0.8)} receiveShadow>
			<planeGeometry args={[40, 40]} />
		</mesh>
		{[-1, 1].map((s) => (
			<mesh key={s} rotation={[-Math.PI / 2, 0, 0]} position={[s * 6.5, 0.003, -3]} material={makePlainMaterial('#5DA130', 0.95)} receiveShadow>
				<planeGeometry args={[6, 14]} />
			</mesh>
		))}
		<SchoolBuilding position={[0, 0, -16]} />
		<BlockTree position={[-4.5, 0, -6]} seed={2} />
		<BlockTree position={[4.2, 0, -8]} seed={5} />
		<BlockTree position={[-6, 0, 0.5]} seed={9} />
		<BlockTree position={[6.5, 0, -1]} seed={12} />
		{[[-2.6, -3.5, 0.3], [2.8, -4.5, -0.2]].map(([x, z, ry], i) => (
			<group key={i} position={[x, 0, z]} rotation={[0, ry, 0]}>
				<mesh position={[0, 0.42, 0]} material={makeWoodMaterial('#9A6B42')} castShadow receiveShadow>
					<boxGeometry args={[1.6, 0.06, 0.4]} />
				</mesh>
				{[-0.7, 0.7].map((xx) => (
					<mesh key={xx} position={[xx, 0.2, 0]} material={makePlainMaterial('#555A62', 0.4, 0.6)} castShadow>
						<boxGeometry args={[0.06, 0.4, 0.36]} />
					</mesh>
				))}
			</group>
		))}
		<group position={[5.5, 0, -11]}>
			<mesh position={[0, 1.5, 0]} material={makePlainMaterial('#555A62', 0.4, 0.6)} castShadow>
				<cylinderGeometry args={[0.06, 0.06, 3, 8]} />
			</mesh>
			<mesh position={[0, 3.1, 0.2]} material={makePlainMaterial('#F4F4F4', 0.5)} castShadow>
				<boxGeometry args={[1.1, 0.75, 0.05]} />
			</mesh>
			<mesh position={[0, 2.85, 0.45]} rotation={[Math.PI / 2, 0, 0]} material={makePlainMaterial('#F28C38', 0.4, 0.5)}>
				<torusGeometry args={[0.2, 0.015, 8, 20]} />
			</mesh>
		</group>
		{extras && (
			<Extras
				t={t}
				seed={11}
				spots={[
					{p: [-3.2, 0, -7], ry: 0.4},
					{p: [-2.6, 0, -7.4], ry: -0.8},
					{p: [3.5, 0, -9], ry: -0.3},
					{p: [-1, 0, -10], ry: 1.2, walk: true},
					{p: [2.2, 0, -6.5], ry: -2.4},
				]}
			/>
		)}
	</group>
);
