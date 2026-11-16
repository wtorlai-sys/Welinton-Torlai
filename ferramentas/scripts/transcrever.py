#!/usr/bin/env python3
"""Transcreve a narração com faster-whisper (CPU int8, pt, tempo por palavra, sem contexto inicial).

O faster-whisper não abre o MP3 direto nesta máquina (erro do `av`), então o áudio é
convertido antes com ffmpeg para PCM float32 16 kHz mono e passado como array.

Uso: transcrever.py <audio> <saida.json> --modelo medium|large-v3 [--inicio s --fim s]
Saída: {"modelo", "duracao", "segments": [{start,end,text}], "words": [{text,start,end,prob}]}
Com --inicio/--fim transcreve só aquele trecho (tempos devolvidos no relógio do áudio inteiro).
"""
import argparse
import json
import subprocess

import numpy as np

SR = 16000


def pcm(audio, inicio=None, fim=None):
    cmd = ['ffmpeg', '-nostdin', '-v', 'error']
    if inicio is not None:
        cmd += ['-ss', str(inicio)]
    if fim is not None:
        cmd += ['-to', str(fim)] if inicio is None else ['-t', str(fim - inicio)]
    cmd += ['-i', audio, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-']
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('audio')
    ap.add_argument('saida')
    ap.add_argument('--modelo', default='medium')
    ap.add_argument('--inicio', type=float)
    ap.add_argument('--fim', type=float)
    a = ap.parse_args()

    from faster_whisper import WhisperModel
    x = pcm(a.audio, a.inicio, a.fim)
    off = a.inicio or 0.0
    m = WhisperModel(a.modelo, device='cpu', compute_type='int8')
    segs, info = m.transcribe(x, language='pt', word_timestamps=True, initial_prompt=None,
                              condition_on_previous_text=False, beam_size=5)
    out = {'modelo': a.modelo, 'duracao': round(len(x) / SR, 3), 'inicio': off, 'segments': [], 'words': []}
    for s in segs:
        out['segments'].append({'start': round(s.start + off, 3), 'end': round(s.end + off, 3), 'text': s.text.strip()})
        for w in s.words or []:
            out['words'].append({'text': w.word.strip(), 'start': round(w.start + off, 3),
                                 'end': round(w.end + off, 3), 'prob': round(w.probability, 3)})
        print(f"{s.start + off:7.2f} {s.text.strip()}", flush=True)
    json.dump(out, open(a.saida, 'w'), ensure_ascii=False, indent=1)
    print('ok', a.saida, len(out['words']), 'palavras')


if __name__ == '__main__':
    main()
