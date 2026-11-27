// Mascote 3D low-poly do formato "Você Construiu": cabeça grande, camiseta amarela, bermuda azul,
// tênis azul, cabelo escuro; capacete amarelo opcional. Poses por parâmetros (determinístico).
import React, {useMemo} from 'react';
import * as THREE from 'three';

const D = THREE.MathUtils.degToRad;

export type Pose = {
	armL: [number, number]; // [pitch (frente +), roll (abre +)] graus
	armR: [number, number];
	foreL: number; // flexão do cotovelo (graus)
	foreR: number;
	legL: number; // pitch do quadril (frente +)
	legR: number;
	kneeL: number;
	kneeR: number;
	lean: number; // inclinação do tronco (frente +)
	bodyY: number; // deslocamento vertical (m)
	headTilt: number;
	headTurn: number;
	spin: number; // giro do corpo inteiro (graus)
	fall: number; // tombo de costas (graus)
};

export const POSE0: Pose = {armL: [0, 8], armR: [0, 8], foreL: 10, foreR: 10, legL: 0, legR: 0, kneeL: 0, kneeR: 0, lean: 0, bodyY: 0, headTilt: 0, headTurn: 0, spin: 0, fall: 0};

const sw = (t: number, f: number, a: number) => Math.sin(t * f) * a;

/** Biblioteca de poses (t = segundos, para ciclos). */
export const pose = (name: string, t = 0): Pose => {
	const p: Pose = {...POSE0, armL: [...POSE0.armL], armR: [...POSE0.armR]};
	switch (name) {
		case 'idle':
			p.bodyY = sw(t, 3, 0.006);
			p.armL = [0, 8 + sw(t, 3, 2)];
			p.armR = [0, 8 + sw(t, 3, 2)];
			break;
		case 'comemora':
			p.armL = [10, 150 + sw(t, 14, 15)];
			p.armR = [10, 150 - sw(t, 14, 15)];
			p.foreL = p.foreR = 15;
			p.bodyY = Math.abs(sw(t, 7, 0.06));
			break;
		case 'aponta':
			p.armR = [80, 15];
			p.foreR = 0;
			p.headTurn = -15;
			break;
		case 'cava':
			p.lean = 25 + sw(t, 9, 12);
			p.armL = [70 + sw(t, 9, 30), 10];
			p.armR = [60 + sw(t, 9, 30), -5];
			p.foreL = p.foreR = 40;
			p.kneeL = p.kneeR = 20;
			p.legL = p.legR = 15;
			break;
		case 'mangueira':
			p.armR = [55, 5];
			p.armL = [45, -10];
			p.foreR = 20;
			p.foreL = 50;
			break;
		case 'esfrega':
			p.lean = 30;
			p.armR = [70 + sw(t, 12, 15), -10];
			p.foreR = 30;
			p.armL = [20, 20];
			p.kneeL = p.kneeR = 25;
			p.legL = p.legR = 20;
			break;
		case 'despeja':
			p.armR = [95, 5];
			p.armL = [80, -15];
			p.foreR = 10;
			p.foreL = 40;
			p.lean = 10;
			break;
		case 'pula': {
			const h = Math.abs(Math.sin(t * 10));
			p.bodyY = h * 0.25;
			p.legL = 30 * h;
			p.kneeL = 60 * h;
			p.legR = -10;
			p.armL = [20, 70];
			p.armR = [20, 70];
			break;
		}
		case 'escorrega':
			p.fall = 70;
			p.legL = 70;
			p.legR = 50;
			p.armL = [40, 80];
			p.armR = [40, 80];
			p.bodyY = -0.25;
			break;
		case 'salta':
			p.armL = [170, 10];
			p.armR = [170, 10];
			p.foreL = p.foreR = 0;
			p.legL = p.legR = -5;
			break;
		case 'coca-olho':
			p.armL = [120, 25 + sw(t, 15, 6)];
			p.armR = [120, 25 - sw(t, 15, 6)];
			p.foreL = p.foreR = 110;
			p.headTilt = 10;
			break;
		case 'acena':
			p.armR = [10, 150];
			p.foreR = 20 + sw(t, 9, 25);
			break;
		case 'segura-borda':
			p.armL = [160, 25];
			p.armR = [160, 25];
			p.foreL = p.foreR = 10;
			p.legL = 20 + sw(t, 8, 15);
			p.legR = 20 - sw(t, 8, 15);
			break;
		case 'atolado':
			p.armL = [30, 60 + sw(t, 10, 20)];
			p.armR = [30, 60 - sw(t, 10, 20)];
			p.bodyY = -0.42;
			p.lean = -5;
			break;
		case 'sentado':
			p.legL = p.legR = 85;
			p.kneeL = p.kneeR = 85;
			p.armL = [35, 12];
			p.armR = [35, 12];
			p.foreL = p.foreR = 35;
			p.bodyY = -0.36;
			break;
		case 'sentado-bracos':
			p.legL = p.legR = 85;
			p.kneeL = p.kneeR = 85;
			p.armL = [165, 20 + sw(t, 12, 8)];
			p.armR = [165, 20 - sw(t, 12, 8)];
			p.foreL = p.foreR = 5;
			p.bodyY = -0.36;
			break;
		case 'sentado-susto':
			p.legL = p.legR = 85;
			p.kneeL = p.kneeR = 85;
			p.armL = [70, 5];
			p.armR = [70, 5];
			p.foreL = p.foreR = 10;
			p.bodyY = -0.36;
			p.headTilt = -8;
			break;
		case 'grita':
			p.armL = [10, 160];
			p.armR = [10, 160];
			p.foreL = p.foreR = 10;
			p.headTilt = -12;
			break;
		case 'anda':
			p.legL = sw(t, 9, 25);
			p.legR = -sw(t, 9, 25);
			p.armL = [-sw(t, 9, 25), 8];
			p.armR = [sw(t, 9, 25), 8];
			p.bodyY = Math.abs(sw(t, 9, 0.03));
			break;
	}
	return p;
};

