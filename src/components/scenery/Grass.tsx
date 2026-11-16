// STYLE_GUIDE §5 — grama: InstancedMesh de lâminas perto da câmera; o chão faz o fundo.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {PALETTE} from '../../style/constants';
import {mulberry32} from '../../style/random';

const bladeGeometry = () => {
	// lâmina afinando em 3 segmentos (7 vértices); uv.y = altura
	const w = 0.022;
	const pts: number[] = [];
	const uvs: number[] = [];
	const ys = [0, 0.4, 0.75];
	ys.forEach((y) => {
		const ww = w * (1 - y * 0.85);
		pts.push(-ww, y, 0, ww, y, 0);
		uvs.push(0, y, 1, y);
	});
	pts.push(0, 1, 0);
	uvs.push(0.5, 1);
	const idx = [0, 1, 2, 2, 1, 3, 2, 3, 4, 4, 3, 5, 4, 5, 6];
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
	g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
	// normais para cima: a lâmina ilumina como o chão (sem verso escuro)
	g.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(pts.length / 3).fill(0).flatMap(() => [0, 1, 0]), 3));
	g.setIndex(idx);
	return g;
};

export type GrassProps = {
	center?: [number, number];
	radius?: number;
	count?: number;
	/** não planta na estrada: |x - roadX| < roadHalf */
	roadHalf?: number;
	roadX?: number;
	/** retângulos [xmin,xmax,zmin,zmax] sem grama (ex.: onde o personagem senta) */
	exclude?: [number, number, number, number][];
	height?: number;
	seed?: number;
};

export const Grass: React.FC<GrassProps> = ({center = [0, 0], radius = 14, count = 22000, roadHalf = 3.9, roadX = 0, exclude = [], height = 0.22, seed = 11}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {mesh, uniforms} = useMemo(() => {
		const uniforms = {uTime: {value: 0}};
		const mat = new THREE.MeshStandardMaterial({color: '#ffffff', roughness: 0.9, side: THREE.DoubleSide});
		mat.onBeforeCompile = (sh) => {
			sh.uniforms.uTime = uniforms.uTime;
			sh.vertexShader = sh.vertexShader
				.replace('#include <common>', '#include <common>\nuniform float uTime;\nvarying float vH;')
				.replace(
					'#include <begin_vertex>',
					`#include <begin_vertex>
					vH = uv.y;
					vec4 ip = instanceMatrix * vec4(0.0,0.0,0.0,1.0);
					float sway = sin(uTime * 1.7 + ip.x * 0.35 + ip.z * 0.21) * 0.5 + sin(uTime * 3.1 + ip.x * 1.3) * 0.2;
					transformed.x += sway * 0.12 * uv.y * uv.y;
					transformed.z += sway * 0.05 * uv.y * uv.y;`,
				);
			sh.fragmentShader = sh.fragmentShader
				.replace('#include <common>', '#include <common>\nvarying float vH;')
				.replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= mix(0.45, 1.08, vH);');
		};
		mat.customProgramCacheKey = () => 'grass';
		const g = bladeGeometry();
		const m = new THREE.InstancedMesh(g, mat, count);
		const r = mulberry32(seed);
		const o = new THREE.Object3D();
		const col = new THREE.Color();
		const cA = new THREE.Color(PALETTE.grass);
		const cB = new THREE.Color(PALETTE.grassDark);
		const cC = new THREE.Color(PALETTE.grassDry);
		let n = 0;
		let guard = 0;
		while (n < count && guard++ < count * 6) {
			// densidade maior no centro (perto da câmera/assunto)
			const a = r() * Math.PI * 2;
			const d = Math.pow(r(), 0.75) * radius;
			const x = center[0] + Math.cos(a) * d;
			const z = center[1] + Math.sin(a) * d;
			if (Math.abs(x - roadX) < roadHalf + r() * 0.6) continue;
			if (exclude.some(([x0, x1, z0, z1]) => x > x0 && x < x1 && z > z0 && z < z1)) continue;
			o.position.set(x, 0, z);
			o.rotation.set((r() - 0.5) * 0.5, r() * Math.PI, (r() - 0.5) * 0.5);
			const h = height * (0.55 + r() * 0.9);
			o.scale.set(1 + r() * 0.8, h, 1);
			o.updateMatrix();
			m.setMatrixAt(n, o.matrix);
			const k = r();
			col.copy(cA).lerp(k < 0.5 ? cB : cC, Math.abs(k - 0.5) * 1.4);
			m.setColorAt(n, col);
			n++;
		}
		m.count = n;
		m.receiveShadow = true;
		m.castShadow = false;
		m.frustumCulled = false;
		return {mesh: m, uniforms};
	}, [center[0], center[1], radius, count, roadHalf, roadX, height, seed, JSON.stringify(exclude)]);
	uniforms.uTime.value = frame / fps;
	return <primitive object={mesh} />;
};
