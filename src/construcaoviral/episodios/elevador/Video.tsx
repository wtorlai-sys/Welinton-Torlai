// "Parabéns! Você construiu um elevador" — composição completa (146,6 s), cronometrada pela narração aprovada.
import React, {useEffect, useMemo, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {parseTimestamps, Word} from '../../../lib/timestamps';
import {ensureFonts} from '../../../style/fonts';
import {Ambiente, CLIMAS, climaMix} from '../../kit/Mundo';
import {cameraAt, CamState, k, makeProjector, mapRewind, rewindActive, V3, win} from '../../kit/tempo';
import {AZUL, Balao, CINZA, Confete, Cota, CTA, Destaque, Icone, Legenda, Pilula, Rebobinar, Rotulo, Seta, VERDE, VERMELHO} from '../../kit/Overlays';
import {Mascote3D, pose} from '../../kit/Mascote3D';
import {CAB, CAMERA, CP, DURACAO, estado, LIMIT, legendaY, mascote, POLIA, REWINDS, TREMORES, TRILHOS} from './linha';
import {Cena} from './Cena';

export const ELEVADOR_FPS = 30;
export const ELEVADOR_FRAMES = Math.ceil(DURACAO * ELEVADOR_FPS);
const ASSETS = {audio: 'construcaoviral/elevador/narracao.mp3', ts: 'construcaoviral/elevador/timestamps.json'};
const AMARELO_PIL = '#F5B700';

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
	[5.5, 7.0],
	[38.5, 39.7],
	[50.0, 51.0],
	[61.6, 62.9],
	[75.6, 76.8],
	[90.5, 91.7],
	[102.0, 103.7],
	[112.5, 113.8],
	[128.3, 129.5],
	[140.6, 141.4],
];
const FUNCAO = new Set(['é', 'o', 'a', 'os', 'as', 'esse', 'essa', 'esses', 'essas', 'de', 'um', 'uma', 'você', 'construiu', 'são', 'da', 'vai', 'ter']);

