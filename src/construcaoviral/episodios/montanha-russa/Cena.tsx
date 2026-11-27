// "Você construiu uma montanha-russa" — cena 3D: parque low-poly, 3 trilhos (principal com subida/curva, loop,
// freio/estação), carrinho com rodas (cima/lado/baixo), garra antirretorno, lâmina do freio magnético e barra.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Mascote3D, pose} from '../../kit/Mascote3D';
import {Arvore, Fundo, Nuvem, flat} from '../../kit/Mundo';
import {Barra, Bloco} from '../../kit/Geom';
import {matrizEm, quadro, TrilhoMalha} from '../../kit/Trilho';
import {k} from '../../kit/tempo';
import {hash1} from '../../../style/random';
import {C, CarroEst, Estado, trilhoA, trilhoB, trilhoDe, U, uX, ZC} from './linha';

const corCache = new Map<string, THREE.Material>();
const corDe = (c: string) => {
	if (!corCache.has(c)) corCache.set(c, flat(c));
	return corCache.get(c)!;
};

const useMats = () =>
	useMemo(
		() => ({
			trilho: flat('#E8452E'),
			coluna: flat('#F2C230'),
			pilar: flat('#E9E4DA'),
			trilhoB: flat('#2F8FE8'),
			colunaB: flat('#F5F5F5'),
			trilhoC: flat('#7A4FD0'),
			carro: flat('#2F6FD8'),
			carro2: flat('#2DBE5A'),
			faixa: flat('#FFD21F'),
			banco: flat('#202429'),
			roda: flat('#2A2E33'),
			rodaNova: flat('#FFD21F'),
			metal: flat('#AEB6BF', {metalness: 0.1, roughness: 0.4}),
			corrente: flat('#3A3F47'),
			dente: flat('#C9CED6'),
			garra: flat('#E63B2E'),
			barra: flat('#FFD21F'),
			travaOk: flat('#2DBE5A'),
			ima1: flat('#E63B2E'),
			ima2: flat('#2F8FE8'),
			lamina: flat('#D9DEE4', {metalness: 0.1, roughness: 0.3}),
			livre: new THREE.MeshBasicMaterial({color: '#2DBE5A', transparent: true, opacity: 0.35, depthWrite: false}),
			ocupado: new THREE.MeshBasicMaterial({color: '#E63B2E', transparent: true, opacity: 0.35, depthWrite: false}),
			lago: new THREE.MeshStandardMaterial({color: '#3FB4EA', roughness: 0.2, transparent: true, opacity: 0.9}),
			espuma: flat('#FFFFFF'),
			estacao: flat('#F1E6D2'),
			telhado: flat('#E8452E'),
			plataforma: flat('#B9BCC2'),
			barraca: flat('#FFFFFF'),
			listra: flat('#FF7AB8'),
			poste: flat('#5B6168'),
			luzVerde: new THREE.MeshStandardMaterial({color: '#2DBE5A', emissive: '#2DBE5A', emissiveIntensity: 1}),
			luzVermelha: new THREE.MeshStandardMaterial({color: '#E63B2E', emissive: '#E63B2E', emissiveIntensity: 1}),
			flash: new THREE.MeshBasicMaterial({color: '#FFFFFF'}),
			camera: flat('#1F2328'),
			motor: flat('#2F6FD8'),
			fantasma: new THREE.MeshBasicMaterial({color: '#FFFFFF', transparent: true, opacity: 0.5, depthWrite: false}),
		}),
		[],
	);
type Mats = ReturnType<typeof useMats>;

