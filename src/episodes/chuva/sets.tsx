// Cenários do episódio "A chuva da vovó": rua da cidade, quintal da festa, sala da vovó, maternidade.
// Chão e paredes sempre com textura (Customuse/Patina). Personagem adulto ≈ 2,4 de altura.
import React from 'react';
import * as THREE from 'three';
import {makeTileMaterial} from '../../style/materials';
import {memo, plain, texMat} from './assets';
import {Armchair, BlockTree, Bunting, ChurchTower, Frame, House, LampPost, Picket, StringLights, Window3D} from './props';

const sh = {castShadow: true, receiveShadow: true};
const box = (w: number, h: number, d: number) => memo(`sbx-${w}-${h}-${d}`, () => new THREE.BoxGeometry(w, h, d));

/* ------------------------------------------------------------------ */
/* Rua da cidade (rua ao longo de Z, praça/igreja ao fundo em -Z)      */
/* ------------------------------------------------------------------ */

const WALLS = ['tijolo', '#F2E6C8', '#CDE3E8', '#F4D0B0', 'tijolo', '#E8D8F0', '#F2E6C8'];
const DOORS = ['#2B5D4A', '#3A6FD8', '#8A3A4A', '#2BA59B', '#5A3A22', '#2B5D4A', '#7A4FD0'];

export const Town: React.FC<{dry?: number; lampsOn?: boolean; lit?: boolean}> = ({dry = 0, lampsOn = false, lit = false}) => (
	<group>
		{/* gramado em volta (amarelado quando seco), rua e praça de paralelepípedo */}
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -20]} receiveShadow material={texMat('grama', 40, 40, {rough: 1, tint: dry > 0.5 ? '#E8D890' : '#ffffff'})}>
			<planeGeometry args={[220, 220]} />
		</mesh>
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -18]} receiveShadow material={texMat('pedra', 9, 52, {rough: 0.9})}>
			<planeGeometry args={[17, 96]} />
		</mesh>
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -50]} receiveShadow material={texMat('pedra', 16, 9, {rough: 0.9})}>
			<planeGeometry args={[30, 16]} />
		</mesh>
		{/* calçadas */}
		{[-1, 1].map((s) => (
			<mesh key={s} {...sh} geometry={box(3.2, 0.22, 90)} position={[s * 6.6, 0.11, -18]} material={plain('#C9C2B4', 0.9)} />
		))}
		{[-1, 1].map((s) =>
			WALLS.map((w, i) => (
				<House
					key={`${s}${i}`}
					w={7.4}
					d={6}
					h={i % 3 === 1 ? 6.2 : 4.8}
					wall={w}
					door={DOORS[(i + (s > 0 ? 3 : 0)) % DOORS.length]}
					shutters={DOORS[(i + 2) % DOORS.length]}
					lit={lit}
					position={[s * 11.5, 0, 14 - i * 8.2]}
					rotation={[0, -s * Math.PI / 2, 0]}
				/>
			)),
		)}
		{[-1, 1].map((s) => [10, 2, -6, -14, -22, -30].map((z, i) => <LampPost key={`${s}${z}`} on={lampsOn} position={[s * 5.6, 0.22, z + (s > 0 ? 4 : 0)]} />))}
		{[-1, 1].map((s) => [6, -10, -26].map((z, i) => <BlockTree key={`${s}${z}`} seed={i * 7 + (s > 0 ? 3 : 0)} dry={dry} position={[s * 7.4, 0.22, z]} />))}
		<ChurchTower position={[0, 0, -48]} />
		{/* morros e casas distantes */}
		{[-30, -14, 12, 28].map((x, i) => (
			<House key={x} w={8} d={6} h={5} wall={WALLS[i + 1]} position={[x, 0, -62 - (i % 2) * 6]} />
		))}
		{[-60, -20, 25, 65].map((x, i) => (
			<mesh key={x} position={[x, -4, -120]} scale={[30 + i * 4, 18 + (i % 2) * 6, 20]} material={plain(dry > 0.5 ? '#A8A060' : '#6FA050', 1)}>
				<sphereGeometry args={[1, 12, 8]} />
			</mesh>
		))}
	</group>
);

