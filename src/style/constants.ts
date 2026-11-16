// STYLE_GUIDE §1 e §3 — formato, área segura e paleta.

export const VIDEO = {width: 1080, height: 1920, fps: 30} as const;

/** Frações da tela que NÃO podem ter nada importante (STYLE_GUIDE §1). */
export const SAFE = {top: 0.08, bottom: 0.12, right: 0.1, left: 0} as const;

// STYLE_GUIDE §10 — VALORES DE REFERÊNCIA (padrão de todo vídeo; adapte só ao clima do tema).
export const PALETTE = {
	/** ÚNICO vermelho permitido. Só 1 ponto de foco/piada por cena. */
	accent: '#E63B2E',
	// Céu
	skyTop: '#6FA8DC',
	skyHorizon: '#DCE9F5',
	// Vegetação (#5DA130 / #8CC63F) + variação escura derivada para o noise
	grass: '#5DA130',
	grassLight: '#8CC63F',
	grassDark: '#47862A',
	// Terra/campo
	field: '#D9B86C',
	fieldLight: '#E6CC8E',
	dirt: '#A88D62',
	// Asfalto/chão urbano
	asphalt: '#4A4F5A',
	asphaltLight: '#596070',
	roadLine: '#F2F2EA',
	roadLineYellow: '#F2C230',
	bark: '#5A4030',
	wood: '#8A6440',
	// Roupas
	turquoise: '#2BA59B',
	yellow: '#F2C230',
	blue: '#3A6FD8',
	offWhite: '#E8E8E8',
	purple: '#7A4FD0',
	vest: '#C8F02A', // colete refletivo (verde-limão, não compete com o vermelho)
	// Personagem
	head: '#FFFFFF',
	ink: '#111111',
	white: '#FFFFFF',
	// Noite
	nightBg: '#2B3550',
	emissive: '#FFD27A',
} as const;

export const REF = {
	light: {
		sunColor: '#FFF1D6',
		sunIntensity: 3,
		sunElevation: 32, // 25–40°
		sunAzimuth: -45, // 45° lateral ao eixo da câmera padrão (que olha para -Z)
		hemiSky: '#BFD9FF',
		hemiGround: '#6B8E4E',
		hemiIntensity: 0.6,
		shadowMapSize: 2048, // 2048–4096
		shadowRadius: 3, // 2–4
		shadowBias: -0.0005,
		contactOpacity: 0.5,
		contactBlur: 2.5,
		fogNear: 30,
		fogFar: 200,
		night: {sunFactor: 0.1, bloomIntensity: 1.2, bloomThreshold: 0.8},
	},
	camera: {
		height: 1.2,
		fov: 55,
		establishing: {height: 3.5, dist: 12}, // 3–4 m de altura, assunto a 10–15 m
		aerial: {height: 60, pitch: 80}, // 40–80 m, olhando 60–90° para baixo
		medium: {height: 1.2, dist: 3.5}, // personagem a 3–4 m
		close: {height: 1.0, fov: 40, faceFill: 0.4},
		pushIn: 0.08, // 5–10% em ~2 s
		orbitMax: 15,
		shake: {duration: 8, intensity: 0.07}, // 6–10 frames, 0.05–0.1
	},
	character: {height: 1.0, headFraction: 0.35, outline: 1.04},
	caption: {fontSize: 100, strokePx: 9, shadowPx: 4, y: 0.65, yWhenActionLow: 0.3},
} as const;
