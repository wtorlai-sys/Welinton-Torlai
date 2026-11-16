// Cozinha: bancada com armários, geladeira retrô, mesa e cadeiras.
import React from 'react';
import {RoundedBox} from '@react-three/drei';
import {makePlainMaterial, makeWoodMaterial} from '../../style/materials';

type G = Omit<React.ComponentProps<'group'>, 'children'>;

/** Bancada encostada na parede (fundo em -Z). */
export const Counter: React.FC<{length?: number; color?: string; top?: string; upper?: string} & G> = ({length = 2.4, color = '#2BA59B', top = '#EDE6DA', upper = '#F2C230', ...g}) => {
	const doors = Math.max(2, Math.round(length / 0.6));
	return (
		<group {...g}>
			<mesh position={[0, 0.43, 0]} material={makePlainMaterial(color, 0.55)} castShadow receiveShadow>
				<boxGeometry args={[length, 0.86, 0.6]} />
			</mesh>
			{Array.from({length: doors}, (_, i) => (
				<mesh key={i} position={[-length / 2 + (i + 0.5) * (length / doors), 0.45, 0.301]} material={makePlainMaterial('#24928A', 0.55)}>
					<boxGeometry args={[length / doors - 0.04, 0.7, 0.01]} />
				</mesh>
			))}
			<mesh position={[0, 0.88, 0.01]} material={makePlainMaterial(top, 0.35)} castShadow receiveShadow>
				<boxGeometry args={[length + 0.04, 0.04, 0.64]} />
			</mesh>
			{/* armários superiores */}
			<mesh position={[0, 1.75, -0.12]} material={makePlainMaterial(upper, 0.5)} castShadow receiveShadow>
				<boxGeometry args={[length, 0.6, 0.36]} />
			</mesh>
		</group>
	);
};

export const Fridge: React.FC<{color?: string} & G> = ({color = '#7FD8C8', ...g}) => (
	<group {...g}>
		<RoundedBox args={[0.75, 1.8, 0.68]} radius={0.08} smoothness={4} position={[0, 0.9, 0]} material={makePlainMaterial(color, 0.3)} castShadow receiveShadow />
		<mesh position={[0, 1.22, 0.345]} material={makePlainMaterial('#7FB8AB', 0.3)}>
			<boxGeometry args={[0.72, 0.012, 0.01]} />
		</mesh>
		{[1.45, 0.85].map((y) => (
			<mesh key={y} position={[0.28, y, 0.37]} material={makePlainMaterial('#C9CED3', 0.25, 0.8)} castShadow>
				<boxGeometry args={[0.04, 0.3, 0.04]} />
			</mesh>
		))}
	</group>
);

export const Table: React.FC<{w?: number; d?: number; h?: number} & G> = ({w = 1.2, d = 0.8, h = 0.75, ...g}) => {
	const wood = makeWoodMaterial('#A9764A');
	return (
		<group {...g}>
			<RoundedBox args={[w, 0.05, d]} radius={0.015} position={[0, h, 0]} material={wood} castShadow receiveShadow />
			{[-1, 1].map((sx) =>
				[-1, 1].map((sz) => (
					<mesh key={`${sx}${sz}`} position={[sx * (w / 2 - 0.07), h / 2, sz * (d / 2 - 0.07)]} material={wood} castShadow>
						<boxGeometry args={[0.05, h, 0.05]} />
					</mesh>
				)),
			)}
		</group>
	);
};

export const Chair: React.FC<{color?: string} & G> = ({color = '#F2C230', ...g}) => {
	const m = makePlainMaterial(color, 0.5);
	return (
		<group {...g}>
			<RoundedBox args={[0.42, 0.04, 0.42]} radius={0.012} position={[0, 0.45, 0]} material={m} castShadow receiveShadow />
			<RoundedBox args={[0.42, 0.42, 0.04]} radius={0.012} position={[0, 0.68, -0.19]} material={m} castShadow />
			{[-1, 1].map((sx) =>
				[-1, 1].map((sz) => (
					<mesh key={`${sx}${sz}`} position={[sx * 0.18, 0.225, sz * 0.18]} material={m} castShadow>
						<cylinderGeometry args={[0.015, 0.015, 0.45, 8]} />
					</mesh>
				)),
			)}
		</group>
	);
};
