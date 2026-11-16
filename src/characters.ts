// STYLE_GUIDE §2 — elenco recorrente com VISUAL FIXO (personagem 2D).
// Para mudar o visual de um personagem, mude aqui (e só aqui).
import type {Expression2D, Outfit2D} from './components/Character2D';
import {PALETTE} from './style/constants';

export type CastMember = {
	id: string;
	nome: string;
	papel: string;
	outfit: Outfit2D;
	/** escala (1 = adulto de 1,0 m; criança ~0.75) */
	escala: number;
	/** expressão padrão quando a cena não especifica */
	expressaoPadrao: Expression2D;
};

export const CAST = {
	/** Protagonista/narrador: boné VERMELHO = foco. Cara impassível/deboche diante do caos. */
	ze: {
		id: 'ze',
		nome: 'Zé',
		papel: 'protagonista / narrador',
		outfit: {body: PALETTE.turquoise, hat: 'bone', hatColor: PALETTE.accent},
		escala: 0.88,
		expressaoPadrao: 'deboche',
	},
	/** Irmã de 8 anos do Zé: pijama amarelo, franja castanha e laço turquesa. */
	nina: {
		id: 'nina',
		nome: 'Nina',
		papel: 'irmã do Zé (8 anos)',
		outfit: {body: PALETTE.yellow, hat: 'laco', hatColor: PALETTE.turquoise, hair: '#7A4A2A', hairStyle: 'franja', buttons: true},
		escala: 0.72,
		expressaoPadrao: 'bravo',
	},
	/** Sr. Roberto: pijama azul, touca de dormir e bigode. */
	roberto: {
		id: 'roberto',
		nome: 'Sr. Roberto',
		papel: 'vítima do exemplo',
		outfit: {body: PALETTE.blue, hat: 'touca', hatColor: '#6C8FD8', mustache: true, buttons: true},
		escala: 1,
		expressaoPadrao: 'susto',
	},
	/** Mãe: roupa roxa, cabelo castanho escuro. */
	mae: {
		id: 'mae',
		nome: 'Mãe',
		papel: 'mãe do Zé e da Nina',
		outfit: {body: PALETTE.purple, hat: 'none', hair: '#4A2E22', hairStyle: 'franja'},
		escala: 0.97,
		expressaoPadrao: 'neutro',
	},
	/** Pai: camisa off-white, gravata azul, cabelo grisalho. */
	pai: {
		id: 'pai',
		nome: 'Pai',
		papel: 'pai do Zé e da Nina',
		outfit: {body: PALETTE.offWhite, hat: 'none', hair: '#9AA0A8', hairStyle: 'lado', tie: PALETTE.blue, belt: true},
		escala: 1,
		expressaoPadrao: 'neutro',
	},
	/** Operário: capacete amarelo + colete refletivo. */
	tonho: {
		id: 'tonho',
		nome: 'Tonho',
		papel: 'trabalhador / "especialista"',
		outfit: {body: PALETTE.blue, hat: 'capacete', hatColor: PALETTE.yellow, vest: true, vestColor: PALETTE.vest, mustache: true},
		escala: 1,
		expressaoPadrao: 'neutro',
	},
	/** Cientista: gorro roxo, explica o fato real. */
	bia: {
		id: 'bia',
		nome: 'Bia',
		papel: 'explica o fato científico',
		outfit: {body: PALETTE.yellow, hat: 'gorro', hatColor: PALETTE.purple, hair: '#2A1A14', hairStyle: 'franja'},
		escala: 0.95,
		expressaoPadrao: 'feliz',
	},
	figurante: {
		id: 'figurante',
		nome: 'Figurante',
		papel: 'extra',
		outfit: {body: PALETTE.offWhite, hat: 'none', hair: '#2A1A14', hairStyle: 'lado'},
		escala: 1,
		expressaoPadrao: 'neutro',
	},
} satisfies Record<string, CastMember>;

export type CastId = keyof typeof CAST;
