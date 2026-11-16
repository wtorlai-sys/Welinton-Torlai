// Folha de elenco/expressões (QC do personagem 2D) num set 3D simples.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Character2D, Expression2D} from '../components/Character2D';
import {CAST} from '../characters';
import {Lighting} from '../components/Lighting';
import {CameraRig} from '../components/CameraRig';
import {Room} from '../components/scenery';

const EXPR: Expression2D[] = ['neutro', 'deboche', 'feliz', 'susto', 'bravo', 'dormindo', 'sinistro'];

export const CastSheet: React.FC = () => {
	const frame = useCurrentFrame();
	const cast = Object.values(CAST);
	return (
		<AbsoluteFill style={{backgroundColor: '#DCE9F5'}}>
			<ThreeCanvas width={1080} height={1920} shadows={{enabled: true, type: THREE.PCFShadowMap}} dpr={1} gl={{antialias: false}}>
				<CameraRig shots={[{from: 0, durationInFrames: 2, position: [0, 1.0, 4.6], target: [0, 0.75, 0], fov: 50}]} />
				<Lighting preset="dia" focus={[0, 0, 0]} shadowExtent={4} sunAzimuth={-60} sunElevation={35} interior />
				<group scale={0.6}>
					<Room width={6} depth={5} height={4} wallColor="#E9DCC3" ceiling={false} />
				</group>
				{frame === 0
					? cast.map((c, i) => (
							<Character2D key={c.id} outfit={c.outfit} expression={c.expressaoPadrao} scale={c.escala} light={-1} turn={i % 2 ? 0.3 : -0.3} position={[((i % 4) - 1.5) * 0.62, 0, i < 4 ? -0.6 : 0.4]} shadowYaw={-60} />
						))
					: EXPR.map((e, i) => (
							<Character2D key={e} outfit={CAST.ze.outfit} expression={e} pose={i === 3 ? 'shrug' : i === 4 ? 'crossArms' : i === 2 ? 'wave' : 'stand'} light={-1} position={[((i % 4) - 1.5) * 0.62, 0, i < 4 ? -0.6 : 0.4]} shadowYaw={-60} />
						))}
			</ThreeCanvas>
		</AbsoluteFill>
	);
};
