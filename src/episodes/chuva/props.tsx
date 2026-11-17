// Objetos do episódio "A chuva da vovó": nuvem-de-choro com chuva, guarda-chuva, rádio, fita, bolo,
// varal de lâmpadas, casas, poste, cerca, barraca da feira... Tudo com sombra real e determinístico.
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {RoundedBox} from '@react-three/drei';
import {Glow} from '../../components/Lighting';
import {hash1, mulberry32} from '../../style/random';
import {canvasTex, glow, memo, plain, texMat} from './assets';

type G = Omit<React.ComponentProps<'group'>, 'children'>;
const sh = {castShadow: true, receiveShadow: true};
const box = (w: number, h: number, d: number) => memo(`pbx-${w}-${h}-${d}`, () => new THREE.BoxGeometry(w, h, d));

/* ------------------------------------------------------------------ */
/* Nuvem de choro + chuva                                              */
/* ------------------------------------------------------------------ */

const PUFFS = (() => {
	const r = mulberry32(42);
	const out: {p: [number, number, number]; s: number}[] = [];
	for (let i = 0; i < 13; i++) {
		const a = (i / 13) * Math.PI * 2 + r() * 0.4;
		const rr = i < 1 ? 0 : 0.35 + r() * 0.5;
		out.push({p: [Math.cos(a) * rr, (r() - 0.3) * 0.25 + (rr < 0.5 ? 0.18 : 0), Math.sin(a) * rr * 0.75], s: 0.32 + r() * 0.22 + (rr < 0.5 ? 0.12 : 0)});
	}
	return out;
})();

export type CloudProps = {
	/** segundos (tempo do plano) — anima gotas */
	t: number;
	/** 0..1 nuvem surgindo (escala) */
	form?: number;
	/** 0..1 quantidade de chuva */
	rain?: number;
	/** largura total da nuvem */
	size?: number;
	/** distância da base da nuvem até o chão */
	fall?: number;
	/** 0..1 clarão de raio dentro da nuvem */
	flash?: number;
	drops?: number;
	seed?: number;
	/** cor da nuvem (mais clara no fim) */
	color?: string;
	/** só a chuva (sem nuvem) — chuva geral do flashback */
	noCloud?: boolean;
	/** raio da área de chuva (padrão = tamanho da nuvem) */
	radius?: number;
} & G;

