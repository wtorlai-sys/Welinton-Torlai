#!/usr/bin/env python3
"""Gera as legendas em blocos curtos a partir do palavras.json (tempos do medium, texto corrigido).

Regras (edit-preparar):
- "R" "$" "5" ",00" -> "R$ 5"; "recém" "-monetizado" -> uma palavra;
- número + "mil"/"milhão" juntos; "mil visualizações" falado sozinho -> "1.000 visualizações";
- blocos de até 3 palavras, quebrando em pontuação ou pausa > 0,28 s;
- faixa "R$ x e R$ y" fica num bloco só; valor começa bloco novo (salvo depois de "entre"/"a"/"de");
- não termina bloco em palavra fraca (ela abre o próximo); bloco de 1 palavra fraca gruda no seguinte.

Uso: legendas.py <palavras.json> <legendas.json> [--fix fixes.json]
Saída: [{start, end, words: [{text, start, end}]}]
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from palavras import aplicar_fixes  # noqa: E402

PAUSA = 0.28
MAX = 3
WEAK = {'no', 'e', 'de', 'do', 'o', 'um', 'os', 'a', 'as', 'que', 'uma', 'para', 'dos', 'das', 'seu', 'sua',
        'se', 'esse', 'essa', 'em', 'com', 'ou', 'por', 'da', 'na', 'nos', 'nas', 'ao', 'mais', 'muito'}
PONT = r'[.,?!;:…]$'


def tokens(ws):
    toks, i = [], 0
    while i < len(ws):
        w, t = ws[i], ws[i]['text']
        if t == 'R' and i + 2 < len(ws) and ws[i + 1]['text'] == '$':
            num = ws[i + 2]['text'].rstrip('.,?!')
            j, end = i + 3, ws[i + 2]['end']
            if j < len(ws) and re.match(r'^,\d\d[.,?!]?$', ws[j]['text']):
                punct, end = ws[j]['text'][3:], ws[j]['end']
                j += 1
            else:
                punct = ws[i + 2]['text'][len(num):]
            num = re.sub(r',00$', '', num)
            toks.append({'text': f'R$ {num}{punct}', 'start': w['start'], 'end': end})
            i = j
            continue
        if t.startswith('R$') and len(t) > 2 and not t.startswith('R$ '):
            t = 'R$ ' + re.sub(r',00(?=[.,?!]?$)', '', t[2:])
        if t.startswith('-') and toks:
            toks[-1]['text'] += t
            toks[-1]['end'] = w['end']
            i += 1
            continue
        if re.match(r'^\d+$', t) and i + 1 < len(ws) and ws[i + 1]['text'].rstrip('.,?!').lower() in ('mil', 'milhão', 'milhões'):
            toks.append({'text': f"{t} {ws[i + 1]['text']}", 'start': w['start'], 'end': ws[i + 1]['end']})
            i += 2
            continue
        toks.append({'text': t, 'start': w['start'], 'end': w['end']})
        i += 1
    for k, tk in enumerate(toks):
        if tk['text'].lower() == 'mil' and k + 1 < len(toks) and toks[k + 1]['text'].lower().startswith('visualiza'):
            tk['text'] = '1.000'
    return toks


def dinheiro(t):
    return t.startswith('R$') or t.startswith('$')


def blocos(toks):
    chunks, cur = [], []
    for tk in toks:
        if cur:
            prev = cur[-1]
            gap = tk['start'] - prev['end']
            faixa = (dinheiro(prev['text']) and tk['text'] == 'e') or (prev['text'] == 'e' and dinheiro(tk['text']))
            brk = re.search(PONT, prev['text']) or gap > PAUSA or (len(cur) >= MAX and not faixa)
            if dinheiro(tk['text']) and not faixa and prev['text'].lower() not in ('entre', 'a', 'de', 'até'):
                brk = True
            if brk:
                carry = []
                while (len(cur) > 1 and cur[-1]['text'].lower() in WEAK and not re.search(PONT, cur[-1]['text'])
                       and gap <= PAUSA):
                    carry.insert(0, cur.pop())
                chunks.append(cur)
                cur = carry
        cur.append(tk)
    if cur:
        chunks.append(cur)
    merged = []
    for c in chunks:
        if merged and len(merged[-1]) == 1 and merged[-1][0]['text'].lower() in WEAK and len(c) <= MAX:
            c = merged.pop() + c
        merged.append(c)
    return merged


def main(a):
    if len(a) < 2:
        sys.exit(__doc__)
    ws = json.load(open(a[0]))['words']
    if '--fix' in a:
        ws = aplicar_fixes(ws, json.load(open(a[a.index('--fix') + 1])))
    out = []
    for c in blocos(tokens(ws)):
        out.append({'start': round(c[0]['start'], 3), 'end': round(c[-1]['end'], 3),
                    'words': [{'text': re.sub(r'[,.;:!…]+$', '', x['text']), 'start': round(x['start'], 3),
                               'end': round(x['end'], 3)} for x in c]})
    json.dump(out, open(a[1], 'w'), ensure_ascii=False, indent=1)
    for c in out:
        print(f"{c['start']:6.2f} | " + ' '.join(w['text'] for w in c['words']))
    print('ok', a[1], len(out), 'blocos')


if __name__ == '__main__':
    main(sys.argv[1:])
