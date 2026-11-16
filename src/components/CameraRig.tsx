// STYLE_GUIDE §6 — câmera com presets, easing e shake de impacto.
// Tudo calculado a partir de useCurrentFrame() (determinístico).
import React from 'react';
import * as THREE from 'three';
import {PerspectiveCamera} from '@react-three/drei';
import {useCurrentFrame} from 'remotion';
import {clamp, easeInOutCubic, lerp} from '../style/easing';
import {noise1} from '../style/random';
import {REF} from '../style/constants';

export type V3 = [number, number, number];
export type ShotPreset = 'estabelecimento' | 'aereo' | 'medio' | 'close' | 'contraplano';
export type MoveType = 'static' | 'pushIn' | 'pullOut' | 'orbit' | 'crane' | 'truck';

export type Shot = {
	/** frame inicial (inclusive) */
	from: number;
	durationInFrames: number;
	/** use preset + subject, OU position/target explícitos */
	preset?: ShotPreset;
	/** ponto de interesse (normalmente cabeça do personagem) */
	subject?: V3;
	/** para onde o assunto está virado (graus em Y; 0 = +Z) */
	facing?: number;
	/** ângulo extra em torno do assunto (graus) */
	angle?: number;
	dist?: number;
	height?: number;
	/** deslocamento do ponto de mira em relação ao subject (compõe o quadro) */
	aim?: V3;
	position?: V3;
	target?: V3;
	fov?: number;
	roll?: number;
	move?: MoveType;
	/** push/pull: fração da distância; orbit: graus; crane: metros; truck: metros */
	amount?: number;
	/** termina o movimento com easing (padrão easeInOutCubic) */
	ease?: (x: number) => number;
};

export type Shake = {frame: number; duration?: number; intensity?: number; seed?: number};

type CamState = {position: THREE.Vector3; target: THREE.Vector3; fov: number; roll: number};

const D = THREE.MathUtils.degToRad;
const v = (a: V3) => new THREE.Vector3(...a);

/** Resolve a posição base de um preset com os VALORES DE REFERÊNCIA (STYLE_GUIDE §10). */
export const resolvePreset = (s: Shot): CamState => {
	const R = REF.camera;
	if (s.position && s.target) return {position: v(s.position), target: v(s.target), fov: s.fov ?? R.fov, roll: s.roll ?? 0};
	const S = v(s.subject ?? [0, 1, 0]);
	const yaw = D((s.facing ?? 0) + (s.angle ?? 0));
	const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
	const side = new THREE.Vector3(fwd.z, 0, -fwd.x);
	const aim = v(s.aim ?? [0, 0, 0]);
	const at = (dist: number, height: number) => S.clone().addScaledVector(fwd, dist).setY(height);
	switch (s.preset ?? 'medio') {
		case 'estabelecimento':
			// 3–4 m de altura, assunto a 10–15 m
			return {position: at(s.dist ?? R.establishing.dist, s.height ?? R.establishing.height), target: S.clone().add(aim), fov: s.fov ?? R.fov, roll: s.roll ?? 0};
		case 'aereo': {
			// drone simétrico: 40–80 m, olhando 60–90° para baixo
			const h = s.height ?? R.aerial.height;
			const pitch = D(s.dist ?? R.aerial.pitch); // em 'aereo', dist = pitch em graus
			const back = h / Math.tan(pitch);
			const pos = S.clone().addScaledVector(fwd, Math.max(0.01, back)).setY(h);
			return {position: pos, target: S.clone().add(aim).setY(0), fov: s.fov ?? R.fov, roll: s.roll ?? 0};
		}
		case 'medio':
			// 1,2 m de altura, personagem a 3–4 m
			return {position: at(s.dist ?? R.medium.dist, s.height ?? R.medium.height), target: S.clone().add(aim), fov: s.fov ?? R.fov, roll: s.roll ?? 0};
		case 'close': {
			// 1,0 m, FOV 40°, rosto (≈ cabeça de 0,35 m) ocupando 40% da altura do quadro
			const fov = s.fov ?? R.close.fov;
			const head = 0.35;
			const dist = s.dist ?? head / (R.close.faceFill * 2 * Math.tan(D(fov) / 2));
			return {position: at(dist, s.height ?? R.close.height), target: S.clone().add(aim), fov, roll: s.roll ?? 0};
		}
		case 'contraplano': {
			const pos = S.clone().addScaledVector(fwd, -(s.dist ?? 1.6)).addScaledVector(side, 0.55).setY(s.height ?? R.height + 0.2);
			return {position: pos, target: S.clone().addScaledVector(fwd, 8).add(aim), fov: s.fov ?? R.fov, roll: s.roll ?? 0};
		}
	}
};

