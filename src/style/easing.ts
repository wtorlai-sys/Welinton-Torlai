// Utilitários de tempo/easing (mesmo padrão de src/v2/time.ts do projeto anterior).
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const ramp = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const smooth = (x: number) => x * x * (3 - 2 * x);
export const sr = (t: number, a: number, b: number) => smooth(ramp(t, a, b));
export const easeInOutCubic = (x: number) =>
	x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
export const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeOutBack = (x: number, s = 1.70158) =>
	1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