export const ElevadorVideo: React.FC<{mudo?: boolean}> = ({mudo = false}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const T = frame / fps;
	const [words, setWords] = useState<Word[] | null>(null);
	const [handle] = useState(() => delayRender('timestamps elevador'));
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
	const mm = mascote(t, e);
	const cam = cameraAt(t, CAMERA, rew ? [] : TREMORES);
	const P = makeProjector(cam, width, height);
	const p = (v: V3) => P(v);

	let clima = CLIMAS.dia;
	clima = climaMix(clima, CLIMAS.noite, e.semLuz * 0.75);
	clima = climaMix(clima, CLIMAS.entardecer, k(t, 139.4, 141.0));

	const y = e.y;
	const topoCab: V3 = [CAB.cx, y + CAB.h + 0.3, -0.5];
	const meioCab: V3 = [CAB.cx, y + 1.2, -0.5];
	const cpMeio: V3 = [CP.cx, e.cpY + CP.h / 2, -0.55];

	const ev = (a: number, b2: number) => ({age: T - a, out: 1 - k(T, b2 - 0.2, b2), ativo: !rew && T >= a && T < b2});
	const pil = (a: number, b2: number, at: V3, text: string, cor: string, dy = 0, dx = 0) => {
		const x = ev(a, b2);
		if (!x.ativo) return null;
		const q = p(at);
		return <Pilula key={`p${a}${text}`} x={q.x + dx} y={q.y + dy} text={text} cor={cor} age={x.age} out={x.out} />;
	};
	const rotY: number[] = [];
	const rot = (a: number, b2: number, at: V3, text: string, dy = -90) => {
		const x = ev(a, b2);
		if (!x.ativo) return null;
		const q = p(at);
		rotY.push(q.y + dy);
		return <Rotulo key={`r${a}`} x={Math.min(Math.max(q.x, 300), 780)} y={q.y + dy} text={text} age={x.age} out={x.out} />;
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
	const balao = (a: number, b2: number, at: V3, text: string, dy = -120, cor?: string) => {
		const x = ev(a, b2);
		if (!x.ativo) return null;
		const q = p(at);
		return <Balao key={`b${a}`} x={q.x} y={q.y + dy} text={text} age={x.age} cor={cor} />;
	};
	const destaque = (a: number, b2: number, at: V3, text: string, size = 90, dy = 0) => {
		const x = ev(a, b2);
		if (!x.ativo) return null;
		const q = p(at);
		return <Destaque key={`d${a}`} x={Math.min(Math.max(q.x, 260), 820)} y={q.y + dy} text={text} age={x.age} size={size} />;
	};
	const cota = (a: number, b2: number, A: V3, B: V3, text: string, lado = 1) => {
		const x = ev(a, b2);
		if (!x.ativo) return null;
		return <Cota key={`c${a}`} a={p(A)} b={p(B)} text={text} age={x.age} lado={lado} />;
	};
	const notas = (() => {
		const x = ev(135.5, 137.3);
		if (!x.ativo) return null;
		return (
			<div key="notas" style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%'}}>
				{[0, 1, 2, 3].map((i) => {
					const a = x.age - i * 0.25;
					if (a < 0) return null;
					return (
						<div key={i} style={{position: 'absolute', left: 300 + i * 150, top: 700 - a * 160, opacity: Math.max(0, 1 - a / 1.6), fontSize: 110, color: '#FFD21F', WebkitTextStroke: '6px #151515', fontWeight: 900}}>
							{i % 2 ? '♫' : '♪'}
						</div>
					);
				})}
			</div>
		);
	})();

	// mascote grande no CTA (preso à câmera)
	const big = T >= 141.6;
	const fwd = new THREE.Vector3().subVectors(cam.look, cam.pos).normalize();
	const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
	const up = new THREE.Vector3().crossVectors(right, fwd).normalize();
	const entra = k(T, 141.6, 142.2);
	const bigPos = cam.pos.clone().addScaledVector(fwd, 2.8).addScaledVector(right, 0.42).addScaledVector(up, -1.02 - (1 - entra) * 1.2);
	const bigRot = THREE.MathUtils.radToDeg(Math.atan2(-fwd.x, -fwd.z));

	return (
		<AbsoluteFill style={{backgroundColor: clima.sky}}>
			{!mudo && <Audio src={staticFile(ASSETS.audio)} />}
			<ThreeCanvas width={width} height={height} shadows={{enabled: true, type: THREE.PCFShadowMap}} dpr={1} gl={{antialias: true}}>
				<Cam c={cam} />
				<Ambiente c={clima} focus={[cam.look.x, Math.max(0, cam.look.y - 4), -1]} />
				<Cena e={e} mm={mm} T={T} />
				{big && <Mascote3D p={pose('acena', T)} position={[bigPos.x, bigPos.y, bigPos.z]} rotY={bigRot} hat face="feliz" t={T} />}
			</ThreeCanvas>

			<AbsoluteFill style={{pointerEvents: 'none'}}>
				{cota(4.9, 7.0, [2.4, 0, 0.1], [2.4, 33, 0.1], '12 ANDARES', -1)}
				{pil(7.9, 10.1, [CAB.cx, 35.8, -0.5], 'ESTICA', VERMELHO, 0, -230)}
				{pil(8.66, 10.1, [CAB.cx, 35.2, -0.5], 'DESFIA', VERMELHO, 0, 230)}
				{icone(9.36, 10.2, [CAB.cx, 34.6, -0.5], 'x')}
				{pil(10.9, 13.4, topoCab, '8 PESSOAS', CINZA, -40)}
				{destaque(12.6, 13.4, [CAB.cx, y + 3.3, -0.5], '+1 TONELADA', 84)}
				{seta(12.7, 13.4, [CAB.cx + 1.4, y + 2.2, -0.5], [CAB.cx + 1.4, y + 0.2, -0.5], VERMELHO)}
				{pil(15.1, 17.4, [CAB.cx, y + 6, -0.55], 'CABO DE AÇO', CINZA)}
				{pil(16.5, 23.9, [POLIA[0], POLIA[1] + 0.9, -2.0], 'MOTOR', AZUL, -60)}
				{balao(21.1, 23.9, [POLIA[0], POLIA[1] + 1.6, -2.0], 'ENORME!', -150)}
				{pil(22.3, 23.9, [POLIA[0], POLIA[1] - 0.9, -2.0], 'ENERGIA DEMAIS', VERMELHO, 40)}
				{pil(26.6, 28.0, [CP.cx, e.cpY + CP.h + 0.4, -0.55], 'BLOCO DE FERRO', CINZA, -20)}
				{seta(28.0, 29.9, [CAB.cx - 1.2, y + 0.5, -0.5], [CAB.cx - 1.2, y + 3.5, -0.5], AZUL)}
				{seta(28.0, 29.9, [CP.cx + 1.0, e.cpY + 3.0, -0.5], [CP.cx + 1.0, e.cpY, -0.5], AZUL)}
				{seta(30.1, 31.7, [CAB.cx - 1.2, y + 3.5, -0.5], [CAB.cx - 1.2, y + 0.5, -0.5], AZUL)}
				{seta(30.1, 31.7, [CP.cx + 1.0, e.cpY, -0.5], [CP.cx + 1.0, e.cpY + 3.0, -0.5], AZUL)}
				{pil(31.9, 35.5, meioCab, 'CABINE', CINZA, 0, -120)}
				{pil(32.5, 35.5, cpMeio, 'CABINE + ½ LOTAÇÃO', CINZA, 0, 180)}
				{pil(36.3, 38.3, [POLIA[0], POLIA[1] + 1.2, -0.55], 'SÓ A DIFERENÇA', VERDE, -40)}
				{rot(38.9, 39.9, cpMeio, 'CONTRAPESO', -120)}
				{seta(41.6, 44.3, [CAB.cx, y + 1.2, -0.5], [CAB.cx - 1.6, y + 1.2, -0.5], VERMELHO)}
				{balao(43.2, 44.4, [CAB.cx - 1.5, y + 2.2, -0.5], 'BAM!')}
				{pil(45.2, 48.8, [TRILHOS.cab[0], 18, -0.5], 'TRILHOS', CINZA, 0, -170)}
				{rot(50.6, 51.3, [TRILHOS.cab[0], y + 2.6, -0.5], 'GUIAS', -60)}
				{icone(51.8, 53.3, [CAB.cx, y + CAB.h + 1.4, -0.5], 'x')}
				{balao(53.25, 53.4, [CAB.cx, 0.9, -0.5], 'CRASH!')}
				{destaque(56.4, 58.0, [CAB.cx, 28.5, -0.55], 'VÁRIOS CABOS', 80)}
				{pil(58.5, 61.0, [CAB.cx, y + CAB.h + 1.8, -0.55], 'CADA UM AGUENTA A CABINE CHEIA', CINZA, -30)}
				{rot(62.4, 63.1, [CAB.cx, y + CAB.h + 2.4, -0.55], 'CABOS DE TRAÇÃO', -60)}
				{pil(63.4, 65.3, topoCab, 'SEM ENERGIA', VERMELHO, -40)}
				{pil(67.9, 70.2, [POLIA[0] + 0.85, POLIA[1] + 0.4, -0.17], 'MOLAS', CINZA, -90)}
				{pil(70.3, 71.9, [POLIA[0], POLIA[1] + 0.7, -0.17], 'ENERGIA ABRE', AMARELO_PIL, -80)}
				{pil(71.9, 74.9, [POLIA[0], POLIA[1] + 0.7, -0.17], 'SEM ENERGIA: FECHA', VERMELHO, -80)}
				{rot(76.0, 77.1, [POLIA[0], POLIA[1] - 0.6, -0.17], 'FREIO DA MÁQUINA', 120)}
				{icone(79.2, 80.4, [CAB.cx + 0.9, y + 2.4, -0.5], 'ok')}
				{pil(83.4, 88.4, topoCab, 'RÁPIDO DEMAIS', VERMELHO, -40)}
				{seta(83.4, 88.4, [CAB.cx + 1.3, y + 2.6, -0.5], [CAB.cx + 1.3, y + 0.2, -0.5], VERMELHO)}
				{pil(86.1, 90.0, [TRILHOS.cab[0], y - 0.18, -0.5], 'GARRAS', VERMELHO, 90)}
				{rot(90.8, 92.0, [TRILHOS.cab[0], y + 0.3, -0.5], 'FREIO DE SEGURANÇA', -110)}
				{pil(94.7, 97.4, [LIMIT[0], LIMIT[1] + 0.45, LIMIT[2]], 'RODA', CINZA, -40)}
				{pil(96.9, 99.4, [LIMIT[0] + 0.22, LIMIT[1] - 1.4, LIMIT[2]], 'CABO FINO', CINZA, 0, 140)}
				{balao(99.5, 100.05, [LIMIT[0], LIMIT[1] + 0.3, LIMIT[2]], 'TRAVOU!', -110)}
				{pil(100.5, 101.7, [-1.27, y + 0.6, -0.75], 'ALAVANCA', AMARELO_PIL, -80)}
				{rot(102.4, 103.9, [LIMIT[0], LIMIT[1] - 0.5, LIMIT[2]], 'LIMITADOR DE VELOCIDADE', 150)}
				{balao(105.74, 106.0, [CAB.cx, e.fundo + 1.6, -0.5], 'CRASH!')}
				{pil(109.9, 112.9, [CAB.cx, e.fundo + 0.5, -0.5], 'MOLAS', CINZA, 0, 220)}
				{rot(113.0, 114.1, [CAB.cx, e.fundo + 0.6, -0.5], 'AMORTECEDORES', 200)}
				{cota(114.3, 117.1, [1.95, 0, 0.1], [1.95, e.fundo, 0.1], 'ABAIXO DO TÉRREO', -1)}
				{balao(120.7, 121.15, [CAB.cx, 18 + 1.6, -1.6], '?!', -40)}
				{icone(120.9, 121.15, [CAB.cx, 18 - 0.8, -1.0], 'x')}
				{pil(123.0, 124.8, [0.32, 18 + 1.2, -1.2], 'TRAVA', VERMELHO, -70)}
				{icone(124.8, 125.6, [0.32, 18 + 1.2, -1.2], 'ok', -70)}
				{pil(126.0, 128.0, [CAB.cx, 18 + 2.6, -1.2], 'PORTA ABERTA = MOTOR PARADO', VERMELHO, -30)}
				{rot(128.8, 129.8, [CAB.cx, 18 + 2.2, -1.2], 'INTERTRAVAMENTO', -80)}
				{icone(131.2, 132.9, [CAB.cx + 1.0, 18 + 1.4, -1.2], 'ok')}
				{pil(133.6, 134.25, [-1.13, 19.4, -0.55], 'ESPELHO', CINZA, -60)}
				{pil(134.8, 135.45, [0.42, 19.05, -0.35], 'ALARME', VERMELHO, -80)}
				{notas}
			</AbsoluteFill>

			{rew && <Rebobinar x={T * 3} />}
			<Confete age={T - 139.36} />
			<CTA age={T - 141.58} sabia="ASCENSORISTA" naoSabia="ESCADA" />
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
