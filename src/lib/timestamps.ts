// Normaliza timestamps de narração para palavras {text, start, end} (segundos).
// Formatos aceitos:
//  1) ElevenLabs Speech-to-Text (Scribe):   { words: [{ text, start, end, type: 'word'|'spacing' }] }
//  2) ElevenLabs TTS /with-timestamps:      { alignment: { characters[], character_start_times_seconds[], character_end_times_seconds[] } }
//     (também aceita normalized_alignment)
//  3) Genérico / MiniMax convertido:         [{ text|word, start, end }]  (start/end em s; ou start_ms/end_ms)

export type Word = {text: string; start: number; end: number};

type CharAlignment = {
	characters: string[];
	character_start_times_seconds: number[];
	character_end_times_seconds: number[];
};

const fromChars = (a: CharAlignment): Word[] => {
	const out: Word[] = [];
	let cur: Word | null = null;
	a.characters.forEach((ch, i) => {
		if (/\s/.test(ch)) {
			if (cur) out.push(cur);
			cur = null;
			return;
		}
		if (!cur) cur = {text: '', start: a.character_start_times_seconds[i], end: a.character_end_times_seconds[i]};
		cur.text += ch;
		cur.end = a.character_end_times_seconds[i];
	});
	if (cur) out.push(cur);
	return out;
};

type Loose = {text?: string; word?: string; start?: number; end?: number; start_ms?: number; end_ms?: number; type?: string};

export const parseTimestamps = (json: unknown): Word[] => {
	const j = json as Record<string, unknown>;
	if (j && typeof j === 'object' && !Array.isArray(j)) {
		const al = (j.alignment ?? j.normalized_alignment) as CharAlignment | undefined;
		if (al?.characters) return fromChars(al);
		if (Array.isArray(j.words)) return parseTimestamps(j.words);
	}
	if (Array.isArray(json)) {
		return (json as Loose[])
			.filter((w) => (w.type ? w.type === 'word' : true))
			.map((w) => ({
				text: String(w.text ?? w.word ?? '').trim(),
				start: w.start ?? (w.start_ms ?? 0) / 1000,
				end: w.end ?? (w.end_ms ?? 0) / 1000,
			}))
			.filter((w) => w.text.length > 0);
	}
	throw new Error('Formato de timestamps não reconhecido');
};

/** Palavra ativa no tempo t: a última cujo start <= t (fica até a próxima começar). */
export const activeWordIndex = (words: Word[], t: number, holdAfterEnd = 0.6) => {
	let idx = -1;
	for (let i = 0; i < words.length; i++) {
		if (words[i].start <= t) idx = i;
		else break;
	}
	if (idx === -1) return -1;
	const next = words[idx + 1];
	if (!next && t > words[idx].end + holdAfterEnd) return -1;
	return idx;
};
