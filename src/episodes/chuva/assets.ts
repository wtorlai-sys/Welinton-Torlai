// "A chuva da vovó" — texturas (geradas no Customuse, Patina text-to-material) e materiais do episódio.
// Carregadas uma vez antes do primeiro frame (delayRender no Video.tsx). Tudo memoizado e determinístico.
import * as THREE from 'three';
import {staticFile} from 'remotion';

const NAMES = ['pedra', 'pedra_n', 'madeira', 'madeira_n', 'tijolo', 'tijolo_n', 'papel', 'grama', 'grama_n', 'telha', 'telha_n'] as const;
export type TexName = (typeof NAMES)[number];

const base = new Map<TexName, THREE.Texture>();
let loading: Promise<void> | null = null;

export const loadEpisodeTextures = () => {
	if (!loading) {
		const loader = new THREE.TextureLoader();
		loading = Promise.all(
			NAMES.map(
				(n) =>
					new Promise<void>((res, rej) =>
						loader.load(
							staticFile(`tex/chuva/${n}.jpg`),
							(t) => {
								t.wrapS = t.wrapT = THREE.RepeatWrapping;
								t.anisotropy = 8;
								if (!n.endsWith('_n')) t.colorSpace = THREE.SRGBColorSpace;
								base.set(n, t);
								res();
							},
							undefined,
							rej,
						),
					),
			),
		).then(() => undefined);
	}
	return loading;
};

const cache = new Map<string, unknown>();
const memo = <T>(k: string, f: () => T): T => {
	if (!cache.has(k)) cache.set(k, f());
	return cache.get(k) as T;
};

export const tex = (n: TexName, rx = 1, ry = rx) =>
	memo(`t-${n}-${rx}-${ry}`, () => {
		const t = base.get(n)!.clone();
		t.repeat.set(rx, ry);
		t.needsUpdate = true;
		return t;
	});

/** Material texturizado (cor base + normal opcional). */
export const texMat = (n: TexName, rx = 1, ry = rx, opts: {tint?: string; rough?: number; normal?: boolean; normalScale?: number} = {}) =>
	memo(`m-${n}-${rx}-${ry}-${JSON.stringify(opts)}`, () => {
		const hasN = opts.normal !== false && base.has(`${n}_n` as TexName);
		return new THREE.MeshStandardMaterial({
			map: tex(n, rx, ry),
			color: opts.tint ?? '#ffffff',
			roughness: opts.rough ?? 0.85,
			normalMap: hasN ? tex(`${n}_n` as TexName, rx, ry) : null,
			normalScale: new THREE.Vector2(opts.normalScale ?? 0.8, opts.normalScale ?? 0.8),
		});
	});

export const plain = (color: string, rough = 0.7, metal = 0) =>
	memo(`p-${color}-${rough}-${metal}`, () => new THREE.MeshStandardMaterial({color, roughness: rough, metalness: metal}));

export const glow = (color: string, intensity = 4) =>
	memo(`g-${color}-${intensity}`, () => new THREE.MeshStandardMaterial({color: '#000', emissive: color, emissiveIntensity: intensity, toneMapped: false}));

/** Canvas → textura (texto de placas, rótulos, rostos). */
export const canvasTex = (key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) =>
	memo(`c-${key}`, () => {
		const cv = document.createElement('canvas');
		cv.width = w;
		cv.height = h;
		draw(cv.getContext('2d')!);
		const t = new THREE.CanvasTexture(cv);
		t.colorSpace = THREE.SRGBColorSpace;
		t.anisotropy = 8;
		return t;
	});

export {memo};