export const RainCloud: React.FC<CloudProps> = ({t, form = 1, rain = 1, size = 1.6, fall = 3, flash = 0, drops = 180, seed = 3, color = '#5D6472', noCloud = false, radius, ...g}) => {
	const puffMat = useMemo(() => new THREE.MeshStandardMaterial({color, roughness: 1, flatShading: true, emissive: '#CFE3FF', emissiveIntensity: 0}), [color]);
	puffMat.emissiveIntensity = flash * 0.7;
	const puffGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
	const dropGeo = useMemo(() => new THREE.BoxGeometry(0.018, 0.32, 0.018), []);
	const dropMat = useMemo(() => new THREE.MeshStandardMaterial({color: '#BFE0FF', emissive: '#6FA8DC', emissiveIntensity: 0.6, transparent: true, opacity: 0.75, roughness: 0.1}), []);
	const ringGeo = useMemo(() => new THREE.RingGeometry(0.06, 0.09, 16).rotateX(-Math.PI / 2), []);
	const ringMat = useMemo(() => new THREE.MeshBasicMaterial({color: '#E4F2FF', transparent: true, opacity: 0.7, depthWrite: false}), []);
	const dropsRef = useRef<THREE.InstancedMesh>(null);
	const ringsRef = useRef<THREE.InstancedMesh>(null);
	const nRings = Math.round(drops / 4);
	const R = radius ?? size * 0.42;
	const speed = 7.5;
	useLayoutEffect(() => {
		const m = new THREE.Matrix4();
		const q = new THREE.Quaternion();
		const im = dropsRef.current;
		if (im) {
			for (let i = 0; i < drops; i++) {
				const a = hash1(i * 3.1 + seed) * Math.PI * 2;
				const rr = Math.sqrt(hash1(i * 7.7 + seed)) * R;
				const ph = hash1(i * 1.3 + seed * 9);
				const cyc = (t * speed) / fall + ph;
				const k = cyc - Math.floor(cyc);
				const on = hash1(i * 5.9 + seed) < rain;
				const y = -k * fall;
				m.compose(new THREE.Vector3(Math.cos(a) * rr, on ? y : 999, Math.sin(a) * rr * 0.8), q, new THREE.Vector3(1, 1, 1));
				im.setMatrixAt(i, m);
			}
			im.instanceMatrix.needsUpdate = true;
		}
		const rm = ringsRef.current;
		if (rm) {
			for (let i = 0; i < nRings; i++) {
				const a = hash1(i * 4.3 + seed + 50) * Math.PI * 2;
				const rr = Math.sqrt(hash1(i * 2.9 + seed + 50)) * R;
				const cyc = t * 2.4 + hash1(i * 8.1 + seed);
				const k = cyc - Math.floor(cyc);
				const on = hash1(i * 5.1 + seed + 3) < rain;
				const s = 0.4 + k * 2.2;
				m.compose(new THREE.Vector3(Math.cos(a) * rr, on ? -fall + 0.01 : 999, Math.sin(a) * rr * 0.8), q, new THREE.Vector3(s, 1, s));
				rm.setMatrixAt(i, m);
			}
			rm.instanceMatrix.needsUpdate = true;
		}
	});
	ringMat.opacity = 0.55 * rain;
	const f = Math.max(0.001, form);
	return (
		<group {...g}>
			{!noCloud && <group scale={[f * size, f * size * 0.8, f * size]}>
				{PUFFS.map((p, i) => (
					<mesh key={i} geometry={puffGeo} material={puffMat} position={[p.p[0], p.p[1] + Math.sin(t * 1.3 + i) * 0.02, p.p[2]]} scale={p.s} castShadow />
				))}
			</group>}
			{flash > 0.05 && <pointLight color="#DDEBFF" intensity={flash * 60} distance={12} position={[0, -0.3, 0]} />}
			{rain > 0.01 && (
				<>

					<instancedMesh ref={dropsRef} args={[dropGeo, dropMat, drops]} frustumCulled={false} />
					<instancedMesh ref={ringsRef} args={[ringGeo, ringMat, nRings]} frustumCulled={false} />
					{/* poça brilhante embaixo */}
					{!noCloud && <mesh position={[0, -fall + 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
						<circleGeometry args={[R * 1.15 * Math.min(1, rain * 1.5), 28]} />
						<meshStandardMaterial color="#3D4A5A" roughness={0.05} metalness={0.3} transparent opacity={0.55} />
					</mesh>}
				</>
			)}
		</group>
	);
};

/* ------------------------------------------------------------------ */
/* Guarda-chuva                                                        */
/* ------------------------------------------------------------------ */

export const Umbrella: React.FC<{open?: number; color?: string; color2?: string} & G> = ({open = 1, color = '#2B4C7E', color2 = '#E8D9B5', ...g}) => {
	const segs = 8;
	const r = 0.18 + open * 0.85;
	const h = 0.12 + open * 0.28;
	return (
		<group {...g}>
			<mesh {...sh} geometry={box(0.04, 1.4, 0.04)} position={[0, 0.7, 0]} material={plain('#3A2E26', 0.5)} />
			<mesh {...sh} position={[0, 0.02, 0.06]} rotation={[0, 0, Math.PI / 2]} material={plain('#5A3A22', 0.5)}>
				<torusGeometry args={[0.08, 0.02, 6, 10, Math.PI]} />
			</mesh>
			<group position={[0, 1.4 - (1 - open) * 0.4, 0]}>
				{Array.from({length: segs}).map((_, i) => (
					<mesh key={i} {...sh} rotation={[0, (i / segs) * Math.PI * 2, 0]} material={plain(i % 2 ? color : color2, 0.6)}>
						<coneGeometry args={[r, h + (1 - open) * 0.7, segs, 1, true, 0, (Math.PI * 2) / segs]} />
					</mesh>
				))}
			</group>
		</group>
	);
};

/* ------------------------------------------------------------------ */
/* Rádio antigo + fita                                                 */
/* ------------------------------------------------------------------ */

const grilleTex = () =>
	canvasTex('grille', 128, 128, (c) => {
		c.fillStyle = '#E7D6B0';
		c.fillRect(0, 0, 128, 128);
		c.fillStyle = '#8B6B45';
		for (let y = 6; y < 128; y += 12) for (let x = 6; x < 128; x += 12) c.fillRect(x, y, 5, 5);
	});

export const Radio: React.FC<{on?: number; open?: number; t?: number} & G> = ({on = 0, open = 0, t = 0, ...g}) => (
	<group {...g}>
		<RoundedBox args={[1.1, 0.66, 0.42]} radius={0.08} position={[0, 0.33, 0]} {...sh} material={texMat('madeira', 1, 1, {tint: '#B07848', rough: 0.45})} />
		{/* grelha */}
		<mesh position={[-0.18, 0.36, 0.212]}>
			<planeGeometry args={[0.56, 0.44]} />
			<meshStandardMaterial map={grilleTex()} roughness={0.9} />
		</mesh>
		{/* mostrador */}
		<mesh position={[0.32, 0.46, 0.215]}>
			<planeGeometry args={[0.3, 0.14]} />
			<meshStandardMaterial color="#F5E6B8" emissive="#FFC46B" emissiveIntensity={on * 1.6} roughness={0.4} />
		</mesh>
		<mesh position={[0.32 - 0.1 + Math.sin(t * 0.7) * 0.04 * on, 0.46, 0.218]}>
			<planeGeometry args={[0.012, 0.12]} />
			<meshBasicMaterial color="#B0302A" />
		</mesh>
		{[0.22, 0.42].map((x, i) => (
			<mesh key={x} {...sh} position={[x, 0.22, 0.24]} rotation={[Math.PI / 2, i ? t * on : 0, 0]} material={plain('#3A2A1E', 0.4)}>
				<cylinderGeometry args={[0.055, 0.055, 0.06, 14]} />
			</mesh>
		))}
		{/* antena */}
		<mesh {...sh} position={[0.4, 0.95, -0.1]} rotation={[0, 0, -0.35]} material={plain('#C8CCD2', 0.25, 0.9)}>
			<cylinderGeometry args={[0.008, 0.008, 0.7, 6]} />
		</mesh>
		{/* tampa aberta (conserto) */}
		{open > 0 && (
			<group>
				<mesh position={[0, 0.33, -0.215]} rotation={[0, Math.PI, 0]}>
					<planeGeometry args={[0.95, 0.5]} />
					<meshStandardMaterial color="#1E5A3A" roughness={0.6} />
				</mesh>
				{[-0.3, -0.1, 0.1, 0.3].map((x, i) => (
					<mesh key={x} {...sh} position={[x, 0.3 + (i % 2) * 0.1, -0.25]} material={i % 2 ? plain('#C9A13A', 0.3, 0.7) : plain('#3A6FD8', 0.5)}>
						<cylinderGeometry args={[0.04, 0.04, 0.1, 10]} />
					</mesh>
				))}
			</group>
		)}
		{on > 0.05 && (
			<Glow>
				<mesh position={[0.32, 0.46, 0.22]}>
					<planeGeometry args={[0.26, 0.1]} />
					<meshBasicMaterial color={new THREE.Color('#FFB85C').multiplyScalar(1 + on * 2)} transparent opacity={0.5 * on} toneMapped={false} />
				</mesh>
			</Glow>
		)}
	</group>
);

const tapeLabel = () =>
	canvasTex('fita', 512, 200, (c) => {
		c.fillStyle = '#F4ECD8';
		c.fillRect(0, 0, 512, 200);
		c.fillStyle = '#E4B85C';
		c.fillRect(0, 0, 512, 34);
		c.fillStyle = '#2A2A6A';
		c.font = "italic 700 52px 'Comic Sans MS', 'Segoe Print', cursive";
		c.textAlign = 'center';
		c.fillText('Dulce & Zeca', 256, 100);
		c.font = "italic 600 34px 'Comic Sans MS', cursive";
		c.fillText('nossa música ♥', 256, 160);
	});

export const Cassette: React.FC<{spin?: number} & G> = ({spin = 0, ...g}) => (
	<group {...g}>
		<mesh {...sh} geometry={box(1, 0.64, 0.1)} material={plain('#2A2A30', 0.4)} />
		<mesh position={[0, 0.1, 0.051]}>
			<planeGeometry args={[0.86, 0.3]} />
			<meshStandardMaterial map={tapeLabel()} roughness={0.8} />
		</mesh>
		<mesh position={[0, -0.15, 0.051]}>
			<planeGeometry args={[0.5, 0.16]} />
			<meshStandardMaterial color="#111" roughness={0.3} />
		</mesh>
		{[-0.15, 0.15].map((x) => (
			<mesh key={x} position={[x, -0.15, 0.06]} rotation={[Math.PI / 2, spin, 0]} material={plain('#E8E8E8', 0.4)}>
				<cylinderGeometry args={[0.055, 0.055, 0.02, 6]} />
			</mesh>
		))}
	</group>
);

/* ------------------------------------------------------------------ */
/* Festa: mesa, bolo, varal de lâmpadas, bandeirinhas, cadeiras        */
/* ------------------------------------------------------------------ */

export const Table: React.FC<{w?: number; d?: number; cloth?: string} & G> = ({w = 2.4, d = 1.2, cloth = '#F4EFE6', ...g}) => (
	<group {...g}>
		<mesh {...sh} geometry={box(w, 0.08, d)} position={[0, 1.0, 0]} material={plain(cloth, 0.9)} />
		<mesh {...sh} geometry={box(w + 0.02, 0.3, d + 0.02)} position={[0, 0.86, 0]} material={plain(cloth, 0.9)} />
		{[-1, 1].map((sx) => [-1, 1].map((sz) => <mesh key={`${sx}${sz}`} {...sh} geometry={box(0.09, 1, 0.09)} position={[sx * (w / 2 - 0.1), 0.5, sz * (d / 2 - 0.1)]} material={texMat('madeira', 0.2, 1, {tint: '#9A6A44'})} />))}
	</group>
);

const cakeTopTex = (n: string) =>
	canvasTex(`bolo-${n}`, 256, 256, (c) => {
		c.fillStyle = '#FFF4F8';
		c.fillRect(0, 0, 256, 256);
		c.fillStyle = '#E86A9A';
		c.font = "900 120px 'Montserrat Black', 'Arial Black', sans-serif";
		c.textAlign = 'center';
		c.textBaseline = 'middle';
		c.fillText(n, 128, 140);
	});

export const Cake: React.FC<{n?: string; t?: number; candles?: boolean} & G> = ({n = '80', t = 0, candles = true, ...g}) => (
	<group {...g}>
		<mesh {...sh} position={[0, 0.18, 0]} material={plain('#F7E3EC', 0.7)}>
			<cylinderGeometry args={[0.42, 0.44, 0.36, 24]} />
		</mesh>
		<mesh {...sh} position={[0, 0.44, 0]} material={plain('#FBF3F6', 0.7)}>
			<cylinderGeometry args={[0.3, 0.32, 0.2, 24]} />
		</mesh>
		<mesh position={[0, 0.545, 0]} rotation={[-Math.PI / 2, 0, 0]}>
			<circleGeometry args={[0.3, 24]} />
			<meshStandardMaterial map={cakeTopTex(n)} roughness={0.7} />
		</mesh>
		{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
			<mesh key={i} position={[Math.cos((i / 8) * Math.PI * 2) * 0.43, 0.34, Math.sin((i / 8) * Math.PI * 2) * 0.43]} material={plain(i % 2 ? '#E86A9A' : '#7FC8E8', 0.6)}>
				<sphereGeometry args={[0.05, 8, 6]} />
			</mesh>
		))}
		{candles &&
			n.split('').map((d, i) => (
				<group key={i} position={[(i - (n.length - 1) / 2) * 0.16, 0.55, -0.12]}>
					<mesh {...sh} position={[0, 0.14, 0]} material={plain('#7FC8E8', 0.5)}>
						<boxGeometry args={[0.1, 0.24, 0.04]} />
					</mesh>
					<Glow>
						<mesh position={[0, 0.31 + Math.sin(t * 13 + i) * 0.006, 0]} scale={[1, 1.4 + Math.sin(t * 17 + i) * 0.15, 1]} material={glow('#FFB347', 6)}>
							<sphereGeometry args={[0.03, 8, 6]} />
						</mesh>
					</Glow>
				</group>
			))}
	</group>
);

