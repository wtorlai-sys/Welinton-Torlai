#!/usr/bin/env python3
"""Mixa voz + música (ducking pela voz) + sfx → public/<slug>/mix.m4a a -14 LUFS.

Uso: python3 ferramentas/scripts/mixar.py ferramentas/scripts/sfx_<slug>.json
     [--musica-db X] [--sfx-db Y]   (ajuste extra, em dB, sobre os níveis do json)

Níveis (bloco "niveis" do json, em LU relativos à voz): musica_lu (~-18 a -22),
sfx_lu (~-8 a -12). Cada faixa é medida (ebur128) e ajustada para ficar nesse
nível abaixo da voz; a música ainda abaixa sob a voz (sidechain).
Master: loudnorm I=-14, alvo TP=-2 (folga para o AAC ficar ≤ -1,5 dBTP), duas passadas. Base: scripts/mixar.sh.
"""
import argparse
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def lufs(path, extra=''):
    af = (extra + ',' if extra else '') + 'ebur128=framelog=quiet'
    r = subprocess.run(['ffmpeg', '-nostats', '-i', str(path), '-af', af, '-f', 'null', '-'],
                       capture_output=True, text=True)
    m = re.findall(r'I:\s+(-?[\d.]+) LUFS', r.stderr)
    return float(m[-1])


def run(args):
    subprocess.run(args, check=True)


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('cues')
    ap.add_argument('--musica-db', type=float, default=0.0)
    ap.add_argument('--sfx-db', type=float, default=0.0)
    a = ap.parse_args()
    cfg = json.loads(Path(a.cues).read_text())
    pub = ROOT / 'public' / cfg['slug']
    voz, mus, fx = pub / 'narracao.mp3', pub / 'musica.wav', pub / 'sfx.wav'
    nv = cfg.get('niveis', {})
    lv, lm, lf = lufs(voz), lufs(mus), lufs(fx)
    gm = lv + nv.get('musica_lu', -20) - lm + a.musica_db
    gf = lv + nv.get('sfx_lu', -10) - lf + a.sfx_db
    dur = cfg['duracao']
    grafo = (
        f"[0:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,asplit=2[voz][sc];"
        f"[1:a]aformat=sample_fmts=fltp:channel_layouts=stereo,volume={gm:.2f}dB[m];"
        f"[m][sc]sidechaincompress=threshold=0.03:ratio=5:attack=15:release=400:makeup=1[md];"
        f"[2:a]aformat=sample_fmts=fltp:channel_layouts=stereo,volume={gf:.2f}dB[f];"
        f"[voz][md][f]amix=inputs=3:normalize=0:duration=first,atrim=0:{dur}"
    )
    bruto = pub / '_mix_bruto.wav'
    run(['ffmpeg', '-v', 'error', '-y', '-i', str(voz), '-i', str(mus), '-i', str(fx),
         '-filter_complex', grafo, '-c:a', 'pcm_f32le', str(bruto)])
    # loudnorm em duas passadas
    r = subprocess.run(['ffmpeg', '-nostats', '-i', str(bruto), '-af',
                        'loudnorm=I=-14:TP=-2:LRA=11:print_format=json', '-f', 'null', '-'],
                       capture_output=True, text=True)
    j = json.loads(r.stderr[r.stderr.rfind('{'):r.stderr.rfind('}') + 1])
    ln = (f"loudnorm=I=-14:TP=-2:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:"
          f"measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
    out = pub / 'mix.m4a'
    run(['ffmpeg', '-v', 'error', '-y', '-i', str(bruto), '-af', ln + ',aresample=48000',
         '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', str(out)])
    bruto.unlink()
    print(f'voz {lv:.1f} LUFS · música {lm:.1f}→{gm:+.1f} dB · sfx {lf:.1f}→{gf:+.1f} dB')
    print(f'mix {lufs(out):.1f} LUFS → {out}')
