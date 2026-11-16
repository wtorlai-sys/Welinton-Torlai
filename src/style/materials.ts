// STYLE_GUIDE §2 (personagem toon) e §5 (cenário semi-realista).
// Fábrica única de materiais: reaproveite daqui em vez de criar materiais soltos.
import * as THREE from 'three';
import {PALETTE} from './constants';

/* ------------------------------------------------------------------ */
/* Personagem                                                          */
/* ------------------------------------------------------------------ */

/** Escala do inverted hull (STYLE_GUIDE §2: 1.03-1.05). */
export const OUTLINE_SCALE = 1.04;

/**
 * Branco "HDR" da cabeça: o composer aplica tone mapping NEUTRAL, que comprime 1.0
 * para ~0.88. Com 3.0 a cabeça sai #FFFFFF no frame final, sem sombreamento.
 * (Fica abaixo do limiar do bloom — ver Lighting.tsx.)
 */
export const HEAD_WHITE = 3.0;

const cache = new Map<string, THREE.Material | THREE.Texture>();
const memo = <T extends THREE.Material | THREE.Texture>(key: string, make: () => T): T => {
	if (!cache.has(key)) cache.set(key, make());
	return cache.get(key) as T;
};

/** gradientMap de 3 tons (sombra / meio-tom / luz) com filtro Nearest = degraus duros. */
export const toonGradient = () =>
	memo('toon-gradient', () => {
		const tones = [90, 175, 255];
		const data = new Uint8Array(tones.length * 4);
		tones.forEach((v, i) => data.set([v, v, v, 255], i * 4));
		const tex = new THREE.DataTexture(data, tones.length, 1, THREE.RGBAFormat);
		tex.minFilter = THREE.NearestFilter;
		tex.magFilter = THREE.NearestFilter;
		tex.generateMipmaps = false;
		tex.needsUpdate = true;
		return tex;
	});

/** Corpo / roupa / chapéu: MeshToonMaterial com gradiente de 3 tons. */
export const makeToonMaterial = (color: THREE.ColorRepresentation) =>
	memo(`toon-${new THREE.Color(color).getHexString()}`, () =>
		new THREE.MeshToonMaterial({color, gradientMap: toonGradient()}),
	);

/** Cabeça: esfera branca pura, sem sombreamento. */
export const makeHeadMaterial = () =>
	memo('head', () => {
		const m = new THREE.MeshBasicMaterial({color: new THREE.Color(1, 1, 1).multiplyScalar(HEAD_WHITE)});
		return m;
	});

/** Braços/pernas: palito preto #111 (toon, para projetar/receber sombra coerente). */
export const makeLimbMaterial = () => memo('limb', () => new THREE.MeshToonMaterial({color: PALETTE.ink, gradientMap: toonGradient()}));

/** Inverted hull: cópia da malha escalada, BackSide, preto chapado. */
export const makeOutlineMaterial = () =>
	memo('outline', () => new THREE.MeshBasicMaterial({color: PALETTE.ink, side: THREE.BackSide}));

/** Traços do rosto (olhos, sobrancelhas, boca) — planos 2D pretos colados na cabeça. */
export const makeFaceInkMaterial = () =>
	memo('face-ink', () =>
		new THREE.MeshBasicMaterial({
			color: PALETTE.ink,
			side: THREE.DoubleSide,
			polygonOffset: true,
			polygonOffsetFactor: -4,
			polygonOffsetUnits: -4,
		}),
	);

/** Branco do olho arregalado (susto) — mesmo branco HDR da cabeça. */
export const makeFaceWhiteMaterial = () =>
	memo('face-white', () =>
		new THREE.MeshBasicMaterial({
			color: new THREE.Color(1, 1, 1).multiplyScalar(HEAD_WHITE),
			side: THREE.DoubleSide,
			polygonOffset: true,
			polygonOffsetFactor: -2,
			polygonOffsetUnits: -2,
		}),
	);

/* ------------------------------------------------------------------ */
/* Cenário — procedurais em coordenadas de mundo (sem tiling visível)  */
/* ------------------------------------------------------------------ */

