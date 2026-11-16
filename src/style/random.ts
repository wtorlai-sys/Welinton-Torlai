// Aleatoriedade determinística (STYLE_GUIDE §1): nunca Math.random sem seed.

export const mulberry32 = (seed: number) => {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
};

/** Hash 1D estável em [0,1). */
export const hash1 = (n: number) => {
	const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
	return s - Math.floor(s);
};

/** Ruído 1D suave (value noise), útil para shake de câmera. */
export const noise1 = (x: number, seed = 0) => {
	const i = Math.floor(x);
	const f = x - i;
	const u = f * f * (3 - 2 * f);
	return hash1(i + seed * 101.3) * (1 - u) + hash1(i + 1 + seed * 101.3) * u;
};