/* ------------------------------------------------------------------ */
/* Quintal da vovó (festa)                                             */
/* ------------------------------------------------------------------ */

export const Yard: React.FC<{party?: boolean; lightsOn?: boolean; night?: boolean}> = ({party = true, lightsOn = true, night = false}) => (
	<group>
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow material={texMat('grama', 22, 22, {rough: 1})}>
			<planeGeometry args={[90, 90]} />
		</mesh>
		{/* rua em frente */}
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 14]} receiveShadow material={texMat('pedra', 30, 3, {rough: 0.9})}>
			<planeGeometry args={[90, 9]} />
		</mesh>
		{/* casa da vovó + varanda */}
		<House w={11} d={7} h={5} wall="#F2E6C8" door="#3A6FD8" shutters="#3A6FD8" lit={night} position={[0, 0, -10]} />
		<mesh {...sh} geometry={box(11, 0.4, 3.2)} position={[0, 0.2, -4.9]} material={texMat('madeira', 4, 1.2, {tint: '#D9A878'})} />
		{[-5.2, -1.8, 1.8, 5.2].map((x) => (
			<mesh key={x} {...sh} geometry={box(0.24, 3.4, 0.24)} position={[x, 2.1, -3.5]} material={plain('#F4F1E6', 0.6)} />
		))}
		<mesh {...sh} geometry={box(11.6, 0.22, 3.6)} position={[0, 3.85, -4.9]} rotation={[-0.12, 0, 0]} material={texMat('telha', 5, 2, {tint: '#E8D0C0'})} />
		{/* cerca branca */}
		<Picket len={30} position={[0, 0, 8.5]} />
		{/* árvores */}
		<BlockTree seed={4} position={[-10, 0, -2]} />
		<BlockTree seed={9} position={[10.5, 0, 1]} />
		<BlockTree seed={13} position={[-13, 0, 6]} />
		{/* vizinhos do outro lado da rua */}
		{[-14, -2, 10, 22].map((x, i) => (
			<House key={x} w={8} d={6} h={i % 2 ? 6.2 : 4.8} wall={WALLS[i + 2]} door={DOORS[i]} shutters={DOORS[i + 1]} lit={night} position={[x, 0, 24]} rotation={[0, Math.PI, 0]} />
		))}
		{party && (
			<>
				{[-6.5, 6.5].map((x) => (
					<mesh key={x} {...sh} geometry={box(0.16, 4.4, 0.16)} position={[x, 2.2, 6.8]} material={plain('#7A5A3A', 0.8)} />
				))}
				<StringLights from={[-5.2, 3.6, -3.5]} to={[6.5, 4.3, 6.8]} n={18} sag={0.7} on={lightsOn ? 1 : 0} />
				<StringLights from={[5.2, 3.6, -3.5]} to={[-6.5, 4.3, 6.8]} n={18} sag={0.7} on={lightsOn ? 1 : 0} />
				<Bunting from={[-6.5, 4.2, 6.8]} to={[6.5, 4.2, 6.8]} n={20} sag={0.6} />
			</>
		)}
	</group>
);

/* ------------------------------------------------------------------ */
/* Sala da vovó (janela no fundo, oficina à esquerda)                  */
/* ------------------------------------------------------------------ */

const W = 12;
const H = 4.6;
/** janela da parede do fundo: centro x, base y, largura, altura */
export const SALA_WIN = {x: 1.6, y: 1.3, w: 2.4, h: 2.2};

