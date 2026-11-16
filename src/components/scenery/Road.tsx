import React from 'react';
import {makeAsphaltMaterial} from '../../style/materials';

/** Estrada reta ao longo de Z (linha guia para o ponto de fuga). Faixas pintadas no shader. */
export const Road: React.FC<{halfWidth?: number; from?: number; to?: number; x?: number}> = ({halfWidth = 3.5, from = 60, to = -900, x = 0}) => {
	const len = from - to;
	return (
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.012, (from + to) / 2]} receiveShadow material={makeAsphaltMaterial(halfWidth)}>
			<planeGeometry args={[halfWidth * 2, len, 1, 1]} />
		</mesh>
	);
};
