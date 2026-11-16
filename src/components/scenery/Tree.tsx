// STYLE_GUIDE §5 — árvore com copa low-poly SÓLIDA em massas (sem cartões de folha).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {makeBarkMaterial, makeFoliageMaterial} from '../../style/materials';
import {mulberry32} from '../../style/random';

const blob = (r: number, rand: () => number) => {
	const g = new THREE.IcosahedronGeometry(r, 2);
	const pos = g.attributes.position as THREE.BufferAttribute;
	// desloca vértices (mesma posição => mesmo deslocamento, mantém a malha fechada)
	const v = new THREE.Vector3();
	const k = [rand() * 10, rand() * 10, rand() * 10];
	for (let i = 0; i < pos.count; i++) {
		v.fromBufferAttribute(pos, i);
		const n = Math.sin(v.x * 3.1 + k[0]) * Math.sin(v.y * 2.7 + k[1]) * Math.sin(v.z * 3.3 + k[2]);
		v.multiplyScalar(1 + n * 0.12);
		v.y *= 0.82;
		pos.setXYZ(i, v.x, v.y, v.z);
	}
	g.computeVertexNormals();
	return g;
};

export const Tree: React.FC<{position?: [number, number, number]; height?: number; seed?: number; rotationY?: number}> = ({
	position = [0, 0, 0],
	height = 6,
	seed = 3,
	rotationY = 0,
}) => {
	const parts = useMemo(() => {
		const r = mulberry32(seed);
		const trunkH = height * 0.48;
		const trunk = new THREE.CylinderGeometry(height * 0.035, height * 0.06, trunkH, 14, 6).translate(0, trunkH / 2, 0);
		// leve curvatura no tronco
		const tp = trunk.attributes.position as THREE.BufferAttribute;
		for (let i = 0; i < tp.count; i++) {
			const y = tp.getY(i) / trunkH;
			tp.setX(i, tp.getX(i) + Math.sin(y * 2.2) * height * 0.03);
		}
		trunk.computeVertexNormals();
		const branches = [0, 1, 2].map((i) => {
			const len = height * (0.22 + r() * 0.1);
			const g = new THREE.CylinderGeometry(height * 0.012, height * 0.024, len, 8).translate(0, len / 2, 0);
			return {g, y: trunkH * (0.7 + i * 0.1), rot: [0.0, (i * 2.1 + r()) % (Math.PI * 2), 0.75 + r() * 0.3] as [number, number, number]};
		});
		const crownY = trunkH + height * 0.18;
		const blobs = Array.from({length: 7}, (_, i) => {
			const a = (i / 7) * Math.PI * 2 + r() * 0.5;
			const rad = i === 0 ? 0 : height * (0.17 + r() * 0.1);
			const s = height * (i === 0 ? 0.3 : 0.2 + r() * 0.07);
			return {g: blob(s, r), p: [Math.cos(a) * rad, crownY + (i === 0 ? height * 0.08 : (r() - 0.35) * height * 0.16), Math.sin(a) * rad] as [number, number, number]};
		});
		return {trunk, branches, blobs};
	}, [height, seed]);
	return (
		<group position={position} rotation={[0, rotationY, 0]}>
			<mesh geometry={parts.trunk} material={makeBarkMaterial()} castShadow receiveShadow />
			{parts.branches.map((b, i) => (
				<group key={i} position={[0, b.y, 0]} rotation={new THREE.Euler(b.rot[0], b.rot[1], b.rot[2], 'YXZ')}>
					<mesh geometry={b.g} material={makeBarkMaterial()} castShadow />
				</group>
			))}
			{parts.blobs.map((b, i) => (
				<mesh key={i} geometry={b.g} position={b.p} material={makeFoliageMaterial()} castShadow receiveShadow />
			))}
		</group>
	);
};
