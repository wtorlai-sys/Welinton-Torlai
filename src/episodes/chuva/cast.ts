// Elenco fixo do canal "Nesta cidade…" (histórias em blocos). O narrador é o mascote: menino de boné
// laranja com a aba virada para trás + camisa verde de tricô listrado. Design original.
import {Look} from './Blocky';

export const CAST = {
	narrador: {skin: '#E8B88A', shirt: '#2FA36B', shirt2: '#22865A', pattern: 'listras', pants: '#2B3445', shoes: '#F2F2F2', hair: {type: 'curto', color: '#3A2418'}, hat: {type: 'bone', color: '#FF8A1F'}, scale: 0.74},
	vovo: {skin: '#F1CFAE', shirt: '#B48AD8', dress: '#B48AD8', pants: '#B48AD8', shoes: '#6B4A3A', hair: {type: 'coque', color: '#DADBE2'}, glasses: true, scale: 0.86},
	vovo_jovem: {skin: '#F1CFAE', shirt: '#E86A9A', dress: '#E86A9A', pants: '#E86A9A', shoes: '#6B4A3A', hair: {type: 'coque', color: '#5A3624'}, scale: 0.88},
	vovoZeca: {skin: '#E9C29A', shirt: '#C9A46A', shirt2: '#8A6440', pattern: 'xadrez', pants: '#4A4038', shoes: '#2A1E18', hat: {type: 'boina', color: '#5A5048'}, mustache: '#6A4A36', hair: {type: 'curto', color: '#6A4A36'}, scale: 0.96},
	tiao: {skin: '#B9805A', shirt: '#E8E8E8', coat: '#F2C230', pants: '#3A4A5A', shoes: '#2A2A2A', hat: {type: 'capuz', color: '#F2C230'}, mustache: '#2A1E18', scale: 1},
	noivo: {skin: '#C68A5E', shirt: '#F4F4F4', coat: '#2B2F3A', tie: '#2BA59B', pants: '#2B2F3A', shoes: '#111', hair: {type: 'curto', color: '#2A1E18'}, scale: 0.98},
	noiva: {skin: '#F3D2B5', shirt: '#F7F4EE', dress: '#F7F4EE', pants: '#F7F4EE', shoes: '#F7F4EE', hair: {type: 'longo', color: '#6B3E26'}, hat: {type: 'veu', color: '#FFFFFF'}, scale: 0.92},
	medico: {skin: '#8D5A3B', shirt: '#6FB7C9', coat: '#F2F2F2', pants: '#6FB7C9', shoes: '#F2F2F2', hat: {type: 'touca', color: '#5FB89A'}, glasses: true, scale: 1},
	menina: {skin: '#F5D7B8', shirt: '#FF9EC4', shirt2: '#FFFFFF', pattern: 'listras', pants: '#3A6FD8', shoes: '#F2C230', hair: {type: 'trancas', color: '#3B2418'}, scale: 0.58},
	valentao: {skin: '#D9A47A', shirt: '#3A6FD8', shirt2: '#2B4FA0', pattern: 'xadrez', pants: '#2B2B33', shoes: '#1E1E22', hair: {type: 'curto', color: '#1E1A18'}, scale: 0.7},
	senhora: {skin: '#C68A5E', shirt: '#2BA59B', dress: '#2BA59B', pants: '#2BA59B', shoes: '#333', hair: {type: 'coque', color: '#2A1E18'}, scale: 0.9},
	vizinho1: {skin: '#F1CFAE', shirt: '#F28C38', pattern: 'trico', pants: '#3A3A44', shoes: '#222', hair: {type: 'curto', color: '#8A5A2A'}, scale: 0.98},
	vizinho2: {skin: '#8D5A3B', shirt: '#7A4FD0', shirt2: '#5E3BAA', pattern: 'listras', pants: '#2B3445', shoes: '#EEE', hair: {type: 'careca', color: '#000'}, glasses: true, scale: 1},
	vizinha: {skin: '#E8B88A', shirt: '#7BC043', dress: '#7BC043', pants: '#7BC043', shoes: '#333', hair: {type: 'longo', color: '#C9A13A'}, scale: 0.9},
	mae: {skin: '#E8B88A', shirt: '#F2C230', shirt2: '#E0A820', pattern: 'trico', pants: '#3A4A6A', shoes: '#333', hair: {type: 'longo', color: '#3A2418'}, scale: 0.9},
	pai: {skin: '#E8B88A', shirt: '#3A6FD8', shirt2: '#E8E8E8', pattern: 'xadrez', pants: '#3A3A44', shoes: '#222', hair: {type: 'curto', color: '#3A2418'}, scale: 0.98},
	padre: {skin: '#F1CFAE', shirt: '#F4F4F4', coat: '#1E1E24', pants: '#1E1E24', shoes: '#111', hair: {type: 'careca', color: '#000'}, glasses: true, scale: 0.95},
} satisfies Record<string, Look>;
