// STYLE_GUIDE §3 (color grade) e §4 (luz).
// Presets "dia" e "entardecer/noite" — sol, céu, fill, fog, environment, bloom e grade.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Environment} from '@react-three/drei';
import {useFrame, useThree} from '@react-three/fiber';
import {BlendFunction, Effect, EffectComposer, EffectPass, RenderPass, SelectiveBloomEffect, VignetteEffect} from 'postprocessing';
import {mulberry32} from '../style/random';
import {PALETTE, REF} from '../style/constants';

export type LightingPreset = 'dia' | 'entardecer' | 'noite';

type PresetDef = {
	skyTop: string;
	skyHorizon: string;
	ground: string;
	sunColor: string;
	sunIntensity: number;
	/** graus acima do horizonte — baixo = sombras longas */
	sunElevation: number;
	/** graus em torno de Y (0 = sol vindo de +Z / atrás da câmera padrão) */
	sunAzimuth: number;
	hemiSky: string;
	hemiGround: string;
	hemiIntensity: number;
	envIntensity: number;
	fog: [number, number];
	exposure: number;
	bloom: boolean;
	grade: GradeParams;
};

type GradeParams = {contrast: number; saturation: number; shadowTint: [number, number, number]; highlightTint: [number, number, number]};

// Valores de referência (STYLE_GUIDE §10). "entardecer" = noite/entardecer: sol a 10%, ambiente azulado.
export const LIGHTING: Record<LightingPreset, PresetDef> = {
	dia: {
		skyTop: PALETTE.skyTop,
		skyHorizon: PALETTE.skyHorizon,
		ground: '#9DBF7A',
		sunColor: REF.light.sunColor,
		sunIntensity: REF.light.sunIntensity,
		sunElevation: REF.light.sunElevation,
		sunAzimuth: REF.light.sunAzimuth,
		hemiSky: REF.light.hemiSky,
		hemiGround: REF.light.hemiGround,
		hemiIntensity: REF.light.hemiIntensity,
		envIntensity: 0.5,
		fog: [REF.light.fogNear, REF.light.fogFar],
		exposure: 1.0,
		bloom: false,
		grade: {contrast: 1.1, saturation: 1.1, shadowTint: [-0.012, 0.0, 0.022], highlightTint: [0.02, 0.008, -0.012]},
	},
	entardecer: {
		skyTop: '#1E2740',
		skyHorizon: PALETTE.nightBg,
		ground: '#20283A',
		sunColor: '#FFB27A',
		sunIntensity: REF.light.sunIntensity * REF.light.night.sunFactor,
		sunElevation: 10,
		sunAzimuth: REF.light.sunAzimuth,
		hemiSky: '#5A6FA0',
		hemiGround: '#2A3340',
		hemiIntensity: REF.light.hemiIntensity,
		envIntensity: 0.35,
		fog: [REF.light.fogNear, REF.light.fogFar],
		exposure: 1.0,
		bloom: true,
		grade: {contrast: 1.12, saturation: 0.95, shadowTint: [-0.01, 0.0, 0.03], highlightTint: [0.025, 0.01, -0.01]},
	},
	/** Noite: "sol" vira luar azulado a 10%, fundo #2B3550; luz quente vem dos emissivos (<Glow>). */
	noite: {
		skyTop: '#121829',
		skyHorizon: PALETTE.nightBg,
		ground: '#1A2030',
		sunColor: '#A9BEFF',
		sunIntensity: REF.light.sunIntensity * REF.light.night.sunFactor,
		sunElevation: 30,
		sunAzimuth: REF.light.sunAzimuth,
		hemiSky: '#4A5C8A',
		hemiGround: '#22262F',
		hemiIntensity: 0.35,
		envIntensity: 0.25,
		fog: [REF.light.fogNear, REF.light.fogFar],
		exposure: 1.0,
		bloom: true,
		grade: {contrast: 1.12, saturation: 0.95, shadowTint: [-0.012, 0.0, 0.035], highlightTint: [0.03, 0.012, -0.012]},
	},
};

/* ------------------------------------------------------------------ */
/* Céu gradiente (fundo + fonte do environment) — cor do horizonte = fog */
/* ------------------------------------------------------------------ */

