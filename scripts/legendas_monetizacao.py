"""Gera as legendas (blocos curtos) do episódio "Monetização" a partir dos timestamps
word-level do Whisper (public/timestamps/monetizacao.json, modelo medium: os tempos batem
com os ataques de energia do áudio). Corrige números que o Whisper escreveu errado
(conferidos com o modelo large-v3) e junta "R $ 5 ,00" em "R$ 5".

Uso: python3 scripts/legendas_monetizacao.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
words = json.load(open(ROOT / 'public/timestamps/monetizacao.json'))['words']

# Correções manuais (texto conferido com o large-v3; tempos do medium / ataques do áudio)
FIX = [
    # (início, fim, tokens) — substitui as palavras com start em [início, fim)
    (41.5, 42.5, [('R$ 10', 41.58, 41.9), ('e', 41.92, 42.05), ('R$ 50', 42.08, 42.8)]),
    (47.1, 48.0, [('R$ 500', 47.16, 47.9)]),
    (53.5, 55.0, [('R$ 1.000', 53.4, 53.8), ('e', 53.85, 54.05), ('R$ 5.000', 54.1, 55.0)]),
]


def apply_fixes(ws):
    out = []
    for w in ws:
        hit = next((f for f in FIX if f[0] <= w['start'] < f[1]), None)
        if hit:
            if not hit[2] is None:
                out.extend({'text': t, 'start': s, 'end': e} for t, s, e in hit[2])
                hit[2].clear()  # só insere uma vez
            continue
        out.append(dict(w))
    return out


ws = apply_fixes(words)

# Junta "R" "$" "5" ",00" -> "R$ 5"; "recém" "-monetizado"; número + "mil"/"milhão"
toks = []
i = 0
while i < len(ws):
    w = ws[i]
    t = w['text']
    if t == 'R' and i + 2 < len(ws) and ws[i + 1]['text'] == '$':
        num = ws[i + 2]['text'].rstrip('.,')
        j = i + 3
        end = ws[i + 2]['end']
        if j < len(ws) and re.match(r'^,\d\d[.,?]?$', ws[j]['text']):
            punct = ws[j]['text'][3:]
            end = ws[j]['end']
            j += 1
        else:
            punct = ws[i + 2]['text'][len(num):]
        toks.append({'text': f'R$ {num}{punct}', 'start': w['start'], 'end': end})
        i = j
        continue
    if t.startswith('-') and toks:
        toks[-1]['text'] += t
        toks[-1]['end'] = w['end']
        i += 1
        continue
    if re.match(r'^\d+$', t) and i + 1 < len(ws) and ws[i + 1]['text'].rstrip('.,?').lower() in ('mil', 'milhão'):
        toks.append({'text': f"{t} {ws[i + 1]['text']}", 'start': w['start'], 'end': ws[i + 1]['end']})
        i += 2
        continue
    toks.append({'text': t, 'start': w['start'], 'end': w['end']})
    i += 1

# "mil visualizações" falado sozinho -> 1.000
for k, tk in enumerate(toks):
    if tk['text'].lower() == 'mil' and k + 1 < len(toks) and toks[k + 1]['text'].lower().startswith('visualiza'):
        tk['text'] = '1.000'


def is_money(t):
    return t.startswith('R$')


WEAK = {'no', 'e', 'de', 'do', 'o', 'um', 'os', 'a', 'que', 'uma', 'para', 'dos', 'seu', 'se', 'esse', 'em', 'com', 'ou', 'por', 'da', 'na'}

# Blocos: quebra em pontuação, pausa > 0,28 s ou 3 palavras (faixas "R$ x e R$ y" ficam juntas)
chunks = []
cur = []
for k, tk in enumerate(toks):
    if cur:
        prev = cur[-1]
        gap = tk['start'] - prev['end']
        in_range = is_money(prev['text']) and tk['text'] == 'e' or (prev['text'] == 'e' and is_money(tk['text']))
        brk = re.search(r'[.,?!]$', prev['text']) or gap > 0.28 or (len(cur) >= 3 and not in_range)
        if is_money(tk['text']) and not in_range and not (prev['text'].lower() in ('entre', 'a', 'de')):
            brk = True
        if brk:
            carry = []
            # não termina bloco em palavra fraca ("no", "e", "de"...): ela abre o próximo
            while len(cur) > 1 and cur[-1]['text'].lower() in WEAK and not re.search(r'[.,?!]$', cur[-1]['text']) and gap <= 0.28:
                carry.insert(0, cur.pop())
            chunks.append(cur)
            cur = carry
    cur.append(tk)
if cur:
    chunks.append(cur)

# bloco de 1 palavra fraca ("E", "do") gruda no seguinte
merged = []
for c in chunks:
    if merged and len(merged[-1]) == 1 and merged[-1][0]['text'].lower() in WEAK and len(c) <= 3:
        c = merged.pop() + c
    merged.append(c)
chunks = merged

out = []
for c in chunks:
    out.append({'start': c[0]['start'], 'end': c[-1]['end'], 'words': [{'text': re.sub(r'[,.;:!]+$', '', x['text']), 'start': round(x['start'], 3), 'end': round(x['end'], 3)} for x in c]})
json.dump(out, open(ROOT / 'public/timestamps/monetizacao-legendas.json', 'w'), ensure_ascii=False, indent=1)
for c in out:
    print(f"{c['start']:6.2f} | " + ' '.join(w['text'] for w in c['words']))