const GLSL_NOISE = /* glsl */ `
float hash31(vec3 p){ p = fract(p*0.3183099 + 0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vnoise(vec3 x){
	vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
	return mix(mix(mix(hash31(i+vec3(0,0,0)),hash31(i+vec3(1,0,0)),f.x),
	               mix(hash31(i+vec3(0,1,0)),hash31(i+vec3(1,1,0)),f.x),f.y),
	           mix(mix(hash31(i+vec3(0,0,1)),hash31(i+vec3(1,0,1)),f.x),
	               mix(hash31(i+vec3(0,1,1)),hash31(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p){ float a=0.5, s=0.0; for(int i=0;i<5;i++){ s+=a*vnoise(p); p=p*2.03+vec3(1.7,9.2,3.1); a*=0.5; } return s; }
// AA de faixas desenhadas no shader (linhas da estrada)
float band(float x, float halfWidth){ float w = fwidth(x)*1.0 + 1e-4; return 1.0 - smoothstep(halfWidth - w, halfWidth + w, abs(x)); }
`;

type Patch = {uniforms?: Record<string, THREE.IUniform>; color: string; roughness?: string; vertexLocal?: boolean};

/**
 * Injeta noise de mundo num MeshStandardMaterial. `color` é GLSL que pode ler
 * `vW` (posição de mundo), `vL` (posição local) e escrever em `diffuseColor.rgb`.
 */