const skyVert = /* glsl */ `
varying vec3 vDir;
void main(){ vDir = normalize((modelMatrix * vec4(position,1.0)).xyz - cameraPosition); gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position,1.0); gl_Position.z = gl_Position.w; }
`;
const skyFrag = /* glsl */ `
uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uGround; uniform vec3 uSunDir; uniform vec3 uSunColor;
varying vec3 vDir;
void main(){
	vec3 d = normalize(vDir);
	float h = d.y;
	vec3 col = mix(uHorizon, uTop, pow(smoothstep(0.0, 0.55, h), 0.7));
	col = mix(col, uGround, smoothstep(0.0, -0.08, h));
	float s = max(dot(d, normalize(uSunDir)), 0.0);
	col += uSunColor * (pow(s, 600.0) * 4.0 + pow(s, 12.0) * 0.25);
	gl_FragColor = vec4(col, 1.0);
}
`;

export const GradientSky: React.FC<{preset: PresetDef; sunDir: THREE.Vector3; radius?: number}> = ({preset, sunDir, radius = 900}) => {
	const mat = useMemo(
		() =>
			new THREE.ShaderMaterial({
				vertexShader: skyVert,
				fragmentShader: skyFrag,
				side: THREE.BackSide,
				depthWrite: false,
				fog: false,
				uniforms: {
					uTop: {value: new THREE.Color(preset.skyTop)},
					uHorizon: {value: new THREE.Color(preset.skyHorizon)},
					uGround: {value: new THREE.Color(preset.ground)},
					uSunDir: {value: sunDir.clone()},
					uSunColor: {value: new THREE.Color(preset.sunColor)},
				},
			}),
		[preset, sunDir],
	);
	return (
		<mesh material={mat} renderOrder={-1} frustumCulled={false}>
			<sphereGeometry args={[radius, 32, 16]} />
		</mesh>
	);
};

/* ------------------------------------------------------------------ */
/* Color grade: contraste +, saturação, sombras azuis, luzes quentes   */
/* ------------------------------------------------------------------ */

const gradeFrag = /* glsl */ `
uniform float contrast; uniform float saturation; uniform vec3 shadowTint; uniform vec3 highlightTint;
// Tone mapping: só o "ombro" do Khronos PBR Neutral (comprime acima de 0.8).
// O Neutral completo subtrai 0.04 de todas as cores escuras (toe) e esmaga o asfalto #4A4F5A.
vec3 shoulder(vec3 x){
	const float start = 0.8;
	const float d = 1.0 - start;
	float peak = max(x.r, max(x.g, x.b));
	if (peak < start) return x;
	float newPeak = 1.0 - d * d / (peak + d - start);
	return x * (newPeak / peak);
}
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
	vec3 c = pow(shoulder(max(inputColor.rgb, 0.0)), vec3(1.0/2.2));
	float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
	c = mix(vec3(l), c, saturation);
	c = (c - 0.5) * contrast + 0.5;
	float w = smoothstep(0.05, 0.95, l);
	c += shadowTint * (1.0 - w) + highlightTint * w;
	outputColor = vec4(pow(clamp(c, 0.0, 1.0), vec3(2.2)), inputColor.a);
}
`;

class GradeEffect extends Effect {
	constructor(p: GradeParams) {
		super('GradeEffect', gradeFrag, {
			blendFunction: BlendFunction.NORMAL,
			uniforms: new Map<string, THREE.Uniform>([
				['contrast', new THREE.Uniform(p.contrast)],
				['saturation', new THREE.Uniform(p.saturation)],
				['shadowTint', new THREE.Uniform(new THREE.Vector3(...p.shadowTint))],
				['highlightTint', new THREE.Uniform(new THREE.Vector3(...p.highlightTint))],
			]),
		});
	}
}

/**
 * Pós-processamento SÍNCRONO (postprocessing puro).
 * O <EffectComposer> do @react-three/postprocessing monta o composer num useEffect + setState;
 * com frameloop="never" do Remotion o frame é desenhado antes dele existir (canvas vazio).
 * Aqui o composer nasce no useMemo e renderiza no useFrame (prioridade 1) do mesmo advance().
 */
/** Camada usada pelo bloom seletivo. */
export const BLOOM_LAYER = 11;
const glowObjects = new Set<THREE.Object3D>();

