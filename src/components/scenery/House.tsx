// Casa térrea simples (exterior): paredes, telhado de duas águas, porta, janelas.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {makePlainMaterial, makeWallMaterial} from '../../style/materials';

type G = Omit<React.ComponentProps<'group'>, 'children'>;

export const House: React.FC<{w?: number; d?: number; h?: number; wall?: string; roof?: string; doorOpen?: boolean} & G> = ({
	w = 7,
	d = 6,
	h = 2.8,
	wall = '#F2E3C6',
	roof = '#6F7C8C',
	doorOpen = false,
	...g
}) => {
	const roofGeo = useMemo(() => {
		const s = new THREE.Shape();
		s.moveTo(-d / 2 - 0.4, 0);
		s.lineTo(d / 2 + 0.4, 0);
		s.lineTo(0, 1.6);
		s.closePath();
		const geo = new THREE.ExtrudeGeometry(s, {depth: w + 0.6, bevelEnabled: false});
		geo.translate(0, 0, -(w + 0.6) / 2);
		geo.rotateY(Math.PI / 2);
		return geo;
	}, [w, d]);
	const glass = makePlainMaterial('#2B3B4C', 0.1, 0.6);
	const frame = makePlainMaterial('#FAF7F0', 0.5);
	return (
		<group {...g}>
			<mesh position={[0, h / 2, 0]} material={makeWallMaterial(wall)} castShadow receiveShadow>
				<boxGeometry args={[w, h, d]} />
			</mesh>
			<mesh geometry={roofGeo} position={[0, h, 0]} material={makePlainMaterial(roof, 0.7)} castShadow receiveShadow />
			{/* porta (frente = +Z) */}
			<mesh position={[0, 1.02, d / 2 + 0.01]} material={doorOpen ? makePlainMaterial('#1C1612', 0.9) : makePlainMaterial('#3A6FD8', 0.5)}>
				<planeGeometry args={[0.95, 2.05]} />
			</mesh>
			{[-2.2, 2.2].map((x) => (
				<group key={x} position={[x, 1.55, d / 2 + 0.02]}>
					<mesh material={frame}>
						<planeGeometry args={[1.3, 1.1]} />
					</mesh>
					<mesh position={[0, 0, 0.005]} material={glass}>
						<planeGeometry args={[1.12, 0.92]} />
					</mesh>
				</group>
			))}
			{/* degrau */}
			<mesh position={[0, 0.08, d / 2 + 0.35]} material={makePlainMaterial('#B9B2A6', 0.8)} castShadow receiveShadow>
				<boxGeometry args={[1.6, 0.16, 0.7]} />
			</mesh>
		</group>
	);
};