export type Face = 'feliz' | 'neutro' | 'susto' | 'dor' | 'olho-vermelho';
export type Prop = 'pa' | 'mangueira' | 'rolo' | 'escova' | 'balde' | 'vassoura' | null;

const mat = (c: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
	new THREE.MeshStandardMaterial({color: c, flatShading: true, roughness: 0.85, metalness: 0, ...extra});

const C = {
	skin: '#F3C9A0',
	hair: '#3B2A22',
	shirt: '#F5C518',
	shorts: '#2F5DB8',
	shoe: '#2E7DD8',
	hat: '#F7C21B',
	ink: '#1B1B1B',
	white: '#FFFFFF',
	red: '#E63B2E',
};

export const Mascote3D: React.FC<{
	p?: Pose;
	position?: [number, number, number];
	rotY?: number; // graus
	scale?: number;
	hat?: boolean;
	face?: Face;
	prop?: Prop;
	t?: number;
}> = ({p = POSE0, position = [0, 0, 0], rotY = 0, scale = 1, hat = false, face = 'feliz', prop = null, t = 0}) => {
	const M = useMemo(
		() => ({
			skin: mat(C.skin),
			hair: mat(C.hair),
			shirt: mat(C.shirt),
			shorts: mat(C.shorts),
			shoe: mat(C.shoe),
			hat: mat(C.hat, {roughness: 0.5}),
			ink: mat(C.ink, {roughness: 0.4}),
			white: mat(C.white),
			red: mat(C.red),
			wood: mat('#9A6B3F'),
			metal: mat('#9AA3AD', {metalness: 0.3, roughness: 0.5}),
			hose: mat('#2FA84F'),
			roller: mat('#7FA6C9'),
		}),
		[],
	);
	const legLen = 0.36;
	const hipY = legLen + 0.06;
	const eyeY = face === 'dor' ? 0.0 : 0.02;
	const blink = (t % 3.1) < 0.08;
	const arm = (side: 1 | -1, a: [number, number], fore: number, withProp: boolean) => (
		<group position={[side * 0.2, 0.33, 0]} rotation={[-D(a[0]), 0, side * D(a[1])]}>
			<mesh position={[0, -0.05, 0]} material={M.shirt} castShadow>
				<boxGeometry args={[0.11, 0.12, 0.12]} />
			</mesh>
			<mesh position={[0, -0.13, 0]} material={M.skin} castShadow>
				<cylinderGeometry args={[0.04, 0.04, 0.16, 6]} />
			</mesh>
			<group position={[0, -0.21, 0]} rotation={[-D(fore), 0, 0]}>
				<mesh position={[0, -0.08, 0]} material={M.skin} castShadow>
					<cylinderGeometry args={[0.038, 0.035, 0.16, 6]} />
				</mesh>
				<mesh position={[0, -0.18, 0]} material={M.skin} castShadow>
					<icosahedronGeometry args={[0.05, 0]} />
				</mesh>
				{withProp && <PropMesh prop={prop} M={M} />}
			</group>
		</group>
	);
	const leg = (side: 1 | -1, hip: number, knee: number) => (
		<group position={[side * 0.09, 0, 0]} rotation={[-D(hip), 0, 0]}>
			<mesh position={[0, -0.09, 0]} material={M.skin} castShadow>
				<cylinderGeometry args={[0.05, 0.045, 0.18, 6]} />
			</mesh>
			<group position={[0, -0.18, 0]} rotation={[D(knee), 0, 0]}>
				<mesh position={[0, -0.08, 0]} material={M.skin} castShadow>
					<cylinderGeometry args={[0.045, 0.04, 0.16, 6]} />
				</mesh>
				<mesh position={[0, -0.18, 0.035]} material={M.shoe} castShadow>
					<boxGeometry args={[0.1, 0.07, 0.17]} />
				</mesh>
			</group>
		</group>
	);
	return (
		<group position={position} rotation={[0, D(rotY + p.spin), 0]} scale={scale}>
			<group position={[0, p.bodyY, 0]} rotation={[-D(p.fall), 0, 0]}>
				<group position={[0, hipY, 0]}>
					{leg(1, p.legL, p.kneeL)}
					{leg(-1, p.legR, p.kneeR)}
					<group rotation={[D(p.lean), 0, 0]}>
						{/* bermuda */}
						<mesh position={[0, 0.02, 0]} material={M.shorts} castShadow>
							<boxGeometry args={[0.32, 0.14, 0.2]} />
						</mesh>
						{/* camiseta */}
						<mesh position={[0, 0.22, 0]} material={M.shirt} castShadow>
							<boxGeometry args={[0.36, 0.3, 0.22]} />
						</mesh>
						{arm(1, p.armL, p.foreL, false)}
						{arm(-1, p.armR, p.foreR, true)}
						{/* cabeça */}
						<group position={[0, 0.58, 0]} rotation={[D(p.headTilt), D(p.headTurn), 0]}>
							<mesh material={face === 'olho-vermelho' ? M.skin : M.skin} castShadow>
								<icosahedronGeometry args={[0.22, 1]} />
							</mesh>
							{/* cabelo */}
							<mesh position={[0, 0.06, -0.02]} scale={[1.03, 0.8, 1.03]} material={M.hair}>
								<sphereGeometry args={[0.22, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2.1]} />
							</mesh>
							{/* olhos */}
							{[-1, 1].map((s) => (
								<group key={s} position={[s * 0.075, eyeY, 0.195]}>
									{face === 'olho-vermelho' && (
										<mesh position={[0, 0, -0.005]} material={M.red}>
											<sphereGeometry args={[0.045, 8, 6]} />
										</mesh>
									)}
									<mesh scale={[1, blink ? 0.15 : face === 'susto' ? 1.4 : 1, 1]} material={M.ink}>
										<sphereGeometry args={[0.028, 8, 6]} />
									</mesh>
								</group>
							))}
							{/* boca */}
							{face === 'feliz' && (
								<mesh position={[0, -0.075, 0.185]} rotation={[0, 0, Math.PI]} material={M.ink}>
									<torusGeometry args={[0.05, 0.012, 4, 10, Math.PI]} />
								</mesh>
							)}
							{(face === 'susto' || face === 'dor') && (
								<mesh position={[0, -0.08, 0.19]} material={M.ink} scale={[1, face === 'susto' ? 1.2 : 0.5, 0.5]}>
									<sphereGeometry args={[0.04, 8, 6]} />
								</mesh>
							)}
							{(face === 'neutro' || face === 'olho-vermelho') && (
								<mesh position={[0, -0.08, 0.19]} material={M.ink}>
									<boxGeometry args={[0.07, 0.012, 0.01]} />
								</mesh>
							)}
							{/* capacete */}
							{hat && (
								<group position={[0, 0.07, 0]}>
									<mesh material={M.hat} castShadow>
										<sphereGeometry args={[0.235, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
									</mesh>
									<mesh position={[0, 0, 0.04]} material={M.hat}>
										<cylinderGeometry args={[0.27, 0.27, 0.025, 12]} />
									</mesh>
									<mesh position={[0, 0.2, 0]} material={M.hat}>
										<boxGeometry args={[0.05, 0.06, 0.4]} />
									</mesh>
								</group>
							)}
						</group>
					</group>
				</group>
			</group>
		</group>
	);
};

const PropMesh: React.FC<{prop: Prop; M: Record<string, THREE.Material>}> = ({prop, M}) => {
	switch (prop) {
		case 'pa':
			return (
				<group position={[0, -0.2, 0]} rotation={[D(70), 0, 0]}>
					<mesh position={[0, -0.25, 0]} material={M.wood}>
						<cylinderGeometry args={[0.018, 0.018, 0.7, 5]} />
					</mesh>
					<mesh position={[0, -0.65, 0]} material={M.metal}>
						<boxGeometry args={[0.16, 0.2, 0.02]} />
					</mesh>
				</group>
			);
		case 'mangueira':
			return (
				<mesh position={[0, -0.2, 0.08]} rotation={[D(80), 0, 0]} material={M.hose}>
					<cylinderGeometry args={[0.03, 0.03, 0.22, 6]} />
				</mesh>
			);
		case 'rolo':
			return (
				<group position={[0, -0.22, 0]} rotation={[D(60), 0, 0]}>
					<mesh position={[0, -0.2, 0]} material={M.wood}>
						<cylinderGeometry args={[0.015, 0.015, 0.45, 5]} />
					</mesh>
					<mesh position={[0, -0.44, 0]} rotation={[0, 0, Math.PI / 2]} material={M.roller}>
						<cylinderGeometry args={[0.05, 0.05, 0.22, 8]} />
					</mesh>
				</group>
			);
		case 'escova':
			return (
				<group position={[0, -0.22, 0]} rotation={[D(60), 0, 0]}>
					<mesh position={[0, -0.2, 0]} material={M.wood}>
						<cylinderGeometry args={[0.015, 0.015, 0.45, 5]} />
					</mesh>
					<mesh position={[0, -0.44, 0]} material={M.shoe}>
						<boxGeometry args={[0.22, 0.05, 0.08]} />
					</mesh>
				</group>
			);
		case 'vassoura':
			return (
				<group position={[0, -0.22, 0]} rotation={[D(20), 0, 0]}>
					<mesh position={[0, -0.3, 0]} material={M.wood}>
						<cylinderGeometry args={[0.015, 0.015, 0.8, 5]} />
					</mesh>
					<mesh position={[0, -0.72, 0]} material={M.hat}>
						<boxGeometry args={[0.25, 0.1, 0.06]} />
					</mesh>
				</group>
			);
		case 'balde':
			return (
				<mesh position={[0, -0.28, 0.05]} material={M.white}>
					<cylinderGeometry args={[0.09, 0.07, 0.16, 8]} />
				</mesh>
			);
		default:
			return null;
	}
};
