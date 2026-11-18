import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {BlockyAvatar, blinkAt, idle, walk} from '../../components/BlockyAvatar';
import {CameraRig} from '../../components/CameraRig';
import {Lighting} from '../../components/Lighting';
import {Room} from '../../components/scenery/Room';
import {GAROTA, IRMAO, MAX} from './cast';

export const CastTest: React.FC = () => {
	const f = useCurrentFrame();
	const {width, height, fps} = useVideoConfig();
	const t = f / fps;
	const close = f >= 1;
	return (
		<AbsoluteFill>
			<ThreeCanvas width={width} height={height} shadows={{enabled: true, type: THREE.PCFShadowMap}} dpr={1} gl={{antialias: false}}>
				<CameraRig shots={[close ? {from: 0, durationInFrames: 10, position: [0.3, 1.0, 1.1], target: [0.0, 0.92, 0], fov: 40} : {from: 0, durationInFrames: 10, position: [0, 1.0, 3.2], target: [0, 0.6, 0], fov: 50}]} />
				<Lighting preset="dia" focus={[0, 0, 0]} shadowExtent={4} sunAzimuth={150} sunElevation={40} interior />
				<Room width={5} depth={4} wallColor="#D9E4EE" floorColor="#B5895A" windows={[{wall: 'back', at: 1.4}]} />
				<BlockyAvatar look={MAX} position={[-0.75, 0, 0.2]} rotation={[0, 0.25, 0]} pose={{...idle(t), armR: [60, 10]}} expr="feliz" blink={blinkAt(t, 1)} />
				<BlockyAvatar look={GAROTA} position={[0.0, 0, 0]} pose={idle(t, 2)} expr="apaixonado" />
				<BlockyAvatar look={IRMAO} position={[0.75, 0, 0.2]} rotation={[0, -0.25, 0]} pose={walk(t + 0.2)} expr="convencido" mouth={0.6} />
			</ThreeCanvas>
		</AbsoluteFill>
	);
};