/** Varal de lâmpadas entre dois pontos (catenária). */
export const StringLights: React.FC<{from: [number, number, number]; to: [number, number, number]; n?: number; sag?: number; on?: number}> = ({from, to, n = 14, sag = 0.6, on = 1}) => {
	const pts = useMemo(() => {
		const a = new THREE.Vector3(...from);
		const b = new THREE.Vector3(...to);
		return Array.from({length: n}, (_, i) => {
			const k = (i + 0.5) / n;
			const p = a.clone().lerp(b, k);
			p.y -= Math.sin(k * Math.PI) * sag;
			return p;
		});
	}, [from, to, n, sag]);
	const curve = useMemo(() => {
		const a = new THREE.Vector3(...from);
		const b = new THREE.Vector3(...to);
		const c = Array.from({length: 17}, (_, i) => {
			const k = i / 16;
			const p = a.clone().lerp(b, k);
			p.y -= Math.sin(k * Math.PI) * sag;
			return p;
		});
		return new THREE.CatmullRomCurve3(c);
	}, [from, to, sag]);
	return (
		<group>
			<mesh>
				<tubeGeometry args={[curve, 32, 0.012, 4]} />
				<meshStandardMaterial color="#222" />
			</mesh>
			<Glow>
				{pts.map((p, i) => (
					<mesh key={i} position={[p.x, p.y - 0.09, p.z]} material={on > 0.5 ? glow(i % 3 === 0 ? '#FFD27A' : i % 3 === 1 ? '#FFB56B' : '#FFF0C0', 5) : plain('#DDD')}>
						<sphereGeometry args={[0.07, 10, 8]} />
					</mesh>
				))}
			</Glow>
		</group>
	);
};

