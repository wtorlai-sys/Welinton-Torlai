// Elenco do episódio "A garota popular" — visual tirado das fichas do Customuse
// (public/garota/personagens/*.png). Para mudar roupa/cabelo, mude aqui.
import type {Look} from '../../components/BlockyAvatar';

export const MAX: Look = {
	skin: '#E8B48A', shirt: '#C9322B', shirtDark: '#A82822', sleeves: '#C9322B', pants: '#35383E', shoes: '#C9322B', sole: '#F4F4F4',
	hair: 'messy', hairColor: '#4A2C1A', eyes: '#7A4522', hood: true, pocket: true, tee: '#F4F4F4', cargo: true, scale: 0.95,
};

export const IRMAO: Look = {
	skin: '#E3AE84', shirt: '#2E7D3B', shirtDark: '#24652F', sleeves: '#EDEDED', cuff: '#2E7D3B', pants: '#93B6DC', shoes: '#F2F2F2', sole: '#DADADA',
	hair: 'quiff', hairColor: '#4B301E', eyes: '#6B3E1E', tee: '#9A9EA3', varsity: true, scale: 1.04,
};

export const GAROTA: Look = {
	skin: '#F0C3A0', shirt: '#C7A3E0', shirtDark: '#B38CD0', sleeves: '#C7A3E0', pants: '#9DBDE2', shoes: '#F4A7C3', sole: '#F8F8F8',
	hair: 'long', hairColor: '#EBCB79', eyes: '#2AA39A', lashes: true, blush: true, hood: true, pocket: true, clip: '#F27BA8', scale: 0.93,
};

/** Figurantes (alunos ao fundo). */
const SHIRTS = ['#3A6FD8', '#F2C230', '#2BA59B', '#E8E8E8', '#7A4FD0', '#F28C38', '#5DA130', '#E27AA0'];
const PANTS = ['#2F3340', '#5A6B8C', '#3E4A5C', '#7A5C44', '#9DBDE2'];
const HAIRC = ['#2A1A10', '#5A3A22', '#E2C070', '#8A4A22', '#1A1A1A', '#B86A3A'];
const SKIN = ['#E8B48A', '#C98E62', '#8E5A3A', '#F0C3A0', '#B07A52'];
const STY = ['short', 'bun', 'cap', 'messy', 'long', 'short'] as const;
export const extra = (i: number): Look => ({
	skin: SKIN[i % SKIN.length], shirt: SHIRTS[i % SHIRTS.length], shirtDark: SHIRTS[(i + 3) % SHIRTS.length], sleeves: SHIRTS[i % SHIRTS.length],
	pants: PANTS[(i * 3) % PANTS.length], shoes: '#EDEDED', hair: STY[(i * 5) % STY.length], hairColor: HAIRC[(i * 7) % HAIRC.length],
	eyes: '#5A3A22', scale: 0.92 + ((i * 13) % 10) / 100, lashes: STY[(i * 5) % STY.length] === 'long' || STY[(i * 5) % STY.length] === 'bun',
});
