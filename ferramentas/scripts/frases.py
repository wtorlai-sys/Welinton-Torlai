#!/usr/bin/env python3
"""Gera o frases.md: uma frase por linha, com tempo de início e a pausa que vem depois.

Frase = termina em . ? ! (ou numa pausa > 0,4 s). Usa os mesmos tokens das legendas ("R$ 5"). Pausas > 0,3 s são anotadas.

Uso: frases.py <palavras.json> <frases.md> [--titulo "texto"]
Formato: `mm:ss.ff  texto  [pausa 0,42 s]`
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from legendas import tokens  # noqa: E402

PAUSA_MIN = 0.30
PAUSA_FRASE = 0.40


def mmss(t):
    m, s = divmod(t, 60)
    return f'{int(m):02d}:{s:05.2f}'


def virg(x):
    return f'{x:.2f}'.replace('.', ',')


def frases(ws):
    out, cur = [], []
    for i, w in enumerate(ws):
        cur.append(w)
        prox = ws[i + 1]['start'] if i + 1 < len(ws) else None
        gap = (prox - w['end']) if prox is not None else 0
        if re.search(r'[.?!…]$', w['text']) or gap > PAUSA_FRASE or prox is None:
            out.append((cur, gap))
            cur = []
    return out


def main(a):
    if len(a) < 2:
        sys.exit(__doc__)
    ws = tokens(json.load(open(a[0]))['words'])
    titulo = a[a.index('--titulo') + 1] if '--titulo' in a else 'Frases da narração'
    fs = frases(ws)
    linhas = [f'# {titulo}', '',
              f'{len(fs)} frases · fim da fala {mmss(ws[-1]["end"])} · pausas > {virg(PAUSA_MIN)} s anotadas '
              '(entre frases no fim da linha; dentro da frase com `‖`).', '']
    for cur, gap in fs:
        partes = []
        for p, w in zip(cur, cur[1:] + [None]):
            partes.append(p['text'])
            if w is not None and w['start'] - p['end'] > PAUSA_MIN:
                partes.append(f"‖{virg(w['start'] - p['end'])}")
        txt = ' '.join(partes)
        pausa = f'  [pausa {virg(gap)} s]' if gap > PAUSA_MIN else ''
        linhas.append(f'- `{mmss(cur[0]["start"])}`  {txt}{pausa}')
    open(a[1], 'w').write('\n'.join(linhas) + '\n')
    print('ok', a[1], len(fs), 'frases')


if __name__ == '__main__':
    main(sys.argv[1:])
