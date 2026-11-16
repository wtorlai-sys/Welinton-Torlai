// Efeitos de luz "de cinema" (STYLE_GUIDE §4): feixe de luz visível (janela/lâmpada) com poeira.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {mulberry32} from '../style/random';

const beamVert = /* glsl */ `
varying vec2 vUv; varying vec3 vW;
void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }
`;
const beamFrag = /* glsl */ `
uniform vec3 uColor; uniform float uStrength; uniform float uTime;
varying vec2 vUv; varying vec3 vW;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
void main(){
	// mais forte perto da janela (v=1), some no chão (v=0); bordas suaves
	float along = smoothstep(0.0, 0.35, vUv.y) * (0.55 + 0.45 * vUv.y);
	float edge = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x);
	// listras sutis (raios), levemente animadas
	float rays = 0.75 + 0.25 * sin(vUv.x * 38.0 + uTime * 0.3) * sin(vUv.x * 13.0 - uTime * 0.2);
	gl_FragColor = vec4(uColor * uStrength * along * edge * rays, 1.0);
}
`;

/**
 * Feixe de luz: volume em forma de prisma da abertura (janela) até o chão.
 * `from` = 4 cantos da janela (mundo); `dir` = direção da luz. Aditivo, sem escrever profundidade.
 */
export const LightShaft: React.FC<{window: [THREE.Vector3Tuple, THREE.Vector3Tuple, THREE.Vector3Tuple, THREE.Vector3Tuple]; dir: THREE.Vector3Tuple; length?: number; color?: string; strength?: number}> = ({
	window: win,
	dir,
	length = 3,
	color = '#9FB8FF',
	strength = 0.35,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {geo, mat} = useMemo(() => {
		const d = new THREE.Vector3(...dir).normalize().multiplyScalar(length);
		const a = win.map((p) => new THREE.Vector3(...p));
		const b = a.map((p) => p.clone().add(d));
		// 4 faces laterais do prisma (cada uma: janela-borda → chão)
		const pos: number[] = [];
		const uv: number[] = [];
		for (let i = 0; i < 4; i++) {
			const j = (i + 1) % 4;
			const quad = [a[i], a[j], b[j], b[i]];
			const uvs = [
				[0, 1],
				[1, 1],
				[1, 0],
				[0, 0],
			];
			[0, 1, 2, 0, 2, 3].forEach((k) => {
				pos.push(quad[k].x, quad[k].y, quad[k].z);
				uv.push(uvs[k][0], uvs[k][1]);
			});
		}
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
		g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
		const m = new THREE.ShaderMaterial({
			vertexShader: beamVert,
			fragmentShader: beamFrag,
			uniforms: {uColor: {value: new THREE.Color(color)}, uStrength: {value: strength}, uTime: {value: 0}},
			transparent: true,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
			side: THREE.DoubleSide,
			fog: false,
		});
		return {geo: g, mat: m};
	}, [JSON.stringify(win), JSON.stringify(dir), length, color, strength]);
	mat.uniforms.uTime.value = frame / fps;
	return <mesh geometry={geo} material={mat} renderOrder={10} frustumCulled={false} />;
};

/** Poeira flutuando dentro de um volume (aparece no feixe de luz). Determinística. */
export const DustMotes: React.FC<{center: THREE.Vector3Tuple; size: THREE.Vector3Tuple; count?: number; color?: string; seed?: number}> = ({center, size, count = 140, color = '#DCE6FF', seed = 9}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const {geo, base, mat} = useMemo(() => {
		const r = mulberry32(seed);
		const b: number[] = [];
		for (let i = 0; i < count; i++) b.push((r() - 0.5) * size[0], (r() - 0.5) * size[1], (r() - 0.5) * size[2], r() * 10);
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
		const m = new THREE.PointsMaterial({color: new THREE.Color(color).multiplyScalar(1.4), size: 0.006, sizeAttenuation: true, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending});
		return {geo: g, base: b, mat: m};
	}, [count, seed, JSON.stringify(size), color]);
	const pos = geo.attributes.position as THREE.BufferAttribute;
	for (let i = 0; i < count; i++) {
		const ph = base[i * 4 + 3];
		pos.setXYZ(i, base[i * 4] + Math.sin(t * 0.4 + ph) * 0.03, base[i * 4 + 1] + Math.sin(t * 0.25 + ph * 2) * 0.04, base[i * 4 + 2] + Math.cos(t * 0.3 + ph) * 0.03);
	}
	pos.needsUpdate = true;
	return <points geometry={geo} material={mat} position={center} frustumCulled={false} />;
};
