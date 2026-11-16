// Carro low-poly semi-realista (MeshStandard). Rodas giram pela distância percorrida.
import React from 'react';
import * as THREE from 'three';
import {RoundedBox} from '@react-three/drei';
import {makeEmissiveMaterial, makeGlassMaterial, makeMetalMaterial, makePaintMaterial, makeRubberMaterial} from '../../style/materials';

const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 24).rotateZ(Math.PI / 2);
const hubGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.25, 16).rotateZ(Math.PI / 2);

export const Car: React.FC<{color?: string; /** metros percorridos (gira as rodas) */ distance?: number; lights?: boolean} & Omit<React.ComponentProps<'group'>, 'children'>> = ({
	color = '#F5C518',
	distance = 0,
	lights = false,
	...g
}) => {
	const paint = makePaintMaterial(color);
	const spin = -distance / 0.34;
	const wheels: [number, number][] = [
		[0.82, 1.3],
		[-0.82, 1.3],
		[0.82, -1.25],
		[-0.82, -1.25],
	];
	return (
		<group {...g}>
			{/* carroceria (frente = +Z) */}
			<RoundedBox args={[1.78, 0.62, 4.2]} radius={0.16} smoothness={3} position={[0, 0.62, 0]} material={paint} castShadow receiveShadow />
			<RoundedBox args={[1.56, 0.56, 2.1]} radius={0.18} smoothness={3} position={[0, 1.15, -0.25]} material={paint} castShadow />
			{/* vidros */}
			<mesh position={[0, 1.16, 0.83]} rotation={[-0.55, 0, 0]} material={makeGlassMaterial()}>
				<planeGeometry args={[1.42, 0.62]} />
			</mesh>
			<mesh position={[0, 1.16, -1.33]} rotation={[0.55 + Math.PI, 0, 0]} material={makeGlassMaterial()}>
				<planeGeometry args={[1.42, 0.55]} />
			</mesh>
			{[1, -1].map((s) => (
				<mesh key={s} position={[s * 0.785, 1.17, -0.25]} rotation={[0, (s * Math.PI) / 2, 0]} material={makeGlassMaterial()}>
					<planeGeometry args={[1.8, 0.4]} />
				</mesh>
			))}
			{/* faróis / lanternas */}
			{[0.6, -0.6].map((x) => (
				<React.Fragment key={x}>
					<mesh position={[x, 0.7, 2.101]} material={lights ? makeEmissiveMaterial('#FFF4D6', 10) : makeMetalMaterial('#E8EEF2')}>
						<planeGeometry args={[0.34, 0.14]} />
					</mesh>
					<mesh position={[x, 0.72, -2.101]} rotation={[0, Math.PI, 0]} material={makeEmissiveMaterial('#7A1E14', lights ? 6 : 0.6)}>
						<planeGeometry args={[0.3, 0.12]} />
					</mesh>
				</React.Fragment>
			))}
			{/* para-choques */}
			<mesh position={[0, 0.38, 2.12]} material={makeRubberMaterial()} castShadow>
				<boxGeometry args={[1.7, 0.16, 0.12]} />
			</mesh>
			<mesh position={[0, 0.38, -2.12]} material={makeRubberMaterial()} castShadow>
				<boxGeometry args={[1.7, 0.16, 0.12]} />
			</mesh>
			{/* rodas */}
			{wheels.map(([x, z]) => (
				<group key={`${x}${z}`} position={[x, 0.34, z]} rotation={[spin, 0, 0]}>
					<mesh geometry={wheelGeo} material={makeRubberMaterial()} castShadow />
					<mesh geometry={hubGeo} material={makeMetalMaterial('#C9CED3')} />
				</group>
			))}
		</group>
	);
};