const FLAG_COLORS = ['#F2C230', '#2BA59B', '#3A6FD8', '#F28C38', '#8E5BD0', '#7BC043'];
export const Bunting: React.FC<{from: [number, number, number]; to: [number, number, number]; n?: number; sag?: number}> = ({from, to, n = 16, sag = 0.5}) => {
	const a = new THREE.Vector3(...from);
	const b = new THREE.Vector3(...to);
	const yaw = Math.atan2(-(b.z - a.z), b.x - a.x);
	return (
		<group>
			{Array.from({length: n}, (_, i) => {
				const k = (i + 0.5) / n;
				const p = a.clone().lerp(b, k);
				p.y -= Math.sin(k * Math.PI) * sag;
				return (
					<mesh key={i} position={p} rotation={[0, yaw, Math.PI]} castShadow material={plain(FLAG_COLORS[i % FLAG_COLORS.length], 0.8)}>
						<coneGeometry args={[0.16, 0.36, 3]} />
					</mesh>
				);
			})}
		</group>
	);
};

export const Chair: React.FC<{color?: string} & G> = ({color = '#F2F0EA', ...g}) => (
	<group {...g}>
		<mesh {...sh} geometry={box(0.6, 0.07, 0.6)} position={[0, 0.62, 0]} material={plain(color, 0.6)} />
		<mesh {...sh} geometry={box(0.6, 0.7, 0.07)} position={[0, 0.98, -0.27]} material={plain(color, 0.6)} />
		{[-1, 1].map((sx) => [-1, 1].map((sz) => <mesh key={`${sx}${sz}`} {...sh} geometry={box(0.06, 0.62, 0.06)} position={[sx * 0.26, 0.31, sz * 0.26]} material={plain(color, 0.6)} />))}
	</group>
);

