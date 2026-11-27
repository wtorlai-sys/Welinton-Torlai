// Kit "Construção Viral" — trilho 3D (montanha-russa, trem, etc.): curva suave por pontos, "para cima" por
// transporte paralelo (loops funcionam), inclinação por ponto, malha com trilhos, coluna, dormentes e pilares,
// e física simples de gravidade para o carrinho descer/subir de ré.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {V3} from './tempo';

export type Trilho = {
	curve: THREE.CatmullRomCurve3;
	len: number;
	N: number;
	P: THREE.Vector3[];
	Tn: THREE.Vector3[];
	Up: THREE.Vector3[];
	Sd: THREE.Vector3[];
	U: number[]; // u (0..1, por comprimento) de cada amostra
};

const Y = new THREE.Vector3(0, 1, 0);

/** pts: pontos de controle; banks: inclinação em graus por ponto (positivo = deita para a esquerda do sentido). */
export const criaTrilho = (pts: V3[], banks?: number[], N = 500): Trilho => {
	const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
	const len = curve.getLength();
	const P: THREE.Vector3[] = [];
	const Tn: THREE.Vector3[] = [];
	const Up: THREE.Vector3[] = [];
	const Sd: THREE.Vector3[] = [];
	const U: number[] = [];
	let up = new THREE.Vector3();
	for (let i = 0; i <= N; i++) {
		const u = i / N;
		const p = curve.getPointAt(u);
		const t = curve.getTangentAt(u).normalize();
		if (i === 0) up = Y.clone().sub(t.clone().multiplyScalar(Y.dot(t))).normalize();
		else {
			const t0 = Tn[i - 1];
			const ax = new THREE.Vector3().crossVectors(t0, t);
			const s = ax.length();
			if (s > 1e-6) up.applyAxisAngle(ax.normalize(), Math.atan2(s, t0.dot(t)));
			up.sub(t.clone().multiplyScalar(up.dot(t))).normalize();
		}
		P.push(p);
		Tn.push(t);
		Up.push(up.clone());
		U.push(u);
	}
	// inclinação
	if (banks && banks.length === pts.length) {
		for (let i = 0; i <= N; i++) {
			const tp = curve.getUtoTmapping(U[i], 0) * (pts.length - 1);
			const j = Math.min(pts.length - 2, Math.floor(tp));
			const f = tp - j;
			const b = THREE.MathUtils.degToRad(banks[j] * (1 - f) + banks[j + 1] * f);
			Up[i].applyAxisAngle(Tn[i], b);
		}
	}
	for (let i = 0; i <= N; i++) Sd.push(new THREE.Vector3().crossVectors(Tn[i], Up[i]).normalize());
	return {curve, len, N, P, Tn, Up, Sd, U};
};

export type Quadro = {pos: THREE.Vector3; t: THREE.Vector3; up: THREE.Vector3; side: THREE.Vector3};

export const quadro = (tr: Trilho, u: number): Quadro => {
	const x = Math.min(1, Math.max(0, u)) * tr.N;
	const i = Math.min(tr.N - 1, Math.floor(x));
	const f = x - i;
	const L = (a: THREE.Vector3, b: THREE.Vector3) => a.clone().lerp(b, f);
	const t = L(tr.Tn[i], tr.Tn[i + 1]).normalize();
	const up = L(tr.Up[i], tr.Up[i + 1]).normalize();
	return {pos: L(tr.P[i], tr.P[i + 1]), t, up, side: new THREE.Vector3().crossVectors(t, up).normalize()};
};

/** Matriz de mundo para um objeto alinhado ao trilho (x = lado, y = cima, z = frente). */
export const matrizEm = (q: Quadro, alt = 0) => {
	const m = new THREE.Matrix4().makeBasis(q.side.clone().negate(), q.up, q.t);
	m.setPosition(q.pos.clone().addScaledVector(q.up, alt));
	return m;
};

/** Primeiro u (varrendo de uA a uB) em que `teste(ponto)` é verdadeiro. */
export const uOnde = (tr: Trilho, teste: (p: THREE.Vector3) => boolean, uA = 0, uB = 1) => {
	for (let i = Math.floor(uA * tr.N); i <= Math.ceil(uB * tr.N); i++) if (teste(tr.P[Math.min(tr.N, i)])) return tr.U[Math.min(tr.N, i)];
	return uB;
};