const applyMove = (base: CamState, s: Shot, p: number): CamState => {
	const out = {position: base.position.clone(), target: base.target.clone(), fov: base.fov, roll: base.roll};
	const dir = base.target.clone().sub(base.position);
	switch (s.move ?? 'static') {
		case 'static':
			break;
		case 'pushIn':
			out.position.addScaledVector(dir, (s.amount ?? REF.camera.pushIn) * p);
			break;
		case 'pullOut':
			out.position.addScaledVector(dir, -(s.amount ?? REF.camera.pushIn) * p);
			break;
		case 'orbit': {
			const off = base.position.clone().sub(base.target).applyAxisAngle(new THREE.Vector3(0, 1, 0), D(Math.min(REF.camera.orbitMax, s.amount ?? 10) * (p - 0.5)));
			out.position.copy(base.target).add(off);
			break;
		}
		case 'crane':
			out.position.y += (s.amount ?? 1) * p;
			break;
		case 'truck': {
			const side = new THREE.Vector3(dir.z, 0, -dir.x).normalize();
			out.position.addScaledVector(side, (s.amount ?? 1) * (p - 0.5));
			out.target.addScaledVector(side, (s.amount ?? 1) * (p - 0.5));
			break;
		}
	}
	return out;
};

/** Shot ativo no frame (o último cujo `from` <= frame). */
export const activeShot = (shots: Shot[], frame: number) => {
	let idx = 0;
	shots.forEach((s, i) => {
		if (s.from <= frame) idx = i;
	});
	return {index: idx, shot: shots[idx]};
};

/** Estado da câmera no frame (sem shake) — útil para calcular projeções na cena. */
export const cameraAt = (shots: Shot[], frame: number): CamState => {
	const {shot} = activeShot(shots, frame);
	const p = (shot.ease ?? easeInOutCubic)(clamp((frame - shot.from) / Math.max(1, shot.durationInFrames - 1)));
	return applyMove(resolvePreset(shot), shot, p);
};

/** Shake curto (6-10 frames) com decaimento; ruído suave e determinístico. */
export const shakeOffset = (shakes: Shake[], frame: number) => {
	const o = new THREE.Vector3();
	let roll = 0;
	shakes.forEach(({frame: f0, duration = REF.camera.shake.duration, intensity = REF.camera.shake.intensity, seed = 1}) => {
		const k = (frame - f0) / duration;
		if (k < 0 || k > 1) return;
		const amp = intensity * Math.pow(1 - k, 2);
		const t = (frame - f0) * 0.9;
		o.x += (noise1(t, seed) - 0.5) * 2 * amp;
		o.y += (noise1(t, seed + 3) - 0.5) * 2 * amp;
		o.z += (noise1(t, seed + 7) - 0.5) * amp;
		roll += (noise1(t, seed + 11) - 0.5) * 2 * amp * 0.5;
	});
	return {offset: o, roll};
};

export const CameraRig: React.FC<{shots: Shot[]; shakes?: Shake[]}> = ({shots, shakes = []}) => {
	const frame = useCurrentFrame();
	const cam = cameraAt(shots, frame);
	const {offset, roll} = shakeOffset(shakes, frame);
	const pos = cam.position.clone().add(offset);
	const m = new THREE.Matrix4().lookAt(pos, cam.target.clone().add(offset.clone().multiplyScalar(0.5)), new THREE.Vector3(0, 1, 0));
	const q = new THREE.Quaternion().setFromRotationMatrix(m);
	q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), D(cam.roll) + roll));
	return <PerspectiveCamera makeDefault position={pos} quaternion={q} fov={cam.fov} near={0.05} far={2000} />;
};

export {lerp};