export const Armchair: React.FC<{color?: string} & G> = ({color = '#8C4B5A', ...g}) => (
	<group {...g}>
		<RoundedBox args={[1.4, 0.5, 1.2]} radius={0.1} position={[0, 0.45, 0]} {...sh} material={plain(color, 0.95)} />
		<RoundedBox args={[1.4, 1.2, 0.3]} radius={0.12} position={[0, 1.05, -0.48]} {...sh} material={plain(color, 0.95)} />
		{[-1, 1].map((s) => (
			<RoundedBox key={s} args={[0.26, 0.42, 1.2]} radius={0.1} position={[s * 0.6, 0.85, 0]} {...sh} material={plain(color, 0.95)} />
		))}
		<RoundedBox args={[1.0, 0.16, 0.9]} radius={0.06} position={[0, 0.76, 0.08]} {...sh} material={plain('#A86272', 0.95)} />
	</group>
);

/* ------------------------------------------------------------------ */
/* Cidade: casas, igreja, poste, cerca, árvore, barraca               */
/* ------------------------------------------------------------------ */

const windowTex = (lit: boolean) =>
	canvasTex(`win-${lit}`, 128, 160, (c) => {
		c.fillStyle = lit ? '#FFD88A' : '#2E3D4E';
		c.fillRect(0, 0, 128, 160);
		if (!lit) {
			const gr = c.createLinearGradient(0, 0, 128, 160);
			gr.addColorStop(0, 'rgba(255,255,255,0.35)');
			gr.addColorStop(0.5, 'rgba(255,255,255,0.0)');
			c.fillStyle = gr;
			c.fillRect(0, 0, 128, 160);
		}
		c.fillStyle = '#F4F1E6';
		c.fillRect(0, 0, 128, 10);
		c.fillRect(0, 150, 128, 10);
		c.fillRect(0, 0, 10, 160);
		c.fillRect(118, 0, 10, 160);
		c.fillRect(59, 0, 10, 160);
		c.fillRect(0, 75, 128, 10);
	});

export const Window3D: React.FC<{w?: number; h?: number; lit?: boolean; shutters?: string} & G> = ({w = 1.1, h = 1.4, lit = false, shutters, ...g}) => (
	<group {...g}>
		<mesh {...sh} geometry={box(w + 0.16, 0.1, 0.2)} position={[0, -h / 2 - 0.05, 0.08]} material={plain('#F4F1E6', 0.6)} />
		{lit ? (
			<Glow>
				<mesh position={[0, 0, 0.012]}>
					<planeGeometry args={[w, h]} />
					<meshStandardMaterial map={windowTex(true)} emissive="#FFC870" emissiveIntensity={1.4} emissiveMap={windowTex(true)} />
				</mesh>
			</Glow>
		) : (
			<mesh position={[0, 0, 0.012]}>
				<planeGeometry args={[w, h]} />
				<meshStandardMaterial map={windowTex(false)} roughness={0.15} metalness={0.2} />
			</mesh>
		)}
		{shutters &&
			[-1, 1].map((s) => <mesh key={s} {...sh} geometry={box(w / 2, h + 0.06, 0.05)} position={[s * (w * 0.75 + 0.04), 0, 0.03]} material={plain(shutters, 0.7)} />)}
	</group>
);