/** Física simples: integra u(t) sob gravidade a partir de (u0, v0 m/s), com atrito leve. Retorna tabela a 240 Hz. */
export const simula = (tr: Trilho, u0: number, v0: number, dur: number, atrito = 0.015, vMin = 0) => {
	const dt = 1 / 240;
	const us: number[] = [u0];
	const vs: number[] = [v0];
	let u = u0;
	let v = v0;
	for (let k = 0; k < dur / dt; k++) {
		const q = quadro(tr, u);
		v += (-9.8 * q.t.y - atrito * v * Math.abs(v) * 0.05 - Math.sign(v) * atrito) * dt;
		if (vMin > 0 && v < vMin) v = vMin;
		u += (v * dt) / tr.len;
		u = Math.min(1, Math.max(0, u));
		us.push(u);
		vs.push(v);
	}
	return {
		u: (t: number) => {
			const x = Math.min(us.length - 1, Math.max(0, t / dt));
			const i = Math.min(us.length - 2, Math.floor(x));
			return us[i] + (us[i + 1] - us[i]) * (x - i);
		},
		v: (t: number) => vs[Math.min(vs.length - 1, Math.max(0, Math.round(t / dt)))],
	};
};

/* ------------------------------------ malha ------------------------------------ */
const tubo = (pts: THREE.Vector3[], r: number, segs: number) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), segs, r, 6, false);

export const TrilhoMalha: React.FC<{tr: Trilho; chave: string; matTrilho: THREE.Material; matColuna: THREE.Material; matPilar: THREE.Material; bitola?: number; pilares?: boolean}> = ({
	tr,
	chave,
	matTrilho,
	matColuna,
	matPilar,
	bitola = 0.55,
	pilares = true,
}) => {
	const geo = useMemo(() => {
		const step = 2;
		const idx: number[] = [];
		for (let i = 0; i <= tr.N; i += step) idx.push(i);
		if (idx[idx.length - 1] !== tr.N) idx.push(tr.N);
		const L = idx.map((i) => tr.P[i].clone().addScaledVector(tr.Sd[i], -bitola));
		const R = idx.map((i) => tr.P[i].clone().addScaledVector(tr.Sd[i], bitola));
		const C = idx.map((i) => tr.P[i].clone().addScaledVector(tr.Up[i], -0.42));
		const segs = Math.max(40, Math.round(tr.len * 2));
		return {l: tubo(L, 0.075, segs), r: tubo(R, 0.075, segs), c: tubo(C, 0.15, segs)};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [chave]);
	const dormentes = useMemo(() => {
		const out: {m: THREE.Matrix4}[] = [];
		const passo = Math.max(1, Math.round((1.1 / tr.len) * tr.N));
		for (let i = 0; i <= tr.N; i += passo) {
			const q = {pos: tr.P[i], t: tr.Tn[i], up: tr.Up[i], side: tr.Sd[i]};
			out.push({m: matrizEm(q, -0.2)});
		}
		return out;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [chave]);
	const cols = useMemo(() => {
		if (!pilares) return [];
		const out: {x: number; z: number; y: number}[] = [];
		const passo = Math.max(1, Math.round((4.5 / tr.len) * tr.N));
		for (let i = 0; i <= tr.N; i += passo) {
			const p = tr.P[i].clone().addScaledVector(tr.Up[i], -0.45);
			if (tr.Up[i].y > 0.5 && p.y > 1.0) out.push({x: p.x, z: p.z, y: p.y});
		}
		return out;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [chave]);
	return (
		<group>
			<mesh geometry={geo.l} material={matTrilho} castShadow />
			<mesh geometry={geo.r} material={matTrilho} castShadow />
			<mesh geometry={geo.c} material={matColuna} castShadow />
			{dormentes.map((d, i) => (
				<mesh key={i} matrixAutoUpdate={false} matrix={d.m} material={matColuna}>
					<boxGeometry args={[bitola * 2 + 0.1, 0.08, 0.12]} />
				</mesh>
			))}
			{cols.map((c, i) => (
				<mesh key={`p${i}`} position={[c.x, c.y / 2, c.z]} material={matPilar} castShadow>
					<cylinderGeometry args={[0.13, 0.18, c.y, 6]} />
				</mesh>
			))}
		</group>
	);
};
