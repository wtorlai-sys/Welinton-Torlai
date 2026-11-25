// "Você construiu uma piscina" — cena 3D. O terreno e a piscina são feitos de caixas "cortáveis" em z=0:
// a metade da frente afunda quando `corte` sobe, revelando o corte transversal (solo, casca, camadas, água).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Mascote3D, pose} from '../../kit/Mascote3D';
import {Arvore, Casa, CORES, Fundo, Muro, flat} from '../../kit/Mundo';
import {k, V3} from '../../kit/tempo';
import {hash1, mulberry32} from '../../../style/random';
import {AZULEJO_ESP, BoiaEst, CAMADA_ESP, Estado, FUNDO_AGUA, MascoteEst, NIVEL, POOL} from './linha';

/* ------------------------------------------------------------------ */
/* Materiais                                                           */
/* ------------------------------------------------------------------ */
const tileTexture = () => {
	const c = document.createElement('canvas');
	c.width = c.height = 128;
	const g = c.getContext('2d')!;
	g.fillStyle = '#F4FAFF';
	g.fillRect(0, 0, 128, 128);
	for (let i = 0; i < 4; i++)
		for (let j = 0; j < 4; j++) {
			g.fillStyle = (i + j) % 2 ? '#7CCDF0' : '#68C1EC';
			g.fillRect(i * 32 + 2, j * 32 + 2, 28, 28);
		}
	const t = new THREE.CanvasTexture(c);
	t.wrapS = t.wrapT = THREE.RepeatWrapping;
	t.colorSpace = THREE.SRGBColorSpace;
	return t;
};

const useMats = () =>
	useMemo(() => {
		const tex = tileTexture();
		const tile = (rx: number, ry: number) => {
			const t = tex.clone();
			t.needsUpdate = true;
			t.repeat.set(rx, ry);
			return new THREE.MeshStandardMaterial({map: t, roughness: 0.35, metalness: 0});
		};
		return {
			grama: flat(CORES.grama),
			terra: flat(CORES.terra),
			terraUmida: flat('#8A5A3A'),
			firme: flat(CORES.terraFirme),
			concreto: flat('#B9BCC2', {transparent: true}),
			aco: flat('#8C5A3A', {roughness: 0.6, metalness: 0.2}),
			camada: flat('#5F86A6'),
			buraco: flat('#4E5560'),
			tileChao: tile(4 * 2.2, 8 * 2.2),
			tileLado: tile(8 * 2.2, 1.2 * 2.2),
			tileFundo: tile(4 * 2.2, 1.2 * 2.2),
			agua: new THREE.MeshStandardMaterial({color: '#39B4EA', transparent: true, opacity: 0.55, roughness: 0.15, side: THREE.DoubleSide, depthWrite: false}),
			aguaCorte: new THREE.MeshBasicMaterial({color: '#1E8FFF', transparent: true, opacity: 0.5, depthWrite: false}),
			lona: flat('#2C6FD1'),
			bordaEscura: flat('#3E4148'),
			bordaClara: flat('#EADFC8'),
			parede: flat(CORES.parede, {transparent: true}),
			telhado: flat(CORES.telhado),
			bomba: flat('#2F6FD8'),
			tanque: new THREE.MeshStandardMaterial({color: '#BFE6FF', transparent: true, opacity: 0.35, roughness: 0.2}),
			areia: flat('#E2C98E'),
			cano: flat('#E9E9E9'),
			ralo: flat('#3A3F47'),
			tampa: flat('#DCE2E8'),
			latao: flat('#C9A13B', {metalness: 0.4, roughness: 0.4}),
			escada: flat('#D7DDE3', {metalness: 0.6, roughness: 0.3}),
			luz: new THREE.MeshStandardMaterial({color: '#E9FBFF', emissive: '#8FE3FF', emissiveIntensity: 0}),
			folha: flat('#5BA93A'),
			sujeira: flat('#8B6A45'),
			pedra: flat('#8D8F94'),
			cabelo: flat('#3A2A22'),
			poeira: new THREE.MeshStandardMaterial({color: '#F4EBDD', transparent: true, opacity: 0.8, flatShading: true}),
			realce: new THREE.MeshBasicMaterial({color: '#FFD21F', transparent: true, opacity: 0.5, depthWrite: false}),
			skimmer: flat('#202429'),
			lama: flat('#7A5232'),
		};
	}, []);
type Mats = ReturnType<typeof useMats>;

