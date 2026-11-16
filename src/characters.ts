// STYLE_GUIDE §2 — elenco recorrente com ROUPA FIXA.
// Para mudar o visual de um personagem, mude aqui (e só aqui).
import type {Outfit} from './components/Character';
import {PALETTE} from './style/constants';

export type CastMember = {
	id: string;
	nome: string;
	papel: string;
	outfit: Outfit;
	/** expressão padrão quando a cena não especifica */
	expressaoPadrao: 'neutro' | 'deboche' | 'feliz' | 'susto' | 'bravo';
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