/* --------------------------------------------- carrinho --------------------------------------------- */
const Carrinho: React.FC<{e: Estado; c: CarroEst; M: Mats; T: number; cor?: THREE.Material; mascote?: {pose: string; face: 'feliz' | 'neutro' | 'susto' | 'dor' | 'olho-vermelho'}; principal?: boolean}> = ({
	e,
	c,
	M,
	T,
	cor,
	mascote,
	principal = true,
}) => {
	if (!c.vis) return null;
	const tr = trilhoDe(e, c.trilho);
	const q = quadro(tr, c.u);
	const m = matrizEm(q, 0);
	if (c.voo) {
		const r = new THREE.Matrix4().makeRotationAxis(q.side, -c.voo.rot);
		const rot = new THREE.Matrix4().extractRotation(m).premultiply(r);
		rot.setPosition(c.voo.pos);
		m.copy(rot);
	}
	const baixo = principal ? e.rodasBaixo : 1;
	M.rodaNova.emissive.set('#FFD21F');
	M.rodaNova.emissiveIntensity = 0.3 + e.realce.rodas * 0.8;
	M.barra.emissive.set('#FFD21F');
	M.barra.emissiveIntensity = e.realce.barra * 0.8;
	const passo = (c.u * tr.len) / 0.4;
	const garraAng = e.clac ? 0.05 : 0.15 + Math.abs(Math.sin(passo * Math.PI)) * 0.45;
	const roda = (x: number, y: number, z: number, eixo: 'x' | 'y', r: number, mat: THREE.Material, key: string, s = 1) =>
		s > 0.01 ? (
			<mesh key={key} position={[x, y, z]} rotation={eixo === 'x' ? [0, 0, Math.PI / 2] : [0, 0, 0]} scale={s} material={mat}>
				<cylinderGeometry args={[r, r, 0.07, 10]} />
			</mesh>
		) : null;
	const p = mascote ?? {pose: 'sentado', face: 'feliz' as const};
	const lean = principal ? e.inclina * 0.55 : 0;
	const esm = principal ? e.esmaga : 0;
	const solta = principal ? e.solta : 0;
	return (
		<group matrixAutoUpdate={false} matrix={m}>
			{/* rodas: em cima, do lado e (novas) embaixo do trilho */}
			{[-0.95, 0.95].map((z) =>
				[-0.55, 0.55].map((x) => (
					<group key={`${x}${z}`}>
						<Bloco min={[x - 0.06, 0.05, z - 0.18]} max={[x + 0.06, 0.32, z + 0.18]} mat={M.metal} sombra={false} />
						{roda(x, 0.165, z, 'x', 0.09, M.roda, 'c')}
						{roda(x + Math.sign(x) * 0.145, 0, z, 'y', 0.07, M.roda, 'l')}
						{roda(x, -0.165, z, 'x', 0.09, M.rodaNova, 'b', baixo)}
					</group>
				)),
			)}
			{/* carroceria */}
			<Bloco min={[-0.68, 0.3, -1.35]} max={[0.68, 0.7, 1.35]} mat={cor ?? M.carro} />
			<Bloco min={[-0.7, 0.62, 1.05]} max={[0.7, 0.95, 1.45]} mat={M.faixa} />
			<Bloco min={[-0.62, 0.7, 0.05]} max={[0.62, 1.25, 0.2]} mat={M.banco} />
			<Bloco min={[-0.62, 0.7, -0.95]} max={[0.62, 1.25, -0.8]} mat={M.banco} />
			{/* garra antirretorno */}
			{principal && e.garra > 0 && (
				<group position={[0, 0.28, -0.9]} rotation={[-garraAng, 0, 0]} scale={e.garra}>
					<mesh position={[0, -0.2, 0.1]} material={M.garra}>
						<boxGeometry args={[0.12, 0.42, 0.08]} />
					</mesh>
				</group>
			)}
			{/* lâmina do freio magnético */}
			{e.lamina > 0 && <Bloco min={[-0.02, -0.55, -1.0]} max={[0.02, 0.3, 1.0]} mat={M.lamina} sombra={false} />}
			{/* mascote e barra de segurança */}
			<group position={[0, 0.72, 0.4]}>
				<group rotation={[0, 0, lean]} position={[0, solta * 0.45, 0]} scale={[1 + esm * 0.18, 1 - esm * 0.38, 1 + esm * 0.1]}>
					<Mascote3D p={pose(p.pose, T)} position={[0, 0, 0]} rotY={0} hat={false} face={esm > 0.5 ? 'dor' : p.face} t={T} />
				</group>
				{principal && e.barra > 0 && (
					<group position={[0, 0.95, -0.3]} rotation={[-1.4 * (1 - e.barra), 0, 0]}>
						<Barra a={[-0.3, 0, 0]} b={[-0.3, -0.35, 0.45]} r={0.04} mat={M.barra} />
						<Barra a={[0.3, 0, 0]} b={[0.3, -0.35, 0.45]} r={0.04} mat={M.barra} />
						<Barra a={[-0.3, -0.35, 0.45]} b={[0.3, -0.35, 0.45]} r={0.04} mat={M.barra} />
						{e.barraTrava && (
							<mesh position={[0.36, 0, 0]} material={M.travaOk}>
								<boxGeometry args={[0.1, 0.12, 0.12]} />
							</mesh>
						)}
					</group>
				)}
			</group>
		</group>
	);
};

