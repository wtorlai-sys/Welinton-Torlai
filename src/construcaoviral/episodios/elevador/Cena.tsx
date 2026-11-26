// "Você construiu um elevador" — cena 3D. Prédio de 12 andares sempre em corte (metade da frente removida em z=0),
// poço com cabine, contrapeso, guias, máquina com freio de molas, limitador de velocidade e amortecedores.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Mascote3D, pose} from '../../kit/Mascote3D';
import {Arvore, CORES, Fundo, flat} from '../../kit/Mundo';
import {Barra, Bloco, Mola} from '../../kit/Geom';
import {k, V3} from '../../kit/tempo';
import {hash1} from '../../../style/random';
import {ANDAR, ANDAR_PORTA, CAB, CP, Estado, LIMIT, MascoteEst, POLIA, R_POLIA, TOPO, TRILHOS} from './linha';

const useMats = () =>
	useMemo(
		() => ({
			grama: flat(CORES.grama),
			terra: flat(CORES.terra),
			firme: flat(CORES.terraFirme),
			laje: flat('#C4C7CC'),
			parede: flat('#EFE4D0'),
			paredeB: flat('#E3D3BA'),
			poco: flat('#9EA4AC'),
			porta: flat('#B9C3CC', {metalness: 0.1, roughness: 0.4}),
			vidro: flat('#9FD3F0', {roughness: 0.3}),
			madeira: flat('#B07A45'),
			corda: flat('#D9B98A'),
			aco: flat('#7E8791', {metalness: 0.1, roughness: 0.35}),
			cabo: flat('#3B4148', {metalness: 0.1, roughness: 0.4}),
			cabine: flat('#D8DEE4', {metalness: 0.1, roughness: 0.4}),
			cabineChao: flat('#6B5A4A'),
			ferro: flat('#5B6168', {metalness: 0.1, roughness: 0.6}),
			motor: flat('#2F6FD8'),
			tambor: flat('#AEB6BF', {metalness: 0.1, roughness: 0.3}),
			sapata: flat('#E0A030'),
			mola: flat('#E9C23A', {metalness: 0.1}),
			trilho: flat('#6F7882', {metalness: 0.1, roughness: 0.35}),
			garra: flat('#E63B2E'),
			alavanca: flat('#E9C23A'),
			trava: flat('#E63B2E'),
			travaOk: flat('#2DBE5A'),
			faisca: new THREE.MeshBasicMaterial({color: '#FFD84A'}),
			luz: new THREE.MeshStandardMaterial({color: '#FFFFFF', emissive: '#FFF4D6', emissiveIntensity: 1}),
			espelho: new THREE.MeshStandardMaterial({color: '#D6EEF8', metalness: 0.1, roughness: 0.1, emissive: '#9CCBE0', emissiveIntensity: 0.35}),
			painel: flat('#30363D'),
			botao: new THREE.MeshStandardMaterial({color: '#E63B2E', emissive: '#E63B2E', emissiveIntensity: 0.4}),
			vaso: flat('#C8673A'),
			folha: flat('#4FA83B'),
			poeira: new THREE.MeshStandardMaterial({color: '#EDE3D2', transparent: true, opacity: 0.8, flatShading: true}),
			realce: new THREE.MeshBasicMaterial({color: '#FFD21F', transparent: true, opacity: 0.45, depthWrite: false}),
		}),
		[],
	);
type Mats = ReturnType<typeof useMats>;

/* ------------------------------------ prédio ------------------------------------ */
const POCO = {x0: -1.8, x1: 1.8, z0: -1.2};
const PR = {x0: -5, x1: 5, z0: -4};