/** Marca os filhos como emissivos para o bloom (STYLE_GUIDE §4). Nada fora de <Glow> brilha. */
export const Glow: React.FC<{children: React.ReactNode}> = ({children}) => {
	const ref = React.useRef<THREE.Group>(null);
	React.useLayoutEffect(() => {
		const list: THREE.Object3D[] = [];
		ref.current?.traverse((o) => {
			if ((o as THREE.Mesh).isMesh || (o as THREE.Points).isPoints) {
				glowObjects.add(o);
				list.push(o);
			}
		});
		return () => list.forEach((o) => glowObjects.delete(o));
	});
	return <group ref={ref}>{children}</group>;
};

export const PostFX: React.FC<{bloom: boolean; grade: GradeParams; multisampling?: number; vignette?: number}> = ({bloom, grade, multisampling = 4, vignette = 0.45}) => {
	const gl = useThree((s) => s.gl);
	const scene = useThree((s) => s.scene);
	const camera = useThree((s) => s.camera);
	const size = useThree((s) => s.size);
	const {composer, bloomFx} = useMemo(() => {
		const c = new EffectComposer(gl, {multisampling, frameBufferType: THREE.HalfFloatType});
		c.addPass(new RenderPass(scene, camera));
		const effects: Effect[] = [];
		// Bloom SELETIVO: só objetos dentro de <Glow> (lâmpadas, faíscas, faróis).
		// Cabeça branca, placas e legendas nunca entram — por isso o threshold 0.8 é seguro.
		let bloomFx: SelectiveBloomEffect | null = null;
		if (bloom) {
			bloomFx = new SelectiveBloomEffect(scene, camera, {
				mipmapBlur: true,
				luminanceThreshold: REF.light.night.bloomThreshold,
				luminanceSmoothing: 0.15,
				intensity: REF.light.night.bloomIntensity,
				radius: 0.7,
			});
			bloomFx.selection.layer = BLOOM_LAYER;
			effects.push(bloomFx);
		}
		effects.push(new GradeEffect(grade));
		// vinheta: escurece as bordas e puxa o olho para o centro (referências)
		effects.push(new VignetteEffect({offset: 0.32, darkness: vignette}));
		c.addPass(new EffectPass(camera, ...effects));
		return {composer: c, bloomFx};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [gl, scene, bloom, grade, multisampling, vignette]);
	useMemo(() => composer.setSize(size.width, size.height), [composer, size.width, size.height]);
	React.useEffect(() => () => composer.dispose(), [composer]);
	useFrame((state) => {
		composer.setMainCamera(state.camera);
		if (bloomFx) bloomFx.selection.set(glowObjects);
		composer.render();
	}, 1);
	return null;
};

/* ------------------------------------------------------------------ */
/* Lighting                                                            */
/* ------------------------------------------------------------------ */

export type LightingProps = {
	preset?: LightingPreset;
	/** centro da área com sombra nítida (normalmente o personagem) */
	focus?: [number, number, number];
	/** meia-largura do frustum de sombra (m). Menor = sombra mais nítida. */
	shadowExtent?: number;
	sunAzimuth?: number;
	sunElevation?: number;
	/** desliga o pós (útil no Studio para preview rápido) */
	post?: boolean;
	/** força bloom on/off (default: o do preset) */
	bloom?: boolean;
	/** 2048–4096 (REF) */
	shadowMapSize?: number;
	/**
	 * Cena de interior: o "chão" do hemisfério vira o rebatimento quente do piso (em vez do verde
	 * da grama, que tingia teto/paredes) e o fill sobe — dentro de casa só a janela recebe sol.
	 */
	interior?: boolean;
	/** força da vinheta (0 = sem). Padrão 0.45 de dia, 0.65 à noite. */
	vignette?: number;
};

export const sunDirection = (azimuthDeg: number, elevationDeg: number) => {
	const az = THREE.MathUtils.degToRad(azimuthDeg);
	const el = THREE.MathUtils.degToRad(elevationDeg);
	return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).normalize();
};