/* ----------------------------------------------- cena ----------------------------------------------- */
export const Cena: React.FC<{e: Estado; T: number}> = ({e, T}) => {
	const M = useMats();
	const t = e.t;
	const A = trilhoA(e.bancoA);
	const B = trilhoB(e.formaB);
	M.trilho.emissive.set('#FFD21F');
	M.trilho.emissiveIntensity = e.realce.curva * 0.6;
	M.trilhoB.emissive.set('#FFD21F');
	M.trilhoB.emissiveIntensity = e.realce.loop * 0.6;
	M.corrente.emissive.set('#FFD21F');
	M.corrente.emissiveIntensity = e.realce.corrente * 0.9;
	M.dente.emissive.set('#FFD21F');
	M.dente.emissiveIntensity = e.realce.dentes * 0.9;
	for (const m of [M.ima1, M.ima2]) {
		m.emissive.set('#FFD21F');
		m.emissiveIntensity = e.realce.imas * 0.7;
	}
	const uTopoSub = U.topo - 0.01;

	// corrente: elos entre a base da subida e o topo; puxada junto com o carrinho
	const elos: React.ReactNode[] = [];
	if (e.corrente > 0) {
		const passo = 0.35 / A.len;
		const desloc = e.c.trilho === 'A' && !e.correnteRompe ? ((e.c.u * A.len) % 0.35) / A.len : 0;
		let i = 0;
		for (let u = U.baseSubida; u < uTopoSub; u += passo) {
			const uu = u + desloc;
			const q = quadro(A, uu);
			let pos = q.pos.clone().addScaledVector(q.up, -0.06);
			if (e.correnteRompe && e.c.trilho === 'A' && uu > e.c.u - 0.004) {
				const a = e.correnteIdade;
				pos = pos.add(new THREE.Vector3((hash1(i) - 0.5) * a * 3, -4.9 * a * a, (hash1(i + 9) - 0.5) * a * 3));
			}
			if (k(e.corrente, 0, 1) * (uTopoSub - U.baseSubida) + U.baseSubida >= uu)
				elos.push(
					<mesh key={i} position={pos} rotation={[0, 0, Math.atan2(q.t.y, q.t.x)]} material={M.corrente}>
						<boxGeometry args={[0.28, 0.06, 0.1]} />
					</mesh>,
				);
			i++;
		}
	}
	// escadinha de dentes (antirretorno)
	const dentes: React.ReactNode[] = [];
	if (e.dentes > 0) {
		const passo = 0.4 / A.len;
		let i = 0;
		for (let u = U.baseSubida; u < uTopoSub; u += passo) {
			const q = quadro(A, u);
			const pos = q.pos.clone().addScaledVector(q.up, 0.02).addScaledVector(q.side, 0.22);
			dentes.push(
				<mesh key={i++} position={pos} rotation={[0, 0, Math.atan2(q.t.y, q.t.x)]} scale={e.dentes} material={M.dente}>
					<coneGeometry args={[0.09, 0.2, 3]} />
				</mesh>,
			);
		}
	}
	// ímãs do freio magnético (trilho C, x 2..14)
	const imas: React.ReactNode[] = [];
	if (e.imas > 0)
		for (let x = 2; x <= 14; x += 1.0) {
			const q = quadro(C, uX(C, x));
			for (const s of [-1, 1]) {
				const pos = q.pos.clone().addScaledVector(q.up, -0.45).addScaledVector(q.side, s * 0.11);
				imas.push(
					<mesh key={`${x}${s}`} position={pos} scale={[1, e.imas, 1]} material={s < 0 ? M.ima1 : M.ima2}>
						<boxGeometry args={[0.6, 0.35, 0.12]} />
					</mesh>,
				);
			}
		}
	// trechos (blocos) coloridos ao longo do trilho C
	const ocup1 = e.c.trilho === 'C' && quadro(C, e.c.u).pos.x > -12;
	const ocup2 = !!e.c2 && e.c2.vis;
	const trecho = (x0: number, x1: number, ocupado: boolean) => (
		<mesh position={[(x0 + x1) / 2, 1.42, ZC]} scale={[1, 1, e.trechos]} material={ocupado ? M.ocupado : M.livre}>
			<boxGeometry args={[x1 - x0, 0.06, 1.6]} />
		</mesh>
	);
	// pouso no lago
	const splash = (() => {
		if (!e.c.voo || e.c.voo.pos.y > -0.5) return null;
		return true;
	})();
	return (
		<group>
			<Fundo nuvens={false} />
			<Nuvem position={[-20, 32, -70]} s={2.4} />
			<Nuvem position={[30, 38, -80]} s={3} />
			<Nuvem position={[60, 30, -40]} s={2.2} />
			{/* parque: árvores, barracas, lago */}
			{[
				[-26, -6],
				[-30, 8],
				[10, 10],
				[44, 12],
				[60, -14],
				[-12, -20],
				[22, -24],
				[40, -30],
				[-36, -28],
				[18, 30],
			].map(([x, z], i) => (
				<Arvore key={i} position={[x, 0, z]} s={1.3} seed={i + 2} />
			))}
			{[
				[-8, 8, '#FF7AB8'],
				[4, 9, '#2F8FE8'],
				[46, 6, '#FFD21F'],
			].map(([x, z, cor], i) => (
				<group key={i} position={[x as number, 0, z as number]}>
					<Bloco min={[-1.2, 0, -1.2]} max={[1.2, 1.8, 1.2]} mat={M.barraca} />
					<mesh position={[0, 2.5, 0]} material={corDe(cor as string)}>
						<coneGeometry args={[1.9, 1.4, 8]} />
					</mesh>
				</group>
			))}
			<mesh position={[54, 0.02, -3]} material={M.lago} receiveShadow>
				<cylinderGeometry args={[10, 10, 0.06, 20]} />
			</mesh>

			{/* trilhos */}
			<TrilhoMalha tr={A} chave={`A${e.bancoA.toFixed(2)}`} matTrilho={M.trilho} matColuna={M.coluna} matPilar={M.pilar} />
			<TrilhoMalha tr={B} chave={`B${e.formaB.toFixed(2)}`} matTrilho={M.trilhoB} matColuna={M.colunaB} matPilar={M.pilar} />
			<TrilhoMalha tr={C} chave="C" matTrilho={M.trilhoC} matColuna={M.coluna} matPilar={M.pilar} pilares={false} />
			{/* fantasma do loop redondo (comparação) */}
			{e.fantasma > 0 && (
				<mesh position={[7, 7.6, -34.8]} material={M.fantasma} scale={[1, 1, 1]}>
					<torusGeometry args={[6, 0.08 * e.fantasma + 0.01, 6, 40]} />
				</mesh>
			)}
			{/* motor da corrente na base da subida */}
			{e.corrente > 0 && <Bloco min={[-1.6, 0, -1.6]} max={[-0.4, 1.0, -0.8]} mat={M.motor} />}
			{elos}
			{dentes}
			{imas}
			{/* estação + trechos + sinal */}
			<group>
				<Bloco min={[-27, 0, ZC - 3]} max={[-15, 1.2, ZC - 1.0]} mat={M.plataforma} />
				<Bloco min={[-27, 0, ZC + 1.0]} max={[-15, 1.2, ZC + 3.4]} mat={M.plataforma} />
				{[-26.6, -15.4].map((x) =>
					[ZC - 2.6, ZC + 3.0].map((z) => <Bloco key={`${x}${z}`} min={[x - 0.15, 1.2, z - 0.15]} max={[x + 0.15, 4.6, z + 0.15]} mat={M.estacao} />),
				)}
				<Bloco min={[-27.4, 4.6, ZC - 3.2]} max={[-14.6, 5.0, ZC + 3.6]} mat={M.telhado} />
			</group>
			{e.trechos > 0 && (
				<>
					{trecho(-12, 30, ocup1)}
					{trecho(-28, -12, ocup2)}
					<group position={[-12, 0, ZC - 1.6]}>
						<Bloco min={[-0.08, 0, -0.08]} max={[0.08, 3.0, 0.08]} mat={M.poste} />
						<mesh position={[0, 3.2, 0]} material={e.sinal === 'verde' ? M.luzVerde : M.luzVermelha}>
							<sphereGeometry args={[0.25, 10, 8]} />
						</mesh>
					</group>
				</>
			)}
			{/* poste da câmera de foto na descida */}
			<group position={[30, 0, 3.5]}>
				<Bloco min={[-0.1, 0, -0.1]} max={[0.1, 24, 0.1]} mat={M.poste} />
				<Bloco min={[-0.3, 24, -0.25]} max={[0.3, 24.45, 0.25]} mat={M.camera} />
				{e.flash > 0 && (
					<mesh position={[0, 24.2, -0.35]} scale={0.3 + e.flash} material={M.flash}>
						<sphereGeometry args={[0.3, 10, 8]} />
					</mesh>
				)}
			</group>
			{/* fila de duas horas */}
			{e.fila &&
				Array.from({length: 9}).map((_, i) => (
					<Mascote3D key={i} p={pose('idle', T + i)} position={[-15.5 + i * 0.9, 1.2, ZC + 2.4]} rotY={-90} face={i % 3 === 0 ? 'neutro' : 'feliz'} t={T + i} />
				))}

			{/* carrinhos */}
			<Carrinho e={e} c={e.c} M={M} T={T} mascote={mascoteDo(t)} />
			{e.c2 && <Carrinho e={e} c={e.c2} M={M} T={T} cor={M.carro2} principal={false} mascote={{pose: e.grita ? 'sentado-bracos' : 'sentado', face: e.grita ? 'susto' : 'feliz'}} />}
			{e.grita && (
				<Carrinho e={e} c={{trilho: 'C', u: uX(C, -21), vis: true}} M={M} T={T} cor={M.carro2} principal={false} mascote={{pose: 'sentado-bracos', face: 'susto'}} />
			)}

			{/* respingo no lago */}
			{splash &&
				e.c.voo &&
				Array.from({length: 14}).map((_, i) => {
					const a = (i / 14) * Math.PI * 2;
					const age = Math.max(0, t - 6.55);
					const r = age * 5;
					return (
						<mesh key={i} position={[e.c.voo!.pos.x + Math.cos(a) * r, Math.max(0, 3 * age - 9 * age * age) + 0.2, e.c.voo!.pos.z + Math.sin(a) * r]} material={M.espuma}>
							<icosahedronGeometry args={[0.25, 0]} />
						</mesh>
					);
				})}
		</group>
	);
};

