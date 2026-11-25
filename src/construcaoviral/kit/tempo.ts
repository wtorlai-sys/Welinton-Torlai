// Kit "Construção Viral" — tempo, rebobinar e trilhas de câmera. Tudo puro (determinístico).
import * as THREE from 'three';
import {clamp, easeInOutCubic, lerp} from '../../style/easing';
import {noise1} from '../../style/random';

export type V3 = [number, number, number];

/** 0→1 suave entre a e b. */
export const k = (t: number, a: number, b: number) => {
	const x = clamp((t - a) / (b - a));
	return x * x * (3 - 2 * x);
};
/** Sobe em [a,b] e desce em [c,d]. */
export const win = (t: number, a: number, b: number, c: number, d: number) => k(t, a, b) * (1 - k(t, c, d));
/** Ativo em [a,b). */
export const on = (t: number, a: number, b = Infinity) => t >= a && t < b;

/* ------------------------------------------------------------------ */
/* Rebobinar: durante [at, at+dur) a cena inteira volta de `at` até `to` */
/* ------------------------------------------------------------------ */
export type Rewind = {at: number; dur: number; to: number};

export const mapRewind = (T: number, rewinds: Rewind[]) => {
	for (const r of rewinds) {
		if (T >= r.at && T < r.at + r.dur) {
			const x = (T - r.at) / r.dur;
			return lerp(r.at - 0.001, r.to, easeInOutCubic(x));
		}
	}
	return T;
};
export const rewindActive = (T: number, rewinds: Rewind[]) => rewinds.some((r) => T >= r.at && T < r.at + r.dur);

/* ------------------------------------------------------------------ */
/* Câmera: keyframes interpolados (plano-sequência) + cortes secos     */
/* ------------------------------------------------------------------ */
export type CamKey = {t: number; pos: V3; look: V3; fov?: number; cut?: boolean};
export type CamState = {pos: THREE.Vector3; look: THREE.Vector3; fov: number};

const vv = (a: V3) => new THREE.Vector3(...a);

export const cameraAt = (T: number, keys: CamKey[], shakes: {at: number; amp?: number}[] = []): CamState => {
	let i = 0;
	while (i < keys.length - 1 && keys[i + 1].t <= T) i++;
	const a = keys[i];
	const b = keys[Math.min(i + 1, keys.length - 1)];
	let x = b.t > a.t ? clamp((T - a.t) / (b.t - a.t)) : 0;
	if (b.cut) x = 0; // segura até o corte
	x = easeInOutCubic(x);
	const pos = vv(a.pos).lerp(vv(b.pos), x);
	const look = vv(a.look).lerp(vv(b.look), x);
	const fov = lerp(a.fov ?? 50, b.fov ?? 50, x);
	for (const s of shakes) {
		const d = T - s.at;
		if (d >= 0 && d < 0.35) {
			const amp = (s.amp ?? 0.12) * (1 - d / 0.35);
			pos.x += (noise1(T * 40, 1) - 0.5) * amp;
			pos.y += (noise1(T * 40, 2) - 0.5) * amp;
		}
	}
	return {pos, look, fov};
};

/* ------------------------------------------------------------------ */
/* Projeção 3D → tela (para etiquetas, setas e cotas em DOM/SVG)       */
/* ------------------------------------------------------------------ */
const projCam = new THREE.PerspectiveCamera(50, 1080 / 1920, 0.05, 2000);

export const makeProjector = (cam: CamState, width: number, height: number) => {
	projCam.fov = cam.fov;
	projCam.aspect = width / height;
	projCam.position.copy(cam.pos);
	projCam.lookAt(cam.look);
	projCam.updateProjectionMatrix();
	projCam.updateMatrixWorld(true);
	return (p: V3) => {
		const v = new THREE.Vector3(...p).project(projCam);
		return {x: (v.x * 0.5 + 0.5) * width, y: (-v.y * 0.5 + 0.5) * height, visible: v.z < 1 && v.z > -1};
	};
};
export type Projector = ReturnType<typeof makeProjector>;
