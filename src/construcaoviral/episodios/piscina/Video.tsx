// "Parabéns! Você construiu uma piscina" — composição completa (163,1 s), cronometrada pela narração aprovada.
import React, {useEffect, useMemo, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {parseTimestamps, Word} from '../../../lib/timestamps';
import {ensureFonts} from '../../../style/fonts';
import {Ambiente, CLIMAS, climaMix} from '../../kit/Mundo';
import {cameraAt, CamState, k, makeProjector, mapRewind, rewindActive, V3, win} from '../../kit/tempo';
import {AZUL, Avanco, Balao, Calor, CINZA, Chuva, Confete, Cota, CTA, Destaque, Icone, Legenda, Lupa, Pilula, Rebobinar, ReguaPH, Rotulo, Seta, Subaquatico, VERDE, VERMELHO} from '../../kit/Overlays';
import {Mascote3D, pose} from '../../kit/Mascote3D';
import {boia, CAMERA, DURACAO, estado, FUNDO_AGUA, legendaY, mascote, NIVEL, REWINDS, TREMORES} from './linha';
import {Cena} from './Cena';

export const PISCINA_FPS = 30;
export const PISCINA_FRAMES = Math.ceil(DURACAO * PISCINA_FPS);

const ASSETS = {audio: 'construcaoviral/piscina/narracao.mp3', ts: 'construcaoviral/piscina/timestamps.json'};

/** Câmera da cena controlada pelo estado calculado (determinístico). */
const Cam: React.FC<{c: CamState}> = ({c}) => {
	const {camera, size} = useThree();
	const cam = camera as THREE.PerspectiveCamera;
	cam.fov = c.fov;
	cam.aspect = size.width / size.height;
	cam.near = 0.05;
	cam.far = 400;
	cam.position.copy(c.pos);
	cam.lookAt(c.look);
	cam.updateProjectionMatrix();
	return null;
};

/** Janelas de termo: palavras faladas dentro delas ficam amarelas na legenda. */
const TERMOS: [number, number][] = [
	[4.4, 5.2],
	[40.0, 41.3],
	[52.3, 53.5],
	[59.6, 60.6],
	[75.2, 76.0],
	[83.5, 84.3],
	[92.9, 93.9],
	[108.4, 108.95],
	[120.6, 121.6],
	[131.2, 131.95],
	[149.9, 151.1],
	[157.8, 158.5],
];
const FUNCAO = new Set(['é', 'o', 'a', 'esse', 'essa', 'de', 'uma', 'você', 'construiu']);

export const PiscinaVideo: React.FC<{mudo?: boolean}> = ({mudo = false}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const T = frame / fps;
	const [words, setWords] = useState<Word[] | null>(null);
	const [handle] = useState(() => delayRender('timestamps piscina'));
	useEffect(() => {
		ensureFonts();
		fetch(staticFile(ASSETS.ts))
			.then((r) => r.json())
			.then((j) => setWords(parseTimestamps(j)))
			.finally(() => continueRender(handle));
	}, [handle]);

	const amarelas = useMemo(() => {
		const s = new Set<string>();
		(words ?? []).forEach((w, i) => {
			const clean = w.text.replace(/[.,;:!?…"“”]/g, '').toLowerCase();
			if (!FUNCAO.has(clean) && TERMOS.some(([a, b]) => w.start >= a && w.start <= b)) s.add(`${i}`);
		});
		return s;
	}, [words]);

	// tempo de cena (com rebobinar) → estado, câmera, personagens
	const t = mapRewind(T, REWINDS);
	const rew = rewindActive(T, REWINDS);
	const e = estado(t);
	const b = boia(t, e);
	const mm = mascote(t);
	const cam = cameraAt(t, CAMERA, rew ? [] : TREMORES);
	const P = makeProjector(cam, width, height);
	const p = (v: V3) => P(v);

	// clima
	let clima = CLIMAS.dia;
	clima = climaMix(clima, CLIMAS.sol, win(t, 121.6, 122.2, 125.4, 126.2));
	clima = climaMix(clima, CLIMAS.chuva, win(t, 134.4, 135.2, 147.0, 149.0));
	clima = climaMix(clima, CLIMAS.entardecer, k(t, 156.0, 157.6));

	// debaixo d'água?
	const nivel = FUNDO_AGUA + (NIVEL - FUNDO_AGUA) * e.agua;
	const sub = e.estrutura && e.corte < 0.5 && cam.pos.y < nivel - 0.02 && Math.abs(cam.pos.x) < 1.75 && Math.abs(cam.pos.z) < 3.75 ? 1 : 0;

	// eventos (tempo real): idade e fade de saída
	const ev = (a: number, b2: number) => ({age: T - a, out: 1 - k(T, b2 - 0.2, b2), ativo: !rew && T >= a && T < b2});
	const pil = (a: number, b2: number, at: V3, text: string, cor: string, dy = 0) => {
		const x = ev(a, b2);
		if (!x.ativo) return null;
		const q = p(at);
		return <Pilula key={`p${a}${text}`} x={q.x} y={q.y + dy} text={text} cor={cor} age={x.age} out={x.out} />;
	};
	const rotY: number[] = [];
	const rot = (a: number, b2: number, at: V3, text: string, dy = -90) => {
		const x = ev(a, b2);
		if (!x.ativo) return null;
		const q = p(at);
		rotY.push(q.y + dy);
		return <Rotulo key={`r${a}`} x={q.x} y={q.y + dy} text={text} age={x.age} out={x.out} />;
	};
	const seta = (a: number, b2: number, from: V3, to: V3, cor: string) => {
		const x = ev(a, b2);
		if (!x.ativo) return null;
		return <Seta key={`s${a}${from.join()}`} a={p(from)} b={p(to)} cor={cor} grow={k(x.age, 0, 0.35) * x.out} />;
	};
	const icone = (a: number, b2: number, at: V3, tipo: 'ok' | 'x', dy = 0) => {
		const x = ev(a, b2);
		if (!x.ativo) return null;
		const q = p(at);
		return <Icone key={`i${a}`} x={q.x} y={q.y + dy} tipo={tipo} age={x.age} />;
	};
	const cota = (a: number, b2: number, A: V3, B: V3, text: string, lado = 1) => {
		const x = ev(a, b2);
		if (!x.ativo) return null;
		return <Cota key={`c${a}${text}`} a={p(A)} b={p(B)} text={text} age={x.age} lado={lado} />;
	};

	const nivelLinha = (() => {
		const x = ev(116.6, 121.6);
		if (!x.ativo) return null;
		const A = p([-1.8, NIVEL, 0.05]);
		const B = p([5.6, NIVEL, 0.05]);
		const g = k(x.age, 0, 0.6);
		return (
			<svg key="nivel" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
				<line x1={A.x} y1={A.y} x2={A.x + (B.x - A.x) * g} y2={A.y + (B.y - A.y) * g} stroke="#151515" strokeWidth={13} strokeDasharray="34 22" />
				<line x1={A.x} y1={A.y} x2={A.x + (B.x - A.x) * g} y2={A.y + (B.y - A.y) * g} stroke={AZUL} strokeWidth={7} strokeDasharray="34 22" />
			</svg>
		);
	})();

	// mascote grande no CTA (preso à câmera, canto inferior direito)
	const big = T >= 158.7;
	const fwd = new THREE.Vector3().subVectors(cam.look, cam.pos).normalize();
	const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
	const up = new THREE.Vector3().crossVectors(right, fwd).normalize();
	const entra = k(T, 158.7, 159.3);
	const bigPos = cam.pos.clone().addScaledVector(fwd, 2.8).addScaledVector(right, 0.42).addScaledVector(up, -1.02 - (1 - entra) * 1.2);
	const bigRot = THREE.MathUtils.radToDeg(Math.atan2(-fwd.x, -fwd.z));

	return (
		<AbsoluteFill style={{backgroundColor: clima.sky}}>
			{!mudo && <Audio src={staticFile(ASSETS.audio)} />}
			<ThreeCanvas width={width} height={height} shadows={{enabled: true, type: THREE.PCFShadowMap}} dpr={1} gl={{antialias: true}}>
				<Cam c={cam} />
				<Ambiente c={clima} focus={[0.5, 0, 0]} />
				<Cena e={e} boia={b} mascote={mm} T={T} />
				{big && <Mascote3D p={pose('acena', T)} position={[bigPos.x, bigPos.y, bigPos.z]} rotY={bigRot} scale={1} face="feliz" t={T} />}
			</ThreeCanvas>

			<Subaquatico k={sub} />
			<Chuva T={T} k={win(t, 134.6, 135.3, 147.0, 148.6)} />
			<Calor T={T} k={rew ? 0 : win(T, 121.8, 122.3, 124.4, 125.3)} y={p([2.05, 0.1, 1.9]).y + 40} />

			<AbsoluteFill style={{pointerEvents: 'none'}}>
				{/* Ato 1 */}
				{pil(5.5, 11.5, [-0.6, -0.4, 0], 'ÁGUA', AZUL)}
				{pil(7.4, 11.5, [-0.9, -1.95, 0], 'TERRA ENCHARCADA', CINZA)}
				{seta(7.2, 11.4, [0, -1.25, 0], [0, -2.3, 0], AZUL)}
				{seta(7.4, 11.4, [-1.7, -0.75, 0], [-2.9, -0.75, 0], AZUL)}
				{seta(7.6, 11.4, [1.7, -0.75, 0], [2.9, -0.75, 0], AZUL)}
				{cota(12.4, 15.8, [-2, 0.1, 4.4], [2, 0.1, 4.4], '4 m', 1)}
				{cota(12.8, 15.8, [2.4, 0.1, 4], [2.4, 0.1, -4], '8 m', -1)}
				{(() => {
					const x = ev(15.2, 18.7);
					if (!x.ativo) return null;
					const q = p([0, 1.4, 0]);
					return <Destaque key="litros" x={q.x} y={q.y} text="45.000 L" age={x.age} />;
				})()}
				{pil(17.0, 18.7, [0, 0.55, 0], '45 TONELADAS', VERMELHO)}
				{seta(16.9, 18.7, [-1, 0.1, 1.5], [-1, -1.5, 1.5], VERMELHO)}
				{seta(17.0, 18.7, [1, 0.1, -1.5], [1, -1.5, -1.5], VERMELHO)}
				{seta(17.1, 18.7, [1.4, -0.7, 2.5], [2.8, -0.7, 2.5], VERMELHO)}
				{pil(19.6, 21.0, [0, 0.35, 1.5], 'LONA', CINZA)}
				{icone(24.7, 26.75, [1.5, -0.35, -0.5], 'x')}
				{/* concreto armado */}
				{pil(29.7, 32.4, [0, 0.45, 0], 'AÇO', CINZA)}
				{pil(32.8, 35.3, [0, -0.15, 0], 'CHEIA', AZUL)}
				{seta(32.9, 35.3, [-1.1, -0.75, 0], [-2.6, -0.75, 0], AZUL)}
				{seta(32.9, 35.3, [1.1, -0.75, 0], [2.6, -0.75, 0], AZUL)}
				{seta(33.0, 35.3, [0, -0.85, 0], [0, -2.0, 0], AZUL)}
				{pil(35.5, 37.75, [0, -0.15, 0], 'VAZIA', VERMELHO)}
				{seta(35.5, 37.75, [-3.4, -0.75, 0], [-2.1, -0.75, 0], VERMELHO)}
				{seta(35.5, 37.75, [3.4, -0.75, 0], [2.1, -0.75, 0], VERMELHO)}
				{seta(37.9, 40.6, [-1.0, -0.55, 0], [-1.75, -0.55, 0], VERDE)}
				{seta(37.9, 40.6, [-3.1, -0.9, 0], [-2.05, -0.9, 0], VERDE)}
				{rot(40.6, 41.4, [-1.9, -0.1, 0], 'CONCRETO ARMADO', -120)}
				{pil(42.2, 45.85, [-1.9, -0.2, 0], 'POROS', AZUL, -60)}
				{/* impermeabilização e revestimento */}
				{pil(48.2, 51.6, [0.3, -0.25, -3.75], 'CAMADA ELÁSTICA', CINZA, -40)}
				{seta(49.2, 51.0, [0.2, -0.6, -3.7], [-1.0, -0.6, -3.7], VERDE)}
				{seta(49.2, 51.0, [0.9, -0.6, -3.7], [1.7, -0.6, -3.7], VERDE)}
				{rot(52.5, 53.6, [0, -0.2, -3.6], 'IMPERMEABILIZAÇÃO')}
				{(() => {
					const x = ev(55.9, 56.26);
					if (!x.ativo) return null;
					const q = p([0.6, -0.5, -3.6]);
					return <Balao key="rasgou" x={q.x} y={q.y - 120} text="RASGOU!" age={x.age} />;
				})()}
				{rot(59.7, 60.7, [0, -0.3, 0], 'REVESTIMENTO')}
				{seta(61.8, 64.9, [-1.55, -0.5, 0], [-1.71, -0.55, 0], AZUL)}
				{pil(61.8, 64.9, [-1.5, -0.45, 0], 'AZULEJO', AZUL, -30)}
				{seta(62.4, 64.9, [-1.55, -0.8, 0], [-1.76, -0.8, 0], CINZA)}
				{pil(62.4, 64.9, [-1.45, -0.8, 0], 'IMPERMEABILIZAÇÃO', CINZA, -30)}
				{seta(63.0, 64.9, [-1.55, -1.1, 0], [-1.9, -1.1, 0], CINZA)}
				{pil(63.0, 64.9, [-1.5, -1.1, 0], 'CONCRETO', CINZA, -30)}
				{icone(63.8, 64.9, [-1.5, -1.3, 0], 'ok')}
				{/* água verde, filtro */}
				{pil(67.0, 69.9, [0, 0.9, 0], 'POUCOS DIAS', VERMELHO)}
				{seta(71.2, 74.6, [2.0, -0.45, 0.1], [3.5, -0.45, 0.1], AZUL)}
				{seta(71.6, 74.6, [3.5, -0.25, 0.1], [2.0, -0.25, 0.1], AZUL)}
				{pil(72.6, 75.3, [4.75, 0.35, -0.3], 'AREIA', CINZA)}
				{rot(75.4, 76.1, [4.75, 0.3, -0.3], 'FILTRO', -150)}
				{seta(79.6, 82.9, [-0.2, -0.05, -2.4], [0.85, -0.12, -3.55], AZUL)}
				{pil(81.6, 83.0, [1.0, -0.45, -3.75], 'CESTO', CINZA, 60)}
				{rot(83.7, 85.2, [1.0, 0.1, -3.8], 'SKIMMER', -80)}
				{pil(85.3, 85.95, [1.0, -0.4, -3.75], '“COADEIRA”', CINZA, 60)}
				{/* ralo de fundo */}
				{seta(90.2, 92.6, [-0.9, -0.55, -2.4], [-0.2, -1.0, -2.4], AZUL)}
				{seta(90.2, 92.6, [0.9, -0.55, -2.4], [0.2, -1.0, -2.4], AZUL)}
				{rot(93.1, 94.1, [0, -0.9, -2.4], 'RALO DE FUNDO', -110)}
				{pil(95.6, 97.4, [0, -0.85, -1.85], '2 RALOS', CINZA, -60)}
				{icone(96.5, 97.4, [0.8, -0.85, -1.85], 'ok')}
				{pil(98.2, 100.65, [0, -0.7, -1.3], 'SUCÇÃO', VERMELHO, -90)}
				{seta(98.0, 100.6, [-0.6, -0.6, -1.3], [-0.05, -1.05, -1.3], VERMELHO)}
				{icone(99.6, 100.65, [0.6, -0.8, -1.3], 'x')}
				{/* cloro */}
				{(() => {
					const x = ev(101.0, 108.4);
					if (!x.ativo) return null;
					return <Lupa key="lupa" x={540} y={620} age={x.age} limpa={k(T, 104.4, 106.0)} T={T} />;
				})()}
				{(() => {
					const x = ev(101.6, 103.3);
					if (!x.ativo) return null;
					return (
						<React.Fragment key="bichos">
							<Pilula x={330} y={330} text="BACTÉRIA" cor={VERMELHO} age={x.age} out={x.out} />
							<Pilula x={760} y={930} text="ALGA" cor={VERMELHO} age={x.age - 0.3} out={x.out} />
						</React.Fragment>
					);
				})()}
				{(() => {
					const x = ev(105.6, 108.9);
					if (!x.ativo) return null;
					return <ReguaPH key="ph1" x={540} y={1060} age={x.age} v={0.12 + 0.38 * k(T, 106.3, 107.3)} />;
				})()}
				{rot(108.6, 109.2, [2.3, 1.2, 0.9], 'CLORO', -40)}
				{pil(109.8, 114.2, [2.45, 1.55, 0.9], 'OLHO ARDENDO', VERMELHO, -40)}
				{(() => {
					const x = ev(111.6, 114.2);
					if (!x.ativo) return null;
					return <ReguaPH key="ph2" x={540} y={420} age={x.age} v={0.86} />;
				})()}
				{/* casa de máquinas */}
				{nivelLinha}
				{pil(117.2, 121.7, [5.7, NIVEL, 0.05], 'NÍVEL DA ÁGUA', AZUL, -55)}
				{rot(120.9, 121.8, [4.4, 0.75, 0], 'CASA DE MÁQUINAS', -70)}
				{/* borda */}
				{pil(122.4, 125.35, [1.35, 0.1, 3.0], 'QUENTE', VERMELHO, 60)}
				{seta(128.8, 130.6, [2.0, 0.3, 2.3], [2.7, 0.05, 2.3], AZUL)}
				{rot(131.2, 132.1, [2.05, 0.2, 2.6], 'BORDA ATÉRMICA', -230)}
				{/* água do chão, válvula */}
				{pil(136.6, 138.9, [-1.2, -2.3, 0], 'ÁGUA DO CHÃO', AZUL)}
				{seta(136.5, 138.9, [-1.0, -3.0, 0], [-1.0, -1.65, 0], AZUL)}
				{seta(136.6, 138.9, [1.0, -3.0, 0], [1.0, -1.65, 0], AZUL)}
				{seta(144.3, 146.8, [0.6, -2.1, 0], [0.6, -1.25, 0], AZUL)}
				{seta(147.2, 149.1, [-1.0, -0.6, 0], [-1.0, -1.1, 0], VERDE)}
				{seta(147.2, 149.1, [1.0, -0.6, 0], [1.0, -1.1, 0], VERDE)}
				{icone(147.6, 149.1, [0, -0.5, 0], 'ok')}
				{rot(150.2, 151.35, [0.6, -0.95, -0.5], 'VÁLVULA HIDROSTÁTICA', -110)}
			</AbsoluteFill>

			{/* avanço rápido (timelapse) */}
			{!rew && [[0.3, 1.8], [57.0, 59.0], [66.0, 69.6], [126.3, 128.2]].some(([a, b2]) => T >= a && T < b2) && <Avanco />}
			{rew && <Rebobinar x={T * 3} />}
			<Confete age={T - 156.6} />
			<CTA age={T - 158.7} sabia="PISCINEIRO" naoSabia="BOIA" />

			{words && <Legenda words={words} T={T} y={(() => {
				const y0 = legendaY(T);
				return rotY.some((ry) => Math.abs(ry - y0 * height) < 230) ? (y0 < 0.5 ? 0.7 : 0.27) : y0;
			})()} amarelas={amarelas} />}
		</AbsoluteFill>
	);
};

