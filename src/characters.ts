// STYLE_GUIDE §2 — elenco recorrente com ROUPA FIXA.
// Para mudar o visual de um personagem, mude aqui (e só aqui).
import type {Expression, Outfit} from './components/Character';
import {PALETTE} from './style/constants';

export type CastMember = {
	id: string;
	nome: string;
	papel: string;
	outfit: Outfit;
	/** expressão padrão quando a cena não especifica */
	expressaoPadrao: Expression;
};

export const CAST = {
	/** Protagonista: cara impassível/deboche diante do caos. Boné VERMELHO = foco. */
	ze: {
		id: 'ze',
		nome: 'Zé',
		papel: 'protagonista / narrador',
		outfit: {body: PALETTE.turquoise, hat: 'bone', hatColor: PALETTE.accent},
		expressaoPadrao: 'deboche',
	},
	/** Operário de obra: capacete amarelo + colete refletivo. */
	tonho: {
		id: 'tonho',
		nome: 'Tonho',
		papel: 'trabalhador / "especialista"',
		outfit: {body: PALETTE.blue, hat: 'capacete', hatColor: PALETTE.yellow, vest: true, vestColor: PALETTE.vest},
		expressaoPadrao: 'neutro',
	},
	/** Cientista/explicadora do fato real: gorro roxo. */
	bia: {
		id: 'bia',
		nome: 'Bia',
		papel: 'explica o fato científico',
		outfit: {body: PALETTE.yellow, hat: 'gorro', hatColor: PALETTE.purple},
		expressaoPadrao: 'feliz',
	},
	/** Irmã de 8 anos do Zé: pijama amarelo + laço turquesa. (Personagem criança: use scale ~0.75) */
	nina: {
		id: 'nina',
		nome: 'Nina',
		papel: 'irmã do Zé (8 anos)',
		outfit: {body: PALETTE.yellow, hat: 'laco', hatColor: PALETTE.turquoise},
		expressaoPadrao: 'bravo',
	},
	/** Sr. Roberto: pijama azul + touca de dormir branca. */
	roberto: {
		id: 'roberto',
		nome: 'Sr. Roberto',
		papel: 'vítima do exemplo',
		outfit: {body: PALETTE.blue, hat: 'touca', hatColor: PALETTE.offWhite},
		expressaoPadrao: 'susto',
	},
	/** Mãe: roupa roxa, sem chapéu. */
	mae: {
		id: 'mae',
		nome: 'Mãe',
		papel: 'mãe do Zé e da Nina',
		outfit: {body: PALETTE.purple, hat: 'none'},
		expressaoPadrao: 'neutro',
	},
	/** Pai: camisa off-white + gorro azul. */
	pai: {
		id: 'pai',
		nome: 'Pai',
		papel: 'pai do Zé e da Nina',
		outfit: {body: PALETTE.offWhite, hat: 'gorro', hatColor: PALETTE.blue},
		expressaoPadrao: 'neutro',
	},
	/** Figurante genérico (motoristas, multidão). Sem chapéu. */
	figurante: {
		id: 'figurante',
		nome: 'Figurante',
		papel: 'extra',
		outfit: {body: PALETTE.offWhite, hat: 'none'},
		expressaoPadrao: 'neutro',
	},
} satisfies Record<string, CastMember>;

export type CastId = keyof typeof CAST;
