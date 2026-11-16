// Elementos 3D (React Three Fiber): chuva de moedas e botão de play 3D.
// Posições calculadas do tempo T (sem useFrame/delta — STYLE_GUIDE §1).
import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {useVideoConfig} from 'remotion';
import {hash1} from '../../style/random';
import {PALETTE} from '../../style/constants';
import {useT} from './kit';

const coinGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.09, 40);
const rimMat = new THREE.MeshStandardMaterial({color: '#D9930F', metalness: 0.85, roughness: 0.32});
const faceMat = new THREE.MeshStandardMaterial({color: '#FFC83D', metalness: 0.7, roughness: 0.25, emissive: '#5A3A00', emissiveIntensity: 0.35});

const Lights: React.FC = () => (
	<>
		<ambientLight intensity={0.7} />
		<hemisphereLight args={['#BFD9FF', '#1A2040', 0.9]} />
		<directionalLight position={[4, 6, 8]} intensity={3.2} color="#FFF1D6" />
		<pointLight position={[-5, -2, 4]} intensity={30} color="#38D6FF" />
	</>
);

/** Chuva/explosão de moedas 3D a partir de t0 */
export const Coins3D: React.FC<{t0: number; n?: number; seed?: number; burst?: boolean; dur?: number}> = ({t0, n = 46, seed = 1, burst = false, dur = 4}) => {
	const T = useT();
	const {width, height} = useVideoConfig();
	const coins = useMemo(
		() =>
			Array.from({length: n}).map((_, i) => ({
				x: (hash1(i * 3.1 + seed) - 0.5) * 9,
				z: (hash1(i * 5.7 + seed) - 0.5) * 4,
				delay: hash1(i * 7.3 + seed) * (burst ? 0.15 : dur * 0.6),
				vy: 4 + hash1(i * 2.9 + seed) * 4,
				spin: 4 + hash1(i * 4.4 + seed) * 8,
				ax: hash1(i * 8.8 + seed) * Math.PI,
				ang: hash1(i * 6.1 + seed) * Math.PI * 2,
				pow: 5 + hash1(i * 9.9 + seed) * 7,
				s: 0.75 + hash1(i * 1.3 + seed) * 0.6,
			})),
		[n, seed, burst, dur],
	);
	const lt = T - t0;
	if (lt < 0) return null;
	return (
		<ThreeCanvas width={width} height={height} dpr={1} gl={{antialias: true, alpha: true}} camera={{fov: 45, position: [0, 0, 13]}} style={{position: 'absolute', inset: 0}}>
			<Lights />
			{coins.map((c, i) => {
				const t = lt - c.delay;
				if (t < 0) return null;
				let x: number, y: number, z: number;
				if (burst) {
					x = Math.cos(c.ang) * c.pow * t;
					y = Math.sin(c.ang) * c.pow * t * 0.9 + 2 * t - 7 * t * t;
					z = c.z + 3 * t;
				} else {
					x = c.x + Math.sin(t * 1.5 + i) * 0.4;
					y = 9 - c.vy * t - 2.2 * t * t;
					z = c.z;
				}
				if (y < -12) return null;
				return (
					<group key={i} position={[x, y, z]} rotation={[c.ax + t * c.spin * 0.6, t * c.spin, 0.3]} scale={c.s}>
						<mesh geometry={coinGeo} material={[rimMat, faceMat, faceMat]} />
					</group>
				);
			})}
		</ThreeCanvas>
	);
};

/** Botão de play 3D girando (caixa arredondada vermelha + triângulo branco) */
export const Play3D: React.FC<{t0: number; size?: number; y?: number}> = ({t0, size = 1, y = 0}) => {
	const T = useT();
	const {width, height} = useVideoConfig();
	const lt = Math.max(0, T - t0);
	const shape = useMemo(() => {
		const s = new THREE.Shape();
		const w = 1.6;
		const h = 1.12;
		const r = 0.32;
		s.moveTo(-w / 2 + r, -h / 2);
		s.lineTo(w / 2 - r, -h / 2);
		s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
		s.lineTo(w / 2, h / 2 - r);
		s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
		s.lineTo(-w / 2 + r, h / 2);
		s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
		s.lineTo(-w / 2, -h / 2 + r);
		s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
		return s;
	}, []);
	const tri = useMemo(() => {
		const s = new THREE.Shape();
		s.moveTo(-0.22, -0.3);
		s.lineTo(0.36, 0);
		s.lineTo(-0.22, 0.3);
		s.lineTo(-0.22, -0.3);
		return s;
	}, []);
	const pop = Math.min(1, lt / 0.45);
	const sc = size * (pop < 1 ? 1 - Math.pow(1 - pop, 3) * 1 + Math.sin(pop * Math.PI) * 0.15 : 1);
	return (
		<ThreeCanvas width={width} height={height} dpr={1} gl={{antialias: true, alpha: true}} camera={{fov: 40, position: [0, 0, 8]}} style={{position: 'absolute', inset: 0}}>
			<Lights />
			<group position={[-0.25, y, 0]} rotation={[0.15 * Math.sin(lt * 1.3), Math.sin(lt * 1.6) * 0.5 + (1 - pop) * 3, 0]} scale={sc}>
				<mesh position={[0, 0, -0.18]}>
					<extrudeGeometry args={[shape, {depth: 0.36, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 4}]} />
					<meshStandardMaterial color={PALETTE.accent} metalness={0.2} roughness={0.35} emissive={PALETTE.accent} emissiveIntensity={0.25} />
				</mesh>
				<mesh position={[0, 0, 0.26]}>
					<extrudeGeometry args={[tri, {depth: 0.06, bevelEnabled: false}]} />
					<meshStandardMaterial color="#FFFFFF" roughness={0.4} emissive="#FFFFFF" emissiveIntensity={0.3} />
				</mesh>
			</group>
		</ThreeCanvas>
	);
};