/** Pose/rosto do mascote principal por trecho. */
const mascoteDo = (t: number): {pose: string; face: 'feliz' | 'neutro' | 'susto' | 'dor' | 'olho-vermelho'} => {
	if (t < 2.3) return {pose: 'sentado', face: 'feliz'};
	if (t < 7.4) return {pose: t > 5.7 ? 'sentado-bracos' : 'sentado-susto', face: 'susto'};
	if (t < 14.5) return {pose: 'sentado-susto', face: 'susto'};
	if (t < 24.4) return {pose: 'sentado', face: 'feliz'};
	if (t < 28.6) return {pose: 'sentado-susto', face: 'susto'};
	if (t < 38) return {pose: 'sentado', face: 'feliz'};
	if (t < 49.2) return {pose: 'sentado', face: 'feliz'};
	if (t < 52.1) return {pose: 'sentado-susto', face: 'susto'};
	if (t < 58.9) return {pose: 'sentado', face: 'feliz'};
	if (t < 60.4) return {pose: 'sentado-susto', face: 'susto'};
	if (t < 69.4) return {pose: 'sentado', face: 'feliz'};
	if (t < 75.55) return {pose: 'sentado-susto', face: 'dor'};
	if (t < 89) return {pose: 'sentado-bracos', face: 'feliz'};
	if (t < 93.8) return {pose: 'sentado-susto', face: 'susto'};
	if (t < 98.5) return {pose: 'sentado', face: 'feliz'};
	if (t < 113.2) return {pose: 'sentado', face: 'feliz'};
	if (t < 138.3) return {pose: 'sentado', face: t > 117.2 && t < 119.1 ? 'susto' : 'feliz'};
	return {pose: 'sentado-bracos', face: 'feliz'};
};

