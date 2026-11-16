import React from 'react';
import {makeGroundMaterial} from '../../style/materials';

/** Chão grande com textura procedural de mundo (grama + campo dourado + acostamento). */
export const Ground: React.FC<{size?: number; roadHalfWidth?: number; fieldBounds?: [number, number, number, number]}> = ({
	size = 1600,
	roadHalfWidth = 3.5,
	fieldBounds,
}) => (
	<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={makeGroundMaterial({roadHalfWidth, fieldBounds})}>
		<planeGeometry args={[size, size, 1, 1]} />
	</mesh>
);