/* ------------------------------------------------------------------ */
/* Caixa cortada em z ∈ [z0, z1]                                       */
/* ------------------------------------------------------------------ */
const Caixa: React.FC<{min: V3; max: V3; mat: THREE.Material; z0: number; z1: number; sombra?: boolean}> = ({min, max, mat, z0, z1, sombra = true}) => {
	const a = Math.max(min[2], z0);
	const b = Math.min(max[2], z1);
	const sx = max[0] - min[0];
	const sy = max[1] - min[1];
	if (b - a <= 1e-4 || sx <= 1e-4 || sy <= 1e-4) return null;
	return (
		<mesh position={[(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (a + b) / 2]} material={mat} castShadow={sombra} receiveShadow>
			<boxGeometry args={[sx, sy, b - a]} />
		</mesh>
	);
};

/** Bloco de chão: grama (0,08) + terra + terra firme. */
const Chao: React.FC<{x: [number, number]; z: [number, number]; yTop?: number; z0: number; z1: number; M: Mats; umido?: boolean}> = ({x, z, yTop = 0, z0, z1, M, umido}) => (
	<>
		{yTop >= 0 && <Caixa min={[x[0], -0.08, z[0]]} max={[x[1], 0, z[1]]} mat={M.grama} z0={z0} z1={z1} />}
		<Caixa min={[x[0], -2.2, z[0]]} max={[x[1], Math.min(yTop, -0.08), z[1]]} mat={umido ? M.terraUmida : M.terra} z0={z0} z1={z1} sombra={false} />
		<Caixa min={[x[0], -9, z[0]]} max={[x[1], Math.min(yTop, -2.2), z[1]]} mat={M.firme} z0={z0} z1={z1} sombra={false} />
	</>
);

/* ------------------------------------------------------------------ */
/* Metade (todo o conteúdo cortável)                                   */
/* ------------------------------------------------------------------ */
const Metade: React.FC<{e: Estado; z0: number; z1: number; M: Mats}> = ({e, z0, z1, M}) => {
	const {hx, hz, d, wall} = POOL;
	const C = (min: V3, max: V3, mat: THREE.Material, sombra = true) => <Caixa min={min} max={max} mat={mat} z0={z0} z1={z1} sombra={sombra} />;
	// terreno em volta do buraco e da casa de máquinas
	const terreno = (
		<>
			<Chao x={[-10, -hx]} z={[-14, 10]} z0={z0} z1={z1} M={M} />
			<Chao x={[hx, 3.6]} z={[-14, 10]} z0={z0} z1={z1} M={M} />
			<Chao x={[5.2, 10]} z={[-14, 10]} z0={z0} z1={z1} M={M} />
			<Chao x={[3.6, 5.2]} z={[-14, -0.8]} z0={z0} z1={z1} M={M} />
			<Chao x={[3.6, 5.2]} z={[0.8, 10]} z0={z0} z1={z1} M={M} />
			<Chao x={[3.6, 5.2]} z={[-0.8, 0.8]} yTop={e.casaMaquinas ? -0.8 : 0} z0={z0} z1={z1} M={M} />
			<Chao x={[-hx, hx]} z={[-14, -hz]} z0={z0} z1={z1} M={M} />
			<Chao x={[-hx, hx]} z={[hz, 10]} z0={z0} z1={z1} M={M} />
			{/* fundo do buraco + "tampão" de terra que a escavação remove */}
			<Chao x={[-hx, hx]} z={[-hz, hz]} yTop={-d} z0={z0} z1={z1} M={M} umido={e.infiltra > 0.3} />
			{e.cavado < 1 && (
				<>
					<Caixa min={[-hx, -d, -hz]} max={[hx, -d * e.cavado - (e.cavado > 0 ? 0 : 0.08), hz]} mat={M.terra} z0={z0} z1={z1} />
					{e.cavado <= 0 && <Caixa min={[-hx, -0.08, -hz]} max={[hx, 0, hz]} mat={M.grama} z0={z0} z1={z1} />}
				</>
			)}
		</>
	);
	// terra que desliza para dentro (lamaçal, porquê, lona)
	const des = Math.max(e.lama, e.desmorona);
	const cunhas = des > 0 && (
		<>
			{[-1, 1].map((s) => (
				<group key={s} position={[s * (hx + 0.4 - des * 1.0), -0.42 - des * 0.6, 0]} rotation={[0, 0, s * des * 0.7]}>
					<Caixa min={[-0.4, -0.5, -hz + 0.05]} max={[0.4, 0.42, hz - 0.05]} mat={e.lama > 0 ? M.lama : M.terra} z0={z0} z1={z1} />
					<Caixa min={[-0.4, 0.42, -hz + 0.05]} max={[0.4, 0.5, hz - 0.05]} mat={M.grama} z0={z0} z1={z1} />
				</group>
			))}
			<group position={[0, -0.42 - des * 0.6, -(hz + 0.4 - des * 1.0)]} rotation={[-des * 0.7, 0, 0]}>
				<Caixa min={[-hx + 0.05, -0.5, -0.4]} max={[hx - 0.05, 0.42, 0.4]} mat={e.lama > 0 ? M.lama : M.terra} z0={z0} z1={z1} />
				<Caixa min={[-hx + 0.05, 0.42, -0.4]} max={[hx - 0.05, 0.5, 0.4]} mat={M.grama} z0={z0} z1={z1} />
			</group>
		</>
	);
	const cede = e.cedeLona;
	const cunhaLona = cede > 0 && (
		<group position={[hx + 0.35 - cede * 0.3, -0.6 - cede * 0.2, 0]} rotation={[0, 0, cede * 0.25]}>
			<Caixa min={[-0.35, -0.6, -hz + 0.1]} max={[0.35, 0.6, hz - 0.1]} mat={M.terra} z0={z0} z1={z1} />
		</group>
	);
	// lona
	const lona = e.lona > 0 && (
		<group position={[0, (1 - e.lona) * 1.5, 0]}>
			{C([-hx + 0.03, -d, -hz + 0.03], [hx - 0.03, -d + 0.03, hz - 0.03], M.lona)}
			{C([-hx + 0.03, -d, -hz + 0.03], [-hx + 0.06, 0.02, hz - 0.03], M.lona)}
			{C([hx - 0.06 - cede * 0.28, -d, -hz + 0.03], [hx - 0.03 - cede * 0.28, 0.02, hz - 0.03], M.lona)}
			{C([-hx + 0.03, -d, -hz + 0.03], [hx - 0.03, 0.02, -hz + 0.06], M.lona)}
			{C([-hx + 0.03, -d, hz - 0.06], [hx - 0.03, 0.02, hz - 0.03], M.lona)}
		</group>
	);
	// água no buraco cru
	const nivelBruto = -d + e.aguaBruta * (d - 0.15);
	M.lama.color.set(e.lama > 0.1 ? '#6B4A2E' : '#7A5232');
	const aguaBruta = e.aguaBruta > 0.01 && C([-hx + 0.04 + des * 0.6, -d + 0.02, -hz + 0.04], [hx - 0.04 - des * 0.6 - cede * 0.3, nivelBruto, hz - 0.04], e.lama > 0.15 ? M.lama : M.agua, false);
	// volume de 45 toneladas
	const volume = e.volume > 0 && C([-hx + 0.02, -d + 0.02, -hz + 0.02], [hx - 0.02, -d + (d - 0.1) * e.volume, hz - 0.02], M.agua, false);

	// ---------------- piscina (casca + camadas + água + borda) -------------
	const pour = e.concreto;
	const topo = -d + wall + (d - wall) * pour; // topo das paredes enquanto o concreto sobe
	M.concreto.opacity = 1 - e.acoBrilha * 0.6;
	M.concreto.depthWrite = e.acoBrilha < 0.05;
	M.concreto.emissive.set('#FFD21F');
	M.concreto.emissiveIntensity = e.realce.concreto * 0.5;
	M.aco.emissive.set('#FFD21F');
	M.aco.emissiveIntensity = e.acoBrilha * 1.2;
	const casca = pour > 0 && (
		<>
			{C([-hx, -d, -hz], [hx, -d + wall, hz], M.concreto)}
			{C([-hx, -d + wall, -hz], [-hx + wall, topo, hz], M.concreto)}
			{C([hx - wall, -d + wall, -hz], [hx, topo, hz], M.concreto)}
			{C([-hx + wall, -d + wall, -hz], [hx - wall, topo, -hz + wall], M.concreto)}
			{C([-hx + wall, -d + wall, hz - wall], [hx - wall, topo, hz], M.concreto)}
		</>
	);
	// armadura (barras de aço) — some sob o concreto, reaparece no brilho
	const barras: React.ReactNode[] = [];
	if (e.aco > 0 && (pour < 1 || e.acoBrilha > 0)) {
		const b = 0.035;
		let n = 0;
		const add = (min: V3, max: V3) => {
			const show = (n++ * 0.013) % 1 < e.aco * 1.05;
			if (show) barras.push(<Caixa key={n} min={min} max={max} mat={M.aco} z0={z0} z1={z1} sombra={false} />);
		};
		for (let z = -3.7; z <= 3.71; z += 0.6) add([-hx + 0.1, -d + 0.08, z - b], [hx - 0.1, -d + 0.08 + b, z + b]);
		for (let x = -1.8; x <= 1.81; x += 0.4) add([x - b, -d + 0.1, -hz + 0.1], [x + b, -d + 0.1 + b, hz - 0.1]);
		for (const s of [-1, 1]) {
			for (let z = -3.7; z <= 3.71; z += 0.6) add([s * (hx - 0.1) - b, -d + 0.08, z - b], [s * (hx - 0.1) + b, -0.05, z + b]);
			for (const y of [-0.45, -0.95]) add([s * (hx - 0.1) - b, y - b, -hz + 0.1], [s * (hx - 0.1) + b, y + b, hz - 0.1]);
		}
		for (const s of [-1, 1]) for (let x = -1.8; x <= 1.81; x += 0.4) add([x - b, -d + 0.08, s * (hz - 0.1) - b], [x + b, -0.05, s * (hz - 0.1) + b]);
	}
	// impermeabilização (varre de baixo para cima) e azulejo
	const ih = hx - wall;
	const iz = hz - wall;
	const fundo = -d + wall;
	const CT = CAMADA_ESP;
	const cam = e.camada;
	const camTopo = fundo + (0 - fundo) * k(cam, 0.15, 1);
	M.camada.emissive.set('#FFD21F');
	M.camada.emissiveIntensity = e.realce.camada * 0.6;
	const camada = cam > 0 && (
		<group scale={[1 + e.estica * 0.025, 1, 1 + e.estica * 0.012]}>
			{C([-ih, fundo, -iz], [ih, fundo + CT * k(cam, 0, 0.15), iz], M.camada, false)}
			{C([-ih, fundo, -iz], [-ih + CT, camTopo, iz], M.camada, false)}
			{C([ih - CT, fundo, -iz], [ih, camTopo, iz], M.camada, false)}
			{C([-ih, fundo, -iz], [ih, camTopo, -iz + CT], M.camada, false)}
			{C([-ih, fundo, iz - CT], [ih, camTopo, iz], M.camada, false)}
		</group>
	);
	const rasgo = e.rasgo > 0 && C([0.25, -0.95, -iz + CT + 0.001], [0.95, -0.55, -iz + CT + 0.006], M.buraco, false);
	const a = e.azulejo;
	const TT = AZULEJO_ESP;
	const ti = ih - CT;
	const tz = iz - CT;
	const tf = fundo + CT;
	const tTopo = tf + (0 - tf) * k(a, 0.35, 1);
	const tChaoZ = -tz + 2 * tz * k(a, 0, 0.35);
	for (const m of [M.tileChao, M.tileLado, M.tileFundo]) {
		m.emissive.set('#FFD21F');
		m.emissiveIntensity = e.realce.azulejo * 0.35;
	}
	const azulejo = a > 0 && (
		<>
			{C([-ti, tf, -tz], [ti, tf + TT, tChaoZ], M.tileChao, false)}
			{a > 0.35 && (
				<>
					{C([-ti, tf, -tz], [-ti + TT, tTopo, tz], M.tileLado, false)}
					{C([ti - TT, tf, -tz], [ti, tTopo, tz], M.tileLado, false)}
					{C([-ti, tf, -tz], [ti, tTopo, -tz + TT], M.tileFundo, false)}
					{C([-ti, tf, tz - TT], [ti, tTopo, tz], M.tileFundo, false)}
				</>
			)}
		</>
	);
	// água da piscina
	const wi = ti - TT;
	const wz = tz - TT;
	const wf = tf + TT;
	const nivel = wf + (NIVEL - wf) * e.agua + e.aguaValvula * 0.35;
	M.agua.color.set(new THREE.Color('#39B4EA').lerp(new THREE.Color('#6E9F3A'), e.verde));
	const agua = e.estrutura && nivel > wf + 0.01 && C([-wi, wf, -wz], [wi, nivel, wz], M.agua, false);
	// borda (coping)
	const bordaMat = (i: number) => (e.bordaClara > (i + 1) / 5 ? M.bordaClara : M.bordaEscura);
	M.bordaClara.emissive.set('#FFD21F');
	M.bordaClara.emissiveIntensity = e.realce.borda * 0.35;
	const temBorda = e.bordaEscura || e.bordaClara > 0;
	const borda = temBorda && (
		<>
			{C([-hx - 0.3, 0, -hz - 0.3], [-ih, 0.08, hz + 0.3], bordaMat(0))}
			{C([ih, 0, -hz - 0.3], [hx + 0.3, 0.08, hz + 0.3], bordaMat(1))}
			{C([-ih, 0, -hz - 0.3], [ih, 0.08, -iz], bordaMat(2))}
			{C([-ih, 0, iz], [ih, 0.08, hz + 0.3], bordaMat(3))}
		</>
	);

	// ---------------- casa de máquinas (cortável também) -------------
	const px = [3.6, 5.2];
	const pz = [-0.8, 0.8];
	M.parede.opacity = 1 - e.filtroXray * 0.75;
	M.parede.depthWrite = e.filtroXray < 0.1;
	M.parede.emissive.set('#FFD21F');
	M.parede.emissiveIntensity = e.realce.casa * 0.5;
	const casa = e.casaMaquinas && (
		<>
			{C([px[0], -0.8, pz[0]], [px[1], -0.72, pz[1]], M.concreto)}
			{C([px[0], -0.72, pz[0]], [px[0] + 0.1, 0.55, pz[1]], M.parede)}
			{C([px[1] - 0.1, -0.72, pz[0]], [px[1], 0.55, pz[1]], M.parede)}
			{C([px[0] + 0.1, -0.72, pz[0]], [px[1] - 0.1, 0.55, pz[0] + 0.1], M.parede)}
			{C([px[0] + 0.1, -0.72, pz[1] - 0.1], [px[1] - 0.1, 0.55, pz[1]], M.parede)}
			{C([px[0] - 0.08, 0.55, pz[0] - 0.08], [px[1] + 0.08, 0.66, pz[1] + 0.08], M.telhado)}
		</>
	);

	const lift = e.sobe;
	return (
		<group>
			{terreno}
			{cunhas}
			{cunhaLona}
			{lona}
			{aguaBruta}
			{volume}
			{casa}
			<group position={[0, lift * 1.35, lift * 0.3]} rotation={[-lift * 0.14, 0, lift * 0.05]}>
				{casca}
				{barras}
				{camada}
				{rasgo}
				{azulejo}
				{agua}
				{borda}
			</group>
		</group>
	);
};

/* ------------------------------------------------------------------ */
/* Peças só da metade de trás (sempre visíveis no corte)               */
/* ------------------------------------------------------------------ */
const PlanoCorte: React.FC<{x: [number, number]; y: [number, number]; mat: THREE.Material; z?: number}> = ({x, y, mat, z = 0.015}) =>
	x[1] - x[0] > 0.001 && y[1] - y[0] > 0.001 ? (
		<mesh position={[(x[0] + x[1]) / 2, (y[0] + y[1]) / 2, z]} material={mat}>
			<planeGeometry args={[x[1] - x[0], y[1] - y[0]]} />
		</mesh>
	) : null;

const Boia: React.FC<{b: BoiaEst}> = ({b}) => {
	const m = useMemo(() => ({corpo: flat('#FFFFFF'), crina: flat('#FF7AB8'), chifre: flat('#FFD21F'), olho: flat('#1B1B1B')}), []);
	if (!b.vis) return null;
	const c = new THREE.Color('#FFFFFF').lerp(new THREE.Color('#7DA63A'), b.verde).lerp(new THREE.Color('#6B4A2E'), b.lama);
	m.corpo.color.copy(c);
	return (
		<group position={b.pos} rotation={[0, b.rot, 0]} scale={[1, 1 - b.murcha * 0.75, 1]}>
			<mesh rotation={[Math.PI / 2, 0, 0]} material={m.corpo}>
				<torusGeometry args={[0.38, 0.14, 6, 12]} />
			</mesh>
			<group position={[0, 0.1, -0.42]} scale={1 - b.murcha * 0.5}>
				<mesh position={[0, 0.2, 0]} rotation={[0.35, 0, 0]} material={m.corpo} castShadow>
					<cylinderGeometry args={[0.08, 0.11, 0.42, 6]} />
				</mesh>
				<mesh position={[0, 0.44, 0.07]} material={m.corpo} castShadow>
					<boxGeometry args={[0.18, 0.18, 0.28]} />
				</mesh>
				<mesh position={[0, 0.6, 0.06]} rotation={[0.3, 0, 0]} material={m.chifre}>
					<coneGeometry args={[0.04, 0.2, 5]} />
				</mesh>
				<mesh position={[0, 0.42, -0.07]} material={m.crina}>
					<boxGeometry args={[0.06, 0.26, 0.12]} />
				</mesh>
				{[-1, 1].map((s) => (
					<mesh key={s} position={[s * 0.092, 0.47, 0.13]} material={m.olho}>
						<boxGeometry args={[0.01, 0.04, 0.04]} />
					</mesh>
				))}
			</group>
		</group>
	);
};

const Poeira: React.FC<{at: V3; age: number; s?: number; M: Mats}> = ({at, age, s = 1, M}) => {
	if (age < 0 || age > 0.8) return null;
	const g = k(age, 0, 0.35);
	const o = 1 - k(age, 0.35, 0.8);
	M.poeira.opacity = 0.85 * o;
	return (
		<group position={at} scale={s}>
			{Array.from({length: 9}).map((_, i) => {
				const a = (i / 9) * Math.PI * 2;
				return (
					<mesh key={i} position={[Math.cos(a) * 0.6 * g, 0.3 + hash1(i) * 0.5 * g, Math.sin(a) * 0.6 * g]} scale={0.3 + g * 0.5} material={M.poeira}>
						<icosahedronGeometry args={[0.45, 0]} />
					</mesh>
				);
			})}
		</group>
	);
};

export const Cena: React.FC<{e: Estado; boia: BoiaEst; mascote: MascoteEst; T: number}> = ({e, boia, mascote: mm, T}) => {
	const M = useMats();
	const t = e.t;
	const corte = e.corte;
	const {hx, hz, d, wall} = POOL;
	const fundo = FUNDO_AGUA;
	const lift = e.sobe;
	const liftProps = {position: [0, lift * 1.35, lift * 0.3] as V3, rotation: [-lift * 0.14, 0, lift * 0.05] as V3};

	// realces de peças pequenas
	M.tanque.emissive.set('#FFD21F');
	M.tanque.emissiveIntensity = e.realce.filtro * 0.8;
	M.skimmer.emissive.set('#FFD21F');
	M.skimmer.emissiveIntensity = e.realce.skimmer * 0.8;
	M.ralo.emissive.set('#FFD21F');
	M.ralo.emissiveIntensity = e.realce.ralo * 0.8;
	M.latao.emissive.set('#FFD21F');
	M.latao.emissiveIntensity = e.realce.valvula * 0.8;
	M.luz.emissiveIntensity = e.luz * 1.2;

	// infiltração e água do chão (planos sobre a face cortada)
	const inf = e.infiltra * 1.6;
	const g = -3.6 + e.lencol * 3.2; // topo do lençol freático

	const rnd = mulberry32(5);
	const folhas = Array.from({length: 7}).map(() => [(rnd() - 0.5) * 3, (rnd() - 0.5) * 6.5, rnd() * 6] as [number, number, number]);

	return (
		<group>
			<Fundo buraco={[-10, 10, -14, 10]} />
			<Casa position={[0, 0, -10.5]} w={8} d={5} />
			<Casa position={[-13, 0, -6]} w={6} d={5} rotY={0.4} cor="#F6D7A7" />
			<Casa position={[14, 0, -9]} w={6} d={5} rotY={-0.3} cor="#CFE3F5" />
			<Muro z={-13.6} x0={-10} x1={10} />
			<Arvore position={[-6.5, 0, -6]} s={1.1} seed={1} />
			<Arvore position={[7.5, 0, -6.5]} s={1.2} seed={2} />
			<Arvore position={[-7.8, 0, 2.5]} s={1.0} seed={3} />
			<Arvore position={[8.2, 0, 5.5]} s={1.1} seed={4} />
			<Arvore position={[-5.5, 0, -11.5]} s={0.9} seed={5} />

			{/* metade de trás fica; metade da frente afunda no corte */}
			<Metade e={e} z0={-99} z1={0} M={M} />
			<group position={[0, -10 * k(corte, 0, 1), 0]}>{corte < 0.999 && <Metade e={e} z0={0} z1={99} M={M} />}</group>

			{/* planos da face cortada */}
			{corte > 0.5 && inf > 0.01 && (
				<>
					<PlanoCorte x={[-hx - inf, -hx]} y={[-d, -0.08]} mat={M.aguaCorte} />
					<PlanoCorte x={[hx, hx + inf]} y={[-d, -0.08]} mat={M.aguaCorte} />
					<PlanoCorte x={[-hx - inf, hx + inf]} y={[-d - inf, -d]} mat={M.aguaCorte} />
				</>
			)}
			{corte > 0.5 && e.lencol > 0.01 && (
				<>
					<PlanoCorte x={[-10, -hx]} y={[-9, g]} mat={M.aguaCorte} />
					<PlanoCorte x={[hx, 3.6]} y={[-9, g]} mat={M.aguaCorte} />
					<PlanoCorte x={[5.2, 10]} y={[-9, g]} mat={M.aguaCorte} />
					<PlanoCorte x={[-hx, hx]} y={[-9, Math.min(g, -d)]} mat={M.aguaCorte} />
				</>
			)}
			{/* infiltração pelos poros (gotas atravessando a parede esquerda) */}
			{e.poros > 0 &&
				Array.from({length: 18}).map((_, i) => {
					const ph = (t * 0.35 + i / 18) % 1;
					return (
						<mesh key={i} position={[-1.78 - ph * 0.6, -0.2 - hash1(i) * 1.0, 0.04]} material={M.aguaCorte} scale={e.poros}>
							<sphereGeometry args={[0.035, 6, 4]} />
						</mesh>
					);
				})}
			{e.poros > 0 && <PlanoCorte x={[-2.0 - e.poros * 0.6, -2.0]} y={[-1.3, -0.1]} mat={M.aguaCorte} z={0.012} />}

			{/* pedrinha furando a lona */}
			{e.pedra > 0 && (
				<mesh position={[hx + 0.1 - e.pedra * 0.25, -0.8, -0.5]} material={M.pedra}>
					<icosahedronGeometry args={[0.07, 0]} />
				</mesh>
			)}
			{e.fura > 0 &&
				Array.from({length: 8}).map((_, i) => {
					const ph = (t * 1.6 + i / 8) % 1;
					return (
						<mesh key={i} position={[hx - 0.25 + ph * 0.6, -0.8 - ph * ph * 0.5, -0.45]} material={M.aguaCorte}>
							<sphereGeometry args={[0.03, 6, 4]} />
						</mesh>
					);
				})}

			{/* canos do filtro (na face cortada) + fluxo */}
			{corte > 0.5 && e.casaMaquinas && (
				<>
					<mesh position={[(hx - 0.1 + 3.7) / 2, -0.45, 0.04]} material={M.cano}>
						<boxGeometry args={[3.7 - hx + 0.1, 0.07, 0.07]} />
					</mesh>
					<mesh position={[(hx - 0.1 + 3.7) / 2, -0.25, 0.04]} material={M.cano}>
						<boxGeometry args={[3.7 - hx + 0.1, 0.07, 0.07]} />
					</mesh>
				</>
			)}
			{e.casaMaquinas && (
				<group>
					<mesh position={[4.05, -0.55, -0.3]} rotation={[0, 0, Math.PI / 2]} material={M.bomba} castShadow>
						<cylinderGeometry args={[0.16, 0.16, 0.42, 8]} />
					</mesh>
					<mesh position={[4.75, -0.28, -0.3]} material={M.tanque}>
						<cylinderGeometry args={[0.3, 0.3, 0.9, 10]} />
					</mesh>
					<mesh position={[4.75, -0.5, -0.3]} material={M.areia}>
						<cylinderGeometry args={[0.27, 0.27, 0.4, 10]} />
					</mesh>
				</group>
			)}
			{e.fluxo &&
				Array.from({length: 12}).map((_, i) => {
					const ph = (t * 0.6 + i / 12) % 1;
					const ida = i % 2 === 0;
					const x = ida ? hx + ph * (3.7 - hx) : 3.7 - ph * (3.7 - hx);
					const suja = ida;
					return (
						<mesh key={i} position={[x, ida ? -0.45 : -0.25, 0.1]} material={suja ? M.sujeira : M.aguaCorte}>
							<sphereGeometry args={[0.035, 6, 4]} />
						</mesh>
					);
				})}

			{/* acessórios da piscina (sobem junto) */}
			<group {...liftProps}>
				{e.skimmer > 0 && (
					<>
						<mesh position={[1.0, -0.16, -hz + wall + CAMADA_ESP + AZULEJO_ESP + 0.012]} scale={[e.skimmer, e.skimmer, 1]} material={M.skimmer}>
							<boxGeometry args={[0.5, 0.26, 0.02]} />
						</mesh>
						<mesh position={[1.0, 0.085, -hz - 0.05]} scale={e.skimmer} material={M.tampa}>
							<boxGeometry args={[0.36, 0.02, 0.36]} />
						</mesh>
					</>
				)}
				{[
					[e.ralo1, -2.4],
					[e.ralo2, -1.3],
				].map(([s, z], i) =>
					s > 0 ? (
						<group key={i} position={[0, fundo, z]} scale={s}>
							<mesh position={[0, 0.02, 0]} material={M.ralo}>
								<cylinderGeometry args={[0.24, 0.26, 0.05, 12]} />
							</mesh>
							{e.tampas > 0 && (
								<mesh position={[0, 0.015, 0]} scale={[1, 0.35 * e.tampas, 1]} material={M.tampa}>
									<sphereGeometry args={[0.18, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
								</mesh>
							)}
						</group>
					) : null,
				)}
				{e.valvula > 0 && (
					<group position={[0.6, fundo, -0.5]} scale={e.valvula}>
						<mesh material={M.latao}>
							<cylinderGeometry args={[0.12, 0.12, 0.05, 10]} />
						</mesh>
						<mesh position={[0, 0.04 + e.valvulaAbre * 0.06, 0]} material={M.latao}>
							<cylinderGeometry args={[0.09, 0.09, 0.03, 10]} />
						</mesh>
						<mesh position={[0, -0.35, 0]} material={M.latao}>
							<cylinderGeometry args={[0.04, 0.04, 0.6, 6]} />
						</mesh>
					</group>
				)}
				{e.valvulaAbre > 0 &&
					e.aguaValvula < 1 &&
					Array.from({length: 8}).map((_, i) => {
						const ph = (t * 1.4 + i / 8) % 1;
						return (
							<mesh key={i} position={[0.6 + Math.sin(i * 2.3) * 0.08, fundo - 0.6 + ph * 1.0, -0.5]} material={M.aguaCorte}>
								<sphereGeometry args={[0.035, 6, 4]} />
							</mesh>
						);
					})}
				{e.escada > 0 && (
					<group position={[-1.1, 0, -hz + wall + 0.12]}>
						{[-0.22, 0.22].map((x) => (
							<group key={x}>
								<mesh position={[x, -0.25, 0]} material={M.escada}>
									<cylinderGeometry args={[0.025, 0.025, 1.0, 6]} />
								</mesh>
								<mesh position={[x, 0.3, -0.12]} rotation={[Math.PI / 2, 0, 0]} material={M.escada}>
									<cylinderGeometry args={[0.025, 0.025, 0.3, 6]} />
								</mesh>
							</group>
						))}
						{[-0.65, -0.35].map((y) => (
							<mesh key={y} position={[0, y, 0.02]} material={M.escada}>
								<boxGeometry args={[0.44, 0.03, 0.08]} />
							</mesh>
						))}
					</group>
				)}
				{t >= 151.38 && (
					<mesh position={[0.55, -0.7, -hz + wall + CAMADA_ESP + AZULEJO_ESP + 0.01]} rotation={[Math.PI / 2, 0, 0]} material={M.luz}>
						<cylinderGeometry args={[0.13, 0.13, 0.02, 12]} />
					</mesh>
				)}
				{e.luz > 0 && <pointLight position={[0.55, -0.6, -hz + 0.6]} color="#7FE0FF" intensity={e.luz * 2.2} distance={5} />}
				{/* mascote dentro da piscina sobe junto */}
				{mm.vis && mm.naPiscina && <Mascote3D p={pose(mm.pose, T)} position={mm.pos} rotY={mm.rot} hat={mm.hat} face={mm.face} prop={mm.prop} t={T} />}
			</group>

			{/* folhas boiando e sendo sugadas pelo skimmer */}
			{e.folhas > 0 &&
				folhas.map(([x, z, r], i) => {
					const alvo: V3 = [1.0, NIVEL, -3.65];
					const s = k(e.suga, i * 0.1, 0.3 + i * 0.1);
					const px = x + (alvo[0] - x) * s;
					const pz = z * 0.55 + (alvo[2] - z * 0.55) * s;
					return s < 0.98 ? (
						<mesh key={i} position={[px, NIVEL + 0.012, pz]} rotation={[0, r + t * 0.3, 0]} scale={e.folhas} material={M.folha}>
							<boxGeometry args={[0.16, 0.01, 0.09]} />
						</mesh>
					) : null;
				})}
			{e.sujeiraAfunda > 0 &&
				Array.from({length: 14}).map((_, i) => {
					const y0 = NIVEL - 0.05;
					const y = y0 + (fundo + 0.02 - y0) * k(e.sujeiraAfunda, hash1(i) * 0.3, 0.6 + hash1(i) * 0.4);
					return (
						<mesh key={i} position={[(hash1(i + 3) - 0.5) * 2.6, y, -0.5 - hash1(i + 7) * 3]} material={M.sujeira}>
							<icosahedronGeometry args={[0.035, 0]} />
						</mesh>
					);
				})}
			{e.cabelo >= 0 && (
				<group position={[0, fundo + 0.05, -1.3]}>
					{Array.from({length: 9}).map((_, i) => {
						const f = i / 8;
						const puxa = e.cabelo;
						return (
							<mesh key={i} position={[-0.7 + f * 0.7 * (0.5 + puxa * 0.5), 0.35 - f * 0.3 - puxa * f * 0.05, Math.sin(f * 6 + t * 3) * 0.06 * (1 - puxa)]} rotation={[0, 0, -0.5]} material={M.cabelo}>
								<boxGeometry args={[0.12, 0.045, 0.045]} />
							</mesh>
						);
					})}
				</group>
			)}

			<Boia b={boia} />

			{/* poeira das transformações */}
			<Poeira at={[0.5, -0.3, 0.5]} age={t - 11.6} s={1.8} M={M} />
			<Poeira at={[2.7, 0, -0.7]} age={T - 18.84} M={M} />
			<Poeira at={[0, -0.4, 0]} age={t - 29.9} s={1.6} M={M} />

			{mm.vis && !mm.naPiscina && <Mascote3D p={pose(mm.pose, T)} position={mm.pos} rotY={mm.rot} hat={mm.hat} face={mm.face} prop={mm.prop} t={T} />}
			{/* jato da mangueira */}
			{t > 1.9 && t < 2.5 && (
				<mesh position={[1.6, 0.2, 2.6]} rotation={[0, 0, 1.1]} material={M.aguaCorte}>
					<cylinderGeometry args={[0.04, 0.06, 1.6, 6]} />
				</mesh>
			)}
			{/* terra voando na escavação */}
			{t > 0.2 &&
				t < 1.9 &&
				Array.from({length: 8}).map((_, i) => {
					const ph = (t * 1.8 + i / 8) % 1;
					return (
						<mesh key={i} position={[1.0 + ph * 2.8, 0.1 + Math.sin(ph * Math.PI) * 0.9, 1.6 - ph * 2.6 + hash1(i) * 0.4]} material={M.terra}>
							<boxGeometry args={[0.1, 0.1, 0.1]} />
						</mesh>
					);
				})}
			{t > 0.2 && t < 11.6 && (
				<mesh position={[3.9, 0.15 * k(t, 0.2, 1.8) + 0.05, -1.2]} scale={[1, k(t, 0.2, 1.8) + 0.05, 1]} material={M.terra} castShadow>
					<coneGeometry args={[0.9, 0.7, 6]} />
				</mesh>
			)}
		</group>
	);
};
