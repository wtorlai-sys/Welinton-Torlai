// Kit "Construção Viral" — geometria utilitária: caixa por min/max e barra (cabo, viga, trilho) entre dois pontos.
import React from 'react';
import * as THREE from 'three';
import {V3} from './tempo';

export const Bloco: React.FC<{min: V3; max: V3; mat: THREE.Material; sombra?: boolean}> = ({min, max, mat, sombra = true}) => {
	const s: V3 = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
	if (s[0] <= 1e-4 || s[1] <= 1e-4 || s[2] <= 1e-4) return null;
	return (
		<mesh position={[(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2]} material={mat} castShadow={sombra} receiveShadow>
			<boxGeometry args={s} />
		</mesh>
	);
};

const UP = new THREE.Vector3(0, 1, 0);

/** Cilindro de `a` até `b` (cabos, barras, molas retas). */
export const Barra: React.FC<{a: V3; b: V3; r: number; mat: THREE.Material; lados?: number}> = ({a, b, r, mat, lados = 6}) => {
	const A = new THREE.Vector3(...a);
	const B = new THREE.Vector3(...b);
	const d = new THREE.Vector3().subVectors(B, A);
	const L = d.length();
	if (L < 1e-4) return null;
	const q = new THREE.Quaternion().setFromUnitVectors(UP, d.clone().normalize());
	const m = A.clone().add(B).multiplyScalar(0.5);
	return (
		<mesh position={m} quaternion={q} material={mat} castShadow>
			<cylinderGeometry args={[r, r, L, lados]} />
		</mesh>
	);
};

/** Mola helicoidal low-poly (amortecedor): `h` = altura atual (comprime). */
export const Mola: React.FC<{base: V3; h: number; r?: number; voltas?: number; mat: THREE.Material}> = ({base, h, r = 0.18, voltas = 6, mat}) => {
	const pts: V3[] = [];
	const n = voltas * 8;
	for (let i = 0; i <= n; i++) {
		const a = (i / 8) * Math.PI * 2;
		pts.push([base[0] + Math.cos(a) * r, base[1] + (i / n) * h, base[2] + Math.sin(a) * r]);
	}
	return (
		<group>
			{pts.slice(1).map((p, i) => (
				<Barra key={i} a={pts[i]} b={p} r={0.03} mat={mat} lados={4} />
			))}
		</group>
	);
};
