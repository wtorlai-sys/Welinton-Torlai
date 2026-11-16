#!/usr/bin/env python3
"""Confere a transcrição de uma narração.

1. Números/valores: compara o texto do medium com o do large-v3 (alinhamento por palavras).
   Divergência que envolve número ou valor = lista para Welinton conferir.
2. Tempo: ataques de fala depois de silêncios (energia RMS, janela 10 ms, limiar ~38 dB abaixo
   do pico) × início das frases do medium; desvio > 0,15 s = alerta.
3. Engolidos: trecho com energia (>= 0,25 s) e sem nenhuma palavra = alerta (retranscrever só ele).
4. Pausas: silêncios > 0,3 s.

Uso: conferir_transcricao.py <audio> <medium.json> <large-v3.json> <relatorio.json>
"""
import difflib
import json
import re
import subprocess
import sys

import numpy as np

SR = 16000
JAN = 0.010
LIMIAR_DB = 38
PAUSA_MIN = 0.30
DESVIO_MAX = 0.15
NUM_PAL = {'um', 'uma', 'dois', 'duas', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez',
           'vinte', 'trinta', 'cinquenta', 'cem', 'cento', 'quinhentos', 'mil', 'milhão', 'milhões',
           'reais', 'real', 'dólar', 'dólares', 'centavos', 'r$', 'r', '$'}


def norm(t):
    return re.sub(r'[^\wà-úç$]', '', t.lower())


def tem_numero(toks):
    return any(re.search(r'\d', t) or norm(t) in NUM_PAL for t in toks)


def energia(audio):
    x = np.frombuffer(subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', audio, '-ac', '1', '-ar', str(SR),
                                      '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32)
    n = int(SR * JAN)
    q = len(x) // n
    rms = np.sqrt(np.mean(x[:q * n].reshape(q, n) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms)
    return db, db > db.max() - LIMIAR_DB


def regioes(ativo, valor):
    """[(ini, fim)] em segundos das sequências em que ativo == valor."""
    out, ini = [], None
    for i, a in enumerate(ativo):
        if a == valor and ini is None:
            ini = i
        elif a != valor and ini is not None:
            out.append((ini * JAN, i * JAN))
            ini = None
    if ini is not None:
        out.append((ini * JAN, len(ativo) * JAN))
    return out


def main(audio, f_med, f_lg, f_rel):
    med = json.load(open(f_med))['words']
    lg = json.load(open(f_lg))['words']
    rel = {'numeros': [], 'tempo': [], 'engolidos': [], 'pausas': []}

    # 1. números
    a = [norm(w['text']) for w in med]
    b = [norm(w['text']) for w in lg]
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == 'equal':
            continue
        tm = [w['text'] for w in med[i1:i2]]
        tl = [w['text'] for w in lg[j1:j2]]
        ref = med[i1] if i1 < i2 else (med[i1 - 1] if i1 else lg[j1])
        item = {'t': ref['start'], 'medium': ' '.join(tm), 'large': ' '.join(tl),
                'numero': tem_numero(tm + tl)}
        rel['numeros'].append(item)

    # 2-4. energia
    db, ativo = energia(audio)
    silencios = [(s, e) for s, e in regioes(ativo, False) if e - s >= PAUSA_MIN]
    rel['pausas'] = [{'ini': round(s, 2), 'fim': round(e, 2), 'dur': round(e - s, 2)} for s, e in silencios]
    inicios = [med[0]['start']] + [w['start'] for p, w in zip(med, med[1:]) if w['start'] - p['end'] > 0.25]
    for s, e in silencios:
        if e >= len(ativo) * JAN - 0.05:
            continue
        perto = min(inicios + [w['start'] for w in med], key=lambda t: abs(t - e))
        d = perto - e
        if abs(d) > DESVIO_MAX:
            rel['tempo'].append({'ataque': round(e, 2), 'palavra': round(perto, 2), 'desvio': round(d, 2)})
    for s, e in regioes(ativo, True):
        if e - s < 0.25:
            continue
        if not any(w['start'] < e and w['end'] > s for w in med):
            rel['engolidos'].append({'ini': round(s, 2), 'fim': round(e, 2)})

    json.dump(rel, open(f_rel, 'w'), ensure_ascii=False, indent=1)
    print('== divergências medium × large-v3 (* = número/valor)')
    for it in rel['numeros']:
        print(f"{'*' if it['numero'] else ' '} {it['t']:6.2f}  medium: {it['medium']!r:40}  large: {it['large']!r}")
    print(f"== ataques fora do início de palavra (> {DESVIO_MAX} s): {len(rel['tempo'])}")
    for it in rel['tempo']:
        print(f"   ataque {it['ataque']:6.2f}  palavra {it['palavra']:6.2f}  desvio {it['desvio']:+.2f}")
    print(f"== trechos com voz e sem palavra: {len(rel['engolidos'])}")
    for it in rel['engolidos']:
        print(f"   {it['ini']:6.2f}–{it['fim']:6.2f}")
    print(f"== pausas > {PAUSA_MIN} s: {len(rel['pausas'])}")


if __name__ == '__main__':
    if len(sys.argv) != 5:
        sys.exit(__doc__)
    main(*sys.argv[1:])