const Predio: React.FC<{e: Estado; M: Mats}> = ({e, M}) => {
	const lajes: React.ReactNode[] = [];
	for (let i = 0; i <= 12; i++) {
		const y = i * ANDAR;
		const y0 = y - 0.2;
		const key = `l${i}`;
		lajes.push(
			<React.Fragment key={key}>
				<Bloco min={[PR.x0, y0, PR.z0]} max={[POCO.x0, y, 0]} mat={M.laje} />
				<Bloco min={[POCO.x1, y0, PR.z0]} max={[PR.x1, y, 0]} mat={M.laje} />
				<Bloco min={[POCO.x0, y0, PR.z0]} max={[POCO.x1, y, POCO.z0 - 0.2]} mat={M.laje} />
			</React.Fragment>,
		);
	}
	// parede do fundo do poço com aberturas de porta em cada andar (x -0.85..0.15, h 2.1)
	const paredePoco: React.ReactNode[] = [];
	for (let i = 0; i < 12; i++) {
		const y = i * ANDAR;
		paredePoco.push(
			<React.Fragment key={`pp${i}`}>
				<Bloco min={[POCO.x0, y, POCO.z0 - 0.2]} max={[-0.85, y + ANDAR - 0.2, POCO.z0]} mat={M.poco} />
				<Bloco min={[0.15, y, POCO.z0 - 0.2]} max={[POCO.x1, y + ANDAR - 0.2, POCO.z0]} mat={M.poco} />
				<Bloco min={[-0.85, y + 2.1, POCO.z0 - 0.2]} max={[0.15, y + ANDAR - 0.2, POCO.z0]} mat={M.poco} />
			</React.Fragment>,
		);
		// portas de pavimento (duas folhas que correm para os lados)
		const n = i + 1;
		const ab = n === ANDAR_PORTA ? e.portaAberta : n === 12 ? e.porta12 : 0;
		const w = 0.5;
		paredePoco.push(
			<React.Fragment key={`pt${i}`}>
				<Bloco min={[-0.85 - ab * 0.45, y, POCO.z0 - 0.14]} max={[-0.85 + w - ab * 0.45, y + 2.1, POCO.z0 - 0.06]} mat={M.porta} sombra={false} />
				<Bloco min={[0.15 - w + ab * 0.45, y, POCO.z0 - 0.14]} max={[0.15 + ab * 0.45, y + 2.1, POCO.z0 - 0.06]} mat={M.porta} sombra={false} />
			</React.Fragment>,
		);
	}
	const yP = (ANDAR_PORTA - 1) * ANDAR;
	M.trava.emissiveIntensity = e.realce.trava * 0.8;
	return (
		<group>
			{lajes}
			{paredePoco}
			{/* paredes do poço (laterais) do fundo do poço até a cobertura */}
			<Bloco min={[POCO.x0 - 0.2, e.fundo, POCO.z0 - 0.2]} max={[POCO.x0, TOPO, 0]} mat={M.poco} />
			<Bloco min={[POCO.x1, e.fundo, POCO.z0 - 0.2]} max={[POCO.x1 + 0.2, TOPO, 0]} mat={M.poco} />
			{/* paredes externas */}
			<Bloco min={[PR.x0, 0, PR.z0 - 0.2]} max={[PR.x1, TOPO + 1.0, PR.z0]} mat={M.paredeB} />
			<Bloco min={[PR.x0 - 0.2, 0, PR.z0 - 0.2]} max={[PR.x0, TOPO + 1.0, 0]} mat={M.parede} />
			<Bloco min={[PR.x1, 0, PR.z0 - 0.2]} max={[PR.x1 + 0.2, TOPO + 1.0, 0]} mat={M.parede} />
			{/* janelas nas paredes laterais */}
			{Array.from({length: 12}).map((_, i) => (
				<React.Fragment key={`j${i}`}>
					<Bloco min={[PR.x0 - 0.22, i * ANDAR + 1.0, -2.8]} max={[PR.x0 - 0.18, i * ANDAR + 2.1, -1.4]} mat={M.vidro} sombra={false} />
					<Bloco min={[PR.x1 + 0.18, i * ANDAR + 1.0, -2.8]} max={[PR.x1 + 0.22, i * ANDAR + 2.1, -1.4]} mat={M.vidro} sombra={false} />
				</React.Fragment>
			))}
			{/* casa de máquinas na cobertura */}
			<Bloco min={[-2.4, TOPO, -2.6]} max={[3.0, TOPO + 3.2, -2.4]} mat={M.paredeB} />
			<Bloco min={[-2.6, TOPO, -2.6]} max={[-2.4, TOPO + 3.2, 0]} mat={M.parede} />
			<Bloco min={[3.0, TOPO, -2.6]} max={[3.2, TOPO + 3.2, 0]} mat={M.parede} />
			<Bloco min={[-2.6, TOPO + 3.2, -2.6]} max={[3.2, TOPO + 3.45, 0]} mat={M.laje} />
			{/* trava da porta do 7º andar */}
			{e.trava > 0 && (
				<mesh position={[0.32, yP + 1.2, POCO.z0 - 0.03]} scale={e.trava} material={e.travaSolta ? M.travaOk : M.trava}>
					<boxGeometry args={[0.14, 0.22, 0.08]} />
				</mesh>
			)}
		</group>
	);
};

