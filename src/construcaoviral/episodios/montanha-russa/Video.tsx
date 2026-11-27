// "Parabéns! Você construiu uma montanha-russa" — composição completa (148,7 s), cronometrada pela narração aprovada.
import React, {useEffect, useMemo, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {parseTimestamps, Word} from '../../../lib/timestamps';
import {ensureFonts} from '../../../style/fonts';
import {Ambiente, CLIMAS, climaMix} from '../../kit/Mundo';
import {cameraAt, CamState, k, makeProjector, mapRewind, rewindActive, V3} from '../../kit/tempo';
import {AZUL, Balao, CINZA, Confete, Cota, CTA, Destaque, Icone, Legenda, Pilula, Rebobinar, Rotulo, Seta, VERDE, VERMELHO} from '../../kit/Overlays';
import {Mascote3D, pose} from '../../kit/Mascote3D';
import {quadro} from '../../kit/Trilho';
import {C, CAMERA, DURACAO, estado, legendaY, REWINDS, TREMORES, trilhoDe, U, uTopoGota, uX, ZC} from './linha';
import {Cena} from './Cena';

export const MONTANHA_FPS = 30;
export const MONTANHA_FRAMES = Math.ceil(DURACAO * MONTANHA_FPS);
const ASSETS = {audio: 'construcaoviral/montanha-russa/narracao.mp3', ts: 'construcaoviral/montanha-russa/timestamps.json'};

const Cam: React.FC<{c: CamState}> = ({c}) => {
	const {camera, size} = useThree();
	const cam = camera as THREE.PerspectiveCamera;
	cam.fov = c.fov;
	cam.aspect = size.width / size.height;
	cam.near = 0.05;
	cam.far = 500;
	cam.position.copy(c.pos);
	cam.lookAt(c.look);
	cam.updateProjectionMatrix();
	return null;
};

const TERMOS: [number, number][] = [
	[5.5, 7.3],
	[23.1, 24.3],
	[36.9, 37.9],
	[47.0, 48.1],
	[61.2, 61.9],
	[85.4, 86.2],
	[97.2, 98.3],
	[112.2, 113.2],
	[128.1, 129.0],
	[142.1, 142.9],
];
const FUNCAO = new Set(['é', 'o', 'a', 'os', 'as', 'esse', 'essa', 'esses', 'essas', 'de', 'um', 'uma', 'você', 'construiu', 'são', 'da', 'em', 'na', 'ter', 'vai']);

export const MontanhaVideo: React.FC<{mudo?: boolean}> = ({mudo = false}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const T = frame / fps;
	const [words, setWords] = useState<Word[] | null>(null);
	const [handle] = useState(() => delayRender('timestamps montanha'));
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

	const t = mapRewind(T, REWINDS);
	const rew = rewindActive(T, REWINDS);
	const e = estado(t);
	const cam = cameraAt(t, CAMERA, rew ? [] : TREMORES);
	const P = makeProjector(cam, width, height);
	const p = (v: V3) => P(v);

	let clima = CLIMAS.dia;
	clima = climaMix(clima, CLIMAS.entardecer, k(t, 140.9, 142.6));

	// posição do carrinho principal (para etiquetas)
	const q = quadro(trilhoDe(e, e.c.trilho), e.c.u);
	const base = e.c.voo ? e.c.voo.pos : q.pos;
	const car = (dx = 0, dy = 0, dz = 0): V3 => [base.x + q.side.x * dx + q.up.x * dy + q.t.x * dz, base.y + q.side.y * dx + q.up.y * dy + q.t.y * dz, base.z + q.side.z * dx + q.up.z * dy + q.t.z * dz];

	const ev = (a: number, b2: number) => ({age: T - a, out: 1 - k(T, b2 - 0.2, b2), ativo: !rew && T >= a && T < b2});
	const pil = (a: number, b2: number, at: V3, text: string, cor: string, dy = 0, dx = 0) => {
		const x = ev(a, b2);
		if (!x.ativo) return null;
		const s = p(at);
		return <Pilula key={`p${a}${text}`} x={Math.min(Math.max(s.x + dx, 170), 880)} y={s.y + dy} text={text} cor={cor} age={x.age} out={x.out} />;
	};
	const rotY: number[] = [];
	const rot = (a: number, b2: number, at: V3, text: string, dy = -90) => {
		const x = ev(a, b2);
		if (!x.ativo) return null;
		const s = p(at);
		rotY.push(s.y + dy);
		return <Rotulo key={`r${a}`} x={Math.min(Math.max(s.x, 320), 760)} y={s.y + dy} text={text} age={x.age} out={x.out} />;
	};
	const seta = (a: number, b2: number, from: V3, to: V3, cor: string) => {
		const x = ev(a, b2);
		if (!x.ativo) return null;
		return <Seta key={`s${a}${from.join()}`} a={p(from)} b={p(to)} cor={cor} grow={k(x.age, 0, 0.35) * x.out} />;
	};
	const icone = (a: number, b2: number, at: V3, tipo: 'ok' | 'x', dy = 0) => {
		const x = ev(a, b2);
		if (!x.ativo) return null;
		const s = p(at);
		return <Icone key={`i${a}`} x={s.x} y={s.y + dy} tipo={tipo} age={x.age} />;
	};
	const balao = (a: number, b2: number, at: V3, text: string, dy = -120, cor?: string) => {
		const x = ev(a, b2);
		if (!x.ativo) return null;
		const s = p(at);
		return <Balao key={`b${a}`} x={Math.min(Math.max(s.x, 220), 860)} y={s.y + dy} text={text} age={x.age} cor={cor} />;
	};
	const destaque = (a: number, b2: number, at: V3, text: string, size = 90, dy = 0) => {
		const x = ev(a, b2);
		if (!x.ativo) return null;
		const s = p(at);
		return <Destaque key={`d${a}`} x={Math.min(Math.max(s.x, 260), 820)} y={s.y + dy} text={text} age={x.age} size={size} />;
	};
	const cota = (a: number, b2: number, A: V3, B: V3, text: string, lado = 1) => {
		const x = ev(a, b2);
		if (!x.ativo) return null;
		return <Cota key={`c${a}`} a={p(A)} b={p(B)} text={text} age={x.age} lado={lado} />;
	};
	const clac = (a: number, txt = 'CLAC!') => destaque(a, a + 0.45, car(0, 0.2, -1.4), txt, 110, -40);

	// carro da curva (para a seta "quer seguir reto")
	const qc = quadro(trilhoDe(e, 'A'), U.curva);
	const qTopo = quadro(trilhoDe(e, 'B'), uTopoGota);
	const qIma = quadro(C, uX(C, 8));

	// mascote grande no CTA
	const big = T >= 144.0;
	const fwd = new THREE.Vector3().subVectors(cam.look, cam.pos).normalize();
	const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
	const up = new THREE.Vector3().crossVectors(right, fwd).normalize();
	const entra = k(T, 144.0, 144.6);
	const bigPos = cam.pos.clone().addScaledVector(fwd, 2.8).addScaledVector(right, 0.42).addScaledVector(up, -1.02 - (1 - entra) * 1.2);
	const bigRot = THREE.MathUtils.radToDeg(Math.atan2(-fwd.x, -fwd.z));

	return (
		<AbsoluteFill style={{backgroundColor: clima.sky}}>
			{!mudo && <Audio src={staticFile(ASSETS.audio)} />}
			<ThreeCanvas width={width} height={height} shadows={{enabled: true, type: THREE.PCFShadowMap}} dpr={1} gl={{antialias: true}}>
				<Cam c={cam} />
				<Ambiente c={clima} focus={[cam.look.x, 0, cam.look.z]} />
				<Cena e={e} T={T} />
				{big && <Mascote3D p={pose('acena', T)} position={[bigPos.x, bigPos.y, bigPos.z]} rotY={bigRot} face="feliz" t={T} />}
			</ThreeCanvas>

			<AbsoluteFill style={{background: '#FFFFFF', opacity: e.flash * 0.85, pointerEvents: 'none'}} />

			<AbsoluteFill style={{pointerEvents: 'none'}}>
				{balao(6.9, 7.4, car(0, 1.5, 0), 'SPLASH!', -60, AZUL)}
				{cota(7.8, 11.4, [26.5, 0, 1.0], [26.5, 30.2, 1.0], '30 METROS', -1)}
				{destaque(9.56, 11.4, car(0, 2.5, 0), '+80 KM/H', 96)}
				{seta(12.9, 14.4, [qc.pos.x, qc.pos.y + 1.2, qc.pos.z], [qc.pos.x + qc.t.x * 9, qc.pos.y + 1.2, qc.pos.z + qc.t.z * 9], VERMELHO)}
				{pil(13.6, 14.4, [qc.pos.x + qc.t.x * 6, qc.pos.y + 2.4, qc.pos.z + qc.t.z * 6], 'QUER SEGUIR RETO', VERMELHO)}
				{pil(16.0, 18.7, car(-0.55, -0.4, 0.95), 'EMBAIXO', AZUL, 70)}
				{pil(17.6, 18.7, car(-0.55, 0.5, 0.95), 'EM CIMA', CINZA, -70)}
				{pil(18.3, 18.75, car(-0.75, 0, 0.95), 'DO LADO', CINZA, 0, -150)}
				{rot(23.2, 24.4, car(0, -0.4, 0), 'RODAS INFERIORES', 160)}
				{seta(27.0, 28.6, car(0, 1.6, 0.4), car(-2.2, 1.6, 0.4), VERMELHO)}
				{pil(27.5, 28.6, car(-2.6, 2.4, 0.4), 'JOGADO PRA FORA', VERMELHO)}
				{seta(33.4, 36.1, car(-1.6, 1.6, 0.4), car(-0.2, 1.1, 0.4), VERDE)}
				{pil(34.8, 36.1, car(0, 2.8, 0.4), 'CONTRA O BANCO', VERDE)}
				{rot(37.1, 38.0, [38.5, 3.2, -6.5], 'CURVA INCLINADA', -120)}
				{pil(41.9, 44.2, car(0, 0.2, 4), 'CORRENTE', CINZA, 0, 120)}
				{pil(43.9, 45.8, [-1.0, 1.2, -1.2], 'MOTOR', AZUL, -50)}
				{rot(47.6, 48.3, car(0, 0.6, 3), 'SUBIDA DE CORRENTE', -100)}
				{icone(49.25, 51.8, car(0, 2.2, 0), 'x')}
				{seta(50.4, 51.8, car(1.4, 1.4, 0), car(1.4, 1.4, -4), VERMELHO)}
				{pil(50.9, 51.8, car(1.6, 2.6, -2), 'DE RÉ!', VERMELHO)}
				{pil(54.4, 56.4, car(0, 0.0, 2.6), 'DENTES', CINZA, 40)}
				{pil(56.5, 58.3, car(0, 0.0, -0.9), 'GARRA', VERMELHO, 120)}
				{clac(56.98)}
				{clac(57.66)}
				{clac(58.02)}
				{clac(60.32, 'TRAVOU!')}
				{rot(61.5, 62.9, car(0, 0, -0.9), 'TRAVA ANTIRRETORNO', -160)}
				{clac(64.96)}
				{clac(65.54)}
				{clac(65.94)}
				{pil(69.8, 72.3, [7, 15.2, -34.8], 'LOOP REDONDO', CINZA)}
				{destaque(74.6, 75.6, car(0, 2.4, 0), '6X MAIS PESADO', 74)}
				{seta(76.2, 78.4, [7, 14.5, -34.8], [7, 17.8, -34.8], VERDE)}
				{pil(79.8, 81.0, [7, 1.5, -34.8], 'ABERTA E SUAVE', VERDE, 60)}
				{pil(81.9, 83.0, [7, 17.6, -34.8], 'FECHADA', AZUL, -40)}
				{pil(83.1, 84.6, car(0, -1.5, 0), 'DEVAGAR', AZUL)}
				{rot(85.7, 86.2, [7, 18.5, -34.8], 'LOOP EM GOTA', -60)}
				{pil(88.3, 89.0, [7, 1.0, -34.8], 'NENHUM É REDONDO', VERMELHO, 40)}
				{balao(90.0, 91.8, [qTopo.pos.x, qTopo.pos.y - 0.2, qTopo.pos.z], '?!', 80)}
				{pil(93.0, 94.4, [qTopo.pos.x, qTopo.pos.y - 1.6, qTopo.pos.z], 'BARRA', AMARELO_PIL, 40)}
				{icone(94.38, 96.0, [qTopo.pos.x + 0.6, qTopo.pos.y - 1.5, qTopo.pos.z], 'ok', 40)}
				{pil(95.9, 96.8, [qTopo.pos.x, qTopo.pos.y - 1.6, qTopo.pos.z], 'SÓ ABRE NA ESTAÇÃO', VERDE, 120)}
				{rot(97.4, 98.4, [qTopo.pos.x, qTopo.pos.y - 1.2, qTopo.pos.z], 'TRAVA DE SEGURANÇA', 180)}
				{pil(100.8, 101.8, car(0, 2.6, 0), 'RÁPIDO DEMAIS', VERMELHO)}
				{pil(103.6, 106.2, [qIma.pos.x, 0.4, ZC + 0.4], 'ÍMÃS', VERMELHO, 60)}
				{pil(105.0, 106.2, car(0, -0.4, 0), 'LÂMINA', CINZA, -110)}
				{pil(108.7, 110.7, car(0, -0.6, 0), 'SEM ENCOSTAR', VERDE, -150)}
				{pil(110.8, 111.6, car(0, -0.6, 0), 'SEM ENERGIA', AZUL, -150)}
				{icone(110.8, 111.6, car(1.0, -0.6, 0), 'ok', -150)}
				{rot(112.5, 113.2, [8, 0.8, ZC], 'FREIO MAGNÉTICO', -140)}
				{balao(118.74, 119.0, [-17, 3, ZC], 'CRASH!')}
				{pil(121.6, 127.5, [9, 1.6, ZC], 'TRECHO 1', VERDE, 70)}
				{pil(121.9, 127.5, [-20, 1.6, ZC], 'TRECHO 2', VERDE, 70)}
				{pil(126.7, 129.3, car(0, 2.4, 0), 'ESPERANDO', VERMELHO)}
				{rot(128.4, 129.3, [-12, 3.6, ZC - 1.6], 'BLOCOS', -80)}
				{icone(129.5, 131.0, [-12, 3.3, ZC - 1.6], 'ok', -40)}
				{pil(133.1, 134.25, [30, 24.2, 3.5], 'FOTO', CINZA, -90)}
				{pil(134.9, 136.05, [-12, 3.2, ZC + 2.4], 'FILA: 2 HORAS', VERMELHO, -60)}
				{balao(136.4, 138.2, [-21, 3.0, ZC], 'AAAAH!')}
			</AbsoluteFill>

			{rew && <Rebobinar x={T * 3} />}
			<Confete age={T - 140.9} />
			<CTA age={T - 144.0} sabia="ENGENHEIRO" naoSabia="PASSAGEIRO" />
			{words && (
				<Legenda
					words={words}
					T={T}
					y={(() => {
						const y0 = legendaY(T);
						return rotY.some((ry) => Math.abs(ry - y0 * height) < 230) ? (y0 < 0.5 ? 0.7 : 0.26) : y0;
					})()}
					amarelas={amarelas}
				/>
			)}
		</AbsoluteFill>
	);
};

const AMARELO_PIL = '#F5B700';