const patchStandard = (mat: THREE.MeshStandardMaterial, key: string, patch: Patch) => {
	mat.onBeforeCompile = (shader) => {
		Object.assign(shader.uniforms, patch.uniforms ?? {});
		shader.vertexShader = shader.vertexShader
			.replace('#include <common>', `#include <common>\nvarying vec3 vW;\nvarying vec3 vL;`)
			.replace(
				'#include <project_vertex>',
				`#include <project_vertex>
				vec4 wp = vec4(transformed, 1.0);
				#ifdef USE_INSTANCING
				wp = instanceMatrix * wp;
				#endif
				vW = (modelMatrix * wp).xyz;
				vL = transformed;`,
			);
		const decl = Object.keys(patch.uniforms ?? {})
			.map((k) => {
				const v = patch.uniforms![k].value;
				const t = v instanceof THREE.Color ? 'vec3' : v instanceof THREE.Vector4 ? 'vec4' : v instanceof THREE.Vector2 ? 'vec2' : v instanceof THREE.Vector3 ? 'vec3' : 'float';
				return `uniform ${t} ${k};`;
			})
			.join('\n');
		shader.fragmentShader = shader.fragmentShader
			.replace('#include <common>', `#include <common>\nvarying vec3 vW;\nvarying vec3 vL;\n${decl}\n${GLSL_NOISE}`)
			.replace('#include <color_fragment>', `#include <color_fragment>\n${patch.color}`)
			.replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\n${patch.roughness ?? ''}`);
	};
	mat.customProgramCacheKey = () => key;
	return mat;
};

const c = (hex: string) => new THREE.Color(hex);

/**
 * Chão do campo: grama saturada com manchas em 2 escalas, acostamento de terra perto
 * da estrada e um campo dourado numa região (bounds = xmin, xmax, zmin, zmax).
 */
export const makeGroundMaterial = (opts: {roadHalfWidth?: number; fieldBounds?: [number, number, number, number]} = {}) =>
	memo(`ground-${opts.roadHalfWidth}-${opts.fieldBounds?.join(',')}`, () =>
		patchStandard(new THREE.MeshStandardMaterial({color: '#ffffff', roughness: 0.95}), `ground-${opts.fieldBounds?.join(',')}`, {
			uniforms: {
				uGrass: {value: c(PALETTE.grass)},
				uGrassDark: {value: c(PALETTE.grassDark)},
				uGrassDry: {value: c(PALETTE.grassDry)},
				uField: {value: c(PALETTE.field)},
				uFieldLight: {value: c(PALETTE.fieldLight)},
				uDirt: {value: c('#9A8466')},
				uRoadHalf: {value: opts.roadHalfWidth ?? 3.5},
				uFieldB: {value: new THREE.Vector4(...(opts.fieldBounds ?? [1e5, 1e5, 1e5, 1e5]))},
			},
			color: /* glsl */ `
				vec3 p = vW;
				float big = fbm(vec3(p.x, 0.0, p.z) * 0.035);
				float mid = fbm(vec3(p.x, 3.0, p.z) * 0.22);
				float fine = vnoise(vec3(p.x, 7.0, p.z) * 3.1);
				vec3 g = mix(uGrassDark, uGrass, smoothstep(0.25, 0.7, mid));
				g = mix(g, uGrassDry, smoothstep(0.55, 0.85, big) * 0.6);
				g *= 0.9 + 0.2 * fine;
				// campo dourado com borda irregular
				float edge = (fbm(vec3(p.x, 11.0, p.z) * 0.08) - 0.5) * 14.0;
				float inF = step(uFieldB.x, p.x + edge) * step(p.x - edge, uFieldB.y) * step(uFieldB.z, p.z + edge) * step(p.z - edge, uFieldB.w);
				vec3 f = mix(uField, uFieldLight, smoothstep(0.3, 0.8, fbm(vec3(p.x*0.6, 5.0, p.z*0.15)*0.5)));
				f *= 0.92 + 0.16 * fine;
				g = mix(g, f, inF);
				// acostamento de terra junto à estrada
				float dRoad = abs(p.x) - uRoadHalf;
				float shoulder = 1.0 - smoothstep(0.0, 0.9 + mid * 0.8, dRoad);
				g = mix(g, uDirt * (0.85 + 0.3 * fine), shoulder * step(0.0, dRoad + 0.01));
				diffuseColor.rgb = g;
			`,
		}),
	);

/** Asfalto cinza-azulado com grão em 2 escalas, trilhas de pneu e faixas pintadas (AA). */
export const makeAsphaltMaterial = (halfWidth = 3.5) =>
	memo(`asphalt-${halfWidth}`, () =>
		patchStandard(new THREE.MeshStandardMaterial({color: '#ffffff', roughness: 0.85}), `asphalt-${halfWidth}`, {
			uniforms: {
				uA: {value: c(PALETTE.asphalt)},
				uB: {value: c(PALETTE.asphaltLight)},
				uLine: {value: c(PALETTE.roadLine)},
				uYellow: {value: c(PALETTE.roadLineYellow)},
				uHalf: {value: halfWidth},
			},
			color: /* glsl */ `
				vec3 p = vW;
				float big = fbm(vec3(p.x*0.08, 0.0, p.z*0.03));
				float grain = vnoise(p * 9.0) * 0.6 + vnoise(p * 31.0) * 0.4;
				vec3 a = mix(uA, uB, smoothstep(0.3, 0.75, big));
				a *= 0.88 + 0.22 * grain;
				// trilhas de pneu (mais escuras/lisas) nas duas faixas
				float lane = uHalf * 0.5;
				float tracks = 0.0;
				for (int s = -1; s <= 1; s += 2) {
					float lc = float(s) * lane;
					tracks += exp(-pow((p.x - (lc - 0.8)) / 0.35, 2.0)) + exp(-pow((p.x - (lc + 0.8)) / 0.35, 2.0));
				}
				a *= 1.0 - 0.12 * tracks;
				// faixas: bordas brancas contínuas + centro amarelo tracejado
				float edgeL = band(p.x - (uHalf - 0.3), 0.08) + band(p.x + (uHalf - 0.3), 0.08);
				float dash = step(fract(p.z / 12.0), 0.4);
				float center = band(p.x, 0.07) * dash;
				float wear = 0.8 + 0.2 * vnoise(p * 4.0);
				a = mix(a, uLine * wear, clamp(edgeL, 0.0, 1.0));
				a = mix(a, uYellow * wear, center);
				diffuseColor.rgb = a;
			`,
			roughness: /* glsl */ `roughnessFactor = 0.78 + 0.15 * vnoise(vW * 2.0);`,
		}),
	);

/** Casca de árvore: sulcos verticais (noise esticado em Y) em coordenada local. */
export const makeBarkMaterial = () =>
	memo('bark', () =>
		patchStandard(new THREE.MeshStandardMaterial({color: '#ffffff', roughness: 1}), 'bark', {
			uniforms: {uBark: {value: c(PALETTE.bark)}, uBarkDark: {value: c('#33241A')}},
			color: /* glsl */ `
				float ang = atan(vL.x, vL.z);
				float ridges = fbm(vec3(ang * 3.0, vL.y * 1.2, 0.0) * vec3(1.0, 1.0, 1.0) + vec3(0.0, 0.0, vL.y * 0.1));
				float cracks = smoothstep(0.42, 0.5, vnoise(vec3(ang * 9.0, vL.y * 2.5, 1.0)));
				vec3 b = mix(uBarkDark, uBark, ridges * 0.9 + 0.1);
				b *= 0.65 + 0.35 * cracks;
				diffuseColor.rgb = b;
			`,
		}),
	);

/** Copa low-poly SÓLIDA: flatShading + variação de cor em massas (nada de cartões). */
export const makeFoliageMaterial = (color: string = PALETTE.leaf) =>
	memo(`foliage-${color}`, () =>
		patchStandard(new THREE.MeshStandardMaterial({color: '#ffffff', roughness: 0.9, flatShading: true}), `foliage-${color}`, {
			uniforms: {uLeaf: {value: c(color)}, uLeafLight: {value: c('#7DBA3C')}, uLeafDark: {value: c('#1F5A22')}},
			color: /* glsl */ `
				float n = fbm(vW * 0.9);
				vec3 l = mix(uLeafDark, uLeaf, smoothstep(0.2, 0.55, n));
				l = mix(l, uLeafLight, smoothstep(0.6, 0.85, n) * 0.7);
				diffuseColor.rgb = l;
			`,
		}),
	);

/** Madeira (cerca, poste de placa): veios longitudinais. */
export const makeWoodMaterial = (color: string = PALETTE.wood) =>
	memo(`wood-${color}`, () =>
		patchStandard(new THREE.MeshStandardMaterial({color: '#ffffff', roughness: 0.85}), `wood-${color}`, {
			uniforms: {uWood: {value: c(color)}},
			color: /* glsl */ `
				float g = fbm(vec3(vW.x * 1.5 + vL.y * 0.2, vL.y * 0.5 + vW.z * 1.5, vW.z * 1.5) * vec3(2.0, 0.3, 2.0));
				float streak = vnoise(vec3(vW.x * 25.0, vL.y * 1.0, vW.z * 25.0));
				vec3 w = uWood * (0.7 + 0.35 * g) * (0.9 + 0.15 * streak);
				diffuseColor.rgb = w;
			`,
		}),
	);

/** Metal pintado/galvanizado (postes, guard-rail). */
export const makeMetalMaterial = (color = '#A9B0B8') =>
	memo(`metal-${color}`, () => new THREE.MeshStandardMaterial({color, roughness: 0.45, metalness: 0.7}));

/** Pintura automotiva semi-realista. */
export const makePaintMaterial = (color: string) =>
	memo(`paint-${color}`, () => new THREE.MeshStandardMaterial({color, roughness: 0.32, metalness: 0.35}));

export const makeGlassMaterial = () =>
	memo('glass', () => new THREE.MeshStandardMaterial({color: '#1E2A36', roughness: 0.08, metalness: 0.9, envMapIntensity: 1.4}));

export const makeRubberMaterial = () => memo('rubber', () => new THREE.MeshStandardMaterial({color: '#1A1A1C', roughness: 0.9}));

/** Emissivo para lâmpadas (bloom só pega isso: intensidade bem acima do limiar). */
export const makeEmissiveMaterial = (color: string, intensity = 12) =>
	memo(`emis-${color}-${intensity}`, () => new THREE.MeshStandardMaterial({color: '#000000', emissive: color, emissiveIntensity: intensity}));

/** Sombra blob (fallback barato a ContactShadows): textura radial gerada uma vez. */
export const blobShadowTexture = () =>
	memo('blob-tex', () => {
		const s = 128;
		const canvas = document.createElement('canvas');
		canvas.width = canvas.height = s;
		const ctx = canvas.getContext('2d')!;
		const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
		g.addColorStop(0, 'rgba(0,0,0,0.75)');
		g.addColorStop(0.5, 'rgba(0,0,0,0.4)');
		g.addColorStop(1, 'rgba(0,0,0,0)');
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, s, s);
		const tex = new THREE.CanvasTexture(canvas);
		tex.colorSpace = THREE.SRGBColorSpace;
		return tex;
	});

export const makeBlobShadowMaterial = () =>
	memo('blob', () =>
		new THREE.MeshBasicMaterial({map: blobShadowTexture(), transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1}),
	);
