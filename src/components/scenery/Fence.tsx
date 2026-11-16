import React, {useMemo} from 'react';
import * as THREE from 'three';
import {makeWoodMaterial} from '../../style/materials';
import {mulberry32} from '../../style/random';

/** Cerca de madeira entre dois pontos (linha guia). Postes instanciados + 2 réguas. */
export const Fence: React.FC<{from: [number, number]; to: [number, number]; spacing?: number; height?: number; seed?: number}> = ({
	from,
	to,
	spacing = 2.6,
	height = 1.1,
	seed = 5,
}) => {
	const {posts, rails} = useMemo(() => {
		const a = new THREE.Vector2(...from);
		const b = new THREE.Vector2(...to);
		const len = a.distanceTo(b);
		const n = Math.max(2, Math.round(len / spacing) + 1);
		const r = mulberry32(seed);
		const geo = new THREE.BoxGeometry(0.11, height, 0.11).translate(0, height / 2, 0);
		const m = new THREE.InstancedMesh(geo, makeWoodMaterial('#7A5A3C'), n);
		const o = new THREE.Object3D();
		for (let i = 0; i < n; i++) {
			const p = a.clone().lerp(b, i / (n - 1));
			o.position.set(p.x, -0.05, p.y);
			o.rotation.set((r() - 0.5) * 0.06, r() * 0.4, (r() - 0.5) * 0.06);
			o.scale.set(1, 0.92 + r() * 0.16, 1);
			o.updateMatrix();
			m.setMatrixAt(i, o.matrix);
		}
		m.castShadow = true;
		m.receiveShadow = true;
		const mid = a.clone().add(b).multiplyScalar(0.5);
		const ang = Math.atan2(b.x - a.x, b.y - a.y);
		return {posts: m, rails: {mid, ang, len}};
	}, [from[0], from[1], to[0], to[1], spacing, height, seed]);
	return (
		<group>
			<primitive object={posts} />
			{[0.45, 0.85].map((h) => (
				<mesh key={h} position={[rails.mid.x, h * height, rails.mid.y]} rotation={[0, rails.ang, 0]} material={makeWoodMaterial('#8A6846')} castShadow receiveShadow>
					<boxGeometry args={[0.05, 0.09, rails.len]} />
				</mesh>
			))}
		</group>
	);
};