const Terreno: React.FC<{e: Estado; M: Mats}> = ({e, M}) => {
	const chao = (x: [number, number], z: [number, number]) => (
		<>
			<Bloco min={[x[0], -0.08, z[0]]} max={[x[1], 0, z[1]]} mat={M.grama} />
			<Bloco min={[x[0], -3, z[0]]} max={[x[1], -0.08, z[1]]} mat={M.terra} sombra={false} />
			<Bloco min={[x[0], -9, z[0]]} max={[x[1], -3, z[1]]} mat={M.firme} sombra={false} />
		</>
	);
	return (
		<group>
			{chao([-14, -2.0], [-14, 0])}
			{chao([2.0, 14], [-14, 0])}
			{chao([-2.0, 2.0], [-14, -1.4])}
			<Bloco min={[-2.0, Math.min(-3, e.fundo), -1.4]} max={[2.0, e.fundo, 0]} mat={M.terra} sombra={false} />
			<Bloco min={[-2.0, -9, -1.4]} max={[2.0, Math.min(-3, e.fundo), 0]} mat={M.firme} sombra={false} />
			{/* piso do fundo do poço */}
			<Bloco min={[POCO.x0, e.fundo - 0.12, POCO.z0]} max={[POCO.x1, e.fundo, 0]} mat={M.laje} />
		</group>
	);
};

/* ------------------------------------ peças ------------------------------------ */
const Planta: React.FC<{pos: V3; tomba: number; M: Mats}> = ({pos, tomba, M}) => (
	<group position={pos} rotation={[0, 0, tomba * 1.3]}>
		<mesh position={[0, 0.15, 0]} material={M.vaso} castShadow>
			<cylinderGeometry args={[0.13, 0.1, 0.3, 8]} />
		</mesh>
		{[0, 1, 2].map((i) => (
			<mesh key={i} position={[Math.sin(i * 2.1) * 0.08, 0.45 + i * 0.07, Math.cos(i * 2.1) * 0.08]} material={M.folha}>
				<icosahedronGeometry args={[0.15 - i * 0.02, 0]} />
			</mesh>
		))}
	</group>
);

const Poeira: React.FC<{at: V3; age: number; s?: number; M: Mats}> = ({at, age, s = 1, M}) => {
	if (age < 0 || age > 0.9) return null;
	const g = k(age, 0, 0.35);
	M.poeira.opacity = 0.85 * (1 - k(age, 0.4, 0.9));
	return (
		<group position={at} scale={s}>
			{Array.from({length: 10}).map((_, i) => {
				const a = (i / 10) * Math.PI * 2;
				return (
					<mesh key={i} position={[Math.cos(a) * 0.9 * g, 0.2 + hash1(i) * 0.5 * g, Math.sin(a) * 0.4 * g]} scale={0.3 + g * 0.6} material={M.poeira}>
						<icosahedronGeometry args={[0.4, 0]} />
					</mesh>
				);
			})}
		</group>
	);
};