export const House: React.FC<{w?: number; d?: number; h?: number; wall?: 'tijolo' | string; door?: string; shutters?: string; lit?: boolean; roofColor?: string} & G> = ({
	w = 7,
	d = 6,
	h = 4.6,
	wall = 'tijolo',
	door = '#2B5D4A',
	shutters = '#2B5D4A',
	lit = false,
	roofColor = '#ffffff',
	...g
}) => {
	const wallMat = wall === 'tijolo' ? texMat('tijolo', w / 2.4, h / 2.4) : plain(wall, 0.9);
	const roofGeo = useMemo(() => {
		const s = new THREE.Shape();
		s.moveTo(-w / 2 - 0.4, 0);
		s.lineTo(w / 2 + 0.4, 0);
		s.lineTo(0, w * 0.36);
		s.lineTo(-w / 2 - 0.4, 0);
		const geo = new THREE.ExtrudeGeometry(s, {depth: d + 0.6, bevelEnabled: false});
		geo.translate(0, 0, -(d + 0.6) / 2);
		return geo;
	}, [w, d]);
	return (
		<group {...g}>
			<mesh {...sh} geometry={box(w, h, d)} position={[0, h / 2, 0]} material={wallMat} />
			<mesh {...sh} geometry={roofGeo} position={[0, h, 0]} material={texMat('telha', w / 2.2, w / 2.2, {tint: roofColor})} />
			<mesh {...sh} geometry={box(w + 0.1, 0.25, d + 0.1)} position={[0, 0.12, 0]} material={plain('#CFC6B8', 0.9)} />
			{/* porta */}
			<mesh {...sh} geometry={box(1.15, 2.4, 0.12)} position={[0, 1.2, d / 2 + 0.02]} material={plain(door, 0.55)} />
			<mesh position={[0.4, 1.2, d / 2 + 0.1]} material={plain('#D9B84A', 0.3, 0.8)}>
				<sphereGeometry args={[0.06, 8, 6]} />
			</mesh>
			<mesh {...sh} geometry={box(1.4, 0.15, 0.2)} position={[0, 2.5, d / 2 + 0.06]} material={plain('#F4F1E6', 0.6)} />
			{[-1, 1].map((s) => (
				<Window3D key={s} lit={lit} shutters={shutters} position={[s * w * 0.3, 2.2, d / 2 + 0.01]} />
			))}
			{h > 5 && [-1, 1].map((s) => <Window3D key={`u${s}`} lit={lit} shutters={shutters} w={0.9} h={1.1} position={[s * w * 0.3, h - 1.3, d / 2 + 0.01]} />)}
		</group>
	);
};

const clockTex = () =>
	canvasTex('relogio', 256, 256, (c) => {
		c.fillStyle = '#F4EEDC';
		c.beginPath();
		c.arc(128, 128, 124, 0, Math.PI * 2);
		c.fill();
		c.strokeStyle = '#1B1416';
		c.lineWidth = 10;
		c.stroke();
		c.lineWidth = 8;
		for (let i = 0; i < 12; i++) {
			const a = (i / 12) * Math.PI * 2;
			c.beginPath();
			c.moveTo(128 + Math.cos(a) * 96, 128 + Math.sin(a) * 96);
			c.lineTo(128 + Math.cos(a) * 112, 128 + Math.sin(a) * 112);
			c.stroke();
		}
		c.lineWidth = 12;
		c.beginPath();
		c.moveTo(128, 128);
		c.lineTo(128, 60);
		c.stroke();
		c.lineWidth = 9;
		c.beginPath();
		c.moveTo(128, 128);
		c.lineTo(188, 128);
		c.stroke();
	});

export const ChurchTower: React.FC<G> = (g) => (
	<group {...g}>
		<mesh {...sh} geometry={box(5, 12, 5)} position={[0, 6, 0]} material={plain('#EDE6D6', 0.9)} />
		<mesh {...sh} geometry={box(5.4, 0.4, 5.4)} position={[0, 12.2, 0]} material={plain('#CFC6B8', 0.9)} />
		<mesh {...sh} position={[0, 15.4, 0]} rotation={[0, Math.PI / 4, 0]} material={texMat('telha', 2, 2, {tint: '#C9B0A0'})}>
			<coneGeometry args={[3.8, 6, 4]} />
		</mesh>
		<mesh position={[0, 9.4, 2.52]}>
			<circleGeometry args={[1.4, 32]} />
			<meshStandardMaterial map={clockTex()} roughness={0.6} />
		</mesh>
		<mesh {...sh} geometry={box(1.8, 3.4, 0.2)} position={[0, 1.7, 2.52]} material={plain('#5A3A22', 0.6)} />
		<mesh {...sh} geometry={box(0.1, 1.6, 0.1)} position={[0, 19.2, 0]} material={plain('#C9A13A', 0.3, 0.8)} />
		<mesh {...sh} geometry={box(0.8, 0.1, 0.1)} position={[0, 19.5, 0]} material={plain('#C9A13A', 0.3, 0.8)} />
	</group>
);

export const LampPost: React.FC<{on?: boolean} & G> = ({on = false, ...g}) => (
	<group {...g}>
		<mesh {...sh} position={[0, 2.2, 0]} material={plain('#22262C', 0.4, 0.6)}>
			<cylinderGeometry args={[0.07, 0.11, 4.4, 8]} />
		</mesh>
		<mesh {...sh} geometry={box(0.5, 0.08, 0.5)} position={[0, 4.4, 0]} material={plain('#22262C', 0.4, 0.6)} />
		{on ? (
			<Glow>
				<mesh position={[0, 4.68, 0]} material={glow('#FFD27A', 5)}>
					<boxGeometry args={[0.36, 0.5, 0.36]} />
				</mesh>
			</Glow>
		) : (
			<mesh position={[0, 4.68, 0]} material={plain('#E8E4D8', 0.2, 0.1)}>
				<boxGeometry args={[0.36, 0.5, 0.36]} />
			</mesh>
		)}
		<mesh {...sh} position={[0, 5.04, 0]} rotation={[0, Math.PI / 4, 0]} material={plain('#22262C', 0.4, 0.6)}>
			<coneGeometry args={[0.38, 0.3, 4]} />
		</mesh>
		{on && <pointLight color="#FFC46B" intensity={18} distance={9} position={[0, 4.4, 0]} />}
	</group>
);

