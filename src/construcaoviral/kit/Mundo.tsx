// Kit "Construção Viral" — mundo low-poly reaproveitável (luz, céu, casa, árvores, nuvens, montanhas, cerca).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {hash1} from '../../style/random';

export const flat = (c: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
	new THREE.MeshStandardMaterial({color: c, flatShading: true, roughness: 0.9, metalness: 0, ...extra});

export const CORES = {
	grama: '#6DBE45',
	gramaEscura: '#58A535',
	terra: '#C08350',
	terraEscura: '#9C6538',
	terraFirme: '#8A5E3E',
	parede: '#F1E6D2',
	telhado: '#D9733B', // terracota (o vermelho puro fica reservado ao foco: PALETTE.accent)
	porta: '#8A5A36',
	vidro: '#9FD3F0',
	tronco: '#7A5233',
	copa: '#4FA83B',
	copa2: '#3E9433',
	montanha: '#9CCB8A',
	montanha2: '#86B979',
	nuvem: '#FFFFFF',
	cerca: '#EDEDED',
	predio: '#C9CFD8',
};

/* --------------------------------- luz e céu ------------------------------ */
export type Clima = {sky: string; fog: string; sun: number; sunColor: string; hemi: number; sunDir: [number, number, number]};

export const climaMix = (a: Clima, b: Clima, x: number): Clima => {
	const c = (p: string, q: string) => '#' + new THREE.Color(p).lerp(new THREE.Color(q), x).getHexString();
	const l = (p: number, q: number) => p + (q - p) * x;
	return {
		sky: c(a.sky, b.sky),
		fog: c(a.fog, b.fog),
		sun: l(a.sun, b.sun),
		sunColor: c(a.sunColor, b.sunColor),
		hemi: l(a.hemi, b.hemi),
		sunDir: [l(a.sunDir[0], b.sunDir[0]), l(a.sunDir[1], b.sunDir[1]), l(a.sunDir[2], b.sunDir[2])],
	};
};

export const CLIMAS = {
	dia: {sky: '#7EC4F2', fog: '#CFE8F7', sun: 2.6, sunColor: '#FFF3DC', hemi: 1.0, sunDir: [-8, 14, 3]} as Clima,
	sol: {sky: '#8CCBF5', fog: '#F3E7C8', sun: 3.4, sunColor: '#FFE7B0', hemi: 1.0, sunDir: [-4, 14, 3]} as Clima,
	chuva: {sky: '#6E7C8C', fog: '#8E9AA6', sun: 0.6, sunColor: '#DDE6F0', hemi: 0.75, sunDir: [-8, 14, 3]} as Clima,
	entardecer: {sky: '#9C7BC4', fog: '#F2B8A0', sun: 1.8, sunColor: '#FFB27A', hemi: 0.7, sunDir: [-12, 5, 6]} as Clima,
	noite: {sky: '#2B3A66', fog: '#3A4A78', sun: 0.35, sunColor: '#9FB4FF', hemi: 0.45, sunDir: [-6, 12, 8]} as Clima,
};

export const Ambiente: React.FC<{c: Clima; focus?: [number, number, number]}> = ({c, focus = [0, 0, 0]}) => {
	const {scene} = useThree();
	scene.background = new THREE.Color(c.sky);
	scene.fog = new THREE.Fog(c.fog, 28, 90);
	const target = useMemo(() => new THREE.Object3D(), []);
	target.position.set(...focus);
	return (
		<>
			<hemisphereLight args={['#DDEEFF', '#7A9A55', c.hemi]} />
			<ambientLight intensity={0.25} />
			<primitive object={target} />
			<directionalLight
				position={[focus[0] + c.sunDir[0], focus[1] + c.sunDir[1], focus[2] + c.sunDir[2]]}
				target={target}
				intensity={c.sun}
				color={c.sunColor}
				castShadow
				shadow-mapSize={[2048, 2048]}
				shadow-camera-left={-14}
				shadow-camera-right={14}
				shadow-camera-top={14}
				shadow-camera-bottom={-14}
				shadow-camera-near={0.5}
				shadow-camera-far={60}
				shadow-bias={-0.0006}
				shadow-normalBias={0.03}
			/>
		</>
	);
};

/* --------------------------------- objetos -------------------------------- */
export const Arvore: React.FC<{position: [number, number, number]; s?: number; seed?: number}> = ({position, s = 1, seed = 1}) => {
	const m = useMemo(() => ({t: flat(CORES.tronco), a: flat(CORES.copa), b: flat(CORES.copa2)}), []);
	const r = 0.9 + hash1(seed) * 0.4;
	return (
		<group position={position} scale={s} rotation={[0, hash1(seed + 3) * 6, 0]}>
			<mesh position={[0, 0.7, 0]} material={m.t} castShadow>
				<cylinderGeometry args={[0.12, 0.18, 1.4, 6]} />
			</mesh>
			<mesh position={[0, 1.9, 0]} material={hash1(seed + 1) > 0.5 ? m.a : m.b} castShadow>
				<icosahedronGeometry args={[r, 0]} />
			</mesh>
			<mesh position={[0.45, 1.6, 0.2]} material={m.a} castShadow>
				<icosahedronGeometry args={[r * 0.6, 0]} />
			</mesh>
		</group>
	);
};

export const Nuvem: React.FC<{position: [number, number, number]; s?: number}> = ({position, s = 1}) => {
	const m = useMemo(() => flat(CORES.nuvem, {roughness: 1}), []);
	return (
		<group position={position} scale={s}>
			{[
				[0, 0, 0, 1.2],
				[1.2, -0.2, 0.1, 0.9],
				[-1.2, -0.25, 0, 0.85],
				[0.5, 0.5, -0.2, 0.8],
			].map(([x, y, z, r], i) => (
				<mesh key={i} position={[x, y, z]} material={m}>
					<icosahedronGeometry args={[r, 1]} />
				</mesh>
			))}
		</group>
	);
};

export const Montanha: React.FC<{position: [number, number, number]; r: number; h: number; cor?: string}> = ({position, r, h, cor = CORES.montanha}) => {
	const m = useMemo(() => flat(cor, {roughness: 1}), [cor]);
	return (
		<mesh position={[position[0], position[1] + h / 2, position[2]]} material={m}>
			<coneGeometry args={[r, h, 7]} />
		</mesh>
	);
};

/** Casa térrea low-poly: paredes creme, telhado terracota de duas águas, porta e janelas. */
export const Casa: React.FC<{position: [number, number, number]; w?: number; d?: number; h?: number; rotY?: number; cor?: string; telhado?: string}> = ({
	position,
	w = 7,
	d = 5,
	h = 2.8,
	rotY = 0,
	cor = CORES.parede,
	telhado = CORES.telhado,
}) => {
	const m = useMemo(() => ({p: flat(cor), t: flat(telhado), porta: flat(CORES.porta), v: flat(CORES.vidro, {roughness: 0.3}), moldura: flat('#FFFFFF')}), [cor, telhado]);
	const roof = useMemo(() => {
		const s = new THREE.Shape();
		s.moveTo(-w / 2 - 0.4, 0);
		s.lineTo(0, 1.6);
		s.lineTo(w / 2 + 0.4, 0);
		s.lineTo(-w / 2 - 0.4, 0);
		const g = new THREE.ExtrudeGeometry(s, {depth: d + 0.8, bevelEnabled: false});
		g.translate(0, 0, -(d + 0.8) / 2);
		return g;
	}, [w, d]);
	return (
		<group position={position} rotation={[0, rotY, 0]}>
			<mesh position={[0, h / 2, 0]} material={m.p} castShadow receiveShadow>
				<boxGeometry args={[w, h, d]} />
			</mesh>
			<mesh position={[0, h, 0]} geometry={roof} material={m.t} castShadow />
			<mesh position={[-w * 0.18, 0.95, d / 2 + 0.02]} material={m.porta}>
				<boxGeometry args={[0.95, 1.9, 0.06]} />
			</mesh>
			{[w * 0.15, w * 0.34].map((x, i) => (
				<group key={i} position={[x, 1.55, d / 2 + 0.02]}>
					<mesh material={m.moldura}>
						<boxGeometry args={[1.0, 0.9, 0.05]} />
					</mesh>
					<mesh position={[0, 0, 0.03]} material={m.v}>
						<boxGeometry args={[0.84, 0.74, 0.03]} />
					</mesh>
				</group>
			))}
		</group>
	);
};

/** Muro/cerca baixa ao longo de X. */
export const Muro: React.FC<{z: number; x0: number; x1: number; h?: number}> = ({z, x0, x1, h = 1.1}) => {
	const m = useMemo(() => flat(CORES.cerca), []);
	return (
		<mesh position={[(x0 + x1) / 2, h / 2, z]} material={m} castShadow receiveShadow>
			<boxGeometry args={[x1 - x0, h, 0.2]} />
		</mesh>
	);
};

/** Vizinhança de fundo (montanhas, prédios cinza, nuvens) — fica longe da ação. */
export const Fundo: React.FC<{buraco?: [number, number, number, number]; nuvens?: boolean}> = ({buraco = [0, 0, 0, 0], nuvens = true}) => {
	const pm = useMemo(() => flat(CORES.predio, {roughness: 1}), []);
	const gm = useMemo(() => flat(CORES.grama, {roughness: 1}), []);
	// gramado distante em 4 faixas em volta de `buraco` [x0, x1, z0, z1] (área do terreno detalhado)
	const [x0, x1, z0, z1] = buraco;
	const faixas: [number, number, number, number][] = [
		[-120, 120, -140, z0],
		[-120, 120, z1, 60],
		[-120, x0, z0, z1],
		[x1, 120, z0, z1],
	];
	return (
		<group>
			{faixas.map(([a, b, c, d], i) =>
				b - a > 0.01 && d - c > 0.01 ? (
					<mesh key={i} position={[(a + b) / 2, -0.02, (c + d) / 2]} rotation={[-Math.PI / 2, 0, 0]} material={gm} receiveShadow>
						<planeGeometry args={[b - a, d - c]} />
					</mesh>
				) : null,
			)}
			<Montanha position={[-30, 0, -75]} r={26} h={20} />
			<Montanha position={[10, 0, -85]} r={32} h={26} cor={CORES.montanha2} />
			<Montanha position={[42, 0, -70]} r={22} h={16} />
			{[
				[-18, -55, 5, 14],
				[-12, -60, 4, 20],
				[16, -58, 6, 17],
				[24, -62, 4, 23],
				[30, -54, 5, 12],
			].map(([x, z, w, h], i) => (
				<mesh key={i} position={[x, h / 2, z]} material={pm}>
					<boxGeometry args={[w, h, w]} />
				</mesh>
			))}
			{nuvens && (
				<>
					<Nuvem position={[-9, 15, -30]} s={1.6} />
					<Nuvem position={[8, 17, -36]} s={2} />
					<Nuvem position={[20, 13, -26]} s={1.3} />
					<Nuvem position={[-22, 18, -40]} s={2.2} />
				</>
			)}
		</group>
	);
};
