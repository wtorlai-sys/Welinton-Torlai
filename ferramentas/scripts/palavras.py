#!/usr/bin/env python3
"""Gera o palavras.json do vídeo: palavras do medium (tempos) com as correções do fixes.json
(texto conferido com o large-v3 / por Welinton).

fixes.json: lista de {"inicio": s, "fim": s, "tokens": [[texto, ini, fim], ...], "nota": "..."}
— substitui as palavras do medium com start em [inicio, fim) pelos tokens.

Com --pausas conferencia.json (do conferir_transcricao.py), início de palavra que cai dentro de um
silêncio medido vai para o ataque da voz, e fim de palavra que entra no silêncio volta para o começo
dele (o Whisper costuma colar a palavra no fim da anterior).

Uso: palavras.py <medium.json> <palavras.json> [--fix fixes.json] [--pausas conferencia.json]
Saída: {"words": [{text, start, end}]}
"""
import json
import sys


def aplicar_fixes(ws, fixes):
    out, usados = [], set()
    for w in ws:
        k = next((i for i, f in enumerate(fixes) if f['inicio'] <= w['start'] < f['fim']), None)
        if k is None:
            out.append({'text': w['text'], 'start': w['start'], 'end': w['end']})
            continue
        if k not in usados:
            usados.add(k)
            out.extend({'text': t, 'start': s, 'end': e} for t, s, e in fixes[k]['tokens'])
    for i, f in enumerate(fixes):
        if i not in usados:  # trecho que o medium engoliu: insere na posição do tempo
            out.extend({'text': t, 'start': s, 'end': e} for t, s, e in f['tokens'])
    return sorted(out, key=lambda w: w['start'])


def encaixar(ws, pausas, folga=0.05):
    n = 0
    for w in ws:
        for p in pausas:
            if p['ini'] - 2 * folga <= w['start'] < p['fim'] - folga and w['end'] > p['fim']:
                w['start'] = p['fim']
                n += 1
            if w['start'] < p['ini'] and p['ini'] + folga < w['end'] <= p['fim'] + folga:
                w['end'] = p['ini']
                n += 1
    return n


def main(a):
    if len(a) < 2:
        sys.exit(__doc__)
    ws = json.load(open(a[0]))['words']
    fixes = json.load(open(a[a.index('--fix') + 1])) if '--fix' in a else []
    n = encaixar(ws, json.load(open(a[a.index('--pausas') + 1]))['pausas']) if '--pausas' in a else 0
    out = aplicar_fixes(ws, fixes)
    json.dump({'words': out}, open(a[1], 'w'), ensure_ascii=False, indent=1)
    print('ok', a[1], len(out), 'palavras', f'({len(fixes)} correções, {n} limites encaixados nas pausas)')


if __name__ == '__main__':
    main(sys.argv[1:])