export const Picket: React.FC<{len?: number; color?: string} & G> = ({len = 10, color = '#F4F1E6', ...g}) => {
	const n = Math.round(len / 0.38);
	return (
		<group {...g}>
			{Array.from({length: n}, (_, i) => (
				<group key={i} position={[-len / 2 + i * 0.38 + 0.19, 0, 0]}>
					<mesh {...sh} geometry={box(0.2, 1.2, 0.06)} position={[0, 0.6, 0]} material={plain(color, 0.7)} />
					<mesh {...sh} position={[0, 1.24, 0]} rotation={[0, 0, Math.PI / 4]} geometry={box(0.14, 0.14, 0.06)} material={plain(color, 0.7)} />
				</group>
			))}
			{[0.35, 0.95].map((y) => <mesh key={y} {...sh} geometry={box(len, 0.09, 0.05)} position={[0, y, -0.05]} material={plain(color, 0.7)} />)}
		</group>
	);
};

export const BlockTree: React.FC<{seed?: number; dry?: number} & G> = ({seed = 1, dry = 0, ...g}) => {
	const r = mulberry32(seed);
	const h = 2.4 + r() * 1.2;
	const leaf = new THREE.Color('#4E9A3A').lerp(new THREE.Color('#B9A04A'), dry).getStyle();
	return (
		<group {...g}>
			<mesh {...sh} geometry={box(0.45, h, 0.45)} position={[0, h / 2, 0]} material={plain('#6B4A32', 0.9)} />
			{[0, 1, 2, 3].map((i) => {
				const s = 1.5 + r() * 1.1;
				return <mesh key={i} {...sh} geometry={box(s, s * 0.8, s)} position={[(r() - 0.5) * 1.4, h + 0.4 + i * 0.45, (r() - 0.5) * 1.4]} rotation={[0, r() * 3, 0]} material={plain(leaf, 0.85)} />;
			})}
		</group>
	);
};

const crateSignTex = () =>
	canvasTex('cebola', 512, 220, (c) => {
		c.fillStyle = '#F4EFE0';
		c.fillRect(0, 0, 512, 220);
		c.strokeStyle = '#1B1416';
		c.lineWidth = 12;
		c.strokeRect(8, 8, 496, 204);
		c.fillStyle = '#1B1416';
		c.font = "900 92px 'Montserrat Black', 'Arial Black', sans-serif";
		c.textAlign = 'center';
		c.fillText('CEBOLA', 256, 108);
		c.font = "900 56px 'Montserrat Black', 'Arial Black', sans-serif";
		c.fillText('R$ 5 o quilo', 256, 180);
	});

export const OnionStall: React.FC<G> = (g) => {
	const onions = useMemo(() => {
		const r = mulberry32(5);
		return Array.from({length: 46}, () => [(r() - 0.5) * 2.6, r() * 0.12, (r() - 0.5) * 1.0] as [number, number, number]);
	}, []);
	return (
		<group {...g}>
			<mesh {...sh} geometry={box(3.2, 0.12, 1.5)} position={[0, 1.0, 0]} material={texMat('madeira', 2, 1, {tint: '#B58A5A'})} />
			{[-1, 1].map((sx) => [-1, 1].map((sz) => <mesh key={`${sx}${sz}`} {...sh} geometry={box(0.1, 3.2, 0.1)} position={[sx * 1.5, 1.6, sz * 0.7]} material={plain('#7A5A3A', 0.8)} />))}
			{/* toldo listrado */}
			{Array.from({length: 8}, (_, i) => (
				<mesh key={i} {...sh} geometry={box(0.42, 0.06, 1.9)} position={[-1.47 + i * 0.42, 3.2, 0.05]} rotation={[0.18, 0, 0]} material={plain(i % 2 ? '#F4EFE6' : '#2BA59B', 0.8)} />
			))}
			{onions.map((p, i) => (
				<mesh key={i} {...sh} position={[p[0], 1.14 + p[1], p[2]]} scale={[1, 0.85, 1]} material={plain(i % 3 ? '#C98B4A' : '#B0607A', 0.6)}>
					<sphereGeometry args={[0.12, 10, 8]} />
				</mesh>
			))}
			<mesh position={[0, 1.55, 0.78]} rotation={[-0.1, 0, 0]}>
				<planeGeometry args={[1.4, 0.6]} />
				<meshStandardMaterial map={crateSignTex()} roughness={0.8} />
			</mesh>
		</group>
	);
};

