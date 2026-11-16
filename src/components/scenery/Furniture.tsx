// Móveis de quarto semi-realistas (MeshStandard) — contraste com o personagem toon.
// Medidas em metros "reais"; o episódio escala o set para o personagem de 1 m.
import React from 'react';
import {RoundedBox} from '@react-three/drei';
import {makeEmissiveMaterial, makeFabricMaterial, makePlainMaterial, makeWoodMaterial} from '../../style/materials';
import {PALETTE} from '../../style/constants';
import {Glow} from '../Lighting';

type G = Omit<React.ComponentProps<'group'>, 'children'>;

/** Altura do topo do colchão (para deitar personagens). */
export const bedTop = (scale = 1) => 0.56 * scale;

/** Cama: estrado de madeira, cabeceira, colchão, edredom e travesseiro(s). Cabeceira em -Z. */
export const Bed: React.FC<{width?: number; length?: number; duvet?: string; pillows?: 1 | 2; folded?: number; /** volumes de corpo sob o edredom: x local, comprimento */ lumps?: {x: number; len?: number}[]} & G> = ({
	width = 1.0,
	length = 2.0,
	duvet = '#6FA8DC',
	pillows = 1,
	folded = 0.45,
	lumps = [],
	...g
}) => {
	const wood = makeWoodMaterial('#C07840');
	const duvetLen = length * (1 - folded * 0.5);
	return (
		<group {...g}>
			<mesh position={[0, 0.2, 0]} material={wood} castShadow receiveShadow>
				<boxGeometry args={[width + 0.08, 0.22, length + 0.06]} />
			</mesh>
			{[-1, 1].map((sx) =>
				[-1, 1].map((sz) => (
					<mesh key={`${sx}${sz}`} position={[sx * (width / 2 - 0.02), 0.06, sz * (length / 2 - 0.02)]} material={wood} castShadow>
						<boxGeometry args={[0.08, 0.12, 0.08]} />
					</mesh>
				)),
			)}
			<RoundedBox args={[width + 0.1, 0.95, 0.08]} radius={0.03} position={[0, 0.5, -length / 2 - 0.02]} material={wood} castShadow receiveShadow />
			<RoundedBox args={[width, 0.24, length - 0.04]} radius={0.06} smoothness={3} position={[0, 0.42, 0]} material={makeFabricMaterial('#F2EEE6')} castShadow receiveShadow />
			<RoundedBox
				args={[width + 0.06, 0.08, duvetLen]}
				radius={0.035}
				smoothness={3}
				position={[0, 0.56, length / 2 - duvetLen / 2 + 0.02]}
				material={makeFabricMaterial(duvet)}
				castShadow
				receiveShadow
			/>
			{lumps.map((l, i) => (
				<mesh key={`l${i}`} position={[l.x, 0.6, length / 2 - (l.len ?? 1.3) / 2 - 0.1]} scale={[0.22, 0.13, (l.len ?? 1.3) / 2]} material={makeFabricMaterial(duvet)} castShadow receiveShadow>
					<sphereGeometry args={[1, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
				</mesh>
			))}
			{Array.from({length: pillows}, (_, i) => (
				<RoundedBox
					key={i}
					args={[pillows === 2 ? width * 0.44 : width * 0.7, 0.13, 0.38]}
					radius={0.06}
					smoothness={3}
					position={[pillows === 2 ? (i - 0.5) * width * 0.48 : 0, 0.61, -length / 2 + 0.3]}
					material={makeFabricMaterial('#FBF8F2')}
					castShadow
					receiveShadow
				/>
			))}
		</group>
	);
};

/** Criado-mudo com abajur (o abajur brilha à noite via <Glow> + pointLight quente). */
export const Nightstand: React.FC<{lampOn?: boolean} & G> = ({lampOn = false, ...g}) => (
	<group {...g}>
		<RoundedBox args={[0.45, 0.5, 0.4]} radius={0.02} position={[0, 0.25, 0]} material={makeWoodMaterial('#B5683A')} castShadow receiveShadow />
		<mesh position={[0, 0.36, 0.201]} material={makePlainMaterial('#3A2A1E', 0.4, 0.6)}>
			<boxGeometry args={[0.12, 0.025, 0.01]} />
		</mesh>
		<mesh position={[0, 0.56, 0]} material={makePlainMaterial('#C9B79C', 0.4)} castShadow>
			<cylinderGeometry args={[0.06, 0.08, 0.12, 16]} />
		</mesh>
		<mesh position={[0, 0.68, 0]} material={makePlainMaterial('#3A3A3A', 0.5)}>
			<cylinderGeometry args={[0.01, 0.01, 0.14, 8]} />
		</mesh>
		{lampOn ? (
			<Glow>
				<mesh position={[0, 0.8, 0]} material={makeEmissiveMaterial(PALETTE.emissive, 4)}>
					<cylinderGeometry args={[0.1, 0.16, 0.18, 24, 1, true]} />
				</mesh>
			</Glow>
		) : (
			<mesh position={[0, 0.8, 0]} material={makeFabricMaterial('#F1E4C8')} castShadow>
				<cylinderGeometry args={[0.1, 0.16, 0.18, 24, 1, true]} />
			</mesh>
		)}
		{lampOn && <pointLight position={[0, 0.8, 0]} color={PALETTE.emissive} intensity={2.2} distance={4} decay={2} />}
	</group>
);

/** Guarda-roupa de 2 portas. */
export const Wardrobe: React.FC<{color?: string} & G> = ({color = '#D9C7A6', ...g}) => (
	<group {...g}>
		<RoundedBox args={[1.2, 2.0, 0.55]} radius={0.02} position={[0, 1.0, 0]} material={makePlainMaterial(color, 0.6)} castShadow receiveShadow />
		<mesh position={[0, 1.0, 0.277]} material={makePlainMaterial('#B9A685', 0.6)}>
			<boxGeometry args={[0.012, 1.9, 0.005]} />
		</mesh>
		{[-0.07, 0.07].map((x) => (
			<mesh key={x} position={[x, 1.05, 0.29]} material={makePlainMaterial('#5A4A3A', 0.35, 0.6)}>
				<boxGeometry args={[0.02, 0.18, 0.02]} />
			</mesh>
		))}
	</group>
);

/** Tapete retangular. */
export const Rug: React.FC<{w?: number; d?: number; color?: string} & G> = ({w = 1.6, d = 1.1, color = '#C9A27A', ...g}) => (
	<group {...g}>
		<RoundedBox args={[w, 0.015, d]} radius={0.006} position={[0, 0.008, 0]} material={makeFabricMaterial(color)} receiveShadow />
	</group>
);

/** Porta fechada (painel com maçaneta) — encaixe numa abertura de Room. */
export const DoorPanel: React.FC<{w?: number; h?: number; color?: string} & G> = ({w = 0.9, h = 2.05, color = '#E6DCCB', ...g}) => (
	<group {...g}>
		<mesh position={[0, h / 2, 0]} material={makePlainMaterial(color, 0.55)} castShadow receiveShadow>
			<boxGeometry args={[w, h, 0.04]} />
		</mesh>
		<mesh position={[w / 2 - 0.1, 1.0, 0.04]} material={makePlainMaterial('#B8A27A', 0.3, 0.8)}>
			<sphereGeometry args={[0.035, 12, 8]} />
		</mesh>
	</group>
);

/** Maleta (para o clone que vai trabalhar). Origem = alça. */
export const Briefcase: React.FC<G> = (g) => (
	<group {...g}>
		<RoundedBox args={[0.32, 0.24, 0.09]} radius={0.02} position={[0, -0.16, 0]} material={makePlainMaterial('#5B3A24', 0.45)} castShadow />
		<mesh position={[0, -0.025, 0]} material={makePlainMaterial('#2A1C12', 0.5)}>
			<torusGeometry args={[0.05, 0.012, 8, 16, Math.PI]} />
		</mesh>
	</group>
);

/** Copo de leite (vidro + leite). Origem = centro. */
export const MilkGlass: React.FC<G & {level?: number}> = ({level = 0.7, ...g}) => (
	<group {...g}>
		<mesh material={makePlainMaterial('#DDE8EE', 0.05, 0.1)} castShadow>
			<cylinderGeometry args={[0.04, 0.034, 0.12, 20, 1, true]} />
		</mesh>
		<mesh position={[0, -0.06 + 0.06 * level, 0]} material={makePlainMaterial('#F7F5EE', 0.35)}>
			<cylinderGeometry args={[0.036, 0.033, 0.12 * level, 20]} />
		</mesh>
	</group>
);