export const LivingRoom: React.FC<{lamp?: boolean}> = ({lamp = true}) => {
	const wall = texMat('papel', 4, 1.6, {rough: 0.9});
	const {x, y, w, h} = SALA_WIN;
	return (
		<group>
			<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={texMat('madeira', 4, 4, {tint: '#C89868', rough: 0.55})}>
				<planeGeometry args={[W, W]} />
			</mesh>
			<mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, 0]} material={plain('#F2EDE2', 1)}>
				<planeGeometry args={[W, W]} />
			</mesh>
			{/* parede do fundo com vão da janela */}
			<group position={[0, 0, -W / 2]}>
				<mesh {...sh} geometry={box(x - w / 2 + W / 2, H, 0.3)} position={[(-W / 2 + x - w / 2) / 2, H / 2, 0]} material={wall} />
				<mesh {...sh} geometry={box(W / 2 - x - w / 2, H, 0.3)} position={[(x + w / 2 + W / 2) / 2, H / 2, 0]} material={wall} />
				<mesh {...sh} geometry={box(w, y, 0.3)} position={[x, y / 2, 0]} material={wall} />
				<mesh {...sh} geometry={box(w, H - y - h, 0.3)} position={[x, (H + y + h) / 2, 0]} material={wall} />
				{/* face externa (pintura creme) */}
				{(() => {
					const ext = plain('#F2E6C8', 0.9);
					return (
						<group position={[0, 0, -0.17]}>
							<mesh geometry={box(x - w / 2 + W / 2, H, 0.02)} position={[(-W / 2 + x - w / 2) / 2, H / 2, 0]} material={ext} />
							<mesh geometry={box(W / 2 - x - w / 2, H, 0.02)} position={[(x + w / 2 + W / 2) / 2, H / 2, 0]} material={ext} />
							<mesh geometry={box(w, y, 0.02)} position={[x, y / 2, 0]} material={ext} />
							<mesh geometry={box(w, H - y - h, 0.02)} position={[x, (H + y + h) / 2, 0]} material={ext} />
						</group>
					);
				})()}
				{/* caixilho */}
				{[-1, 1].map((s) => <mesh key={s} {...sh} geometry={box(0.12, h, 0.36)} position={[x + (s * w) / 2, y + h / 2, 0]} material={plain('#F4F1E6', 0.6)} />)}
				<mesh {...sh} geometry={box(w, 0.1, 0.36)} position={[x, y + h / 2, 0]} material={plain('#F4F1E6', 0.6)} />
				<mesh {...sh} geometry={box(0.08, h, 0.36)} position={[x, y + h / 2, 0]} material={plain('#F4F1E6', 0.6)} />
				<mesh {...sh} geometry={box(w + 0.3, 0.12, 0.5)} position={[x, y, 0.12]} material={plain('#F4F1E6', 0.6)} />
				{/* rodapé */}
				<mesh geometry={box(W, 0.18, 0.34)} position={[0, 0.09, 0.02]} material={plain('#8A6440', 0.6)} />
			</group>
			{/* parede da frente */}
			<mesh {...sh} geometry={box(W, H, 0.3)} position={[0, H / 2, W / 2]} material={wall} />
			{/* paredes laterais */}
			{[-1, 1].map((s) => (
				<mesh key={s} {...sh} geometry={box(0.3, H, W)} position={[(s * W) / 2, H / 2, 0]} material={wall} />
			))}
			{/* lá fora: quintal e casas */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -20]} material={texMat('grama', 8, 8)}>
				<planeGeometry args={[40, 28]} />
			</mesh>
			<Picket len={20} position={[0, 0, -12]} />
			<BlockTree seed={21} position={[5, 0, -16]} />
			<House w={8} d={6} h={5} wall="#CDE3E8" position={[-2, 0, -24]} />
			{/* poltrona do vovô, mesinha com foto */}
			<Armchair position={[-1.8, 0, -3.6]} rotation={[0, 0.5, 0]} />
			<group position={[-3.4, 0, -4.6]}>
				<mesh {...sh} geometry={box(0.9, 1.1, 0.9)} position={[0, 0.55, 0]} material={texMat('madeira', 0.5, 0.5, {tint: '#9A6A44'})} />
				<Frame
					k="foto-casal"
					w={0.5}
					h={0.62}
					position={[0, 1.45, 0]}
					rotation={[-0.15, 0.4, 0]}
					draw={(c) => {
						c.fillStyle = '#D9C49A';
						c.fillRect(0, 0, 256, 318);
						c.fillStyle = '#B48A5A';
						c.fillRect(40, 120, 70, 200);
						c.fillRect(146, 110, 70, 210);
						c.fillStyle = '#F1CFAE';
						c.fillRect(50, 60, 50, 50);
						c.fillRect(156, 50, 50, 50);
					}}
				/>
			</group>
			{/* bancada da oficina (parede esquerda) */}
			<group position={[-W / 2 + 1.0, 0, 1.5]}>
				<mesh {...sh} geometry={box(1.6, 0.12, 3.4)} position={[0, 1.3, 0]} material={texMat('madeira', 1, 2, {tint: '#B07848'})} />
				{[-1, 1].map((sz) => <mesh key={sz} {...sh} geometry={box(1.4, 1.3, 0.1)} position={[0, 0.65, sz * 1.6]} material={texMat('madeira', 1, 1, {tint: '#8A5A34'})} />)}
				{/* luminária */}
				<mesh {...sh} position={[0.3, 2.1, -1.0]} rotation={[0, 0, -0.6]} material={plain('#3A6FD8', 0.4)}>
					<coneGeometry args={[0.28, 0.4, 14, 1, true]} />
				</mesh>
				<mesh {...sh} geometry={box(0.06, 0.9, 0.06)} position={[-0.05, 1.75, -1.0]} material={plain('#333', 0.4)} />
				{lamp && <pointLight color="#FFC27A" intensity={14} distance={6} position={[0.45, 1.95, -1.0]} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.002} />}
			</group>
			{/* quadro na parede direita */}
			<Window3D w={1.2} h={0.9} lit={false} position={[W / 2 - 0.16, 2.6, 1.0]} rotation={[0, -Math.PI / 2, 0]} />
		</group>
	);
};