/** Arco de casamento com flores. */
export const WeddingArch: React.FC<G> = (g) => {
	const r = mulberry32(8);
	const flowers = Array.from({length: 40}, (_, i) => {
		const a = (i / 39) * Math.PI;
		return {p: [Math.cos(a) * 1.9, 3 + Math.sin(a) * 1.5, (r() - 0.5) * 0.3] as [number, number, number], c: ['#F7F4EE', '#F6C6D6', '#F2E2A0'][i % 3]};
	});
	return (
		<group {...g}>
			{[-1, 1].map((s) => <mesh key={s} {...sh} geometry={box(0.2, 3, 0.2)} position={[s * 1.9, 1.5, 0]} material={plain('#F4F1E6', 0.6)} />)}
			{flowers.map((f, i) => (
				<mesh key={i} {...sh} position={f.p} material={plain(f.c, 0.8)}>
					<icosahedronGeometry args={[0.2, 0]} />
				</mesh>
			))}
		</group>
	);
};

/** Bebê enrolado na manta. */
export const Baby: React.FC<{crying?: boolean} & G> = ({crying = true, ...g}) => (
	<group {...g}>
		<RoundedBox args={[0.42, 0.7, 0.36]} radius={0.12} {...sh} material={plain('#BFE3F2', 0.9)} />
		<RoundedBox args={[0.3, 0.3, 0.28]} radius={0.1} position={[0, 0.46, 0.02]} {...sh} material={plain('#F3CDA8', 0.6)} />
		<mesh position={[0, 0.46, 0.165]}>
			<planeGeometry args={[0.28, 0.28]} />
			<meshStandardMaterial
				transparent
				map={canvasTex(`bebe-${crying}`, 128, 128, (c) => {
					c.fillStyle = '#1B1416';
					c.lineWidth = 7;
					c.strokeStyle = '#1B1416';
					c.beginPath();
					c.moveTo(30, 52);
					c.quadraticCurveTo(42, 40, 54, 52);
					c.moveTo(74, 52);
					c.quadraticCurveTo(86, 40, 98, 52);
					c.stroke();
					c.beginPath();
					c.ellipse(64, 90, crying ? 18 : 8, crying ? 16 : 5, 0, 0, Math.PI * 2);
					c.fill();
					if (crying) {
						c.fillStyle = 'rgba(120,190,255,0.95)';
						c.fillRect(34, 58, 8, 40);
						c.fillRect(86, 58, 8, 40);
					}
				})}
			/>
		</mesh>
	</group>
);

/** Sapatos da vovó (no gramado). */
export const Shoes: React.FC<G> = (g) => (
	<group {...g}>
		{[-0.18, 0.18].map((x, i) => (
			<group key={x} position={[x, 0, i * 0.1]} rotation={[0, i ? 0.3 : -0.15, 0]}>
				<RoundedBox args={[0.26, 0.16, 0.52]} radius={0.06} position={[0, 0.08, 0]} {...sh} material={plain('#6B3A2A', 0.45)} />
				<mesh {...sh} geometry={box(0.08, 0.16, 0.08)} position={[0, 0.08, -0.22]} material={plain('#4A2A1E', 0.5)} />
			</group>
		))}
	</group>
);

/** Ferro de solda com faísca na ponta. */
export const SolderingIron: React.FC<{hot?: number; t?: number} & G> = ({hot = 1, t = 0, ...g}) => (
	<group {...g}>
		<mesh {...sh} position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]} material={plain('#2B6FD8', 0.5)}>
			<cylinderGeometry args={[0.05, 0.05, 0.3, 10]} />
		</mesh>
		<mesh {...sh} position={[0, 0, 0.36]} rotation={[Math.PI / 2, 0, 0]} material={plain('#C8CCD2', 0.25, 0.9)}>
			<cylinderGeometry args={[0.012, 0.03, 0.24, 8]} />
		</mesh>
		<Glow>
			<mesh position={[0, 0, 0.49]} material={glow('#FF8A3A', 3 + hot * 4 + Math.sin(t * 40) * 1.5)}>
				<sphereGeometry args={[0.018, 8, 6]} />
			</mesh>
		</Glow>
		{hot > 0.5 && <pointLight color="#FF9A4A" intensity={2.5 + Math.abs(Math.sin(t * 31)) * 2} distance={2.5} position={[0, 0.05, 0.5]} />}
	</group>
);

/** Moldura de foto (casamento etc.). */
export const Frame: React.FC<{draw: (c: CanvasRenderingContext2D) => void; k: string; w?: number; h?: number} & G> = ({draw, k, w = 0.8, h = 1, ...g}) => (
	<group {...g}>
		<mesh {...sh} geometry={box(w + 0.12, h + 0.12, 0.05)} material={plain('#8A6440', 0.5)} />
		<mesh position={[0, 0, 0.03]}>
			<planeGeometry args={[w, h]} />
			<meshStandardMaterial map={canvasTex(k, 256, Math.round((256 * h) / w), draw)} roughness={0.4} />
		</mesh>
	</group>
);