const Cabine: React.FC<{e: Estado; M: Mats; T: number}> = ({e, M, T}) => {
	const y = e.y;
	const {x0, x1, z0, z1, h} = CAB;
	M.luz.emissiveIntensity = e.luzCabine;
	const tomba = Math.min(1, Math.max(0, (e.velocidade - 6) / 6));
	// garras: abertura em volta de cada trilho
	const gap = 0.06 + 0.1 * (1 - e.garrasFecham);
	M.garra.emissive.set('#FFD21F');
	M.garra.emissiveIntensity = e.realce.garras * 0.9;
	return (
		<group>
			{/* caixa da cabine (frente aberta = corte) */}
			<Bloco min={[x0, y, z0]} max={[x1, y + 0.12, z1]} mat={M.cabineChao} />
			<Bloco min={[x0, y + h - 0.1, z0]} max={[x1, y + h, z1]} mat={M.cabine} />
			<Bloco min={[x0, y, z0]} max={[x0 + 0.06, y + h, z1]} mat={M.cabine} />
			<Bloco min={[x1 - 0.06, y, z0]} max={[x1, y + h, z1]} mat={M.cabine} />
			<Bloco min={[x0, y, z0]} max={[-0.85, y + h, z0 + 0.06]} mat={M.cabine} />
			<Bloco min={[0.15, y, z0]} max={[x1, y + h, z0 + 0.06]} mat={M.cabine} />
			<Bloco min={[-0.85, y + 2.1, z0]} max={[0.15, y + h, z0 + 0.06]} mat={M.cabine} />
			<mesh position={[CAB.cx, y + h - 0.12, -0.5]} material={M.luz}>
				<boxGeometry args={[0.6, 0.03, 0.3]} />
			</mesh>
			{e.luzCabine > 0 && <pointLight position={[CAB.cx, y + h - 0.4, -0.4]} intensity={1.2} distance={4} color="#FFF4D6" />}
			{/* armação (travessão + montantes) */}
			<Bloco min={[x0 - 0.12, y + h, -0.6]} max={[x1 + 0.12, y + h + 0.25, -0.4]} mat={M.aco} />
			<Bloco min={[x0 - 0.12, y - 0.25, -0.6]} max={[x0 - 0.02, y + h + 0.25, -0.4]} mat={M.aco} />
			<Bloco min={[x1 + 0.02, y - 0.25, -0.6]} max={[x1 + 0.12, y + h + 0.25, -0.4]} mat={M.aco} />
			<Bloco min={[x0 - 0.12, y - 0.25, -0.6]} max={[x1 + 0.12, y - 0.1, -0.4]} mat={M.aco} />
			{/* freio de segurança: garras em volta de cada trilho */}
			{e.garras > 0 &&
				TRILHOS.cab.map((rx) => (
					<group key={rx} scale={e.garras} position={[rx, y - 0.18, -0.5]}>
						<mesh position={[-gap - 0.06, 0, 0]} material={M.garra}>
							<boxGeometry args={[0.12, 0.28, 0.22]} />
						</mesh>
						<mesh position={[gap + 0.06, 0, 0]} material={M.garra}>
							<boxGeometry args={[0.12, 0.28, 0.22]} />
						</mesh>
					</group>
				))}
			{/* alavanca ligada ao cabo do limitador */}
			{e.limitador > 0 && (
				<mesh position={[-1.27, y + 0.4, -0.75]} rotation={[0, 0, 0.5 - e.alavanca * 1.0]} material={M.alavanca}>
					<boxGeometry args={[0.05, 0.5, 0.05]} />
				</mesh>
			)}
			{/* espelho e painel */}
			{e.espelho > 0 && (
				<mesh position={[x0 + 0.07, y + 1.4, -0.55]} scale={[1, e.espelho, e.espelho]} material={M.espelho}>
					<boxGeometry args={[0.02, 1.2, 0.7]} />
				</mesh>
			)}
			<group position={[x1 - 0.08, y + 1.2, -0.35]}>
				<mesh material={M.painel}>
					<boxGeometry args={[0.03, 0.5, 0.2]} />
				</mesh>
				{e.alarme > 0 && (
					<mesh position={[-0.03, -0.15, 0]} scale={e.alarme} material={M.botao}>
						<cylinderGeometry args={[0.04, 0.04, 0.03, 10]} />
					</mesh>
				)}
			</group>
			{!e.fase0 && <Planta pos={[x1 - 0.3, y + 0.12, -0.25]} tomba={tomba} M={M} />}
			{/* 8 pessoas (dimensão da carga) */}
			{e.oitoPessoas > 0 &&
				Array.from({length: 8}).map((_, i) => (
					<Mascote3D key={i} p={pose('idle', T + i)} position={[x0 + 0.25 + (i % 4) * 0.4, y + 0.12, -0.85 + Math.floor(i / 4) * 0.45]} scale={0.75 * e.oitoPessoas} face={i % 3 === 0 ? 'susto' : 'feliz'} t={T + i} />
				))}
		</group>
	);
};

