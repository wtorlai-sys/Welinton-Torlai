// STYLE_GUIDE §1 e §3 — formato, área segura e paleta.

export const VIDEO = {width: 1080, height: 1920, fps: 30} as const;

/** Frações da tela que NÃO podem ter nada importante (STYLE_GUIDE §1). */
export const SAFE = {top: 0.08, bottom: 0.12, right: 0.1, left: 0} as const;

export const PALETTE = {
	/** ÚNICO vermelho permitido. Só no ponto de foco/piada. */
	accent: '#E63B2E',
	grass: '#4FA83A',
	grassDark: '#2F7A2A',
	grassDry: '#8DB33E',
	field: '#D9B865',
	fieldLight: '#E8D39A',
	sky: '#7EC3F0',
	skyHorizon: '#CFE6F2',
	asphalt: '#4A525E',
	asphaltLight: '#5E6773',
	roadLine: '#F2F2EA',
	roadLineYellow: '#F2C230',
	bark: '#5A4030',
	leaf: '#3E8F32',
	wood: '#8A6440',
	// Roupas: complementares ao vermelho/verde.
	turquoise: '#1FB5B0',
	yellow: '#F5C518',
	blue: '#2F6FDB',
	purple: '#7A4FD0',
	orangeVest: '#C8F02A', // colete refletivo (verde-limão, não compete com o vermelho)
	ink: '#111111',
	white: '#FFFFFF',
} as const;
