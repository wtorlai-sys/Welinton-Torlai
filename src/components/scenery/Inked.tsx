// Contorno escuro nos objetos 3D (estilo ilustrado das referências — STYLE_GUIDE §5).
// Para cada malha filha cria um "casco" BackSide preto, escalado POR EIXO a partir do centro
// da caixa da geometria, de modo que a espessura do traço fique igual em todos os lados.
import React, {useLayoutEffect, useRef} from 'react';
import * as THREE from 'three';

const inkMat = new THREE.MeshBasicMaterial({color: '#1A1414', side: THREE.BackSide});
const box = new THREE.Box3();
const size = new THREE.Vector3();
const center = new THREE.Vector3();

export const Inked: React.FC<{children: React.ReactNode; /** espessura do traço em unidades locais do grupo */ thickness?: number}> = ({children, thickness = 0.014}) => {
	const ref = useRef<THREE.Group>(null);
	useLayoutEffect(() => {
		const hulls: THREE.Mesh[] = [];
		ref.current?.traverse((o) => {
			const m = o as THREE.Mesh;
			if (!m.isMesh || m.userData.inkHull || m.userData.noInk) return;
			const mat = m.material as THREE.Material & {transparent?: boolean; blending?: number};
			if (!mat || mat.transparent || mat.blending === THREE.AdditiveBlending) return;
			const g = m.geometry;
			if (!g.boundingBox) g.computeBoundingBox();
			box.copy(g.boundingBox!);
			box.getSize(size);
			box.getCenter(center);
			// planos (tapete fino, piso, placa) não ganham casco
			if (Math.min(size.x, size.y, size.z) < 0.004) return;
			// a espessura é dada no espaço do grupo; compensa a escala do próprio mesh
			const ws = new THREE.Vector3();
			m.getWorldScale(ws);
			const gs = new THREE.Vector3();
			ref.current!.getWorldScale(gs);
			const t = thickness;
			const sx = 1 + (2 * t * (gs.x / ws.x)) / size.x;
			const sy = 1 + (2 * t * (gs.y / ws.y)) / size.y;
			const sz = 1 + (2 * t * (gs.z / ws.z)) / size.z;
			const hull = new THREE.Mesh(g, inkMat);
			hull.userData.inkHull = true;
			hull.scale.set(sx, sy, sz);
			hull.position.set(center.x * (1 - sx), center.y * (1 - sy), center.z * (1 - sz));
			hull.castShadow = false;
			hull.receiveShadow = false;
			hulls.push(hull);
			m.add(hull);
		});
		return () => hulls.forEach((h) => h.parent?.remove(h));
	});
	return <group ref={ref}>{children}</group>;
};