const Maquina: React.FC<{e: Estado; M: Mats; T: number}> = ({e, M}) => {
	const giro = -e.y / R_POLIA;
	const s = 1 + e.motorGrande * 1.4;
	M.tambor.emissive.set('#FFD21F');
	M.tambor.emissiveIntensity = e.realce.freio * 0.5;
	const ab = (1 - e.sapatas) * 0.12;
	return (
		<group>
			{/* polia de tração (eixo z) */}
			<group position={POLIA} rotation={[0, 0, giro]}>
				<mesh rotation={[Math.PI / 2, 0, 0]} material={M.aco} castShadow>
					<cylinderGeometry args={[R_POLIA, R_POLIA, 0.35, 16]} />
				</mesh>
				<mesh position={[0, 0, 0.18]} material={M.ferro}>
					<boxGeometry args={[R_POLIA * 1.6, 0.1, 0.02]} />
				</mesh>
			</group>
			{/* motor atrás da polia */}
			{e.motor > 0 && (
				<group position={[POLIA[0], POLIA[1], -2.0]} scale={[s * e.motor, s * e.motor, e.motor]}>
					<mesh material={M.motor} castShadow>
						<boxGeometry args={[1.0, 0.9, 0.8]} />
					</mesh>
				</group>
			)}
			{/* freio da máquina: tambor + 2 sapatas apertadas por molas */}
			{e.freio > 0 && (
				<group position={[POLIA[0], POLIA[1], -0.17]} scale={e.freio}>
					<group rotation={[0, 0, giro * 2]}>
						<mesh rotation={[Math.PI / 2, 0, 0]} material={M.tambor}>
							<cylinderGeometry args={[0.42, 0.42, 0.18, 14]} />
						</mesh>
						<mesh position={[0, 0, 0.12]} material={M.ferro}>
							<boxGeometry args={[0.7, 0.06, 0.02]} />
						</mesh>
					</group>
					{[-1, 1].map((sd) => (
						<group key={sd} position={[sd * (0.5 + ab), 0, 0]}>
							<mesh material={M.sapata}>
								<boxGeometry args={[0.12, 0.55, 0.26]} />
							</mesh>
						</group>
					))}
					{[-1, 1].map((sd) => (
						<group key={`m${sd}`} rotation={[0, 0, sd * Math.PI / 2]} position={[sd * (0.56 + ab), 0, 0]}>
							<Mola base={[0, 0, 0]} h={0.45 - ab * 1.5} r={0.1} voltas={5} mat={M.mola} />
						</group>
					))}
				</group>
			)}
		</group>
	);
};

const Limitador: React.FC<{e: Estado; M: Mats; T: number}> = ({e, M}) => {
	if (e.limitador <= 0) return null;
	const giro = e.limitadorTrava ? 0 : -e.y / 0.22;
	M.aco.emissive.set('#FFD21F');
	M.aco.emissiveIntensity = e.realce.limitador * 0.6;
	const yCab = e.y + 0.4;
	return (
		<group scale={[1, 1, 1]}>
			<group position={LIMIT} rotation={[0, 0, giro]} scale={e.limitador}>
				<mesh rotation={[Math.PI / 2, 0, 0]} material={M.aco}>
					<cylinderGeometry args={[0.3, 0.3, 0.08, 12]} />
				</mesh>
				<mesh position={[0, 0, 0.05]} material={M.ferro}>
					<boxGeometry args={[0.5, 0.05, 0.02]} />
				</mesh>
			</group>
			{e.limitadorTrava && (
				<mesh position={[LIMIT[0] + 0.32, LIMIT[1] + 0.2, LIMIT[2] + 0.06]} rotation={[0, 0, 0.6]} material={M.garra}>
					<boxGeometry args={[0.08, 0.3, 0.06]} />
				</mesh>
			)}
			{/* cabo fino: desce da roda até a alavanca da cabine e volta pela polia tensora no fundo */}
			<Barra a={[LIMIT[0] + 0.22, LIMIT[1], LIMIT[2]]} b={[-1.27, yCab + 0.2, -0.75]} r={0.012} mat={M.cabo} lados={4} />
			<Barra a={[-1.27, yCab - 0.2, -0.75]} b={[LIMIT[0] + 0.22, e.fundo + 0.35, LIMIT[2]]} r={0.012} mat={M.cabo} lados={4} />
			<Barra a={[LIMIT[0] - 0.22, LIMIT[1], LIMIT[2]]} b={[LIMIT[0] - 0.22, e.fundo + 0.35, LIMIT[2]]} r={0.012} mat={M.cabo} lados={4} />
			<mesh position={[LIMIT[0], e.fundo + 0.35, LIMIT[2]]} rotation={[Math.PI / 2, 0, 0]} material={M.ferro}>
				<cylinderGeometry args={[0.22, 0.22, 0.06, 10]} />
			</mesh>
		</group>
	);
};