/* ------------------------------------------------------------------ */
/* Maternidade                                                         */
/* ------------------------------------------------------------------ */

export const Maternity: React.FC = () => {
	const tile = makeTileMaterial('#E6F1F0', '#B7C9C6', 0.3);
	return (
		<group>
			<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={makeTileMaterial('#DCE4E6', '#AAB6B8', 0.6)}>
				<planeGeometry args={[14, 14]} />
			</mesh>
			<mesh {...sh} geometry={box(14, 4.6, 0.3)} position={[0, 2.3, -4]} material={tile} />
			{[-1, 1].map((s) => <mesh key={s} {...sh} geometry={box(0.3, 4.6, 14)} position={[s * 6, 2.3, 0]} material={tile} />)}
			<Window3D w={2} h={1.6} position={[3, 2.6, -3.84]} />
			{/* cama */}
			<group position={[-2.6, 0, -2.2]}>
				<mesh {...sh} geometry={box(2.0, 0.7, 3.4)} position={[0, 0.7, 0]} material={plain('#F4F4F4', 0.8)} />
				<mesh {...sh} geometry={box(2.1, 1.2, 0.12)} position={[0, 1.0, -1.7]} material={plain('#9FB7BF', 0.4, 0.4)} />
				<mesh {...sh} geometry={box(1.4, 0.24, 0.6)} position={[0, 1.18, -1.2]} material={plain('#FFFFFF', 0.9)} />
				<mesh {...sh} geometry={box(2.04, 0.12, 2.2)} position={[0, 1.08, 0.5]} material={plain('#BFE3F2', 0.9)} />
			</group>
			{/* lâmpada de teto */}
			<mesh position={[0, 4.5, 0]} material={plain('#FFFFFF', 0.3)}>
				<boxGeometry args={[2, 0.1, 0.6]} />
			</mesh>
		</group>
	);
};