export const Lighting: React.FC<LightingProps> = ({preset = 'dia', focus = [0, 0, 0], shadowExtent = 18, sunAzimuth, sunElevation, post = true, bloom, shadowMapSize = REF.light.shadowMapSize, interior = false, vignette}) => {
	const base = LIGHTING[preset];
	const p: PresetDef = interior
		? {...base, hemiGround: preset === 'dia' ? '#C8B49A' : '#3A3026', hemiSky: preset === 'dia' ? '#E4ECF5' : base.hemiSky, hemiIntensity: base.hemiIntensity * (preset === 'dia' ? 1.9 : 1.3)}
		: base;
	const sunDir = useMemo(() => sunDirection(sunAzimuth ?? p.sunAzimuth, sunElevation ?? p.sunElevation), [p, sunAzimuth, sunElevation]);
	const target = useMemo(() => new THREE.Object3D(), []);
	const sunPos = useMemo(() => new THREE.Vector3(...focus).addScaledVector(sunDir, 60), [focus, sunDir]);
	const useBloom = bloom ?? p.bloom;

	return (
		<>
			<color attach="background" args={[p.skyHorizon]} />
			<fog attach="fog" args={[p.skyHorizon, p.fog[0], p.fog[1]]} />
			<GradientSky preset={p} sunDir={sunDir} />

			{/* "HDRI" de céu gerado do mesmo gradiente (determinístico, sem download). */}
			<Environment frames={1} resolution={128} environmentIntensity={p.envIntensity}>
				<GradientSky preset={p} sunDir={sunDir} radius={50} />
			</Environment>

			<hemisphereLight args={[p.hemiSky, p.hemiGround, p.hemiIntensity]} />

			<primitive object={target} position={focus} />
			<directionalLight
				color={p.sunColor}
				intensity={p.sunIntensity}
				position={sunPos}
				target={target}
				castShadow
				shadow-mapSize={[shadowMapSize, shadowMapSize]}
				shadow-bias={REF.light.shadowBias}
				shadow-normalBias={0.02}
				shadow-radius={REF.light.shadowRadius}
				shadow-camera-left={-shadowExtent}
				shadow-camera-right={shadowExtent}
				shadow-camera-top={shadowExtent}
				shadow-camera-bottom={-shadowExtent}
				shadow-camera-near={1}
				shadow-camera-far={140}
			/>

			{post && <PostFX bloom={useBloom} grade={p.grade} vignette={vignette ?? (preset === 'dia' ? 0.45 : 0.65)} />}
		</>
	);
};

/* ------------------------------------------------------------------ */
/* Faíscas (entardecer/noite, impactos) — balística analítica por frame */
/* ------------------------------------------------------------------ */

export const Sparks: React.FC<{
	/** segundos desde o disparo (frame/fps - inicio). <0 = invisível */
	t: number;
	count?: number;
	seed?: number;
	speed?: number;
	life?: number;
	color?: string;
	position?: [number, number, number];
}> = ({t, count = 60, seed = 7, speed = 5, life = 0.8, color = PALETTE.emissive, position = [0, 0, 0]}) => {
	const {geometry, vel, delay} = useMemo(() => {
		const r = mulberry32(seed);
		const v: THREE.Vector3[] = [];
		const d: number[] = [];
		for (let i = 0; i < count; i++) {
			const th = r() * Math.PI * 2;
			const up = 0.3 + r() * 0.9;
			const s = speed * (0.4 + r() * 0.8);
			v.push(new THREE.Vector3(Math.cos(th) * s, up * s, Math.sin(th) * s));
			d.push(r() * 0.12);
		}
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
		return {geometry: g, vel: v, delay: d};
	}, [count, seed, speed]);
	const mat = useMemo(
		() => new THREE.PointsMaterial({color: new THREE.Color(color).multiplyScalar(6), size: 0.06, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}),
		[color],
	);
	if (t < 0 || t > life + 0.2) return null;
	const pos = geometry.attributes.position as THREE.BufferAttribute;
	for (let i = 0; i < count; i++) {
		const tt = Math.max(0, t - delay[i]);
		const alive = tt > 0 && tt < life;
		pos.setXYZ(i, alive ? vel[i].x * tt : 0, alive ? vel[i].y * tt - 4.9 * tt * tt : -999, alive ? vel[i].z * tt : 0);
	}
	pos.needsUpdate = true;
	mat.opacity = 1 - Math.min(1, t / life);
	return (
		<Glow>
			<points geometry={geometry} material={mat} position={position} frustumCulled={false} />
		</Glow>
	);
};