/* ------------------------------------- cena ------------------------------------- */
export const Cena: React.FC<{e: Estado; mm: MascoteEst; T: number}> = ({e, mm, T}) => {
	const M = useMats();
	const t = e.t;
	const yTopCab = e.y + CAB.h + 0.25;
	const ySheave = POLIA[1];
	// cabos de tração (n lado a lado em z) + ruptura
	const cabos: React.ReactNode[] = [];
	if (e.cabine && e.cabo > 0) {
		const n = e.nCabos;
		for (let i = 0; i < n; i++) {
			const z = POLIA[2] + (i - (n - 1) / 2) * 0.07;
			if (e.caboRompe) {
				cabos.push(<Barra key={`a${i}`} a={[CAB.cx, ySheave, z]} b={[CAB.cx + 0.15, ySheave - 4, z]} r={0.025} mat={M.cabo} />);
				cabos.push(<Barra key={`b${i}`} a={[CAB.cx, yTopCab, z]} b={[CAB.cx - 0.2, yTopCab + 1.5, z]} r={0.025} mat={M.cabo} />);
			} else cabos.push(<Barra key={`c${i}`} a={[CAB.cx, yTopCab, z]} b={[CAB.cx, ySheave, z]} r={0.025} mat={M.cabo} />);
			if (e.contrapeso > 0) cabos.push(<Barra key={`p${i}`} a={[CP.cx, e.cpY + CP.h, z]} b={[CP.cx, ySheave, z]} r={0.025} mat={M.cabo} />);
		}
	}
	M.cabo.emissive.set('#FFD21F');
	M.cabo.emissiveIntensity = e.realce.cabos * 0.8;
	M.ferro.emissive.set('#FFD21F');
	M.ferro.emissiveIntensity = e.realce.contrapeso * 0.6;
	M.trilho.emissive.set('#FFD21F');
	M.trilho.emissiveIntensity = e.realce.guias * 0.8;
	M.mola.emissive.set('#FFD21F');
	M.mola.emissiveIntensity = e.realce.molas * 0.7;
	const sway = e.balanca * Math.sin(t * 5.5) * 0.28;
	const altG = e.fundo + (TOPO + 1.2 - e.fundo) * e.guias;
	return (
		<group>
			<Fundo buraco={[-14, 14, -14, 0]} />
			<Arvore position={[-8, 0, -6]} s={1.3} seed={1} />
			<Arvore position={[8.5, 0, -7]} s={1.4} seed={2} />
			<Arvore position={[-10, 0, -10]} s={1.1} seed={3} />
			<Terreno e={e} M={M} />
			<Predio e={e} M={M} />

			{/* gancho: caixa de madeira pendurada numa corda */}
			{e.fase0 && (
				<group>
					<Bloco min={[-1.6, TOPO + 0.9, -0.7]} max={[1.4, TOPO + 1.05, -0.4]} mat={M.madeira} />
					<group position={[CAB.cx, e.caixaY, -0.55]} rotation={[0, 0, e.caixaQuebrada ? 0.3 : 0]}>
						<Bloco min={[-0.6, 0, -0.45]} max={[0.6, 0.12, 0.45]} mat={M.madeira} />
						<Bloco min={[-0.6, 0, -0.45]} max={[-0.52, 0.8, 0.45]} mat={M.madeira} />
						<Bloco min={[0.52, 0, -0.45]} max={[0.6, 0.8, 0.45]} mat={M.madeira} />
						<Bloco min={[-0.6, 0, -0.45]} max={[0.6, 0.8, -0.37]} mat={M.madeira} />
						{!e.caixaQuebrada && <Planta pos={[0.32, 0.12, 0.1]} tomba={0} M={M} />}
					</group>
					{!e.cordaRompe ? (
						<Barra a={[CAB.cx, e.caixaY + 0.8, -0.55]} b={[CAB.cx, TOPO + 0.9, -0.55]} r={0.035 * (1 - e.cordaEstica * 0.6)} mat={M.corda} />
					) : (
						<Barra a={[CAB.cx, TOPO + 0.9, -0.55]} b={[CAB.cx + 0.2, TOPO - 1.6, -0.55]} r={0.03} mat={M.corda} />
					)}
					{e.cordaEstica > 0.2 &&
						!e.cordaRompe &&
						[-1, 0, 1].map((i) => (
							<Barra key={i} a={[CAB.cx, TOPO - 0.3, -0.55]} b={[CAB.cx + i * 0.12 * e.cordaEstica, TOPO - 0.9, -0.55 + i * 0.05]} r={0.012} mat={M.corda} lados={4} />
						))}
				</group>
			)}
			<Poeira at={[CAB.cx, 0, -0.5]} age={t - 6.6} s={1.8} M={M} />

			{/* guias (crescem do fundo até a cobertura) */}
			{e.guias > 0 && (
				<group>
					{TRILHOS.cab.map((x) => (
						<Bloco key={x} min={[x - 0.04, e.fundo, -0.56]} max={[x + 0.04, altG, -0.44]} mat={M.trilho} sombra={false} />
					))}
					{TRILHOS.cp.map((x) => (
						<Bloco key={x} min={[x - 0.03, e.fundo, -0.6]} max={[x + 0.03, altG, -0.5]} mat={M.trilho} sombra={false} />
					))}
				</group>
			)}

			{e.cabine && (
				<group position={[sway, 0, 0]} rotation={[0, 0, -sway * 0.08]}>
					<Cabine e={e} M={M} T={T} />
				</group>
			)}
			{e.contrapeso > 0 && (
				<group position={[-sway * 0.7, 0, 0]} scale={[1, e.contrapeso, 1]}>
					<Bloco min={[CP.x0, e.cpY, CP.z0]} max={[CP.x1, e.cpY + CP.h, CP.z1]} mat={M.ferro} />
				</group>
			)}
			{cabos}
			{e.cabine && <Maquina e={e} M={M} T={T} />}
			<Limitador e={e} M={M} T={T} />

			{/* amortecedores no fundo do poço */}
			{e.molas > 0 && (
				<group scale={[1, e.molas, 1]}>
					<Mola base={[CAB.cx, e.fundo, -0.5]} h={0.9 * (1 - e.compressao)} r={0.28} voltas={6} mat={M.mola} />
					<Mola base={[CP.cx, e.fundo, -0.55]} h={0.9} r={0.18} voltas={6} mat={M.mola} />
				</group>
			)}

			{/* faíscas das garras */}
			{e.faiscas > 0.05 &&
				TRILHOS.cab.map((rx) =>
					Array.from({length: 8}).map((_, i) => {
						const ph = (t * 3 + i / 8) % 1;
						return (
							<mesh key={`${rx}${i}`} position={[rx + (hash1(i) - 0.5) * 0.6 * ph, e.y - 0.18 + ph * 0.4, -0.3 + hash1(i + 5) * 0.3]} material={M.faisca} scale={e.faiscas}>
								<boxGeometry args={[0.04, 0.04, 0.04]} />
							</mesh>
						);
					}),
				)}
			<Poeira at={[CAB.cx, e.fundo, -0.5]} age={t - 105.74} s={1.4} M={M} />
			<Poeira at={[CAB.cx, 0, -0.5]} age={t - 53.3} s={1.4} M={M} />

			{mm.vis && <Mascote3D p={pose(mm.pose, T)} position={mm.pos} rotY={mm.rot} hat={mm.hat} face={mm.face} t={T} />}
		</group>
	);
};
