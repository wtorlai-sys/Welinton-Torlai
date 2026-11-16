// STYLE_GUIDE §3 (color grade) e §4 (luz).
// Presets "dia" e "entardecer/noite" — sol, céu, fill, fog, environment, bloom e grade.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Environment} from '@react-three/drei';
import {useFrame, useThree} from '@react-three/fiber';
import {BlendFunction, BloomEffect, Effect, EffectComposer, EffectPass, RenderPass, ToneMappingEffect, ToneMappingMode} from 'postprocessing';
import {mulberry32} from '../style/random';

export type LightingPreset = 'dia' | 'entardecer';

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

export const LIGHTING: Record<LightingPreset, PresetDef> = {
	dia: {
		skyTop: '#3C8EE0',
		skyHorizon: '#CFE6F2',
		ground: '#9DBF7A',
		sunColor: '#FFE1B0',
		sunIntensity: 3.6,
		sunElevation: 24,
		sunAzimuth: -58,
		hemiSky: '#9CCBF2',
		hemiGround: '#5E8F3C',
		hemiIntensity: 0.55,
		envIntensity: 0.55,
		fog: [40, 320],
		exposure: 1.0,
		bloom: false,
		grade: {contrast: 1.1, saturation: 1.1, shadowTint: [-0.012, 0.0, 0.022], highlightTint: [0.02, 0.008, -0.012]},
	},
	entardecer: {
		skyTop: '#23324F',
		skyHorizon: '#8A8FA8',
		ground: '#3A4038',
		sunColor: '#FF9B5A',
		sunIntensity: 1.4,
		sunElevation: 6,
		sunAzimuth: -70,
		hemiSky: '#53627F',
		hemiGround: '#2B3326',
		hemiIntensity: 0.45,
		envIntensity: 0.35,
		fog: [25, 220],
		exposure: 1.0,
		bloom: true,
		grade: {contrast: 1.12, saturation: 0.95, shadowTint: [-0.01, 0.0, 0.03], highlightTint: [0.025, 0.01, -0.01]},
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
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
	vec3 c = pow(max(inputColor.rgb, 0.0), vec3(1.0/2.2));
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
export const PostFX: React.FC<{bloom: boolean; grade: GradeParams; multisampling?: number}> = ({bloom, grade, multisampling = 4}) => {
	const gl = useThree((s) => s.gl);
	const scene = useThree((s) => s.scene);
	const camera = useThree((s) => s.camera);
	const size = useThree((s) => s.size);
	const composer = useMemo(() => {
		const c = new EffectComposer(gl, {multisampling, frameBufferType: THREE.HalfFloatType});
		c.addPass(new RenderPass(scene, camera));
		const effects: Effect[] = [];
		// Limiar acima do branco HDR da cabeça (3.0): só emissivos fortes (lâmpadas/faíscas) brilham.
		if (bloom) effects.push(new BloomEffect({mipmapBlur: true, luminanceThreshold: 4.5, luminanceSmoothing: 0.2, intensity: 1.1, radius: 0.7}));
		effects.push(new ToneMappingEffect({mode: ToneMappingMode.NEUTRAL}));
		effects.push(new GradeEffect(grade));
		c.addPass(new EffectPass(camera, ...effects));
		return c;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [gl, scene, bloom, grade, multisampling]);
	useMemo(() => composer.setSize(size.width, size.height), [composer, size.width, size.height]);
	React.useEffect(() => () => composer.dispose(), [composer]);
	useFrame((state) => {
		composer.setMainCamera(state.camera);
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
};

export const sunDirection = (azimuthDeg: number, elevationDeg: number) => {
	const az = THREE.MathUtils.degToRad(azimuthDeg);
	const el = THREE.MathUtils.degToRad(elevationDeg);
	return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).normalize();
};

export const Lighting: React.FC<LightingProps> = ({preset = 'dia', focus = [0, 0, 0], shadowExtent = 18, sunAzimuth, sunElevation, post = true, bloom}) => {
	const p = LIGHTING[preset];
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
				shadow-mapSize={[2048, 2048]}
				shadow-bias={-0.00035}
				shadow-normalBias={0.025}
				shadow-radius={4}
				shadow-camera-left={-shadowExtent}
				shadow-camera-right={shadowExtent}
				shadow-camera-top={shadowExtent}
				shadow-camera-bottom={-shadowExtent}
				shadow-camera-near={1}
				shadow-camera-far={140}
			/>

			{post && <PostFX bloom={useBloom} grade={p.grade} />}
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
}> = ({t, count = 60, seed = 7, speed = 5, life = 0.8, color = '#FFB347', position = [0, 0, 0]}) => {
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
		() => new THREE.PointsMaterial({color: new THREE.Color(color).multiplyScalar(14), size: 0.06, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}),
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
	return <points geometry={geometry} material={mat} position={position} frustumCulled={false} />;
};
